/* ══════════════════════════════════════════════════════════════════
   JungleRenov — Catalogue des travaux par type de dossier

   Source unique de vérité pour les listes de travaux affichées hors
   tunnel (mon-profil, annuaire artisans). Les identifiants sont ceux
   du moteur `_compute_aids.js` : les modifier casse le calcul.

   Les montants en repère sont les forfaits MaPrimeRénov' 2026 pour les
   ménages très modestes (« bleus »), et les coûts moyens indicatifs
   pour MaPrimeAdapt' — mêmes valeurs que celles du moteur.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var CATALOG = {
    /* Codes identiques à MPR / computeCouts de _compute_aids.js */
    energetique: [
      { id: 'combles',                   label: 'Isolation des combles',              section: 'Isolation thermique',    hint: "jusqu'à 25 €/m²" },
      { id: 'toiture_terrasse',          label: 'Isolation de toiture-terrasse',      section: 'Isolation thermique',    hint: "jusqu'à 75 €/m²" },
      { id: 'ite',                       label: 'Isolation des murs (ITE)',           section: 'Isolation thermique',    hint: "rénovation d'ampleur uniquement" },
      { id: 'menuiseries',               label: 'Fenêtres et menuiseries',            section: 'Isolation thermique',    hint: "jusqu'à 100 € par équipement" },
      { id: 'pac_aireau',                label: 'Pompe à chaleur air/eau',            section: 'Chauffage et eau chaude', hint: "jusqu'à 5 000 €" },
      { id: 'pac_geothermique',          label: 'Pompe à chaleur géothermique',       section: 'Chauffage et eau chaude', hint: "jusqu'à 11 000 €" },
      { id: 'chauffe_eau_thermo',        label: 'Chauffe-eau thermodynamique',        section: 'Chauffage et eau chaude', hint: "jusqu'à 1 200 €" },
      { id: 'chauffe_eau_solaire',       label: 'Chauffe-eau solaire',                section: 'Chauffage et eau chaude', hint: "jusqu'à 4 000 €" },
      { id: 'chauffage_solaire_combine', label: 'Système solaire combiné',            section: 'Chauffage et eau chaude', hint: "jusqu'à 10 000 €" },
      { id: 'pvt_eau',                   label: 'Panneaux hybrides (PVT eau)',        section: 'Chauffage et eau chaude', hint: "jusqu'à 2 500 €" },
      { id: 'raccordement_reseau',       label: 'Raccordement à un réseau de chaleur', section: 'Chauffage et eau chaude', hint: "jusqu'à 1 200 €" },
      { id: 'poele_granules',            label: 'Poêle à granulés',                   section: 'Chauffage et eau chaude', hint: "jusqu'à 1 250 €" },
      { id: 'poele_buches',              label: 'Poêle à bûches',                     section: 'Chauffage et eau chaude', hint: "jusqu'à 1 250 €" },
      { id: 'insert_foyer',              label: 'Insert ou foyer fermé',              section: 'Chauffage et eau chaude', hint: "jusqu'à 1 250 €" },
      { id: 'biomasse',                  label: 'Chaudière biomasse',                 section: 'Chauffage et eau chaude', hint: "CEE ou rénovation d'ampleur" },
      { id: 'vmc_df',                    label: 'VMC double flux',                    section: 'Autres travaux',         hint: "jusqu'à 2 500 € · avec isolation" },
      { id: 'audit_energetique',         label: 'Audit énergétique',                  section: 'Autres travaux',         hint: "jusqu'à 500 € · obligatoire en ampleur" },
      { id: 'depose_cuve_fioul',         label: 'Dépose de cuve à fioul',             section: 'Autres travaux',         hint: "jusqu'à 1 200 €" },
    ],

    /* Codes identiques à MPA_LIBELLES / MPA_COUTS_INDICATIFS */
    autonomie: [
      { id: 'douche_italienne',            label: 'Douche italienne (remplacement baignoire)', section: 'Salle de bain',        hint: '≈ 5 500 €' },
      { id: 'wc_rehausse',                 label: 'WC rehaussé',                              section: 'Salle de bain',        hint: '≈ 650 €' },
      { id: 'barres_appui',                label: "Barres d'appui",                           section: 'Salle de bain',        hint: '≈ 400 €' },
      { id: 'revetement_antiderapant',     label: 'Revêtement antidérapant',                  section: 'Salle de bain',        hint: '≈ 1 200 €' },
      { id: 'mitigeur_thermostatique',     label: 'Mitigeur thermostatique',                  section: 'Salle de bain',        hint: '≈ 350 €' },
      { id: 'rampe_acces',                 label: "Rampe d'accès",                            section: 'Accessibilité',        hint: '≈ 2 500 €' },
      { id: 'monte_escalier',              label: 'Monte-escalier',                           section: 'Accessibilité',        hint: '≈ 6 500 €' },
      { id: 'ascenseur',                   label: 'Ascenseur privé',                          section: 'Accessibilité',        hint: '≈ 25 000 €' },
      { id: 'plateforme_elevatrice',       label: 'Plateforme élévatrice',                    section: 'Accessibilité',        hint: '≈ 9 500 €' },
      { id: 'elargissement_passages',      label: 'Élargissement des passages',               section: 'Accessibilité',        hint: '≈ 2 200 €' },
      { id: 'nouvelle_piece',              label: 'Nouvelle pièce (≤ 20 m²)',                 section: 'Autres aménagements',  hint: '≈ 18 000 €' },
      { id: 'meubles_pmr',                 label: 'Mobilier adapté PMR',                      section: 'Autres aménagements',  hint: '≈ 1 500 €' },
      { id: 'volets_roulants_electriques', label: 'Volets roulants électriques',              section: 'Autres aménagements',  hint: '≈ 4 000 €' },
      { id: 'motorisation_volets',         label: 'Motorisation des volets existants',        section: 'Autres aménagements',  hint: '≈ 2 500 €' },
      { id: 'cheminement_exterieur',       label: 'Aménagement du cheminement extérieur',     section: 'Autres aménagements',  hint: '≈ 3 800 €' },
      { id: 'amenagement_parking',         label: 'Aménagement place de stationnement',       section: 'Autres aménagements',  hint: '≈ 4 500 €' },
    ],

    /* Habitat dégradé : le moteur raisonne en coût global et en état de
       dégradation, pas en gestes. Cette liste sert à orienter la recherche
       d'entreprises, pas le calcul de l'aide. `rge` distingue les lots qui
       exigent une entreprise certifiée RGE (volet énergétique cumulable MPR)
       de ceux qui relèvent de la mise en sécurité et de la salubrité. */
    indigne: [
      { id: 'audit_energetique',   label: 'Audit énergétique',                  section: 'Diagnostic préalable',   hint: "obligatoire · pris en charge par l'Anah", rge: true },
      { id: 'combles',             label: 'Isolation des combles',              section: 'Énergétique cumulable',  hint: 'cumule MPLD et MaPrimeRénov\'', rge: true },
      { id: 'ite',                 label: 'Isolation des murs',                 section: 'Énergétique cumulable',  hint: 'cumule MPLD et MaPrimeRénov\'', rge: true },
      { id: 'pac_aireau',          label: 'Chauffage décarboné (PAC)',          section: 'Énergétique cumulable',  hint: 'cumule MPLD et MaPrimeRénov\'', rge: true },
      { id: 'menuiseries',         label: 'Menuiseries (portes et fenêtres)',   section: 'Énergétique cumulable',  hint: 'cumule MPLD et MaPrimeRénov\'', rge: true },
      { id: 'vmc_df',              label: 'Ventilation',                        section: 'Énergétique cumulable',  hint: 'cumule MPLD et MaPrimeRénov\'', rge: true },
      { id: 'lot_electricite',     label: 'Mise aux normes électriques',        section: 'Mise en sécurité',       hint: 'MPLD · hors RGE', rge: false },
      { id: 'lot_plomberie',       label: 'Mise aux normes plomberie',          section: 'Mise en sécurité',       hint: 'MPLD · hors RGE', rge: false },
      { id: 'lot_toiture',         label: 'Remise en état de la toiture',       section: 'Salubrité',              hint: 'MPLD · hors RGE', rge: false },
      { id: 'lot_humidite',        label: 'Traitement humidité et salubrité',   section: 'Salubrité',              hint: 'MPLD · hors RGE', rge: false },
    ],
  };

  CATALOG.get = function (type) { return CATALOG[type] || CATALOG.energetique; };

  /* Liste plate id + label, pour les usages qui n'ont pas besoin des sections. */
  CATALOG.flat = function (type) {
    return CATALOG.get(type).map(function (t) { return { id: t.id, label: t.label }; });
  };

  /* Groupement par section, dans l'ordre de déclaration. */
  CATALOG.bySection = function (type) {
    var out = [];
    CATALOG.get(type).forEach(function (t) {
      var grp = null;
      for (var i = 0; i < out.length; i++) if (out[i].section === t.section) grp = out[i];
      if (!grp) { grp = { section: t.section, items: [] }; out.push(grp); }
      grp.items.push(t);
    });
    return out;
  };

  /* Libellé humain d'un code, tous types confondus. */
  CATALOG.label = function (id) {
    var types = ['energetique', 'autonomie', 'indigne'];
    for (var i = 0; i < types.length; i++) {
      var list = CATALOG[types[i]];
      for (var j = 0; j < list.length; j++) if (list[j].id === id) return list[j].label;
    }
    return id;
  };

  root.RFTravauxCatalog = CATALOG;
})(window);
