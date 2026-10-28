/* ══════════════════════════════════════════════════════════════════
   RénoFacile — Transparence accompagnement obligatoire, couche interface
   Partagé par les 3 tunnels et « Mes aides » :
     · bandeau contextuel (ambre si reste à charge, vert si intégré)
     · ligne « Coût accompagnement obligatoire » au récap des aides
     · case de reconnaissance du coût MAR (à charge de l'utilisateur uniquement)
   Mode dégradé permissif : sans RFMar, rien ne s'affiche.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (!window.RFMar) return;

  /* Clé propre à chaque tunnel : une analyse MPA ou LHI ne doit jamais être
     rejouée sur le tunnel énergétique — le dispositif affiché serait faux,
     et ce bloc existe précisément pour garantir une information exacte. */
  var STORE_PREFIX = 'renofacile.marAnalysis.';
  var TUNNEL = document.body.getAttribute('data-tunnel') ||
    (location.pathname.indexOf('autonomie') > -1 ? 'MPA'
      : location.pathname.indexOf('indigne') > -1 ? 'LHI' : 'ENERGETIQUE');

  var CSS = [
    '.rf-mar-banner{display:flex;gap:14px;align-items:flex-start;padding:16px 20px;margin:24px 0;max-width:720px;border-radius:14px;background:#FFFBEB;border:1px solid #FDE68A;color:#78350F}',
    '.rf-mar-banner[hidden]{display:none}',
    '.rf-mar-banner .rf-mar-icon{flex:0 0 auto;width:22px;height:22px;margin-top:1px;color:#B45309}',
    '.rf-mar-banner .rf-mar-title{display:block;font-size:15px;margin-bottom:6px;color:#92400E}',
    '.rf-mar-banner .rf-mar-text{margin:0 0 10px;font-size:14px;line-height:1.55;text-wrap:pretty}',
    '.rf-mar-banner .rf-mar-link{display:inline-block;color:#92400E;font-weight:600;text-decoration:underline;font-size:13px}',
    '.rf-mar-banner .rf-mar-link[hidden]{display:none}',
    '.rf-mar-banner.integre{background:#ECFDF5;border-color:#A7F3D0;color:#065F46}',
    '.rf-mar-banner.integre .rf-mar-title{color:#065F46}',
    '.rf-mar-banner.integre .rf-mar-icon{color:#059669}',
    '.rf-mar-line{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;border-top:1px dashed #E5E7EB;padding-top:12px;margin-top:14px;color:#78350F;font-size:14px}',
    '.rf-mar-line[hidden]{display:none}',
    '.rf-mar-line .rf-mar-line-hint{display:block;color:#92400E;font-size:12px;font-weight:400;margin-top:2px}',
    '.rf-mar-line .rf-mar-line-label{font-weight:600}',
    '.rf-mar-line .rf-mar-line-value{text-align:right;font-size:13.5px}',
    '.rf-mar-line .rf-mar-deduction{color:#059669}',
    '.rf-mar-line strong{display:block;margin-top:4px;color:#92400E;font-size:14px}',
    '.rf-mar-consent{background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:13px;color:#78350F;line-height:1.55}',
    '.rf-mar-consent[hidden]{display:none}',
    '.rf-mar-consent label{display:flex;gap:10px;align-items:flex-start;cursor:pointer}',
    '.rf-mar-consent input{margin-top:4px;flex-shrink:0;accent-color:#D97706}',
    '.rf-mar-consent strong{color:#92400E}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var ICON_WARN = '<svg class="rf-mar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
  var ICON_OK = '<svg class="rf-mar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>';

  var TITLES = {
    MAR: "Mon Accompagnateur Rénov' obligatoire",
    AMO: "Assistance à Maîtrise d'Ouvrage obligatoire",
    OPERATEUR: 'Opérateur agréé Anah obligatoire'
  };

  var STORE = STORE_PREFIX + TUNNEL;

  var fmtEUR = function(n){
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
  };

  function read(){
    try {
      var a = JSON.parse(sessionStorage.getItem(STORE) || 'null');
      // Double garde : on ignore tout enregistrement d'un autre tunnel.
      return (a && a.tunnel && a.tunnel !== TUNNEL) ? null : a;
    } catch (_) { return null; }
  }

  /* ── Bandeau ── */
  var banner = null;
  var anchor = document.getElementById('rf-mar-anchor');
  if (anchor) {
    banner = document.createElement('div');
    banner.id = 'rf-mar-banner';
    banner.className = 'rf-mar-banner';
    banner.hidden = true;
    banner.innerHTML = ICON_WARN +
      '<div class="rf-mar-content"><strong class="rf-mar-title"></strong>' +
      '<p class="rf-mar-text"></p>' +
      '<a class="rf-mar-link" href="' + RFMar.URL_ANNUAIRE_FRANCE_RENOV + '" target="_blank" rel="noopener noreferrer">Consulter l\'annuaire officiel France Rénov\' →</a></div>';
    anchor.appendChild(banner);
  }

  /* ── Ligne au récap des aides ── */
  var line = null;
  var lineAnchor = document.getElementById('rf-mar-line-anchor');
  if (lineAnchor) {
    line = document.createElement('div');
    line.id = 'rf-mar-line';
    line.className = 'rf-mar-line';
    line.hidden = true;
    line.innerHTML =
      '<div class="rf-mar-line-label">Coût accompagnement obligatoire' +
      '<span class="rf-mar-line-hint">Honoraires du professionnel agréé · non comptés dans le total des aides</span></div>' +
      '<div class="rf-mar-line-value"><span class="rf-mar-brut"></span>' +
      '<span class="rf-mar-deduction"> − <span class="rf-mar-prime"></span> prime Anah</span>' +
      '<strong class="rf-mar-net"></strong></div>';
    lineAnchor.appendChild(line);
  }

  /* ── Case de reconnaissance du coût MAR ── */
  var consent = null, consentCheck = null;
  var consentAnchor = document.getElementById('rf-mar-consent-anchor');
  if (consentAnchor) {
    consent = document.createElement('div');
    consent.id = 'rf-mar-consent';
    consent.className = 'rf-mar-consent';
    consent.hidden = true;
    consent.innerHTML = '<label><input type="checkbox" id="rf-mar-consent-check" required />' +
      '<span>Je reconnais que ma rénovation nécessite un <strong>Mon Accompagnateur Rénov\'</strong> agréé Anah, ' +
      'et que ce coût (<strong id="rf-mar-consent-reste">~0 €</strong> à ma charge après prime Anah) ' +
      '<strong>n\'est pas pris en charge</strong> par RénoFacile, dont le service m\'est fourni gratuitement. ' +
      'Le MAR est choisi et rémunéré séparément, via l\'annuaire officiel France Rénov\'.</span></label>';
    consentAnchor.appendChild(consent);
    consentCheck = consent.querySelector('#rf-mar-consent-check');
  }

  /* Verrou du bouton de transmission : la validation propre au tunnel continue
     de fonctionner, on ne fait que la contraindre tant que la case MAR
     n'est pas cochée (preuve d'information éclairée). */
  var payBtn = document.getElementById('su-submit') ||
               document.getElementById('mpa-submit') ||
               document.getElementById('lhi-submit');
  var lockActive = false;
  if (payBtn && consentCheck) {
    new MutationObserver(function(){
      if (lockActive && !consentCheck.checked && !payBtn.disabled) {
        payBtn.disabled = true;
        payBtn.style.opacity = '.55';
        payBtn.style.cursor = 'not-allowed';
      }
    }).observe(payBtn, { attributes: true, attributeFilter: ['disabled'] });

    consentCheck.addEventListener('change', function(){
      if (!consentCheck.checked) {
        payBtn.disabled = true;
        payBtn.style.opacity = '.55';
        payBtn.style.cursor = 'not-allowed';
        return;
      }
      // Laisse la validation du tunnel se reprononcer sur l'état réel du formulaire.
      var probe = document.getElementById('su-email') || document.getElementById('mpa-email') || document.getElementById('lhi-email');
      if (probe) probe.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function apply(a){
    if (a) {
      a.tunnel = TUNNEL;
      try { sessionStorage.setItem(STORE, JSON.stringify(a)); } catch (_) {}
    }

    // Bandeau
    if (banner) {
      if (!a || !a.required) {
        banner.hidden = true;
      } else {
        banner.hidden = false;
        var integre = a.resteACharge === 0 && !a.soldePossible;
        banner.classList.toggle('integre', integre);
        banner.querySelector('.rf-mar-icon').outerHTML = integre ? ICON_OK : ICON_WARN;
        banner.querySelector('.rf-mar-title').textContent = TITLES[a.type] || 'Accompagnement obligatoire';
        banner.querySelector('.rf-mar-text').textContent = RFMar.bannerText(a);
        banner.querySelector('.rf-mar-link').hidden = (a.type !== 'MAR');
      }
    }

    // Ligne de récap — c'est un coût, jamais additionné aux aides
    if (line) {
      if (!a || !a.required) {
        line.hidden = true;
      } else {
        line.hidden = false;
        var lbl = line.querySelector('.rf-mar-line-label');
        if (lbl && lbl.firstChild) lbl.firstChild.nodeValue = (a.coutMin == null) ? 'Accompagnement obligatoire' : 'Coût accompagnement obligatoire';
        if (a.coutMin == null) {
          line.querySelector('.rf-mar-brut').textContent = a.forfaitAnah
            ? 'Forfait Anah : ' + fmtEUR(a.forfaitAnah.min) + ' à ' + fmtEUR(a.forfaitAnah.max)
            : "Coût selon le devis de l'opérateur";
        } else line.querySelector('.rf-mar-brut').textContent = a.coutMin === a.coutMax
          ? fmtEUR(a.coutMin)
          : fmtEUR(a.coutMin) + ' – ' + fmtEUR(a.coutMax);
        line.querySelector('.rf-mar-prime').textContent = a.primeDeduite == null ? 'forfait' : fmtEUR(a.primeDeduite);
        var ded = line.querySelector('.rf-mar-deduction');
        if (ded) ded.hidden = a.primeDeduite == null;
        line.querySelector('.rf-mar-net').textContent = 'Reste à votre charge : ' +
          (a.resteACharge === null || a.resteACharge === undefined
            ? (a.forfaitAnah ? "selon le devis de l'opérateur — un solde est possible au-delà du forfait Anah" : "selon le devis de l'opérateur")
            : a.resteACharge === 0 ? 'inclus dans le dispositif — 0 €' : '~' + fmtEUR(a.resteACharge));
      }
    }

    // Case de consentement — seulement quand il reste réellement quelque chose à payer
    if (consent && consentCheck) {
      var need = !!(a && a.required && a.resteACharge > 0);
      lockActive = need;
      consent.hidden = !need;
      if (need) {
        document.getElementById('rf-mar-consent-reste').textContent = '~' + fmtEUR(a.resteACharge);
        if (!consentCheck.checked && payBtn) {
          payBtn.disabled = true;
          payBtn.style.opacity = '.55';
          payBtn.style.cursor = 'not-allowed';
        }
      }
    }
  }

  /* Appelé par le tunnel énergétique dès que gestes et gain DPE sont connus. */
  window.rfMarRefresh = function(data){
    apply(RFMar.analyze({
      tunnel: TUNNEL,
      gestes: (data && data.gestes) || [],
      gainClassesDPE: (data && data.gainClassesDPE) || 0,
      profilAnah: (data && data.profilAnah) || ''
    }));
  };

  if (TUNNEL === 'MPA' || TUNNEL === 'LHI') {
    // Obligation systématique : rien à attendre du parcours.
    apply(RFMar.analyze({ tunnel: TUNNEL }));
  } else {
    // Page de suivi (« Mes aides ») : on rejoue l'analyse mémorisée.
    var stored = read();
    if (stored) apply(stored);
  }
})();
