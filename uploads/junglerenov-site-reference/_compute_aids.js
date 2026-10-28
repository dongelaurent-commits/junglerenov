/* CHANGELOG PROMPT 32 (finalisation V1)
   - Item 1 : primeIndividuelle câblée dans computeMprCoproPart (+ totalPersonnel)
   - Item 2 : CLIMAXION_COPRO câblée dans computeCopro (bouquet 2/3 + bonus biosourcés)
   - Item 3 : ECO_PTZ_PLAFONDS + computeEcoPtz + montant retourné dans aides.ecoPtz
   - Item 4 : Non-cumul Prime Air Bois × CEE poêle enforcé (max des deux)
   - Item 5 : Table CEE complétée (plancher_bas, menuiseries, pac_hybride, CESI)
*/
/* CHANGELOG PROMPT 30 (juridique)
   - TVA : formule corrigée à (0.10 − 0.055) = 0.045 (baseline 10 %, pas 20 %)
   - Loc'Avantages : tauxRI dédoublé sans/avec intermédiation locative
*/
/* ──────────────────────────────────────────────────────────────────
   RénoFacile — Moteur de calcul d'aides
   Barèmes officiels : Guide Anah 2026 (édition février 2026)
   "Les aides financières en 2026" — Agence nationale de l'habitat

   Changements structurels 2026 :
     - Isolation des murs (ITE/ITI) : plus finançable par geste MPR
       (reste éligible en rénovation d'ampleur)
     - Chaudière biomasse : plus finançable par geste MPR
       (reste éligible via CEE Coup de pouce chauffage / rénovation d'ampleur)
     - Ménages "supérieurs" (roses) : plus éligibles à MPR par geste
     - Forfait MAR : plafond 2 000 € × taux de prise en charge

   Fonction principale :
     window.RFCompute.compute({
       surface:    Number   (par défaut 110)
       foyer:      Number   (parts fiscales / personnes au foyer)
       rfr:        Number   (revenu fiscal de référence)
       region:     String   ("Auvergne-Rhône-Alpes", "Île-de-France"…)
       heat:       String   ("gaz" | "fioul" | "electrique" | "bois")
       selection:  Array    (codes gestes, cf. MPR ci-dessous)
     })

   Retourne :
     { profile, selection, travaux:{...},
       aides:{mpr,cee,local,tva,ecretement}, energie, totalAides }
   ────────────────────────────────────────────────────────────────── */

(function (root) {
  'use strict';

  /* Registre des barèmes : source unique, avec provenance. Sous node le moteur
     le charge lui-même ; dans le navigateur, _baremes_sources.js est chargé
     avant ce fichier. */
  if (!root.RFBaremes && typeof require === 'function') {
    try { require('./_baremes_sources.js'); } catch (_) {}
  }
  const RB = (root.RFBaremes && root.RFBaremes.BAREMES) || null;
  if (!RB) throw new Error('RénoFacile : _baremes_sources.js doit être chargé avant _compute_aids.js');

  // Plafonds RFR MaPrimeRénov' 2026 — Guide Anah "Les aides financières en 2026" (édition février 2026, page 8)
  // Structure : table[i] = plafond pour (i+1) personnes ; add = incrément par personne supplémentaire au-delà de 5
  const PLAFONDS = {
    hors_idf: {
      bleus:   { table: [17363, 25393, 30540, 35676, 40835], add: 5151 },
      jaunes:  { table: [22259, 32553, 39148, 45735, 52348], add: 6598 },
      violets: { table: [31185, 45842, 55196, 64550, 73907], add: 9357 },
    },
    idf: {
      bleus:   { table: [24031, 35270, 42357, 49455, 56580], add: 7116 },
      jaunes:  { table: [29253, 42933, 51564, 60208, 68877], add: 8663 },
      violets: { table: [40851, 60051, 71846, 84562, 96817], add: 12257 },
    },
  };

  // MaPrimeRénov' 2026 — Parcours par geste
  // Attention : les ménages "roses" (supérieurs) NE SONT PLUS ÉLIGIBLES.
  /* Référentiel en vigueur — décret n° 2026-822 du 25 août 2026 (JO 27/08),
     applicable aux demandes déposées depuis le 1er septembre 2026. Ne restent
     finançables PAR GESTE en métropole que les cinq lignes ci-dessous. */
  const REFERENTIEL = {
    version: '2026-09-01',
    moteur: '2026-09-23.2',   // à incrémenter à chaque changement de règle de calcul
    source: "décret n° 2026-822 du 25 août 2026",
    libelle: "Barèmes au 1er septembre 2026",
  };

  /* Gestes sortis du parcours par geste, TOUJOURS éligibles en rénovation
     d'ampleur. Sert à expliquer pourquoi un geste isolé n'ouvre pas de droit. */
  const MPR_AMPLEUR_SEULEMENT = {
    combles: '01/09/2026', toiture_terrasse: '01/09/2026', menuiseries: '01/09/2026',
    vmc_df: '01/09/2026', chauffe_eau_thermo: '01/09/2026',
    chauffe_eau_solaire: '01/09/2026', chauffage_solaire_combine: '01/09/2026',
    pvt_eau: '01/09/2026', poele_buches: '01/09/2026', poele_granules: '01/09/2026',
    insert_foyer: '01/09/2026', ite: '01/01/2026', biomasse: '01/01/2026',
  };

  /* Guichet MaPrimeRénov' — fermé du 01/01/2026 au 23/02/2026. Toute vue qui
     affiche un montant MPR doit lire ce drapeau. */
  const GUICHET_MPR = { ouvert: true, depuis: '2026-02-23', note: '' };

  const MPR = {
    raccordement_reseau:      { bleus: 1200,  jaunes: 800,   violets: 400,   roses: 0 },
    pac_aireau:               { bleus: 5000,  jaunes: 4000,  violets: 3000,  roses: 0 },
    pac_geothermique:         { bleus: 11000, jaunes: 9000,  violets: 6000,  roses: 0 },
    audit_energetique:        { bleus: 500,   jaunes: 400,   violets: 300,   roses: 0 },
    depose_cuve_fioul:        { bleus: 1200,  jaunes: 800,   violets: 400,   roses: 0 },
    // GESTES SUPPRIMÉS EN 2026 pour MPR par geste :
    //   ite      → encore éligible en rénovation d'ampleur
    //   biomasse → encore éligible via CEE Coup de pouce chauffage
  };

  // Plafonds de dépenses HT éligibles par geste (2026)
  const MPR_PLAFONDS = {
    raccordement_reseau:       1800,
    chauffe_eau_thermo:        3500,
    pac_aireau:               12000,
    pac_geothermique:         18000,
    chauffe_eau_solaire:       7000,
    chauffage_solaire_combine:16000,
    pvt_eau:                   4000,
    poele_buches:              4000,
    poele_granules:            5000,
    insert_foyer:              4000,
    combles:                     75,  // €/m²
    toiture_terrasse:           180,  // €/m²
    menuiseries:               1000,  // €/équipement
    audit_energetique:          800,
    depose_cuve_fioul:         4000,
    vmc_df:                    6000,
  };

  /* Consommation moyenne par classe DPE, kWh/m²/an d'énergie primaire
     (milieu de plage des seuils DPE 2021). */
  const DPE_KWH_M2 = { A: 50, B: 90, C: 145, D: 215, E: 290, F: 375, G: 500 };

  /* Prix moyen du kWh par énergie de chauffage, en euros TTC.
     HYPOTHÈSE DE TRAVAIL à confirmer et à dater — ce ne sont pas des barèmes.
     Tout écran affichant une économie annuelle doit la présenter comme une
     estimation. */
  const PRIX_KWH = { gaz: 0.11, fioul: 0.13, electrique: 0.25, bois: 0.07, aConfirmer: true };

  /* Économie d'énergie annuelle — même règle pour les quatre moteurs :
     consommation de départ lue depuis la classe DPE déclarée, prix du kWh selon
     l'énergie de chauffage. Le résultat est une ESTIMATION, jamais un barème. */
  function economieEnergie(surface, dpe, heat, apresKwhM2) {
    const s = Number(surface) || 0;
    const avantM2 = (dpe && DPE_KWH_M2[dpe]) ? DPE_KWH_M2[dpe] : 278;
    const avant = Math.round(s * avantM2);
    const apres = Math.round(s * apresKwhM2);
    const prixKwh = PRIX_KWH[heat] || PRIX_KWH.gaz;
    return {
      avant: avant, apres: apres,
      economieAn: Math.max(0, Math.round((avant - apres) * prixKwh)),
      prixKwhRetenu: prixKwh, dpeDeclare: dpe || null, hypothese: true,
    };
  }


  // MPR Rénovation d'ampleur 2026 — taux par gain de classes et catégorie
  const MPR_AMPLEUR = {
    gain2: { plafondHT: 30000, taux: { bleus: 0.80, jaunes: 0.60, violets: 0.45, roses: 0.10 } },
    gain3: { plafondHT: 40000, taux: { bleus: 0.80, jaunes: 0.60, violets: 0.45, roses: 0.10 } },
  };

  // Écrêtement rénovation d'ampleur (total aides / TTC travaux)
  const ECRETEMENT_AMPLEUR = RB.ecretement_ampleur.valeur;

  // Écrêtement MPR + CEE (par geste) — plafond en % de la dépense éligible
  // Par geste : 90 / 75 / 60 %, revenus supérieurs non éligibles. 100 % dès
  // qu'une aide locale entre dans le cumul (voir capReg). Source : registre.
  const ECRETEMENT_MPR_CEE = RB.ecretement_geste.valeur;

  /* ══════════════════════════════════════════════════════════════════
     BAREMES BAILLEUR 2026
     ⚠️ Valeurs à valider contre le Guide Anah "Les aides financières
     en 2026" (édition février 2026). Le flag ci-dessous les marque
     comme provisoires — retirer une fois audité.
     ══════════════════════════════════════════════════════════════════ */
  const BAREMES_BAILLEUR_A_VALIDER = false; // Barème = MPR occupant + catégorie RFR bailleur (Guide Anah p.12)

  // Prime sortie de vacance 2026 (Guide Anah p.32). Étendue en 2026 aux 13
  // départements intégralement couverts par le zonage France Ruralité
  // Revitalisation, dont la Haute-Marne (52) et la Meuse (55) en Grand Est.
  const PRIME_SORTIE_VACANCE = {
    montant: 5000,
    conditions: [
      'Logement vacant depuis plus de 2 ans',
      'Zone rurale (INSEE densité classes 5, 6, 7)',
      "OU commune de l'un des 13 départements France Ruralité Revitalisation",
      "Périmètre d'une OPAH ou d'un PIG d'amélioration de l'habitat",
      "Réalisation de travaux subventionnés par l'Anah",
    ],
    depts_frr_grand_est: ['52', '55'],
    depts_frr_hors_grand_est: ['04', '05', '09', '12', '15', '23', '32', '36', '46', '48', '58'],
  };

  const MPR_BAILLEUR_PLAFOND_TRAVAUX = 20000;
  // Écrêtement du cumul d'aides bailleur, en % du coût TTC, par catégorie de revenus
  // (Guide Anah p.29). 'roses' aligné sur 'violets' par prudence.
  const ECRETEMENT_BAILLEUR = { bleus: 0.90, jaunes: 0.75, violets: 0.60, roses: 0.60 };

  // Loc'Avantages 2026 — taux RI et décotes exacts (article 199 tricies du CGI)
  // La constante Grand Est équivalente est LOC_AVANTAGES_GE (subvention Anah régionale).
  const LOC_AVANTAGES = {
    // Barème art. 199 tricies CGI + décret 2022-465 du 31/03/2022.
    // tauxRI = sans intermédiation locative · tauxRI_avec_IL = avec IL.
    loc1: { decoteLoyer: 0.15, tauxRI: 0.15, tauxRI_avec_IL: 0.20, primeAnah: 1000, bonusPassoire: 2000, intermediationRequise: false },
    loc2: { decoteLoyer: 0.30, tauxRI: 0.35, tauxRI_avec_IL: 0.40, primeAnah: 2000, bonusPassoire: 2000, intermediationRequise: false },
    loc3: { decoteLoyer: 0.45, tauxRI: 0.65, tauxRI_avec_IL: 0.65, primeAnah: 3000, bonusPassoire: 2000, intermediationRequise: true },
  };

  const BAREMES_COPRO_A_VALIDER = true;

  // MaPrimeRénov' Copropriété 2026 — aide COLLECTIVE, part personnelle au prorata des tantièmes
  const MPR_COPRO = {
    plafondParLogement: 25000,
    tauxParGain:  { g35: 0.30, g50: 0.45 },
    bonusPassoire: { taux: 0.10 }, // pas de plafond propre : le plafond général par logement suffit
    bonusFragile:  { taux: 0.20 },  // +20 points de taux, sans plafond additionnel (Guide Anah p.27)
    // Assistance à maîtrise d'ouvrage — obligatoire en copropriété (Guide Anah p.26)
    amo: {
      tauxAnah: 0.50,             // 50 % du prix de la prestation
      plafondHTGrandeCopro: 600,  // €/logement pour une copro > 20 logements
      plafondHTPetiteCopro: 1000, // €/logement pour une copro ≤ 20 logements
      plancherCopro: 3000,        // € plancher par copropriété
      obligatoire: true,
    },
    primeIndividuelleBasRevenus: { bleus: 3000, jaunes: 1500, violets: 0, roses: 0 },
  };

  // DPE actuel → gain énergétique cible atteignable (heuristique V1)

  const TVA_APPLICABLE = {
    'occupant': true, 'particulier-nu': true, 'indivision-nu': true,
    'sci-ir-nu': true, 'sci-is': true, 'meuble': true,
    'saisonnier': false, 'copro': true,
  };

  // Éco-PTZ 2026 — plafonds officiels (Guide Anah éd. février 2026, p.44)
  //   - Action seule : 15 000 € (parois vitrées seules : 7 000 €)
  //   - Bouquet 2 actions : 25 000 €  ·  3 actions ou plus : 30 000 €
  //   - Éco-PTZ MaPrimeRénov' (couplé à MPR) : 50 000 € sur 20 ans
  //   - Assainissement non collectif : 10 000 €
  //   - Éco-PTZ Copropriété (performance énergétique globale) : 50 000 €
  const ECO_PTZ_PLAFONDS = {
    action_1_parois_vitrees: 7000,
    action_1_autre:         15000,
    action_2:               25000,
    action_3plus:           30000,
    assainissement:         10000,
    performance_mpr:        50000,
    copro_globale:          50000,
  };

  const ECO_PTZ_APPLICABLE = {
    'occupant': true, 'particulier-nu': true, 'indivision-nu': true,
    'sci-ir-nu': true, 'sci-is': true, 'meuble': true,
    'saisonnier': false, 'copro': true,
  };

  // Louer pour l'Emploi (Métropole du Grand Nancy)
  const LOUER_POUR_EMPLOI_MGN = {
    forfaitMax: 10000,
    dureeMin: 9,
    conditions: [
      'Logement situé sur la Métropole du Grand Nancy',
      'Location à un salarié en mobilité professionnelle',
      'Engagement de location ≥ 9 ans',
      'Loyer sous plafond conventionné',
    ],
  };

  // Forfait Mon Accompagnateur Rénov' 2026 (obligatoire en rénovation d'ampleur)
  // Plafond financement : 2 000 € TTC × taux de prise en charge selon revenus
  const MAR_PLAFOND = RB.mar.plafondTTC;
  const MAR_PLAFOND_RENFORCE = RB.mar.plafondRenforceTTC;
  const MAR_TAUX = RB.mar.priseEnCharge;

  /* ══════════════════════════════════════════════════════════
     MaPrimeAdapt' 2026 — Adaptation à la perte d'autonomie
     Barèmes : Guide Anah éd. février 2026, pp. 57-60
     ══════════════════════════════════════════════════════════ */
  const MPA = {
    plafondTravauxHT: 22000,
    tauxParCategorie: {
      bleus:   0.70,  // très modestes
      jaunes:  0.50,  // modestes
      violets: 0,     // intermédiaires — NON ÉLIGIBLES
      roses:   0,     // supérieurs — NON ÉLIGIBLES
    },
    amo: {
      socle:                { montant: RB.amo_mpa.socle, pris_en_charge: 1.00 },
      complet:              { montant: RB.amo_mpa.complet, pris_en_charge: 1.00 },
      complet_ergotherapie: { montant: RB.amo_mpa.complet_ergotherapie, pris_en_charge: 1.00 },
    },
    travauxEligibles: {
      salle_de_bain: ['douche_italienne','wc_rehausse','barres_appui','revetement_antiderapant','mitigeur_thermostatique'],
      accessibilite: ['rampe_acces','monte_escalier','ascenseur','plateforme_elevatrice','elargissement_passages'],
      autres_amenagements: ['nouvelle_piece','meubles_pmr','volets_roulants_electriques','motorisation_volets','cheminement_exterieur','amenagement_parking'],
    },
    cumulables: ['MPR','MPLD','APA','PCH','AEEH','AAH'],
    nonCumulables: ['credit_impot_autonomie_fin_2023'],
  };

  // Coûts moyens indicatifs par geste MPA (base d'estimation V1)
  const MPA_COUTS_INDICATIFS = {
    douche_italienne:            5500,
    wc_rehausse:                  650,
    barres_appui:                 400,
    revetement_antiderapant:     1200,
    mitigeur_thermostatique:      350,
    rampe_acces:                 2500,
    monte_escalier:              6500,
    ascenseur:                  25000,
    plateforme_elevatrice:       9500,
    elargissement_passages:      2200,
    nouvelle_piece:             18000,
    meubles_pmr:                 1500,
    volets_roulants_electriques: 4000,
    motorisation_volets:         2500,
    cheminement_exterieur:       3800,
    amenagement_parking:         4500,
  };

  const MPA_LIBELLES = {
    douche_italienne:            'Douche italienne (remplacement baignoire)',
    wc_rehausse:                 'WC rehaussé',
    barres_appui:                "Barres d'appui",
    revetement_antiderapant:     'Revêtement antidérapant',
    mitigeur_thermostatique:     'Mitigeur thermostatique',
    rampe_acces:                 "Rampe d'accès",
    monte_escalier:              'Monte-escalier',
    ascenseur:                   'Ascenseur privé',
    plateforme_elevatrice:       'Plateforme élévatrice',
    elargissement_passages:      'Élargissement des passages',
    nouvelle_piece:              'Nouvelle pièce (≤ 20 m²)',
    meubles_pmr:                 'Mobilier adapté PMR',
    volets_roulants_electriques: 'Volets roulants électriques',
    motorisation_volets:         'Motorisation des volets existants',
    cheminement_exterieur:       'Aménagement du cheminement extérieur',
    amenagement_parking:         'Aménagement place de stationnement',
  };

  /* ══════════════════════════════════════════════════════════
     computeMprAdapt — calcul MaPrimeAdapt'
     opts = { rfr, foyer, region, age, gir, handicap, travaux, amoType }
     ══════════════════════════════════════════════════════════ */
  function computeMprAdapt(opts) {
    opts = opts || {};
    const rfr     = Number(opts.rfr) || 0;
    const foyer   = Number(opts.foyer) || 1;
    const region  = opts.region || 'Grand Est';
    const age     = Number(opts.age) || 0;
    const gir     = opts.gir || null;
    const handi   = opts.handicap || 'non';
    const trav    = Array.isArray(opts.travaux) ? opts.travaux : [];
    const amoType = opts.amoType || 'complet';

    // ─── Éligibilité personne ──────────────────────────────────
    let eligiblePersonne = false, motifEligibilite = null;
    if (age >= 70)                         { eligiblePersonne = true; motifEligibilite = 'senior_70plus'; }
    else if (age >= 60 && age < 70 && gir) { eligiblePersonne = true; motifEligibilite = 'senior_60_69_gir'; }
    else if (handi === 'oui_50plus')       { eligiblePersonne = true; motifEligibilite = 'handicap_50plus'; }
    else if (handi === 'oui_pch')          { eligiblePersonne = true; motifEligibilite = 'handicap_pch'; }

    // ─── Éligibilité revenus : bleus ou jaunes uniquement ──────────────
    // RFR non renseigné → catégorie inconnue, on ne présume pas l'éligibilité.
    const cat = rfr > 0 ? categorie(rfr, foyer, region) : null;
    const eligibleRevenu = (cat === 'bleus' || cat === 'jaunes');
    const eligible = eligiblePersonne && eligibleRevenu;

    // ─── Coût des travaux ────────────────────────────────────
    let coutTravaux = 0;
    trav.forEach(t => { coutTravaux += (MPA_COUTS_INDICATIFS[t] || 0); });
    const coutRetenu = Math.min(coutTravaux, MPA.plafondTravauxHT);

    // ─── Aide ─────────────────────────────────────────────
    const taux = (cat && MPA.tauxParCategorie[cat]) || 0;
    const aideTravaux = eligible ? Math.round(coutRetenu * taux) : 0;
    const amoConf = MPA.amo[amoType] || MPA.amo.complet;
    const aideAMO = eligible ? Math.round(amoConf.montant * amoConf.pris_en_charge) : 0;
    const totalAide = aideTravaux + aideAMO;
    // Le reste à charge se calcule sur le coût TTC, comme dans les deux autres
    // moteurs, et l'AMO effectivement pris en charge vient le réduire.
    const coutTTC = Math.round(coutTravaux * 1.055);
    const coutAMOTotal = amoConf.montant || 0;
    const resteAMO = Math.max(0, coutAMOTotal - aideAMO);
    const resteACharge = Math.max(0, coutTTC - aideTravaux + resteAMO);

    return {
      eligible: eligible,
      eligibilite: {
        personne: eligiblePersonne, motif: motifEligibilite,
        revenu: eligibleRevenu, categorie: cat,
      },
      travaux: {
        liste: trav, coutEstime: coutTravaux, coutRetenu: coutRetenu,
        plafond: MPA.plafondTravauxHT,
        // Alias standard, communs aux 3 moteurs : les pages lisent totalHT et
        // totalTTC sans connaître le dispositif. Travaux Anah : TVA à 5,5 %.
        totalHT: coutTravaux, totalTTC: Math.round(coutTravaux * 1.055),
      },
      aide: {
        travaux: aideTravaux, amo: aideAMO, total: totalAide,
        tauxApplique: taux, typeAmo: amoType,
      },
      resteACharge: resteACharge,
      cumulables: MPA.cumulables,
      source: 'Guide Anah éd. février 2026, pp. 57-60',
    };
  }

  /* ═════════════════════════════════════════════════════════════════
     Lutte contre l'Habitat Indigne (LHI) 2026
     Barèmes : Guide Anah éd. février 2026, pp. 63-67
     ═════════════════════════════════════════════════════════════════ */

  // Ma Prime Logement Décent — propriétaires occupants
  const MPLD = {
    ageLogementMin: 15,
    engagementResidencePrincipale: 3,
    travauxGlobalTresDegrade: {
      plafondHT: 70000,
      tauxParCategorie: { bleus: 0.80, jaunes: 0.60, violets: 0, roses: 0 },
      ecretementTTC:    { bleus: 1.00, jaunes: 0.90 },
      primeSortiePassoire: 0.10,
      classeEligibleAvant: ['G','F','E','D','C','B','A'],
      classeSortieMin: 'E',
    },
    // Cas dérogatoire : les travaux n'atteignent pas la classe E
    travauxDerogatoire: {
      plafondHT: 50000,
      tauxParCategorie: { bleus: 0.50, jaunes: 0.50, violets: 0, roses: 0 },
    },
    auditEnergetiqueObligatoire: true,
    accompagnementOperateurObligatoire: true,
    seuilsGrille: { degradation: 0.35, insalubrite: 0.4 },
    arretesPolice: ['peril','insalubrite','securite_equipements_communs','saturnisme'],
  };

  // LHI Propriétaires bailleurs (convention Loc'Avantages obligatoire)
  const LHI_BAILLEUR = {
    types: {
      renovation_globale_tres_degrade: {
        libelle: "Rénovation globale d'un logement très dégradé",
        plafondEurosM2: 1000, surfaceMaxM2: 80, plafondHT: 80000,
        taux: 0.35, ecretementTTC: 0.90,
      },
      securite_salubrite: {
        libelle: "Travaux pour la sécurité et la salubrité de l'habitat",
        plafondEurosM2: 750, surfaceMaxM2: 80, plafondHT: 60000,
        taux: 0.35, ecretementTTC: 0.90,
      },
      moyennement_degrade: {
        libelle: "Rénovation globale d'un logement moyennement dégradé",
        plafondEurosM2: 750, surfaceMaxM2: 80, plafondHT: 60000,
        taux: 0.25, ecretementTTC: 0.90,
      },
    },
    primeGainEnergetique: { seuilGainPct: 35, montantStandard: 1500, montantSortiePassoire: 2000 },
    conventionLocativeObligatoire: true,
    dureeEngagement: 6,
    classeSortieMin: 'D',
    rgeObligatoire: true,
    auditEnergetiqueObligatoire: true,
  };

  // LHI Copropriété (arrêté de police uniquement)
  const LHI_COPRO = {
    taux: 0.50,
    plafondTravaux: null,
    ecretementTTC: 1.00,
    amoObligatoire: true,
    conditions: {
      ageMinAnnees: 15,
      partLogementsResidencePrincipaleMin: 0.75,
      seuilPetiteCopro: 20,
      partLogementsResidencePrincipaleMinPetite: 0.65,
      immatriculationRequise: true,
      arretePoliceRequis: true,
    },
    arretesPoliceEligibles: ['insalubrite','saturnisme','peril','securite_equipements_communs'],
  };

  const LHI_ARRETE_LIBELLES = {
    peril:                        'Péril',
    insalubrite:                  'Insalubrité',
    saturnisme:                   'Saturnisme',
    securite_equipements_communs: 'Sécurité des équipements communs',
  };

  // Alias des états de logement saisis côté UI → clés de LHI_BAILLEUR.types
  const LHI_ETAT_ALIAS = {
    tres_degrade:                    'renovation_globale_tres_degrade',
    renovation_globale_tres_degrade: 'renovation_globale_tres_degrade',
    securite_salubrite:              'securite_salubrite',
    arrete_police:                   'securite_salubrite',
    moyennement_degrade:             'moyennement_degrade',
  };

  /* ═════════════════════════════════════════════════════════════════
     computeMprLogementDecent — MPLD (occupant) + LHI bailleur + LHI copro
     opts = { variant, rfr, foyer, region, ageLogementAnnees, surface,
              coutTravauxHT, dpeAvant, dpeApres, etatLogement,
              conventionLocAvantages, arretePolice, gainEnergetiquePct, nbLotsCopro }
     ═════════════════════════════════════════════════════════════════ */
  /* ─── Aides cumulables avec Ma Prime Logement Décent ──────────────
     Un dossier LHI comporte presque toujours un volet énergétique, qui ouvre
     droit à MaPrimeRénov' rénovation d'ampleur : ses plafonds sont dissociés de
     ceux de MPLD, les deux se cumulent.

     Ce parcours ne saisit pas la liste des gestes (le moteur raisonne en coût
     global et en état de dégradation) : la part énergétique est donc estimée
     depuis la seule donnée énergétique réellement saisie, le saut de classes DPE
     visé. Sans DPE après travaux, aucun montant n'est avancé — mieux vaut
     « — € » qu'un chiffre inventé.

     L'éco-PTZ est un prêt : il est exposé à part et n'entre dans aucun total. */
  /* Coût saisi invraisemblable : sous 1 000 € ou au-delà de 5 000 €/m² de
     surface déclarée. Le tunnel bloque avec « ce montant paraît inhabituel ». */
  function controleVraisemblance(cout, surface) {
    const v = RB.vraisemblance, n = Number(cout) || 0, s = Number(surface) || 0;
    if (n <= 0) return { ok: true };
    if (n < v.coutMin) return { ok: false, motif: 'trop_bas', message: 'Ce montant paraît inhabituel, vérifiez la saisie.' };
    if (s > 0 && n > v.coutMaxParM2 * s) return { ok: false, motif: 'trop_haut', message: 'Ce montant paraît inhabituel, vérifiez la saisie.' };
    return { ok: true };
  }

  /* ── A4 · part énergétique de l'habitat dégradé ──
     Calculée depuis les gestes énergétiques cochés (somme de leurs coûts ÷ coût
     total). Si le montant a été saisi en bloc, l'utilisateur déclare la part
     (opts.partEnergetique, 0 à 1). À défaut seulement, hypothèse de 50 %, signalée. */
  function partEnergetiqueLhi(opts, coutHT) {
    const total = Number(coutHT) || 0;
    const g = Array.isArray(opts.gestesEnergetiques) ? opts.gestesEnergetiques : null;
    if (g && g.length && total > 0) {
      const s = g.reduce((a, x) => a + (Number(x && x.cout) || 0), 0);
      return { part: Math.min(1, s / total), source: 'gestes', hypothese: false };
    }
    const p = Number(opts.partEnergetique);
    if (Number.isFinite(p) && p >= 0 && p <= 1) return { part: p, source: 'declaree', hypothese: false };
    return { part: 0.50, source: 'hypothese', hypothese: true };
  }
  const PART_ENERGETIQUE_LHI = 0.50; // repli signalé, jamais utilisé en silence
  const ORDRE_DPE = ['A','B','C','D','E','F','G'];

  function computeCumulablesLhi(opts, coutHT, aideMpld) {
    const rfr    = Number(opts.rfr) || 0;
    const foyer  = Number(opts.foyer) || 1;
    const region = opts.region || (opts.logement && opts.logement.region) || '';
    const cat    = rfr > 0 ? categorie(rfr, foyer, region) : null;

    const idxAvant = ORDRE_DPE.indexOf(opts.dpeAvant);
    const idxApres = ORDRE_DPE.indexOf(opts.dpeApres);
    const gainClasses = (idxAvant >= 0 && idxApres >= 0) ? Math.max(0, idxAvant - idxApres) : 0;

    // MaPrimeRénov' rénovation d'ampleur : 2 classes gagnées minimum.
    let mprCumulable = 0, mprDetail = null;
    if (gainClasses >= 2 && cat) {
      const conf   = MPR_AMPLEUR[gainClasses >= 3 ? 'gain3' : 'gain2'];
      const taux   = conf.taux[cat] || 0;
      const pe     = partEnergetiqueLhi(opts, coutHT);
      const baseHT = Math.min(Math.round(coutHT * pe.part), conf.plafondHT);
      mprCumulable = Math.round(baseHT * taux);
      mprDetail = {
        gainClasses: gainClasses, partEnergetique: pe.part,
        partEnergetiqueSource: pe.source, partEnergetiqueHypothese: pe.hypothese,
        baseHT: baseHT, plafondHT: conf.plafondHT, taux: taux, categorie: cat,
      };
    }

    // Aides locales : même table que le parcours énergétique, bonus si ampleur.
    const loc = AIDES_LOCALES[region] || null;
    let local = loc ? (gainClasses >= 2 ? loc.base + loc.bonus_gain35 : loc.base) : 0;

    // Plafond de bon sens : le cumul des subventions ne peut pas dépasser le coût
    // TTC du chantier. MPLD est prioritaire (c'est le socle du dossier), les
    // dispositifs cumulables absorbent l'écrêtement.
    const coutTTC = Math.round(coutHT * 1.055);
    let marge = Math.max(0, coutTTC - (Number(aideMpld) || 0));
    const mprAvantEcretement = mprCumulable;
    mprCumulable = Math.min(mprCumulable, marge);
    marge -= mprCumulable;
    const localAvantEcretement = local;
    local = Math.min(local, marge);
    const ecretementCumul = (mprAvantEcretement - mprCumulable) + (localAvantEcretement - local);

    return {
      ecretementCumul: ecretementCumul,
      mprCumulable: mprCumulable,
      mprCumulableDetail: mprDetail,
      local: local,
      localNom: loc ? loc.nom : null,
      // Rénovation lourde par nature : c'est le plafond « performance » qui joue.
      ecoPtz: ECO_PTZ_PLAFONDS.performance_mpr,
      gainClasses: gainClasses,
    };
  }

  function computeMprLogementDecent(opts) {
    opts = opts || {};
    const variant  = opts.variant || 'occupant';
    const rfr      = Number(opts.rfr) || 0;
    const foyer    = Number(opts.foyer) || 1;
    const region   = opts.region || 'Grand Est';
    const surface  = Number(opts.surface) || 0;
    const coutHT   = Number(opts.coutTravauxHT) || 0;
    const dpeAvant = opts.dpeAvant || 'unknown';
    const dpeApres = opts.dpeApres || 'unknown';
    const etat     = LHI_ETAT_ALIAS[opts.etatLogement] || 'moyennement_degrade';
    const ORDRE    = ['A','B','C','D','E','F','G'];

    // Logement de plus de 15 ans requis sur les 3 variantes
    const ageLog = Number(opts.ageLogementAnnees) || 0;
    if (ageLog > 0 && ageLog < MPLD.ageLogementMin) {
      return {
        eligible: false, variant: variant,
        motif: "Les aides à la rénovation d'un logement dégradé concernent les logements construits depuis plus de "
             + MPLD.ageLogementMin + " ans.",
        source: 'Guide Anah éd. février 2026, pp. 63-67',
      };
    }

    // ─── VARIANT OCCUPANT (Ma Prime Logement Décent) ───────────────
    if (variant === 'occupant') {
      const cat = rfr > 0 ? categorie(rfr, foyer, region) : null;
      if (cat !== 'bleus' && cat !== 'jaunes') {
        return {
          eligible: false, variant: 'occupant', categorie: cat,
          motif: cat
            ? "Ma Prime Logement Décent est réservée aux ménages aux revenus modestes ou très modestes."
            : "Le revenu fiscal de référence n'a pas été renseigné : impossible de statuer sur l'éligibilité.",
          source: 'Guide Anah éd. février 2026, p.64',
        };
      }

      const idxApres = ORDRE.indexOf(dpeApres);
      const atteintE = idxApres >= 0 && idxApres <= 4;   // E ou mieux

      let conf, coutRetenu, taux, ecretement;
      if (atteintE) {
        conf = MPLD.travauxGlobalTresDegrade;
        coutRetenu = Math.min(coutHT, conf.plafondHT);
        taux = conf.tauxParCategorie[cat];
        ecretement = conf.ecretementTTC[cat];
      } else {
        conf = MPLD.travauxDerogatoire;
        coutRetenu = Math.min(coutHT, conf.plafondHT);
        taux = conf.tauxParCategorie[cat];
        ecretement = 0.90;
      }

      const aideBase = Math.round(coutRetenu * taux);
      const wasPassoire = (dpeAvant === 'F' || dpeAvant === 'G');
      // La prime de sortie de passoire suppose l'atteinte de la classe D ou
      // mieux à partir de F ou G. La classe E ne l'ouvre pas.
      const atteintD = idxApres >= 0 && idxApres <= 3;
      const primeSortie = (wasPassoire && atteintD)
        ? Math.round(coutRetenu * MPLD.travauxGlobalTresDegrade.primeSortiePassoire) : 0;

      const totalAide  = aideBase + primeSortie;
      const plafondTTC = Math.round((coutHT * 1.055) * ecretement);
      const aideFinale = Math.min(totalAide, plafondTTC);

      const cumulOcc = computeCumulablesLhi(opts, coutHT, aideFinale);
      return {
        eligible: true, variant: 'occupant', categorie: cat,
        travaux: { coutHT: coutHT, coutRetenu: coutRetenu, plafondApplique: conf.plafondHT,
          // Alias standard, communs aux 3 moteurs (TVA 5,5 % sur travaux Anah)
          totalHT: coutHT, totalTTC: Math.round(coutHT * 1.055) },
        aide: {
          base: aideBase, primeSortiePassoire: primeSortie, total: totalAide,
          totalApresEcretement: aideFinale, tauxApplique: taux, ecretement: ecretement,
          // Montant MPLD sous son nom métier, puis les dispositifs cumulables.
          mpld: aideFinale,
          mprCumulable: cumulOcc.mprCumulable,
          mprCumulableDetail: cumulOcc.mprCumulableDetail,
          local: cumulOcc.local, localNom: cumulOcc.localNom,
          ecoPtz: cumulOcc.ecoPtz,
        },
        resteACharge: Math.max(0, Math.round(coutHT * 1.055) - aideFinale),
        derogatoire: !atteintE,
        atteintClasseE: atteintE,
        dpeInconnu: idxApres < 0,
        conditions: {
          auditEnergetique: MPLD.auditEnergetiqueObligatoire,
          accompagnementOperateur: MPLD.accompagnementOperateurObligatoire,
          engagementResidencePrincipale: MPLD.engagementResidencePrincipale + ' ans',
        },
        source: 'Guide Anah éd. février 2026, pp. 64-65',
      };
    }

    // ─── VARIANT BAILLEUR (LHI Bailleur + Loc'Avantages) ───────────
    if (variant === 'bailleur') {
      if (opts.conventionLocAvantages === false) {
        return {
          eligible: false, variant: 'bailleur',
          motif: "Les aides LHI bailleur supposent la signature d'une convention Loc'Avantages : "
               + "un engagement de " + LHI_BAILLEUR.dureeEngagement + " ans de location à loyer plafonné, "
               + "auprès d'un locataire aux ressources plafonnées.",
          source: 'Guide Anah éd. février 2026, p.66',
        };
      }
      const typeConf   = LHI_BAILLEUR.types[etat];
      // Classe de sortie D minimum : c'est une condition de la convention
      // Loc'Avantages, pas un simple avertissement. Un DPE de sortie E, F ou G
      // rend le dossier bailleur inéligible. DPE inconnu (audit non réalisé) :
      // on ne bloque pas, l'utilisateur n'a pas encore l'information.
      const idxSortie = ORDRE.indexOf(dpeApres);
      const idxMin    = ORDRE.indexOf(LHI_BAILLEUR.classeSortieMin);
      if (idxSortie >= 0 && idxSortie > idxMin) {
        return {
          eligible: false, variant: 'bailleur',
          motif: "Les aides bailleur supposent une classe énergétique de sortie "
               + LHI_BAILLEUR.classeSortieMin + " au minimum après travaux, exigée par la convention "
               + "Loc'Avantages. Votre projet vise la classe " + dpeApres + " : renforcez le volet "
               + "énergétique des travaux (isolation, chauffage décarboné) pour ouvrir le droit à l'aide.",
          dpeApres: dpeApres,
          classeSortieMinRequise: LHI_BAILLEUR.classeSortieMin,
          source: 'Guide Anah éd. février 2026, p.66',
        };
      }
      const surfLim    = Math.min(surface || typeConf.surfaceMaxM2, typeConf.surfaceMaxM2);
      const plafondCalc = typeConf.plafondEurosM2 * surfLim;
      const coutRetenu = Math.min(coutHT, plafondCalc);
      const aideBase   = Math.round(coutRetenu * typeConf.taux);

      let primeGain = 0;
      const gainPct = Number(opts.gainEnergetiquePct) || 0;
      if (gainPct >= LHI_BAILLEUR.primeGainEnergetique.seuilGainPct) {
        const wasPassoire = (dpeAvant === 'F' || dpeAvant === 'G');
        const idxA = ORDRE.indexOf(dpeApres);
        const atteintDplus = idxA >= 0 && idxA <= 3;
        primeGain = (wasPassoire && atteintDplus)
          ? LHI_BAILLEUR.primeGainEnergetique.montantSortiePassoire
          : LHI_BAILLEUR.primeGainEnergetique.montantStandard;
      }

      const totalAide  = aideBase + primeGain;
      const plafondTTC = Math.round((coutHT * 1.055) * typeConf.ecretementTTC);
      const aideFinale = Math.min(totalAide, plafondTTC);

      const cumulBail = computeCumulablesLhi(opts, coutHT, aideFinale);
      return {
        eligible: true, variant: 'bailleur', typeTravaux: etat,
        typeLibelle: typeConf.libelle,
        travaux: {
          coutHT: coutHT, coutRetenu: coutRetenu,
          surfacePriseEnCompte: surfLim, plafondApplique: plafondCalc,
          totalHT: coutHT, totalTTC: Math.round(coutHT * 1.055),
        },
        aide: {
          base: aideBase, primeGainEnergetique: primeGain, total: totalAide,
          totalApresEcretement: aideFinale, tauxApplique: typeConf.taux,
          ecretement: typeConf.ecretementTTC,
          mpld: aideFinale,
          mprCumulable: cumulBail.mprCumulable,
          mprCumulableDetail: cumulBail.mprCumulableDetail,
          local: cumulBail.local, localNom: cumulBail.localNom,
          ecoPtz: cumulBail.ecoPtz,
        },
        resteACharge: Math.max(0, Math.round(coutHT * 1.055) - aideFinale),
        conditions: {
          conventionLocativeObligatoire: LHI_BAILLEUR.conventionLocativeObligatoire,
          dureeEngagementAnnees: LHI_BAILLEUR.dureeEngagement,
          classeSortieMin: LHI_BAILLEUR.classeSortieMin,
          rgeObligatoire: LHI_BAILLEUR.rgeObligatoire,
          auditEnergetiqueObligatoire: LHI_BAILLEUR.auditEnergetiqueObligatoire,
        },
        source: 'Guide Anah éd. février 2026, p.66',
      };
    }

    // ─── VARIANT COPRO (arrêté de police requis) ───────────────────
    if (variant === 'copro') {
      if (!opts.arretePolice) {
        return {
          eligible: false, variant: 'copro',
          motif: "L'aide LHI copropriété n'est accessible qu'aux copropriétés faisant l'objet d'un arrêté de "
               + "police administratif (insalubrité, saturnisme, péril ou sécurité des équipements communs).",
          source: 'Guide Anah éd. février 2026, p.67',
        };
      }
      const nbLots  = Number(opts.nbLotsCopro) || 20;
      const isPetite = nbLots <= LHI_COPRO.conditions.seuilPetiteCopro;
      const seuilResPrinc = isPetite
        ? LHI_COPRO.conditions.partLogementsResidencePrincipaleMinPetite
        : LHI_COPRO.conditions.partLogementsResidencePrincipaleMin;

      // Plafond par logement de la voie copropriété, au lieu de plafondTravaux: null.
      const plafondLhiCopro = MPR_COPRO.plafondParLogement * nbLots;
      const coutRetenuCopro = Math.min(coutHT, plafondLhiCopro);
      const aideBase   = Math.round(coutRetenuCopro * LHI_COPRO.taux);
      const plafondTTC = Math.round((coutHT * 1.055) * LHI_COPRO.ecretementTTC);
      const aideFinale = Math.min(aideBase, plafondTTC);

      const cumulCopro = computeCumulablesLhi(opts, coutHT, aideFinale);
      return {
        eligible: true, variant: 'copro',
        travaux: { coutHT: coutHT, coutRetenu: coutRetenuCopro, plafondApplique: plafondLhiCopro,
          totalHT: coutHT, totalTTC: Math.round(coutHT * 1.055) },
        aide: {
          base: aideBase, total: aideBase, totalApresEcretement: aideFinale,
          tauxApplique: LHI_COPRO.taux, ecretement: LHI_COPRO.ecretementTTC,
          mpld: aideFinale,
          mprCumulable: cumulCopro.mprCumulable,
          mprCumulableDetail: cumulCopro.mprCumulableDetail,
          local: cumulCopro.local, localNom: cumulCopro.localNom,
          // Copropriété : c'est le plafond éco-PTZ collectif qui s'applique.
          ecoPtz: ECO_PTZ_PLAFONDS.copro_globale,
        },
        resteACharge: Math.max(0, Math.round(coutHT * 1.055) - aideFinale),
        conditions: {
          amoObligatoire: LHI_COPRO.amoObligatoire,
          immatriculationRequise: LHI_COPRO.conditions.immatriculationRequise,
          seuilResidencePrincipale: seuilResPrinc,
          arretePoliceRequis: true,
        },
        source: 'Guide Anah éd. février 2026, p.67',
      };
    }

    return { eligible: false, motif: 'Variant inconnu' };
  }

  // CEE — Coup de pouce ATEE 2026 (barèmes indicatifs)
  const CEE = {
    combles:                  { precaire: 15,   standard: 12 },
    ite:                      { precaire: 18,   standard: 12 },
    toiture_terrasse:         { precaire: 20,   standard: 14 },
    pac_aireau:               { precaire: 4500, standard: 2500 },
    pac_geothermique:         { precaire: 5000, standard: 3000 },
    biomasse:                 { precaire: 4500, standard: 2500 },
    chauffe_eau_thermo:       { precaire: 800,  standard: 500 },
    chauffage_solaire_combine:{ precaire: 4000, standard: 2500 },
    raccordement_reseau:      { precaire: 900,  standard: 500 },
    poele_granules:           { precaire: 900,  standard: 500 },
    poele_buches:             { precaire: 900,  standard: 500 },
    vmc_df:                   { precaire: 800,  standard: 500 },
    // Ajouts prompt 32 (midranges fourchettes ALEC 3)
    plancher_bas:             { precaire: 8.25, standard: 8.25 },  // €/m²
    menuiseries:              { precaire: 25,   standard: 25   },  // €/m² de fenêtre
    pac_hybride:              { precaire: 795,  standard: 795  },
    chauffe_eau_solaire:      { precaire: 105,  standard: 105  },
  };

  // Aides locales par région (échantillon, base ouverte ADEME)
  const AIDES_LOCALES = {
    'Île-de-France':              { nom: 'Île-de-France Énergies',           base: 1500, bonus_gain35: 1500 },
    'Auvergne-Rhône-Alpes':       { nom: "Écoréno'v Métropole de Lyon",      base: 1500, bonus_gain35: 1500 },
    "Provence-Alpes-Côte d'Azur": { nom: 'Bonus Région PACA',                base: 1000, bonus_gain35: 1000 },
    'Occitanie':                  { nom: 'Éco-chèque logement Occitanie',    base: 1500, bonus_gain35: 1000 },
    'Nouvelle-Aquitaine':         { nom: 'Aide régionale Nouvelle-Aquitaine',base: 1000, bonus_gain35: 1000 },
    'Grand Est':                  { nom: 'Climaxion Grand Est',              base: 1000, bonus_gain35: 800  },
    'Bretagne':                   { nom: 'Bretagne Énergie',                 base: 1000, bonus_gain35: 800  },
    'Hauts-de-France':            { nom: 'Pass Rénovation HDF',              base: 1500, bonus_gain35: 1500 },
    'Normandie':                  { nom: 'Chèque éco-énergie Normandie',     base: 1000, bonus_gain35: 800  },
    'Centre-Val de Loire':        { nom: 'Énergétis Centre-Val de Loire',    base: 800,  bonus_gain35: 800  },
    'Pays de la Loire':           { nom: 'Aide régionale Pays de la Loire',  base: 1000, bonus_gain35: 800  },
    'Bourgogne-Franche-Comté':    { nom: 'Effilogis BFC',                    base: 1000, bonus_gain35: 1000 },
    'Corse':                      { nom: 'Aide Collectivité de Corse',       base: 800,  bonus_gain35: 600  },
    'DROM-COM':                   { nom: 'Aide DROM (variable)',             base: 500,  bonus_gain35: 500  },
  };

  // ─── Grand Est : liste des départements (marché d'amorçage V1) ───
  const DEPTS_GRAND_EST = {
    '08': 'Ardennes', '10': 'Aube', '51': 'Marne', '52': 'Haute-Marne',
    '54': 'Meurthe-et-Moselle', '55': 'Meuse', '57': 'Moselle',
    '67': 'Bas-Rhin', '68': 'Haut-Rhin', '88': 'Vosges',
  };

  // ─── EPCI Grand Est ayant des dispositifs d'aide identifiés ───
  const EPCI_GRAND_EST = {
    'metropole_grand_nancy':    { nom: 'Métropole du Grand Nancy',         dept: '54', hasplan_climat: true,  hasFonds_air_bois: true },
    'eurometropole_strasbourg': { nom: 'Eurométropole de Strasbourg',      dept: '67', hasplan_climat: true,  hasFonds_air_bois: true },
    'mulhouse_alsace_agglo':    { nom: 'Mulhouse Alsace Agglomération',    dept: '68', hasplan_climat: false, hasFonds_air_bois: true },
    'metz_metropole':           { nom: 'Metz Métropole (Eurométropole)',   dept: '57', hasplan_climat: false, hasFonds_air_bois: true },
    'reims_metropole':          { nom: 'Grand Reims',                      dept: '51', hasplan_climat: false, hasFonds_air_bois: false },
    'colmar_agglomeration':     { nom: 'Colmar Agglomération',             dept: '68', hasplan_climat: false, hasFonds_air_bois: true },
    'cc_pays_sel_vermois':      { nom: 'CC des Pays du Sel et du Vermois', dept: '54', hasplan_climat: false, hasFonds_air_bois: false },
    'cc_seille_grand_couronne': { nom: 'CC Seille et Grand Couronné',      dept: '54', hasplan_climat: false, hasFonds_air_bois: false },
    'autre_grand_est':          { nom: 'Autre EPCI Grand Est',             dept: null, hasplan_climat: false, hasFonds_air_bois: false },
  };

  // ─── Climaxion (ADEME + Région Grand Est) — orienté copropriétés ───
  const CLIMAXION_COPRO = {
    bouquet_2_travaux: {
      // Cas 1 : murs + toiture (prime standard)
      murs_toit: {
        copro_10plus: { prime: 12500, aide_par_logement: 1500, plafond_copro: 120000 },
        copro_6_10:   { prime: 12500, aide_par_logement: 1500, plafond_copro: 120000 },
        copro_5moins: { prime: 15000, aide_par_logement: 1500, plafond_copro: 120000 },
      },
      // Cas 2 : murs + plancher bas (prime plus basse)
      murs_plancher_bas: {
        copro_10plus: { prime: 12500, aide_par_logement: 1200, plafond_copro: 96000 },
        copro_6_10:   { prime: 12500, aide_par_logement: 1200, plafond_copro: 96000 },
        copro_5moins: { prime: 15000, aide_par_logement: 1200, plafond_copro: 96000 },
      },
    },
    bouquet_3_travaux: {
      condition: 'Murs + plancher bas + toiture',
      prime_base: { copro_10plus: 10000, copro_6_10: 12500, copro_5moins: 15000 },
      aide_par_logement: 2500,
      plafond_copro: 200000,
    },
    bonus_biosource: { ite_biosource: 2000, iti_biosource: 1000, toiture_biosource: 200, fenetres_bois: 1000 },
    exigences: [
      'Gain énergétique ≥ 50% après travaux',
      "Passage par un maître d'œuvre obligatoire",
      'Amélioration du système de ventilation',
      "Travaux d'isolation plus performants que les autres aides",
    ],
  };
  const CLIMAXION_MAISON = {
    aide_indicative: 1000,
    disponibilite: 'Vérifier appel à projets en cours sur climaxion.fr',
  };

  // ─── Plan Climat Métropole du Grand Nancy — MAISON INDIVIDUELLE (€/m²) ───
  const PLAN_CLIMAT_MGN_MAISON = {
    ite:                { modestes: 40, autres: 30 },
    iti:                { modestes: 10, autres:  5 },
    sarking:            { modestes: 50, autres: 40 },
    combles_perdus:     { modestes: 10, autres:  5 },
    toitures_terrasses: { modestes: 40, autres: 30 },
    planchers_bas:      { modestes: 15, autres: 10 },
    conditions: [
      'Maison individuelle sur territoire Métropole du Grand Nancy',
      'Atteindre au minimum étiquette DPE C après travaux',
      'Demander avant signature des devis',
      'Demander les CEE via Métropole du Grand Nancy (obligatoire)',
    ],
  };

  // ─── Plan Climat Métropole du Grand Nancy — COPROPRIÉTÉS ───
  const PLAN_CLIMAT_MGN_COPRO = {
    audit_energetique: { saine: { taux: 0.5, plafond: 5000 }, fragile: { taux: 0.5, plafond: 5000 } },
    bonus_bbc: {
      saine:   { taux: 0.10, plafond_par_logement: 2500 },
      fragile: { taux: 0.15, plafond_par_logement: 3250 },
      bonus_individuel_modestes: 1500,
    },
    isolation_avant_1948: {
      murs_facade_arriere:      { saine: 30, fragile: 40 },
      sarking_combles_amenages: { saine: 25, fragile: 50 },
      combles_perdus:           { saine:  5, fragile: 10 },
      toitures_terrasses:       { saine: 30, fragile: 40 },
      plancher_bas:             { saine: 10, fragile: 15 },
    },
  };

  // ─── CEE majorés Métropole du Grand Nancy (~15-25 % au-dessus du privé) ───
  const CEE_MGN = {
    volet_isolant: 0, menuiseries: 31, combles: 13.8, toiture_terrasse: 9.75,
    ite: 13, iti: 13, plancher_bas: 8.9,
    pac_eaueau: 4488, pac_aireau: 3587, pac_hybride: 921,
    poele_bois: 200, poele_granules: 200, chauffe_eau_thermo: 118,
    chaudiere_biomasse: 1760, vmc_df: 342,
  };

  // ─── Prime Air Bois (remplacement appareil bois installé avant 2005) ───
  const PRIME_AIR_BOIS = {
    aide_modestes: 2500,
    aide_intermed_sup: 1500,
    conditions: [
      'Remplacer un appareil de chauffage au bois installé avant 2005',
      'Nouvel appareil labellisé Flamme verte ou équivalent',
      'Propriétaire occupant',
      'Logement sur EPCI ayant activé le dispositif Fonds Air Bois',
    ],
  };

  // ─── Aides intercommunales spécifiques ───
  const AIDES_INTERCOMMUNALES = {
    'cc_pays_sel_vermois': {
      nom: 'CC des Pays du Sel et du Vermois',
      conditions: ['Sans condition de ressources', 'Avant début des travaux'],
      aide_isolation: { taux: 0.25, plafond_modestes: 1500, plafond_autres: 1000 },
      aide_enr:       { taux: 0.25, plafond: 2000 },
      cumulable_bouquet: true,
    },
    'cc_seille_grand_couronne': {
      nom: 'CC Seille et Grand Couronné',
      conditions: ['Bouquet ≥ 2 gestes dont 1 isolation', 'Avant début des travaux'],
      aide_bouquet: { modestes: 1250, intermediaires: 1000, superieurs: 850 },
    },
  };

  // ─── Loc'Avantages avec travaux (Anah — bailleurs) ───
  // Barèmes Anah bailleur — Loc'Avantages avec travaux (Guide Anah p.31).
  // Indexé par NATURE des travaux, PAS par niveau de loyer (loc1/2/3) :
  // le niveau de loyer détermine la réduction d'impôt, pas le taux de subvention.
  const LOC_AVANTAGES_GE = {
    taux_par_nature: {
      tres_degrade:       { taux: 0.35, plafond_m2: 1000, plafond_total: 80000 }, // aide max 28 000 €/logt
      securite_salubrite: { taux: 0.35, plafond_m2: 750,  plafond_total: 60000 }, // aide max 21 000 €/logt
      autres_dont_energ:  { taux: 0.25, plafond_m2: 750,  plafond_total: 60000 }, // aide max 15 000 €/logt
    },
    surface_max_m2: 80,
    prime_gain_energetique_35pct: 1500,
    prime_intermediation_locative: null, // montant non chiffré par le Guide 2026
    conditions: [
      'Louer non meublé en résidence principale ≥ 6 ans',
      'Ne pas dépasser plafond loyer (loc1/2/3)',
      'Louer à locataire avec revenus sous plafond (loc1/2/3)',
      'Étiquette D minimum après travaux (E dans certains cas)',
      "Recours à un Accompagnateur Rénov' obligatoire (sauf exceptions)",
      'NON cumulable avec CEE et MPR sur les mêmes travaux',
    ],
  };


  function plafond(zone, cat, foyer) {
    const p = PLAFONDS[zone][cat];
    const n = Math.max(1, Math.round(Number(foyer) || 1));
    // 1 à 5 personnes : valeur officielle du tableau Anah
    if (n <= p.table.length) return p.table[n - 1];
    // Au-delà de 5 : dernier palier + increment par personne supplémentaire
    return p.table[p.table.length - 1] + p.add * (n - p.table.length);
  }

  function normaliseRegion(r) {
    return String(r == null ? '' : r)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function zoneDe(region) {
    return normaliseRegion(region) === 'ile-de-france' ? 'idf' : 'hors_idf';
  }

  function categorie(rfr, foyer, region) {
    // Un revenu absent, nul ou non numérique ne donne PAS une catégorie :
    // il donne null, et l'appelant doit refuser de chiffrer.
    const r = Number(rfr);
    if (!Number.isFinite(r) || r <= 0) return null;
    rfr = r;
    const zone = zoneDe(region);
    if (rfr <= plafond(zone, 'bleus',   foyer)) return 'bleus';
    if (rfr <= plafond(zone, 'jaunes',  foyer)) return 'jaunes';
    if (rfr <= plafond(zone, 'violets', foyer)) return 'violets';
    return 'roses';
  }

  /* ══════════════════════════════════════════════════════════════════
     Calcul spécifique aux propriétaires bailleurs.
     Retour compatible avec le rendu de l'étape 7, logique MPR adaptée.
     ══════════════════════════════════════════════════════════════════ */
  function computeBailleurNu(opts, bailleurCase) {
    opts = opts || {};
    const surface = Number(opts.surface) || 110;
    const region  = opts.region || 'Grand Est';
    const heat    = opts.heat   || 'gaz';
    const sel     = Array.isArray(opts.selection) ? opts.selection : ['combles','pac_aireau'];

    const rent        = Number(opts.rent) || 0;
    const surfaceLoc  = Number(opts.surface_loc) || surface;
    const zone        = opts.zone || 'B1';
    const locLevel    = opts.locLevel || 'none';
    const locDuration = Number(opts.locDuration) || 6;
    const lpe         = opts.lpe || 'no';
    const dept        = opts.dept || null;
    const epci        = opts.epci || null;
    const isGrandEst  = !!opts.isGrandEst || (region && String(region).toLowerCase().includes('grand est'));

    // ─── COÛTS + CEE + TVA (via utilitaires factorisés) ───
    const T = computeCouts(sel, surface);
    const totalCEE = root.RFBaremes.fourchetteCee(computeCEE(sel, 'standard', T.surfCombles, T.surfIte, T.surfToitureTerrasse)).min;
    const tvaSaved = computeTVA(T.totalHT, TVA_APPLICABLE[bailleurCase]);

    // ─── MPR Bailleur — barème IDENTIQUE à l'occupant (Guide Anah p.12) ───
    // Appliqué sur le RFR du bailleur, plafond de travaux éligibles 20 000 € HT/logement.
    const rfrBailleur   = Number(opts.rfr) || 0;
    const foyerBailleur = Number(opts.foyer) || 1;
    let catBailleur = 'violets'; // fallback prudent si RFR non renseigné
    if (rfrBailleur > 0) catBailleur = categorie(rfrBailleur, foyerBailleur, region);

    let mprSum = 0, totalMPR = 0;
    if (catBailleur !== 'roses') {
      // Les ménages roses ne sont plus éligibles à MPR par geste en 2026
      sel.forEach(geste => {
        if (!MPR[geste]) return; // ITE et biomasse exclus du parcours par geste 2026
        // Même règle que l'occupant : l'aide d'un geste ne dépasse ni son coût
        // ni son plafond de dépense éligible.
        const forfait     = MPR[geste][catBailleur] || 0;
        const plafHT      = MPR_PLAFONDS[geste] || 0;
        const coutGeste   = (T.couts && T.couts[geste]) || 0;
        const baseRetenue = plafHT ? Math.min(coutGeste, plafHT) : coutGeste;
        mprSum += Math.min(forfait, baseRetenue);
      });
      mprSum = Math.round(mprSum);
      /* MPR_BAILLEUR_PLAFOND_TRAVAUX est un plafond de TRAVAUX, pas d'aide :
         il borne l'assiette. L'ancien Math.min(mprSum, 20 000) ne mordait
         jamais. L'aide ne peut dépasser la dépense retenue. */
      const assietteBailleur = Math.min(T.totalHT || 0, MPR_BAILLEUR_PLAFOND_TRAVAUX);
      totalMPR = Math.min(mprSum, assietteBailleur);
    }

    // ─── Loc'Avantages ───
    let locAvantagesRI = 0, locAvantagesPrime = 0, locAvantagesDetail = null;
    if (locLevel && locLevel !== 'none' && LOC_AVANTAGES[locLevel]) {
      const conf = LOC_AVANTAGES[locLevel];
      const loyerAnnuelBrut = rent * 12;
      // Par défaut : sans intermédiation locative (taux prudent). IL en option V2.
      const tauxRIEffectif = conf.intermediationRequise ? conf.tauxRI_avec_IL : conf.tauxRI;
      locAvantagesRI = Math.round(loyerAnnuelBrut * tauxRIEffectif * locDuration);
      if (sel.length > 0) {
        locAvantagesPrime = conf.primeAnah;
        const chauffageEnR = sel.includes('pac_aireau') || sel.includes('pac_geothermique')
                          || sel.includes('poele_granules') || sel.includes('chauffage_solaire_combine');
        const isolation = sel.includes('combles') || sel.includes('toiture_terrasse') || sel.includes('ite');
        if (sel.includes('audit_energetique') && isolation && chauffageEnR) {
          locAvantagesPrime += conf.bonusPassoire;
        }
      }
      locAvantagesDetail = {
        niveau: locLevel, decoteLoyer: conf.decoteLoyer, tauxRI: tauxRIEffectif,
        tauxRI_avec_IL_possible: conf.tauxRI_avec_IL,
        loyerAnnuelBrut: loyerAnnuelBrut, duree: locDuration,
        intermediationRequise: conf.intermediationRequise,
      };
    }

    // ─── Louer pour l'Emploi (MGN) ───
    let louerPourEmploi = 0;
    if (lpe === 'yes' && ((epci === 'metropole_grand_nancy' || epci === 'MGN') || dept === '54') && locDuration >= 9) {
      louerPourEmploi = LOUER_POUR_EMPLOI_MGN.forfaitMax;
    }

    // Supplément MPR Copropriété : appartement + travaux collectifs prévus
    let mprCoproSupp = { collective: 0, personnelle: 0, totalPersonnel: 0, applicable: false };
    if ((opts.hasCoproCollectifs === 'yes' || opts.hasCoproCollectifs === 'unknown') && opts.copro) {
      mprCoproSupp = computeMprCoproPart(opts.copro, T.totalHT, {
        rfr: opts.rfr, foyer: opts.foyer, region: opts.region,
      });
    }
    const coproPersoNu = (mprCoproSupp.totalPersonnel || mprCoproSupp.personnelle);

    // Éco-PTZ : montant de prêt mobilisable selon le nombre d'actions
    const ecoPtzMontantNu = ECO_PTZ_APPLICABLE[bailleurCase]
      ? computeEcoPtz(sel, false, false, totalMPR > 0) : 0;

    // ─── Écrêtement bailleur : aides directes ≤ 90 % TTC (RI hors écrêtement) ───
    // Le plafond s'applique au total agrégé, et la réduction est répercutée sur
    // CHAQUE ligne : on rabote MaPrimeRénov' d'abord (dernier entré / premier sorti),
    // puis on répartit le reliquat au prorata, afin que la somme des lignes
    // affichées réconcilie toujours le total (même invariant que computeOccupant).
    // ─── Prime sortie de vacance (Guide Anah p.32) ───────────────
    // Sans question « logement vacant » dans le tunnel, la prime reste à 0 :
    // la logique est en place pour la V2.
    let primeSortieVacance = 0;
    if (opts.logementVacant === 'oui' && Number(opts.dureeVacance) >= 2) {
      const deptsEligibles = PRIME_SORTIE_VACANCE.depts_frr_grand_est
        .concat(PRIME_SORTIE_VACANCE.depts_frr_hors_grand_est);
      if (deptsEligibles.indexOf(dept) !== -1 || opts.zoneRurale === 'oui') {
        primeSortieVacance = PRIME_SORTIE_VACANCE.montant;
      }
    }

    const totalDirect = totalMPR + totalCEE + locAvantagesPrime + louerPourEmploi
                      + coproPersoNu + primeSortieVacance;
    const tauxEcretBailleur = ECRETEMENT_BAILLEUR[catBailleur] || 0.60;
    const plafondDirect = Math.round(T.totalTTC * tauxEcretBailleur);
    let ecretementApplique = 0, totalDirectFinal = totalDirect;
    let mprFinal = totalMPR, ceeFinal = totalCEE, primeFinal = locAvantagesPrime,
        lpeFinal = louerPourEmploi, coproFinal = coproPersoNu;
    if (totalDirect > plafondDirect) {
      ecretementApplique = totalDirect - plafondDirect;
      totalDirectFinal = plafondDirect;
      const surMpr = Math.min(totalMPR, ecretementApplique);
      mprFinal = totalMPR - surMpr;
      const reste = ecretementApplique - surMpr;
      if (reste > 0) {
        const coproInit = coproPersoNu;
        const autres = totalCEE + locAvantagesPrime + louerPourEmploi + coproInit;
        if (autres > 0) {
          const ratio = Math.max(0, 1 - reste / autres);
          ceeFinal   = Math.round(totalCEE          * ratio);
          primeFinal = Math.round(locAvantagesPrime * ratio);
          lpeFinal   = Math.round(louerPourEmploi   * ratio);
          coproFinal = Math.round(coproPersoNu * ratio);
        } else {
          ceeFinal = primeFinal = lpeFinal = coproFinal = 0;
        }
      }
      mprCoproSupp = Object.assign({}, mprCoproSupp, {
        personnelle: coproFinal, totalPersonnel: coproFinal, brut: coproPersoNu,
      });
    }

    const nrj = economieEnergie(surface, opts.dpe || opts.dpeCurrent, opts.heat, 145);
    const conso_avant = nrj.avant;
    const conso_apres = nrj.apres;
    const economie_an = nrj.economieAn;

    return {
      profile: {
        surface, region, heat, dept, epci, isGrandEst,
        ownerType: 'bailleur', bailleurCase: bailleurCase,
        rent, surfaceLoc, zone, locLevel, locDuration, lpe,
      },
      selection: sel,
      travaux: { ...T.couts, totalHT: T.totalHT, totalTTC: T.totalTTC, surfCombles: T.surfCombles,
                 surfIte: T.surfIte, surfToitureTerrasse: T.surfToitureTerrasse, nbMenuiseries: T.nbMenuiseries },
      aides: {
        mpr: {
          total: mprFinal, brut: totalMPR, postes: mprSum, ampleur: 0, forfaitMar: 0,
          isRenovAmpleur: false, plafondHT: MPR_BAILLEUR_PLAFOND_TRAVAUX,
          taux: 0, variant: 'bailleur',
          /* Un bailleur ne peut être aidé que pour trois logements au plus.
             Le calcul reste par logement ; l'écran doit signaler le dépassement. */
          logementsDeclares: Number(opts.nbLogementsBailleur) || 1,
          depasseTroisLogements: (Number(opts.nbLogementsBailleur) || 1) > 3,
          logementsAides: Math.min(3, Number(opts.nbLogementsBailleur) || 1),
        },
        cee:   { total: ceeFinal, brut: totalCEE, tier: 'standard', min: ceeFinal, max: Math.round(ceeFinal * RB.cee.ecartMax / RB.cee.ecartMin), unique: false },
        local: { total: 0, nom: null, bonus: false },
        tva:   { total: tvaSaved },
        ecoPtz: { eligible: ecoPtzMontantNu > 0, montant: ecoPtzMontantNu, duree_max_annees: dureeEcoPtz(ecoPtzMontantNu) },
        primeSortieVacance: { total: primeSortieVacance, montant: PRIME_SORTIE_VACANCE.montant,
                              applicable: primeSortieVacance > 0, conditions: PRIME_SORTIE_VACANCE.conditions },
        locAvantages: {
          prime: primeFinal, brut: locAvantagesPrime, ri: locAvantagesRI,
          total: primeFinal + locAvantagesRI, detail: locAvantagesDetail,
        },
        louerPourEmploi: { total: lpeFinal, brut: louerPourEmploi, conditions: LOUER_POUR_EMPLOI_MGN.conditions },
        mprCoproSupplement: mprCoproSupp,
      coproQuotePart: coproFinal,
        ecretement: { applique: ecretementApplique > 0, montant: ecretementApplique, plafond: plafondDirect },
      },
      energie: { avant: conso_avant, apres: conso_apres, economieAn: economie_an },
      // Aides réellement perçues au titre des travaux, après écrêtement.
      // Hors économie TVA (exposée dans aides.tva / economieTva) et hors
      // réduction d'impôt Loc'Avantages, qui est étalée sur la durée
      // d'engagement et exposée dans aides.locAvantages.ri / reductionImpot.
      totalAides: totalDirectFinal,
      economieTva: tvaSaved,
      reductionImpot: locAvantagesRI,
    };
  }

  /* ══════════════════════════════════════════════════════════════════
     computeBailleurRestreint : SCI IS, meublé, saisonnier
     Ces cas n'ont PAS droit à MPR Bailleur ni Loc'Avantages.
     Seuls CEE / TVA (selon table) / éco-PTZ (selon table) s'appliquent.
     ══════════════════════════════════════════════════════════════════ */
  function computeBailleurRestreint(opts, bailleurCase) {
    opts = opts || {};
    const surface = Number(opts.surface) || 110;
    const region  = opts.region || 'Grand Est';
    const heat    = opts.heat   || 'gaz';
    const sel     = Array.isArray(opts.selection) ? opts.selection : ['combles','pac_aireau'];
    const dept    = opts.dept || null;
    const epci    = opts.epci || null;
    const isGrandEst = !!opts.isGrandEst || (region && String(region).toLowerCase().includes('grand est'));

    const T = computeCouts(sel, surface);
    const totalCEE = root.RFBaremes.fourchetteCee(computeCEE(sel, 'standard', T.surfCombles, T.surfIte, T.surfToitureTerrasse)).min;
    const tvaSaved = computeTVA(T.totalHT, TVA_APPLICABLE[bailleurCase]);
    const ecoPtzEligible = ECO_PTZ_APPLICABLE[bailleurCase];
    const ecoPtzMontantR = ecoPtzEligible ? computeEcoPtz(sel, false, false, false) : 0;

    // Supplément MPR Copropriété : un lot en copro engageant des travaux collectifs
    // ouvre droit à la quote-part, même dans les cas restreints (SCI IS, meublé…).
    let mprCoproSupp = { collective: 0, personnelle: 0, totalPersonnel: 0, applicable: false };
    if ((opts.hasCoproCollectifs === 'yes' || opts.hasCoproCollectifs === 'unknown') && opts.copro) {
      mprCoproSupp = computeMprCoproPart(opts.copro, T.totalHT, {
        rfr: opts.rfr, foyer: opts.foyer, region: opts.region,
      });
    }

    const totalDirect = totalCEE + (mprCoproSupp.totalPersonnel || mprCoproSupp.personnelle);
    // Cas restreint (meublé, SCI IS…) : pas de catégorie RFR mobilisable → plancher prudent
    const plafondDirect = Math.round(T.totalTTC * ECRETEMENT_BAILLEUR.violets);
    const ecretementApplique = Math.max(0, totalDirect - plafondDirect);
    // Répercute l'écrêtement sur chaque ligne pour que la somme réconcilie le total
    let ceeFinal = totalCEE, coproFinal = mprCoproSupp.personnelle;
    if (ecretementApplique > 0 && totalDirect > 0) {
      const ratio = Math.max(0, 1 - ecretementApplique / totalDirect);
      ceeFinal   = Math.round(totalCEE * ratio);
      coproFinal = Math.round(mprCoproSupp.personnelle * ratio);
      mprCoproSupp = Object.assign({}, mprCoproSupp, { personnelle: coproFinal, brut: mprCoproSupp.personnelle });
    }
    const totalDirectFinal = Math.min(totalDirect, plafondDirect);

    return {
      profile: { surface, region, heat, dept, epci, isGrandEst,
                 ownerType: 'bailleur', bailleurCase: bailleurCase },
      selection: sel,
      travaux: Object.assign({}, T.couts, { totalHT: T.totalHT, totalTTC: T.totalTTC,
                 surfCombles: T.surfCombles, surfIte: T.surfIte,
                 surfToitureTerrasse: T.surfToitureTerrasse, nbMenuiseries: T.nbMenuiseries }),
      aides: {
        mpr:  { total: 0, postes: 0, ampleur: 0, forfaitMar: 0, isRenovAmpleur: false,
                plafondHT: 0, taux: 0, variant: 'restreint', reason: bailleurCase },
        cee:  { total: ceeFinal, brut: totalCEE, tier: 'standard', min: ceeFinal, max: Math.round(ceeFinal * RB.cee.ecartMax / RB.cee.ecartMin), unique: false },
        local:{ total: 0, nom: null, bonus: false },
        tva:  { total: tvaSaved, applicable: TVA_APPLICABLE[bailleurCase] },
        ecoPtz: { eligible: ecoPtzMontantR > 0, montant: ecoPtzMontantR, duree_max_annees: dureeEcoPtz(ecoPtzMontantR) },
        locAvantages:    { prime: 0, ri: 0, total: 0, detail: null, applicable: false, reason: bailleurCase },
        louerPourEmploi: { total: 0, applicable: false, reason: bailleurCase },
        mprCoproSupplement: mprCoproSupp,
      coproQuotePart: coproFinal,
        ecretement: { applique: ecretementApplique > 0, montant: ecretementApplique, plafond: plafondDirect },
      },
      energie: economieEnergie(surface, opts.dpe || opts.dpeCurrent, opts.heat, 145),
      // Hors économie TVA (exposée dans aides.tva / economieTva).
      totalAides: ceeFinal + coproFinal,
      economieTva: tvaSaved,
    };
  }

  /* ══════════════════════════════════════════════════════════════════
     computeCopro : copropriété — travaux sur parties communes
     MPR Copro est une aide COLLECTIVE ; part personnelle au prorata
     des tantièmes. Estimation strictement indicative (vote AG + MAR).
     ══════════════════════════════════════════════════════════════════ */
  function computeCopro(opts) {
    opts = opts || {};
    const surface = Number(opts.surface) || 110;
    const region  = opts.region || 'Grand Est';
    const heat    = opts.heat   || 'gaz';
    const sel     = Array.isArray(opts.selection) ? opts.selection : ['combles','pac_aireau'];
    const dept    = opts.dept || null;
    const epci    = opts.epci || null;
    const isGrandEst = !!opts.isGrandEst || (region && String(region).toLowerCase().includes('grand est'));

    const copro = opts.copro || {};
    const nbLogements = Math.max(2, Number(copro.lots) || 20);
    const tantiemes   = Math.max(1, Number(copro.tantiemes) || 400);
    const dpe         = copro.dpe || 'unknown';
    const fragile     = copro.fragile === 'yes';
    const hasMar      = copro.mar === 'yes';

    const T = computeCouts(sel, surface);

    const baseCollectiveMax = MPR_COPRO.plafondParLogement * nbLogements;
    /* Le coût collectif n'est JAMAIS déduit du coût privatif : il doit être
       voté en AG ou devisé. Sans lui, aucune aide collective n'est chiffrée —
       l'ancien `T.totalHT × nbLogements` inventait 261 600 € d'aide sur 20 lots. */
    const coutCollectifSaisi = Number(copro.coutTravauxCollectifs);
    const coutCollectifConnu = Number.isFinite(coutCollectifSaisi) && coutCollectifSaisi > 0;
    // Préremplissage : estimation déduite du coût privatif, SIGNALÉE (estime: true)
    // tant que l'utilisateur n'a pas saisi le montant voté ou devisé.
    const coutTotalCopro    = coutCollectifConnu ? coutCollectifSaisi : Math.round(T.totalHT * nbLogements);
    const baseEligible      = Math.min(coutTotalCopro, baseCollectiveMax);

    /* Le gain énergétique est certifié par l'audit, pas déduit du DPE actuel.
       Sans gain saisi, hypothèse basse (35 %, taux de 30 %), signalée. */
    // « au moins 35 % » (g35), « au moins 50 % » (g50), « pas encore défini » (nd → 35 %, signalé)
    const gainSaisiCopro = (copro.gainVise === 'g50' || copro.gainVise === 'g35') ? copro.gainVise : null;
    const gain = gainSaisiCopro || 'g35';
    const tauxBase = MPR_COPRO.tauxParGain[gain] || MPR_COPRO.tauxParGain.g35;

    let aideCollective = baseEligible * tauxBase;
    /* Bonus passoire : sortie en classe D ou mieux APRÈS travaux, à partir de
       F ou G. Jugé sur le DPE projeté — jamais sur le DPE actuel seul. */
    const dpeApresCopro = copro.dpeApres || null;
    const isPassoire = (dpe === 'F' || dpe === 'G')
      && (copro.sortiePassoire === 'oui' || ['A','B','C','D'].indexOf(dpeApresCopro) !== -1);
    if (isPassoire) {
      aideCollective += baseEligible * MPR_COPRO.bonusPassoire.taux;
    }
    if (fragile) {
      // Copro fragile : +20 points du taux de subvention, sans plafond additionnel (Guide Anah p.27)
      aideCollective += Math.round(baseEligible * MPR_COPRO.bonusFragile.taux);
    }
    aideCollective = Math.round(aideCollective);
    const partPersonnelle = Math.round(aideCollective * (tantiemes / 10000));

    // Prime individuelle bas revenus si l'utilisateur a renseigné un RFR
    // Cible : 3 000 € (bleus), 1 500 € (jaunes), 0 (violets/roses) — Guide Anah p.27
    let primeIndiv = 0;
    try {
      const rfrCopro   = Number(opts.rfr) || 0;
      const foyerCopro = Number(opts.foyer) || 4;
      if (rfrCopro > 0) {
        const catCopro = categorie(rfrCopro, foyerCopro, region);
        primeIndiv = (MPR_COPRO.primeIndividuelleBasRevenus && MPR_COPRO.primeIndividuelleBasRevenus[catCopro]) || 0;
      }
    } catch (_) { primeIndiv = 0; }

    const totalCEE     = root.RFBaremes.fourchetteCee(computeCEE(sel, 'standard', T.surfCombles, T.surfIte, T.surfToitureTerrasse)).min;
    const totalCEEPart = Math.round(totalCEE * (tantiemes / 10000) * nbLogements);
    const tvaSaved     = computeTVA(T.totalHT, TVA_APPLICABLE.copro);

    // ─── Plan Climat Métropole Grand Nancy — copropriété ─────────────
    // Calculé au niveau COLLECTIF, puis quote-part au prorata des tantièmes.
    let planClimatCollectif = 0;
    try {
      if (isGrandEst && (epci === 'metropole_grand_nancy' || epci === 'MGN')) {
        const pc = PLAN_CLIMAT_MGN_COPRO;
        const etat = fragile ? 'fragile' : 'saine';

        // Audit énergétique : 50 % TTC plafonné (5 000 €/copro)
        if (sel.includes('audit_energetique') && pc.audit_energetique[etat]) {
          const a = pc.audit_energetique[etat];
          planClimatCollectif += Math.min(a.plafond || 0, (a.taux || 0) * (T.couts.audit_energetique || 0));
        }

        // Bonus BBC après travaux (gain ≥ 50 %)
        if (gain === 'g50' && pc.bonus_bbc[etat]) {
          const b = pc.bonus_bbc[etat];
          planClimatCollectif += Math.min(baseEligible * (b.taux || 0),
                                          (b.plafond_par_logement || 0) * nbLogements);
        }

        // Bonus « isolation avant 1948 » : absent du barème sourcé, non appliqué.
        const anneeCopro = Number(copro.annee) || 0;
        if (false && anneeCopro > 0 && anneeCopro < 1948) {
          const iso = pc.isolation_avant_1948;
          const gestesMGN = [
            { code: 'ite',              bar: iso.murs_facade_arriere,      surface: T.surfIte },
            { code: 'sarking',          bar: iso.sarking_combles_amenages, surface: T.surfCombles },
            { code: 'combles',          bar: iso.combles_perdus,           surface: T.surfCombles },
            { code: 'toiture_terrasse', bar: iso.toitures_terrasses,       surface: T.surfToitureTerrasse },
            { code: 'plancher_bas',     bar: iso.plancher_bas,             surface: Math.round(surface * 0.9) },
          ];
          gestesMGN.forEach(g => {
            if (!sel.includes(g.code) || !g.bar) return;
            planClimatCollectif += g.surface * (g.bar[etat] || 0) * nbLogements;
          });
        }
      }
    } catch (_) { planClimatCollectif = 0; }
    planClimatCollectif = Math.round(planClimatCollectif);
    // Prime individuelle modestes (Plan Climat MGN) : versée au copropriétaire
    let planClimatIndiv = 0;
    if (planClimatCollectif > 0 && primeIndiv > 0 && PLAN_CLIMAT_MGN_COPRO.bonus_bbc.bonus_individuel_modestes) {
      planClimatIndiv = PLAN_CLIMAT_MGN_COPRO.bonus_bbc.bonus_individuel_modestes;
    }
    const planClimatCopro = Math.round(planClimatCollectif * (tantiemes / 10000)) + planClimatIndiv;

    // ─── Climaxion Copropriété (Région Grand Est + ADEME) ─────────────
    let climaxionCopro = 0;
    let climaxionDetail = null;
    try {
      if (isGrandEst) {
        const nbLog = nbLogements;
        const tailleCopro = nbLog >= 11 ? 'copro_10plus' : nbLog >= 6 ? 'copro_6_10' : 'copro_5moins';
        const hasMurs     = sel.includes('ite') || sel.includes('iti');
        const hasToit     = sel.includes('toiture_terrasse') || sel.includes('combles');
        const hasPlancher = sel.includes('plancher_bas');
        const hasBouquet3 = hasMurs && hasToit && hasPlancher;
        let bouquet2Type = null;
        if (hasMurs && hasToit)          bouquet2Type = 'murs_toit';
        else if (hasMurs && hasPlancher) bouquet2Type = 'murs_plancher_bas';

        // Le bouquet 3 n'est pas réservé aux copropriétés de 11 logements et plus.
        if (hasBouquet3 && CLIMAXION_COPRO.bouquet_3_travaux) {
          const conf3 = CLIMAXION_COPRO.bouquet_3_travaux;
          const prime3 = (conf3.prime_base && conf3.prime_base[tailleCopro]) || 0;
          const aide3 = Math.min(prime3 + (conf3.aide_par_logement || 0) * nbLog,
                                 conf3.plafond_copro || Infinity);
          climaxionCopro += aide3;
          climaxionDetail = { bouquet: 3, aide: aide3 };
        } else if (bouquet2Type && CLIMAXION_COPRO.bouquet_2_travaux[bouquet2Type]) {
          const conf2 = CLIMAXION_COPRO.bouquet_2_travaux[bouquet2Type][tailleCopro];
          if (conf2) {
            const aide2 = Math.min((conf2.prime || 0) + (conf2.aide_par_logement || 0) * nbLog,
                                   conf2.plafond_copro || Infinity);
            climaxionCopro += aide2;
            climaxionDetail = { bouquet: 2, type: bouquet2Type, aide: aide2 };
          }
        }

        // Bonus biosourcés (cumulables au bouquet), uniquement si un bouquet est retenu
        // Bonus réservés aux matériaux biosourcés : sans déclaration explicite,
        // ils ne sont pas accordés.
        const bonusBio = CLIMAXION_COPRO.bonus_biosource;
        if (climaxionCopro > 0 && bonusBio && opts.biosource === true) {
          if (sel.includes('ite'))         climaxionCopro += (bonusBio.ite_biosource || 0) * nbLog;
          if (sel.includes('iti'))         climaxionCopro += (bonusBio.iti_biosource || 0) * nbLog;
          if (hasToit)                     climaxionCopro += (bonusBio.toiture_biosource || 0) * nbLog;
          if (sel.includes('menuiseries')) climaxionCopro += (bonusBio.fenetres_bois || 0) * nbLog;
        }
      }
    } catch (_) { climaxionCopro = 0; }
    climaxionCopro = Math.round(climaxionCopro);
    // Quote-part du copropriétaire sur l'aide collective Climaxion
    const climaxionPart = Math.round(climaxionCopro * (tantiemes / 10000));

    const ecoPtzMontantCopro = computeEcoPtz(sel, true, gain === 'g50', true);

    const totalDirect = partPersonnelle + primeIndiv + totalCEEPart + planClimatCopro + climaxionPart;
    // ─── Aide AMO copropriété (Guide Anah p.26) ──────────────────
    // L'accompagnement est obligatoire ; l'Anah en finance 50 %, dans la limite
    // d'un plafond par logement qui dépend de la taille de la copropriété.
    const plafondAMOParLog = (nbLogements <= 20)
      ? MPR_COPRO.amo.plafondHTPetiteCopro
      : MPR_COPRO.amo.plafondHTGrandeCopro;
    const coutAMOEstime = Math.max(MPR_COPRO.amo.plancherCopro, plafondAMOParLog * nbLogements * 0.5);
    const aideAMOCollective  = Math.round(coutAMOEstime * MPR_COPRO.amo.tauxAnah);
    const aideAMOPersonnelle = Math.round(aideAMOCollective * (tantiemes / 10000));

    // Guide Anah p.29 : le plafond du cumul global en copropriété est de 100 % TTC
    const plafondDirect = Math.round(T.totalTTC * 1.00);
    const ecretementApplique = Math.max(0, totalDirect - plafondDirect);
    const totalDirectFinal = Math.min(totalDirect, plafondDirect);

    return {
      profile: {
        surface, region, heat, dept, epci, isGrandEst,
        ownerType: 'bailleur', bailleurCase: 'copro',
        copro: { nbLogements, tantiemes, dpe, fragile, hasMar, gainRetenu: gain, annee: copro.annee || null },
      },
      selection: sel,
      travaux: Object.assign({}, T.couts, { totalHT: T.totalHT, totalTTC: T.totalTTC,
                 surfCombles: T.surfCombles, surfIte: T.surfIte,
                 surfToitureTerrasse: T.surfToitureTerrasse, nbMenuiseries: T.nbMenuiseries }),
      aides: {
        mpr: { total: 0, postes: 0, ampleur: 0, variant: 'copro' },
        mprCopro: {
          aideCollective: aideCollective, partPersonnelle: partPersonnelle,
          primeIndividuelle: primeIndiv, gainRetenu: gain,
          bonusPassoire: isPassoire, bonusFragile: fragile,
      coutCollectifConnu: coutCollectifConnu,
      gainHypothese: !gainSaisiCopro,
      coutCopro: { montant: coutTotalCopro, estime: !coutCollectifConnu },
      gainCoproHypothese: !gainSaisiCopro,
      motifNonChiffre: null,
      avertissement: coutCollectifConnu ? null : 'Estimation, à ajuster avec le montant voté.',
          marIdentifie: hasMar, plafondCollectif: baseCollectiveMax,
          estimationIndicative: true,
        },
        cee:  { total: totalCEEPart, tier: 'standard', variant: 'copro-quotepart' },
        planClimatMgnCopro: { total: planClimatCopro, collectif: planClimatCollectif,
                              primeIndividuelle: planClimatIndiv, applicable: planClimatCopro > 0 },
        climaxionCopro: { total: climaxionCopro, partPersonnelle: climaxionPart,
                          applicable: climaxionCopro > 0, detail: climaxionDetail },
        local:{ total: 0, nom: null, bonus: false },
        tva:  { total: tvaSaved },
        ecoPtz: { eligible: ecoPtzMontantCopro > 0, montant: ecoPtzMontantCopro,
                  duree_max_annees: dureeEcoPtz(ecoPtzMontantCopro), variant: 'collectif' },
        mprCoproAMO: { collective: aideAMOCollective, personnelle: aideAMOPersonnelle,
                       coutEstime: coutAMOEstime, tauxAnah: MPR_COPRO.amo.tauxAnah,
                       plafondParLogement: plafondAMOParLog, obligatoire: true },
        locAvantages:    { prime: 0, ri: 0, total: 0, applicable: false, reason: 'copro' },
        louerPourEmploi: { total: 0, applicable: false, reason: 'copro' },
        ecretement: { applique: ecretementApplique > 0, montant: ecretementApplique, plafond: plafondDirect },
      },
      energie: economieEnergie(surface, opts.dpe || opts.dpeCurrent, opts.heat, 145),
      // Hors économie TVA (exposée dans aides.tva / economieTva).
      totalAides: totalDirectFinal,
      economieTva: tvaSaved,
    };
  }

  /* ══════════════════════════════════════════════════════════════════
     Utilitaires partagés
     ══════════════════════════════════════════════════════════════════ */
  function computeCouts(sel, surface) {
    const surfCombles         = sel.includes('combles')          ? Math.round(surface * 0.82) : 0;
    // Surface d'ITE plafonnée à 100 m² pour le COÛT : elle doit l'être aussi
    // pour toutes les aides qui s'y adossent, sinon l'aide peut dépasser la
    // dépense sur cette ligne.
    const surfIte             = sel.includes('ite')              ? Math.min(Math.round(surface * 0.60), 100) : 0;
    const surfToitureTerrasse = sel.includes('toiture_terrasse') ? Math.round(surface * 0.50) : 0;
    const nbMenuiseries       = sel.includes('menuiseries')      ? 6 : 0;
    const couts = {
      combles:                  surfCombles * 45,
      ite:                      surfIte * 180,
      toiture_terrasse:         surfToitureTerrasse * 220,
      menuiseries:              nbMenuiseries * 800,
      raccordement_reseau:      sel.includes('raccordement_reseau')       ? 3500  : 0,
      chauffe_eau_thermo:       sel.includes('chauffe_eau_thermo')        ? 3200  : 0,
      pac_aireau:               sel.includes('pac_aireau')                ? 14500 : 0,
      pac_geothermique:         sel.includes('pac_geothermique')          ? 22000 : 0,
      chauffe_eau_solaire:      sel.includes('chauffe_eau_solaire')       ? 6500  : 0,
      chauffage_solaire_combine:sel.includes('chauffage_solaire_combine') ? 15000 : 0,
      pvt_eau:                  sel.includes('pvt_eau')                   ? 12000 : 0,
      poele_buches:             sel.includes('poele_buches')              ? 4200  : 0,
      poele_granules:           sel.includes('poele_granules')            ? 4800  : 0,
      insert_foyer:             sel.includes('insert_foyer')              ? 3500  : 0,
      biomasse:                 sel.includes('biomasse')                  ? 15000 : 0,
      audit_energetique:        sel.includes('audit_energetique')         ? 900   : 0,
      depose_cuve_fioul:        sel.includes('depose_cuve_fioul')         ? 1200  : 0,
      vmc_df:                   sel.includes('vmc_df')                    ? 5500  : 0,
    };
    const totalHT  = Object.values(couts).reduce((s, v) => s + v, 0);
    const totalTTC = Math.round(totalHT * 1.055);
    return { couts, totalHT, totalTTC, surfCombles, surfIte, surfToitureTerrasse, nbMenuiseries };
  }

  function computeCEE(sel, tier, surfCombles, surfIte, surfToitureTerrasse, nbMenuiseries, surfPlancherBas) {
    // Fallbacks V1 : 1,5 m² par menuiserie, 80 m² de plancher bas si non saisi.
    const nbMen  = Number(nbMenuiseries) || (sel.includes('menuiseries') ? 6 : 0);
    const surfPB = Number(surfPlancherBas) || (sel.includes('plancher_bas') ? 80 : 0);
    let total = 0;
    Object.keys(CEE).forEach(geste => {
      if (!sel.includes(geste)) return;
      const cc = CEE[geste];
      if (!cc) return;
      const val = cc[tier] || 0;
      if (geste === 'combles')               total += surfCombles * val;
      else if (geste === 'ite')              total += Math.min(surfIte, 100) * val;
      else if (geste === 'toiture_terrasse') total += surfToitureTerrasse * val;
      else if (geste === 'menuiseries')      total += nbMen * 1.5 * val;
      else if (geste === 'plancher_bas')     total += surfPB * val;
      else                                   total += val;
    });
    return Math.round(total);
  }

  /* Éco-PTZ : plafond de prêt selon le nombre d'actions (Guide Anah p.44).
     mprFunded = MPR effectivement accordée (par geste ou ampleur) → c'est
     l'Éco-PTZ MaPrimeRénov' à 50 000 € qui s'applique. */
  function computeEcoPtz(sel, isCopro, isG50, mprFunded) {
    // L'audit et la dépose de cuve ne comptent pas comme des « actions » éco-PTZ
    const gestesEnergie = (sel || []).filter(g => g !== 'audit_energetique' && g !== 'depose_cuve_fioul');
    const nb = gestesEnergie.length;
    if (!nb) return 0;

    // Copropriété : performance énergétique globale → 50 000 €
    if (isCopro) return isG50 ? ECO_PTZ_PLAFONDS.copro_globale : ECO_PTZ_PLAFONDS.action_2;

    // Éco-PTZ MaPrimeRénov' : couplé à une aide MPR effectivement accordée → 50 000 €
    if (mprFunded && gestesEnergie.some(g => MPR[g] !== undefined)) return ECO_PTZ_PLAFONDS.performance_mpr;

    // Éco-PTZ classique
    if (nb === 1) {
      return gestesEnergie[0] === 'menuiseries'
        ? ECO_PTZ_PLAFONDS.action_1_parois_vitrees
        : ECO_PTZ_PLAFONDS.action_1_autre;
    }
    if (nb === 2) return ECO_PTZ_PLAFONDS.action_2;
    return ECO_PTZ_PLAFONDS.action_3plus;
  }

  /* Durée maximale de remboursement de l'éco-PTZ (Guide Anah p.44) :
     20 ans pour l'éco-PTZ MaPrimeRénov' / performance globale, 15 ans sinon. */
  function dureeEcoPtz(montant){
    return (Number(montant) || 0) >= ECO_PTZ_PLAFONDS.performance_mpr ? 20 : 15;
  }

  function computeTVA(totalHT, applicable) {
    if (!applicable) return 0;
    // Baseline TVA travaux logement = 10 % (art. 279-0 bis CGI)
    // Taux réduit rénovation énergétique = 5,5 % (art. 278-0 bis A CGI)
    // Économie réelle = HT × (0.10 − 0.055) = 0.045
    return Math.round(totalHT * (0.10 - 0.055));
  }

  /* ══════════════════════════════════════════════════════════════════
     ROUTER PRINCIPAL — dispatche vers la bonne fonction selon le cas
     ══════════════════════════════════════════════════════════════════ */
  function compute(opts) {
    opts = opts || {};
    const ownerType    = opts.ownerType || opts.status || 'occupant';
    const bailleurCase = opts.bailleurCase
                         || (ownerType === 'bailleur' ? 'particulier-nu' : 'occupant');

    switch (bailleurCase) {
      case 'occupant':          return computeOccupant(opts);
      case 'particulier-nu':
      case 'indivision-nu':
      case 'sci-ir-nu':         return computeBailleurNu(opts, bailleurCase);
      case 'sci-is':            return computeBailleurRestreint(opts, 'sci-is');
      case 'meuble':            return computeBailleurRestreint(opts, 'meuble');
      case 'saisonnier':        return computeBailleurRestreint(opts, 'saisonnier');
      case 'copro':             return computeCopro(opts);
      default:                  return computeOccupant(opts);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     computeMprCoproPart — part personnelle MaPrimeRénov' Copropriété.
     Utilisée EN SUPPLÉMENT par les parcours PO et bailleur individuel,
     pour un appartement dont la copropriété engage des travaux collectifs.
     Ne concerne pas le parcours dédié 'copro' (voir computeCopro).
     ══════════════════════════════════════════════════════════════════ */
  function computeMprCoproPart(copro, totalHTPrivatif, opts){
    if (!copro) return { collective: 0, personnelle: 0, applicable: false };
    const nbLogements = Math.max(2, Number(copro.lots) || 20);
    const tantiemes   = Math.max(1, Number(copro.tantiemes) || 400);
    const dpe         = copro.dpe || 'unknown';
    const fragile     = copro.fragile === 'yes';

    const baseCollectiveMax = MPR_COPRO.plafondParLogement * nbLogements;
    /* Même règle que computeCopro : le coût collectif est saisi (voté ou
       devisé), jamais fabriqué à partir du coût privatif. */
    const coutCollectifSaisi = Number(copro.coutTravauxCollectifs);
    const coutCollectifConnu = Number.isFinite(coutCollectifSaisi) && coutCollectifSaisi > 0;
    const coutTotalCopro = coutCollectifConnu ? coutCollectifSaisi : Math.round((Number(totalHTPrivatif) || 0) * nbLogements);
    const baseEligible = Math.min(coutTotalCopro, baseCollectiveMax);

    // « au moins 35 % » (g35), « au moins 50 % » (g50), « pas encore défini » (nd → 35 %, signalé)
    const gainSaisiCopro = (copro.gainVise === 'g50' || copro.gainVise === 'g35') ? copro.gainVise : null;
    const gain = gainSaisiCopro || 'g35';
    const tauxBase = MPR_COPRO.tauxParGain[gain] || MPR_COPRO.tauxParGain.g35;

    let aideCollective = baseEligible * tauxBase;
    const dpeApresCopro = copro.dpeApres || null;
    const sortiePassoire = (dpe === 'F' || dpe === 'G')
      && (copro.sortiePassoire === 'oui' || ['A','B','C','D'].indexOf(dpeApresCopro) !== -1);
    if (sortiePassoire) {
      aideCollective += baseEligible * MPR_COPRO.bonusPassoire.taux;
    }
    if (fragile) {
      // Copro fragile : +20 points du taux de subvention, sans plafond additionnel (Guide Anah p.27)
      aideCollective += Math.round(baseEligible * MPR_COPRO.bonusFragile.taux);
    }
    aideCollective = Math.round(aideCollective);
    const personnelle = Math.round(aideCollective * (tantiemes / 10000));

    // Prime individuelle bas revenus si RFR renseigné (Guide Anah p.27)
    let primeIndividuelle = 0;
    try {
      if (opts && Number(opts.rfr) > 0) {
        const cat = categorie(Number(opts.rfr), Number(opts.foyer) || 4, opts.region || 'Grand Est');
        primeIndividuelle = (MPR_COPRO.primeIndividuelleBasRevenus && MPR_COPRO.primeIndividuelleBasRevenus[cat]) || 0;
      }
    } catch (_) { primeIndividuelle = 0; }

    return {
      collective: aideCollective, personnelle: personnelle,
      primeIndividuelle: primeIndividuelle,
      totalPersonnel: personnelle + primeIndividuelle,
      gainRetenu: gain, gainHypothese: !gainSaisiCopro,
      bonusPassoire: sortiePassoire, bonusFragile: fragile,
      nbLogements, tantiemes, dpe, coutCollectifConnu: coutCollectifConnu,
      estimationIndicative: true, applicable: personnelle > 0,
      coutCopro: { montant: coutTotalCopro, estime: !coutCollectifConnu },
      gainCoproHypothese: !gainSaisiCopro,
      motifNonChiffre: null,
      avertissement: coutCollectifConnu ? null : 'Estimation, à ajuster avec le montant voté.',
    };
  }

  function computeOccupant(opts) {
    opts = opts || {};
    const surface = Number(opts.surface) || 110;
    const foyer   = Number(opts.foyer)   || 4;
    const rfr     = Number(opts.rfr);
    const region  = opts.region || null;
    const heat    = opts.heat   || 'gaz';
    const sel     = Array.isArray(opts.selection) ? opts.selection : [];

    const cat     = categorie(rfr, foyer, region);

    // Sans revenu fiscal déclaré, aucun montant n'est calculable. On refuse
    // plutôt que de retomber sur une valeur par défaut : l'ancien repli à
    // 32 000 € plaçait silencieusement le foyer dans la tranche la plus aidée.
    if (cat === null) {
      return { eligible: false, motif: 'RFR non renseigné',
        message: "Indiquez votre revenu fiscal de référence pour obtenir une estimation.",
        profile: { surface, foyer, rfr: null, region, cat: null, heat },
        selection: sel, totalAides: null, referentiel: REFERENTIEL };
    }
    if (!region) {
      return { eligible: false, motif: 'Région non renseignée',
        message: "Indiquez votre commune : les plafonds de ressources et les aides locales en dépendent.",
        profile: { surface, foyer, rfr, region: null, cat: null, heat },
        selection: sel, totalAides: null, referentiel: REFERENTIEL };
    }
    const ceeTier = (cat === 'bleus' || cat === 'jaunes') ? 'precaire' : 'standard';

    // ─── COÛTS DES TRAVAUX ───
    const surfCombles         = sel.includes('combles')          ? Math.round(surface * 0.82) : 0;
    // Surface d'ITE plafonnée à 100 m² pour le COÛT : elle doit l'être aussi
    // pour toutes les aides qui s'y adossent, sinon l'aide peut dépasser la
    // dépense sur cette ligne.
    const surfIte             = sel.includes('ite')              ? Math.min(Math.round(surface * 0.60), 100) : 0;
    const surfToitureTerrasse = sel.includes('toiture_terrasse') ? Math.round(surface * 0.50) : 0;
    const nbMenuiseries       = sel.includes('menuiseries')      ? 6 : 0;

    const couts = {
      combles:                  surfCombles         * 45,
      ite:                      surfIte * 180,
      toiture_terrasse:         surfToitureTerrasse * 220,
      menuiseries:              nbMenuiseries       * 800,
      raccordement_reseau:      sel.includes('raccordement_reseau')      ? 3500  : 0,
      chauffe_eau_thermo:       sel.includes('chauffe_eau_thermo')       ? 3200  : 0,
      pac_aireau:               sel.includes('pac_aireau')               ? 14500 : 0,
      pac_geothermique:         sel.includes('pac_geothermique')         ? 22000 : 0,
      chauffe_eau_solaire:      sel.includes('chauffe_eau_solaire')      ? 6500  : 0,
      chauffage_solaire_combine:sel.includes('chauffage_solaire_combine')? 15000 : 0,
      pvt_eau:                  sel.includes('pvt_eau')                  ? 12000 : 0,
      poele_buches:             sel.includes('poele_buches')             ? 4200  : 0,
      poele_granules:           sel.includes('poele_granules')           ? 4800  : 0,
      insert_foyer:             sel.includes('insert_foyer')             ? 3500  : 0,
      biomasse:                 sel.includes('biomasse')                 ? 15000 : 0,
      audit_energetique:        sel.includes('audit_energetique')        ? 900   : 0,
      depose_cuve_fioul:        sel.includes('depose_cuve_fioul')        ? 1200  : 0,
      vmc_df:                   sel.includes('vmc_df')                   ? 5500  : 0,
    };
    const totalHT  = Object.values(couts).reduce((s, v) => s + v, 0);
    // Le taux réduit de 5,5 % n'est pas acquis dans tous les cas : quand il ne
    // s'applique pas, le TTC se calcule à 10 % et le reste à charge grandit.
    const tvaReduite = opts.tvaReduite !== false;
    const totalTTC = Math.round(totalHT * (tvaReduite ? 1.055 : 1.10));

    // ─── DÉTECTION RÉNOVATION D'AMPLEUR ───
    // Critères Anah 2026 : audit énergétique + ≥ 2 gestes d'isolation + gain ≥ 2 classes DPE
    const isolationCount = (sel.includes('combles')?1:0) + (sel.includes('ite')?1:0)
                          + (sel.includes('toiture_terrasse')?1:0) + (sel.includes('menuiseries')?1:0);
    const chauffageEnR = sel.includes('pac_aireau') || sel.includes('pac_geothermique')
                       || sel.includes('biomasse')  || sel.includes('poele_buches')
                       || sel.includes('poele_granules') || sel.includes('insert_foyer')
                       || sel.includes('chauffage_solaire_combine') || sel.includes('pvt_eau');
    const isRenovAmpleur = isolationCount >= 2 && chauffageEnR;

    // ─── CALCUL MPR (rénovation d'ampleur OU par geste) ───
    let mprPostes = 0;
    let mprAmpleur = 0;
    let mprPlafondHT = 0;
    let mprTaux = 0;
    let forfaitMar = 0;
    const gestesHorsParcoursGeste = [];

    // Le gain de classes NE SE DÉDUIT PAS du nombre de gestes cochés : il est
    // certifié par l'audit. Sans gain saisi, on retient l'hypothèse basse.
    const gainSaisi = Number(opts.gainClasses);
    const gainConnu = Number.isFinite(gainSaisi) && gainSaisi >= 2;
    const auditManquant = !sel.includes('audit_energetique');

    if (isRenovAmpleur) {
      const scenario = (gainConnu && gainSaisi >= 3) ? 'gain3' : 'gain2';
      const conf = MPR_AMPLEUR[scenario];
      mprPlafondHT = conf.plafondHT;
      mprTaux = conf.taux[cat];
      const baseHT = Math.min(totalHT, mprPlafondHT);
      mprAmpleur = Math.round(baseHT * mprTaux);
      forfaitMar = Math.round((opts.accompagnementRenforce ? MAR_PLAFOND_RENFORCE : MAR_PLAFOND) * MAR_TAUX[cat]);
    } else {
      // Par geste — seuls les gestes de la table MPR ouvrent droit à une aide,
      // et l'aide ne peut dépasser ni le coût du geste ni le plafond de
      // dépense éligible.
      let sum = 0;
      Object.keys(MPR).forEach(geste => {
        if (!sel.includes(geste)) return;
        const forfait     = MPR[geste][cat] || 0;
        const plafHT      = MPR_PLAFONDS[geste];
        const coutGeste   = couts[geste] || 0;
        const baseRetenue = plafHT ? Math.min(coutGeste, plafHT) : coutGeste;
        sum += Math.min(forfait, baseRetenue);
      });
      if (cat === 'roses') sum = 0;
      mprPostes = Math.round(sum);
      sel.forEach(g => {
        if (MPR_AMPLEUR_SEULEMENT[g]) {
          gestesHorsParcoursGeste.push({ geste: g, depuis: MPR_AMPLEUR_SEULEMENT[g] });
        }
      });
    }

    // Le forfait d'accompagnement n'est pas une aide sur les travaux : les
    // honoraires du MAR ne sont pas dans le coût des travaux, l'ajouter au
    // total gonflerait le taux de couverture et minorerait le reste à charge.
    const totalMPR = mprAmpleur + mprPostes;

    // ─── CEE ───
    let ceeSum = 0;
    Object.keys(CEE).forEach(geste => {
      if (!sel.includes(geste)) return;
      const tarif = CEE[geste][ceeTier];
      if (geste === 'combles')               ceeSum += surfCombles * tarif;
      else if (geste === 'ite')              ceeSum += surfIte * tarif;
      else if (geste === 'toiture_terrasse') ceeSum += surfToitureTerrasse * tarif;
      else if (geste === 'menuiseries')      ceeSum += nbMenuiseries * 1.5 * tarif;
      else if (geste === 'plancher_bas')     ceeSum += 80 * tarif;
      else                                   ceeSum += tarif;
    });
    // CEE NON cumulable avec MaPrimeRénov' rénovation d'ampleur (parcours accompagné).
    // C'est la règle que la carte « Scénario C » affiche à l'utilisateur.
    let totalCEE = isRenovAmpleur ? 0 : Math.round(ceeSum);
    const ceeBrut  = Math.round(ceeSum);
    // Le total retient la borne basse (prudente) ; l'écran affiche la fourchette.
    const ceeFourchette = root.RFBaremes.fourchetteCee(totalCEE);
    totalCEE = ceeFourchette.min;

    // L'écrêtement est calculé plus bas (bloc « ÉCRÊTEMENT GLOBAL »), une seule fois.
    let ecretement = null;

    // ─── AIDE LOCALE ───
    // Aucune aide inventée pour une région non documentée : on n'affiche rien
    // plutôt qu'un montant sous un libellé qui n'identifie aucun dispositif.
    let loc = AIDES_LOCALES[region] || { nom: null, base: 0, bonus_gain35: 0 };
    const anyWork = sel.length > 0;
    let totalLocal = !anyWork ? 0 : (isRenovAmpleur ? (loc.base + loc.bonus_gain35) : loc.base);

    // ─── AIDES SPÉCIFIQUES GRAND EST ───
    const dept = opts.dept || null;
    const epci = opts.epci || null;
    /* Même règle que les trois autres moteurs : département, OU drapeau explicite,
       OU région « Grand Est ». Un département vide (saisie manuelle après un échec
       de la Base Adresse Nationale) faisait tomber les aides régionales à 0 en silence. */
    const isGrandEst = !!(dept && Object.keys(DEPTS_GRAND_EST).includes(dept))
      || !!opts.isGrandEst
      || !!(region && normaliseRegion(region).includes('grand est'));
    const epciInfo = (epci && EPCI_GRAND_EST[epci]) ? EPCI_GRAND_EST[epci] : null;

    let aidesGrandEst = {
      climaxion: 0, planClimatMgn: 0, ceeMajores: 0, primeAirBois: 0,
      ccPaysSelVermois: 0, ccSeilleGrandCouronne: 0,
      locAvantages: 0, louerPourEmploi: 0, detail: [],
    };

    if (isGrandEst) {
      const typeLogement = opts.typeLogement || 'maison';
      const catFR = (cat === 'bleus' || cat === 'jaunes') ? 'modestes' : 'autres';

      // Plan Climat MGN (maison individuelle)
      if (epci === 'metropole_grand_nancy' && typeLogement === 'maison') {
        const gm = RB.grand_nancy_maison;
        // Dépenses éligibles MaPrimeRénov' : l'assiette plafonnée en ampleur, la
        // somme des gestes finançables (bornés par leur plafond) par geste.
        const depEligibles = isRenovAmpleur
          ? Math.min(totalHT, mprPlafondHT || 0)
          : Object.keys(MPR).reduce((s, g) => s + (sel.includes(g)
              ? Math.min(couts[g] || 0, MPR_PLAFONDS[g] || (couts[g] || 0)) : 0), 0);
        const plaf = cat === 'roses' ? gm.plafondRoses : gm.plafond;
        let pcMin = Math.min(Math.round(depEligibles * gm.tauxMin), plaf);
        let pcMax = Math.min(Math.round(depEligibles * gm.tauxMax), plaf);
        // Isolation complémentaire, €/m² — combles perdus et sarking seulement.
        const isoC = (sel.includes('combles') ? surfCombles * gm.isolationComplementaire.combles_perdus : 0)
                   + (sel.includes('sarking') ? surfCombles * gm.isolationComplementaire.sarking : 0);
        pcMin += Math.round(isoC); pcMax += Math.round(isoC);
        aidesGrandEst.planClimatMgn = pcMin;
        aidesGrandEst.planClimatMgnFourchette = { min: pcMin, max: pcMax, unique: pcMin === pcMax };
        if (pcMax > 0) aidesGrandEst.detail.push({ nom: 'Plan Climat Métropole du Grand Nancy', montant: pcMin,
          fourchette: { min: pcMin, max: pcMax },
          note: '5 à 15 % des dépenses éligibles MaPrimeRénov\u2019, plafonné. À demander avant signature des devis.' });
      }
      if (false) {
        const pc = PLAN_CLIMAT_MGN_MAISON;
        let sum = 0;
        // 6 gestes finançables (Guide ALEC 2026)
        const gestesPCMaison = [
          { code: 'ite',              bar: pc.ite,                surface: surfIte },
          { code: 'iti',              bar: pc.iti,                surface: surfIte },              // approximation V1
          { code: 'sarking',          bar: pc.sarking,            surface: surfCombles },
          { code: 'combles',          bar: pc.combles_perdus,     surface: surfCombles },
          { code: 'toiture_terrasse', bar: pc.toitures_terrasses, surface: surfToitureTerrasse },
          { code: 'plancher_bas',     bar: pc.planchers_bas,      surface: Math.round(surface * 0.9) }, // fallback V1
        ];
        gestesPCMaison.forEach(g => {
          if (!sel.includes(g.code) || !g.bar) return;
          sum += g.surface * (g.bar[catFR] || 0);
        });
        aidesGrandEst.planClimatMgn = Math.round(sum);
        if (sum > 0) aidesGrandEst.detail.push({ nom: 'Plan Climat Métropole du Grand Nancy', montant: Math.round(sum), note: 'Cible : atteindre DPE C minimum. À demander avant devis.' });
      }

      // CEE majorés MGN (uplift vs CEE standard)
      if (epci === 'metropole_grand_nancy') {
        let ceeMgn = 0;
        if (sel.includes('combles'))            ceeMgn += surfCombles * CEE_MGN.combles;
        if (sel.includes('ite'))                ceeMgn += surfIte * CEE_MGN.ite;
        if (sel.includes('toiture_terrasse'))   ceeMgn += surfToitureTerrasse * CEE_MGN.toiture_terrasse;
        if (sel.includes('menuiseries'))        ceeMgn += nbMenuiseries * CEE_MGN.menuiseries * 1.5;
        if (sel.includes('pac_aireau'))         ceeMgn += CEE_MGN.pac_aireau;
        if (sel.includes('pac_geothermique'))   ceeMgn += CEE_MGN.pac_eaueau;
        if (sel.includes('chauffe_eau_thermo')) ceeMgn += CEE_MGN.chauffe_eau_thermo;
        if (sel.includes('poele_granules'))     ceeMgn += CEE_MGN.poele_granules;
        if (sel.includes('poele_buches'))       ceeMgn += CEE_MGN.poele_bois;
        if (sel.includes('biomasse'))           ceeMgn += CEE_MGN.chaudiere_biomasse;
        if (sel.includes('vmc_df'))             ceeMgn += CEE_MGN.vmc_df;
        // Le complément se mesure contre le CEE de marché (ceeBrut), jamais
        // contre totalCEE qui vaut 0 en rénovation d'ampleur — sinon la totalité
        // du CEE rentrait par la fenêtre alors qu'il n'est pas cumulable.
        const uplift = isRenovAmpleur ? 0 : Math.round(ceeMgn - ceeBrut);
        const upF = root.RFBaremes.fourchetteCee(uplift > 0 ? uplift : 0);
        aidesGrandEst.ceeMajores = upF.min;
        aidesGrandEst.ceeMajoresFourchette = upF;
        if (aidesGrandEst.ceeMajores > 0) aidesGrandEst.detail.push({ nom: 'CEE bonifiés Métropole du Grand Nancy', montant: aidesGrandEst.ceeMajores, note: 'Uplift vs offres CEE privées standards. Demande obligatoire via la Métropole.' });
      }

      // Prime Air Bois
      const oldWoodStove = opts.oldWoodStove === true;
      const wantsPoele = sel.includes('poele_granules') || sel.includes('poele_buches') || sel.includes('insert_foyer');
      if (oldWoodStove && wantsPoele && epciInfo && epciInfo.hasFonds_air_bois) {
        const pab = RB.prime_air_bois;
        const sousPlafond = rfr <= root.RFBaremes.plafondAirBois(foyer);
        aidesGrandEst.primeAirBois = Math.min(pab.base + (sousPlafond ? pab.bonusMax : 0), pab.total);
        aidesGrandEst.detail.push({ nom: 'Prime Air Bois', montant: aidesGrandEst.primeAirBois, note: 'Attention : non cumulable avec CEE poêle (choisir la plus avantageuse).' });
      }

      // CC des Pays du Sel et du Vermois
      if (epci === 'cc_pays_sel_vermois') {
        const isoCouts = (couts.combles || 0) + (couts.ite || 0) + (couts.toiture_terrasse || 0);
        const enrCouts = (couts.pac_aireau || 0) + (couts.pac_geothermique || 0) + (couts.chauffe_eau_solaire || 0) + (couts.chauffage_solaire_combine || 0) + (couts.pvt_eau || 0);
        const plafIso = (cat === 'bleus' || cat === 'jaunes') ? 1500 : 1000;
        const aideIso = Math.min(isoCouts * 0.25, plafIso);
        const aideEnr = Math.min(enrCouts * 0.25, 2000);
        aidesGrandEst.ccPaysSelVermois = Math.round(aideIso + aideEnr);
        if (aidesGrandEst.ccPaysSelVermois > 0) aidesGrandEst.detail.push({ nom: 'CC des Pays du Sel et du Vermois', montant: aidesGrandEst.ccPaysSelVermois, note: '25 % HT plafonné, cumulable avec les autres aides.' });
      }

      // CC Seille et Grand Couronné
      if (epci === 'cc_seille_grand_couronne') {
        const isolationCount2 = (sel.includes('combles')?1:0) + (sel.includes('ite')?1:0) + (sel.includes('toiture_terrasse')?1:0);
        if (sel.length >= 2 && isolationCount2 >= 1) {
          if (cat === 'bleus' || cat === 'jaunes') aidesGrandEst.ccSeilleGrandCouronne = 1250;
          else if (cat === 'violets')              aidesGrandEst.ccSeilleGrandCouronne = 1000;
          else                                     aidesGrandEst.ccSeilleGrandCouronne = 850;
          aidesGrandEst.detail.push({ nom: 'CC Seille et Grand Couronné', montant: aidesGrandEst.ccSeilleGrandCouronne, note: 'Bouquet ≥ 2 gestes dont 1 isolation.' });
        }
      }

      // Loc'Avantages (bailleurs)
      const status = (opts.status || 'occupant').toLowerCase();
      const locAvantagesLevel = opts.locAvantagesLevel || null;
      if (status.startsWith('bailleur') && locAvantagesLevel) {
        // Le taux dépend de la NATURE des travaux (Guide Anah p.31), pas du niveau
        // de loyer. Sans question dédiée dans le tunnel, on retient le cas courant.
        const nature = opts.natureTravauxBailleur || 'autres_dont_energ';
        const confLA = LOC_AVANTAGES_GE.taux_par_nature[nature]
                    || LOC_AVANTAGES_GE.taux_par_nature.autres_dont_energ;
        const surfLim = Math.min(Number(opts.surface_loc) || surface || LOC_AVANTAGES_GE.surface_max_m2,
                                 LOC_AVANTAGES_GE.surface_max_m2);
        const plafondHT = Math.min(confLA.plafond_m2 * surfLim, confLA.plafond_total);
        const baseHT = Math.min(totalHT, plafondHT);
        aidesGrandEst.locAvantages = Math.round(baseHT * confLA.taux)
                                   + LOC_AVANTAGES_GE.prime_gain_energetique_35pct;
        aidesGrandEst.detail.push({ nom: "Loc'Avantages " + locAvantagesLevel, montant: aidesGrandEst.locAvantages, note: 'NON cumulable avec CEE + MPR sur les mêmes travaux — choisir la voie la plus favorable.' });
      }

      // Louer pour l'Emploi
      if (status.startsWith('bailleur') && opts.rentToMobility === true && epci === 'metropole_grand_nancy') {
        aidesGrandEst.louerPourEmploi = LOUER_POUR_EMPLOI_MGN.forfaitMax;
        aidesGrandEst.detail.push({ nom: "Louer pour l'Emploi (Action Logement)", montant: LOUER_POUR_EMPLOI_MGN.forfaitMax, note: 'Location ≥ 9 ans à un salarié nouvellement embauché.' });
      }

      // Climaxion maison individuelle (indicatif)
      if (typeLogement === 'maison' && sel.length >= 2) {
        aidesGrandEst.climaxion = CLIMAXION_MAISON.aide_indicative;
        aidesGrandEst.detail.push({ nom: 'Climaxion (Région Grand Est + ADEME)', montant: CLIMAXION_MAISON.aide_indicative, note: CLIMAXION_MAISON.disponibilite });
      }
    }

    // ─── Non-cumul Prime Air Bois × CEE poêle (règle ALEC) ─────────────
    // On conserve la plus favorable des deux, jamais l'addition.
    const gestesPoele = ['poele_buches', 'poele_granules', 'insert_foyer'];
    if (gestesPoele.some(g => sel.includes(g)) && aidesGrandEst.primeAirBois > 0) {
      const ceePoele = gestesPoele.reduce((acc, geste) => {
        if (!sel.includes(geste) || !CEE[geste]) return acc;
        return acc + (CEE[geste][ceeTier] || 0);
      }, 0);
      if (aidesGrandEst.primeAirBois > ceePoele) {
        totalCEE = Math.max(0, totalCEE - ceePoele);
      } else {
        aidesGrandEst.primeAirBois = 0;
        aidesGrandEst.detail = aidesGrandEst.detail.filter(d => d.nom !== 'Prime Air Bois');
        aidesGrandEst.detail.push({ nom: 'Prime Air Bois', montant: 0, note: 'Exclue : le CEE poêle est plus favorable (non-cumul).' });
      }
    }

    const totalGrandEst = aidesGrandEst.planClimatMgn + aidesGrandEst.ceeMajores
                        + aidesGrandEst.primeAirBois + aidesGrandEst.ccPaysSelVermois
                        + aidesGrandEst.ccSeilleGrandCouronne + aidesGrandEst.locAvantages
                        + aidesGrandEst.louerPourEmploi + aidesGrandEst.climaxion;

    // ─── ÉCONOMIE TVA différentielle : 5,5 % au lieu de 10 %, taux normal des travaux de rénovation — soit 4,5 points ───
    const tvaSaved = Math.round(totalHT * (0.10 - 0.055));

    // ─── ÉNERGIE ───
    // La consommation de départ vient de la classe DPE réellement déclarée, pas
    // d'un forfait. Le coefficient précédent (0,0088 €/kWh) sous-estimait
    // l'économie d'un facteur dix.
    const kwhAvant = (opts.dpe && DPE_KWH_M2[opts.dpe]) ? DPE_KWH_M2[opts.dpe] : null;
    const conso_avant = Math.round(surface * (kwhAvant !== null ? kwhAvant : 278));
    const conso_apres = Math.round(surface * (isRenovAmpleur ? 80 : 145));
    const prixKwh = PRIX_KWH[heat] || PRIX_KWH.gaz;
    const economie_an = Math.max(0, Math.round((conso_avant - conso_apres) * prixKwh));

    // Anti-double-comptage : le bloc grandEst est la source unique des aides
    // régionales Grand Est (Climaxion y figure déjà). On neutralise donc
    // aides.local, qui modélisait Climaxion une seconde fois.
    if (isGrandEst && totalGrandEst > 0) {
      totalLocal = 0;
      loc = { nom: null, base: 0, bonus_gain35: 0 };
    }

    // ─── ÉCRÊTEMENT GLOBAL ───
    // Plafond réglementaire par catégorie de revenus, déjà défini par le module :
    //   • rénovation d'ampleur → ECRETEMENT_AMPLEUR[cat] × TTC
    //   • par geste            → ECRETEMENT_MPR_CEE[cat] × TTC (Guide Anah p.29 ; null = pas de cap)
    // L'économie de TVA est EXCLUE du cumul : totalTTC est déjà calculé à 5,5 %,
    // et ce n'est pas une aide perçue mais une moindre dépense.
    /* Deux tables distinctes, jamais interverties. Par geste, le taux monte à
       100 % dans toutes les catégories dès qu'une aide locale entre dans le cumul. */
    const aideLocaleDansCumul = (totalLocal > 0) || (totalGrandEst > 0);
    const tauxEcretGeste = aideLocaleDansCumul ? RB.ecretement_geste.avecAideLocale : ECRETEMENT_MPR_CEE[cat];
    const capReg = isRenovAmpleur
      ? Math.round(totalTTC * ECRETEMENT_AMPLEUR[cat])
      : (tauxEcretGeste !== null ? Math.round(totalTTC * tauxEcretGeste) : totalTTC);

    // Supplément MPR Copropriété : appartement + travaux collectifs prévus
    let mprCoproSupp = { collective: 0, personnelle: 0, totalPersonnel: 0, applicable: false };
    if ((opts.hasCoproCollectifs === 'yes' || opts.hasCoproCollectifs === 'unknown') && opts.copro) {
      mprCoproSupp = computeMprCoproPart(opts.copro, totalHT, {
        rfr: rfr, foyer: foyer, region: region,
      });
    }
    const coproPersoPO = (mprCoproSupp.totalPersonnel || mprCoproSupp.personnelle);

    // Éco-PTZ : montant de prêt mobilisable selon le nombre d'actions
    const ecoPtzMontantPO = computeEcoPtz(sel, false, isRenovAmpleur, totalMPR > 0);

    // Le plafond s'applique au TOTAL agrégé : on rabote d'abord MaPrimeRénov'
    // (dernier entré / premier sorti), puis, si l'excédent dépasse le MPR
    // disponible, on répartit le reliquat au prorata sur les autres postes —
    // sinon le clamp saturerait et laisserait passer aides > coût des travaux.
    let mprFinal    = totalMPR;
    let ceeFinal    = totalCEE;
    let localFinal  = totalLocal;
    let geFinal     = totalGrandEst;
    let coproFinal  = coproPersoPO;
    const sommeAides = totalMPR + totalCEE + totalLocal + totalGrandEst + coproFinal;
    let ecretGlobal = 0;
    if (sommeAides > capReg) {
      ecretGlobal = sommeAides - capReg;
      const surMpr = Math.min(totalMPR, ecretGlobal);
      mprFinal = totalMPR - surMpr;
      let reste = ecretGlobal - surMpr;
      if (reste > 0) {
        const coproInit = coproPersoPO;
        const autres = totalCEE + totalLocal + totalGrandEst + coproInit;
        if (autres > 0) {
          const ratio = Math.max(0, 1 - reste / autres);
          ceeFinal   = Math.round(totalCEE    * ratio);
          localFinal = Math.round(totalLocal  * ratio);
          geFinal    = Math.round(totalGrandEst * ratio);
          coproFinal = Math.round(coproPersoPO * ratio);
        } else {
          ceeFinal = localFinal = geFinal = coproFinal = 0;
        }
      }
      // Le supplément affiché doit refléter la valeur écrêtée
      mprCoproSupp = Object.assign({}, mprCoproSupp, {
        personnelle: coproFinal, totalPersonnel: coproFinal, brut: coproPersoPO,
      });
    }
    ecretement = {
      applied: ecretGlobal > 0,
      plafond: capReg,
      montant: ecretGlobal,
      base: 'TTC',
      taux: isRenovAmpleur ? ECRETEMENT_AMPLEUR[cat] : ECRETEMENT_MPR_CEE[cat],
      motif: isRenovAmpleur
        ? "plafond rénovation d'ampleur selon catégorie de revenus"
        : 'plafond MaPrimeRénov\' + CEE par geste selon catégorie de revenus',
    };

    return {
      profile: { surface, foyer, rfr, region, cat, heat, dept, epci, isGrandEst },
      selection: sel,
      travaux: {
        ...couts, totalHT, totalTTC,
        surfCombles, surfIte, surfToitureTerrasse, nbMenuiseries,
      },
      aides: {
        mpr: {
          total: mprFinal,
          brut: totalMPR,
          postes: mprPostes,
          ampleur: mprAmpleur,
          forfaitMar: forfaitMar,
          isRenovAmpleur: isRenovAmpleur,
          plafondHT: mprPlafondHT,
          taux: mprTaux,
        },
        cee:    { total: ceeFinal, brut: ceeBrut, tier: ceeTier, cumulBloque: isRenovAmpleur, min: ceeFinal, max: Math.round(ceeFinal * RB.cee.ecartMax / RB.cee.ecartMin), unique: false },
        local:  { total: localFinal, brut: totalLocal, nom: loc.nom, bonus: isRenovAmpleur },
        tva:    { total: tvaSaved },
        ecoPtz: { eligible: ecoPtzMontantPO > 0, montant: ecoPtzMontantPO, duree_max_annees: dureeEcoPtz(ecoPtzMontantPO) },
        mprCoproSupplement: mprCoproSupp,
      coproQuotePart: coproFinal,
        grandEst: {
          total: geFinal,
          brut: totalGrandEst,
          isGrandEst: isGrandEst,
          dept: dept,
          deptNom: dept ? (DEPTS_GRAND_EST[dept] || null) : null,
          epci: epci,
          epciNom: epciInfo ? epciInfo.nom : null,
          climaxion: aidesGrandEst.climaxion,
          planClimatMgn: aidesGrandEst.planClimatMgn,
          planClimatMgnFourchette: aidesGrandEst.planClimatMgnFourchette || null,
          ceeMajoresFourchette: aidesGrandEst.ceeMajoresFourchette || null,
          ceeMajores: aidesGrandEst.ceeMajores,
          primeAirBois: aidesGrandEst.primeAirBois,
          ccPaysSelVermois: aidesGrandEst.ccPaysSelVermois,
          ccSeilleGrandCouronne: aidesGrandEst.ccSeilleGrandCouronne,
          locAvantages: aidesGrandEst.locAvantages,
          louerPourEmploi: aidesGrandEst.louerPourEmploi,
          detail: aidesGrandEst.detail,
        },
        ecretement: ecretement,
      },
      energie: {
        avant: conso_avant, apres: conso_apres, economieAn: economie_an,
        prixKwhRetenu: prixKwh, dpeDeclare: opts.dpe || null,
        // Le prix du kWh est une hypothèse, pas un barème : l'écran doit le dire.
        hypothese: true,
      },
      // Prise en charge de l'accompagnement obligatoire. Exposée à part, jamais
      // additionnée aux aides sur travaux.
      accompagnement: {
        priseEnCharge: forfaitMar,
        plafond: MAR_PLAFOND,
        taux: MAR_TAUX[cat],
        obligatoire: isRenovAmpleur,
      },
      alertes: {
        gestesHorsParcoursGeste: gestesHorsParcoursGeste,
        auditManquant: isRenovAmpleur ? auditManquant : false,
        gainClassesHypothese: isRenovAmpleur ? !gainConnu : false,
        tvaReduite: tvaReduite,
        guichetOuvert: GUICHET_MPR.ouvert,
      },
      referentiel: REFERENTIEL,
      eligible: true,
      // Aides réellement perçues. Hors économie de TVA (moindre dépense, pas une
      // aide) et hors prise en charge de l'accompagnement (hors coût travaux).
      totalAides: mprFinal + ceeFinal + localFinal + geFinal + coproFinal,
      economieTva: tvaSaved,
    };
  }

  // Helper : lit le profil localStorage et recompute.
  function recomputeFromProfile(profilDossier) {
    let p = {};
    if (profilDossier && typeof profilDossier === 'object') p = profilDossier;
    else {
      try { p = JSON.parse(localStorage.getItem('renofacile.profile') || '{}'); }
      catch (e) { p = {}; }
    }

    let ownerType = 'occupant', bailleurCase = 'occupant';
    try {
      ownerType    = p.ownerType || localStorage.getItem('renofacile.ownerType')    || 'occupant';
      bailleurCase = p.bailleurCase || localStorage.getItem('renofacile.bailleurCase') || (ownerType === 'bailleur' ? 'particulier-nu' : 'occupant');
    } catch (_) {}

    let bailleur = {}, copro = {};
    /* Un dossier porte ses propres saisies bailleur et copropriété : elles font
       foi. À défaut seulement, on lit celles de la session en cours. */
    if (p.bailleur && typeof p.bailleur === 'object') bailleur = p.bailleur;
    else { try { bailleur = JSON.parse(localStorage.getItem('renofacile.bailleur') || '{}'); } catch (_) {} }
    if (p.copro && typeof p.copro === 'object' && Object.keys(p.copro).length) copro = p.copro;
    else { try { copro = JSON.parse(localStorage.getItem('renofacile.copro') || '{}'); } catch (_) {} }

    return compute({
      ownerType: ownerType, bailleurCase: bailleurCase,
      surface:      p.logement && p.logement.surface,
      foyer:        p.foyer    && p.foyer.parts,
      rfr:          p.foyer    && p.foyer.rfr,
      region:       p.foyer    && p.foyer.region,
      heat:         p.logement && p.logement.heat,
      selection:    p.travaux,
      dept:         p.logement && p.logement.dept,
      epci:         p.logement && p.logement.epci,
      typeLogement: (p.logement && p.logement.type)
                      ? (String(p.logement.type).toLowerCase().includes('maison') ? 'maison' : 'appartement')
                      : 'maison',
      dpeCurrent:   p.logement && (p.logement.dpeCurrent || p.logement.dpe),
      oldWoodStove: p.logement && p.logement.oldWoodStove,
      rent:         Number(bailleur.rent)        || 0,
      nbLogementsBailleur: Number(bailleur.nbLogements) || 1,
      surface_loc:  Number(bailleur.surface)     || 0,
      zone:         bailleur.zone                || null,
      locLevel:     bailleur.locLevel            || 'none',
      locDuration:  Number(bailleur.locDuration) || 6,
      lpe:          bailleur.lpe                 || 'no',
      /* Le profil d'un dossier fait foi : sinon le recalcul d'un dossier lisait la
         situation de la session en cours. */
      hasCoproCollectifs: p.hasCoproCollectifs
        || (function(){ try { return localStorage.getItem('renofacile.hasCoproCollectifs') || 'no'; } catch(_){ return 'no'; } })(),
      /* Liste blanche : toute saisie absente ici est perdue au recalcul. Les trois
         dernières (montant voté, gain visé, sortie de passoire) manquaient : la
         copropriété retombait toujours sur l'estimation et l'hypothèse basse. */
      copro: { lots: copro.lots, tantiemes: copro.tantiemes, dpe: copro.dpe,
               annee: copro.annee, fragile: copro.fragile, mar: copro.mar,
               coutTravauxCollectifs: copro.coutTravauxCollectifs,
               gainVise: copro.gainVise,
               sortiePassoire: copro.sortiePassoire },
      status:            (p.situation && p.situation.status) ? String(p.situation.status).toLowerCase() : ownerType,
      locAvantagesLevel: p.situation && p.situation.locAvantagesLevel,
      rentToMobility:    p.situation && p.situation.rentToMobility,
    });
  }

  root.RFCompute = {
    compute: compute,
    recomputeFromProfile: recomputeFromProfile,
    plafond: plafond,
    categorie: categorie,
    PLAFONDS: PLAFONDS,
    MPR: MPR,
    MPR_PLAFONDS: MPR_PLAFONDS,
    MPR_AMPLEUR: MPR_AMPLEUR,
    MAR_PLAFOND: MAR_PLAFOND,
    MAR_TAUX: MAR_TAUX,
    ECRETEMENT_AMPLEUR: ECRETEMENT_AMPLEUR,
    ECRETEMENT_MPR_CEE: ECRETEMENT_MPR_CEE,
    computeOccupant:              computeOccupant,
    computeBailleurNu:            computeBailleurNu,
    computeBailleurRestreint:     computeBailleurRestreint,
    computeCopro:                 computeCopro,
    computeMprCoproPart:          computeMprCoproPart,
    computeCouts:                 computeCouts,
    computeCEE:                   computeCEE,
    computeTVA:                   computeTVA,
    MPR_COPRO:                    MPR_COPRO,
    TVA_APPLICABLE:               TVA_APPLICABLE,
    ECO_PTZ_APPLICABLE:           ECO_PTZ_APPLICABLE,
    MPA:                          MPA,
    MPA_COUTS_INDICATIFS:         MPA_COUTS_INDICATIFS,
    MPA_LIBELLES:                 MPA_LIBELLES,
    computeMprAdapt:              computeMprAdapt,
    MPLD:                         MPLD,
    LHI_BAILLEUR:                 LHI_BAILLEUR,
    LHI_COPRO:                    LHI_COPRO,
    LHI_ARRETE_LIBELLES:          LHI_ARRETE_LIBELLES,
    computeMprLogementDecent:     computeMprLogementDecent,
    ECO_PTZ_PLAFONDS:             ECO_PTZ_PLAFONDS,
    computeEcoPtz:                computeEcoPtz,
    BAREMES_COPRO_A_VALIDER:      BAREMES_COPRO_A_VALIDER,
    MPR_BAILLEUR_PLAFOND_TRAVAUX: MPR_BAILLEUR_PLAFOND_TRAVAUX,
    ECRETEMENT_BAILLEUR:          ECRETEMENT_BAILLEUR,
    PRIME_SORTIE_VACANCE:         PRIME_SORTIE_VACANCE,
    dureeEcoPtz:                  dureeEcoPtz,
    LOC_AVANTAGES:                LOC_AVANTAGES,
    LOC_AVANTAGES_GE:             LOC_AVANTAGES_GE,
    LOUER_POUR_EMPLOI_MGN:        LOUER_POUR_EMPLOI_MGN,
    BAREMES_BAILLEUR_A_VALIDER:   BAREMES_BAILLEUR_A_VALIDER,
    CEE: CEE,
    AIDES_LOCALES: AIDES_LOCALES,
    DEPTS_GRAND_EST: DEPTS_GRAND_EST,
    EPCI_GRAND_EST: EPCI_GRAND_EST,
    CLIMAXION_COPRO: CLIMAXION_COPRO,
    CLIMAXION_MAISON: CLIMAXION_MAISON,
    PLAN_CLIMAT_MGN_MAISON: PLAN_CLIMAT_MGN_MAISON,
    PLAN_CLIMAT_MGN_COPRO: PLAN_CLIMAT_MGN_COPRO,
    CEE_MGN: CEE_MGN,
    PRIME_AIR_BOIS: PRIME_AIR_BOIS,
    AIDES_INTERCOMMUNALES: AIDES_INTERCOMMUNALES,
    REFERENTIEL: REFERENTIEL,
    GUICHET_MPR: GUICHET_MPR,
    MPR_AMPLEUR_SEULEMENT: MPR_AMPLEUR_SEULEMENT,
    DPE_KWH_M2: DPE_KWH_M2,
    PRIX_KWH: PRIX_KWH,
    normaliseRegion: normaliseRegion,
    controleVraisemblance: controleVraisemblance,
    partEnergetiqueLhi: partEnergetiqueLhi,
    economieEnergie: economieEnergie,

  };
})(typeof window !== 'undefined' ? window : globalThis);
