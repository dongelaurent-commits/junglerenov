/* ══════════════════════════════════════════════════════════════════
   JungleRenov — registre des barèmes : valeur, source, date

   Le moteur lit ce fichier. Chaque montant porte sa source ; un montant
   marqué `aConfirmer: true` ne s'affiche jamais en euros à l'utilisateur.

   Chargement : avant _compute_aids.js dans chaque page. Sous node, le
   moteur le charge lui-même (require).
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var GUIDE_ANAH = "Guide des aides Anah, février 2026";

  var B = {
    /* ── B1 · Écrêtement — deux tables, jamais interverties ───────── */
    ecretement_geste: {
      valeur: { bleus: 0.90, jaunes: 0.75, violets: 0.60, roses: null },
      avecAideLocale: 1.00,   // 100 % dans toutes les catégories dès qu'une aide locale entre dans le cumul
      note: 'Les revenus supérieurs ne sont pas éligibles au parcours par geste.',
      source: GUIDE_ANAH, date: '2026-02-01',
    },
    ecretement_ampleur: {
      valeur: { bleus: 1.00, jaunes: 0.90, violets: 0.80, roses: 0.50 },
      base: 'coût TTC', source: GUIDE_ANAH, date: '2026-02-01',
    },

    /* ── B2 · Mon Accompagnateur Rénov' ───────────────────────────── */
    mar: {
      plafondTTC: 2000, plafondRenforceTTC: 4000,
      priseEnCharge: { bleus: 1.00, jaunes: 0.80, violets: 0.40, roses: 0.20 },
      source: GUIDE_ANAH, date: '2026-02-01',
    },

    /* ── B3 · AMO MaPrimeAdapt' — forfaits versés par l'Anah ─────── */
    amo_mpa: {
      socle: 350, complet: 600, complet_ergotherapie: 800, unite: '€ TTC',
      note: "Si l'opérateur facture davantage, la différence reste à la charge du ménage.",
      source: GUIDE_ANAH, date: '2026-02-01',
    },

    /* ── B4 · Métropole du Grand Nancy ───────────────────────────── */
    grand_nancy_maison: {
      tauxMin: 0.05, tauxMax: 0.15,          // des dépenses éligibles MaPrimeRénov'
      plafond: 10000, plafondRoses: 5000,
      isolationComplementaire: { combles_perdus: 5, sarking: 50 },   // €/m²
      source: 'Métropole du Grand Nancy — Plan Climat Air Énergie', date: '2026-09-01',
    },
    grand_nancy_copro: {
      audit: { taux: 0.50, plafond: 5000 },
      travaux: { tauxMin: 0.10, tauxMax: 0.15, plafondParLogement: { saine: 2500, fragile: 3250 } },
      bonusMenageModeste: 1500,              // par ménage modeste ou très modeste, rénovation globale
      source: 'Métropole du Grand Nancy — Plan Climat Air Énergie', date: '2026-09-01',
    },

    /* ── B5 · Prime Air Bois ─────────────────────────────────────── */
    prime_air_bois: {
      base: 1500, bonusMax: 1000, total: 2500,
      plafondsBonus: [22259, 32553, 39148, 45735, 52348], parPersonneSup: 6598,
      conditions: [
        'Appareil remplacé installé avant 2005',
        'Appareil neuf labellisé Flamme Verte',
        'Installateur RGE',
        'Résidence principale depuis plus de deux ans',
      ],
      source: 'Fonds Air Bois — Métropole du Grand Nancy', date: '2026-09-01',
    },

    /* ── B6 · CEE — une fourchette, jamais un montant ────────────── */
    cee: {
      ecartMin: 0.90, ecartMax: 1.10,        // 10 à 20 % d'écart d'un obligé à l'autre
      note: "Non réglementaire : dépend de l'ETAS de l'équipement, de la zone climatique et de l'obligé.",
      source: 'Arrêtés CEE — fiches standardisées ; prix de marché des obligés', date: '2026-09-01',
    },

    /* ── Contrôle de vraisemblance du coût saisi (A5) ─────────────── */
    vraisemblance: { coutMin: 1000, coutMaxParM2: 5000 },

    /* ── Restent à confirmer ─────────────────────────────────────── */
    cout_mar_marche: { valeur: null, fourchette: [500, 3000], unite: '€', aConfirmer: true, confirmePar: 'Futur partenaire MAR' },
    remuneration_indigne_ht: { valeur: null, aConfirmer: true, confirmePar: 'Frank — segment absent des documents 2027 et 2028' },
  };

  function eur(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); }

  root.RFBaremes = {
    BAREMES: B,
    get: function (cle) { return B[cle] || null; },
    afficher: function (cle) {
      var b = B[cle];
      if (!b) return null;
      if (!b.aConfirmer) return b.valeur !== undefined ? b.valeur : b;
      if (b.fourchette && b.unite === '€') return 'entre ' + eur(b.fourchette[0]) + ' et ' + eur(b.fourchette[1]) + ' (à confirmer)';
      return null;
    },
    aConfirmer: function () { return Object.keys(B).filter(function (k) { return B[k].aConfirmer; }); },
    /* Fourchette CEE autour d'une valeur de référence */
    fourchetteCee: function (v) {
      var r = Math.round(v || 0);
      return { min: Math.round(r * B.cee.ecartMin), max: Math.round(r * B.cee.ecartMax), unique: false };
    },
    /* Plafond de ressources du bonus Prime Air Bois */
    plafondAirBois: function (personnes) {
      var p = B.prime_air_bois, n = Math.max(1, Number(personnes) || 1);
      return n <= 5 ? p.plafondsBonus[n - 1] : p.plafondsBonus[4] + p.parPersonneSup * (n - 5);
    },
  };
  /* Les pages n'écrivent jamais un barème en dur : elles posent un
     <span data-bareme="cle">valeur de repli</span>, rempli d'ici au chargement. */
  function remplirBaremes() {
    if (typeof document === 'undefined') return;
    var eur = function (n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); };
    var rendus = {
      amo_mpa: function () { return eur(B.amo_mpa.socle).replace(/\s?€$/, '') + ' à ' + eur(B.amo_mpa.complet_ergotherapie); },
    };
    document.querySelectorAll('[data-bareme]').forEach(function (el) {
      var f = rendus[el.getAttribute('data-bareme')];
      if (f) el.textContent = f();
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', remplirBaremes);
    else remplirBaremes();
  }
  root.RFBaremes.remplir = remplirBaremes;
})(typeof window !== 'undefined' ? window : globalThis);
