
  // ─── Auth check — affiche un mur de login inline si pas de session admin ───
  function setupAdminUI(){
    const me = RFStore.getCurrentUser();
    document.getElementById('me-name').textContent = me.email.split('@')[0];
    document.getElementById('me-role').textContent = me.role === 'super_admin' ? 'super admin' : 'admin';
    document.getElementById('me-av').textContent = (me.email[0] || 'A').toUpperCase();
    document.getElementById('auth-wall').classList.remove('show');
  }

  function showAuthWall(){
    document.getElementById('auth-wall').classList.add('show');
    setTimeout(() => document.getElementById('auth-email').focus(), 80);
  }

  /* Le chargement des données est SUBORDONNÉ à l'authentification : rien
     n'est injecté dans la page tant que la session admin n'est pas établie.
     Un calque CSS n'est pas un contrôle d'accès — tant qu'il n'y a pas de
     vérification côté serveur, ces consoles sont retirées du déploiement
     (voir la règle 404 de vercel.json). */
  if (RFStore.isAdmin()) {
    setupAdminUI();
    loadDashboard();
  } else {
    showAuthWall();
  }

  // Handler du formulaire de login inline (mur d'auth)
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-err');
    errEl.classList.remove('show');
    try {
      const email = document.getElementById('auth-email').value.trim();
      const pw    = document.getElementById('auth-pw').value;
      const { role } = await RFStore.login(email, pw);
      if (role === 'admin' || role === 'super_admin') {
        setupAdminUI();
        loadDashboard();
      } else {
        // Client connecté par erreur sur ce formulaire
        errEl.textContent = "Ce compte est un compte client. Utilisez un compte administrateur pour accéder à cette console.";
        errEl.classList.add('show');
        RFStore.logout();
      }
    } catch(err){
      errEl.textContent = err.message || 'Connexion impossible.';
      errEl.classList.add('show');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    RFStore.logout();
    showAuthWall();
    // Vide le formulaire pour qu'il soit prêt à une nouvelle saisie
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-pw').value = '';
  });

  // ─── Navigation views ───────────────────────────────────────────────────
  document.querySelectorAll('.nav a[data-view]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const view = a.dataset.view;
      document.querySelectorAll('.nav a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      ['clients','documents','waitlist','audit'].forEach(v => {
        document.getElementById('view-' + v).hidden = v !== view;
      });
      if (view === 'audit') loadAudit();
      if (view === 'documents') loadDocsWaiting();
    });
  });

  // ─── Toast helper ───────────────────────────────────────────────────────
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ─── Formatters ─────────────────────────────────────────────────────────
  function fmtEUR(n){ if (!n || isNaN(n)) return '—'; return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'; }
  function fmtDate(d){ if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric'}); }
  function initials(c){ return ((c.firstname||'?')[0] + (c.lastname||'')[0]).toUpperCase(); }
  function fullname(c){ return ((c.firstname||'') + ' ' + (c.lastname||'')).trim() || c.email; }

  // ─── État de filtre courant ─────────────────────────────────────────────
  let currentFilter = 'all'; // 'all' ou une clé de DOSSIER_STATUSES
  let currentSearch = '';

  // ─── KPIs et liste clients ──────────────────────────────────────────────
  async function loadDashboard() {
    const stats = await RFStore.getStats();
    document.getElementById('kpi-actifs').textContent = stats.activeClients;
    document.getElementById('kpi-actifs-d').textContent = `${stats.dossiersActifs} dossier${stats.dossiersActifs > 1 ? 's' : ''} en cours`;
    document.getElementById('kpi-transmis').textContent = stats.dossiersTransmis;
    document.getElementById('kpi-aides').textContent = fmtEUR(stats.totalAides);
    document.getElementById('kpi-docs').textContent = stats.documentsAFournir;
    document.getElementById('count-clients').textContent = stats.totalClients;
    document.getElementById('count-docs').textContent = stats.totalDocuments;

    await renderChips();
    const clients = await applyFilters();
    renderClients(clients);
  }

  // ─── Chips filtre : un par statut + "Tous" ──────────────────────────────
  async function renderChips() {
    const counts = await RFStore.countByDossierStatus();
    const chipsWrap = document.getElementById('filter-chips');
    const total = counts._total || 0;
    let html = `<button class="chip ${currentFilter==='all'?'active':''}" data-st="all">
      Tous <span class="cnt">${total}</span>
    </button>`;
    RFStore.DOSSIER_STATUSES.forEach(s => {
      const n = counts[s.key] || 0;
      html += `<button class="chip ${currentFilter===s.key?'active':''}" data-st="${s.key}" title="${s.help}">
        <span class="chip-dot" style="background:${s.color}"></span>${s.label} <span class="cnt">${n}</span>
      </button>`;
    });
    chipsWrap.innerHTML = html;
    chipsWrap.querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', async () => {
        currentFilter = b.dataset.st;
        await renderChips();
        const clients = await applyFilters();
        renderClients(clients);
      });
    });
  }

  // ─── Combine filtre statut + recherche ──────────────────────────────────
  async function applyFilters() {
    const all = await RFStore.listClients();
    let filtered = all;
    if (currentFilter !== 'all') {
      filtered = filtered.filter(c => (c.dossierStatus || 'nouveau') === currentFilter);
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(c => {
        const blob = [c.email, c.firstname, c.lastname, c.address || '', c.logement && c.logement.type || ''].join(' ').toLowerCase();
        return blob.includes(q);
      });
    }
    return filtered;
  }

  function dossierBadge(c) {
    const m = RFStore.getStatusMeta(c.dossierStatus || 'nouveau');
    return `<span class="dossier-badge" style="background:${m.bg};color:${m.color}">${m.label}</span>`;
  }

  function renderClients(clients) {
    const tbody = document.getElementById('clients-tbody');
    if (!clients.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <div>${currentFilter==='all' && !currentSearch ? "Aucun client pour l'instant. Vos clients apparaîtront ici à mesure qu'ils s'inscrivent." : 'Aucun client ne correspond à ces critères.'}</div>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = clients.map(c => `
      <tr data-id="${c.id}">
        <td>
          <div class="client-nm">${fullname(c)}</div>
          <div class="client-em">${c.email}</div>
        </td>
        <td>${c.logement ? [(c.logement.type), (c.logement.surface && c.logement.surface+' m²'), (c.logement.year)].filter(Boolean).join(' · ') : '—'}</td>
        <td><b>${fmtEUR(c.aids && c.aids.totalAides)}</b></td>
        <td>${dossierBadge(c)}</td>
        <td>${fmtDate(c.createdAt)}</td>
      </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => openClient(tr.dataset.id));
    });
  }

  document.getElementById('search').addEventListener('input', async (e) => {
    currentSearch = e.target.value.trim();
    const clients = await applyFilters();
    renderClients(clients);
  });

  // ─── Drawer détail client ───────────────────────────────────────────────
  async function openClient(id) {
    const c = await RFStore.getClient(id);
    if (!c) return;
    const docs = await RFStore.listDocuments(id);
    document.getElementById('d-title').textContent = fullname(c);
    document.getElementById('d-body').innerHTML = `
      <div class="drawer-section">
        <h3>Identité &amp; dossier</h3>
        <div class="info-row"><span class="k">Email</span><span class="v">${c.email}</span></div>
        <div class="info-row"><span class="k">Statut compte</span><span class="v"><span class="pill ${c.status||'actif'}">${c.status === 'churn' ? 'Inactif' : 'Actif'}</span></span></div>
        <div class="info-row"><span class="k">Statut dossier</span><span class="v">${dossierBadge(c)}</span></div>
        <div class="info-row"><span class="k">Inscrit le</span><span class="v">${fmtDate(c.createdAt)}</span></div>
      </div>

      <div class="drawer-section">
        <h3>Cycle de vie du dossier</h3>
        <div class="status-changer">
          <h4>Changer le statut</h4>
          <div class="opts">
            ${RFStore.DOSSIER_STATUSES.map(s => `
              <button type="button" data-set-status="${s.key}" class="${(c.dossierStatus||'nouveau')===s.key?'curr':''}" title="${s.help}">
                <span class="chip-dot" style="background:${s.color};margin-right:6px"></span>${s.label}
              </button>
            `).join('')}
          </div>
          <textarea class="note-input" id="status-note" placeholder="Note (facultative) — visible dans la timeline. Ex : « Avis d'imposition reçu, dossier prêt à déposer. »"></textarea>
        </div>
        <h4 style="font:600 17px var(--font-sans);color:var(--slate-700);margin:14px 0 8px">Historique</h4>
        <ul class="timeline">
          ${(c.dossierStatusHistory || []).map((h, i) => {
            const meta = RFStore.getStatusMeta(h.to);
            const fromMeta = h.from ? RFStore.getStatusMeta(h.from) : null;
            return `<li class="${i===0?'curr':''}">
              <div class="tl-line"><span class="dossier-badge" style="background:${meta.bg};color:${meta.color}">${meta.label}</span>${fromMeta ? ' <span style="color:var(--slate-400)">depuis</span> ' + fromMeta.label : ''}</div>
              <div class="tl-meta">${fmtDate(h.at)} · par ${h.by}</div>
              ${h.note ? `<div class="tl-note">${h.note}</div>` : ''}
            </li>`;
          }).join('') || '<li class="tl-meta">Aucun historique.</li>'}
        </ul>
      </div>
      <div class="drawer-section">
        <h3>Projet de rénovation</h3>
        <div class="info-row"><span class="k">Adresse</span><span class="v">${c.address || '—'}</span></div>
        <div class="info-row"><span class="k">Logement</span><span class="v">${c.logement ? [(c.logement.type), (c.logement.surface && c.logement.surface+' m²'), (c.logement.year && 'année '+c.logement.year)].filter(Boolean).join(' · ') : '—'}</span></div>
        <div class="info-row"><span class="k">Énergie</span><span class="v">${c.logement && c.logement.heat || '—'}</span></div>
        <div class="info-row"><span class="k">RFR</span><span class="v">${fmtEUR(c.foyer && c.foyer.rfr)}</span></div>
        <div class="info-row"><span class="k">Aides estimées</span><span class="v"><b>${fmtEUR(c.aids && c.aids.totalAides)}</b></span></div>
      </div>
      <div class="drawer-section">
        <h3>Documents du dossier (${docs.length})</h3>
        <div class="doc-list">
          ${docs.length ? docs.map(d => `
            <div class="doc-card">
              <div class="ic ${d.statut === 'valide' || d.statut === 'signe' ? 'uploaded' : ''}">${d.type === 'piece' ? 'PJ' : 'DOC'}</div>
              <div class="nm">${d.nom}</div>
              <span class="pill pill-mini ${d.statut === 'valide' ? 'actif' : d.statut === 'a_fournir' ? 'essentiel' : 'essai'}">${d.statut === 'valide' ? 'Validé' : d.statut === 'a_fournir' ? 'À fournir' : d.statut === 'pret' ? 'Prêt' : d.statut === 'signe' ? 'Signé' : d.statut}</span>
            </div>
          `).join('') : '<div style="color:var(--slate-500);font-size:17px">Aucun document encore.</div>'}
        </div>
        <div style="margin-top:14px">
          <label class="upload-zone" for="upload-doc">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-4px;margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
            Uploader un dossier généré pour ce client
          </label>
          <input type="file" id="upload-doc" hidden accept=".pdf,.jpg,.png" />
        </div>
      </div>
      <div class="drawer-section">
        <button class="btn btn-danger" id="btn-delete">Supprimer ce client</button>
      </div>
    `;
    openDrawer();
    document.getElementById('upload-doc').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      await RFStore.saveDocument({
        clientId: id, type: 'dossier', code: 'custom',
        nom: f.name, statut: 'pret',
        metadata: { size: f.size, mime: f.type, fakeStorage: 'demo (localStorage)' }
      });
      toast(`« ${f.name} » uploadé dans le compte de ${fullname(c)}.`);
      openClient(id); // recharge
      loadDashboard();
    });
    document.getElementById('btn-delete').addEventListener('click', async () => {
      if (!confirm(`Supprimer définitivement le compte de ${fullname(c)} et tous ses documents ?`)) return;
      await RFStore.deleteClient(id);
      closeDrawer(); loadDashboard();
      toast(`Compte de ${fullname(c)} supprimé.`);
    });

    // ─── Changement de statut du dossier ──────────────────────────────────
    document.querySelectorAll('#d-body [data-set-status]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.setStatus;
        const cur = c.dossierStatus || 'nouveau';
        if (newStatus === cur) return;
        const note = (document.getElementById('status-note').value || '').trim() || null;
        try {
          await RFStore.updateDossierStatus(id, newStatus, note);
          const meta = RFStore.getStatusMeta(newStatus);
          toast(`Statut → « ${meta.label} »`);
          openClient(id);       // recharge le drawer
          await renderChips();  // recharge les compteurs
          const list = await applyFilters();
          renderClients(list);  // recharge la table
        } catch(err){
          toast('Erreur : ' + err.message);
        }
      });
    });
  }

  function openDrawer(){
    document.getElementById('overlay').classList.add('open');
    document.getElementById('drawer').classList.add('open');
  }
  function closeDrawer(){
    document.getElementById('overlay').classList.remove('open');
    document.getElementById('drawer').classList.remove('open');
  }
  document.getElementById('d-close').addEventListener('click', closeDrawer);
  document.getElementById('overlay').addEventListener('click', closeDrawer);

  // ─── Vue docs en attente ────────────────────────────────────────────────
  async function loadDocsWaiting() {
    const docs = (await RFStore.listDocuments()).filter(d => d.statut === 'a_fournir' || d.statut === 'en_cours');
    const wrap = document.getElementById('docs-list-wrap');
    if (!docs.length) {
      wrap.innerHTML = `<div class="empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
        <div>Aucun document en attente. Tout est traité !</div>
      </div>`;
      return;
    }
    const clients = await RFStore.listClients();
    wrap.innerHTML = '<table><thead><tr><th>Client</th><th>Document</th><th>Statut</th><th>Reçu le</th></tr></thead><tbody>' +
      docs.map(d => {
        const c = clients.find(x => x.id === d.clientId);
        return `<tr><td>${c ? fullname(c) : '—'}</td><td>${d.nom}</td><td><span class="pill ${d.statut==='valide'?'actif':'essai'}">${d.statut}</span></td><td>${fmtDate(d.createdAt)}</td></tr>`;
      }).join('') + '</tbody></table>';
  }

  // ─── Vue audit ──────────────────────────────────────────────────────────
  async function loadAudit() {
    const log = await RFStore.getAuditLog(50);
    const tbody = document.getElementById('audit-tbody');
    if (!log.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">Aucune action enregistrée pour l\'instant.</td></tr>';
      return;
    }
    tbody.innerHTML = log.map(e => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:17px">${new Date(e.timestamp).toLocaleString('fr-FR')}</td>
        <td>${e.admin}</td>
        <td>${e.action}</td>
        <td style="font-family:var(--font-mono);font-size:17px;color:var(--slate-500)">${JSON.stringify(e.details)}</td>
      </tr>
    `).join('');
  }

  // Aucun appel de boot : loadDashboard() n'est déclenché qu'après
  // authentification effective, plus haut dans ce script.
