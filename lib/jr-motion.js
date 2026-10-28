/* JungleRenov — mouvement de l'accueil. Entrées au défilement (une seule fois),
   compteurs, apparition des cartes flottantes. Tokens : --jr-duration-enter,
   --jr-duration-count, --jr-ease. Rien ne se joue si prefers-reduced-motion. */
(function (root) {
  'use strict';
  function tok(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); var n = parseFloat(v); return isNaN(n) ? fb : n; }
  function reduced() { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function prep(el, dy) {
    el.__jrPrev = { t: el.style.transition, o: el.style.opacity, tr: el.style.transform };
    el.style.opacity = '0'; el.style.transform = 'translateY(' + dy + 'px)';
  }
  function play(el, delay, dur) {
    var ease = getComputedStyle(document.documentElement).getPropertyValue('--jr-ease').trim() || 'ease';
    el.style.transition = 'opacity ' + dur + 'ms ' + ease + ' ' + delay + 'ms, transform ' + dur + 'ms ' + ease + ' ' + delay + 'ms';
    requestAnimationFrame(function () { el.style.opacity = ''; el.style.transform = ''; });
    setTimeout(function () { var p = el.__jrPrev || {}; el.style.transition = p.t || ''; el.style.opacity = p.o || ''; el.style.transform = p.tr || ''; }, delay + dur + 50);
  }
  function fmt(n, pad) { var s = String(Math.round(n)); if (pad) return s.padStart(pad, '0'); return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); }
  function count(el, dur) {
    var raw = el.getAttribute('data-count'), target = parseInt(raw, 10), final = el.textContent;
    if (isNaN(target)) return;
    var pad = /^0\d/.test(raw) ? raw.length : 0, suffix = el.getAttribute('data-suffix') || '', t0 = null;
    function step(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur); var e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e, pad) + suffix; if (k < 1) requestAnimationFrame(step); else el.textContent = final; }
    requestAnimationFrame(step);
  }
  function collect(inner, out) {
    [].slice.call(inner.children).forEach(function (c) {
      if (c.hasAttribute('data-stagger')) { [].slice.call(c.children).forEach(function (k, i) { out.push([k, i * 60]); }); return; }
      if (c.querySelector('[data-stagger]')) { collect(c, out); return; }
      out.push([c, 0]);
    });
  }
  root.jrMotion = function (scope) {
    if (!scope || scope.__jrMotion) return; scope.__jrMotion = true;
    if (reduced() || !('IntersectionObserver' in root)) return;
    var enter = tok('--jr-duration-enter', 240), cdur = tok('--jr-duration-count', 600);
    if (!enter) return;
    // Cartes flottantes du hero : à l'arrivée, l'une après l'autre.
    scope.querySelectorAll('[data-hero-card]').forEach(function (el, i) { prep(el, 8); play(el, 120 + i * 80, enter); });
    // Sections : fondu + 16 px, une seule fois.
    var items = [];
    scope.querySelectorAll('[data-reveal-section]').forEach(function (inner) { collect(inner, items); });
    items.forEach(function (it) { prep(it[0], 16); it[0].__jrDelay = it[1]; });
    var pending = items.map(function (it) { return it[0]; });
    function fire(el) { var i = pending.indexOf(el); if (i < 0) return; pending.splice(i, 1); if (io) io.unobserve(el); play(el, el.__jrDelay || 0, enter); }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) fire(e.target); }); }, { threshold: 0.12 });
    pending.forEach(function (el) { io.observe(el); });
    // Repli : ne jamais laisser un contenu masqué (IO absent, iframe, impression).
    var ticking = false;
    function check() { ticking = false; var vh = root.innerHeight || document.documentElement.clientHeight;
      pending.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh - 24 && r.bottom > 0) fire(el); });
      if (!pending.length) { root.removeEventListener('scroll', onS, true); root.removeEventListener('resize', onS); } }
    function onS() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    root.addEventListener('scroll', onS, true); root.addEventListener('resize', onS);
    requestAnimationFrame(check);
    setTimeout(function () { pending.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < (root.innerHeight || 0)) fire(el); }); }, 1500);
    root.addEventListener('beforeprint', function () { pending.slice().forEach(fire); });
    var cpend = [].slice.call(scope.querySelectorAll('[data-count]'));
    function cfire(el) { var i = cpend.indexOf(el); if (i < 0) return; cpend.splice(i, 1); co.unobserve(el); count(el, cdur); }
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) cfire(e.target); }); }, { threshold: 0.6 });
    cpend.forEach(function (el) { co.observe(el); });
    function ccheck() { var vh = root.innerHeight || 0; cpend.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh - 24 && r.bottom > 0) cfire(el); }); }
    root.addEventListener('scroll', function () { requestAnimationFrame(ccheck); }, true);
  };
})(window);
