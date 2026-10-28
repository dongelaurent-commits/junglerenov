
  // ─── Auth check inline ──────────────────────────────────────────────────
  function setupSuperUI(){
    const me = RFStore.getCurrentUser();
    document.getElementById('me-name').textContent = me ? me.email.split('@')[0] : '';
    document.getElementById('me-av').textContent = (me && me.email[0] || 'S').toUpperCase();
    document.getElementById('auth-wall').classList.remove('show');
  }
  function showAuthWall(){
    document.getElementById('auth-wall').classList.add('show');
    setTimeout(() => document.getElementById('auth-email').focus(), 80);
  }

  /* Le chargement des données est SUBORDONNÉ à l'authentification : rien
     n'est injecté dans la page tant que la session super-admin n'est pas
     établie. Un calque CSS n'est pas un contrôle d'accès — tant qu'il n'y a
     pas de vérification côté serveur, ces consoles sont retirées du
     déploiement (voir la règle 404 de vercel.json). */
  if (RFStore.isSuperAdmin()) {
    setupSuperUI();
    loadOverview();
  } else {
    showAuthWall();
  }

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-err');
    errEl.classList.remove('show');
    try {
      const email = document.getElementById('auth-email').value.trim();
      const pw    = document.getElementById('auth-pw').value;
      const { role } = await RFStore.login(email, pw);
      if (role === 'super_admin') {
        setupSuperUI();
        // recharge la vue active si besoin
        loadOverview && loadOverview();
      } else {
        errEl.textContent = "Accès super-admin requis pour cet espace.";
        errEl.classList.add('show');
        RFStore.logout();
      }
    } catch(err){
      errEl.textContent = err.message || 'Connexion impossible.';
      errEl.classList.add('show');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', e => {
    e.preventDefault();
    RFStore.logout();
    showAuthWall();
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-pw').value = '';
  });

  // ─── Nav ────────────────────────────────────────────────────────────────
  document.querySelectorAll('.nav a[data-view]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const v = a.dataset.view;
      document.querySelectorAll('.nav a[data-view]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      ['overview','admins','settings','partenaires','waitlist','audit'].forEach(x => document.getElementById('view-'+x).hidden = x !== v);
      if (v === 'admins') loadAdmins();
      if (v === 'audit') loadAudit();
      if (v === 'partenaires') loadPartenaires();
    });
  });

  /* Badge « Partenaires » : dossiers transmis ce mois, à refacturer. */
  function refreshPartenairesBadge(){
    try {
      const badge = document.getElementById('cancel-badge');
      if (!badge) return;
      const now = new Date();
      const n = (window.RFDossiers ? RFDossiers.getAll() : []).filter(d => {
        if (!d.transmisLe) return false;
        const t = new Date(d.transmisLe);
        return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
      }).length;
      badge.textContent = n;
      badge.style.display = n > 0 ? 'inline-block' : 'none';
    } catch(e){ console.warn('Badge partenaires :', e); }
  }
  refreshPartenairesBadge();

  function toast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2400); }
  function fmtEUR(n){ if (!n || isNaN(n)) return '—'; return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'; }
  function fmtDate(d){ if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric'}); }

  // ─── Overview ───────────────────────────────────────────────────────────
  async function loadOverview() {
    const stats = await RFStore.getStats();
    const admins = await RFStore.listAdmins();
    document.getElementById('kpi-mrr').textContent = fmtEUR(stats.revenuHT);
    document.getElementById('kpi-actifs').textContent = stats.activeClients;
    document.getElementById('kpi-actifs-d').textContent = `${stats.dossiersTransmis} dossier${stats.dossiersTransmis > 1 ? 's' : ''} transmis`;
    document.getElementById('kpi-aides').textContent = fmtEUR(stats.totalAides);
    document.getElementById('kpi-admins').textContent = admins.length;

    const clients = await RFStore.listClients();
    // La répartition utile est celle des statuts de compte.
    const LIB_STATUT = { actif: 'Dossiers actifs', churn: 'Inactifs' };
    const buckets = {};
    clients.forEach(c => {
      const k = c.status || 'actif';
      buckets[k] = (buckets[k] || 0) + 1;
    });
    document.getElementById('tier-breakdown').innerHTML = Object.entries(buckets).map(([t, n]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-weight:500">${LIB_STATUT[t] || t}</div>
        <div style="font:600 18px var(--font-sans);color:var(--slate-900)">${n} <span style="font-size:17px;color:var(--slate-500);font-weight:400">client${n>1?'s':''}</span></div>
      </div>
    `).join('') || '<div style="color:var(--slate-500)">Aucun client pour l\'instant.</div>';

    const log = await RFStore.getAuditLog(5);
    document.getElementById('last-actions').innerHTML = log.length ? log.map(e => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-weight:500;color:var(--slate-900)">${e.action}</div>
        <div style="font-size:17px;color:var(--slate-500);margin-top:2px">${e.admin} · ${new Date(e.timestamp).toLocaleString('fr-FR')}</div>
      </div>
    `).join('') : 'Aucune action enregistrée.';
  }

  // ─── Admins ─────────────────────────────────────────────────────────────
  async function loadAdmins() {
    const admins = await RFStore.listAdmins();
    document.getElementById('admins-tbody').innerHTML = admins.map(a => `
      <tr>
        <td><b>${a.email}</b></td>
        <td><span class="pill ${a.role === 'super_admin' ? 'super' : 'admin'}">${a.role === 'super_admin' ? 'Super admin' : 'Admin'}</span></td>
        <td>${a.email === me.email ? '<span style="color:var(--slate-400);font-size:17px">(vous)</span>' : `<button class="btn btn-danger" data-del="${a.id}">Retirer</button>`}</td>
      </tr>
    `).join('');
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Retirer ce compte admin ?')) return;
      await RFStore.removeAdmin(b.dataset.del);
      toast('Admin retiré.');
      loadAdmins();
    }));
  }

  document.getElementById('btn-add-admin').addEventListener('click', () => document.getElementById('modal-bg').classList.add('open'));
  document.getElementById('modal-cancel').addEventListener('click', () => document.getElementById('modal-bg').classList.remove('open'));
  document.getElementById('modal-ok').addEventListener('click', async () => {
    const email = document.getElementById('new-admin-email').value.trim();
    const role  = document.getElementById('new-admin-role').value;
    if (!email) return;
    try {
      await RFStore.addAdmin(email, role);
      document.getElementById('modal-bg').classList.remove('open');
      document.getElementById('new-admin-email').value = '';
      toast(`Admin ${email} ajouté.`);
      loadAdmins();
    } catch(e) {
      alert(e.message);
    }
  });

  // ─── Settings ───────────────────────────────────────────────────────────
  document.querySelectorAll('.switch').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.classList.toggle('on');
      const enabled = sw.classList.contains('on');
      toast(`${sw.dataset.key} : ${enabled ? 'activé' : 'désactivé'}`);
      RFStore.logAction('toggle_setting', { key: sw.dataset.key, value: enabled });
    });
  });

  document.getElementById('btn-wipe').addEventListener('click', () => {
    if (!confirm('Confirmer la suppression de TOUTES les données de démo ? Cette action est IRRÉVERSIBLE.')) return;
    if (!confirm('Vraiment ? Tous les clients, documents et logs vont être effacés.')) return;
    ['junglerenov.clients','junglerenov.documents','junglerenov.audit_log','junglerenov.profile'].forEach(k => localStorage.removeItem(k));
    toast('Toutes les données démo ont été effacées.');
    setTimeout(()=>location.reload(), 1000);
  });

  /* ─── Partenaires : état mensuel ────────────────────────────────────────
     Le revenu de JungleRenov est une rémunération B2B, versée par le
     partenaire habilité qui reprend le dossier. Rien n'est encaissé auprès
     du particulier, ici ni ailleurs. */
  /* Source unique : _storage.js. Ne jamais redéclarer les montants ici. */
  const BAREME_HT = (window.RFStore && RFStore.REMUNERATION_HT) || { energetique: 290, autonomie: 190, indigne: 290 };
  const BAREME_A_CONFIRMER = (window.RFStore && RFStore.REMUNERATION_A_CONFIRMER) || [];
  const ROLE_PAR_TYPE = { energetique: 'MAR', autonomie: 'AMO', indigne: 'Opérateur agréé' };
  const VOLET = { energetique: 'Rénovation énergétique', autonomie: "Adaptation à l'autonomie", indigne: 'Habitat dégradé' };

  function dossiersTransmis(){
    try {
      return (window.RFDossiers ? RFDossiers.getAll() : []).filter(d => d.transmisLe);
    } catch (e) { return []; }
  }

  async function loadPartenaires(){
    const tous = dossiersTransmis();
    const now = new Date();
    const memeMois = d => {
      const t = new Date(d.transmisLe);
      return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
    };
    const duMois = tous.filter(memeMois);

    const parPartenaire = {};
    duMois.forEach(d => {
      const p = d.partenaire || {};
      const cle = p.nom || ('Non désigné · ' + (ROLE_PAR_TYPE[d.type] || '—'));
      if (!parPartenaire[cle]) parPartenaire[cle] = { nom: cle, role: p.role || ROLE_PAR_TYPE[d.type], dept: p.departement || '—', n: 0, ht: 0 };
      parPartenaire[cle].n += 1;
      parPartenaire[cle].ht += BAREME_HT[d.type] || BAREME_HT.energetique;
    });
    const lignes = Object.values(parPartenaire).sort((a, b) => b.ht - a.ht);
    const totalHT = lignes.reduce((s2, l) => s2 + l.ht, 0);

    document.getElementById('prt-total').textContent = tous.length;
    document.getElementById('prt-mois').textContent = duMois.length;
    document.getElementById('prt-mois-lbl').textContent = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    document.getElementById('prt-montant').textContent = fmtEUR(totalHT);
    document.getElementById('prt-nb').textContent = lignes.length;
    document.getElementById('cancel-badge').textContent = duMois.length;
    document.getElementById('cancel-badge').style.display = duMois.length ? '' : 'none';

    const tbody = document.getElementById('partenaires-tbody');
    tbody.innerHTML = lignes.length ? lignes.map(l => `
      <tr>
        <td><b>${l.nom}</b></td>
        <td>${l.role || '—'}</td>
        <td>${l.dept || '—'}</td>
        <td class="num">${l.n}</td>
        <td class="num"><b>${fmtEUR(l.ht)}</b></td>
      </tr>`).join('')
      : '<tr><td colspan="5" style="padding:48px;text-align:center;color:var(--slate-500)">Aucun dossier transmis ce mois-ci.</td></tr>';

    const detail = document.getElementById('partenaires-detail-tbody');
    const tri = tous.slice().sort((a, b) => new Date(b.transmisLe) - new Date(a.transmisLe));
    detail.innerHTML = tri.length ? tri.map(d => `
      <tr>
        <td style="font:400 17px var(--font-mono)">${d.id}</td>
        <td>${VOLET[d.type] || d.type}</td>
        <td>${(d.partenaire && d.partenaire.nom) || 'Désignation en cours'}</td>
        <td>${fmtDate(d.transmisLe)}</td>
        <td>${(window.RFTransmission && RFTransmission.libelleStatut(d.statutDossier)) || 'Transmis'}</td>
        <td class="num">${fmtEUR(BAREME_HT[d.type] || BAREME_HT.energetique)}${BAREME_A_CONFIRMER.indexOf(d.type) !== -1 ? ' <span title="Montant non arrêté" style="color:#123A2E">•</span>' : ''}</td>
      </tr>`).join('')
      : '<tr><td colspan="6" style="padding:48px;text-align:center;color:var(--slate-500)">Aucun dossier transmis.</td></tr>';
  }

  const prtExport = document.getElementById('prt-export');
  if (prtExport) prtExport.addEventListener('click', () => {
    const now = new Date();
    const lignes = dossiersTransmis().filter(d => {
      const t = new Date(d.transmisLe);
      return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
    });
    const csv = 'dossier;volet;partenaire;role;departement;transmis_le;montant_ht\n' + lignes.map(d => [
      d.id, VOLET[d.type] || d.type,
      (d.partenaire && d.partenaire.nom) || 'Non designe',
      (d.partenaire && d.partenaire.role) || ROLE_PAR_TYPE[d.type] || '',
      (d.partenaire && d.partenaire.departement) || '',
      d.transmisLe, BAREME_HT[d.type] || BAREME_HT.energetique,
    ].join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'junglerenov-partenaires-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (window.RFStore && RFStore.logAction) RFStore.logAction('export_partenaires', { mois: now.toISOString().slice(0, 7), lignes: lignes.length });
  });

  // ─── Audit ──────────────────────────────────────────────────────────────
  async function loadAudit() {
    const log = await RFStore.getAuditLog();
    document.getElementById('audit-tbody').innerHTML = log.length ? log.map(e => `
      <tr>
        <td style="font:500 17px var(--font-mono)">${new Date(e.timestamp).toLocaleString('fr-FR')}</td>
        <td>${e.admin}</td>
        <td><span style="font-weight:500">${e.action}</span></td>
        <td style="font:400 17px var(--font-mono);color:var(--slate-500)">${JSON.stringify(e.details)}</td>
      </tr>
    `).join('') : '<tr><td colspan="4" style="padding:48px;text-align:center;color:var(--slate-500)">Aucune action.</td></tr>';
  }

  // Aucun appel de boot : loadOverview() n'est déclenché qu'après
  // authentification effective, plus haut dans ce script.
