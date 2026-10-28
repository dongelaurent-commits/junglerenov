/* ══════════════════════════════════════════════════════════════════
   JungleRenov — Configuration du partenaire d'accompagnement (MAO)
   Placeholder V1 : à remplacer par les données du partenaire agréé
   quand le contrat sera signé.

   Un seul point de vérité — évite d'aller chercher les infos dans
   30 pages HTML lors de la mise à jour.

   ════════════════════════════════════════════════════════════════
   QUAND LE PARTENAIRE SERA SIGNÉ :
   1. Passer `signed: true`
   2. Renseigner `nom`, `telephone`, `email`, `siteWeb`
   3. (optionnel) `logo` : URL de leur logo
   4. Ajuster `zoneIntervention` si différent de "Grand Est"
   5. Ajuster `missions.rapport_ergotherapeute` s'ils le proposent
   6. Redéployer sur Vercel — tout se met à jour automatiquement
      sur toutes les pages qui affichent le bloc partenaire.
   ════════════════════════════════════════════════════════════════
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  root.RFPartner = {
    // ─── Statut ────────────────────────────────────────────────────
    // false = placeholder (bloc "en cours de sélection"),
    // true  = partenaire signé (bloc "présenté")
    signed: false,

    // ─── Identité (à renseigner lorsque signed = true) ─────────────
    nom: 'À définir — partenaire en cours de sélection',
    logo: null,               // URL logo (optionnelle)
    agrement: "MAR agréé par l'Anah",
    zoneIntervention: 'Lorraine (54, 55, 57, 88)',

    // ─── Contact ──────────────────────────────────────────────────
    telephone: null,          // Ex : '03 83 XX XX XX'
    email: null,              // Ex : 'contact@partenaire.fr'
    siteWeb: null,            // Ex : 'https://partenaire.fr'

    // ─── Missions couvertes ───────────────────────────────────────
    missions: {
      audit_energetique: true,
      montage_dossier_mpr: true,
      montage_dossier_mpa: true,
      montage_dossier_mpld: true,
      selection_artisans_rge: true,
      coordination_chantier: true,
      visite_pre_travaux: true,
      visite_post_travaux: true,
      rapport_ergotherapeute: false,   // service optionnel
    },

    // ─── Tarification (indicatif — refacturé au user par le MAO) ──
    // Ces montants sont pris en charge par l'Anah (voir Guide 2026 p.23)
    tarifs: {
      mpr_ampleur: {
        plafond_ttc: 2000,     // ANAH prend en charge 100/80/40/20 % selon revenus
        note: 'Plafond de financement : 2 000 € TTC (Guide Anah p.23)',
      },
      mpld: {
        finance_par_anah: true,
        note: "Accompagnement financé par l'Anah (secteur diffus)",
      },
      mpa: {
        complet: 600,          // TTC, 100 % Anah en diffus
        complet_ergotherapie: 800,
        note: 'Forfait Anah pris en charge à 100 % en secteur diffus (Guide Anah p.60)',
      },
    },

    // ─── Message de placeholder (affiché tant que signed = false) ─
    messagePlaceholder: "Nous finalisons actuellement notre partenariat avec une structure MAR agréée par l'Anah, spécialisée dans l'accompagnement des projets de rénovation. Vous serez mis en relation dès validation de votre dossier.",
  };

  /* Libellés des missions — évite une cascade de `if` et garde l'ordre d'affichage */
  var MISSION_LABELS = [
    ['audit_energetique',      'Audit énergétique'],
    ['montage_dossier_mpr',    "Montage dossier MaPrimeRénov'"],
    ['montage_dossier_mpa',    "Montage dossier MaPrimeAdapt'"],
    ['montage_dossier_mpld',   'Montage dossier Ma Prime Logement Décent'],
    ['selection_artisans_rge', "Sélection d'artisans RGE"],
    ['coordination_chantier',  'Coordination des travaux'],
    ['visite_pre_travaux',     'Visite pré-travaux'],
    ['visite_post_travaux',    'Visite post-travaux + prise en main'],
    ['rapport_ergotherapeute', "Rapport d'ergothérapeute (autonomie)"],
  ];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c];
    });
  }

  /* Injecte le bloc partenaire dans l'élément ciblé.
     Idempotent : un second appel réécrit simplement le contenu. */
  root.RFPartner.render = function(targetSelector){
    var el = document.querySelector(targetSelector);
    if (!el) return;
    var p = root.RFPartner;

    var contactBlock = '';
    if (p.signed && (p.telephone || p.email || p.siteWeb)) {
      contactBlock = '<div class="mao-contact">' +
        (p.telephone ? '<div><span class="mao-ci">Tél.</span> <a href="tel:' + esc(p.telephone.replace(/\s/g,'')) + '">' + esc(p.telephone) + '</a></div>' : '') +
        (p.email     ? '<div><span class="mao-ci">E-mail</span> <a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a></div>' : '') +
        (p.siteWeb   ? '<div><span class="mao-ci">Site</span> <a href="' + esc(p.siteWeb) + '" target="_blank" rel="noopener">' + esc(p.siteWeb.replace(/^https?:\/\//,'')) + '</a></div>' : '') +
      '</div>';
    }

    var missionsList = MISSION_LABELS
      .filter(function(m){ return !!p.missions[m[0]]; })
      .map(function(m){ return m[1]; });

    var statusBadge = p.signed
      ? '<span class="mao-badge mao-badge-active">Partenaire agréé</span>'
      : '<span class="mao-badge mao-badge-pending">En cours de sélection</span>';

    var mainMessage = p.signed
      ? '<p><strong>' + esc(p.nom || 'Votre partenaire habilité') + '</strong> — ' + esc(p.agrement) +
        ', couvre le ' + esc(p.zoneIntervention) + '.</p>'
      : '<p>' + esc(p.messagePlaceholder) + '</p>';

    el.innerHTML =
      '<div class="mao-block">' +
        '<div class="mao-header">' +
          '<h3>Votre partenaire habilité</h3>' + statusBadge +
        '</div>' +
        mainMessage +
        (missionsList.length
          ? '<div class="mao-missions"><strong>Missions couvertes</strong><ul>' +
            missionsList.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join('') +
            '</ul></div>'
          : '') +
        contactBlock +
        '<div class="mao-note">' +
          "L'accompagnement par un MAR (Mon Accompagnateur Rénov') est <strong>obligatoire</strong> pour toute demande " +
          "MaPrimeRénov' Ampleur, MaPrimeAdapt' et Ma Prime Logement Décent. Son coût est " +
          "<strong>pris en charge par l'Anah à hauteur de 100 % à 20 % selon vos revenus</strong>, dans la limite d'un forfait de 2 000 € TTC. " +
          "Le solde éventuel reste à votre charge, et vous est indiqué par écrit avant tout engagement." +
        '</div>' +
      '</div>';
  };

  /* CSS du composant, injecté une seule fois — évite de dupliquer
     la même feuille de style dans les 4 pages hôtes. */
  root.RFPartner.injectStyles = function(){
    if (document.getElementById('rf-mao-styles')) return;
    var css = '.mao-block{margin-top:32px;padding:22px 24px;background:var(--paper-deep);border-radius:6px;border:1px solid #E9E3D3}'
      + '.mao-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px;flex-wrap:wrap}'
      + '.mao-header h3{margin:0;font-size:18px;font-weight:700;color:#123A2E}'
      + '.mao-badge{display:inline-block;padding:5px 11px;border-radius:6px;font:700 17px "Komet","Red Hat Display",system-ui,sans-serif,monospace;}'
      + '.mao-badge-active{background:#1F6B3F;color:#FFFFFF}'
      + '.mao-badge-pending{background:#123A2E;color:#FFFFFF}'
      + '.mao-block p{color:#123A2E;font-size:17px;line-height:1.6;margin:0 0 16px;text-wrap:pretty}'
      + '.mao-missions{margin-bottom:16px}'
      + '.mao-missions>strong{display:block;margin-bottom:8px;color:#123A2E;font-size:17px}'
      + '.mao-missions ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px 14px}'
      + '.mao-missions li{color:#123A2E;font-size:17px;padding-left:18px;position:relative;line-height:1.45}'
      + '.mao-missions li::before{content:"";position:absolute;left:2px;top:6px;width:7px;height:7px;border-radius:50%;background:#1F6B3F}'
      + '.mao-contact{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:16px;padding:13px 15px;background:#FFFFFF;border-radius:6px;font-size:17px}'
      + '.mao-contact .mao-ci{font:600 17px "Komet","Red Hat Display",system-ui,sans-serif,monospace;color:#123A2E}'
      + '.mao-contact a{color:#1F6B3F;text-decoration:none}'
      + '.mao-contact a:hover{color:#123A2E;text-decoration:underline}'
      + '.mao-note{padding:11px 14px;background:rgba(255,255,255,.65);border-left:0;border-radius:6px;font-size:17px;color:#123A2E;line-height:1.55}';
    var s = document.createElement('style');
    s.id = 'rf-mao-styles';
    s.textContent = css;
    document.head.appendChild(s);
  };

  /* Monte le bloc dès que le DOM est prêt, sur tout slot présent. */
  root.RFPartner.mount = function(selector){
    var sel = selector || '#mao-partenaire-slot';
    function go(){ root.RFPartner.injectStyles(); root.RFPartner.render(sel); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  };
})(window);
