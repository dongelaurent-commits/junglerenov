/* JungleRenov — lecture des aides selon leur nature, pour tout le site.
   Règle : aucun coût de projet estimé n'est affiché. Une aide forfaitaire montre son montant ;
   une aide en pourcentage montre son taux et son plafond, et un montant seulement sur devis ;
   TVA et éco-PTZ (hors total) montrent un taux ou un plafond de prêt.
   JRLecture(type, resultat, devis) → { base, titre, montant, ligne, forfaits, pourcentages, horsTotal, reste, ... }
   devis : { ht: nombre } ou null. Le moteur a déjà calculé sur cette base quand un devis est saisi. */
(function (root) {
  'use strict';
  var eur = function (n) { return Math.round(n || 0).toLocaleString('fr-FR') + '\u202f€'; };
  var pct = function (t) { return Math.round((t || 0) * 100) + '\u202f%'; };

  function totalMoteur(type, r) {
    if (!r) return 0;
    if (typeof r.totalAides === 'number') return r.totalAides;
    if (r.aide && type === 'autonomie') return r.aide.total || 0;
    if (r.aide) return (r.aide.totalApresEcretement || r.aide.total || 0) + (r.aide.mprCumulable || 0) + (r.aide.local || 0);
    return 0;
  }

  function lire(type, r, devis, opts) {
    opts = opts || {};
    var date = opts.date || new Date().toLocaleDateString('fr-FR');
    var src = function (s) { return 'Source : ' + s + ' · ' + date; };
    var surDevis = !!(devis && devis.ht > 0);
    var F = [], P = [], H = [];
    var A = (r && r.aides) || {}, ge = A.grandEst || {}, ag = (r && r.aide) || {};

    if (type === 'energetique') {
      var m = A.mpr || {};
      if (m.isRenovAmpleur && m.taux) {
        P.push({ k: 'mpr', icon: 'facade', nom: 'MaPrimeRénov’ rénovation d’ampleur', taux: m.taux, plafond: m.plafondHT,
          amt: surDevis ? eur(m.ampleur || m.total) : pct(m.taux), cond: pct(m.taux) + ' des travaux, dans la limite de ' + eur(m.plafondHT) + ' HT · audit énergétique avant travaux',
          micro: surDevis ? 'calculé sur vos devis' : 'montant calculé sur vos devis', src: src('Anah, barème 2026') });
        if (m.forfaitMar) F.push({ k: 'mar', icon: 'proprietaire', nom: 'Prise en charge de l’accompagnement (MAR)', montant: m.forfaitMar, amt: eur(m.forfaitMar), cond: 'Forfait Anah pour l’accompagnateur obligatoire de ce parcours', src: src('Anah, barème 2026') });
      } else if (m.total) {
        F.push({ k: 'mpr', icon: 'facade', nom: 'MaPrimeRénov’ par geste', montant: m.total, amt: eur(m.total), cond: 'Forfait par poste de travaux, versé après travaux sur facture', src: src('Anah, barème 2026') });
      }
      if (A.mprCopro && A.mprCopro.partPersonnelle) F.push({ k: 'copro', icon: 'logement', nom: 'MaPrimeRénov’ Copropriété', montant: A.mprCopro.partPersonnelle, amt: eur(A.mprCopro.partPersonnelle), cond: 'Quote-part de l’aide collective, à confirmer en assemblée générale', src: src('Anah') });
      var c = A.cee || {};
      if (c.cumulBloque) F.push({ k: 'cee', icon: 'chaudiere', nom: 'Certificats d’économies d’énergie (CEE)', montant: 0, amt: 'inclus', cond: 'Intégrés à MaPrimeRénov’ dans le parcours accompagné', src: src('ATEE') });
      else if (c.total) F.push({ k: 'cee', icon: 'chaudiere', nom: 'Certificats d’économies d’énergie (CEE)', montant: c.total, amt: eur(c.total),
        cond: (c.max > c.min ? 'Fourchette ' + eur(c.min) + ' à ' + eur(c.max) + ', borne basse retenue' : 'Prime d’un fournisseur d’énergie') + ' · offre à signer avant le devis', src: src('ATEE, fiches CEE') });
      if (A.local && A.local.total && A.local.nom) F.push({ k: 'local', icon: 'logement', nom: A.local.nom, montant: A.local.total, amt: eur(A.local.total), cond: 'Aide de votre collectivité, demande après accord de l’Anah', src: src('collectivité') });
      if (ge.planClimatMgn) F.push({ k: 'mgn', icon: 'logement', nom: 'Plan Climat, Métropole du Grand Nancy', montant: ge.planClimatMgn, amt: eur(ge.planClimatMgn), cond: ge.planClimatMgnFourchette ? 'Fourchette ' + eur(ge.planClimatMgnFourchette.min) + ' à ' + eur(ge.planClimatMgnFourchette.max) + ', borne basse retenue' : 'Forfait selon les travaux éligibles', src: src('Métropole du Grand Nancy') });
      if (ge.climaxion) F.push({ k: 'climaxion', icon: 'logement', nom: 'Climaxion, Région Grand Est', montant: ge.climaxion, amt: eur(ge.climaxion), cond: 'Aide régionale, cumulable avec MaPrimeRénov’', src: src('Région Grand Est, ADEME') });
      if (ge.ceeMajores) F.push({ k: 'ceeMgn', icon: 'chaudiere', nom: 'CEE bonifiés, Grand Nancy', montant: ge.ceeMajores, amt: eur(ge.ceeMajores), cond: 'Bonification des primes CEE sur la Métropole', src: src('Métropole du Grand Nancy') });
      if (ge.primeAirBois) F.push({ k: 'pab', icon: 'chaudiere', nom: 'Prime Air Bois', montant: ge.primeAirBois, amt: eur(ge.primeAirBois), cond: 'Non cumulable avec la prime CEE du même poêle', src: src('Métropole du Grand Nancy') });
      if (A.tva && A.tva.total) H.push({ k: 'tva', icon: 'revenus', nom: 'TVA à 5,5\u202f%', amt: surDevis ? eur(A.tva.total) : '5,5\u202f%', cond: surDevis ? 'Économie sur la facture, calculée sur vos devis' : 'Taux réduit au lieu de 10\u202f%, appliqué par l’artisan sur la facture', src: src('service-public.fr') });
      if (A.ecoPtz && A.ecoPtz.eligible) H.push({ k: 'ecoptz', icon: 'revenus', nom: 'Éco-prêt à taux zéro', amt: 'jusqu’à ' + eur(A.ecoPtz.montant), cond: 'Prêt sans intérêts sur ' + (A.ecoPtz.duree_max_annees || 20) + ' ans, plafond selon vos travaux', src: src('service-public.fr') });
    } else if (type === 'autonomie') {
      if ((ag.tauxApplique || ag.taux)) P.push({ k: 'mpa', icon: 'logement', nom: 'MaPrimeAdapt’', taux: (ag.tauxApplique || ag.taux), plafond: 22000, amt: surDevis ? eur(ag.travaux) : pct((ag.tauxApplique || ag.taux)),
        cond: pct((ag.tauxApplique || ag.taux)) + ' des travaux d’adaptation, dans la limite de 22\u202f000\u202f€ HT', micro: surDevis ? 'calculé sur vos devis' : 'montant calculé sur vos devis', src: src('Anah, barème 2026') });
      if (type === 'autonomie' && ag.amo) F.push({ k: 'amo', icon: 'proprietaire', nom: 'Forfait d’accompagnement (AMO)', montant: ag.amo, amt: eur(ag.amo), cond: 'Assistant à maîtrise d’ouvrage habilité, pris en charge par l’Anah', src: src('Anah') });
    } else if (type === 'indigne') {
      var tv = r && r.travaux || {};
      if ((ag.tauxApplique || ag.taux)) P.push({ k: 'mpld', icon: 'logement', nom: 'Ma Prime Logement Décent', taux: (ag.tauxApplique || ag.taux), plafond: tv.plafondApplique, amt: surDevis ? eur(ag.totalApresEcretement || ag.total) : pct((ag.tauxApplique || ag.taux)),
        cond: pct((ag.tauxApplique || ag.taux)) + ' des travaux' + (tv.plafondApplique ? ', dans la limite de ' + eur(tv.plafondApplique) + ' HT' : ''), micro: surDevis ? 'calculé sur vos devis' : 'montant calculé sur vos devis', src: src('Anah, barème 2026') });
      var md = ag.mprCumulableDetail || ag.mprDetail || {};
      if (md.taux) P.push({ k: 'mprLhi', icon: 'facade', nom: 'MaPrimeRénov’, part énergétique', taux: md.taux, plafond: md.plafondHT, amt: surDevis ? eur(ag.mprCumulable) : pct(md.taux),
        cond: pct(md.taux) + ' de la part énergétique des travaux, dans la limite de ' + eur(md.plafondHT) + ' HT', micro: surDevis ? 'calculé sur vos devis' : 'montant calculé sur vos devis', src: src('Anah, barème 2026') });
      if (ag.local) F.push({ k: 'local', icon: 'logement', nom: 'Aides locales', montant: ag.local, amt: eur(ag.local), cond: 'Aides des collectivités, cumulables', src: src('collectivités') });
    }

    var forfait = F.reduce(function (s, x) { return s + (x.montant || 0); }, 0);
    var tauxMax = P.reduce(function (s, x) { return Math.max(s, x.taux || 0); }, 0);
    var total = totalMoteur(type, r);
    var ttcDevis = surDevis ? Math.round(devis.ht * 1.055) : 0;
    var parcoursPct = { energetique: 'de rénovation d’ampleur', autonomie: 'd’adaptation', indigne: 'de remise en état' }[type] || '';
    return {
      base: surDevis ? 'devis' : 'forfait',
      titre: surDevis ? 'Aides estimées sur vos devis' : 'Aides forfaitaires estimées',
      montant: surDevis ? total : forfait,
      montantTxt: eur(surDevis ? total : forfait),
      ligne: surDevis ? 'Sur ' + eur(devis.ht) + ' HT de devis · reste à votre charge : ' + eur(Math.max(0, ttcDevis - total)) + ' TTC'
        : (P.length ? 'et jusqu’à ' + pct(tauxMax) + ' des travaux ' + parcoursPct + ', calculés sur vos devis' : ''),
      reste: surDevis ? Math.max(0, ttcDevis - total) : null,
      forfaits: F, pourcentages: P, horsTotal: H, hasPct: P.length > 0, eur: eur,
    };
  }
  root.JRLecture = lire;
})(window);
