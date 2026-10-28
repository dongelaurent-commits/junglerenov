/* JungleRenov — composants v2 (React). Uniquement des tokens de lib/components.css.
   window.JRv2.<Composant>. Pictogrammes : tracés du design system, trait 1,5. */
(function (root) {
  'use strict';
  function init() {
  var R = root.React, h = R.createElement, F = R.Fragment;
  var DSN = 'JungleRenovDesignSystem_fc0082';
  function ds() { return root[DSN] || {}; }
  function useHover() { var s = R.useState(false); return [s[0], { onMouseEnter: function () { s[1](true); }, onMouseLeave: function () { s[1](false); } }]; }
  function useFocusRing() { var s = R.useState(false); return [s[0], { onFocus: function (e) { var fv = true; try { fv = e.target.matches(':focus-visible'); } catch (x) {} s[1](fv); }, onBlur: function () { s[1](false); } }]; }
  var FOCUS = { outline: 'var(--jr-focus-width) solid var(--jr-focus)', outlineOffset: 'var(--jr-focus-offset)' };
  function cx() { return Object.assign.apply(null, [{}].concat([].slice.call(arguments).filter(Boolean))); }
  var T = { // raccourcis de tokens
    ink: 'var(--jr-ink)', paper: 'var(--jr-paper)', deep: 'var(--jr-paper-deep)', white: 'var(--jr-white)', leaf: 'var(--jr-leaf)', wash: 'var(--jr-leaf-wash)', sprout: 'var(--jr-sprout)',
    ink70: 'var(--jr-ink-70)', ink60: 'var(--jr-ink-60)', ink40: 'var(--jr-ink-40)', ink10: 'var(--jr-ink-10)', ink05: 'var(--jr-ink-05)',
    ok: 'var(--jr-ok)', okw: 'var(--jr-ok-wash)', ko: 'var(--jr-ko)', kow: 'var(--jr-ko-wash)',
    s1: 'var(--jr-s-1)', s2: 'var(--jr-s-2)', s3: 'var(--jr-s-3)', s4: 'var(--jr-s-4)', s5: 'var(--jr-s-5)', s6: 'var(--jr-s-6)', s7: 'var(--jr-s-7)', s8: 'var(--jr-s-8)',
    rs: 'var(--jr-radius-s)', rm: 'var(--jr-radius-m)', rl: 'var(--jr-radius-l)', pill: 'var(--jr-radius-pill)',
    b: 'var(--jr-border) solid var(--jr-line)', bStrong: 'var(--jr-border-strong) solid var(--jr-action)',
    hit: 'var(--jr-hit)', tr: 'var(--jr-transition)',
    hero: 'var(--jr-type-hero)', h1: 'var(--jr-type-h1)', h2: 'var(--jr-type-h2)', h3: 'var(--jr-type-h3)', lead: 'var(--jr-type-lead)', body: 'var(--jr-type-body)', label: 'var(--jr-type-label)', labelB: 'var(--jr-type-label-strong)', micro: 'var(--jr-type-micro)',
    amS: 'var(--jr-type-amount-s)', amM: 'var(--jr-type-amount-m)', amL: 'var(--jr-type-amount-l)',
  };
  var micro = { font: T.micro, letterSpacing: 'var(--jr-micro-tracking)' };

  /* Icon */
  function Icon(p) {
    var path = (ds().PICTO_PATHS || {})[p.name]; if (!path) return null;
    var size = p.size === 'm' ? 'var(--jr-icon-m)' : 'var(--jr-icon-s)';
    return h('svg', { viewBox: '0 0 24 24', 'aria-hidden': p.title ? undefined : true, role: p.title ? 'img' : undefined, 'aria-label': p.title,
      style: cx({ display: 'block', flex: 'none', width: size, height: size, color: p.color || 'currentColor' }, p.style) },
      h('g', { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', style: { strokeWidth: 'var(--jr-icon-stroke)' }, dangerouslySetInnerHTML: { __html: path } }));
  }
  function Spinner() { return h('span', { 'aria-hidden': true, 'data-jr-skeleton': '', style: { width: T.s4, height: T.s4, borderRadius: T.pill, border: 'var(--jr-border-strong) solid currentColor', borderRightColor: 'transparent', animation: 'jr-skeleton var(--jr-duration) linear infinite' } }); }

  /* Button */
  var BTN = {
    primary: [{ background: T.leaf, color: T.white }, { background: T.ink }],
    secondary: [{ background: T.white, color: T.ink, borderColor: T.ink }, { background: T.deep }],
    tertiary: [{ background: 'transparent', color: T.leaf, textDecoration: 'underline', textUnderlineOffset: 'var(--jr-s-1)', paddingLeft: T.s2, paddingRight: T.s2 }, { color: T.ink }],
    destructive: [{ background: T.white, color: T.ko, borderColor: T.ko }, { background: T.kow }],
    'on-dark': [{ background: T.sprout, color: T.ink }, { background: T.paper }],
    'on-dark-secondary': [{ background: 'transparent', color: T.paper, borderColor: T.paper }, { background: T.paper, color: T.ink }],
  };
  function Button(p) {
    var hv = useHover(), v = BTN[p.variant || 'primary'] || BTN.primary, dis = p.disabled || p.loading;
    var st = cx({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: T.s2, minHeight: T.hit, padding: '0 ' + T.s5, borderRadius: T.rs, border: 'var(--jr-border) solid transparent',
      font: T.labelB, textDecoration: 'none', cursor: dis ? 'not-allowed' : 'pointer', transition: T.tr, whiteSpace: 'nowrap' },
      v[0], hv[0] && !dis ? v[1] : null, p.size === 'lg' ? { minHeight: 'var(--jr-choice-h)', padding: '0 ' + T.s6 } : null,
      p.fullWidth ? { width: '100%' } : null, p.disabled ? ((p.variant === 'secondary') ? { background: T.white, color: T.ink70, borderColor: T.ink40, textDecoration: 'none' } : { background: T.deep, color: T.ink, borderColor: T.deep, textDecoration: 'none' }) : null, p.style);
    var kids = h(F, null, p.loading ? h(Spinner) : p.icon ? h(Icon, { name: p.icon }) : null, h('span', null, p.loading ? (p.loadingLabel || 'Chargement…') : p.children), p.iconAfter && !p.loading ? h(Icon, { name: p.iconAfter, style: p.iconAfter === 'chevron' ? { transform: 'rotate(-90deg)' } : undefined }) : null);
    var common = cx(hv[1], { style: st, 'aria-busy': p.loading || undefined, 'aria-disabled': dis || undefined, onClick: dis ? undefined : p.onClick });
    if (p.href && !dis) return h('a', cx(common, { href: p.href }), kids);
    return h('button', cx(common, { type: p.type || 'button', disabled: dis }), kids);
  }

  /* Champs */
  function Field(p, control) {
    var id = p.id || p.autoId;
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s2 } },
      h('label', { htmlFor: id, style: p.qLabel ? { font: T.labelB, fontSize: 'calc(var(--jr-s-5) - var(--jr-s-1))', lineHeight: 'calc(var(--jr-s-5) + var(--jr-s-1))', color: T.ink } : { font: T.label, color: T.ink } }, p.label, p.optional ? h('span', { style: { color: T.ink70, fontWeight: 400 } }, ' (facultatif)') : null),
      p.hint && !p.hintBelow ? h('p', { id: id + '-hint', style: { margin: T.s1 + ' 0 ' + T.s2, font: T.label, fontWeight: 400, color: T.ink70 } }, p.hint) : null,
      control,
      p.hint && p.hintBelow ? h('p', { id: id + '-hint', style: { margin: 0, font: T.label, fontWeight: 400, color: T.ink70 } }, p.hint) : null,
      p.error ? h('p', { id: id + '-err', role: 'alert', style: { margin: 0, display: 'flex', gap: T.s2, alignItems: 'center', font: T.labelB, color: T.ko } }, h(Icon, { name: 'bloque' }), p.error) : null);
  }
  function boxStyle(p, focus) {
    return { display: 'flex', alignItems: 'stretch', minHeight: T.hit, background: p.disabled ? T.deep : T.white, borderRadius: T.rs, transition: T.tr,
      border: p.error ? 'var(--jr-border-strong) solid var(--jr-ko)' : 'var(--jr-border) solid var(--jr-line-field)',
      outline: focus ? 'var(--jr-focus-width) solid var(--jr-focus)' : 'none', outlineOffset: 'var(--jr-focus-offset)' };
  }
  function TextField(p) {
    var auto = R.useId(), f = R.useState(false), id = p.id || auto;
    var desc = [p.hint && id + '-hint', p.error && id + '-err'].filter(Boolean).join(' ') || undefined;
    var input = h('input', { id: id, name: p.name, type: p.type || 'text', inputMode: p.inputMode || (p.unit ? 'decimal' : undefined), value: p.value, defaultValue: p.defaultValue,
      placeholder: p.placeholder, disabled: p.disabled, required: !p.optional, 'aria-invalid': !!p.error || undefined, 'aria-describedby': desc, onChange: p.onChange,
      onFocus: function () { f[1](true); }, onBlur: function () { f[1](false); },
      style: { flex: 1, minWidth: 0, border: 0, background: 'transparent', padding: '0 ' + T.s4, font: T.body, color: T.ink, outline: 'none' } });
    return Field(cx(p, { autoId: auto }), h('div', { style: boxStyle(p, f[0]) }, input,
      p.unit ? h('span', { style: { display: 'flex', alignItems: 'center', padding: '0 ' + T.s4, borderLeft: T.b, background: T.paper, font: T.body } }, p.unit) : null,
      p.suffix || null));
  }
  function Select(p) {
    var auto = R.useId(), f = R.useState(false), id = p.id || auto;
    return Field(cx(p, { autoId: auto }), h('div', { style: cx(boxStyle(p, f[0]), { position: 'relative' }) },
      h('select', { id: id, value: p.value, defaultValue: p.value === undefined ? (p.defaultValue || '') : undefined, onChange: p.onChange, disabled: p.disabled,
        onFocus: function () { f[1](true); }, onBlur: function () { f[1](false); }, 'aria-invalid': !!p.error || undefined,
        style: { appearance: 'none', WebkitAppearance: 'none', flex: 1, minWidth: 0, width: '100%', border: 0, background: 'transparent', padding: '0 ' + T.s7 + ' 0 ' + T.s4, font: T.body, color: T.ink, outline: 'none' } },
        h('option', { value: '', disabled: true }, p.placeholder || 'Choisissez'),
        (p.options || []).map(function (o) { return h('option', { key: o.value, value: o.value }, o.label); })),
      h(Icon, { name: 'chevron', style: { position: 'absolute', right: T.s3, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' } })));
  }

  /* Cartes de choix 56 px */
  function ChoiceCard(p) {
    var hv = useHover(), f = R.useState(false), on = !!p.checked, round = p.type !== 'checkbox';
    return h('label', cx(hv[1], { style: {
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: p.compact ? 'center' : 'flex-start', gap: p.compact ? T.s2 : T.s3, minHeight: 'var(--jr-choice-h)', minWidth: p.compact ? 'calc(var(--jr-s-8) + var(--jr-s-2))' : undefined, padding: p.compact ? T.s2 : T.s3 + ' ' + T.s4,
        background: on ? T.wash : T.white, borderRadius: T.rm, cursor: p.disabled ? 'not-allowed' : 'pointer', transition: T.tr,
        border: on ? T.bStrong : p.error ? 'var(--jr-border-strong) solid var(--jr-ko)' : (hv[0] ? 'var(--jr-border) solid var(--jr-ink)' : 'var(--jr-border) solid var(--jr-line-field)'),
        margin: on || p.error ? 0 : 'var(--jr-border)', opacity: p.disabled ? 1 : undefined, color: T.ink,
        outline: f[0] ? 'var(--jr-focus-width) solid var(--jr-focus)' : 'none', outlineOffset: 'var(--jr-focus-offset)' } }),
      h('input', { type: round ? 'radio' : 'checkbox', name: p.name, value: p.value, checked: on, disabled: p.disabled, onChange: p.onChange,
        onFocus: function () { f[1](true); }, onBlur: function () { f[1](false); }, style: { position: 'absolute', opacity: 0, width: 1, height: 1, margin: 0 } }),
      h('span', { 'aria-hidden': true, style: { width: p.compact ? 'calc(var(--jr-s-5) - var(--jr-s-1))' : T.s5, height: p.compact ? 'calc(var(--jr-s-5) - var(--jr-s-1))' : T.s5, flex: 'none', borderRadius: round ? T.pill : T.rs, display: 'grid', placeItems: 'center',
        border: 'var(--jr-border-strong) solid ' + (on ? 'var(--jr-leaf)' : 'var(--jr-line-field)'), background: on && !round ? T.leaf : T.white, color: T.white } },
        on ? (round ? h('span', { style: { width: T.s3, height: T.s3, borderRadius: T.pill, background: T.leaf } }) : h(Icon, { name: 'valide', style: { width: T.s4, height: T.s4 } })) : null),
      p.icon ? h(Icon, { name: p.icon, color: T.leaf }) : null,
      h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
        h('span', { style: { font: T.labelB } }, p.label),
        p.description ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.description) : null),
      p.disabled ? h('span', { style: cx(micro, { marginLeft: 'auto', color: T.ink70 }) }, 'indisponible') : null);
  }
  function ChoiceGroup(p) {
    var multi = p.type === 'checkbox', val = p.value;
    var isOn = function (v) { return multi ? (val || []).indexOf(v) >= 0 : val === v; };
    var tog = function (v) { if (!p.onChange) return; if (!multi) return p.onChange(v); p.onChange(isOn(v) ? val.filter(function (x) { return x !== v; }) : (val || []).concat([v])); };
    return h('fieldset', { style: { border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: T.s2 } },
      p.legend ? h('legend', { style: { font: T.h3, padding: 0, marginBottom: T.s2 } }, p.legend) : null,
      p.hint ? h('p', { style: { margin: '0 0 ' + T.s2, font: T.label, fontWeight: 400, color: T.ink70 } }, p.hint) : null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, ' + (p.min || 240) + 'px), 1fr))', gap: T.s2 } },
        (p.options || []).map(function (o) { return h(ChoiceCard, { key: o.value, type: p.type, name: p.name, value: o.value, label: o.label, description: o.description, icon: o.icon, disabled: o.disabled, error: !!p.error, checked: isOn(o.value), onChange: function () { tog(o.value); } }); })),
      p.error ? h('p', { role: 'alert', style: { margin: 0, display: 'flex', gap: T.s2, font: T.labelB, color: T.ko } }, h(Icon, { name: 'bloque' }), p.error) : null);
  }

  /* États */
  var TAG = {
    valide: [T.okw, T.ok, 'valide', 'Validé'], recu: [T.wash, T.ink, 'document', 'Reçu'], manquant: [T.kow, T.ko, 'bloque', 'Manquant'], bloque: [T.kow, T.ko, 'bloque', 'Bloqué'],
    'en-cours': [T.deep, T.ink, 'etape-en-cours', 'En cours'], 'a-venir': [T.white, T.ink, 'etape-a-venir', 'À venir'],
  };
  function StatusTag(p) { var m = TAG[p.status] || TAG['en-cours'];
    return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: T.s2, minHeight: T.s6, padding: '0 ' + T.s3 + ' 0 ' + T.s2, borderRadius: T.rs, background: m[0], color: m[1], border: p.status === 'a-venir' ? T.b : 0, font: T.labelB, whiteSpace: 'nowrap' } }, h(Icon, { name: m[2] }), p.children || m[3]); }
  var NOTE = { info: [T.deep, T.ink, 'information'], valide: [T.okw, T.ok, 'valide'], bloque: [T.kow, T.ko, 'bloque'], action: [T.wash, T.ink, 'information'] };
  function Notice(p) { var m = NOTE[p.tone || 'info'];
    return h('div', { role: p.tone === 'bloque' ? 'alert' : 'status', style: cx({ display: 'flex', gap: T.s3, alignItems: 'flex-start', padding: T.s4, background: m[0], color: m[1], borderRadius: T.rs }, p.style) },
      h(Icon, { name: p.icon || m[2] }), h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s1, minWidth: 0 } },
        p.title ? h('strong', { style: { font: T.labelB } }, p.title) : null, p.children ? h('div', { style: { font: T.label, fontWeight: 400 } }, p.children) : null,
        p.action ? h('div', { style: { marginTop: T.s2 } }, p.action) : null)); }
  function Toast(p) { var m = NOTE[p.tone || 'info'];
    return h('div', { role: 'status', 'aria-live': 'polite', style: { display: 'flex', alignItems: 'center', gap: T.s3, minHeight: T.hit, padding: T.s3 + ' ' + T.s4, background: T.ink, color: T.paper, borderRadius: T.rm, maxWidth: 'var(--jr-measure)' } },
      h(Icon, { name: m[2], color: p.tone === 'valide' ? T.sprout : T.paper }), h('span', { style: { font: T.label, flex: 1 } }, p.children),
      p.onClose ? h('button', { type: 'button', onClick: p.onClose, style: { all: 'unset', cursor: 'pointer', minWidth: T.hit, minHeight: T.hit, display: 'grid', placeItems: 'center' }, 'aria-label': 'Fermer' }, h(Icon, { name: 'fermer' })) : null); }

  /* Chiffre d'aide */
  function AidAmount(p) { var dark = p.surface === 'dark';
    return h('div', { 'data-surface': p.surface, style: { display: 'flex', flexDirection: 'column', gap: T.s2, padding: T.s5, background: dark ? T.ink : T.white, color: dark ? T.paper : T.ink, border: dark ? 0 : T.b, borderRadius: T.rm } },
      h('span', { style: cx(micro, { color: dark ? T.paper : T.ink70 }) }, p.label || 'Estimation de vos aides'),
      h('span', { style: { font: p.size === 'l' ? T.amL : p.size === 's' ? T.amS : T.amM, color: dark ? T.sprout : T.ink } }, p.amount),
      h('span', { style: cx(micro, { color: dark ? T.paper : T.ink70 }) }, 'Source : ' + (p.source || '[barème]') + ' · ' + (p.date || '[jj/mm/aaaa]')),
      h('span', { style: { font: T.label, fontWeight: 400, color: dark ? T.paper : T.ink70 } }, p.note || 'Montant indicatif, non contractuel.')); }

  /* Card */
  function Card(p) {
    var hv = useHover(), v = p.variant || 'simple', clickable = v === 'link' || v === 'selectable', sel = v === 'selectable' && p.selected;
    var st = { display: 'flex', flexDirection: 'column', height: '100%', background: sel ? T.wash : T.white, borderRadius: T.rm, color: T.ink, textDecoration: 'none', overflow: 'hidden', transition: T.tr,
      border: sel || (clickable && hv[0]) ? T.bStrong : T.b, margin: sel || (clickable && hv[0]) ? 0 : 'var(--jr-border)' };
    var body = h(F, null,
      p.title && v !== 'simple' ? h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: T.s3, padding: T.s4 + ' ' + T.s5, borderBottom: v === 'header' ? T.b : 0 } },
        h('h3', { style: { margin: 0, font: T.h3 } }, p.title), v === 'link' ? h(Icon, { name: 'chevron', style: { transform: 'rotate(-90deg)' } }) : p.aside || null) : null,
      h('div', { style: { padding: p.title && v !== 'simple' ? '0 ' + T.s5 + ' ' + T.s5 : T.s5, display: 'flex', flexDirection: 'column', gap: T.s3, flex: 1 } }, p.title && v === 'simple' ? h('h3', { style: { margin: 0, font: T.h3 } }, p.title) : null, p.children),
      p.footer ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: T.s3, padding: T.s4 + ' ' + T.s5, borderTop: T.b, background: T.paper } }, p.footer) : null);
    if (v === 'link') return h('a', cx(hv[1], { href: p.href, style: st }), body);
    if (v === 'selectable') return h('button', cx(hv[1], { type: 'button', 'aria-pressed': !!p.selected, onClick: p.onSelect, style: cx(st, { textAlign: 'left', font: 'inherit', cursor: 'pointer', padding: 0 }) }), body);
    return h('div', { style: st }, body);
  }

  /* Table */
  function Table(p) {
    var s = R.useState({ key: p.sortKey, dir: 1 }), sort = s[0];
    var rows = (p.rows || []).slice();
    if (sort.key) rows.sort(function (a, b) { var x = a[sort.key], y = b[sort.key]; return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
    var th = { textAlign: 'left', padding: T.s3 + ' ' + T.s4, font: T.labelB, borderBottom: 'var(--jr-border) solid var(--jr-line-strong)', background: T.paper, whiteSpace: 'nowrap' };
    var td = { padding: T.s3 + ' ' + T.s4, font: T.label, fontWeight: 400, borderBottom: T.b, verticalAlign: 'top' };
    return h('div', { style: { overflowX: 'auto', background: T.white, border: T.b, borderRadius: T.rm } },
      h('table', { style: { width: '100%', borderCollapse: 'collapse' } },
        p.caption ? h('caption', { style: cx(micro, { textAlign: 'left', padding: T.s3 + ' ' + T.s4, color: T.ink70 }) }, p.caption) : null,
        h('thead', null, h('tr', null, p.columns.map(function (c) {
          var on = sort.key === c.key;
          return h('th', { key: c.key, scope: 'col', 'aria-sort': on ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined, style: cx(th, { textAlign: c.align || 'left' }) },
            c.sortable ? h('button', { type: 'button', onClick: function () { s[1]({ key: c.key, dir: on ? -sort.dir : 1 }); }, style: { all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: T.s1, alignItems: 'center', minHeight: T.hit } },
              c.label, h(Icon, { name: 'chevron', style: { transform: on && sort.dir < 0 ? 'rotate(180deg)' : 'none', color: on ? T.ink : T.ink40 } })) : c.label);
        }))),
        h('tbody', null, rows.length ? rows.map(function (r, i) {
          return h(TRow, { key: i }, p.columns.map(function (c) { return h('td', { key: c.key, style: cx(td, { textAlign: c.align || 'left' }) }, c.render ? c.render(r) : r[c.key]); }));
        }) : h('tr', null, h('td', { colSpan: p.columns.length, style: td }, h(EmptyState, { icon: 'dossier', title: p.emptyTitle || 'Aucune donnée', children: p.emptyText }))))));
  }
  function TRow(p) { var hv = useHover(); return h('tr', cx(hv[1], { style: { background: hv[0] ? T.ink05 : 'transparent', transition: T.tr } }), p.children); }

  /* Navigation */
  function Tabs(p) {
    if (p.orientation === 'vertical') return h('div', { role: 'tablist', 'aria-orientation': 'vertical', 'aria-label': p.label, style: { display: 'flex', flexDirection: 'column', borderLeft: T.b } }, p.tabs.map(function (t) {
      var on = t.id === p.value;
      return h('button', { key: t.id, role: 'tab', 'aria-selected': on, type: 'button', onClick: function () { p.onChange && p.onChange(t.id); },
        style: { all: 'unset', boxSizing: 'border-box', cursor: 'pointer', minHeight: T.hit, padding: T.s2 + ' ' + T.s4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: T.s3, font: on ? T.labelB : T.label, color: on ? T.ink : T.ink70, borderLeft: 'var(--jr-border-strong) solid ' + (on ? 'var(--jr-leaf)' : 'transparent'), marginLeft: 'calc(-1 * var(--jr-border))', transition: T.tr } },
        h('span', null, t.label), t.count != null ? h('span', { style: cx(micro, { color: T.ink70 }) }, t.count) : null);
    }));
    return h('div', { role: 'tablist', style: { display: 'flex', gap: T.s1, borderBottom: T.b, overflowX: 'auto' } }, p.tabs.map(function (t) {
      var on = t.id === p.value;
      return h('button', { key: t.id, role: 'tab', 'aria-selected': on, type: 'button', onClick: function () { p.onChange && p.onChange(t.id); },
        style: { all: 'unset', cursor: 'pointer', minHeight: T.hit, padding: '0 ' + T.s4, font: on ? T.labelB : T.label, color: on ? T.ink : T.ink70, borderBottom: 'var(--jr-border-strong) solid ' + (on ? 'var(--jr-leaf)' : 'transparent'), marginBottom: 'calc(-1 * var(--jr-border))', whiteSpace: 'nowrap', transition: T.tr } }, t.label);
    }));
  }
  function Breadcrumb(p) {
    return h('nav', { 'aria-label': 'Fil d’Ariane' }, h('ol', { style: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: T.s2, alignItems: 'center', font: T.label } },
      p.items.map(function (it, i) { var last = i === p.items.length - 1;
        return h('li', { key: i, style: { display: 'flex', alignItems: 'center', gap: T.s2 } },
          last ? h('span', { 'aria-current': 'page', style: { font: T.labelB } }, it.label) : h('a', { href: it.href }, it.label),
          last ? null : h(Icon, { name: 'chevron', color: T.ink60, style: { transform: 'rotate(-90deg)' } })); })));
  }
  function Pagination(p) {
    var page = p.page, total = p.total, go = function (n) { if (n >= 1 && n <= total && p.onChange) p.onChange(n); };
    var btn = function (n, label, cur) { return h('button', { key: label, type: 'button', 'aria-current': cur ? 'page' : undefined, disabled: n < 1 || n > total, onClick: function () { go(n); },
      style: { all: 'unset', cursor: n < 1 || n > total ? 'not-allowed' : 'pointer', minWidth: T.hit, minHeight: T.hit, display: 'grid', placeItems: 'center', borderRadius: T.rs, font: cur ? T.labelB : T.label, background: cur ? T.ink : 'transparent', color: cur ? T.paper : (n < 1 || n > total ? T.ink70 : T.ink), border: cur ? 0 : T.b } }, label); };
    var nums = []; for (var i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    return h('nav', { 'aria-label': 'Pagination', style: { display: 'flex', gap: T.s2, alignItems: 'center', flexWrap: 'wrap' } },
      btn(page - 1, 'Précédent'), nums.map(function (n, k) { return n === '…' ? h('span', { key: 'e' + k, style: { font: T.label } }, '…') : btn(n, String(n), n === page); }), btn(page + 1, 'Suivant'));
  }


  /* IconBadge — rond plein, pictogramme centré au trait 1,5 */
  var IB_SIZE = { s: ['var(--jr-s-6)', 'var(--jr-s-4)'], m: ['calc(var(--jr-s-6) + var(--jr-s-2))', 'calc(var(--jr-s-4) + var(--jr-s-1))'], l: ['var(--jr-s-7)', 'var(--jr-s-5)'] };
  var IB_TONE = { feuille: [T.leaf, T.white], encre: [T.ink, T.sprout], lave: [T.wash, T.leaf], pousse: [T.sprout, T.ink], 'feuille-pousse': [T.leaf, T.sprout] };
  function IconBadge(p) {
    var sz = IB_SIZE[p.size || 'm'] || IB_SIZE.m, tn = IB_TONE[p.variant || 'feuille'] || IB_TONE.feuille;
    return h('span', { role: p.label ? 'img' : undefined, 'aria-label': p.label, 'aria-hidden': p.label ? undefined : true,
      style: cx({ width: sz[0], height: sz[0], flex: 'none', borderRadius: T.pill, background: tn[0], color: tn[1], display: 'inline-grid', placeItems: 'center' }, p.style) },
      h(Icon, { name: p.name, color: tn[1], style: { width: sz[1], height: sz[1] } }));
  }


  /* GuaranteeCard — encart garantie : encre, filet pousse 2 px à gauche, badge pousse/encre, titre pousse */
  function GuaranteeCard(p) {
    return h('section', { 'data-surface': 'dark', 'aria-label': 'Notre garantie', style: cx({ boxSizing: 'border-box', display: 'flex', gap: T.s4, alignItems: 'flex-start', background: T.ink, color: T.paper, borderRadius: T.rm, borderLeft: 'var(--jr-border-strong) solid ' + T.sprout, padding: p.padding || 'var(--jr-card-pad)' }, p.style) },
      h(IconBadge, { name: 'valide', size: 'm', variant: 'pousse' }),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s2, minWidth: 0 } },
        h(p.as || 'h3', { style: { margin: 0, font: '700 24px/30px var(--jr-font-text)', color: T.sprout, textWrap: 'balance' } }, '100\u202f% indépendant · sans démarchage'),
        h('p', { style: { margin: 0, font: T.body, color: T.paper, maxWidth: 'var(--jr-measure)', textWrap: 'pretty' } }, 'Aucun artisan ne nous paie pour être recommandé. Nous ne vous appellerons jamais sans votre demande.')));
  }

  /* CurrentStepCard v2 */
  function CurrentStepCard(p) {
    return h('section', { 'aria-labelledby': 'jr-csc-t', style: { background: T.white, border: T.b, borderRadius: T.rm, overflow: 'hidden' } },
      h('div', { style: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: T.s5, padding: T.s5, alignItems: 'start' } },
        h('span', { 'aria-hidden': true, style: { font: 'var(--jr-type-h1)', fontSize: 'var(--jr-s-7)', lineHeight: 1, color: T.leaf } }, String(p.step).padStart(2, '0')),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3, minWidth: 0 } },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: T.s2 + ' ' + T.s4, alignItems: 'center' } },
            h(StatusTag, { status: 'en-cours' }),
            h('span', { style: cx(micro, { color: T.ink70 }) }, 'Étape ' + p.step + ' sur ' + p.total + (p.delai ? ' · délai ' + p.delai : '') + (p.duree ? ' · ' + p.duree : ''))),
          h('h2', { id: 'jr-csc-t', style: { margin: 0, font: T.h2 } }, p.title),
          p.description ? h('p', { style: { margin: 0, font: T.body, maxWidth: 'var(--jr-measure)' } }, p.description) : null)),
      p.items && p.items.length ? h('div', { style: { padding: '0 ' + T.s5 + ' ' + T.s5 } },
        h('p', { style: cx(micro, { margin: '0 0 ' + T.s2, color: T.ink70 }) }, p.itemsLabel || 'Ce qu’il faut préparer'),
        h('ul', { style: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: T.s2 } }, p.items.map(function (t, i) {
          return h('li', { key: i, style: { display: 'flex', gap: T.s3, alignItems: 'flex-start', font: T.body } }, h(IconBadge, { name: 'valide', size: 's', variant: 'lave' }), t); }))) : null,
      p.actions ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: T.s3, padding: T.s4 + ' ' + T.s5, borderTop: T.b, background: T.paper } }, p.actions) : null);
  }
  /* DocumentRow v2 */
  function DocumentRow(p) {
    return h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: T.s3 + ' ' + T.s4, minHeight: 'var(--jr-s-8)', padding: T.s3 + ' ' + T.s5, borderTop: p.first ? 0 : T.b } },
      h(IconBadge, { name: p.icon || 'document', size: 's', variant: 'lave' }),
      h('div', { style: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', minWidth: 0 } },
        h('span', { style: { font: T.labelB } }, p.label), p.caption ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.caption) : null),
      h(StatusTag, { status: p.status || 'manquant' }), p.action || null);
  }

  /* Superpositions */
  function Modal(p) {
    var ref = R.useRef(null);
    R.useEffect(function () { if (!p.open) return; var prev = document.activeElement; if (ref.current) ref.current.focus();
      var k = function (e) { if (e.key === 'Escape' && p.onClose) p.onClose(); }; document.addEventListener('keydown', k);
      return function () { document.removeEventListener('keydown', k); if (prev && prev.focus) prev.focus(); }; }, [p.open]);
    if (!p.open) return null;
    return h('div', { style: { position: 'fixed', inset: 0, zIndex: 50, background: T.ink, display: 'grid', placeItems: 'center', padding: T.s5 }, onClick: p.onClose },
      h('div', { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'jr-modal-t', tabIndex: -1, ref: ref, onClick: function (e) { e.stopPropagation(); },
        style: { width: 'min(100%, calc(var(--jr-s-9) * 6))', background: T.white, borderRadius: T.rl, display: 'flex', flexDirection: 'column', outline: 'none' } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: T.s3, padding: T.s5, borderBottom: T.b } },
          h('h2', { id: 'jr-modal-t', style: { margin: 0, font: T.h2 } }, p.title),
          h(Button, { variant: 'tertiary', icon: 'fermer', onClick: p.onClose }, 'Fermer')),
        h('div', { style: { padding: T.s5, font: T.body } }, p.children),
        p.actions ? h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: T.s3, padding: T.s4 + ' ' + T.s5, borderTop: T.b, background: T.paper } }, p.actions) : null));
  }
  function Tooltip(p) {
    var s = R.useState(false), id = R.useId();
    var show = function () { s[1](true); }, hide = function () { s[1](false); };
    return h('span', { style: { position: 'relative', display: 'inline-flex' }, onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide },
      R.cloneElement(R.Children.only(p.children), { 'aria-describedby': id }),
      h('span', { role: 'tooltip', id: id, style: { position: 'absolute', bottom: 'calc(100% + var(--jr-s-2))', left: 0, zIndex: 10, width: 'max-content', maxWidth: 'calc(var(--jr-s-9) * 3)', padding: T.s2 + ' ' + T.s3, background: T.ink, color: T.paper, borderRadius: T.rs, font: T.label, fontWeight: 400, opacity: s[0] ? 1 : 0, pointerEvents: 'none', transition: T.tr } }, p.label));
  }
  function EmptyState(p) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: T.s3, padding: T.s6 } },
      h(Icon, { name: p.icon || 'dossier', size: 'm', color: T.ink60 }), h('p', { style: { margin: 0, font: T.h3 } }, p.title),
      p.children ? h('p', { style: { margin: 0, font: T.body, color: T.ink70, maxWidth: 'var(--jr-measure)' } }, p.children) : null, p.action || null);
  }
  function Skeleton(p) {
    var n = p.lines || 3;
    return h('div', { 'aria-busy': true, 'aria-label': p.label || 'Chargement', style: { display: 'flex', flexDirection: 'column', gap: T.s2 } },
      Array.from({ length: n }).map(function (_, i) { return h('span', { key: i, 'data-jr-skeleton': '', style: { display: 'block', height: p.height || T.s4, width: i === n - 1 ? '60%' : '100%', background: T.deep, borderRadius: T.rs, animation: 'jr-skeleton calc(var(--jr-duration) * 7) var(--jr-ease) infinite' } }); }));
  }

  /* Dépôt de pièce */
  var DROP = { manquant: ['bloque', 'Manquant'], recu: ['document', 'Reçu'], valide: ['valide', 'Validé'], bloque: ['bloque', 'Refusé'] };
  function FileDrop(p) {
    var ref = R.useRef(null), o = R.useState(false), st = p.status || 'manquant';
    var pick = function (fs) { if (fs && fs.length && p.onSelect) p.onSelect([].slice.call(fs)); };
    return h('div', { onDragOver: function (e) { e.preventDefault(); o[1](true); }, onDragLeave: function () { o[1](false); }, onDrop: function (e) { e.preventDefault(); o[1](false); pick(e.dataTransfer.files); },
      style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: T.s4, padding: T.s5, background: o[0] ? T.deep : (st === 'valide' ? T.okw : T.white), borderRadius: T.rm, transition: T.tr,
        border: st === 'manquant' ? 'var(--jr-border) dashed var(--jr-ink)' : st === 'bloque' ? 'var(--jr-border-strong) solid var(--jr-ko)' : T.b } },
      h(Icon, { name: st === 'manquant' ? 'televerser' : DROP[st][0], size: 'm', color: st === 'valide' ? T.ok : st === 'bloque' ? T.ko : T.ink }),
      h('div', { style: { flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: T.s1, minWidth: 0 } },
        h('span', { style: { font: T.labelB } }, p.title || 'Ajoutez votre document'),
        h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.fileName || p.formats || 'PDF, JPG ou PNG, 10 Mo maximum.')),
      h(StatusTag, { status: st === 'bloque' ? 'bloque' : st }, DROP[st][1]),
      st !== 'valide' ? h(Button, { variant: 'secondary', icon: 'televerser', onClick: function () { ref.current && ref.current.click(); } }, st === 'manquant' ? 'Choisir un fichier' : 'Remplacer') : null,
      h('input', { ref: ref, type: 'file', hidden: true, onChange: function (e) { pick(e.target.files); } }));
  }

  /* Ligne d'étapes défilante (Stepper du design system, cliquable) */
  function Stepper(p) {
    var S = ds().Stepper; if (!S) return null;
    var sc = !!p.scroll || ((p.steps || []).length >= 9 && root.innerWidth < 1200);
    return h('div', { style: { overflowX: sc ? 'auto' : 'visible', overflowY: 'visible', WebkitOverflowScrolling: 'touch', padding: sc ? T.s4 : T.s1, margin: sc ? '0 calc(-1 * var(--jr-s-4))' : '0 calc(-1 * var(--jr-s-1))' } }, h('div', { style: { minWidth: sc ? 'calc(var(--jr-s-9) * 1.25 * ' + Math.max(7, (p.steps || []).length) + ')' : (p.minWidth || 0) } }, h(S, cx(p, { compact: false, scroll: undefined }))));
  }

  /* Sidebar espace particulier */
  function Sidebar(p) {
    var o = R.useState(false), open = o[0], m = R.useState(false), lien = useHover();
    var list = p.dossiers || [];
    return h('aside', { style: { background: T.deep, padding: T.s4, display: 'flex', flexDirection: 'column', gap: T.s5, minHeight: p.mobile ? 'auto' : '100%' } },
      p.mobile ? h(Button, { variant: 'secondary', icon: open ? 'fermer' : 'menu', onClick: function () { o[1](!open); }, 'aria-expanded': open }, open ? 'Fermer' : 'Menu') : null,
      (!p.mobile || open) ? h(F, null,
        p.widget ? h('div', { 'data-surface': 'dark', style: { background: T.ink, color: T.paper, borderRadius: T.rm, padding: T.s4, display: 'flex', flexDirection: 'column', gap: T.s1 } },
          h('span', { style: micro }, p.widget.label),
          h('span', { style: { font: '800 32px/1.05 var(--font-display, var(--jr-font-display))', letterSpacing: '-0.02em', color: T.sprout, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } }, p.widget.amount),
          p.widget.caption ? h('span', { style: { font: T.label, fontWeight: 400, color: T.paper } }, p.widget.caption) : null,
          list.length > 1 ? h('button', cx(lien[1], { type: 'button', onClick: function () { m[1](true); }, style: { all: 'unset', alignSelf: 'flex-start', marginTop: T.s1, minHeight: T.hit, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', font: T.label, color: lien[0] ? T.sprout : T.paper, textDecoration: 'underline', textUnderlineOffset: 'var(--jr-s-1)', borderRadius: T.rs } }), 'Changer de dossier') : null) : null,
        list.length > 1 ? h(Modal, { open: m[0], title: 'Mes dossiers', onClose: function () { m[1](false); } },
          h('ul', { style: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' } }, list.map(function (x, i) {
            return h('li', { key: x.id, style: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: T.s2 + ' ' + T.s4, padding: T.s3 + ' 0', borderTop: i ? T.b : 0 } },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
                h('span', { style: { font: T.labelB } }, x.parcours + (x.id === p.dossierId ? ' · affiché' : '')),
                h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, x.date + ' · ' + x.montant)),
              h('div', { style: { display: 'flex', gap: T.s1, flexWrap: 'wrap', justifyContent: 'flex-end' } },
                x.id === p.dossierId ? null : h(Button, { variant: 'secondary', onClick: function () { p.onDossier && p.onDossier(x.id); m[1](false); } }, 'Ouvrir'),
                h(Button, { variant: 'tertiary', onClick: function () { if (root.confirm && !root.confirm('Supprimer le dossier ' + x.parcours + ' du ' + x.date + ' ? Cette action ne peut pas être annulée.')) return; p.onDelete && p.onDelete(x.id); if (list.length <= 2) m[1](false); } }, 'Supprimer')));
          }))) : null,
        h('nav', { 'aria-label': 'Espace particulier', style: { display: 'flex', flexDirection: 'column', gap: T.s4 } }, (p.sections || []).map(function (s) {
          return h('div', { key: s.title, style: { display: 'flex', flexDirection: 'column', gap: T.s1 } },
            h('span', { style: cx(micro, { color: T.ink, padding: '0 ' + T.s2 }) }, s.title),
            s.items.map(function (it) { return h(SideLink, { key: it.label, it: it }); }));
        })),
        p.user ? h('div', { style: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: T.s3, paddingTop: T.s4, borderTop: 'var(--jr-border) solid var(--jr-ink-40)' } },
          h('span', { style: { width: T.s7, height: T.s7, borderRadius: T.rs, background: T.ink, color: T.paper, display: 'grid', placeItems: 'center', font: T.labelB } }, p.user.initials),
          h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } }, h('span', { style: { font: T.labelB } }, p.user.name), p.user.email ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink } }, p.user.email) : null)) : null) : null);
  }
  function SideLink(p) { var it = p.it, hv = useHover();
    return h('a', cx(hv[1], { href: it.href, 'aria-current': it.current ? 'page' : undefined, style: { display: 'flex', alignItems: 'center', gap: T.s3, minHeight: T.hit, padding: '0 ' + T.s2, borderRadius: T.rs, textDecoration: 'none', color: T.ink, font: it.current ? T.labelB : T.label, background: it.current ? T.white : hv[0] ? T.paper : 'transparent', transition: T.tr } }),
      it.icon ? h(Icon, { name: it.icon }) : null, it.label); }

  /* Blocs éditoriaux */
  function SectionHeader(p) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3, maxWidth: 'var(--jr-measure)', paddingTop: p.bare ? 0 : T.s6, borderTop: p.bare ? 0 : T.b, marginBottom: p.bare ? 0 : T.s6 } },
      h('p', { style: cx(micro, { margin: 0, color: p.surface === 'dark' ? T.paper : T.ink70 }) }, (p.index ? p.index + ' — ' : '') + p.label),
      h(p.as || 'h2', { style: { margin: 0, font: T.h1 } }, p.title),
      p.lead ? h('p', { style: { margin: 0, font: T.lead } }, p.lead) : null);
  }
  function FloatingCard(p) { var dark = !!p.dark;
    return h('div', { 'data-surface': dark ? 'dark' : undefined, style: cx({ display: 'flex', alignItems: 'center', gap: T.s3, padding: T.s4, background: dark ? T.ink : T.white, color: dark ? T.paper : T.ink, border: dark ? 0 : T.b, borderRadius: T.rm }, p.style) },
      h('span', { style: { width: 'var(--jr-s-7)', height: 'var(--jr-s-7)', flex: 'none', display: 'grid', placeItems: 'center', borderRadius: T.rs, background: dark ? 'transparent' : T.wash, border: dark ? 'var(--jr-border) solid var(--jr-sprout)' : 0 } }, h(Icon, { name: p.icon, color: dark ? T.sprout : T.leaf })),
      h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
        h('span', { style: cx(micro, { color: dark ? T.paper : T.ink70 }) }, p.label),
        h('span', { style: { font: p.big ? T.amS : T.labelB } }, p.value),
        p.caption ? h('span', { style: cx(micro, { color: dark ? T.paper : T.ink70 }) }, p.caption) : null)); }
  function ReassuranceTile(p) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s2, padding: T.s4, background: T.white, border: T.b, borderRadius: T.rm, height: '100%' } },
      h(Icon, { name: p.icon, color: T.leaf }), h('strong', { style: { font: T.h3, whiteSpace: 'nowrap' } }, p.keyword), h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.caption)); }
  /* ProjectCard v2 — label numéroté, titre, phrase, chiffre, lignes à filet, pastilles, bouton dans la tuile */
  function ProjectCard(p) {
    var hv = useHover(), hi = p.highlight === 'on', dim = p.highlight === 'dim', on = hv[0] || hi, txt = dim ? T.ink70 : T.ink;
    var pad = 'calc(var(--jr-card-pad) - ' + (on ? 'var(--jr-border-strong)' : 'var(--jr-border)') + ')';
    var pill = { font: T.label, fontWeight: 500, fontSize: 'calc(var(--jr-s-4) - var(--jr-s-1) / 2)', lineHeight: 1.3, padding: T.s1 + ' ' + T.s3, borderRadius: T.pill, background: T.wash, color: T.ink, whiteSpace: 'nowrap' };
    return h('a', cx(hv[1], { href: p.href, 'aria-label': p.title + (p.figure ? ', ' + p.figure + ' ' + (p.figureCaption || '') : ''), style: { display: 'flex', flexDirection: 'column', gap: 0, height: '100%', boxSizing: 'border-box', padding: pad, background: hi ? T.wash : T.white, border: on ? T.bStrong : T.b, borderRadius: T.rl, color: txt, textDecoration: 'none', transform: on ? 'translateY(calc(-1 * var(--jr-s-1) / 2))' : 'none', transition: T.tr + ', transform var(--jr-duration-fast) var(--jr-ease)' } }),
      p.label ? h('span', { style: cx(micro, { color: T.ink70, marginBottom: T.s4 }) }, p.label) : null,
      h('span', { style: { display: 'flex', flexDirection: 'column', gap: T.s2 } },
        h('span', { style: { font: 'var(--jr-type-h1)', fontSize: p.titleSize || 'calc(var(--jr-s-6) - var(--jr-s-1))', lineHeight: 1.15, color: txt, whiteSpace: 'nowrap' } }, p.title),
        p.description ? h('span', { style: { font: T.body, fontWeight: 500, color: txt } }, p.description) : null),
      p.criteria && p.criteria.length ? h('span', { style: { display: 'flex', flexDirection: 'column', gap: T.s2, marginTop: T.s4 } },
        h('span', { style: cx(micro, { color: txt }) }, p.criteriaLabel || 'C’est pour vous si…'),
        p.criteria.map(function (c, i) { return h('span', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: T.s2, font: T.label, fontWeight: 400, color: txt } }, h(IconBadge, { name: 'valide', size: 's', variant: 'lave' }), h('span', { style: { paddingTop: T.s1 } }, c)); })) : null,
      p.figure ? h('span', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: T.s2, margin: T.s5 + ' 0' } },
        p.figurePrefix ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.figurePrefix) : null,
        h('span', { style: { font: T.labelB, fontSize: 'calc(var(--jr-s-6) - var(--jr-s-1))', lineHeight: 1.1, color: T.leaf, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } }, p.figure),
        p.figureCaption ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.figureCaption) : null) : null,
      p.points && p.points.length ? h('ul', { style: { listStyle: 'none', margin: '0 0 ' + T.s4, padding: 0, display: 'flex', flexDirection: 'column' } },
        p.points.map(function (t, i) { return h('li', { key: i, style: { padding: T.s2 + ' 0', borderTop: T.b, font: T.label, fontWeight: 400 } }, t); })) : null,
      p.aides ? h('span', { style: { display: 'flex', flexWrap: 'wrap', gap: T.s2, marginTop: p.cta ? 0 : 'auto', marginBottom: p.cta ? T.s4 : 0 } }, p.aides.map(function (a) { return h('span', { key: a, style: pill }, a); })) : null,
      p.cta ? h('span', { 'aria-hidden': true, style: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: T.hit, borderRadius: T.rs, background: hv[0] ? T.ink : T.leaf, color: T.white, font: T.labelB, transition: T.tr } }, p.cta) : null,
      p.meta ? h('span', { style: cx(micro, { color: T.ink70, textAlign: 'center', marginTop: T.s2 }) }, p.meta) : null);
  }
  function StepNumber(p) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3 } },
      h('span', { 'aria-hidden': true, style: { font: 'var(--jr-type-h1)', fontSize: 'var(--jr-s-7)', lineHeight: 1, color: T.leaf, paddingBottom: T.s3, borderBottom: T.b } }, p.n),
      h('h3', { style: { margin: 0, font: T.h3 } }, p.title), p.children ? h('p', { style: { margin: 0, font: T.body } }, p.children) : null); }


  /* ── Tunnel v2 ─────────────────────────────────────────────── */
  var DPE = [['A','≤\u202f70'],['B','71–110'],['C','111–180'],['D','181–250'],['E','251–330'],['F','331–420'],['G','>\u202f420']];
  function TunnelHeader(p) {
    // Mode tunnel de l'en-tête, sur encre (même traitement que site-header) ; aplat étendu à pleine largeur par border-image, sans débordement.
    var L = ds().Logo, hv = useHover();
    return h('header', { 'data-surface': 'dark', className: 'jr-on-dark', style: { display: 'grid', gridTemplateColumns: p.compact ? 'auto minmax(0, 1fr) auto' : '1fr auto 1fr', alignItems: 'center', gap: T.s4, minHeight: '72px', background: T.ink, color: T.paper, borderImage: 'conic-gradient(var(--jr-ink) 0 0) fill 0 // 0 100vmax' } },
      h('a', { href: p.homeHref || 'index.dc.html', 'aria-label': 'JungleRenov, accueil', style: { justifySelf: 'start', display: 'flex', alignItems: 'center', minHeight: T.hit } }, L ? h(L, { tone: 'inverse', height: p.compact ? 28 : 32, auto: false }) : 'JungleRenov'),
      p.compact ? h('span') : h('span', { role: 'status', style: cx(micro, { color: T.paper, display: 'flex', alignItems: 'center', gap: T.s2 }) }, h(Icon, { name: 'valide', color: T.sprout }), p.saved || 'Enregistré automatiquement'),
      h('a', cx(hv[1], { href: p.backHref || 'choix-parcours.dc.html', style: { justifySelf: 'end', display: 'flex', alignItems: 'center', minHeight: T.hit, padding: '0 ' + T.s2, font: '400 17px/24px var(--jr-font-text)', color: hv[0] ? T.sprout : T.paper, textDecoration: 'underline', textUnderlineOffset: 'var(--jr-s-1)', borderRadius: T.rs || 'var(--jr-radius-s)', transition: 'color var(--jr-duration-fast) var(--jr-ease)' } }), p.compact ? 'Changer' : (p.backLabel || 'Changer de projet')));
  }
  function QuestionBlock(p) {
    var id = R.useId();
    return h('div', { role: p.group ? 'group' : undefined, 'aria-labelledby': p.group ? id : undefined, style: { display: 'flex', flexDirection: 'column', gap: p.hint ? T.s4 : T.s2, paddingTop: p.first ? 0 : T.s6, borderTop: p.first ? 0 : T.b, minWidth: 0 } },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3 } },
        h(p.htmlFor ? 'label' : 'span', { id: id, htmlFor: p.htmlFor, style: { font: T.labelB, fontSize: 'calc(var(--jr-s-5) - var(--jr-s-1))', lineHeight: 'calc(var(--jr-s-5) + var(--jr-s-1))' } }, p.label, p.optional ? h('span', { style: { fontWeight: 400, color: T.ink70 } }, ' (facultatif)') : null),
        p.hint ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70 } }, p.hint) : null),
      p.children,
      p.error ? h('p', { role: 'alert', style: { margin: 0, display: 'flex', gap: T.s2, alignItems: 'center', font: T.labelB, color: T.ko } }, h(Icon, { name: 'bloque' }), p.error) : null);
  }
  function ChoiceGrid(p) {
    var multi = p.type === 'checkbox', val = p.value, n = (p.options || []).length;
    var hasSub = (p.options || []).some(function (o) { return !!o.description; });
    var cols = p.cols || (n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 2 : n === 6 ? 3 : 2);
    cols = Math.min(cols, hasSub ? 3 : 4); /* règle : 4 cartes max par rangée, 3 si sous-titre */
    if (p.narrow) cols = p.narrowCols || 1;
    var on = function (v) { return multi ? (val || []).indexOf(v) >= 0 : val === v; };
    var tog = function (v) { if (!p.onChange) return; if (!multi) return p.onChange(v); p.onChange(on(v) ? val.filter(function (x) { return x !== v; }) : (val || []).concat([v])); };
    return h('div', { role: multi ? 'group' : 'radiogroup', 'aria-label': p.ariaLabel, style: { display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gridAutoRows: '1fr', gap: T.s2 } },
      p.options.map(function (o) { return h(ChoiceCard, { key: o.value, type: p.type, name: p.name, value: o.value, label: o.label, description: o.description, icon: o.icon, compact: p.compact, error: !!p.error, checked: on(o.value), onChange: function () { tog(o.value); } }); }));
  }
  var DPE_SPOKEN = { A: 'jusqu’à 70', B: '71 à 110', C: '111 à 180', D: '181 à 250', E: '251 à 330', F: '331 à 420', G: 'plus de 420' };
  function DpeSelector(p) {
    var small = !!p.narrow, fs = R.useState(null), focus = fs[0], setFocus = fs[1], hv = R.useState(null), hover = hv[0], setHover = hv[1], gref = R.useRef(null);
    var H = small ? 'calc(var(--jr-s-7) - var(--jr-s-1))' : 'var(--jr-choice-h)';
    var HS = small ? 'var(--jr-choice-h)' : 'calc(var(--jr-s-8) + var(--jr-s-2))';
    var items = DPE.map(function (d) { return { v: d[0], range: d[1], bg: 'var(--jr-dpe-' + d[0].toLowerCase() + ')', fg: d[0] === 'A' || d[0] === 'G' ? T.white : T.ink }; })
      .concat([{ v: '?', range: 'Je ne sais pas', bg: T.deep, fg: T.ink, unknown: true }]);
    var cur = items.filter(function (it) { return it.v === p.value; })[0];
    var confirm = !cur ? null : cur.unknown ? 'Classe inconnue : nous l’estimerons à partir du logement' : 'Classe ' + cur.v + ' sélectionnée · ' + cur.range + ' kWh/m²/an';
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3 } },
      h('div', { ref: gref, role: 'radiogroup', 'aria-label': p.ariaLabel || 'Classe énergétique actuelle', style: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr)) minmax(0, 1.7fr)', gap: T.s1, alignItems: 'end' } },
        items.map(function (it) {
          var sel = p.value === it.v, foc = focus === it.v, hov = hover === it.v && !sel;
          var spoken = it.unknown ? 'Je ne sais pas, classe à estimer' : 'Classe ' + it.v + ', ' + DPE_SPOKEN[it.v] + ' kilowattheures par mètre carré par an';
          return h('label', { key: it.v, onMouseEnter: function () { setHover(it.v); }, onMouseLeave: function () { setHover(null); }, style: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: T.s1, cursor: 'pointer', minWidth: 0 } },
            h('input', { type: 'radio', name: p.name || 'dpe', value: it.v, checked: sel, 'aria-label': spoken, onChange: function () { p.onChange && p.onChange(it.v); },
              onFocus: function () { setFocus(it.v); }, onBlur: function () { setFocus(null); }, style: { position: 'absolute', opacity: 0, width: 1, height: 1, margin: 0, pointerEvents: 'none' } }),
            h('span', { 'aria-hidden': true, style: { height: sel ? HS : H, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: T.s1, background: it.bg, color: it.fg, borderRadius: T.rs,
                border: sel ? 'var(--jr-focus-width) solid var(--jr-ink)' : hov ? 'var(--jr-border-strong) solid var(--jr-ink)' : 'var(--jr-border-strong) solid transparent',
                outline: foc ? 'var(--jr-focus-width) solid var(--jr-focus)' : 'none', outlineOffset: 'var(--jr-focus-offset)',
                font: T.labelB, fontSize: small ? 'var(--jr-s-4)' : 'calc(var(--jr-s-5) - var(--jr-s-1))', lineHeight: 1, transition: 'height var(--jr-duration-fast) var(--jr-ease), border-color var(--jr-duration-fast) var(--jr-ease)' } },
              h('span', null, it.unknown ? '?' : it.v),
              sel ? h('span', { style: { width: 'calc(var(--jr-s-5) - var(--jr-s-1))', height: 'calc(var(--jr-s-5) - var(--jr-s-1))', borderRadius: T.pill, background: T.ink, color: T.white, display: 'grid', placeItems: 'center', flex: 'none' } }, h(Icon, { name: 'valide', style: { width: 'var(--jr-s-4)', height: 'var(--jr-s-4)' } })) : null),
            small ? null : h('span', { 'aria-hidden': true, style: cx(micro, { color: sel ? T.ink : T.ink70, fontWeight: sel ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }) }, it.range));
        })),
      h('div', { 'aria-live': 'polite', style: { display: 'flex', alignItems: 'center', gap: T.s3, minHeight: T.hit } },
        cur ? h(IconBadge, { name: 'valide', size: 's', variant: 'feuille' }) : null,
        h('span', { style: { flex: 1, font: T.label, fontWeight: cur ? 700 : 400, color: cur ? T.ink : T.ink70 } }, confirm || 'Choisissez une classe, ou « ? » si vous ne la connaissez pas.'),
        cur ? h(Button, { variant: 'tertiary', onClick: function () { var i = gref.current && gref.current.querySelector('input:checked'); if (i) i.focus(); } }, 'changer') : null));
  }
  function FadeValue(p) {
    var st = R.useState(1), op = st[0], setOp = st[1], first = R.useRef(true);
    R.useEffect(function () { if (first.current) { first.current = false; return; } setOp(0); var r = requestAnimationFrame(function () { setOp(1); }); return function () { cancelAnimationFrame(r); }; }, [p.k]);
    return h('span', { style: { display: 'block', opacity: op, transition: op ? 'opacity var(--jr-duration-fast) var(--jr-ease)' : 'none' } }, p.children);
  }
  function ProjectRecap(p) {
    var rows = p.rows || [];
    return h('aside', { 'aria-label': p.title || 'Votre projet', style: { background: T.white, border: T.b, borderRadius: T.rm, overflow: 'hidden' } },
      h('p', { style: cx(micro, { margin: 0, padding: T.s5 + ' ' + T.s5 + ' ' + T.s3, color: T.ink70, borderBottom: T.b }) }, p.title || 'Votre projet'),
      h('dl', { style: { margin: 0 } }, rows.filter(function (r) { return !r.hidden; }).map(function (r, i) {
        var done = r.value != null && r.value !== '' && !(Array.isArray(r.value) && !r.value.length);
        return h('div', { key: r.key, 'aria-current': r.current ? 'step' : undefined, style: { padding: T.s2 + ' ' + T.s5, paddingLeft: r.current ? 'calc(var(--jr-s-5) - var(--jr-border-strong))' : T.s5, borderTop: i ? T.b : 0, borderLeft: r.current ? 'var(--jr-border-strong) solid var(--jr-leaf)' : 0, display: 'flex', flexDirection: 'column', gap: T.s1 } },
          h('dt', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: T.s3, font: T.labelB, color: done ? T.ink : T.ink70 } }, r.key,
            done && r.href && !r.current ? h('a', { href: r.href, onClick: r.onEdit, style: { font: T.label, fontWeight: 400, display: 'inline-flex', alignItems: 'center', minHeight: T.hit, margin: 'calc(-1 * var(--jr-s-3)) 0' } }, 'modifier') : null),
          h('dd', { style: { margin: 0, font: T.label, fontWeight: 400, whiteSpace: 'pre-line', color: done ? T.ink : T.ink40 } },
            !done ? '—' : h(FadeValue, { k: JSON.stringify(r.value) }, Array.isArray(r.value) ? (function () { var max = 4, list = r.value.length > max ? r.value.slice(0, max - 1).concat(['+' + (r.value.length - (max - 1))]) : r.value; return h('span', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: T.s1 } }, list.map(function (v) { return h('span', { key: v, title: v, style: { font: T.label, fontWeight: 500, fontSize: 'calc(var(--jr-s-4) - var(--jr-s-1) / 2)', lineHeight: 'var(--jr-s-5)', padding: '0 ' + T.s2, borderRadius: T.pill, background: T.wash, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, v); })); })() : r.value)));
      })),
      p.footer || null);
  }
  function StickyFooter(p) {
    return h('div', { style: { position: 'sticky', bottom: 0, zIndex: 5, background: T.paper, borderTop: T.b, paddingBottom: 'env(safe-area-inset-bottom)' } },
      h('div', { style: { maxWidth: 'var(--jr-container)', margin: '0 auto', minHeight: 'var(--jr-sticky-h)', boxSizing: 'border-box', padding: T.s1 + ' var(--jr-page-x)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: T.s3 } },
        h(Button, { variant: 'secondary', href: p.prevHref, onClick: p.onPrev, disabled: p.prevDisabled }, p.prevLabel || 'Précédent'),
        h(Button, { onClick: p.onNext, loading: p.loading, style: p.nextDisabled ? { background: 'var(--jr-paper-deep)', color: 'var(--jr-ink)', cursor: 'not-allowed' } : undefined, 'aria-disabled': p.nextDisabled || undefined }, p.nextLabel || 'Continuer')));
  }


  /* Accordion — simple, groupe, dense */
  function AccordionItem(p) {
    var id = R.useId(), open = !!p.open, dense = !!p.dense, hv = useHover(), fr = useFocusRing();
    var items = p.items || [];
    var preview = p.preview != null ? p.preview : (items[0] || p.text || '');
    return h('div', { style: { borderTop: p.first ? 0 : T.b } },
      h('button', cx(hv[1], fr[1], { type: 'button', 'aria-expanded': open, 'aria-controls': id, onClick: p.onToggle,
        style: cx({ all: 'unset', boxSizing: 'border-box', width: '100%', minHeight: dense ? T.hit : 'var(--jr-choice-h)', padding: T.s2 + ' ' + (dense ? 0 : T.s5), display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', alignItems: 'center', columnGap: T.s3, cursor: 'pointer', background: hv[0] && !dense ? T.wash : 'transparent', transition: T.tr }, fr[0] && FOCUS) }),
        h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
          h('span', { style: { font: dense ? T.micro : T.labelB, letterSpacing: dense ? 'var(--jr-micro-tracking)' : undefined, color: T.ink } }, p.title),
          !open && preview && !dense ? h('span', { style: { font: T.label, fontWeight: 400, color: T.ink70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, preview) : null),
        p.count ? h('span', { style: cx(micro, { color: dense ? T.ink : T.ink70, whiteSpace: 'nowrap' }) }, p.count) : h('span'),
        h(Icon, { name: 'chevron', style: { width: 'calc(var(--jr-s-5) - var(--jr-s-1))', height: 'calc(var(--jr-s-5) - var(--jr-s-1))', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--jr-duration-fast) var(--jr-ease)' } })),
      open ? h('div', { id: id, role: 'region', style: { padding: dense ? '0 0 ' + T.s2 : T.s4 + ' ' + T.s5 + ' ' + T.s5, borderTop: dense ? 0 : T.b } },
        items.length ? h('ul', { style: { margin: 0, paddingLeft: T.s5, display: 'flex', flexDirection: 'column', gap: T.s2, font: T.body } }, items.map(function (it, i) { return h('li', { key: i }, it); })) : null,
        p.text ? h('p', { style: { margin: 0, font: T.body, maxWidth: 'var(--jr-measure)' } }, p.text) : null,
        p.children || null) : null);
  }
  /* AccordionTile — variante « tuiles » : carte par question, toute la tuile cliquable */
  function AccordionTile(p) {
    var id = R.useId(), open = !!p.open, hv = useHover(), fr = useFocusRing();
    var bw = open ? 'var(--jr-border-strong)' : 'var(--jr-border)';
    var pad = 'calc(var(--jr-s-5) - ' + bw + ' + var(--jr-border))';
    var onTile = function (e) { if (e.target.closest && (e.target.closest('a') || e.target.closest('[role="region"]') || e.target.closest('button'))) return; p.onToggle && p.onToggle(); };
    return h('div', cx(hv[1], { id: p.anchor, onClick: onTile, style: { scrollMarginTop: 'var(--jr-s-8)', boxSizing: 'border-box', background: open ? T.wash : (p.tileSurface === 'ivoire' ? T.paper : T.white), border: bw + ' solid ' + (open || hv[0] ? T.leaf : T.ink10), borderRadius: 'var(--jr-radius-l)', padding: pad, cursor: 'pointer', transition: 'border-color var(--jr-duration-fast) var(--jr-ease), background var(--jr-duration-fast) var(--jr-ease)' } }),
      h('button', cx(fr[1], { type: 'button', 'aria-expanded': open, 'aria-controls': id, onClick: p.onToggle,
        style: cx({ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: T.s4, alignItems: 'center', cursor: 'pointer', borderRadius: 'var(--jr-radius-s)' }, fr[0] && FOCUS) }),
        h(IconBadge, { name: 'chevron', size: 'm', variant: 'feuille-pousse', style: { transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--jr-duration) var(--jr-ease)' } }),
        h('span', { style: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 } },
          h('span', { style: { font: '700 18px/26px var(--jr-font-text)', color: T.ink, textWrap: 'pretty' } }, p.title),
          !open && p.preview ? h('span', { style: { font: '400 15px/22px var(--jr-font-text)', color: T.ink70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, p.preview) : null)),
      open ? h('div', { id: id, role: 'region', style: { cursor: 'auto', margin: T.s4 + ' 0 0', padding: T.s4 + ' 0 0', borderTop: 'var(--jr-border) solid ' + T.ink10, marginLeft: 'calc(var(--jr-s-6) + var(--jr-s-2) + var(--jr-s-4))' } },
        p.content || h('p', { style: { margin: 0, font: '400 17px/26px var(--jr-font-text)', color: T.ink, maxWidth: 'var(--jr-measure)', textWrap: 'pretty' } }, p.text)) : null);
  }
  function Accordion(p) {
    var sections = p.sections || [{ title: p.title, count: p.count, preview: p.preview, items: p.items, children: p.children }];
    var init = p.defaultOpen === true ? [0] : typeof p.defaultOpen === 'number' ? [p.defaultOpen] : [];
    var st = R.useState(init), open = st[0], setOpen = st[1];
    var tog = function (i) { setOpen(function (o) { var on = o.indexOf(i) >= 0; if (p.variant === 'group') return on ? [] : [i]; return on ? o.filter(function (x) { return x !== i; }) : o.concat([i]); }); };
    var dense = p.variant === 'dense';
    if (p.variant === 'tiles') return h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s3 } },
      sections.map(function (s, i) { var ctl = Array.isArray(p.openIndices); return h(AccordionTile, { key: s.id || i, anchor: s.id, tileSurface: p.tileSurface, title: s.title, preview: s.preview != null ? s.preview : (typeof s.text === 'string' ? s.text : ''), text: s.text, content: s.content, open: (ctl ? p.openIndices : open).indexOf(i) >= 0, onToggle: function () { if (ctl) return p.onToggleIndex && p.onToggleIndex(i); setOpen(function (o) { return o.indexOf(i) >= 0 ? (p.multi ? o.filter(function (x) { return x !== i; }) : []) : (p.multi ? o.concat([i]) : [i]); }); } }); }));
    return h('div', { style: dense ? {} : { background: T.white, border: T.b, borderRadius: T.rm, overflow: 'hidden' } },
      sections.map(function (s, i) { return h(AccordionItem, { key: i, first: i === 0, dense: dense, title: s.title, count: s.count, preview: s.preview, items: s.items, text: s.text, open: open.indexOf(i) >= 0, onToggle: function () { tog(i); } }, s.children); }));
  }


  /* DossierHandoff — dernière étape commune aux trois tunnels */
  function DossierHandoff(p) {
    var st = R.useState({ fn: '', ln: '', em: '', tel: '', pw: '', consent: false, cgu: false }), f = st[0], setF = st[1];
    var es = R.useState({}), err = es[0], setErr = es[1];
    var ds = R.useState(null), done = ds[0], setDone = ds[1];
    var ls = R.useState(false), sending = ls[0], setSending = ls[1];
    var ms = R.useState(false), modal = ms[0], setModal = ms[1];
    var lg = R.useState({ em: '', pw: '', err: '' }), log = lg[0], setLog = lg[1];
    var us = R.useState(null), user = us[0], setUser = us[1];
    R.useEffect(function () { try { var s = JSON.parse(localStorage.getItem('junglerenov.session') || 'null'); if (s && s.role === 'client') setUser(s); } catch (_) {} }, []);
    var up = function (k) { return function (e) { var v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setF(function (o) { var n = cx(o); n[k] = v; return n; }); setErr(function (o) { var n = cx(o); delete n[k]; return n; }); }; };
    var tog = function (k) { return function () { setF(function (o) { var n = cx(o); n[k] = !o[k]; return n; }); setErr(function (o) { var n = cx(o); delete n[k]; return n; }); }; };
    var ok = f.consent && f.cgu;
    var submit = function () {
      var e = {};
      if (!user) {
        if (!f.fn.trim()) e.fn = 'Indiquez votre prénom.'; if (!f.ln.trim()) e.ln = 'Indiquez votre nom.';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.em.trim())) e.em = 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.';
        if (f.pw.length < 8) e.pw = 'Choisissez un mot de passe d’au moins 8 caractères.';
      }
      if (!f.consent) e.consent = 'Cochez cette case pour autoriser la remise de votre dossier.';
      if (!f.cgu) e.cgu = 'Cochez cette case pour continuer.';
      setErr(e); if (Object.keys(e).length) return;
      setSending(true);
      var data = user ? { fn: user.firstname || '', ln: user.lastname || '', em: user.email, tel: '', existing: true } : { fn: f.fn.trim(), ln: f.ln.trim(), em: f.em.trim(), tel: f.tel.trim() };
      Promise.resolve(p.onSubmit ? p.onSubmit(data) : null).then(function (r) { setSending(false); if (r && r.error) { setErr({ form: r.error }); return; } setDone(r || {}); if (root.scrollTo) root.scrollTo(0, 0); })
        .catch(function (x) { setSending(false); setErr({ form: (x && x.message) || 'La remise n’a pas abouti. Réessayez dans un instant.' }); });
    };
    var doLogin = function () {
      if (!root.RFStore) return;
      Promise.resolve().then(function () { return root.RFStore.login(log.em, log.pw); }).then(function (r) { setUser(r.user); setModal(false); })
        .catch(function (x) { setLog(cx(log, { err: (x && x.message) || 'Connexion impossible.' })); });
    };
    var card = { background: T.white, border: T.b, borderRadius: T.rm, padding: 'var(--jr-card-pad)', display: 'flex', flexDirection: 'column', gap: T.s3 };
    var grid2 = { display: 'grid', gridTemplateColumns: p.narrow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: 'var(--jr-s-5) var(--jr-gutter)', alignItems: 'start' };
    if (done) {
      return h('section', { 'aria-live': 'polite', style: cx(card, { alignItems: 'flex-start', gap: T.s4, padding: 'var(--jr-s-7) var(--jr-card-pad)' }) },
        h(IconBadge, { name: 'valide', size: 'l', variant: 'feuille' }),
        h('h1', { style: { margin: 0, font: T.h1 } }, 'Dossier remis'),
        h('p', { style: { margin: 0, font: T.body, maxWidth: 'var(--jr-measure)' } }, 'Votre dossier ' + (p.parcours || '') + ' est remis au partenaire habilité de votre secteur. Il vous contactera pour la suite ; vous gardez le dépôt, sur le site de l’Anah.'),
        p.total ? h('p', { style: { margin: 0, font: T.labelB } }, 'Aides estimées : ' + p.total) : null,
        h(Button, { href: done.href || 'dashboard.dc.html', fullWidth: p.narrow }, 'Accéder à mon espace'));
    }
    return h(F, null,
      h('div', { style: { display: 'flex', flexDirection: 'column', maxWidth: 'var(--jr-measure)' } },
        h('p', { style: cx(micro, { margin: '0 0 var(--jr-title-gap)', color: T.ink70 }) }, p.eyebrow || 'Dernière étape · Dossier'),
        h('h1', { style: { margin: 0, font: T.h1 } }, 'Remettre votre dossier au partenaire habilité'),
        h('p', { style: { margin: T.s3 + ' 0 0', font: T.body, color: T.ink70 } }, 'Vérifiez votre récapitulatif, puis indiquez comment vous joindre.')),
      h('div', { 'data-jr-anchor': '' }, h(Accordion, { variant: 'group', defaultOpen: 0, sections: p.recap || [] })),
      h('div', { style: { display: 'grid', gridTemplateColumns: p.narrow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: 'var(--jr-gutter)' } },
        h('section', { style: card }, h(IconBadge, { name: 'remise-partenaire', size: 'm', variant: 'feuille' }), h('h2', { style: { margin: 0, font: T.h3 } }, 'Ce que reçoit le partenaire'),
          h('ul', { style: { margin: 0, paddingLeft: T.s5, display: 'flex', flexDirection: 'column', gap: T.s1, font: T.body } }, h('li', null, 'Votre profil et celui du logement'), h('li', null, 'Les travaux envisagés et l’estimation des aides'), h('li', null, 'Vos coordonnées, pour vous contacter'))),
        h('section', { style: card }, h(IconBadge, { name: 'dossier', size: 'm', variant: 'feuille' }), h('h2', { style: { margin: 0, font: T.h3 } }, 'Ce que vous gardez à faire'),
          h('p', { style: { margin: 0, font: T.body } }, 'Le dépôt de votre demande, vous-même, sur le site de l’Anah, avec l’aide du partenaire habilité.'))),
      h(Notice, { tone: 'info' }, 'JungleRenov n’est pas agréé Mon Accompagnateur Rénov’. Le dépôt se fait par vous, sur le site de l’Anah.'),
      h('section', { 'aria-labelledby': 'jr-dh-t', style: cx(card, { gap: 'var(--jr-s-5)' }) },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: T.s3 } },
          h('h2', { id: 'jr-dh-t', style: { margin: 0, font: T.labelB, fontSize: 'calc(var(--jr-s-5) - var(--jr-s-1))', lineHeight: 'calc(var(--jr-s-5) + var(--jr-s-1))' } }, user ? 'Remettre mon dossier' : 'Créer mon compte et remettre mon dossier'),
          user ? h('span', { style: { font: T.label, color: T.ink70, fontWeight: 400 } }, 'Connecté : ' + user.email) : h(Button, { variant: 'tertiary', onClick: function () { setModal(true); } }, 'J’ai déjà un compte — me connecter')),
        user ? null : h('div', { style: grid2 },
          h(TextField, { id: 'dh-fn', label: 'Prénom', value: f.fn, onChange: up('fn'), error: err.fn }), h(TextField, { id: 'dh-ln', label: 'Nom', value: f.ln, onChange: up('ln'), error: err.ln }),
          h(TextField, { id: 'dh-em', label: 'E-mail', type: 'email', value: f.em, onChange: up('em'), error: err.em }), h(TextField, { id: 'dh-tel', label: 'Téléphone', type: 'tel', optional: true, value: f.tel, onChange: up('tel') }),
          h(PasswordField, { id: 'dh-pw', value: f.pw, onChange: up('pw'), error: err.pw })),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s2 } },
          h(ChoiceCard, { type: 'checkbox', name: 'dh-consent', label: 'J’accepte que mon dossier soit remis au partenaire habilité de mon département', checked: f.consent, onChange: tog('consent'), error: !!err.consent }),
          err.consent ? h('p', { role: 'alert', style: { margin: 0, display: 'flex', gap: T.s2, alignItems: 'center', font: T.labelB, color: T.ko } }, h(Icon, { name: 'bloque' }), err.consent) : null,
          h(ChoiceCard, { type: 'checkbox', name: 'dh-cgu', label: 'J’ai lu les CGU et la politique de confidentialité', checked: f.cgu, onChange: tog('cgu'), error: !!err.cgu }),
          err.cgu ? h('p', { role: 'alert', style: { margin: 0, display: 'flex', gap: T.s2, alignItems: 'center', font: T.labelB, color: T.ko } }, h(Icon, { name: 'bloque' }), err.cgu) : null),
        err.form ? h(Notice, { tone: 'bloque' }, err.form) : null,
        h('p', { style: { margin: 0, font: T.label, fontWeight: 400, color: T.ink70 } }, 'Le compte sert à suivre votre dossier et à le reprendre plus tard. Gratuit, sans paiement.')),
      h(GuaranteeCard, { as: 'h2' }),
      h(StickyFooter, { narrow: p.narrow, onPrev: p.onPrev, onNext: submit, loading: sending, nextLabel: user ? 'Remettre mon dossier' : 'Créer mon compte et remettre mon dossier', nextDisabled: !ok }),
      h(Modal, { open: modal, title: 'Connexion', onClose: function () { setModal(false); }, actions: [h(Button, { key: 'c', variant: 'secondary', onClick: function () { setModal(false); } }, 'Annuler'), h(Button, { key: 'l', onClick: doLogin }, 'Se connecter')] },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: T.s4 } },
          h(TextField, { id: 'dh-lem', label: 'E-mail', type: 'email', value: log.em, onChange: function (e) { setLog(cx(log, { em: e.target.value, err: '' })); } }),
          h(PasswordField, { id: 'dh-lpw', label: 'Mot de passe', hint: ' ', value: log.pw, onChange: function (e) { setLog(cx(log, { pw: e.target.value, err: '' })); } }),
          log.err ? h(Notice, { tone: 'bloque' }, log.err) : null)));
  }
  function PasswordField(p) {
    var sh = R.useState(false), show = sh[0], setShow = sh[1];
    var btn = h('button', { type: 'button', 'aria-label': show ? 'Masquer le mot de passe' : 'Afficher le mot de passe', 'aria-pressed': show, onClick: function () { setShow(!show); },
      style: { all: 'unset', flex: 'none', display: 'flex', alignItems: 'center', padding: '0 ' + T.s3, borderLeft: T.b, cursor: 'pointer', font: T.label, color: T.ink, whiteSpace: 'nowrap' } }, show ? 'Masquer' : 'Afficher');
    return h(TextField, { id: p.id, label: p.label || 'Mot de passe', hint: p.hint || '8 caractères minimum.', hintBelow: true, type: show ? 'text' : 'password', value: p.value, onChange: p.onChange, error: p.error, suffix: btn });
  }


  /* Remise du dossier — logique commune aux trois tunnels (lib/ : _storage, _dossiers, _transmission) */
  root.jrHandoff = function (type, profile, result, dept, clearKeys) {
    localStorage.setItem('junglerenov.profile', JSON.stringify(profile));
    var client = null;
    if (root.RFStore && root.RFStore.saveClient) {
      var ex = root.RFStore.getClientByEmail ? root.RFStore.getClientByEmail(profile.email) : null;
      client = root.RFStore.saveClient(Object.assign({}, ex || {}, { email: profile.email, firstname: profile.firstname, lastname: profile.lastname, phone: profile.phone, dept: dept }));
    }
    var pro = root.RFTransmission && root.RFTransmission.professionnelPour ? root.RFTransmission.professionnelPour(type, dept) : null;
    var d = root.RFDossiers.createTransmis(type, profile, result, { partenaireNom: pro && pro.nom, partenaireRole: pro && pro.role, departement: dept, consentementTransmission: { date: new Date().toISOString(), texte: 'Remise au partenaire habilité du département' } });
    localStorage.setItem('junglerenov.session', JSON.stringify({ id: client ? client.id : 'client_' + Date.now(), email: profile.email, role: 'client', firstname: profile.firstname, lastname: profile.lastname, loggedAt: Date.now() }));
    (clearKeys || []).forEach(function (k) { localStorage.removeItem(k); });
    return { href: 'dashboard.dc.html?dossier=' + encodeURIComponent(d.id) };
  };
  root.JRv2 = { GuaranteeCard: GuaranteeCard, DossierHandoff: DossierHandoff, PasswordField: PasswordField, Accordion: Accordion, TunnelHeader: TunnelHeader, QuestionBlock: QuestionBlock, ChoiceGrid: ChoiceGrid, DpeSelector: DpeSelector, ProjectRecap: ProjectRecap, StickyFooter: StickyFooter, Icon: Icon, IconBadge: IconBadge, CurrentStepCard: CurrentStepCard, DocumentRow: DocumentRow, Button: Button, TextField: TextField, Select: Select, ChoiceCard: ChoiceCard, ChoiceGroup: ChoiceGroup, StatusTag: StatusTag, Notice: Notice, Toast: Toast,
    AidAmount: AidAmount, Card: Card, Table: Table, Tabs: Tabs, Breadcrumb: Breadcrumb, Pagination: Pagination, Modal: Modal, Tooltip: Tooltip, EmptyState: EmptyState, Skeleton: Skeleton,
    FileDrop: FileDrop, Stepper: Stepper, Sidebar: Sidebar, SectionHeader: SectionHeader, FloatingCard: FloatingCard, ReassuranceTile: ReassuranceTile, ProjectCard: ProjectCard, StepNumber: StepNumber };
  }
  (function wait() { if (root.React && root.ReactDOM) init(); else setTimeout(wait, 20); })();
})(window);
