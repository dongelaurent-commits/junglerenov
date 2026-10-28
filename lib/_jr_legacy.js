/* JungleRenov — amorçage des zones dont le comportement vient des scripts métier.
   1. Injecte le fragment HTML de la page (balisage d'origine, rhabillé).
   2. Hydrate les pictogrammes du design system ([data-jr-picto]).
   3. Charge les modules métier dans l'ordre, puis le script de la page. */
(function (root) {
  'use strict';
  var NS = 'JungleRenovDesignSystem_fc0082';
  function paths() { return root[NS] && root[NS].PICTO_PATHS; }

  function pictoSvg(name, size) {
    var p = paths(); if (!p || !p[name]) return '';
    size = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p[name] + '</g></svg>';
  }
  function hydrate(scope) {
    if (!paths()) return false;
    (scope || document).querySelectorAll('[data-jr-picto]:not([data-jr-done])').forEach(function (el) {
      el.innerHTML = pictoSvg(el.getAttribute('data-jr-picto'), +el.getAttribute('data-size') || 24);
      el.classList.add('jr-picto');
      el.setAttribute('data-jr-done', '1');
    });
    var L = root[NS] && root[NS].LOGO_SVGS;
    if (L) (scope || document).querySelectorAll('[data-jr-logo]:not([data-jr-done])').forEach(function (el) {
      var svg = L[el.getAttribute('data-jr-logo')] || L['horizontal/principal']; if (!svg) return;
      var h = +el.getAttribute('data-h') || 32;
      el.innerHTML = svg.replace('<svg ', '<svg role="img" aria-label="JungleRenov" style="display:block;height:' + h + 'px;width:auto" ');
      el.classList.add('jr-logo'); el.setAttribute('data-jr-done', '1');
    });
    return true;
  }
  function watch(rootEl) {
    var tick = function () { if (!hydrate(rootEl)) setTimeout(tick, 60); };
    tick();
    new MutationObserver(function () { hydrate(rootEl); }).observe(rootEl, { childList: true, subtree: true });
  }

  /* Les scripts d'origine s'abonnent à DOMContentLoaded / load : ces événements
     sont déjà passés quand la zone est injectée. On les rejoue immédiatement. */
  function patchReady() {
    if (root.__jrReadyPatched) return; root.__jrReadyPatched = true;
    var dAdd = document.addEventListener.bind(document), wAdd = root.addEventListener.bind(root);
    document.addEventListener = function (t, f, o) { if (t === 'DOMContentLoaded' && document.readyState !== 'loading') { setTimeout(function () { try { f.call(document, new Event('DOMContentLoaded')); } catch (e) { console.error(e); } }, 0); return; } return dAdd(t, f, o); };
    root.addEventListener = function (t, f, o) { if (t === 'load' && document.readyState === 'complete') { setTimeout(function () { try { f.call(root, new Event('load')); } catch (e) { console.error(e); } }, 0); return; } return wAdd(t, f, o); };
  }

  function loadSeq(list, done) {
    if (!list.length) { if (done) done(); return; }
    var src = list[0];
    if (document.querySelector('script[data-jr-src="' + src + '"]')) { loadSeq(list.slice(1), done); return; }
    var s = document.createElement('script');
    s.src = src; s.async = false; s.setAttribute('data-jr-src', src);
    s.onload = s.onerror = function () { loadSeq(list.slice(1), done); };
    document.body.appendChild(s);
  }

  function boot(opts) {
    var el = opts.root;
    if (!el || el.__jrBooted) return; el.__jrBooted = true;
    patchReady();
    var go = function (html) {
      if (html != null) el.innerHTML = html;
      watch(el);
      if (opts.beforeScripts) { try { opts.beforeScripts(el); } catch (e) { console.error('[jr] pont', e); } }
      loadSeq(opts.scripts || [], function () {
        hydrate(el);
        if (opts.onReady) opts.onReady(el);
        el.dispatchEvent(new CustomEvent('jr:ready', { bubbles: true }));
      });
    };
    if (opts.partial) fetch(opts.partial).then(function (r) { return r.text(); }).then(go).catch(function (e) { console.error('[jr] fragment introuvable', e); });
    else go(null);
  }

  function scrollToEl(el) {
    try { if (!el) return; var y = el.getBoundingClientRect().top + root.pageYOffset - 24; root.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (_) {}
  }

  root.jrPictoSvg = pictoSvg;
  root.jrHydratePictos = hydrate;
  root.jrBoot = boot;
  root.jrScrollTo = scrollToEl;
})(window);
