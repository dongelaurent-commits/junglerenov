/* JungleRenov — tableau de bord composé avec le design system.
   Lit les dossiers via RFDossiers (lib/_dossiers.js), sans le modifier. */
(function (root) {
  'use strict';
  var NS = 'JungleRenovDesignSystem_fc0082';
  function h() { return root.React.createElement.apply(null, arguments); }
  function eur(n) { return (Math.round(n || 0)).toLocaleString('fr-FR') + '\u202f€'; }

  function pickDossier() {
    var D = root.RFDossiers; if (!D) return null;
    var all = D.getActifs ? D.getActifs() : [];
    if (!all.length) return null;
    var id = new URLSearchParams(location.search).get('dossier');
    var d = id && all.filter(function (x) { return x.id === id; })[0];
    return d || all.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); })[0];
  }
  function address(d) {
    var p = (d && d.profile) || {};
    return p.address || p.adresse || (p.logement && (p.logement.address || p.logement.adresse)) || d.adresseLogement || '';
  }

  function View(props) {
    var DS = root[NS]; var D = root.RFDossiers;
    var tick = root.React.useState(0); var rerender = function () { tick[1](tick[0] + 1); };
    if (!DS || !D) return null;
    var d = pickDossier();
    var greet = (root.RFUser && root.RFUser.getGreeting()) || 'Bonjour';
    var section = { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' };
    var h2 = { margin: 0, font: 'var(--type-h2)' };

    if (!d) {
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' } },
        h('h1', { style: { margin: 0, font: 'var(--type-h1)' } }, greet),
        h('div', { style: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'flex-start' } },
          h('p', { style: { margin: 0, font: 'var(--type-lead)' } }, "Vous n'avez encore aucun dossier actif."),
          h(DS.Button, { href: 'choix-parcours.dc.html' }, 'Faire la simulation')));
    }

    var tl = D.getTimeline(d); var idx = D.getCurrentStepIndex(d); var cur = tl[idx];
    var docs = D.getDocumentsAttendus(d) || [];
    var recus = (d.suivi && d.suivi.documents) || [];
    var meta = D.meta(d.type);
    var adr = address(d);

    var bandeau = h('section', { 'data-surface': 'dark', className: 'jr-on-dark', 'aria-label': 'Votre parcours',
      style: { background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' } },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-5)' } },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 } },
          h('h1', { style: { margin: 0, font: 'var(--type-h1)', fontSize: 'clamp(30px, 5vw, 40px)', color: 'var(--paper)' } }, greet),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' } },
            h('span', { style: { display: 'inline-flex', alignItems: 'center', minHeight: 32, padding: '0 var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--paper)', color: 'var(--ink)', font: 'var(--type-label)' } }, meta.titre),
            adr ? h('span', { style: { font: 'var(--type-caption)' } }, adr) : null)),
        h('dl', { style: { margin: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' } },
          h('div', null, h('dt', { style: { font: 'var(--type-label)' } }, 'Aides à récupérer'),
            h('dd', { style: { margin: 0, font: 'var(--fw-display) 40px/46px var(--font-display)', color: 'var(--accent-on-dark)', fontVariantNumeric: 'tabular-nums' } }, eur(D.totalAides(d)))),
          h('div', null, h('dt', { style: { font: 'var(--type-label)' } }, 'Étapes complétées'),
            h('dd', { style: { margin: 0, font: 'var(--fw-display) 40px/46px var(--font-display)', fontVariantNumeric: 'tabular-nums' } }, idx + ' sur ' + tl.length)))),
      h(DS.Stepper, { steps: tl.map(function (s) { return s.court || s.libelle; }), current: idx, surface: 'dark', style: { padding: 0 } }));

    var actions = [];
    if (cur.cta && cur.href) actions.push(h(DS.Button, { key: 'a', href: cur.href }, cur.cta));
    if (idx < tl.length - 1) actions.push(h(DS.Button, { key: 'b', variant: cur.cta ? 'secondary' : 'primary', onClick: function () { D.advanceEtape(d.id); rerender(); } }, 'J’ai fait cette étape'));
    var metaTxt = [cur.delai && ('Délai : ' + cur.delai), cur.duree && ('Durée : ' + cur.duree)].filter(Boolean).join(' · ');
    var carte = h(DS.CurrentStepCard, { step: idx + 1, total: tl.length, title: cur.libelle, description: cur.description, meta: metaTxt || undefined,
      actions: actions.length ? h(root.React.Fragment, null, actions) : undefined },
      cur.tips && cur.tips.length ? h('ul', { style: { margin: 0, padding: 'var(--space-4) var(--space-5) var(--space-4) var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', font: 'var(--type-body)' } },
        cur.tips.map(function (t, i) { return h('li', { key: i }, t); })) : null);

    var etapes = h('section', { style: section, 'aria-labelledby': 'jr-etapes' },
      h('h2', { id: 'jr-etapes', style: h2 }, 'Les étapes de votre dossier'),
      h('ol', { style: { listStyle: 'none', margin: 0, padding: 0, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' } },
        tl.map(function (s, i) {
          var st = i < idx ? 'valide' : i === idx ? 'en-cours' : 'a-venir';
          var lbl = i < idx ? 'Faite' : i === idx ? 'En cours' : 'À venir';
          return h('li', { key: s.key, style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', minHeight: 64, padding: 'var(--space-3) var(--space-5)', borderTop: i ? '1px solid var(--line)' : 0 } },
            h('span', { style: { font: i === idx ? 'var(--type-label)' : 'var(--type-body)', fontVariantNumeric: 'tabular-nums' } }, (i + 1) + '. ' + s.libelle),
            h(DS.StatusTag, { status: st }, lbl));
        })));

    var docsSec = h('section', { style: section, 'aria-labelledby': 'jr-docs' },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' } },
        h('h2', { id: 'jr-docs', style: h2 }, 'Documents à préparer'),
        h(DS.Button, { variant: 'link', href: 'mes-documents.dc.html' }, 'Voir mes documents')),
      h('div', { style: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' } },
        docs.map(function (doc) {
          var ok = recus.some(function (r) { return r === doc.key || (r && r.key === doc.key); });
          return h(DS.DocumentRow, { key: doc.key, picto: /imposition/.test(doc.key) ? 'avis-imposition' : /devis/.test(doc.key) ? 'devis' : 'document',
            label: doc.libelle, caption: doc.obligatoire ? 'Obligatoire' : 'Selon votre projet', status: ok ? 'valide' : 'manquant' });
        })));

    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-7)' } },
      bandeau, carte, etapes, docsSec,
      h('div', null, h(DS.Button, { variant: 'secondary', href: 'choix-parcours.dc.html' }, 'Nouveau dossier')));
  }

  root.jrDashboard = function (host) {
    var r = root.ReactDOM.createRoot(host);
    var go = function () { if (root[NS] && root.RFDossiers) r.render(h(View)); else setTimeout(go, 60); };
    go();
  };
})(window);
