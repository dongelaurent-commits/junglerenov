
  // Tab definitions: order = display order
  const PAGES = [
    {id:'mentions', label:'Mentions légales', group:'legal'},
    {id:'cgu', label:'CGU', group:'legal'},
    {id:'privacy', label:'Confidentialité', group:'legal'},
    {id:'cookies', label:'Cookies', group:'legal'},
    {id:'about', label:'À propos', group:'about'},
    {id:'independance', label:'Indépendance', group:'about'},
    {id:'contact', label:'Contact', group:'about'},
    {id:'presse', label:'Presse', group:'about'},
    {id:'guide-mpr', label:"Guide MaPrimeRénov'", group:'guide'},
    {id:'guide-cee', label:'Guide CEE', group:'guide'},
    {id:'guide-dpe', label:'Calendrier DPE', group:'guide'},
    {id:'glossaire', label:'Glossaire', group:'guide'},
  ];

  const tabsEl = document.getElementById('tabs');
  PAGES.forEach(p => {
    const b = document.createElement('button');
    b.textContent = p.label; b.dataset.target = p.id;
    b.addEventListener('click', () => activate(p.id, true));
    tabsEl.appendChild(b);
  });

  function buildToc(pageEl){
    const list = document.getElementById('toc-list');
    list.innerHTML = '';
    pageEl.querySelectorAll('h2[id]').forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#'+h.id; a.textContent = h.textContent;
      a.addEventListener('click', e => {
        e.preventDefault();
        jrScrollTo(document.getElementById(h.id));
        history.replaceState(null,'','#'+h.id);
      });
      li.appendChild(a); list.appendChild(li);
    });
  }

  function activate(id, pushUrl){
    const target = document.querySelector(`.doc-page[data-page="${id}"]`);
    if (!target) return;
    document.querySelectorAll('.doc-page').forEach(el => el.classList.remove('active'));
    target.classList.add('active');
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.target === id));
    document.getElementById('page-title').textContent = target.dataset.title;
    document.getElementById('page-lede').textContent = target.dataset.lede;
    document.getElementById('crumb').textContent = target.dataset.title;
    document.title = `JungleRenov — ${target.dataset.title}`;
    buildToc(target);
    if (pushUrl) {
      const url = new URL(location.href);
      url.searchParams.set('p', id);
      url.hash = '';
      history.replaceState(null,'',url);
    }
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // Internal cross-links (data-goto inside docs)
  document.body.addEventListener('click', e => {
    const a = e.target.closest('a[data-goto]');
    if (a) { e.preventDefault(); activate(a.dataset.goto, true); }
  });

  // Initial page from query string
  const initial = new URLSearchParams(location.search).get('p') || 'mentions';
  activate(initial, false);
