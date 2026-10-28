/* ══════════════════════════════════════════════════════════════════
   JungleRenov — Transmission du dossier à un partenaire habilité
   Remplace l'ancienne charnière transactionnelle du parcours.

   Modèle : le particulier ne règle jamais JungleRenov. Le dossier est
   monté puis TRANSMIS à un partenaire habilité (MAR pour la rénovation
   d'ampleur, AMO/MAO pour la rénovation par geste, opérateur agréé pour
   l'habitat dégradé). C'est ce professionnel qui est facturé par
   JungleRenov, en B2B, hors du site.

   API :
     RFTransmission.professionnelPour(type, dept) → { role, roleLong, nom,
                                                      departement, designe }
     RFTransmission.transmettre(dossierId, opts)  → dossier mis à jour
     RFTransmission.STATUTS                       → enum ordonné
     RFTransmission.libelleStatut(statut)         → libellé affichable
     RFTransmission.injectStyles()                → CSS de l'écran
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* Rôle du professionnel selon le dispositif porté par le dossier. */
  var ROLES = {
    energetique: {
      role: 'MAR',
      roleLong: "Mon Accompagnateur Rénov'",
      precision: "Il dépose votre dossier MaPrimeRénov', suit l'instruction Anah et contrôle le chantier jusqu'au versement.",
    },
    autonomie: {
      role: 'AMO',
      roleLong: "Assistance à Maîtrise d'Ouvrage",
      precision: "Opérateur habilité par l'Anah pour MaPrimeAdapt' : il visite le logement, préconise les travaux et porte le dossier.",
    },
    indigne: {
      role: 'Opérateur agréé',
      roleLong: "Opérateur agréé Anah — habitat dégradé",
      precision: "Il établit la grille de dégradation, mandate l'audit énergétique et dépose votre dossier Ma Prime Logement Décent.",
    },
  };

  /* Départements couverts aujourd'hui. L'affectation nominative n'est
     ouverte qu'une fois la structure conventionnée : tant qu'aucun
     professionnel n'est désigné pour le département, on l'annonce
     honnêtement plutôt que d'inventer un nom. */
  var DEPARTEMENTS = {
    '08': 'Ardennes', '10': 'Aube', '51': 'Marne', '52': 'Haute-Marne',
    '54': 'Meurthe-et-Moselle', '55': 'Meuse', '57': 'Moselle',
    '67': 'Bas-Rhin', '68': 'Haut-Rhin', '88': 'Vosges',
  };

  /* Annuaire des professionnels conventionnés, par département puis type.
     Vide tant qu'aucune convention n'est signée — à remplir ici, un seul
     point de vérité, sans toucher aux pages. */
  var ANNUAIRE = {
    /* ex. '54': { energetique: { nom: 'SOLIHA 54', agrement: 'MAR agréé Anah' } } */
  };

  var STATUTS = ['brouillon', 'complet', 'cree', 'transmis', 'pris_en_charge', 'depose', 'instruit', 'verse'];

  var LIBELLES = {
    brouillon:      'Brouillon',
    complet:        'Dossier complet',
    cree:           'Dossier créé · en attente d\u2019un accompagnateur',
    transmis:       'Transmis à l\u2019accompagnateur',
    pris_en_charge: 'Pris en charge',
    depose:         'Déposé à l\u2019Anah',
    instruit:       'En instruction',
    verse:          'Aides versées',
  };

  function deptFromDossier(dossier) {
    var lg = (dossier && dossier.profile && dossier.profile.logement) || {};
    if (lg.dept) return String(lg.dept).slice(0, 2);
    var cp = lg.codePostal || lg.cp || '';
    if (!cp && lg.adresse) {
      var m = /\b\d{5}\b/.exec(lg.adresse);
      if (m) cp = m[0];
    }
    return cp ? String(cp).slice(0, 2) : '';
  }

  root.RFTransmission = {
    ROLES: ROLES,
    STATUTS: STATUTS,
    DEPARTEMENTS: DEPARTEMENTS,

    libelleStatut: function (statut) {
      return LIBELLES[statut] || LIBELLES.brouillon;
    },

    deptFromDossier: deptFromDossier,

    /* Qui reprend le dossier. `designe: false` → affectation non encore
       nominative : l'écran annonce la désignation à venir. */
    professionnelPour: function (type, dept) {
      var conf = ROLES[type] || ROLES.energetique;
      var d = dept ? String(dept).slice(0, 2) : '';
      var fiche = (ANNUAIRE[d] && ANNUAIRE[d][type]) || null;
      return {
        role: conf.role,
        roleLong: conf.roleLong,
        precision: conf.precision,
        departement: d,
        departementNom: DEPARTEMENTS[d] || '',
        nom: fiche ? fiche.nom : null,
        agrement: fiche ? fiche.agrement : conf.roleLong,
        designe: !!fiche,
      };
    },

    /* Consigne la transmission sur le dossier. Le consentement explicite
       est obligatoire (RGPD art. 6-1-a) : sans lui, rien n'est écrit. */
    transmettre: function (dossierId, opts) {
      opts = opts || {};
      if (!opts.consentement) return null;
      if (!root.RFDossiers || !RFDossiers.marquerTransmis) return null;
      return RFDossiers.marquerTransmis(dossierId, {
        partenaireId: opts.partenaireId || null,
        partenaireNom: opts.partenaireNom || null,
        partenaireRole: opts.partenaireRole || null,
        departement: opts.departement || null,
        consentementTransmission: {
          donneLe: new Date().toISOString(),
          destinataire: opts.partenaireNom || ('Professionnel agréé ' + (opts.partenaireRole || '')),
          finalite: "Dépôt et suivi du dossier d'aides auprès de l'Anah",
        },
      });
    },

    injectStyles: function () {
      if (document.getElementById('rf-tx-styles')) return;
      var css = [
        '.rf-tx{max-width:720px;margin:0 auto}',
        '.rf-tx__lead{color:var(--slate-600,#123A2E);font-size:17px;line-height:1.6;margin:0 0 26px;text-wrap:pretty}',
        '.rf-tx__card{background:#FFFFFF;border:1px solid var(--border,#E9E3D3);border-radius:6px;padding:24px;margin-bottom:18px}',
        '.rf-tx__card h3{margin:0 0 16px;font-size:17px;',
        '.rf-tx__rows{display:flex;flex-direction:column;gap:0}',
        '.rf-tx__row{display:flex;justify-content:space-between;gap:18px;padding:11px 0;border-bottom:1px solid var(--slate-50,#F4F1E8);font-size:17px}',
        '.rf-tx__row:last-child{border-bottom:0}',
        '.rf-tx__row dt{color:var(--slate-500,#123A2E);margin:0}',
        '.rf-tx__row dd{margin:0;font-weight:600;color:var(--slate-900,#123A2E);text-align:right}',
        '.rf-tx__row dd.warn{color:#123A2E}',
        '.rf-tx__pro{display:flex;gap:16px;align-items:flex-start;background:var(--teal-50,#F4F1E8);border:1px solid var(--teal-100,#E9E3D3);border-radius:6px;padding:22px;margin-bottom:18px}',
        '.rf-tx__pro-ico{flex:0 0 auto;width:42px;height:42px;border-radius:6px;background:#FFFFFF;display:grid;place-items:center;color:var(--teal-700,#1F6B3F)}',
        '.rf-tx__pro-role{font:700 17px var(--font-mono,monospace);color:var(--teal-700,#1F6B3F);margin-bottom:5px}',
        '.rf-tx__pro-nom{font-size:17px;font-weight:700;color:#123A2E;margin-bottom:6px}',
        '.rf-tx__pro-txt{font-size:17px;color:#123A2E;line-height:1.55;margin:0;text-wrap:pretty}',
        '.rf-tx__free{background:#FFFFFF;border:1px solid var(--border,#E9E3D3);border-radius:6px;padding:20px 22px;margin-bottom:12px}',
        '.rf-tx__free strong{display:block;font-size:17px;color:var(--slate-900,#123A2E);margin-bottom:6px;',
        '.rf-tx__free p{margin:0;font-size:17px;color:var(--slate-600,#123A2E);line-height:1.6;text-wrap:pretty}',
        '.rf-tx__aval{font-size:17px;color:var(--slate-500,#123A2E);line-height:1.6;margin:0 0 22px;padding:0 4px;text-wrap:pretty}',
        '.rf-tx__consent{display:flex;gap:12px;align-items:flex-start;background:var(--slate-50,#F4F1E8);border:1px solid var(--border,#E9E3D3);border-radius:6px;padding:16px 18px;margin-bottom:18px;cursor:pointer}',
        '.rf-tx__consent input{margin-top:3px;flex:0 0 auto;width:18px;height:18px;accent-color:var(--teal-700,#1F6B3F)}',
        '.rf-tx__consent span{font-size:17px;color:var(--slate-700,#123A2E);line-height:1.6}',
        '.rf-tx__submit{width:100%;justify-content:center;padding:16px;font-size:17px}',
        '.rf-tx__foot{text-align:center;font-size:17px;color:var(--slate-500,#123A2E);margin-top:12px}',
        '.rf-tx-success{display:none;background:#FFFFFF;border:1px solid var(--success-600,#065F46);border-radius:6px;padding:32px;text-align:center;max-width:720px;margin:0 auto}',
        '.rf-tx-success.show{display:block}',
        '.rf-tx-success .check{width:62px;height:62px;border-radius:50%;background:#ECFDF5;color:#065F46;display:grid;place-items:center;margin:0 auto 16px}',
        '.rf-tx-success h3{margin:0 0 10px;font-size:22px;font-weight:700;',
        '.rf-tx-success p{margin:0 auto;max-width:48ch;color:var(--slate-600,#123A2E);font-size:17px;line-height:1.6}',
        '.rf-tx-success .cd{font:500 17px var(--font-mono,monospace);color:var(--slate-500,#123A2E);margin-top:18px}',
        '.tunnel-autonomie .rf-tx__pro{background:#E9E3D3;border-color:#E9E3D3}',
        '.tunnel-autonomie .rf-tx__pro-ico{color:#123A2E}',
        '.tunnel-autonomie .rf-tx__pro-role{color:#123A2E}',
        '.tunnel-autonomie .rf-tx__pro-nom{color:#123A2E}',
        '.tunnel-autonomie .rf-tx__pro-txt{color:#123A2E}',
        '.tunnel-autonomie .rf-tx__consent input{accent-color:#123A2E}',
        '.tunnel-indigne .rf-tx__pro{background:#E9E3D3;border-color:#E9E3D3}',
        '.tunnel-indigne .rf-tx__pro-ico{color:#123A2E}',
        '.tunnel-indigne .rf-tx__pro-role{color:#123A2E}',
        '.tunnel-indigne .rf-tx__pro-nom{color:#123A2E}',
        '.tunnel-indigne .rf-tx__pro-txt{color:#123A2E}',
        '.tunnel-indigne .rf-tx__consent input{accent-color:#123A2E}',
      ].join('');
      var s = document.createElement('style');
      s.id = 'rf-tx-styles';
      s.textContent = css;
      document.head.appendChild(s);
    },

    /* Bloc « qui reprend votre dossier », rendu dans l'élément cible. */
    renderProfessionnel: function (el, type, dept) {
      if (!el) return null;
      var p = this.professionnelPour(type, dept);
      var zone = p.departementNom ? p.departementNom + ' (' + p.departement + ')' : 'votre département';
      var titre = p.designe ? p.nom : 'Un partenaire habilité de votre département va être désigné';
      el.innerHTML =
        '<div class="rf-tx__pro-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m19 8 2 2 3-3"/></svg></div>' +
        '<div><div class="rf-tx__pro-role">' + p.role + ' · ' + zone + '</div>' +
        '<div class="rf-tx__pro-nom">' + titre + '</div>' +
        '<p class="rf-tx__pro-txt">' + p.precision + ' Il vous contactera dès qu’il aura pris votre dossier en charge.</p></div>';
      return p;
    },
  };

  /* Le CSS est injecté dès le chargement : les blocs de transmission sont
     présents dans le markup avant tout rendu dynamique. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { root.RFTransmission.injectStyles(); });
  } else {
    root.RFTransmission.injectStyles();
  }
})(window);
