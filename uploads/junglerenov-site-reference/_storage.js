/* RénoFacile — Couche d'accès aux données
   ─────────────────────────────────────────
   Toutes les pages (site, admin, super admin) passent par ce module pour
   lire/écrire les données. Aujourd'hui, l'implémentation est en localStorage
   (mono-navigateur, démo). Demain, il suffira de réécrire ce fichier pour
   pointer vers Supabase ou n'importe quel backend — sans toucher aux pages.

   API publique (toutes les fonctions retournent des Promises, ready pour async) :

     Auth
       login(email, password)        → { user, role } | throws
       logout()                      → void
       getCurrentUser()              → { id, email, role, ... } | null
       isAdmin()                     → boolean
       isSuperAdmin()                → boolean

     Clients
       listClients()                 → [{ id, email, firstname, ... }]
       getClient(id)                 → { id, ... } | null
       saveClient(client)            → client (avec id)
       deleteClient(id)              → void

     Documents (rattachés à un client)
       listDocuments(clientId)       → [{ id, type, code, statut, ... }]
       saveDocument(doc)             → doc (avec id)
       deleteDocument(id)            → void
       setDocumentStatus(id, status) → void

     Admins (gérés par le super admin)
       listAdmins()                  → [{ id, email, role }]
       addAdmin(email, role)         → admin
       removeAdmin(id)               → void

     Stats (calculées à la volée)
       getStats()                    → { totalClients, activeClients, caCumule, dossiersActifs, ... }

     Audit log
       logAction(action, details)    → void
       getAuditLog()                 → [{ timestamp, admin, action, ... }]
*/

(function (global) {
  'use strict';

  // ─── Modèle économique : rémunération B2B, jamais le particulier ───
  // Le site n'a aucun rôle transactionnel côté particulier. RénoFacile est
  // rémunéré par le professionnel agréé qui reprend le dossier transmis,
  // hors du site. Ce barème ne sert qu'à l'export mensuel du back-office.
  /* Barème contractuel B2B, en euros HT par dossier transmis.
     SOURCE : documents « La solution RénoFacile » 2027 et 2028.
     - energetique (rénovation d'ampleur, MAR) : 290 € — source ferme
     - autonomie   (rénovation par geste, AMO) : 190 € — source ferme
     - indigne     (habitat dégradé, opérateur agréé) : À CONFIRMER, ce segment
       n'est chiffré dans aucun des deux documents. La valeur ci-dessous est un
       alignement provisoire sur le tarif ampleur, pas un montant arrêté. */
  const REMUNERATION_HT = { energetique: 290, autonomie: 190, indigne: 290 };
  const REMUNERATION_A_CONFIRMER = ['indigne'];
  function remunerationHT(type){
    return REMUNERATION_HT[type] || REMUNERATION_HT.energetique;
  }
  const DEVISE       = 'EUR';
  const PANIER_LABEL = 'Accompagnement complet · un dossier';
  const PANIER_INCLUDES = [
    'Diagnostic personnalisé approfondi',
    'Calcul cumulé MPR + CEE + éco-PTZ + TVA + aides locales',
    'Génération PDF Cerfa officiels signés (dossier éco-PTZ, attestation TVA 5,5 %)',
    'Wizard de dépôt guidé (création compte MPR, désignation mandataire, upload pièces)',
    "Suivi complet jusqu'au versement de vos aides",
    'Annuaire artisans RGE avec filtres et favoris',
    'Support email 72 h à chaque étape',
  ];

  // Schéma client V1 :
  // { id, email, firstname, lastname, createdAt,
  //   dossiers: [{ id, nomLogement, adresseLogement, createdAt, transmisLe,
  //                partenaire, statutDossier, status, aides, travaux }] }

  const KEYS = {
    SESSION:    'renofacile.session',
    CLIENTS:    'renofacile.clients',
    DOCUMENTS:  'renofacile.documents',
    ADMINS:     'renofacile.admins',
    AUDIT:      'renofacile.audit_log',
    LEGACY_PROFILE: 'renofacile.profile',  // l'ancien profil monoutilisateur du diagnostic
  };

  /* SÉCURITÉ — aucun compte administrateur n'est créé côté client, en aucun
     environnement. Les comptes réels seront créés côté serveur, mots de passe
     hachés (bcrypt + sel). Aucune page ne doit réintroduire d'identifiant dans
     son HTML : il serait lisible en « voir la source », même masqué à l'écran. */
  const DEFAULT_ADMINS = [];

  /* ─── Statuts du dossier client ───────────────────────────────────────────
     Le cycle de vie administratif, du premier diagnostic au versement. Sert
     aux filtres de la console, aux pastilles et à l'historique de suivi. */
  const DOSSIER_STATUSES = [
    { key: 'nouveau',     label: 'Nouveau',             color: '#475569', bg: '#F1F5F9', help: 'Compte créé, dossier pas encore instruit par nos équipes.' },
    { key: 'a_traiter',   label: 'À traiter',           color: '#B45309', bg: '#FEF3C7', help: 'Dossier transmis, en attente de prise en charge.' },
    { key: 'en_cours',    label: 'En cours de montage', color: '#0F766E', bg: '#CCFBF1', help: 'Pièces en cours de collecte et de vérification.' },
    { key: 'depose',      label: 'Déposé',              color: '#6D28D9', bg: '#EDE9FE', help: 'Dossier déposé auprès de l\u2019Anah ou de l\u2019obligé.' },
    { key: 'instruction', label: 'En instruction',      color: '#1D4ED8', bg: '#DBEAFE', help: 'Instruction en cours côté organisme financeur.' },
    { key: 'accepte',     label: 'Accepté',             color: '#047857', bg: '#D1FAE5', help: 'Accord reçu, aide débloquée ou versement programmé.' },
    { key: 'verse',       label: 'Versé',               color: '#065F46', bg: '#A7F3D0', help: 'Aides versées au bénéficiaire. Dossier clos.' },
    { key: 'refuse',      label: 'Refusé',              color: '#B91C1C', bg: '#FEE2E2', help: 'Demande rejetée. Motif à consigner dans la note.' },
    { key: 'abandonne',   label: 'Abandonné',           color: '#64748B', bg: '#F1F5F9', help: 'Projet abandonné par le bénéficiaire.' },
  ];

  function getStatusMeta(key) {
    return DOSSIER_STATUSES.find(s => s.key === key) || DOSSIER_STATUSES[0];
  }

  /* ─── Accès au stockage ───────────────────────────────────────────────────
     Toute lecture et toute écriture passent par ces deux fonctions : le jour
     où le stockage devient une API, il n'y a qu'ici à réécrire. */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  function init() {
    if (!localStorage.getItem(KEYS.ADMINS)) {
      write(KEYS.ADMINS, DEFAULT_ADMINS);
    }
    // Si un ancien profil mono-utilisateur existe (du diagnostic), on le
    // convertit en client de la base partagée pour qu'il apparaisse dans l'admin.
    migrateLegacyProfile();
    // Migration : tout client sans dossierStatus reçoit 'nouveau' par défaut.
    migrateDossierStatus();
  }

  function migrateDossierStatus() {
    const clients = read(KEYS.CLIENTS, []);
    let changed = false;
    clients.forEach(c => {
      if (!c.dossierStatus) {
        c.dossierStatus = 'nouveau';
        c.dossierStatusHistory = c.dossierStatusHistory || [{
          at: c.createdAt || new Date().toISOString(),
          from: null, to: 'nouveau', by: 'system', note: 'État initial à la création du compte.',
        }];
        changed = true;
      }
    });
    if (changed) write(KEYS.CLIENTS, clients);
  }

  function migrateLegacyProfile() {
    const legacy = read(KEYS.LEGACY_PROFILE, null);
    if (!legacy || !legacy.email) return;
    const clients = read(KEYS.CLIENTS, []);
    if (clients.find(c => c.email === legacy.email)) return; // déjà migré
    const id = uid('client');
    clients.push({
      id,
      email: legacy.email,
      firstname: legacy.firstname || '',
      lastname: legacy.lastname || '',
      tier: legacy.tier || 'essentiel',
      address: legacy.address || '',
      logement: legacy.logement || {},
      situation: legacy.situation || {},
      foyer: legacy.foyer || {},
      aids: legacy.aids || {},
      createdAt: legacy.createdAt || new Date().toISOString(),
      diagnostiqueLe: legacy.diagnostiqueLe || null,
      status: 'actif',
    });
    write(KEYS.CLIENTS, clients);
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────
  async function login(email, password) {
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!email || !password) throw new Error('Email et mot de passe requis.');

    // Test admins d'abord
    const admins = read(KEYS.ADMINS, []);
    const admin = admins.find(a => a.email.toLowerCase() === email && a.password === password);
    if (admin) {
      const session = { id: admin.id, email: admin.email, role: admin.role, loggedAt: Date.now() };
      write(KEYS.SESSION, session);
      logAction('login_admin', { email });
      return { user: session, role: admin.role };
    }

    // Test clients
    const clients = read(KEYS.CLIENTS, []);
    const client = clients.find(c => c.email && c.email.toLowerCase() === email);
    if (client) {
      // Aucun accès par ce chemin tant que la vérification bcrypt côté
      // serveur n'est pas branchée — sans exception d'environnement.
      throw new Error("La connexion par mot de passe n'est pas encore disponible. Utilisez le lien envoyé par email.");
    }

    throw new Error('Email ou mot de passe incorrect.');
  }

  function logout() {
    const session = read(KEYS.SESSION, null);
    if (session && (session.role === 'admin' || session.role === 'super_admin')) {
      logAction('logout_admin', { email: session.email });
    }
    localStorage.removeItem(KEYS.SESSION);
  }

  function getCurrentUser() {
    return read(KEYS.SESSION, null);
  }

  function isAdmin() {
    const u = getCurrentUser();
    return u && (u.role === 'admin' || u.role === 'super_admin');
  }

  function isSuperAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'super_admin';
  }

  function requireAuth(redirectIfNotLogged) {
    const u = getCurrentUser();
    if (!u) {
      if (redirectIfNotLogged) window.location.href = redirectIfNotLogged;
      return null;
    }
    return u;
  }

  function requireAdmin(redirectIfNotAdmin) {
    if (!isAdmin()) {
      if (redirectIfNotAdmin) window.location.href = redirectIfNotAdmin;
      return false;
    }
    return true;
  }

  // ─── Clients ───────────────────────────────────────────────────────────────
  async function listClients() {
    return read(KEYS.CLIENTS, []);
  }

  async function getClient(id) {
    const clients = read(KEYS.CLIENTS, []);
    return clients.find(c => c.id === id) || null;
  }

  async function getClientByEmail(email) {
    const clients = read(KEYS.CLIENTS, []);
    return clients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async function saveClient(client) {
    const clients = read(KEYS.CLIENTS, []);
    if (!client.id) {
      client.id = uid('client');
      client.createdAt = new Date().toISOString();
      client.status = client.status || 'actif';
      clients.push(client);
    } else {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx >= 0) clients[idx] = { ...clients[idx], ...client, updatedAt: new Date().toISOString() };
      else clients.push(client);
    }
    write(KEYS.CLIENTS, clients);
    return client;
  }

  async function deleteClient(id) {
    const clients = read(KEYS.CLIENTS, []).filter(c => c.id !== id);
    write(KEYS.CLIENTS, clients);
    // Supprime aussi les documents associés
    const docs = read(KEYS.DOCUMENTS, []).filter(d => d.clientId !== id);
    write(KEYS.DOCUMENTS, docs);
    logAction('delete_client', { clientId: id });
  }

  // ─── Documents ─────────────────────────────────────────────────────────────
  async function listDocuments(clientId) {
    const docs = read(KEYS.DOCUMENTS, []);
    return clientId ? docs.filter(d => d.clientId === clientId) : docs;
  }

  async function saveDocument(doc) {
    const docs = read(KEYS.DOCUMENTS, []);
    if (!doc.id) {
      doc.id = uid('doc');
      doc.createdAt = new Date().toISOString();
      docs.push(doc);
    } else {
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx >= 0) docs[idx] = { ...docs[idx], ...doc, updatedAt: new Date().toISOString() };
      else docs.push(doc);
    }
    write(KEYS.DOCUMENTS, docs);
    return doc;
  }

  async function deleteDocument(id) {
    const docs = read(KEYS.DOCUMENTS, []).filter(d => d.id !== id);
    write(KEYS.DOCUMENTS, docs);
    logAction('delete_document', { documentId: id });
  }

  // ─── Statut dossier client (workflow MPR/CEE) ─────────────────────────────
  async function updateDossierStatus(clientId, newStatus, note) {
    if (!DOSSIER_STATUSES.find(s => s.key === newStatus)) {
      throw new Error('Statut inconnu : ' + newStatus);
    }
    const clients = read(KEYS.CLIENTS, []);
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx < 0) throw new Error('Client introuvable : ' + clientId);
    const before = clients[idx].dossierStatus || 'nouveau';
    if (before === newStatus && !note) return clients[idx]; // pas de changement
    const session = read(KEYS.SESSION, null);
    const history = clients[idx].dossierStatusHistory || [];
    history.unshift({
      at:   new Date().toISOString(),
      from: before,
      to:   newStatus,
      by:   session ? session.email : 'system',
      note: note || null,
    });
    clients[idx] = {
      ...clients[idx],
      dossierStatus: newStatus,
      dossierStatusHistory: history.slice(0, 100),
      updatedAt: new Date().toISOString(),
    };
    write(KEYS.CLIENTS, clients);
    logAction('dossier_status_change', { clientId, from: before, to: newStatus, note: note || null });
    return clients[idx];
  }

  async function countByDossierStatus() {
    const clients = read(KEYS.CLIENTS, []);
    const counts = { _total: clients.length };
    DOSSIER_STATUSES.forEach(s => { counts[s.key] = 0; });
    clients.forEach(c => {
      const k = c.dossierStatus || 'nouveau';
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }

  async function setDocumentStatus(id, statut) {
    const docs = read(KEYS.DOCUMENTS, []);
    const idx = docs.findIndex(d => d.id === id);
    if (idx >= 0) {
      docs[idx].statut = statut;
      docs[idx].updatedAt = new Date().toISOString();
      write(KEYS.DOCUMENTS, docs);
      logAction('change_doc_status', { documentId: id, newStatus: statut });
    }
  }

  // ─── Admins ────────────────────────────────────────────────────────────────
  async function listAdmins() {
    return read(KEYS.ADMINS, []).map(a => ({ id: a.id, email: a.email, role: a.role }));
  }

  async function addAdmin(email, role) {
    role = role === 'super_admin' ? 'super_admin' : 'admin';
    const admins = read(KEYS.ADMINS, []);
    if (admins.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Un admin avec cet email existe déjà.');
    }
    const a = { id: uid('admin'), email: email.toLowerCase(), password: 'change-me', role };
    admins.push(a);
    write(KEYS.ADMINS, admins);
    logAction('add_admin', { email, role });
    return { id: a.id, email: a.email, role: a.role };
  }

  async function removeAdmin(id) {
    const admins = read(KEYS.ADMINS, []).filter(a => a.id !== id);
    write(KEYS.ADMINS, admins);
    logAction('remove_admin', { adminId: id });
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async function getStats() {
    const clients = read(KEYS.CLIENTS, []);
    const docs = read(KEYS.DOCUMENTS, []);
    // Revenu = dossiers transmis × barème contractuel du professionnel (B2B).
    const allDossiers = clients.flatMap(c => Array.isArray(c.dossiers) ? c.dossiers : []);
    const dossiersTransmis = allDossiers.filter(d => d.transmisLe);
    const revenuHT = dossiersTransmis.reduce((s, d) => s + remunerationHT(d.type || d.parcours), 0);
    const dossiersActifs = allDossiers.filter(d => d.status && d.status !== 'verse').length;
    const dossiersVerses = allDossiers.filter(d => d.statutDossier === 'verse' || d.status === 'verse').length;
    const revenuMoyen = dossiersTransmis.length ? Math.round(revenuHT / dossiersTransmis.length) : remunerationHT('energetique');
    const actifs = clients.filter(c => c.status === 'actif');
    const totalAides = clients.reduce((s, c) => s + ((c.aids && c.aids.totalAides) || 0), 0);
    return {
      totalClients: clients.length,
      activeClients: actifs.length,
      revenuHT,
      dossiersActifs,
      dossiersVerses,
      dossiersTransmis: dossiersTransmis.length,
      revenuMoyen,
      baremeHT: { energetique: remunerationHT('energetique'), autonomie: remunerationHT('autonomie'), indigne: remunerationHT('indigne') },
      baremeAConfirmer: REMUNERATION_A_CONFIRMER,
      totalAides,
      totalDocuments: docs.length,
      documentsAFournir: docs.filter(d => d.statut === 'a_fournir').length,
      documentsValides:  docs.filter(d => d.statut === 'valide').length,
    };
  }

  // ─── Audit log ─────────────────────────────────────────────────────────────
  function logAction(action, details) {
    const session = read(KEYS.SESSION, null);
    const entry = {
      timestamp: new Date().toISOString(),
      admin: session ? session.email : 'system',
      action,
      details: details || {},
    };
    const log = read(KEYS.AUDIT, []);
    log.unshift(entry); // plus récent en premier
    write(KEYS.AUDIT, log.slice(0, 500)); // garde max 500 dernières actions
  }

  async function getAuditLog(limit) {
    const log = read(KEYS.AUDIT, []);
    return limit ? log.slice(0, limit) : log;
  }

  // ─── API publique ──────────────────────────────────────────────────────────
  init();

  global.RFStore = {
    // Auth
    // Barème B2B — source unique, lue par la console partenaires
    REMUNERATION_HT, REMUNERATION_A_CONFIRMER,
    login, logout, getCurrentUser, isAdmin, isSuperAdmin,
    requireAuth, requireAdmin,
    // Clients
    listClients, getClient, getClientByEmail, saveClient, deleteClient,
    // Workflow dossier
    DOSSIER_STATUSES, getStatusMeta, updateDossierStatus, countByDossierStatus,
    // Documents
    listDocuments, saveDocument, deleteDocument, setDocumentStatus,
    // Admins
    listAdmins, addAdmin, removeAdmin,
    // Stats & audit
    getStats, logAction, getAuditLog,
  };
})(window);
