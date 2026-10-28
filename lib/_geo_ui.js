/* ══════════════════════════════════════════════════════════════════
   JungleRenov — Garde-fou géographique, couche interface
   Trois contrôles, un seul fichier partagé par les 3 tunnels :
     · bandeau contextuel sous le champ adresse (étape 1)
     · bandeau « mode découverte » sous le header
     · remplacement du paiement par la liste d'attente (étape 8)
   Mode dégradé permissif : sans RFGeo, rien ne s'affiche et le tunnel
   fonctionne normalement.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (!window.RFGeo) return;

  var GEO_KEY = 'junglerenov.geoStatus';
  var TUNNEL = document.body.getAttribute('data-tunnel') ||
    (location.pathname.indexOf('autonomie') > -1 ? 'MPA'
      : location.pathname.indexOf('indigne') > -1 ? 'LHI' : 'ENERGETIQUE');

  /* Champ adresse de l'étape 1, selon le tunnel. */
  var ADDRESS_IDS = ['addr', 'ad-adresse', 'li-adresse'];
  /* Blocs de l'étape 8 masqués hors zone active : récapitulatif, professionnel
     désigné, formulaire de transmission. Aucun dossier ne part vers un
     professionnel dans une région que nous ne couvrons pas encore. */
  var TX_SELECTORS = [
    '#step-8 .rf-tx__card', '#step-8 .rf-tx__pro', '#step-8 .rf-tx__free',
    '#step-8 .rf-tx__aval', '#step-8 .signup', '#step-8 .rf-dossier__human',
    '#s8 .rf-tx__card', '#s8 .rf-tx__pro', '#s8 .rf-tx__free',
    '#s8 .rf-tx__aval', '#s8 .signup', '#s8 .rf-dossier__human',
    /* Le bouton du pied de page renvoie au formulaire : il ne doit pas
       subsister quand celui-ci est masqué. */
    '.footer-nav #next'
  ];

  var CSS = [
    '.rf-geo-banner{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;margin-top:12px;border-radius:6px;font-size:17px;line-height:1.5}',
    '.rf-geo-banner[hidden]{display:none}',
    '.rf-geo-banner.active{background:#ECFDF5;color:#065F46;border:1px solid #ECFDF5}',
    '.rf-geo-banner.waitlist{background:#E9E3D3;color:#123A2E;border:1px solid #E9E3D3}',
    '.rf-geo-banner.blocked{background:#FEE2E2;color:#991B1B;border:1px solid #FEE2E2}',
    '.rf-geo-banner .rf-geo-text{margin:0}',
    '.rf-geo-icon{flex:0 0 auto;font-size:17px;line-height:1.4}',
    '.rf-discovery-banner{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:10px 20px;background:#E9E3D3;color:#123A2E;font-size:17px;border-bottom:1px solid #E9E3D3}',
    '.rf-discovery-banner[hidden]{display:none}',
    '.rf-discovery-banner a{color:#123A2E;font-weight:600;text-decoration:underline}',
    '.rf-waitlist-block{background:#E9E3D3;border:1px solid #E9E3D3;border-radius:6px;padding:28px;max-width:560px;margin:32px auto}',
    '.rf-waitlist-block[hidden]{display:none}',
    '.rf-waitlist-block h2{color:#123A2E;margin:0 0 10px;font-size:22px;',
    '.rf-waitlist-lead{color:#123A2E;margin:0 0 20px;font-size:17px;line-height:1.55;text-wrap:pretty}',
    '.rf-waitlist-block label{display:block;margin-bottom:16px;font-size:17px;color:#123A2E;font-weight:600}',
    '.rf-waitlist-block input[type="email"]{width:100%;padding:12px;margin-top:6px;border-radius:6px;border:1px solid #123A2E;font:400 17px inherit;background:#FFFFFF;color:#123A2E;box-sizing:border-box}',
    '.rf-waitlist-consent{display:flex;gap:10px;align-items:flex-start;font-weight:400!important;line-height:1.5}',
    '.rf-waitlist-consent input{margin-top:4px;flex:0 0 auto;accent-color:#123A2E}',
    '.rf-waitlist-block .rf-btn-primary{width:100%;padding:14px;background:#123A2E;color:#FFFFFF;border:none;border-radius:6px;font:600 17px inherit;cursor:pointer}',
    '.rf-waitlist-block .rf-btn-primary:hover{background:#123A2E}',
    '.rf-waitlist-error{display:none;margin:0 0 14px;font-size:17px;color:#991B1B;font-weight:600}',
    '.rf-waitlist-note{text-align:center;margin:12px 0 0;font-size:17px;color:#123A2E}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  function readGeo(){
    try { return JSON.parse(sessionStorage.getItem(GEO_KEY) || 'null'); }
    catch (_) { return null; }
  }

  /* ── Étape 1 : bandeau contextuel sous le champ adresse ── */
  var cpInput = null;
  for (var i = 0; i < ADDRESS_IDS.length && !cpInput; i++) cpInput = document.getElementById(ADDRESS_IDS[i]);

  if (cpInput) {
    var banner = document.createElement('div');
    banner.id = 'rf-geo-banner';
    banner.className = 'rf-geo-banner';
    banner.hidden = true;
    banner.innerHTML = '<span class="rf-geo-icon" aria-hidden="true">◉</span><p class="rf-geo-text"></p>';
    var anchor = cpInput.closest('.field') || cpInput.parentNode;
    anchor.parentNode.insertBefore(banner, anchor.nextSibling);

    var refresh = function(){
      var cp = RFGeo.extractCP(cpInput.value);
      var res = RFGeo.check(cp);
      if (res.status === 'unknown') {
        banner.hidden = true;
        sessionStorage.removeItem(GEO_KEY);
        applyDiscovery();
        return;
      }
      banner.hidden = false;
      banner.className = 'rf-geo-banner ' + res.status;
      banner.querySelector('.rf-geo-text').textContent = res.status === 'active'
        ? 'Votre région (' + res.region + ') est active. Nous accompagnons votre dossier.'
        : RFGeo.bannerText(res.status, res.region);
      res.codePostal = cp;
      sessionStorage.setItem(GEO_KEY, JSON.stringify(res));
      applyDiscovery();
    };

    cpInput.addEventListener('input', refresh);
    cpInput.addEventListener('blur', refresh);
    cpInput.addEventListener('change', refresh);
    /* Le premier passage est DIFFÉRÉ : `refresh()` appelle `applyDiscovery()`,
       qui a besoin du bandeau créé plus bas dans ce fichier. L'appeler ici
       levait « discovery is undefined » dès que le champ code postal était
       pré-rempli par un profil restauré. */
    if (cpInput.value) setTimeout(refresh, 0);
  }

  /* ── Bandeau « mode découverte » sous le header ── */
  var discovery = document.createElement('div');
  discovery.id = 'rf-discovery-banner';
  discovery.className = 'rf-discovery-banner';
  discovery.hidden = true;
  discovery.innerHTML = '<span>Vous êtes en mode découverte — JungleRenov est actuellement actif en Lorraine : Meurthe-et-Moselle, Meuse, Moselle, Vosges.</span>' +
    '<a href="merci-liste-attente.dc.html">Rejoindre la liste d\'attente</a>';
  var header = document.querySelector('header');
  if (header && header.parentNode) header.parentNode.insertBefore(discovery, header.nextSibling);

  function applyDiscovery(){
    // Filet : la fonction peut être atteinte avant la création du bandeau.
    if (!discovery) return;
    var geo = readGeo();
    discovery.hidden = !(geo && geo.status !== 'active' && geo.status !== 'unknown');
    applyTransmissionGate();
  }

  /* ── Étape 8 : liste d'attente au lieu de la transmission ── */
  var waitlist = document.createElement('div');
  waitlist.id = 'rf-waitlist-block';
  waitlist.className = 'rf-waitlist-block';
  waitlist.hidden = true;
  waitlist.innerHTML =
    '<h2>Votre région n\'est pas encore active</h2>' +
    '<p class="rf-waitlist-lead">Rejoignez la liste d\'attente et soyez prévenu·e dès l\'ouverture de votre région. Nous n\'avons pas encore d\'partenaire habilité conventionné chez vous : votre dossier ne peut donc pas être transmis.</p>' +
    '<form id="rf-waitlist-form" novalidate>' +
      '<p class="rf-waitlist-error" id="rf-waitlist-error">Renseignez un email valide et cochez la case de consentement.</p>' +
      '<label>Votre email<input type="email" name="email" required autocomplete="email" placeholder="prenom.nom@exemple.fr" /></label>' +
      '<label class="rf-waitlist-consent"><input type="checkbox" name="consentement" required />' +
      '<span>J\'accepte que JungleRenov enregistre mon email pour me prévenir de l\'ouverture du service dans ma région. Aucun autre usage. Je peux me désinscrire à tout moment.</span></label>' +
      '<button type="submit" class="rf-btn rf-btn-primary">Rejoindre la liste d\'attente</button>' +
      '<p class="rf-waitlist-note">Simulation gratuite conservée dans votre navigateur.</p>' +
    '</form>';

  var etapeFinale = document.getElementById('step-8') || document.getElementById('s8');
  if (etapeFinale) etapeFinale.appendChild(waitlist);

  var hidden = [];
  function applyTransmissionGate(){
    var geo = readGeo();
    var locked = !!(geo && geo.status !== 'active' && geo.status !== 'unknown');

    if (!locked) {
      hidden.forEach(function(el){ el.style.display = el.__rfPrevDisplay || ''; });
      hidden = [];
      waitlist.hidden = true;
      return;
    }
    if (!etapeFinale) return;

    TX_SELECTORS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if (hidden.indexOf(el) !== -1) return;
        el.__rfPrevDisplay = el.style.display;
        el.style.display = 'none';
        hidden.push(el);
      });
    });
    waitlist.hidden = false;
  }

  var form = waitlist.querySelector('#rf-waitlist-form');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var geo = readGeo() || { region: 'Hors zone active' };
    var email = form.querySelector('[name="email"]').value.trim();
    var consentement = form.querySelector('[name="consentement"]').checked;
    var err = form.querySelector('#rf-waitlist-error');
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid || !consentement) { err.style.display = 'block'; return; }
    err.style.display = 'none';

    var ok = RFGeo.addToWaitlist({
      email: email,
      codePostal: geo.codePostal || '',
      region: geo.region,
      tunnel: TUNNEL,
      consentement: true
    });
    if (ok) location.href = 'merci-liste-attente.dc.html?region=' + encodeURIComponent(geo.region || '');
  });

  applyDiscovery();
})();
