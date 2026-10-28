/* ══════════════════════════════════════════════════════════════════
   JungleRenov — Gestion multi-dossiers

   Un utilisateur peut avoir 1 à N dossiers actifs. Chaque dossier :
     - id        : identifiant unique
     - type      : 'energetique' | 'autonomie' | 'indigne'
     - status    : 'brouillon' | 'transmis'  (dérivé de transmisLe)
     - statutDossier : 'brouillon' | 'complet' | 'transmis' | 'pris_en_charge'
                       | 'depose' | 'instruit' | 'verse'  — pilote le parcours
     - transmisLe : date ISO de la transmission au partenaire habilité
     - partenaire : { id, nom, role, departement } — qui a repris le dossier
     - profile   : instantané des données saisies dans le tunnel
     - result    : résultat du calcul RFCompute

   IMPORTANT — ordre de chargement sur les pages protégées :
     _storage.js  →  _dossiers.js  →  _auth_guard.js
   Le guard interroge RFDossiers pour statuer sur l'accès.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'junglerenov.dossiers';
  var TYPES = ['energetique', 'autonomie', 'indigne'];

  var META = {
    energetique: { titre: 'Rénovation énergétique', court: 'Énergétique', color: '#1F6B3F', detail: 'mes-aides.dc.html' },
    autonomie:   { titre: "Adaptation à l'autonomie", court: 'Autonomie', color: '#123A2E', detail: 'mes-aides.dc.html' },
    indigne:     { titre: 'Habitat dégradé', court: 'Habitat dégradé', color: '#123A2E', detail: 'mes-aides.dc.html' },
  };

  function loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveAll(dossiers) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers || [])); }
    catch (_) {}
  }

  function generateId() {
    return 'dossier_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Un dossier vit tant que le projet vit : aucune échéance, aucune
     expiration. Seule la transmission le fait sortir de l'état brouillon. */
  function computeStatus(dossier) {
    return (dossier && dossier.transmisLe) ? 'transmis' : 'brouillon';
  }

  /* Le champ `profile` n'a pas de schéma strict. Il peut contenir :
       - logement  : { adresse, codePostal, ville, dept, codeInsee, region,
                       surface, annee, type, dpeAvant?, dpeApres? }
       - foyer     : { rfr, parts, region }
       - situation : { statut, ownerType?, bailleurCase? }
       - travaux   : [codes gestes énergétiques, ou codes MPA / LHI]
       - les champs propres au type de dossier (age, gir, handicap, etatLogement…) */
  function createDossier(type, profile, result) {
    if (TYPES.indexOf(type) === -1) throw new Error('Type de dossier invalide : ' + type);
    var dossier = {
      id: generateId(),
      type: type,
      createdAt: new Date().toISOString(),
      transmisLe: null,
      partenaire: null,
      statutDossier: 'brouillon',
      status: 'brouillon',
      profile: profile || {},
      result: result || null,
    };
    // Suivi du dossier : la promesse d'accompagnement jusqu'au versement.
    dossier.suivi = {
      etape: 'reservation',
      progressionPct: 5,
      documents: [],
      historique: [
        { date: dossier.createdAt, etape: 'reservation', libelle: 'Dossier créé' },
      ],
    };
    var all = loadAll();
    all.push(dossier);
    saveAll(all);
    return dossier;
  }

  /* ─── Parcours administratif par type de dossier ──────────────────
     Sert à la timeline des pages de suivi et à la progression des cards. */
  var TIMELINES = {
    energetique: [
      { key: 'reservation', libelle: 'Dossier créé', court: 'Dossier', pct: 5, auto: true,
        action: "Prendre rendez-vous avec un conseiller France Rénov'",
        description: "Votre simulation est complétée et vos aides sont estimées." },
      { key: 'rdv_mar', libelle: "Prendre RDV avec un conseiller France Rénov'", court: 'RDV', pct: 15,
        action: "Faire réaliser l'audit énergétique", delai: '15 jours', duree: '~15 min',
        cta: 'Appeler le 0 808 800 700', href: 'tel:0808800700',
        description: "Gratuit et sans engagement. Obligatoire pour un dossier MaPrimeRénov' Ampleur.",
        tips: ["Votre dernier avis d'imposition à portée de main",
               "Le numéro de votre dossier JungleRenov (dans votre email de confirmation)",
               "Notez la référence que le conseiller vous communiquera"] },
      { key: 'audit', libelle: "Faire réaliser l'audit énergétique", court: 'Audit', pct: 30,
        action: 'Réunir les devis de professionnels RGE', delai: '30 jours', duree: '2 h de visite',
        cta: "Créer mon compte MaPrimeRénov'", href: 'https://monprojet.anah.gouv.fr',
        description: "L'audit chiffre le gain de classes DPE. Créez en parallèle votre compte Anah via FranceConnect+.",
        tips: ["Choisissez un auditeur certifié RGE Étude",
               "Créez votre compte Anah pendant ce temps : 5 minutes via FranceConnect+",
               "Demandez le rapport au format PDF, il sera à joindre au dossier"] },
      { key: 'montage', libelle: 'Sélectionner 3 artisans RGE et monter le dossier', court: 'Artisans', pct: 45,
        action: 'Déposer la demande en ligne', delai: '30 jours', duree: '2 à 3 semaines',
        cta: "Ouvrir l'annuaire artisans", href: 'annuaire-artisans.dc.html',
        description: 'Comparez les devis, puis signez celui que vous retenez — sans le payer, sinon le dossier Anah est refusé.',
        tips: ["Vérifiez que la certification RGE est active à la date des travaux",
               "Trois devis comparables : même surface, même matériau, même performance",
               "Le devis doit mentionner la prime CEE si vous la mobilisez"] },
      { key: 'depot', libelle: 'Déposer le dossier sur monprojet.anah.gouv.fr', court: 'Dépôt', pct: 55,
        action: "Attendre l'instruction de l'Anah", duree: '~30 min',
        cta: 'Générer mon dossier PDF', href: 'mes-documents.dc.html',
        description: 'Dossier pré-rempli par JungleRenov, prêt à téléverser sur le portail Anah.',
        tips: ["Téléversez le devis signé, pas la facture",
               "Photos AVANT travaux : prenez-les maintenant, elles seront exigées",
               "Conservez le numéro de dossier Anah affiché à la fin du dépôt"] },
      { key: 'instruction', libelle: "Instruction par l'Anah", court: 'Instruction', pct: 70,
        action: 'Répondre aux demandes de compléments', duree: '4 à 8 semaines',
        description: "L'Anah peut demander des pièces complémentaires : répondez vite, le délai repart à zéro.",
        tips: ["Surveillez vos emails et votre espace Anah",
               "Ne démarrez aucun travaux pendant l'instruction"] },
      { key: 'acceptation', libelle: "Recevoir la notification d'octroi", court: 'Octroi', pct: 80,
        action: 'Lancer les travaux',
        description: "Ne démarrez jamais les travaux avant cette notification : l'aide serait définitivement perdue.",
        tips: ["Vérifiez le montant accordé et la liste des travaux retenus",
               "Prévenez vos artisans du feu vert"] },
      { key: 'travaux', libelle: 'Réaliser les travaux', court: 'Travaux', pct: 90,
        action: 'Transmettre les factures', duree: '1 à 6 mois',
        description: 'Conservez photos avant / après et factures détaillées : elles conditionnent le versement.',
        tips: ["Facture détaillée par geste, avec la mention RGE",
               "Photos après travaux sous le même angle que les photos avant"] },
      { key: 'versement', libelle: 'Recevoir le versement de vos aides', court: 'Versement', pct: 100, action: null,
        duree: '30 à 90 jours',
        description: 'Sous 30 à 90 jours après la facture finale et les photos après travaux.' },
    ],
    autonomie: [
      { key: 'reservation', libelle: 'Dossier créé', court: 'Dossier', pct: 5, auto: true,
        action: 'Prendre rendez-vous avec un opérateur AMO habilité',
        description: "Votre éligibilité MaPrimeAdapt' est validée." },
      { key: 'rdv_amo', libelle: 'Contacter votre opérateur AMO habilité Anah', court: 'AMO', pct: 20,
        action: 'Faire établir le diagnostic du logement', delai: '15 jours', duree: '~10 min',
        cta: 'Trouver mon AMO', href: 'https://france-renov.gouv.fr/mon-accompagnateur-renov',
        description: "L'opérateur AMO pilote tout le dossier. Son coût est pris en charge à 100 % par l'Anah.",
        tips: ["Vous pouvez aussi appeler France Rénov' au 0 808 800 700",
               "Précisez votre âge ou votre GIR : cela conditionne l'éligibilité",
               "Demandez le délai de visite : il varie de 2 à 6 semaines selon les départements"] },
      { key: 'diagnostic', libelle: "Diagnostic autonomie du logement par l'AMO", court: 'Diag AMO', pct: 35,
        action: 'Réunir les devis des travaux', duree: '1 à 2 h de visite',
        description: "Visite sur place : l'AMO évalue le logement et préconise les travaux adaptés.",
        tips: ["Faites le tour du logement avec lui, pièce par pièce",
               "Signalez toutes vos difficultés du quotidien, même les plus petites"] },
      { key: 'montage', libelle: "Choisir vos entreprises d'adaptation", court: 'Entreprises', pct: 50,
        action: 'Déposer la demande en ligne', delai: '30 jours', duree: '2 semaines',
        cta: 'Voir les entreprises', href: 'annuaire-artisans.dc.html',
        description: "Pas d'obligation RGE pour MaPrimeAdapt'. L'AMO valide vos devis avant le dépôt.",
        tips: ["Demandez deux devis pour comparer",
               "Vérifiez que le devis reprend exactement les préconisations de l'AMO"] },
      { key: 'depot', libelle: "Dépôt du dossier par l'AMO", court: 'Dépôt', pct: 60,
        action: "Attendre l'instruction de l'Anah",
        cta: 'Préparer mes pièces', href: 'mes-documents.dc.html',
        description: "L'AMO dépose le dossier Anah pour vous, via un mandat de représentation.",
        tips: ["Signez le mandat de représentation",
               "Fournissez votre avis d'imposition et votre justificatif d'âge ou de GIR"] },
      { key: 'instruction', libelle: "Instruction par l'Anah", court: 'Instruction', pct: 75,
        action: 'Répondre aux demandes de compléments', duree: '4 à 8 semaines',
        description: "Votre AMO suit l'instruction et répond aux demandes de compléments." },
      { key: 'travaux', libelle: 'Réalisation des travaux', court: 'Travaux', pct: 90,
        action: 'Transmettre les factures', duree: '1 à 3 mois',
        description: "L'AMO coordonne les entreprises et contrôle la conformité en fin de chantier." },
      { key: 'versement', libelle: "Versement de l'aide", court: 'Versement', pct: 100, action: null,
        duree: '30 à 60 jours',
        description: 'Aide versée après facture finale et contrôle de conformité.' },
    ],
    indigne: [
      { key: 'reservation', libelle: 'Dossier créé', court: 'Dossier', pct: 5, auto: true,
        action: "Contacter l'opérateur spécialisé habilité par l'Anah",
        description: 'Votre éligibilité Ma Prime Logement Décent est validée.' },
      { key: 'operateur', libelle: 'Contacter votre opérateur spécialisé LHI', court: 'Opérateur', pct: 15,
        action: "Faire établir la grille d'évaluation", delai: '15 jours', duree: '~15 min',
        cta: 'Trouver mon opérateur', href: 'https://www.anah.gouv.fr',
        description: "Opérateur habilité par l'Anah pour l'habitat dégradé. Coût pris en charge à 100 %.",
        tips: ["SOLIHA et le réseau PACT couvrent la plupart des départements",
               "Signalez tout arrêté de péril ou d'insalubrité en cours : il change votre taux d'aide",
               "Préparez votre titre de propriété"] },
      { key: 'diagnostic', libelle: "Grille de dégradation ou d'insalubrité", court: 'Grille', pct: 30,
        action: "Faire réaliser l'audit énergétique", duree: '2 à 4 semaines',
        description: "Établie par votre opérateur : c'est elle qui détermine votre taux d'aide.",
        tips: ["Montrez tous les désordres : humidité, électricité, structure, sécurité",
               "Photographiez chaque pièce avant toute intervention"] },
      { key: 'audit', libelle: 'Audit énergétique par un auditeur qualifié', court: 'Audit', pct: 45,
        action: 'Réunir les devis des entreprises', duree: '2 à 3 semaines',
        description: "Obligatoire pour tout dossier LHI, intégralement pris en charge par l'Anah.",
        tips: ["Le scénario retenu doit atteindre la classe D au minimum",
               "L'audit est mandaté par votre opérateur : vous n'avancez rien"] },
      { key: 'montage', libelle: 'Montage du dossier et devis des entreprises', court: 'Devis', pct: 55,
        action: 'Déposer la demande en ligne', delai: '30 jours', duree: '3 à 6 semaines',
        cta: "Ouvrir l'annuaire artisans", href: 'annuaire-artisans.dc.html',
        description: "L'opérateur valide la stratégie de travaux et les devis retenus.",
        tips: ["Un devis par lot de travaux, chiffré ligne par ligne",
               "Bailleurs : la convention Loc'Avantages se signe avant le démarrage"] },
      { key: 'depot', libelle: 'Dépôt du dossier Ma Prime Logement Décent', court: 'Dépôt', pct: 65,
        action: "Attendre l'instruction de l'Anah",
        cta: 'Préparer mes pièces', href: 'mes-documents.dc.html',
        description: "L'opérateur dépose votre dossier Anah avec toutes les pièces.",
        tips: ["Vérifiez que la grille d'évaluation et l'audit sont bien joints",
               "Conservez une copie complète du dossier déposé"] },
      { key: 'instruction', libelle: "Instruction par l'Anah", court: 'Instruction', pct: 75,
        action: 'Répondre aux demandes de compléments', duree: '6 à 10 semaines',
        description: "Les dossiers habitat dégradé sont instruits plus longuement : l'opérateur assure le suivi." },
      { key: 'travaux', libelle: 'Réaliser les travaux', court: 'Travaux', pct: 90,
        action: 'Transmettre les factures', duree: '6 à 12 mois',
        description: 'Phase la plus longue du parcours, coordonnée par votre opérateur.' },
      { key: 'versement', libelle: 'Versement de vos aides', court: 'Versement', pct: 100, action: null,
        duree: '30 à 90 jours',
        description: 'Après contrôle post-travaux par votre opérateur.' },
    ],
  };

  var DOCUMENTS = {
    energetique: [
      { key: 'avis_imposition',  libelle: "Dernier avis d'imposition",                    obligatoire: true },
      { key: 'devis_rge',        libelle: "Devis d'un professionnel RGE",                 obligatoire: true },
      { key: 'justif_domicile',  libelle: 'Justificatif de domicile',                     obligatoire: true },
      { key: 'audit',            libelle: "Audit énergétique (rénovation d'ampleur)",     obligatoire: false },
    ],
    autonomie: [
      { key: 'avis_imposition',  libelle: "Dernier avis d'imposition",                    obligatoire: true },
      { key: 'justif_age_gir',   libelle: "Justificatif d'âge ou évaluation GIR",         obligatoire: true },
      { key: 'devis',            libelle: "Devis des travaux d'adaptation",               obligatoire: true },
      { key: 'diagnostic_amo',   libelle: 'Diagnostic du logement (établi par l\'AMO)',   obligatoire: true },
      { key: 'justif_handicap',  libelle: 'Justificatif de handicap ou PCH',               obligatoire: false },
    ],
    indigne: [
      { key: 'avis_imposition',  libelle: "Dernier avis d'imposition",                    obligatoire: true },
      { key: 'grille_evaluation',libelle: "Grille de dégradation ou d'insalubrité",        obligatoire: true },
      { key: 'audit',            libelle: 'Audit énergétique',                            obligatoire: true },
      { key: 'devis_rge',        libelle: "Devis d'entreprises RGE",                      obligatoire: true },
      { key: 'arrete_police',    libelle: 'Arrêté de police administratif',                obligatoire: false },
    ],
  };

  /* Fait avancer le dossier à une étape donnée et consigne l'historique. */
  function setEtape(dossierId, etapeKey, libelle){
    var all = loadAll();
    var d = find(all, dossierId);
    if (!d) return null;
    ensureSuivi(d);
    var tl = getTimeline(d);
    var conf = null;
    for (var i = 0; i < tl.length; i++) if (tl[i].key === etapeKey) conf = tl[i];
    if (!conf) return null;
    d.suivi.etape = etapeKey;
    d.suivi.progressionPct = conf.pct;
    d.suivi.historique.push({
      date: new Date().toISOString(), etape: etapeKey,
      libelle: libelle || conf.libelle,
    });
    saveAll(all);
    return d;
  }

  function getTimeline(dossier){
    return TIMELINES[(dossier && dossier.type) || 'energetique'] || TIMELINES.energetique;
  }
  function getDocumentsAttendus(dossier){
    return DOCUMENTS[(dossier && dossier.type) || 'energetique'] || [];
  }
  /* Étape courante, progression et prochaine action, déduites du suivi. */
  function getEtatSuivi(dossier){
    var tl = getTimeline(dossier);
    var key = (dossier && dossier.suivi && dossier.suivi.etape) || 'reservation';
    var idx = 0;
    for (var i = 0; i < tl.length; i++) if (tl[i].key === key) idx = i;
    var cur = tl[idx];
    return {
      index: idx,
      etape: cur.key,
      libelle: cur.libelle,
      progressionPct: (dossier && dossier.suivi && dossier.suivi.progressionPct) || cur.pct,
      prochaineAction: cur.action,
      termine: idx === tl.length - 1,
    };
  }

  /* Étape sur laquelle l'utilisateur doit agir : on saute les étapes
     automatiques (dossier créé, estimation) qui ne demandent aucune action. */
  function getCurrentStepIndex(dossier){
    var tl = getTimeline(dossier);
    var idx = getEtatSuivi(dossier).index;
    while (idx < tl.length - 1 && tl[idx].auto) idx++;
    return idx;
  }

  /* « J'ai fait cette étape » : avance d'un cran et consigne l'historique. */
  function advanceEtape(dossierId){
    var dos = getById(dossierId);
    if (!dos) return null;
    var tl = getTimeline(dos);
    var idx = getCurrentStepIndex(dos);
    if (idx >= tl.length - 1) return dos;
    return setEtape(dossierId, tl[idx + 1].key);
  }

  function find(all, id) {
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* Transmission au partenaire habilité : c'est la charnière du parcours,
     celle qui fait passer le dossier de la simulation au dossier réel. */
  function marquerTransmis(dossierId, infos) {
    var all = loadAll();
    var d = find(all, dossierId);
    if (!d) return null;
    infos = infos || {};
    d.transmisLe = new Date().toISOString();
    /* Le clic « Créer mon dossier » CRÉE le dossier : rien ne quitte encore le
       navigateur, aucun accompagnateur n'est désigné. Le statut passera à
       « transmis » quand le back-office l'aura réellement transmis. */
    d.statutDossier = 'cree';
    d.status = 'transmis';
    d.partenaire = {
      id: infos.partenaireId || null,
      nom: infos.partenaireNom || null,
      role: infos.partenaireRole || null,
      departement: infos.departement || null,
    };
    if (infos.consentementTransmission) d.consentementTransmission = infos.consentementTransmission;
    ensureSuivi(d);
    d.suivi.historique.push({
      date: d.transmisLe, etape: 'transmission',
      libelle: 'Dossier créé — en attente d\u2019un partenaire habilité',
    });
    saveAll(all);
    return d;
  }

  /* Fait avancer le statut administratif (côté back-office partenaire). */
  function setStatutDossier(dossierId, statut) {
    var all = loadAll();
    var d = find(all, dossierId);
    if (!d) return null;
    d.statutDossier = statut;
    saveAll(all);
    return d;
  }

  function getById(dossierId) {
    var d = find(loadAll(), dossierId);
    if (d) { d.status = computeStatus(d); ensureSuivi(d); }
    return d;
  }

  /* Les dossiers créés avant l'ajout du suivi n'ont pas de bloc `suivi` :
     on le complète à la lecture pour que les pages de suivi fonctionnent. */
  function ensureSuivi(d) {
    if (!d) return d;
    if (!d.suivi) {
      d.suivi = {
        etape: 'reservation',
        progressionPct: 5,
        documents: [],
        historique: [{ date: d.createdAt || new Date().toISOString(), etape: 'reservation', libelle: 'Dossier créé' }],
      };
    }
    if (!Array.isArray(d.suivi.documents)) d.suivi.documents = [];
    if (!Array.isArray(d.suivi.historique)) d.suivi.historique = [];
    return d;
  }

  function getAll() {
    var all = loadAll();
    all.forEach(function (d) { d.status = computeStatus(d); ensureSuivi(d); });
    return all;
  }

  /* « Actifs » = dossiers réels, transmis ou en cours de traitement.
     Les brouillons abandonnés restent invisibles partout. */
  function getActifs() {
    return getAll().filter(function (d) { return d.status !== 'brouillon'; });
  }

  function getActifsByType(type) {
    return getActifs().filter(function (d) { return d.type === type; });
  }

  function hasActifs() {
    return getActifs().length > 0;
  }

  function updateResult(dossierId, result) {
    var all = loadAll();
    var d = find(all, dossierId);
    if (!d) return null;
    d.result = result;
    saveAll(all);
    return d;
  }

  /* Crée le dossier ET le transmet en une passe (écran de transmission, démo). */
  function createTransmis(type, profile, result, infos) {
    var d = createDossier(type, profile, result);
    return marquerTransmis(d.id, infos) || d;
  }

  /* À utiliser pendant le tunnel : le dossier reste 'brouillon' tant que
     l'utilisateur n'a pas consenti à la transmission. */
  function createDraft(type, profile, result) {
    return createDossier(type, profile, result);
  }

  /* Récupère le brouillon en attente pour ce type, ou le crée s'il n'existe pas.
     Évite qu'un clic répété sur « Payer » n'empile des brouillons orphelins,
     invisibles partout (getActifs() les exclut). Le profil et le résultat sont
     rafraîchis à chaque passage : c'est toujours la dernière estimation vue. */
  function getOrCreateDraft(type, profile, result) {
    if (TYPES.indexOf(type) === -1) throw new Error('Type de dossier invalide : ' + type);
    var all = loadAll();
    var draft = null;
    // Priorité au brouillon explicitement en attente de paiement
    var pendingId = null;
    try { pendingId = localStorage.getItem('junglerenov.dossierEnAttente'); } catch (_) {}
    if (pendingId) {
      var byId = find(all, pendingId);
      if (byId && byId.type === type && !byId.transmisLe) draft = byId;
    }
    // Sinon, le dernier brouillon de ce type
    if (!draft) {
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].type === type && !all[i].transmisLe) { draft = all[i]; break; }
      }
    }
    if (draft) {
      draft.profile = profile || draft.profile || {};
      draft.result = result || draft.result || null;
      ensureSuivi(draft);
      saveAll(all);
      return draft;
    }
    return createDossier(type, profile, result);
  }

  /* Transmet le brouillon en attente déposé pendant le tunnel. */
  function settleDossierEnAttente(infos) {
    var id = null;
    try { id = localStorage.getItem('junglerenov.dossierEnAttente'); } catch (_) {}
    if (!id) return null;
    var d = marquerTransmis(id, infos);
    try { localStorage.removeItem('junglerenov.dossierEnAttente'); } catch (_) {}
    return d;
  }

  /* Résout le dossier à afficher : id d'URL en priorité, sinon le dernier
     dossier réel du type demandé. Utilisé par les pages détail. */
  function resolveFromUrl(type) {
    var id = null;
    try { id = new URLSearchParams(location.search).get('dossier'); } catch (_) {}
    if (id) {
      var byId = getById(id);
      if (byId && (!type || byId.type === type)) return byId;
    }
    var list = type ? getActifsByType(type) : getActifs();
    return list.length ? list[list.length - 1] : null;
  }

  function meta(type) {
    return META[type] || { titre: type, court: type, color: '#123A2E', detail: 'dashboard.dc.html' };
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
  }

  /* Total des aides d'un dossier, quel que soit son type : les 3 moteurs
     ne rangent pas le montant au même endroit. */
  function totalAides(dossier) {
    var r = dossier && dossier.result;
    if (!r) return 0;
    if (typeof r.totalAides === 'number') return r.totalAides;              // énergétique
    if (r.aide && typeof r.aide.total === 'number' && dossier.type === 'autonomie') return r.aide.total;
    if (r.aide) {
      // Habitat dégradé : Ma Prime Logement Décent + dispositifs cumulables
      // (MaPrimeRénov' partie énergétique, aides régionales). L'éco-PTZ est un
      // prêt et les services pris en charge par l'Anah ne sont pas versés :
      // ni l'un ni les autres n'entrent dans ce total.
      var socle = r.aide.totalApresEcretement || r.aide.total || 0;
      if (typeof socle !== 'number') return 0;
      return socle + (r.aide.mprCumulable || 0) + (r.aide.local || 0);
    }
    return 0;
  }

  /* ─── Migration des dossiers antérieurs ───────────────────────────
     Les dossiers créés sous l'ancien modèle portaient `paidAt` et une date
     d'expiration. On les relit comme des dossiers transmis, sans échéance. */
  function migrateLegacyDossiers() {
    try {
      var all = loadAll();
      var touched = false;
      all.forEach(function (d) {
        if (d.paidAt && !d.transmisLe) { d.transmisLe = d.paidAt; touched = true; }
        if (d.transmisLe && (!d.statutDossier || (d.statutDossier === 'transmis' && !(d.partenaire && d.partenaire.nom)))) { d.statutDossier = 'cree'; touched = true; }
        if (!d.transmisLe && !d.statutDossier) { d.statutDossier = 'brouillon'; touched = true; }
        if ('paidAt' in d || 'expiresAt' in d || 'montantPaye' in d) {
          delete d.paidAt; delete d.expiresAt; delete d.montantPaye; touched = true;
        }
        d.status = computeStatus(d);
      });
      if (touched) saveAll(all);
    } catch (_) {}
  }

  root.RFDossiers = {
    STORAGE_KEY: STORAGE_KEY,
    TYPES: TYPES,
    META: META,
    loadAll: loadAll,
    saveAll: saveAll,
    getAll: getAll,
    getActifs: getActifs,
    getActifsByType: getActifsByType,
    getById: getById,
    hasActifs: hasActifs,
    createDossier: createDossier,
    createTransmis: createTransmis,
    createDraft: createDraft,
    getOrCreateDraft: getOrCreateDraft,
    marquerTransmis: marquerTransmis,
    settleDossierEnAttente: settleDossierEnAttente,
    setStatutDossier: setStatutDossier,
    updateResult: updateResult,
    computeStatus: computeStatus,
    resolveFromUrl: resolveFromUrl,
    meta: meta,
    fmtDate: fmtDate,
    totalAides: totalAides,
    getTimeline: getTimeline,
    getDocumentsAttendus: getDocumentsAttendus,
    getEtatSuivi: getEtatSuivi,
    getCurrentStepIndex: getCurrentStepIndex,
    advanceEtape: advanceEtape,
    TIMELINES: TIMELINES,
    setEtape: setEtape,
    ensureSuivi: ensureSuivi,
    migrateLegacyDossiers: migrateLegacyDossiers,
  };

  // Migration legacy : toujours exécutée, idempotente et sans effet de bord.
  migrateLegacyDossiers();

})(window);
