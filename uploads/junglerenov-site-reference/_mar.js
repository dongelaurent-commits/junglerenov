/* ══════════════════════════════════════════════════════════════════
   RénoFacile — Helper accompagnement obligatoire (MAR / AMO)
   Détecte si le dossier nécessite un accompagnateur agréé Anah,
   calcule le coût prévisionnel et la prime déductible.
   RénoFacile n'étant PAS agréé Mon Accompagnateur Rénov', ce coût
   est à la charge du client et fait l'objet d'un contrat distinct.
   ══════════════════════════════════════════════════════════════════ */
(function(root){
  'use strict';

  // Fourchettes indicatives 2026, à valider au cas par cas
  var COUT_MAR_MIN = 500;
  var COUT_MAR_MAX = 2000;
  var COUT_AMO_MPA = 700;
  var COUT_OPERATEUR_LHI_MIN = 800;
  var COUT_OPERATEUR_LHI_MAX = 2500;

  // Plafonds de la prime MAR selon le profil de revenus Anah
  var PRIME_MAR = {
    bleu:   { taux: 1.00, plafond: 2000 },
    jaune:  { taux: 0.80, plafond: 1600 },
    violet: { taux: 0.40, plafond: 800 },
    rose:   { taux: 0.20, plafond: 400 }  // aligné sur MAR_TAUX.roses du moteur
  };

  /* Le moteur de calcul renvoie les catégories au pluriel
     ('bleus', 'jaunes'…) : on ramène au singulier attendu ici. */
  var fmtEUR = function(n){
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
  };

  /* Forfaits AMO MaPrimeAdapt' lus depuis le registre des barèmes (B3). */
  function forfaitsAmo(){
    var a = root.RFBaremes && root.RFBaremes.BAREMES && root.RFBaremes.BAREMES.amo_mpa;
    return a ? { min: a.socle, max: a.complet_ergotherapie } : { min: 350, max: 800 };
  }

  function normalizeProfil(p){
    return String(p || '').toLowerCase().trim().replace(/s$/, '');
  }

  root.RFMar = {
    COUTS: {
      marMin: COUT_MAR_MIN, marMax: COUT_MAR_MAX,
      amoMpa: COUT_AMO_MPA,
      lhiMin: COUT_OPERATEUR_LHI_MIN, lhiMax: COUT_OPERATEUR_LHI_MAX
    },

    /* Input  : { tunnel, gestes:[…], gainClassesDPE, profilAnah }
       Output : { required, type, reason, coutMin, coutMax, primeDeduite,
                  resteACharge, libelle } */
    analyze: function(dossier){
      dossier = dossier || {};
      var tunnel = String(dossier.tunnel || '').toUpperCase();

      // MaPrimeAdapt' — AMO systématique, financé par un forfait Anah (350 à 800 €) ; solde possible
      if (tunnel === 'MPA' || tunnel === 'AUTONOMIE') {
        return {
          required: true,
          type: 'AMO',
          reason: "MaPrimeAdapt' impose une Assistance à Maîtrise d'Ouvrage.",
          /* Forfaits Anah sourcés (registre des barèmes, B3) : 350 / 600 / 800 € TTC.
             Le coût réel de l'opérateur n'est pas connu tant qu'il n'a pas chiffré :
             le reste à charge est donc INCONNU (null), jamais présumé nul. */
          coutMin: null, coutMax: null,
          forfaitAnah: { min: forfaitsAmo().min, max: forfaitsAmo().max },
          primeDeduite: null,
          resteACharge: null,
          soldePossible: true,
          libelle: "AMO MaPrimeAdapt' — forfait Anah de " + fmtEUR(forfaitsAmo().min) + ' à ' + fmtEUR(forfaitsAmo().max) + ", un solde est possible"
        };
      }

      // MaPrimeLogementDécent — opérateur agréé systématique ; coût non sourcé, aucun montant affiché
      if (tunnel === 'LHI' || tunnel === 'INDIGNE') {
        return {
          required: true,
          type: 'OPERATEUR',
          reason: 'Ma Prime Logement Décent impose un opérateur agréé Anah.',
          /* Aucune source pour le coût de l'opérateur ni pour un reste à charge nul :
             aucun montant affiché, reste à charge inconnu, solde possible. */
          coutMin: null, coutMax: null,
          forfaitAnah: null,
          primeDeduite: null,
          resteACharge: null,
          soldePossible: true,
          libelle: "Opérateur agréé Anah — son coût vous est indiqué par écrit avant tout engagement"
        };
      }

      // Rénovation énergétique — MAR obligatoire seulement en rénovation d'ampleur
      if (tunnel === 'ENERGETIQUE') {
        var gestes = Array.isArray(dossier.gestes) ? dossier.gestes.length : 0;
        var gain   = Number(dossier.gainClassesDPE || 0);
        var estAmpleur = (gestes >= 2 && gain >= 2);

        if (!estAmpleur) {
          return {
            required: false,
            type: null,
            reason: 'Rénovation par geste — Mon Accompagnateur Rénov\' non obligatoire.',
            coutMin: 0, coutMax: 0, primeDeduite: 0, resteACharge: 0,
            libelle: 'Aucun accompagnement obligatoire pour ce parcours.'
          };
        }

        var prime = PRIME_MAR[normalizeProfil(dossier.profilAnah)] || PRIME_MAR.rose;
        var coutMoyen = Math.round((COUT_MAR_MIN + COUT_MAR_MAX) / 2);
        var primeCalculee = Math.min(coutMoyen * prime.taux, prime.plafond);
        var reste = Math.max(coutMoyen - primeCalculee, 0);

        return {
          required: true,
          type: 'MAR',
          reason: "MaPrimeRénov' Parcours accompagné — Mon Accompagnateur Rénov' obligatoire.",
          coutMin: COUT_MAR_MIN,
          coutMax: COUT_MAR_MAX,
          coutMoyen: coutMoyen,
          primeDeduite: Math.round(primeCalculee),
          resteACharge: Math.round(reste),
          libelle: "Mon Accompagnateur Rénov' (obligatoire) — reste à charge estimé " + fmtEUR(reste)
        };
      }

      return { required: false, type: null, coutMin: 0, coutMax: 0, primeDeduite: 0, resteACharge: 0 };
    },

    bannerText: function(analysis){
      if (!analysis || !analysis.required) return '';

      if (analysis.type === 'AMO') {
        return "Votre projet MaPrimeAdapt' nécessite une Assistance à Maîtrise d'Ouvrage (AMO). L'Anah prend en charge l'accompagnement AMO à hauteur d'un forfait de "
          + fmtEUR(analysis.forfaitAnah.min) + ' à ' + fmtEUR(analysis.forfaitAnah.max)
          + " selon le niveau de prestation ; si l'opérateur facture davantage, la différence reste à votre charge.";
      }
      if (analysis.type === 'OPERATEUR') {
        return "Votre projet nécessite un opérateur agréé Anah. Son intervention est en partie financée par l'Anah dans le cadre de MaPrimeLogementDécent ; le montant de sa prestation, et un éventuel solde à votre charge, vous sont indiqués par écrit avant tout engagement.";
      }
      if (analysis.type === 'MAR') {
        return "Votre projet de rénovation d'ampleur nécessite l'intervention de Mon Accompagnateur Rénov' (MAR) — obligation Anah 2026. RénoFacile n'est pas agréé MAR. Coût estimé : " +
          fmtEUR(analysis.coutMin) + ' à ' + fmtEUR(analysis.coutMax) + ' · prime Anah déduite : ' + fmtEUR(analysis.primeDeduite) +
          ' · reste à votre charge : ~' + fmtEUR(analysis.resteACharge) +
          ". Ce montant est réglé directement au MAR de votre choix, via l'annuaire officiel France Rénov'.";
      }
      return '';
    },

    URL_ANNUAIRE_FRANCE_RENOV: 'https://france-renov.gouv.fr/mon-accompagnateur-renov'
  };
})(window);
