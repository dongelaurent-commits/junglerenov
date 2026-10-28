/* JungleRenov — logo en version colorée dans l'en-tête et le pied.
   En-tête (ivoire) : horizontal/principal, symbole encre → feuille ; pied (encre) : horizontal/inverse,
   symbole feuille → pousse → ivoire. Hauteur pilotée par la taille du symbole ; sous 28 px de symbole,
   repli en monochrome (mono-encre sur ivoire, blanc sur encre). Interim : à remplacer par une option
   du composant Logo (auto=false) dans SiteHeader / SiteFooter v2. */
(function (root) {
  'use strict';
  var NS = 'JungleRenovDesignSystem_fc0082', VB_H = 166, SYM_H = 141.75, MIN_SYM = 28;
  function svgFor(tone, sym, opts) {
    var L = root[NS] && root[NS].LOGO_SVGS; if (!L) return null;
    var t = sym < MIN_SYM ? (tone === 'inverse' ? 'blanc' : 'mono-encre') : tone;
    var h = opts && opts.height ? opts.height(sym) : Math.round(sym * VB_H / SYM_H * 10) / 10;
    return (L['horizontal/' + t] || L['horizontal/principal']).replace('<svg ', '<svg data-jr-color="" role="img" aria-label="JungleRenov" style="display:block;height:' + h + 'px;width:auto" ');
  }
  root.jrColorLogo = function (scope, opts) {
    if (!scope || scope.__jrLogo) return; scope.__jrLogo = true;
    var mo;
    function apply() {
      var span = scope.querySelector(opts.selector); if (!span) return;
      var sym = typeof opts.symbol === 'function' ? opts.symbol() : opts.symbol;
      var key = opts.tone + ':' + sym; if (span.__jrKey === key && span.querySelector('svg[data-jr-color]')) return;
      var s = svgFor(opts.tone, sym, opts); if (!s) return;
      if (mo) mo.disconnect(); span.innerHTML = s; span.__jrKey = key; if (mo) mo.observe(scope, { childList: true, subtree: true });
    }
    mo = new MutationObserver(apply);
    (function wait() { if (!root[NS] || !scope.querySelector(opts.selector)) return setTimeout(wait, 50); apply(); mo.observe(scope, { childList: true, subtree: true }); })();
    root.addEventListener('resize', apply);
  };
})(window);
