/* JungleRenov — source unique du dossier courant et de ses totaux.
   Un total = un dossier : on n'additionne jamais plusieurs dossiers.
   Le moteur (_compute_aids.js) n'est pas modifié ; ce module l'appelle une fois
   par révision du profil et met le résultat en cache dans le dossier.
   Dépend de : lib/_dossiers.js (RFDossiers), lib/_compute_aids.js (RFCompute, chargé à la demande). */
(function (root) {
  'use strict';
  var KEY_COURANT = 'junglerenov.dossierCourant', EVT = 'jr:dossier';
  var JR = root.JR = root.JR || {};
  var eur = function (n) { return Math.round(n || 0).toLocaleString('fr-FR') + '\u202f€'; };
  function D() { return root.RFDossiers; }
  function emit() { try { root.dispatchEvent(new CustomEvent(EVT)); } catch (_) {} }

  /* Charge le moteur si la page ne l'a pas déjà. */
  var enginePromise = null;
  JR.moteur = function () {
    if (root.RFCompute) return Promise.resolve(root.RFCompute);
    if (enginePromise) return enginePromise;
    enginePromise = new Promise(function (ok) {
      var seq = ['lib/_baremes_sources.js', 'lib/_compute_aids.js'];
      (function next(i) {
        if (i >= seq.length) return ok(root.RFCompute || null);
        if (document.querySelector('script[data-jr-src="' + seq[i] + '"]')) return next(i + 1);
        var s = document.createElement('script'); s.src = seq[i]; s.async = false; s.setAttribute('data-jr-src', seq[i]);
        s.onload = s.onerror = function () { next(i + 1); }; document.body.appendChild(s);
      })(0);
    });
    return enginePromise;
  };

  (function () { if (root.JRLecture || document.querySelector('script[data-jr-src="lib/_lecture_aides.js"]')) return; var s = document.createElement('script'); s.src = 'lib/_lecture_aides.js'; s.async = false; s.setAttribute('data-jr-src', 'lib/_lecture_aides.js'); s.onload = emit; document.head.appendChild(s); })();
  JR.lecture = function (d) { return d && root.JRLecture ? root.JRLecture(d.type, d.result, d.devis && d.devis.ht > 0 ? d.devis : null, { date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '' }) : null; };

  JR.listeDossiers = function () {
    var all = []; try { all = (D() && D().getAll ? D().getAll() : []).filter(function (d) { return d && d.result; }); } catch (_) {}
    return all.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).map(function (d) {
      var t = JR.totaux(d), m = D().meta(d.type);
      var dt = d.createdAt ? new Date(d.createdAt) : null;
      return { id: d.id, type: d.type, dossier: d, totaux: t,
        label: (dt ? dt.toLocaleDateString('fr-FR').slice(0, 5) : '—') + ' · ' + eur(t.aides), court: m.court || m.titre };
    }).map(function (x, i, arr) { if (arr.some(function (y) { return y.type !== x.type; })) x.label = x.court + ' · ' + x.label; return x; });
  };

  JR.dossierCourant = function () {
    var l = JR.listeDossiers(); if (!l.length) return null;
    var id = null; try { id = new URLSearchParams(location.search).get('dossier') || localStorage.getItem(KEY_COURANT); } catch (_) {}
    var hit = l.filter(function (x) { return x.id === id; })[0];
    return (hit || l[0]).dossier;
  };
  JR.setDossierCourant = function (id) { try { localStorage.setItem(KEY_COURANT, id); } catch (_) {} emit(); };

  /* Totaux d'UN dossier : montant affichable selon la règle « forfaits sans devis, tout sur devis ». Cache par révision. */
  JR.totaux = function (d) {
    var vide = { aides: 0, base: 'forfait', titre: 'Aides forfaitaires estimées', ligne: '', reste: null, parcours: '', date: '' };
    if (!d) return vide;
    var rev = d.profileRev || 0, L = JR.lecture(d);
    if (!L) return Object.assign({}, vide, { aides: D() ? D().totalAides(d) : 0, parcours: D() ? D().meta(d.type).titre : d.type, date: d.createdAt || '' });
    if (d.totaux && d.totaux.rev === rev && d.totaux.v === 2) return d.totaux;
    var t = { v: 2, rev: rev, aides: L.montant, base: L.base, titre: L.titre, ligne: L.ligne, reste: L.reste, parcours: D() ? D().meta(d.type).titre : d.type, date: d.createdAt || '' };
    try { var all = D().loadAll(); all.forEach(function (x) { if (x.id === d.id) x.totaux = t; }); D().saveAll(all); d.totaux = t; } catch (_) {}
    return t;
  };

  /* Entrée du moteur pour un dossier : celle mémorisée à la remise, sinon reconstruite depuis le profil. */
  function entree(d) {
    var p = d.profile || {}, L = p.logement || {}, F = p.foyer || {}, S = p.situation || {};
    if (p.calcInput) {
      var c = Object.assign({}, p.calcInput);
      if (F.rfr != null) c.rfr = F.rfr; if (F.personnes) c.foyer = F.personnes;
      var dv = d.devis && d.devis.ht > 0 ? d.devis : null;
      delete c.devisHT; delete c.devisPostes;
      if (d.type === 'energetique' && dv) { c.devisHT = dv.ht; if (dv.postes) c.devisPostes = dv.postes; }
      if (d.type !== 'energetique') { if (dv) c.coutTravauxHT = dv.ht; else if (d.type === 'autonomie') delete c.coutTravauxHT; }
      if (d.type === 'energetique') {
        if (L.dept) c.dept = L.dept; if (L.epci) c.epci = L.epci; if (L.surface) c.surface = L.surface;
        if (L.dpe) c.dpeCurrent = L.dpe !== '?' ? L.dpe : null;
        if (L.chauffage) c.heat = ({ gaz: 'gaz', fioul: 'fioul', elec: 'electrique', bois: 'bois' })[L.chauffage] || c.heat;
        if (L.type) c.typeLogement = L.type === 'appartement' ? 'appartement' : 'maison';
        if (p.travaux && p.travaux.length) c.selection = p.travaux.slice();
      }
      return c;
    }
    if (d.type !== 'energetique') return null;   // MPA / LHI anciens : pas d'entrée reconstructible fidèlement
    var bc = S.bailleurCase || 'occupant', bail = S.status === 'bailleur';
    /* Même construction que input() du tunnel énergétique (mêmes valeurs par défaut). */
    return {
      surface: Number(L.surface) || 110, foyer: Number(F.personnes) || 4, rfr: Number(F.rfr) || 32000, region: 'Grand Est',
      heat: ({ gaz: 'gaz', fioul: 'fioul', elec: 'electrique', bois: 'bois' })[L.chauffage] || 'fioul',
      dept: L.dept || null, epci: L.epci || null, typeLogement: L.type === 'appartement' ? 'appartement' : 'maison',
      hasCoproCollectifs: bc === 'copro' ? 'yes' : 'no', copro: {}, dpeCurrent: L.dpe && L.dpe !== '?' ? L.dpe : null,
      oldWoodStove: false, status: bail ? 'bailleur' : 'occupant', ownerType: bail ? 'bailleur' : 'occupant', bailleurCase: bc,
      rent: 0, nbLogementsBailleur: 1, zone: null, locLevel: 'none', locDuration: 6, lpe: 'no', locAvantagesLevel: null, rentToMobility: false,
      selection: (p.travaux && p.travaux.length) ? p.travaux.slice() : ['combles', 'ite', 'pac_aireau'],
    };
  }
  function run(C, d, inp) {
    try { return d.type === 'autonomie' ? C.computeMprAdapt(inp) : d.type === 'indigne' ? C.computeMprLogementDecent(inp) : C.compute(inp); } catch (e) { console.error('[recalcul]', e); return null; }
  }
  function totalDe(d, r) { return D().totalAides(Object.assign({}, d, { result: r })); }

  /* Modifie le profil d'un dossier puis recalcule UNE fois avec le moteur. Renvoie les nouveaux totaux. */
  JR.enregistrerEtRecalculer = function (id, patch) {
    return JR.moteur().then(function (C) {
      if (!C) throw { code: 'moteur', message: 'Le moteur de calcul n’a pas pu être chargé.' };
      var all = D().loadAll(), d = all.filter(function (x) { return x.id === id; })[0];
      if (!d) throw { code: 'introuvable', message: 'Dossier introuvable.' };
      var avant = D().totalAides(d);
      /* Dossier sans entrée mémorisée : on vérifie d'abord que la reconstruction redonne le total stocké, à l'euro près.
         Sinon on n'écrase rien. */
      if (!(d.profile && d.profile.calcInput)) {
        var base = entree(d), rb = base ? run(C, d, base) : null;
        if (!rb || Math.round(totalDe(d, rb)) !== Math.round(avant))
          throw { code: 'ecart', message: 'Ce dossier a été créé par une version précédente du calcul : ses données d’origine sont incomplètes et un recalcul donnerait un autre montant (' + eur(rb ? totalDe(d, rb) : 0) + ' au lieu de ' + eur(avant) + '). Rien n’a été modifié. Refaites la simulation pour mettre ce dossier à jour.' };
        d.profile.calcInput = base;   // reconstruction validée : elle devient l'entrée de référence
      }
      var p = d.profile;
      if (patch && '__devis' in patch) { d.devis = patch.__devis; patch = Object.assign({}, patch); delete patch.__devis; }
      Object.keys(patch || {}).forEach(function (k) { p[k] = (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k])) ? Object.assign({}, p[k] || {}, patch[k]) : patch[k]; });
      var inp = entree(d), r = run(C, d, inp);
      if (!r) throw { code: 'calcul', message: 'Le recalcul n’a pas abouti. Rien n’a été modifié.' };
      d.result = r; p.calcInput = inp; if (d.type === 'energetique') p.aids = r;
      d.profileRev = (d.profileRev || 0) + 1; d.totaux = null;
      D().saveAll(all);
      try { localStorage.setItem('junglerenov.profile', JSON.stringify(Object.assign({}, JSON.parse(localStorage.getItem('junglerenov.profile') || '{}'), p))); } catch (_) {}
      var t = JR.totaux(D().getById(id));
      emit();
      return t;
    });
  };

/* ── Avancement : annulation des étapes déclaratives ──────────────────────────────
     Une étape est verrouillée si son état vient d'une donnée réelle : étape automatique (dossier créé),
     ou étape consignée dans l'historique avec source 'donnee' (remise, pièce reçue). Les autres sont déclaratives. */
  JR.etapes = function (d) {
    var R = D(), tl = R.getTimeline(d), idx = R.getCurrentStepIndex(d), h = (d.suivi && d.suivi.historique) || [];
    var parDonnee = {}; h.forEach(function (x) { if (x.source === 'donnee') parDonnee[x.etape] = true; });
    /* Données réelles qui verrouillent des étapes :
       - remise au partenaire (transmisLe) : l'étape « Dossier créé » ;
       - statut renvoyé par le partenaire : déposé → jusqu'au dépôt, instruit → jusqu'à l'octroi, versé → tout ;
       - pièce reçue : l'étape qui la produit (audit, diagnostic, devis → choix des entreprises). */
    var keys = tl.map(function (s) { return s.key; });
    var jusqua = function (k) { var n = keys.indexOf(k); for (var i = 0; i <= n; i++) parDonnee[keys[i]] = true; };
    if (d.transmisLe) parDonnee[keys[0]] = true;
    var st = d.statutDossier || '';
    if (st === 'depose') jusqua('depot');
    if (st === 'instruit') { jusqua('instruction'); if (keys.indexOf('acceptation') >= 0) jusqua('acceptation'); }
    if (st === 'verse') jusqua(keys[keys.length - 1]);
    var DOC_ETAPE = { audit: 'audit', diagnostic_amo: 'diagnostic', grille_evaluation: 'diagnostic', devis: 'montage', devis_rge: 'montage' };
    ((d.suivi && d.suivi.documents) || []).forEach(function (r) { var k = DOC_ETAPE[(r && r.key) || r]; if (k && keys.indexOf(k) >= 0) parDonnee[k] = true; });
    var locked = function (i) { return !!(tl[i] && (tl[i].auto || parDonnee[tl[i].key])); };
    var premier = 0; while (premier < tl.length - 1 && tl[premier].auto) premier++;
    return { tl: tl, idx: idx, premier: premier, locked: locked,
      /* L'étape i peut redevenir « En cours » si elle et toutes celles qu'on défait sont déclaratives. */
      annulable: function (i) { if (i < premier || i >= idx) return false; for (var k = i; k < idx; k++) if (locked(k)) return false; return true; } };
  };
  JR.instantane = function (id) { var d = D().getById(id); return d ? JSON.stringify(d.suivi || null) : null; };
  JR.restaurer = function (id, snap) {
    var all = D().loadAll(), d = all.filter(function (x) { return x.id === id; })[0]; if (!d || snap == null) return;
    d.suivi = JSON.parse(snap); D().saveAll(all); emit();
  };
  JR.avancer = function (id) {
    var snap = JR.instantane(id), d = D().advanceEtape(id);
    try { var all = D().loadAll(), x = all.filter(function (y) { return y.id === id; })[0], h = x.suivi.historique; if (h.length) h[h.length - 1].source = 'utilisateur'; D().saveAll(all); } catch (_) {}
    emit(); return snap;
  };
  /* Remet l'étape i « En cours » ; les suivantes repassent « À venir ». Renvoie l'instantané précédent. */
  JR.revenirA = function (id, i) {
    var d = D().getById(id); if (!d) return null;
    var E = JR.etapes(d); if (!E.annulable(i)) throw { code: 'verrouille', message: 'Cette étape dépend d’une donnée reçue et ne peut pas être annulée à la main.' };
    var snap = JR.instantane(id), all = D().loadAll(), x = all.filter(function (y) { return y.id === id; })[0];
    x.suivi = x.suivi || { historique: [] }; x.suivi.historique = x.suivi.historique || [];
    x.suivi.etape = E.tl[i].key; x.suivi.progressionPct = E.tl[i].pct;
    x.suivi.historique.push({ date: new Date().toISOString(), etape: E.tl[i].key, libelle: 'Retour à l’étape « ' + E.tl[i].libelle + ' »', source: 'utilisateur' });
    D().saveAll(all); emit(); return snap;
  };

  JR.supprimerDossier = function (id) {
    var all = D().loadAll().filter(function (x) { return x.id !== id; }); D().saveAll(all);
    try { if (localStorage.getItem(KEY_COURANT) === id) localStorage.removeItem(KEY_COURANT); } catch (_) {}
    emit();
  };

  /* Doublons probables : même parcours, même adresse, créés à moins de trois jours d'écart. */
  JR.doublons = function () {
    var l = JR.listeDossiers(), out = {};
    var adr = function (d) { var p = d.profile || {}; return String(p.address || (p.logement && (p.logement.address || p.logement.adresse)) || '').toLowerCase().replace(/\s+/g, ' ').trim(); };
    l.forEach(function (a, i) { l.slice(i + 1).forEach(function (b) {
      if (a.type === b.type && adr(a.dossier) && adr(a.dossier) === adr(b.dossier) && Math.abs(new Date(a.dossier.createdAt) - new Date(b.dossier.createdAt)) < 3 * 864e5) out[b.id] = a.id;
    }); });
    return out;   // { idDoublonPlusAncien: idPlusRecent }
  };

  /* Accroches communes aux pages de l'espace : barre latérale (nav, widget, sélecteur, utilisateur). */
  JR.espace = function (current, onChange) {
    var d = JR.dossierCourant(), t = JR.totaux(d), l = JR.listeDossiers(), U = root.RFUser, id = U && U.getIdentity ? U.getIdentity() : {};
    var it = function (label, href, icon, key) { return { label: label, href: href, icon: icon, current: key === current }; };
    return {
      dossier: d, totaux: t, liste: l,
      nav: [
        { title: 'Mon parcours', items: [it('Mon projet', 'dashboard.dc.html', 'dossier', 'dashboard'), it('Mes aides', 'mes-aides.dc.html', 'revenus', 'mes-aides'), it('Mes documents', 'mes-documents.dc.html', 'document', 'mes-documents')] },
        { title: 'Outils', items: [it('Annuaire artisans', 'annuaire-artisans.dc.html', 'devis', 'annuaire-artisans'), it('Comprendre les aides', 'glossaire-aides.dc.html', 'information', 'glossaire')] },
        { title: 'Compte', items: [it('Mon profil', 'mon-profil.dc.html', 'proprietaire', 'mon-profil'), it('Retour à l’accueil', 'index.dc.html', 'retour', 'index')] },
      ],
      widget: { label: 'Aides estimées', amount: d ? eur(t.aides) : '—', caption: d ? (t.base === 'devis' ? 'Sur vos devis · ' : 'Aides forfaitaires · ') + (D().meta(d.type).court || t.parcours) : 'Simulation à faire' },
      dossiers: l.length > 1 ? l.map(function (x) { var dt = x.dossier.createdAt ? new Date(x.dossier.createdAt) : null; return { id: x.id, value: x.id, label: x.label, parcours: D().meta(x.type).titre, date: dt ? dt.toLocaleDateString('fr-FR') : '—', montant: eur(x.totaux.aides) }; }) : null,
      onDelete: function (id) { JR.supprimerDossier(id); if (onChange) onChange(); },
      dossierId: d ? d.id : '',
      onDossier: function (e) { JR.setDossierCourant(e && e.target ? e.target.value : e); if (onChange) onChange(); },
      user: { initials: (U && U.getInitials && U.getInitials()) || 'JR', name: (U && U.getFullName && U.getFullName()) || 'Mon compte', email: id.email || '' },
      eur: eur,
    };
  };
  JR.EVT = EVT;
  root.addEventListener('storage', function (e) { if (e.key === KEY_COURANT || e.key === 'junglerenov.dossiers') emit(); });
})(window);
