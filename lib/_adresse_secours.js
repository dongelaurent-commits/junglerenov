/* ══════════════════════════════════════════════════════════════════
   JungleRenov — saisie d'adresse de secours
   Quand la Base Adresse Nationale ne répond pas, ou ne connaît pas
   l'adresse (lieu-dit, construction récente), l'utilisateur ne doit
   jamais rester bloqué devant un bouton grisé. Ce module ajoute sous
   chaque champ d'adresse :
     · un lien permanent « Mon adresse n'apparaît pas » ;
     · un bloc rue / code postal / ville, code postal obligatoire —
       c'est lui qui pilote département, région et aides territoriales.

   RFAdresseSecours.attach(input, {
     regionFromDept: fn(dept) → région,
     onValide: fn(data | null)   // data : { adresse, codePostal, ville, dept, region, saisieManuelle:true }
   }) → { ouvrir(message) }
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var CSS =
    '.rf-adr-lien{display:inline-block;margin-top:8px;padding:0;border:0;background:none;color:var(--teal-700,#1F6B3F);font:600 17px/1.4 inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '.rf-adr-bloc{margin-top:12px;padding:16px 18px;background:#FFFFFF;border:1px solid var(--border,#E9E3D3);border-radius:6px}' +
    '.rf-adr-bloc[hidden]{display:none}' +
    '.rf-adr-msg{margin:0 0 12px;font-size:17px;line-height:1.55;color:#123A2E;background:#E9E3D3;border:1px solid #E9E3D3;border-radius:6px;padding:10px 12px}' +
    '.rf-adr-msg:empty{display:none}' +
    '.rf-adr-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,140px) minmax(0,1fr);gap:10px}' +
    '@media (max-width:640px){.rf-adr-grid{grid-template-columns:minmax(0,1fr)}}' +
    '.rf-adr-grid label{display:flex;flex-direction:column;gap:5px;font-size:17px;font-weight:600;color:var(--slate-700,#123A2E)}' +
    '.rf-adr-grid input{font:inherit;font-size:17px;padding:10px 12px;border:1px solid var(--slate-300,#6B7280);border-radius:6px;min-width:0}' +
    '.rf-adr-grid input:focus-visible{outline:2px solid var(--teal-700,#1F6B3F);outline-offset:2px}' +
    '.rf-adr-err{margin:8px 0 0;font-size:17px;color:#991B1B}' +
    '.rf-adr-err:empty{display:none}';

  function injectStyles() {
    if (document.getElementById('rf-adr-styles')) return;
    var s = document.createElement('style');
    s.id = 'rf-adr-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var seq = 0;

  function attach(input, opts) {
    if (!input) return { ouvrir: function () {} };
    opts = opts || {};
    injectStyles();
    var n = ++seq;
    var host = input.parentNode;

    var lien = document.createElement('button');
    lien.type = 'button';
    lien.className = 'rf-adr-lien';
    lien.textContent = "Mon adresse n'apparaît pas";

    var bloc = document.createElement('div');
    bloc.className = 'rf-adr-bloc';
    bloc.hidden = true;
    bloc.innerHTML =
      '<p class="rf-adr-msg" role="status"></p>' +
      '<div class="rf-adr-grid">' +
        '<label for="rf-adr-rue-' + n + '">Numéro et rue<input id="rf-adr-rue-' + n + '" type="text" autocomplete="address-line1" placeholder="12 rue des Tilleuls"></label>' +
        '<label for="rf-adr-cp-' + n + '">Code postal *<input id="rf-adr-cp-' + n + '" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="54000" required aria-describedby="rf-adr-err-' + n + '"></label>' +
        '<label for="rf-adr-ville-' + n + '">Commune<input id="rf-adr-ville-' + n + '" type="text" autocomplete="address-level2" placeholder="Nancy"></label>' +
      '</div>' +
      '<p class="rf-adr-err" id="rf-adr-err-' + n + '" aria-live="polite"></p>';

    var ancre = input.nextSibling;
    // Après la liste de suggestions, si elle suit le champ.
    var sugg = input.parentNode.querySelector('[id$="suggestions"]');
    if (sugg && sugg.parentNode === host) ancre = sugg.nextSibling;
    host.insertBefore(lien, ancre);
    host.insertBefore(bloc, lien.nextSibling);

    var rue = bloc.querySelector('#rf-adr-rue-' + n);
    var cp = bloc.querySelector('#rf-adr-cp-' + n);
    var ville = bloc.querySelector('#rf-adr-ville-' + n);
    var msg = bloc.querySelector('.rf-adr-msg');
    var err = bloc.querySelector('.rf-adr-err');

    function valider() {
      var c = (cp.value || '').replace(/\D/g, '');
      if (cp.value !== c) cp.value = c;
      var cpOk = /^\d{5}$/.test(c);
      cp.setAttribute('aria-invalid', cpOk || !c ? 'false' : 'true');
      err.textContent = (!c || cpOk) ? '' : 'Le code postal compte 5 chiffres.';
      if (!cpOk) { if (opts.onValide) opts.onValide(null); return; }
      var dept = c.slice(0, 2);
      var parts = [rue.value.trim(), (c + ' ' + ville.value.trim()).trim()].filter(Boolean);
      if (opts.onValide) opts.onValide({
        adresse: parts.join(', '),
        codePostal: c, ville: ville.value.trim(), dept: dept,
        region: opts.regionFromDept ? opts.regionFromDept(dept) : '',
        saisieManuelle: true,
      });
    }
    [rue, cp, ville].forEach(function (f) { f.addEventListener('input', valider); });

    function ouvrir(message) {
      msg.textContent = message || '';
      bloc.hidden = false;
      lien.hidden = true;
      cp.focus();
    }
    lien.addEventListener('click', function () {
      ouvrir("Saisissez votre adresse ci-dessous. Le code postal suffit au calcul : il détermine les aides de votre territoire.");
    });
    return { ouvrir: ouvrir };
  }

  root.RFAdresseSecours = { attach: attach };
})(window);
