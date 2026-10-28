
  const KEY = 'junglerenov.profile';
  const ALT = 'junglerenov.profile';

  function getDossier(){
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || 'null');
      const b = JSON.parse(localStorage.getItem(ALT) || 'null');
      return a || b || null;
    } catch { return null; }
  }
  function saveDossier(patch){
    const cur = getDossier() || {};
    const next = { ...cur, ...patch, updatedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  function hasDossier(){
    const d = getDossier();
    return !!(d && ((d.diagnostic && d.diagnostic.completed) || d.aids || d.logement || d.address));
  }
  function toast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* Dossier ouvert : ?dossier= en priorité, puis le dossier courant mémorisé par
     le sélecteur, sinon le plus récent. RFDossiers est chargé plus bas dans la
     page : la résolution est donc paresseuse, appelée au moment du rendu. */
  function activeDossier(){
    try {
      if (!window.RFDossiers) return null;
      var id = new URLSearchParams(location.search).get('dossier');
      if (!id) { try { id = localStorage.getItem('junglerenov.dossierCourant'); } catch(_){} }
      if (id){
        var byId = RFDossiers.getById(id);
        if (byId) return byId;
      }
      var actifs = (RFDossiers.getActifs && RFDossiers.getActifs()) || [];
      if (!actifs.length) return null;
      actifs.slice().sort(function(a, b){ return new Date(b.transmisLe || 0) - new Date(a.transmisLe || 0); });
      return actifs[actifs.length - 1];
    } catch (_) { return null; }
  }

  /* ── Pièces MaPrimeAdapt' ─────────────────────────────────────────
     Les devis sont générés depuis les libellés du moteur : un geste coché dans
     le tunnel donne exactement une ligne de devis ici. */
  const PIECES_MPA_SITUATION = [
    { id:'notif-mdph',   group:'autonomie', cat:'identity', nm:'Notification MDPH ou carte mobilité inclusion', for:"Preuve d'un taux d'incapacité ≥ 50 % ou de la PCH", type:'pdf', cond:'handicap' },
    { id:'grille-aggir', group:'autonomie', cat:'identity', nm:'Grille AGGIR (évaluation GIR)',                 for:'Éligibilité entre 60 et 69 ans (GIR 1 à 6)',        type:'pdf', cond:'age_60_69' },
    { id:'justif-age',   group:'autonomie', cat:'identity', nm:"Justificatif d'âge (livret de famille ou CNI)",  for:'Éligibilité à partir de 70 ans, sans autre condition', type:'pdf', cond:'age_70' },
  ];
  const PIECES_MPA_AMO = [
    { id:'diag-amo',   group:'amo', cat:'logement', nm:"Diagnostic logement autonomie (établi par l'AMO)", for:"Étape obligatoire pilotée par votre opérateur AMO habilité", type:'pdf' },
    { id:'mandat-amo', group:'amo', cat:'logement', nm:'Mandat de représentation AMO',                     for:"Autorise l'opérateur à déposer le dossier Anah en votre nom", type:'pdf' },
  ];
  const POST_TRAVAUX_MPA = [
    { id:'facture-mpa',      group:'post', cat:'devis', nm:'Facture finale entreprise (datée et signée)', for:"Déclenche le versement de MaPrimeAdapt'", type:'pdf' },
    { id:'attestation-mpa',  group:'post', cat:'devis', nm:'Attestation de fin de travaux',               for:"Clôture du dossier Anah (client + entreprise)", type:'pdf' },
    { id:'photos-apres-mpa', group:'post', cat:'photo', nm:'Photos APRÈS travaux',                        for:'Contrôle a posteriori de l\'Anah', type:'img' },
  ];
  const EQUIP_CERTIFIES = ['monte_escalier','plateforme_elevatrice','ascenseur'];
  function piecesMpaTravaux(codes){
    var LIB = (window.RFCompute && window.RFCompute.MPA_LIBELLES) || {};
    var out = [];
    (codes || []).forEach(function(c){
      out.push({ id:'devis-' + c, group:'travaux', cat:'devis',
        nm:'Devis entreprise — ' + (LIB[c] || c),
        for:"MaPrimeAdapt' · doit détailler la fourniture et la pose", type:'pdf' });
      if (EQUIP_CERTIFIES.indexOf(c) !== -1){
        out.push({ id:'certif-' + c, group:'travaux', cat:'tech',
          nm:"Certification CE de l'équipement — " + (LIB[c] || c),
          for:"Conformité EN 81-40 / 81-41 exigée par l'Anah", type:'pdf' });
      }
    });
    if (out.length){
      out.push({ id:'assur-decennale', group:'travaux', cat:'rge',
        nm:"Attestation d'assurance décennale et RC pro",
        for:'Obligatoire pour toute entreprise intervenant sur un dossier Anah', type:'pdf' });
    }
    return out;
  }

  /* ── Pièces habitat dégradé ─────────────────────────────────────── */
  const PIECES_LHI_DIAG = [
    { id:'audit-lhi',          group:'lhi', cat:'dpe',      nm:'Audit énergétique',                              for:"Obligatoire pour un dossier LHI · coût pris en charge par l'Anah", type:'pdf' },
    { id:'grille-degradation', group:'lhi', cat:'logement',  nm:"Grille d'évaluation de dégradation ou d'insalubrité", for:"Établie par votre opérateur spécialisé habilité Anah", type:'pdf' },
    { id:'devis-lots-lhi',     group:'travaux', cat:'devis', nm:'Devis des entreprises, lot par lot',             for:'Ma Prime Logement Décent + MaPrimeRénov\' pour la partie énergétique', type:'pdf' },
    { id:'rge-lhi',            group:'travaux', cat:'rge',   nm:"Attestations RGE des entreprises",               for:'Exigé pour la partie énergétique cumulable', type:'pdf' },
  ];
  const PIECES_LHI_ENGAGEMENT = [
    { id:'engagement-3ans',  group:'engagement', cat:'logement', nm:'Engagement de résidence principale (3 ans)', for:'Occupant : occupation du logement 3 ans après les travaux', type:'pdf', cond:'variant_occupant' },
    { id:'convention-loca',  group:'engagement', cat:'bail',     nm:"Convention Loc'Avantages signée",            for:'Bailleur : loyer plafonné, 6 ans, classe D minimum en sortie', type:'pdf', cond:'variant_bailleur' },
    { id:'arrete-police',    group:'engagement', cat:'logement', nm:'Arrêté de police administratif',             for:"Copropriété : arrêté d'insalubrité ou de péril en cours", type:'pdf', cond:'variant_copro' },
    { id:'pv-ag',            group:'engagement', cat:'logement', nm:"PV d'assemblée générale",                    for:'Copropriété : vote des travaux et du mandat AMO', type:'pdf', cond:'variant_copro' },
  ];
  const POST_TRAVAUX_LHI = [
    { id:'facture-lhi',      group:'post', cat:'devis',    nm:'Factures finales, lot par lot',        for:"Déclenche le versement de Ma Prime Logement Décent", type:'pdf' },
    { id:'attestation-lhi',  group:'post', cat:'devis',    nm:'Attestation de fin de travaux',        for:"Clôture du dossier par l'opérateur et l'Anah", type:'pdf' },
    { id:'grille-post-lhi',  group:'post', cat:'logement', nm:"Grille d'évaluation après travaux",    for:'Vérification de la salubrité et de la classe énergétique de sortie', type:'pdf' },
  ];

  /* === Mapping pièces selon travaux ===
     Champ `group` utilisé pour grouper visuellement les pièces :
       - identity : pièces d'identité et fiscales (toujours demandées)
       - logement : pièces relatives au logement à rénover
       - travaux  : pièces spécifiques à chaque poste de travaux
       - bailleur : pièces additionnelles si le déclarant est bailleur
       - post     : pièces à fournir APRÈS la fin des travaux (déclenchement du versement) */
  const ALWAYS = [
    // Identité & foyer fiscal
    // Le libellé dépend du dispositif : les catégories « Bleu / Jaune / Violet /
    // Rose » sont propres à MaPrimeRénov'. Sur MaPrimeAdapt' et sur l'habitat
    // dégradé, l'Anah parle de ménages très modestes ou modestes.
    { id:'avis-impot', group:'identity', cat:'identity', nm:"Avis d'imposition (le plus récent)",
      for: function(type){
        return (type === 'autonomie' || type === 'indigne')
          ? 'Détermination de votre catégorie de revenus Anah (très modestes ou modestes)'
          : "Calcul de votre catégorie MaPrimeRénov' (Bleu / Jaune / Violet / Rose)";
      }, type:'pdf' },
    { id:'identite',   group:'identity', cat:'identity', nm:"Pièce d'identité (recto/verso)",     for:"Identification du foyer fiscal — Anah + banque", type:'img' },
    { id:'rib',        group:'identity', cat:'identity', nm:'RIB du foyer',                        for:'Versement des aides Anah et primes CEE',        type:'pdf' },
  ];

  // Pièces "logement" toujours utiles (titre de propriété + justif domicile + DPE)
  const LOGEMENT = [
    { id:'titre-propriete', group:'logement', cat:'logement', nm:'Titre de propriété ou taxe foncière', for:"Preuve de propriété et d'ancienneté du logement (> 2 ans)", type:'pdf' },
    { id:'justif-domicile', group:'logement', cat:'logement', nm:"Justificatif de domicile (< 3 mois)", for:"Demande éco-PTZ — exigé par la banque", type:'pdf' },
    { id:'dpe',             group:'logement', cat:'dpe',      nm:'DPE de moins de 10 ans',              for:"Estimation MaPrimeRénov' + obligatoire si rénovation globale", type:'pdf' },
  ];

  const BY_WORK = {
    combles: [
      { id:'devis-combles', group:'travaux', cat:'devis', nm:'Devis artisan signé — Isolation combles', for:"MaPrimeRénov' + CEE · doit mentionner R ≥ 7 m²·K/W", type:'pdf' },
      { id:'rge-combles',   group:'travaux', cat:'rge',   nm:"Attestation RGE de l'artisan",            for:"MaPrimeRénov' + CEE",                                  type:'pdf' },
      { id:'photo-combles', group:'travaux', cat:'photo', nm:'Photos avant travaux — combles',          for:"Validation MaPrimeRénov' + contrôle CEE",              type:'img' },
    ],
    ite: [
      { id:'devis-ite', group:'travaux', cat:'devis', nm:'Devis artisan signé — Isolation murs (ITE)', for:"MaPrimeRénov' + CEE · doit mentionner R ≥ 3,7 m²·K/W", type:'pdf' },
      { id:'rge-ite',   group:'travaux', cat:'rge',   nm:"Attestation RGE de l'artisan",                for:"MaPrimeRénov' + CEE",                                  type:'pdf' },
      { id:'photo-ite', group:'travaux', cat:'photo', nm:'Photos avant travaux — façades',              for:"Validation MaPrimeRénov' + contrôle CEE",              type:'img' },
    ],
    pac: [
      { id:'devis-pac', group:'travaux', cat:'devis', nm:'Devis artisan signé — PAC air/eau',                       for:"MaPrimeRénov' + CEE", type:'pdf' },
      { id:'rge-pac',   group:'travaux', cat:'rge',   nm:'Attestation RGE QualiPAC',                                 for:"MaPrimeRénov' + CEE", type:'pdf' },
      { id:'tech-pac',  group:'travaux', cat:'tech',  nm:'Fiche technique PAC (marque, modèle, COP, ETAS)',          for:"Validation Anah — COP ≥ 3,4 exigé",        type:'pdf' },
    ],
    biomasse: [
      { id:'devis-bio', group:'travaux', cat:'devis', nm:'Devis artisan signé — Chaudière biomasse',                 for:"MaPrimeRénov' + CEE",                          type:'pdf' },
      { id:'rge-bio',   group:'travaux', cat:'rge',   nm:'Attestation RGE Qualibois',                                 for:"MaPrimeRénov' + CEE",                          type:'pdf' },
      { id:'tech-bio',  group:'travaux', cat:'tech',  nm:'Fiche technique chaudière (rendement, label Flamme Verte)', for:"Validation Anah — label Flamme Verte 7★ exigé", type:'pdf' },
    ],
    menuiseries: [
      { id:'devis-men', group:'travaux', cat:'devis', nm:'Devis avec marque et coefficient Uw des fenêtres', for:"CEE menuiseries · Uw ≤ 1,3 W/m²·K et Sw ≥ 0,3", type:'pdf' },
      { id:'photo-men', group:'travaux', cat:'photo', nm:'Photos avant travaux — menuiseries',                for:'Validation CEE',                                type:'img' },
    ],
    vmc: [
      { id:'devis-vmc', group:'travaux', cat:'devis', nm:'Devis artisan signé — VMC double flux',          for:"MaPrimeRénov' + CEE",                          type:'pdf' },
      { id:'rge-vmc',   group:'travaux', cat:'rge',   nm:"Attestation RGE de l'artisan",                   for:"MaPrimeRénov' + CEE",                          type:'pdf' },
      { id:'tech-vmc',  group:'travaux', cat:'tech',  nm:'Fiche technique VMC (rendement échangeur)',      for:'Validation Anah — rendement échangeur ≥ 85 %', type:'pdf' },
    ],
    panneaux_solaires: [
      { id:'devis-pv',  group:'travaux', cat:'devis', nm:'Devis artisan signé — Panneaux photovoltaïques',           for:"Prime à l'autoconsommation",      type:'pdf' },
      { id:'rge-pv',    group:'travaux', cat:'rge',   nm:'Attestation RGE QualiPV',                                   for:"Prime à l'autoconsommation",      type:'pdf' },
      { id:'enedis-pv', group:'travaux', cat:'tech',  nm:"Convention d'autoconsommation Enedis",                     for:"Démarche séparée — raccordement", type:'pdf' },
    ],
  };

  // Pièces à fournir APRÈS la fin des travaux (déclenchent le versement des aides)
  const POST_TRAVAUX = [
    { id:'facture-finale',      group:'post', cat:'devis', nm:'Facture finale (datée et signée artisan)',   for:"Déclenche le versement MaPrimeRénov' et primes CEE",  type:'pdf' },
    { id:'attestation-fin',     group:'post', cat:'devis', nm:'Attestation de fin de travaux signée',       for:"Clôture du dossier MaPrimeRénov' (client + artisan)", type:'pdf' },
    { id:'photos-apres',        group:'post', cat:'photo', nm:'Photos APRÈS travaux',                       for:"Contrôle a posteriori MaPrimeRénov' / CEE",           type:'img' },
  ];
  function detectWorksFromDiagnostic(d){
    // Détecte les travaux choisis par l'utilisateur depuis la structure
    // sauvegardée par tunnel-energetique.dc.html (junglerenov.profile).
    // La simulation stocke les coûts par poste : aids.travaux.{combles, ite, pac}.
    // Si un coût > 0, c'est que l'utilisateur a coché ce travaux pendant son inscription.
    const explicit = (d && (d.travaux || (d.diagnostic && d.diagnostic.travaux))) || [];
    const aidsT = (d && d.aids && d.aids.travaux) || {};
    const detected = [];
    if (aidsT.combles > 0) detected.push('combles');
    if (aidsT.ite > 0)     detected.push('ite');
    if (aidsT.pac > 0)     detected.push('pac');
    return [...new Set([...explicit, ...detected])];
  }
  function getPieces(d){
    // Un dossier MPA ou LHI n'a rien à voir avec le catalogue énergétique :
    // on part de son propre profil, pas de junglerenov.profile.
    var dos = activeDossier();
    if (dos && dos.type === 'autonomie') return getPiecesMpa(dos);
    if (dos && dos.type === 'indigne')   return getPiecesLhi(dos);
    return getPiecesEnergetique(d);
  }

  function getPiecesMpa(dos){
    var p = dos.profile || {};
    var age = Number(p.age) || 0;
    var handicap = p.handicap && p.handicap !== 'non';
    var list = ALWAYS.slice();
    // Le DPE ne concerne pas un dossier d'adaptation : on garde propriété + domicile.
    list = list.concat(LOGEMENT.filter(function(x){ return x.id !== 'dpe'; }));
    PIECES_MPA_SITUATION.forEach(function(x){
      if (x.cond === 'handicap'  && !handicap) return;
      if (x.cond === 'age_60_69' && !(age >= 60 && age < 70)) return;
      if (x.cond === 'age_70'    && !(age >= 70)) return;
      list.push(x);
    });
    list = list.concat(piecesMpaTravaux(p.travaux));
    list = list.concat(PIECES_MPA_AMO, POST_TRAVAUX_MPA);
    return list;
  }

  function getPiecesLhi(dos){
    var p = dos.profile || {};
    var variant = p.variant || 'occupant';
    var list = ALWAYS.slice().concat(LOGEMENT.filter(function(x){ return x.id !== 'dpe'; }));
    list = list.concat(PIECES_LHI_DIAG);
    PIECES_LHI_ENGAGEMENT.forEach(function(x){
      if (x.cond === 'variant_occupant' && variant !== 'occupant') return;
      if (x.cond === 'variant_bailleur' && variant !== 'bailleur') return;
      if (x.cond === 'variant_copro'    && variant !== 'copro')    return;
      list.push(x);
    });
    return list.concat(POST_TRAVAUX_LHI);
  }

  function getPiecesEnergetique(d){
    const works = detectWorksFromDiagnostic(d);
    // 1. Identité & foyer (toujours)
    let list = [...ALWAYS];
    // 2. Logement (toujours)
    list = list.concat(LOGEMENT);
    // 3. Bailleur (si applicable) — inséré juste après les pièces logement
    const status = d && ((d.situation && d.situation.status) || (d.diagnostic && d.diagnostic.status));
    if (status === 'Bailleur'){
      list.push(
        { id:'bail',    group:'bailleur', cat:'bail', nm:'Bail en cours',                              for:"Justificatif du statut bailleur",                     type:'pdf' },
        { id:'dpe-loc', group:'bailleur', cat:'bail', nm:'DPE locatif',                                for:"Calendrier réglementaire DPE F-G (décret tertiaire)", type:'pdf' },
        { id:'plafond', group:'bailleur', cat:'bail', nm:"Attestation d'engagement de loyer plafonné", for:"MaPrimeRénov' bailleur — engagement de 6 ans",        type:'pdf' },
      );
    }
    // 4. Par travaux
    works.forEach(w => { if (BY_WORK[w]) list = list.concat(BY_WORK[w]); });
    // 5. Post-travaux (toujours, à fournir après la fin du chantier)
    list = list.concat(POST_TRAVAUX);
    return list;
  }

  // Métadonnées des groupes pour le rendu
  const GROUPS = {
    identity: { title:'Identité & foyer fiscal',  subtitle:'Pièces obligatoires pour toutes les aides' },
    logement: { title:'Logement à rénover',       subtitle:'Preuve de propriété, domicile et état énergétique' },
    bailleur: { title:'Statut bailleur',          subtitle:"Pièces additionnelles pour MaPrimeRénov' bailleur" },
    travaux:  { title:'Pièces par poste de travaux', subtitle:'Devis, attestations RGE, fiches techniques selon vos travaux' },
    post:     { title:'À fournir APRÈS les travaux', subtitle:'Déclenche le versement des aides — à téléverser à la fin du chantier' },
    autonomie:  { title:"Situation d'autonomie",   subtitle:"Justificatifs d'âge, de GIR ou de handicap exigés par l'Anah" },
    amo:        { title:'Accompagnement AMO',      subtitle:"Pièces établies avec votre opérateur habilité par l'Anah" },
    lhi:        { title:'Diagnostic habitat dégradé', subtitle:"Audit énergétique et grille d'évaluation, préalables obligatoires" },
    engagement: { title:'Engagements',             subtitle:'Contreparties exigées selon votre statut' },
  };
  const GROUP_ORDER = ['identity','logement','autonomie','lhi','bailleur','travaux','engagement','amo','post'];

  /* === Mapping dossiers générés selon travaux === */
  function getDossiers(d, pieces, statutPieces){
    var dos = activeDossier();
    // MPA et LHI : les formulaires Anah dépendent du diagnostic de l'opérateur.
    // Tant qu'il n'a pas eu lieu, ils ne sont pas générables — on l'annonce
    // plutôt que d'exposer un bouton mort.
    if (dos && dos.type === 'autonomie'){
      return [
        { id:'mpa-anah',   kind:'mandate', nm:"Demande MaPrimeAdapt' — Anah", for:"Anah · à monter avec votre opérateur AMO", status:'attente', date:new Date() },
        { id:'mpa-mandat', kind:'mandate', nm:'Mandat de représentation AMO',  for:"À signer après le rendez-vous avec l'opérateur AMO", status:'attente', date:new Date() },
      ];
    }
    if (dos && dos.type === 'indigne'){
      var v = (dos.profile && dos.profile.variant) || 'occupant';
      var l = [
        { id:'lhi-anah',   kind:'mandate', nm:'Demande Ma Prime Logement Décent — Anah', for:"Anah · en attente de l'audit énergétique et de la grille d'évaluation", status:'attente', date:new Date() },
        { id:'lhi-mandat', kind:'mandate', nm:'Mandat opérateur spécialisé LHI',          for:'À signer après le rendez-vous avec l\'opérateur', status:'attente', date:new Date() },
      ];
      if (v === 'bailleur') l.push({ id:'lhi-conv', kind:'mandate', nm:"Convention Loc'Avantages", for:"À signer avec l'Anah — engagement locatif de 6 ans", status:'attente', date:new Date() });
      return l;
    }
    const works = detectWorksFromDiagnostic(d);
    const list = [];
    const hasDevis = Object.entries(statutPieces).some(([id,s]) => id.startsWith('devis-') && s === 'valid');
    // Liste des dossiers signés (persistance dans profile.signedDossiers)
    const signed = Array.isArray(d.signedDossiers) ? d.signedDossiers : [];
    const isSigned = id => signed.includes(id);
    const statusFor = (hasDevisRequired, id) => {
      if (isSigned(id)) return 'signed';
      if (hasDevisRequired && !hasDevis) return 'attente';
      return 'ready';
    };
    // 'mandate'  = dossier DÉPOSÉ par JungleRenov pour le compte du client (mandat signé)
    //              → nécessite devis et signature électronique avant dépôt.
    // 'helper'   = document d'AIDE que le client utilise lui-même dans ses démarches
    //              (PTZ : banque · TVA : artisan). Toujours téléchargeable, jamais signé.
    list.push({ id:'mpr',  kind:'mandate', nm:'Demande MaPrimeRénov\' — Parcours mono-geste', for:'Anah — déposé par JungleRenov via mandat',
                status: statusFor(true, 'mpr'), date: new Date() });
    list.push({ id:'cee',  kind:'mandate', nm:'Attestation CEE (prime énergie)',              for:'Obligé : à choisir (TotalEnergies, EDF, Engie) — déposé par JungleRenov via mandat',
                status: statusFor(true, 'cee'), date: new Date() });
    list.push({ id:'tva',  kind:'helper',  nm:'Attestation TVA 5,5 %',                        for:"À remettre à l'artisan AVANT le début des travaux",
                status: 'ready', date: new Date() });
    list.push({ id:'eptz', kind:'helper',  nm:'Dossier éco-PTZ',                              for:"À apporter à votre banque pour constituer votre demande",
                status: 'ready', date: new Date() });
    return list;
  }

  /* === Rendu === */
  const STATUTS_PIECES = { 'à fournir':'todo', 'en cours':'progress', 'validé':'valid', 'refusé':'refused' };
  const ICON_DL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  const ICON_UP = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>';
  const ICON_EYE = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';

  /* Ouvre un input file et stocke le fichier sélectionné dans IndexedDB sous l'id de la pièce.
     Met à jour le statut de la pièce dans le dossier après upload. */
  function uploadPieceFile(pieceId, pieceName){
    return new Promise((resolve) => {
      const i = document.createElement('input');
      i.type = 'file';
      i.accept = '.pdf,.jpg,.jpeg,.png,.docx';
      i.onchange = async () => {
        if (!i.files || !i.files[0]) { resolve(false); return; }
        const f = i.files[0];
        const session = (function(){ try { return JSON.parse(localStorage.getItem('junglerenov.session')||'null'); } catch { return null; }})();
        const clientId = (session && session.id) || 'anonymous';
        try {
          // 1) Stocke le binaire dans IndexedDB sous l'id logique de la pièce
          await RFFiles.saveFile({ id: pieceId, clientId, pieceId, file: f, label: pieceName });
          // 2) Trace metadata côté admin
          if (window.RFStore && typeof RFStore.saveDocument === 'function'){
            await RFStore.saveDocument({
              clientId, type:'piece', code: pieceId, nom: f.name, statut: 'fourni',
              metadata: { size: f.size, mime: f.type, uploadedAt: new Date().toISOString() },
            });
          }
          /* 3) Statut → « en attente de vérification », et il y reste.
             Le passage à « validé » appartient au back-office : le fichier
             n'a pas quitté le navigateur, personne ne l'a contrôlé. */
          const cur = getDossier() || {};
          saveDossier({ statutPieces: { ...(cur.statutPieces||{}), [pieceId]: 'progress' } });
          toast(`« ${pieceName} » téléversé (` + Math.round(f.size/1024) + ' Ko) — en attente de vérification');
          bind();
          resolve(true);
        } catch(e){
          console.warn('Upload pièce :', e);
          toast(`Erreur lors du téléversement`);
          resolve(false);
        }
      };
      i.click();
    });
  }

  async function renderPieces(pieces, statuts){
    const wrap = document.getElementById('pieces-list');
    wrap.innerHTML = '';

    // 1) Récupère la liste des id qui ont un fichier dans IndexedDB (rapide, metadata seules)
    let storedIds = new Set();
    try {
      if (window.RFFiles && typeof RFFiles.listAll === 'function'){
        const all = await RFFiles.listAll();
        storedIds = new Set(all.map(r => r.id));
      }
    } catch(e){ console.warn('listAll IDB :', e); }

    // 2) Groupe les pièces par leur clé `group` (fallback "travaux" pour pièces non taggées)
    const byGroup = {};
    pieces.forEach(p => {
      const g = p.group || 'travaux';
      (byGroup[g] = byGroup[g] || []).push(p);
    });

    // 3) Affiche les groupes dans l'ordre canonique
    GROUP_ORDER.forEach(gKey => {
      const items = byGroup[gKey];
      if (!items || !items.length) return;
      const meta = GROUPS[gKey] || { title: gKey, subtitle: '' };
      const total = items.length;
      const done  = items.filter(p => (statuts[p.id] || 'todo') === 'valid').length;

      const head = document.createElement('div');
      head.className = 'group-row';
      head.innerHTML = `
        <div>
          <div class="gtitle">${meta.title}</div>
          <div class="gsub">${meta.subtitle}</div>
        </div>
        <span class="gcount">${done} / ${total} fourni${total > 1 ? 's' : ''}</span>
      `;
      wrap.appendChild(head);

      items.forEach(p => {
        const st = statuts[p.id] || 'todo';
        const hasFile = storedIds.has(p.id);
        const pillClass = st === 'valid' ? 'valid' : st === 'progress' ? 'progress' : st === 'refused' ? 'refused' : 'todo';
        const pillLabel = st === 'valid' ? 'Validé' : st === 'progress' ? 'En attente de vérification' : st === 'refused' ? 'Refusé' : 'À fournir';

        // Boutons : si fichier stocké → Voir + Télécharger + Remplacer ; sinon → Téléverser
        let actions = '';
        if (hasFile){
          actions = `
            <button class="btn btn-ghost" data-action="view" data-piece="${p.id}" title="Aperçu">${ICON_EYE}</button>
            <button class="btn btn-secondary" data-action="download" data-piece="${p.id}" data-piece-name="${p.nm.replace(/"/g,'&quot;')}">${ICON_DL} Télécharger</button>
            <button class="btn btn-ghost" data-action="replace" data-piece="${p.id}" data-piece-name="${p.nm.replace(/"/g,'&quot;')}">${ICON_UP} Remplacer</button>
          `;
        } else {
          actions = `<button class="btn btn-secondary" data-action="upload" data-piece="${p.id}" data-piece-name="${p.nm.replace(/"/g,'&quot;')}">${ICON_UP} Téléverser</button>`;
        }

        const row = document.createElement('div');
        row.className = 'doc-row';
        row.style.gridTemplateColumns = '44px 1fr auto auto'; // garde la grille mais les boutons s'empilent à droite naturellement
        row.innerHTML = `
          <div class="file-ic ${p.type === 'img' ? 'img' : 'pdf'}">${p.type === 'img' ? 'IMG' : 'PDF'}</div>
          <div>
            <div class="nm">${p.nm}</div>
            <div class="for">Pour ${typeof p.for === 'function' ? p.for((activeDossier() || {}).type || 'energetique') : p.for}</div>
          </div>
          <span class="pill ${pillClass}">${pillLabel}</span>
          <div style="display:flex;gap:6px;align-items:center">${actions}</div>
        `;
        wrap.appendChild(row);
      });
    });

    document.getElementById('pieces-count').textContent = pieces.filter(p => (statuts[p.id]||'todo') === 'todo').length + ' à fournir';

    // 4) Branche tous les handlers de boutons
    wrap.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const id = b.dataset.piece;
      const name = b.dataset.pieceName || id;
      const action = b.dataset.action;
      try {
        if (action === 'upload' || action === 'replace'){
          await uploadPieceFile(id, name);
        } else if (action === 'download'){
          await RFFiles.downloadFile(id);
          toast(`« ${name} » téléchargé`);
        } else if (action === 'view'){
          await RFFiles.previewFile(id);
        }
      } catch(e){
        console.warn(action, e);
        toast('Action impossible : ' + (e.message || 'erreur'));
      }
    }));
  }

  function renderDossiers(list){
    const wrap = document.getElementById('dossiers-list');
    wrap.innerHTML = '';
    // Profil actuel + snapshots signés (pour détecter divergence entre snapshot et live)
    const profileLive = JSON.parse(localStorage.getItem('junglerenov.profile') || '{}');
    const snapshots = profileLive.signedSnapshots || {};

    list.forEach(d => {
      const row = document.createElement('div');
      row.className = 'doc-row';
      let pill = '', action = '', warning = '';

      // Détection de divergence : si le dossier est signé et que le total des aides
      // estimé actuel ne matche pas celui du snapshot → on signale au client.
      const snap = snapshots[d.id];
      if (snap && d.status === 'signed'){
        const liveTotal = (profileLive.aids && profileLive.aids.totalAides) || 0;
        const snapTotal = (snap.aids && snap.aids.totalAides) || 0;
        if (Math.abs(liveTotal - snapTotal) > 1){
          const fmtEUR = n => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €';
          warning = `<div class="for" style="color:var(--warning-600);margin-top:4px;font-size:17px">Vos données ont changé depuis la signature : nouvelle estimation <b>${fmtEUR(liveTotal)}</b> · montant signé <b>${fmtEUR(snapTotal)}</b>. Pour un avenant, contactez le support.</div>`;
        }
      }

      // Documents d'AIDE (PTZ, TVA) : toujours téléchargeables, pas de signature
      if (d.kind === 'helper'){
        pill = '<span class="pill ready">Document d\'aide</span>';
        action = `<button class="btn btn-primary" data-dossier="${d.id}">${ICON_DL} Télécharger</button>`;
      }
      // Dossiers MANDATÉS (MPR, CEE) : workflow devis → signature → dépôt
      else if (d.status === 'attente'){
        pill = '<span class="pill attente">En attente de pièces</span>';
        action = '<button class="btn btn-ghost" disabled style="opacity:.5;cursor:not-allowed">Indisponible</button>';
      } else if (d.status === 'ready'){
        pill = '<span class="pill ready">Prêt à signer</span>';
        action =
          `<button class="btn btn-secondary" data-dossier="${d.id}">${ICON_DL} Télécharger</button>` +
          `<button class="btn btn-primary" data-sign="${d.id}" data-name="${d.nm.replace(/"/g,'&quot;')}" style="margin-left:6px">Signer électroniquement</button>`;
      } else if (d.status === 'signed'){
        pill = '<span class="pill signed">✓ Signé</span>';
        action = `<button class="btn btn-primary" data-dossier="${d.id}">${ICON_DL} Télécharger signé</button>`;
      } else if (d.status === 'deposed'){
        pill = '<span class="pill deposed">Déposé</span>';
        action = '<button class="btn btn-secondary">Voir le statut</button>';
      }

      const date = d.date.toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'});
      row.innerHTML = `
        <div class="file-ic gen">DOC</div>
        <div>
          <div class="nm">${d.nm}</div>
          <div class="for">${d.for} · maj ${date}</div>
          ${warning}
        </div>
        ${pill}
        ${action}
      `;
      wrap.appendChild(row);
    });
    document.getElementById('dossiers-count').textContent = list.length + ' formulaire' + (list.length > 1 ? 's' : '');

    wrap.querySelectorAll('[data-dossier]').forEach(b => b.addEventListener('click', () => {
      downloadDossierBrouillon(b.dataset.dossier);
    }));
    wrap.querySelectorAll('[data-sign]').forEach(b => b.addEventListener('click', () => {
      openSignModal(b.dataset.sign, b.dataset.name);
    }));
  }

  /* ───── Signature électronique manuscrite (canvas) ─────
     Capture la signature tracée à la souris/doigt, l'enregistre en base64
     dans profile.signatures, et marque le dossier comme signé dans
     profile.signedDossiers. La signature est ensuite incluse dans le PDF
     brouillon téléchargeable. */
  function openSignModal(dossierId, dossierName){
    // Modal créé à la volée pour éviter de polluer le HTML
    let modal = document.getElementById('sign-modal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'sign-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
    modal.innerHTML =
      '<div style="background:#FFFFFF;border-radius:6px;max-width:520px;width:100%;padding:28px;box-shadow:none">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">' +
          '<div>' +
            '<div style="font:600 17px var(--font-mono);color:var(--teal-700);">Signature électronique</div>' +
            '<h3 style="margin:6px 0 4px;font-size:18px;color:var(--slate-900)">' + escHtml(dossierName) + '</h3>' +
          '</div>' +
          '<button id="sign-cancel" style="background:transparent;border:0;font-size:22px;color:var(--slate-400);cursor:pointer;line-height:1;padding:0">×</button>' +
        '</div>' +
        '<p style="font-size:17px;color:var(--slate-600);margin:0 0 16px;line-height:1.5">Tracez votre signature dans le cadre ci-dessous avec votre souris ou votre doigt. Elle sera apposée sur le brouillon que vous joindrez au dossier officiel.</p>' +
        '<canvas id="sign-canvas" width="460" height="180" style="border:1.5px dashed var(--slate-300);border-radius:6px;width:100%;background:#FFFFFF;touch-action:none;display:block;cursor:crosshair"></canvas>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:17px;color:var(--slate-400)">' +
          '<button id="sign-clear" style="background:transparent;border:0;color:var(--teal-700);cursor:pointer;font-size:17px;font-weight:500">Effacer et recommencer</button>' +
          '<span>Signé le ' + new Date().toLocaleDateString('fr-FR') + '</span>' +
        '</div>' +
        '<div style="margin-top:14px;padding:10px 12px;background:#E9E3D3;border:1px solid #123A2E;border-radius:6px;font-size:17px;color:#123A2E;line-height:1.5">' +
          '<b>Note juridique :</b> cette signature manuscrite numérique a la même valeur qu\'une signature à la main scannée. Accepté par l\'Anah (MaPrimeRénov\') et les obligés CEE. Pour les actes notariés, une signature qualifiée eIDAS est requise (Yousign, Certigna…).' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
          '<button id="sign-cancel-2" class="btn btn-secondary" style="flex:1">Annuler</button>' +
          '<button id="sign-validate" class="btn btn-primary" style="flex:2" disabled>Valider ma signature</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    const canvas = document.getElementById('sign-canvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#123A2E';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let drawing = false, hasInk = false;
    const validateBtn = document.getElementById('sign-validate');

    function getPos(e){
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width;
      const sy = canvas.height / r.height;
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    }
    function start(e){ e.preventDefault(); drawing = true; hasInk = true; validateBtn.disabled = false; validateBtn.style.opacity = 1; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function move(e){ if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    function end(){ drawing = false; }
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    canvas.addEventListener('touchend', end);

    document.getElementById('sign-clear').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk = false; validateBtn.disabled = true; validateBtn.style.opacity = .55;
    });
    function close(){ modal.remove(); }
    document.getElementById('sign-cancel').addEventListener('click', close);
    document.getElementById('sign-cancel-2').addEventListener('click', close);

    validateBtn.style.opacity = .55;
    validateBtn.addEventListener('click', () => {
      if (!hasInk) return;
      const dataURL = canvas.toDataURL('image/png');
      try {
        const p = JSON.parse(localStorage.getItem('junglerenov.profile') || '{}');
        const sigs = Array.isArray(p.signatures) ? p.signatures : [];
        sigs.push({ dossierId, dataURL, signedAt: new Date().toISOString() });
        p.signatures = sigs;
        const signed = Array.isArray(p.signedDossiers) ? p.signedDossiers : [];
        if (!signed.includes(dossierId)) signed.push(dossierId);
        p.signedDossiers = signed;
        // ─── SNAPSHOT figé : on capture l'état du profil au moment de la signature ───
        // Le dossier signé reste immuable même si le client modifie son profil après.
        // Utilisé par downloadDossierBrouillon() pour régénérer un PDF FIDÈLE à la
        // version signée, et par l'UI pour distinguer "estimation actuelle" et
        // "montant figé au moment du dépôt".
        const snapshots = (p.signedSnapshots && typeof p.signedSnapshots === 'object') ? p.signedSnapshots : {};
        snapshots[dossierId] = {
          signedAt:  new Date().toISOString(),
          firstname: p.firstname,
          lastname:  p.lastname,
          email:     p.email,
          address:   p.address,
          logement:  p.logement ? JSON.parse(JSON.stringify(p.logement)) : null,
          foyer:     p.foyer ? JSON.parse(JSON.stringify(p.foyer)) : null,
          travaux:   Array.isArray(p.travaux) ? [...p.travaux] : [],
          aids:      p.aids ? JSON.parse(JSON.stringify(p.aids)) : null,
        };
        p.signedSnapshots = snapshots;
        localStorage.setItem('junglerenov.profile', JSON.stringify(p));
      } catch(e){ console.warn('Save signature :', e); }
      close();
      toast('Signature enregistrée. Téléchargez votre dossier signé.');
      // Re-render la liste pour montrer le nouveau statut "Signé"
      bind();
    });
  }

  function escHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* Génère un VRAI fichier PDF téléchargeable contenant un brouillon de
     formulaire pré-rempli (ANAH MPR, CEE, etc.) à partir des données du
     diagnostic. Plus lisible et directement transmissible.

     Pour les documents d'AIDE (PTZ, TVA), on délègue à RFDocs (_pdf_docs.js)
     pour réutiliser exactement le même PDF que celui généré depuis mes-aides.dc.html. */
  function downloadDossierBrouillon(dossierId){
    const profileLive = JSON.parse(localStorage.getItem('junglerenov.profile') || '{}');

    // ─── SNAPSHOT : si le dossier est signé, on régénère le PDF à partir du
    // snapshot figé au moment de la signature, pas du profil actuel. Garantit
    // que le PDF téléchargé correspond bien au contenu signé électroniquement. ───
    const snap = profileLive.signedSnapshots && profileLive.signedSnapshots[dossierId];
    const profile = snap ? {
      // On reconstitue un profil "comme à la signature" pour les générateurs PDF
      firstname: snap.firstname,
      lastname:  snap.lastname,
      email:     snap.email,
      address:   snap.address,
      logement:  snap.logement,
      foyer:     snap.foyer,
      travaux:   snap.travaux,
      aids:      snap.aids,
      // On conserve les signatures live pour qu'elles soient incluses dans le PDF
      signatures: profileLive.signatures,
      signedDossiers: profileLive.signedDossiers,
    } : profileLive;

    // ─── Documents d'aide : route vers RFDocs ───
    if (dossierId === 'tva'){
      if (!window.RFDocs || !window.RFDocs.generateTvaAttestation){
        toast('Bibliothèque PDF indisponible. Vérifiez votre connexion internet.');
        return;
      }
      try {
        window.RFDocs.generateTvaAttestation(profile);
        toast('Attestation TVA (PDF) téléchargée. À remettre à votre artisan AVANT le début des travaux.');
      } catch(e){ console.warn('TVA :', e); toast('Erreur lors de la génération du PDF.'); }
      return;
    }
    if (dossierId === 'eptz' || dossierId === 'ptz'){
      if (!window.RFDocs || !window.RFDocs.generatePtzDossier){
        toast('Bibliothèque PDF indisponible. Vérifiez votre connexion internet.');
        return;
      }
      // Recalcule le montant éligible (mêmes règles que mes-aides.dc.html)
      const trav = (profile.aids && profile.aids.travaux) || {};
      const totalTTC = trav.totalTTC || 0;
      const totalAides = (profile.aids && profile.aids.totalAides) || 0;
      const rac = Math.max(0, totalTTC - totalAides);
      const sel = (profile.aids && profile.aids.selection) || (profile.travaux) || [];
      const nbGestes = sel.length;
      const onlyMen = nbGestes === 1 && sel.includes('menuiseries');
      let plafond;
      if (onlyMen)              plafond = 7000;
      else if (nbGestes >= 3)   plafond = 30000;
      else if (nbGestes === 2)  plafond = 25000;
      else if (nbGestes === 1)  plafond = 15000;
      else                      plafond = 7000;
      const montant = rac > 0 ? Math.min(rac, plafond) : 0;
      try {
        window.RFDocs.generatePtzDossier(profile, montant);
        toast('Dossier éco-PTZ (PDF) téléchargé. À imprimer et apporter à votre banquier.');
      } catch(e){ console.warn('PTZ :', e); toast('Erreur lors de la génération du PDF.'); }
      return;
    }

    // ─── Brouillons MPR / CEE : génération inline ci-dessous ───
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast('Bibliothèque PDF indisponible. Vérifiez votre connexion internet.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const p = profile;
    const fmt = n => Math.round(n || 0).toLocaleString('fr-FR') + ' €';
    const meta = {
      mpr: {title:"Brouillon MaPrimeRénov'", org:'Anah', portail:'maprimerenov.gouv.fr'},
      cee: {title:"Brouillon demande CEE",   org:'Obligé énergie', portail:'ecologie.gouv.fr/coup-pouce-economies-denergie'},
      ptz: {title:"Brouillon éco-PTZ",       org:'Banque agréée', portail:'service-public.fr (F19905)'},
    }[dossierId] || {title:"Brouillon dossier", org:'—', portail:'—'};
    const aids = (p.aids && p.aids.aides) || {};
    const trav = (p.aids && p.aids.travaux) || {};
    const works = Array.isArray(p.travaux) ? p.travaux.join(', ') : '—';
    const fullName = ((p.firstname || '') + ' ' + (p.lastname || '')).trim() || '—';
    const dateFr = new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});

    const clean = s => String(s == null ? '' : s)
      .replace(/—/g, '-').replace(/–/g, '-')
      .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/€/g, 'EUR').replace(/²/g, '2')
      .replace(/ /g, ' ');
    const fmtClean = n => clean(fmt(n));

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ML = 18, MR = 18, MT = 18;
    let y = MT;
    const lh = 5.5;

    function checkPage(needed){
      if (y + needed > pageH - 18) { doc.addPage(); y = MT; }
    }
    function setFont(style, size, color){
      doc.setFont('helvetica', style || 'normal');
      doc.setFontSize(size || 11);
      const c = color || [30,41,59];
      doc.setTextColor(c[0], c[1], c[2]);
    }
    function row(label, value, bold){
      checkPage(lh + 2);
      setFont('normal', 10, [100,116,139]);
      doc.text(clean(label), ML, y);
      setFont(bold ? 'bold' : 'normal', 10, [15,23,42]);
      const wrapped = doc.splitTextToSize(clean(value || '-'), pageW - ML - MR - 72);
      doc.text(wrapped, ML + 72, y);
      const used = Array.isArray(wrapped) ? wrapped.length : 1;
      doc.setDrawColor(241,245,249); doc.setLineWidth(0.2);
      doc.line(ML, y + 1.5 + (used-1)*lh, pageW - MR, y + 1.5 + (used-1)*lh);
      y += lh * used + 1.5;
    }
    function h2(title){
      checkPage(14); y += 4;
      setFont('bold', 12, [15,23,42]); doc.text(clean(title), ML, y);
      y += 2;
      doc.setDrawColor(226,232,240); doc.setLineWidth(0.4);
      doc.line(ML, y, pageW - MR, y); y += 5;
    }
    function paragraph(t, size, color){
      setFont('normal', size || 10, color || [51,65,85]);
      const wrapped = doc.splitTextToSize(clean(t), pageW - ML - MR);
      wrapped.forEach(line => { checkPage(lh); doc.text(line, ML, y); y += lh; });
    }
    function totalRow(label, value){
      checkPage(lh + 4);
      doc.setFillColor(240,253,250);
      doc.rect(ML, y - 4, pageW - ML - MR, 8, 'F');
      setFont('bold', 11, [15,118,110]);
      doc.text(clean(label), ML + 2, y);
      setFont('bold', 13, [15,118,110]);
      doc.text(clean(value), pageW - MR - 2, y, { align: 'right' });
      y += 8;
    }
    function box(title, body){
      const wrapped = doc.splitTextToSize(clean(body), pageW - ML - MR - 8);
      const h = 8 + wrapped.length * lh + (title ? 6 : 0);
      checkPage(h);
      doc.setFillColor(240,253,250);
      doc.setDrawColor(204,251,241);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, pageW - ML - MR, h, 2, 2, 'FD');
      let cy = y + 6;
      if (title) {
        setFont('bold', 10, [19,78,74]);
        doc.text(clean(title), ML + 4, cy);
        cy += 5;
      }
      setFont('normal', 9.5, [19,78,74]);
      wrapped.forEach(line => { doc.text(line, ML + 4, cy); cy += lh; });
      y += h + 4;
    }

    /* ════ EN-TÊTE ════ */
    setFont('bold', 9, [13,148,136]);
    doc.text('BROUILLON JungleRenov', ML, y);
    y += 8;
    setFont('bold', 19, [15,118,110]);
    doc.text(clean(meta.title), ML, y);
    y += 8;
    setFont('normal', 10, [100,116,139]);
    doc.text(clean("Document généré le " + dateFr + " à destination de : " + meta.org), ML, y);
    y += 8;

    /* ════ 1. DEMANDEUR ════ */
    h2('1. Demandeur');
    row('Nom complet', fullName, true);
    row('Email', p.email || '—');
    row('Adresse du logement', p.address || '—');

    /* ════ 2. LOGEMENT ════ */
    h2('2. Logement');
    row('Type', (p.logement && p.logement.type) || '—');
    row('Surface habitable', ((p.logement && p.logement.surface) ? p.logement.surface + ' m2' : '—'));
    row('Année de construction', (p.logement && p.logement.year) || '—');
    row('Énergie actuelle', (p.logement && p.logement.heat) || '—');
    row('DPE actuel', (p.logement && p.logement.dpe) || 'À confirmer');

    /* ════ 3. FOYER ════ */
    h2('3. Foyer fiscal');
    row('RFR (revenu fiscal de référence)', fmtClean(p.foyer && p.foyer.rfr));
    row('Nombre de personnes', (p.foyer && p.foyer.parts) || '—');
    row('Région', (p.foyer && p.foyer.region) || '—');
    row('Catégorie Anah', (p.foyer && p.foyer.cat) || (p.aids && p.aids.profile && p.aids.profile.cat) || '—', true);

    /* ════ 4. TRAVAUX ════ */
    h2('4. Travaux envisagés');
    row('Postes sélectionnés', works);
    row('Coût HT estimé', fmtClean(trav.totalHT));
    row('Coût TTC estimé (TVA 5,5 %)', fmtClean(trav.totalTTC), true);

    /* ════ 5. AIDES ════ */
    h2('5. Aides estimées');
    row("MaPrimeRénov'", fmtClean(aids.mpr && aids.mpr.total));
    row('CEE — Prime énergie', fmtClean(aids.cee && aids.cee.total));
    row('Aide locale (' + ((aids.local && aids.local.nom) || '—') + ')', fmtClean(aids.local && aids.local.total));
    row('Économie TVA 5,5 %', fmtClean(aids.tva && aids.tva.total));
    y += 2;
    totalRow('Total aides estimées', fmtClean(p.aids && p.aids.totalAides));

    /* ════ ÉTAPES SUIVANTES ════ */
    y += 3;
    box('Étapes suivantes',
        "Ce document n'est pas un dépôt officiel. Il sert de récapitulatif pour préparer votre dossier sur le portail officiel : " + meta.portail + ". Joignez vos pièces (avis d'imposition, devis RGE, photos avant travaux) au moment du dépôt. Si vous nous avez confié le dépôt, JungleRenov s'en charge à votre place via le mandat signé.");

    /* ════ BLOC SIGNATURE ════ */
    const sigs = Array.isArray(p.signatures) ? p.signatures : [];
    const sig = sigs.find(s => s.dossierId === dossierId);
    y += 4;
    if (sig && sig.dataURL) {
      const sigH = 44;
      checkPage(sigH + 4);
      // cadre signé
      doc.setFillColor(240,253,250);
      doc.setDrawColor(15,118,110);
      doc.setLineWidth(0.5);
      doc.roundedRect(ML, y, pageW - ML - MR, sigH, 2, 2, 'FD');
      setFont('bold', 9, [15,118,110]);
      doc.text(clean('✓ SIGNATURE ÉLECTRONIQUE'), ML + 4, y + 6);
      const sd = new Date(sig.signedAt);
      const sigDate = sd.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});
      const sigTime = sd.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
      setFont('normal', 9.5, [19,78,74]);
      doc.text(clean(fullName + ' · Signé le ' + sigDate + ' à ' + sigTime), ML + 4, y + 11);
      // Image de la signature (PNG dataURL)
      try {
        doc.addImage(sig.dataURL, 'PNG', ML + 4, y + 14, 70, 24);
      } catch(e) {
        setFont('italic', 9, [100,116,139]);
        doc.text('(signature non affichable)', ML + 4, y + 22);
      }
      setFont('normal', 8, [15,118,110]);
      const note = "Signature manuscrite numérique apposée via JungleRenov. Valeur juridique équivalente à une signature à la main scannée (acceptée par l'Anah pour MaPrimeRénov' et par les obligés CEE).";
      const noteWrap = doc.splitTextToSize(clean(note), pageW - ML - MR - 80);
      let ny = y + 18;
      noteWrap.forEach(line => { doc.text(line, ML + 80, ny); ny += 4; });
      y += sigH + 4;
    } else {
      const phH = 22;
      checkPage(phH + 2);
      doc.setDrawColor(203,213,225);
      doc.setLineWidth(0.4);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.roundedRect(ML, y, pageW - ML - MR, phH, 2, 2);
      doc.setLineDashPattern([], 0);
      setFont('bold', 11, [100,116,139]);
      doc.text('Zone de signature', pageW / 2, y + 10, { align: 'center' });
      setFont('normal', 9, [148,163,184]);
      doc.text('à signer manuellement avant dépôt', pageW / 2, y + 16, { align: 'center' });
      y += phH + 4;
    }

    /* ════ PIED DE PAGE ════ */
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      setFont('normal', 8, [148,163,184]);
      const footer = "Généré par JungleRenov - édité par Norakt · Estimation indicative selon les barèmes officiels en vigueur le " + dateFr;
      doc.text(clean(footer), pageW / 2, pageH - 10, { align: 'center' });
      doc.text('Page ' + i + ' / ' + pageCount, pageW - MR, pageH - 10, { align: 'right' });
    }

    const filename = 'junglerenov-brouillon-' + dossierId + '-' + new Date().toISOString().slice(0,10) + '.pdf';
    doc.save(filename);
    toast('Brouillon ' + dossierId.toUpperCase() + ' (PDF) téléchargé.');
  }

  function bind(){
    // La page affiche TOUJOURS les sections (pas de spinner d'attente).
    // Si pas de dossier en localStorage, on prend les pièces standard.
    const d = getDossier() || {};
    document.getElementById('docs-main').hidden = false;

    const statuts = (d && d.statutPieces) || {};
    const pieces  = getPieces(d);
    const dossiers = getDossiers(d, pieces, statuts);
    renderPieces(pieces, statuts);
    renderDossiers(dossiers);
    renderGuideDepot();
    adaptTitre();

    // Note : la sidebar (widget aides + profil + lien actif) est gérée
    // par le script "bindings sidebar canonique" injecté en bas de page.
    // Aucune manipulation des anciens IDs (aw-val, nav-docs, me-name, etc.) ici.
  }

  /* Titre et fil d'Ariane : nommer le dispositif réellement ouvert. */
  const TITRES = {
    energetique: { h1: 'Mes documents — Rénovation énergétique', crumb: 'Mon parcours · Rénovation énergétique · Mes documents' },
    autonomie:   { h1: "Mes documents — Adaptation à l'autonomie", crumb: "Mon parcours · MaPrimeAdapt' · Mes documents" },
    indigne:     { h1: 'Mes documents — Habitat dégradé', crumb: 'Mon parcours · Ma Prime Logement Décent · Mes documents' },
  };
  function adaptTitre(){
    var dos = activeDossier();
    if (!dos) return;
    var cfg = TITRES[dos.type] || TITRES.energetique;
    var h1 = document.querySelector('main h1.page-title');
    if (h1) h1.textContent = cfg.h1;
    var crumb = document.querySelector('main .breadcrumb');
    if (crumb) crumb.textContent = cfg.crumb;
  }

  /* Le guide de dépôt décrit un parcours précis : celui de MaPrimeRénov' n'a
     aucun sens sur un dossier Anah piloté par un opérateur. */
  const GUIDE_DEPOT = {
    autonomie: {
      titre: "Déposer mon dossier MaPrimeAdapt' avec mon opérateur AMO",
      etapes: [
        ['Prendre rendez-vous avec votre opérateur AMO', "L'accompagnement par un opérateur habilité par l'Anah est <b>obligatoire</b> pour MaPrimeAdapt'. L'Anah verse un forfait de 350 à 800 € selon le niveau de prestation. Si l'opérateur facture au-delà, la différence reste à votre charge — le montant vous est indiqué par écrit avant tout engagement."],
        ['Attendre le diagnostic autonomie', "L'opérateur visite le logement, évalue les besoins d'adaptation et préconise les travaux finançables. C'est cette simulation qui conditionne le montant retenu."],
        ['Signer le mandat AMO', "Le mandat autorise l'opérateur à déposer le dossier sur <b>monprojet.anah.gouv.fr</b> en votre nom, puis à suivre l'instruction jusqu'au versement."],
      ],
    },
    indigne: {
      titre: 'Déposer mon dossier Ma Prime Logement Décent avec mon opérateur spécialisé',
      etapes: [
        ["Prendre rendez-vous avec un opérateur spécialisé LHI", "Habilité par l'Anah, il est <b>obligatoire</b> sur un dossier habitat dégradé et son accompagnement est financé en partie par l'Anah ; un éventuel solde vous est indiqué par écrit avant tout engagement."],
        ['Audit énergétique et grille de dégradation', "Deux préalables obligatoires : l'audit fixe le gain énergétique visé, la grille d'évaluation détermine votre taux d'aide. L'audit est remboursé par l'Anah."],
        ['Montage et dépôt du dossier', "L'opérateur assemble devis, grille et audit, dépose sur <b>monprojet.anah.gouv.fr</b> et suit l'instruction avec vous jusqu'au versement."],
      ],
    },
  };
  let guideOriginal = null;
  function renderGuideDepot(){
    var host = document.getElementById('depot-etapes');
    var titreEl = document.getElementById('depot-titre');
    if (!host || !titreEl) return;
    if (guideOriginal === null) guideOriginal = { html: host.innerHTML, titre: titreEl.textContent };
    var dos = activeDossier();
    var conf = dos && GUIDE_DEPOT[dos.type];
    if (!conf){ host.innerHTML = guideOriginal.html; titreEl.textContent = guideOriginal.titre; return; }
    titreEl.textContent = conf.titre;
    host.innerHTML = conf.etapes.map(function(e, i){
      var last = i === conf.etapes.length - 1;
      return '<div class="wizard-step" style="background:#FFFFFF;border:1px solid var(--border);border-radius:6px;padding:20px' +
        (last ? '' : ';margin-bottom:14px') + '">' +
        '<div style="display:flex;align-items:flex-start;gap:14px">' +
          '<div style="width:36px;height:36px;border-radius:6px;background:' + (last ? '#E9E3D3;color:#123A2E' : '#1F6B3F;color:#FFFFFF') +
            ';display:grid;place-items:center;font:700 17px var(--font-sans);flex:0 0 auto">' + (i + 1) + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:600;font-size:17px;color:var(--slate-900);margin-bottom:4px">' + e[0] + '</div>' +
            '<div style="font-size:17px;color:var(--slate-600)">' + e[1] + '</div>' +
          '</div>' +
        '</div></div>';
    }).join('');
  }

  // Boutons dropzone — VRAI upload : metadata côté RFStore + binaire dans IndexedDB
  document.getElementById('btn-choose').addEventListener('click', () => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '.pdf,.jpg,.jpeg,.png,.docx';
    i.multiple = true;
    i.onchange = async () => {
      if (!i.files || !i.files.length) return;
      const session = (function(){ try { return JSON.parse(localStorage.getItem('junglerenov.session')||'null'); } catch { return null; }})();
      const clientId = (session && session.id) || 'anonymous';
      for (const f of i.files){
        try {
          const code = 'upload-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
          // 1) Metadata côté RFStore (visible admin, persistance localStorage)
          if (window.RFStore && typeof RFStore.saveDocument === 'function'){
            await RFStore.saveDocument({
              clientId, type:'piece', code, nom: f.name, statut:'fourni',
              metadata: { size: f.size, mime: f.type, uploadedAt: new Date().toISOString() },
            });
          }
          // 2) Binaire côté IndexedDB (pour pouvoir le retélécharger)
          if (window.RFFiles && typeof RFFiles.saveFile === 'function'){
            await RFFiles.saveFile({ id: code, clientId, pieceId: null, file: f, label: f.name });
          }
          toast(`« ${f.name} » ajouté à votre dossier (` + Math.round(f.size/1024) + ' Ko)');
        } catch(e){
          console.warn('Upload :', e);
          toast(`Erreur lors de l'ajout de « ${f.name} »`);
        }
      }
      bind();
    };
    i.click();
  });
  document.getElementById('btn-qr').addEventListener('click', () => {
    toast('Fonctionnalité QR-code à venir. Pour le moment, utilisez « Choisir un fichier ».');
  });

  // RFDossiers et RFCompute sont chargés plus bas : on rend au DOM ready pour
  // que le type de dossier soit connu dès le premier affichage.
  window.RFDocsBind = bind;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
