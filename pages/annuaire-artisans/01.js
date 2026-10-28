
  const KEY = 'junglerenov.profile';
  const ALT = 'junglerenov.profile';
  function getDossier(){
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || 'null');
      const b = JSON.parse(localStorage.getItem(ALT) || 'null');
      return a || b || null;
    } catch { return null; }
  }

  const WORK_LABELS = {
    combles:'Isolation combles', ite:'Isolation murs (ITE)', pac:'Pompe à chaleur',
    biomasse:'Chaudière biomasse', menuiseries:'Menuiseries', vmc:'VMC double flux',
    solaire:'Panneaux solaires', panneaux_solaires:'Panneaux solaires',
  };
  const CERTIFS = {
    combles:'Qualibat RGE (Isolation)', ite:'Qualibat RGE (Isolation thermique)',
    pac:'QualiPAC', biomasse:'Qualibois', menuiseries:'Qualibat RGE (Menuiseries)',
    vmc:'Qualibat RGE (Ventilation)', solaire:'QualiPV', panneaux_solaires:'QualiPV',
    // Codes canoniques du catalogue partagé (_travaux_catalog.js)
    toiture_terrasse:'Qualibat RGE (Isolation)', pac_aireau:'QualiPAC',
    pac_geothermique:'QualiForage / QualiPAC', chauffe_eau_thermo:'QualiPAC',
    chauffe_eau_solaire:'QualiSol', chauffage_solaire_combine:'QualiSol Combi',
    pvt_eau:'QualiPV', poele_granules:'Qualibois module Air', poele_buches:'Qualibois module Air',
    insert_foyer:'Qualibois module Air', raccordement_reseau:'Qualibat RGE (Réseaux de chaleur)',
    vmc_df:'Qualibat RGE (Ventilation)', audit_energetique:'RGE Étude (audit énergétique)',
    depose_cuve_fioul:'Qualibat RGE (Chauffage)',
  };
  const WORK_CODES = {
    combles:'isolation-combles', ite:'isolation-murs', pac:'pompe-chaleur',
    biomasse:'chaudiere-biomasse', menuiseries:'menuiseries', vmc:'vmc',
    solaire:'photovoltaique', panneaux_solaires:'photovoltaique',
  };

  // Populate departments
  const DEPS = [];
  for (let i = 1; i <= 95; i++){
    if (i === 20) { DEPS.push(['2A','Corse-du-Sud']); DEPS.push(['2B','Haute-Corse']); continue; }
    DEPS.push([String(i).padStart(2,'0'), '']);
  }
  ['971','972','973','974','976'].forEach(c => DEPS.push([c, 'DROM']));
  const depSel = document.getElementById('dep');
  DEPS.forEach(([code, label]) => {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = code + (label ? ' — ' + label : '');
    depSel.appendChild(o);
  });

  // Slider
  const dist = document.getElementById('dist');
  dist.addEventListener('input', () => document.getElementById('dist-val').textContent = dist.value + ' km');

  function extractPostcode(addr){
    if (!addr) return null;
    const m = addr.match(/\b(\d{5})\b/);
    return m ? m[1] : null;
  }
  function extractCity(addr){
    if (!addr) return null;
    const m = addr.match(/\d{5}\s+([^,]+)$/) || addr.match(/\d{5}\s+(.+)/);
    return m ? m[1].trim() : null;
  }

  function bind(){
    const d = getDossier();
    const works = (d && (d.travaux || (d.diagnostic && d.diagnostic.travaux))) || [];
    const addr = (d && (d.address || (d.diagnostic && d.diagnostic.address))) || '';
    const cp = extractPostcode(addr);
    const city = extractCity(addr);

    // Pre-check filter checkboxes from dossier
    works.forEach(w => {
      const cb = document.querySelector(`.checkbox input[value="${w}"]`);
      if (cb) cb.checked = true;
    });
    // Pre-select département
    if (cp) depSel.value = cp.slice(0,2);

    refresh();
  }

  window.RFAnnuaireRefresh = function(){ refresh(); };
  function refresh(){
    const checked = [...document.querySelectorAll('.checkbox input:checked')].map(c => c.value);
    updateFilterCount();
    const certifsBox = document.getElementById('certifs');
    if (!certifsBox) return;
    certifsBox.innerHTML = '';
    const seen = new Set();
    checked.forEach(w => {
      const cert = CERTIFS[w];
      if (cert && !seen.has(cert)){
        seen.add(cert);
        const t = document.createElement('span');
        t.className = 'tag';
        t.textContent = cert;
        certifsBox.appendChild(t);
      }
    });
    if (!checked.length){
      const t = document.createElement('span');
      t.className = 'tag';
      t.style.opacity = .6;
      t.textContent = 'sélectionnez vos travaux';
      certifsBox.appendChild(t);
    }

    // Location label
    const d = getDossier();
    const addr = (d && (d.address || (d.diagnostic && d.diagnostic.address))) || '';
    const cp = extractPostcode(addr);
    const city = extractCity(addr);
    const dep = depSel.value;
    let locLabel;
    if (cp && city) locLabel = `${cp} ${city}`;
    else if (dep) locLabel = `département ${dep}`;
    else locLabel = 'code postal à renseigner';
    const ll = document.getElementById('loc-label'); if (ll) ll.textContent = locLabel;

  }

  /* ───── Favoris : artisans ajoutés au dossier (persistance localStorage) ───── */
  function getFavorites(){
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Array.isArray(p.artisans_favoris) ? p.artisans_favoris : [];
    } catch { return []; }
  }
  function saveFavorites(list){
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      p.artisans_favoris = list;
      p.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch(e){ console.warn('saveFavorites :', e); }
  }
  function isFavorite(siret){
    return getFavorites().some(f => f.siret === siret);
  }
  function addFavorite(art){
    const favs = getFavorites();
    if (favs.some(f => f.siret === art.siret)) return;
    favs.push(art);
    saveFavorites(favs);
    renderFavorites();
  }
  function removeFavorite(siret){
    saveFavorites(getFavorites().filter(f => f.siret !== siret));
    renderFavorites();
    // Re-rend les cartes recherche pour mettre à jour leur badge
    const grid = document.getElementById('artisans-list');
    if (grid && grid.children.length) {
      grid.querySelectorAll('.btn-fav[data-siret="'+siret+'"]').forEach(b => {
        b.classList.remove('added');
        b.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Ajouter au dossier';
      });
      grid.querySelectorAll('.artisan-card[data-siret="'+siret+'"]').forEach(c => c.classList.remove('fav'));
    }
  }
  function renderFavorites(){
    const favs = getFavorites();
    const section = document.getElementById('favs-section');
    const list    = document.getElementById('favs-list');
    const count   = document.getElementById('favs-count');
    if (!favs.length){
      section.hidden = true;
      return;
    }
    section.hidden = false;
    count.textContent = favs.length;
    list.innerHTML = favs.map(a => {
      const tel = a.telephone || '';
      const site = a.site_internet || '';
      const telLink = tel ? '<a href="tel:' + tel.replace(/[^\d+]/g,'') + '">📞 ' + escapeHtml(tel) + '</a>' : '';
      let siteUrl = site;
      if (siteUrl && !/^https?:\/\//.test(siteUrl)) siteUrl = 'https://' + siteUrl;
      const siteLink = site ? '<a href="' + escapeAttr(siteUrl) + '" target="_blank" rel="noopener">Site ↗</a>' : '';
      return '<div class="fav-row">' +
        '<div>' +
          '<div class="fav-name">' + escapeHtml(a.nom_entreprise || '—') + '</div>' +
          '<div class="fav-meta">' + escapeHtml((a.commune || '') + ' · ' + (a.code_postal || '')) + '</div>' +
        '</div>' +
        '<div class="fav-actions">' + telLink + siteLink +
          '<button class="fav-remove" data-remove="' + escapeAttr(a.siret) + '" title="Retirer du dossier" aria-label="Retirer">×</button>' +
        '</div>' +
      '</div>';
    }).join('');
    list.querySelectorAll('[data-remove]').forEach(b => {
      b.addEventListener('click', () => removeFavorite(b.dataset.remove));
    });
  }
  document.getElementById('favs-clear').addEventListener('click', () => {
    if (!confirm('Retirer tous les artisans de votre dossier ?')) return;
    saveFavorites([]);
    renderFavorites();
    // Reset badges
    document.querySelectorAll('.btn-fav.added').forEach(b => {
      b.classList.remove('added');
      b.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Ajouter au dossier';
    });
    document.querySelectorAll('.artisan-card.fav').forEach(c => c.classList.remove('fav'));
  });
  renderFavorites(); // au chargement de la page

  /* Affiche la note MAR si le projet est une rénovation d'ampleur */
  (function showMarNoticeIfNeeded(){
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      const notice = document.getElementById('mar-notice');
      if (notice && p.aids && p.aids.mpr && p.aids.mpr.isRenovAmpleur){
        notice.hidden = false;
      }
    } catch(e){ console.warn('MAR notice :', e); }
  })();

  /* Mapping geste tunnel → fragments de mots-clés à matcher dans le champ
     `domaine` de l'API ADEME (valeurs réellement présentes en base).
     Un artisan est retenu pour un geste si AU MOINS UN de ses `domaines`
     contient AU MOINS UN fragment (insensible à la casse, sous-chaîne). */
  const DOMAINE_KEYWORDS = {
    combles:            ['isolation des combles', 'isolation par soufflage', 'toitures terrasses'],
    ite:                ["isolation des murs par l'extérieur", "isolation par l'extérieur", "isolation thermique par l'extérieur", "ite"],
    iti:                ['isolation par l’intérieur des murs', "isolation par l'intérieur des murs"],
    planchers_bas:      ['isolation des planchers bas', 'plancher bas'],
    menuiseries:        ['fenêtres', 'porte d’entrée', "porte d'entrée", 'porte-fenêtre', 'menuiseries extérieures'],
    pac_aireau:         ['pompe à chaleur', 'pac air/eau', 'pac aérothermique'],
    pac_eaueau:         ['pompe à chaleur', 'pac eau/eau', 'géothermie'],
    chaudiere_bois:     ['chaudière bois', 'chaudière à granulés', 'chaudière biomasse'],
    poele_bois:         ['poêle', 'insert', 'foyer fermé', 'appareil indépendant de chauffage au bois'],
    solaire_thermique:  ['eau chaude solaire', 'chauffe-eau solaire', 'système solaire combiné', 'solaire thermique'],
    solaire_pv:         ['photovoltaïque', 'panneau solaire photovoltaïque'],
    ventilation:        ['ventilation mécanique', 'vmc', 'vmc double flux'],
    chaudiere_gaz:      ['chaudière condensation', 'chaudière gaz', 'chaudière micro-cogénération'],
    chauffe_eau_thermo: ['chauffe-eau thermodynamique', 'ballon thermodynamique'],
    audit:              ['audit énergétique'],
    raccordement_reseau:['réseau de chaleur', 'sous-station'],
    depose_cuve_fioul:  ['dépose de cuve', 'cuve à fioul'],
  };

  /* Alias : valeurs des cases de la page + codes gestes du tunnel de diagnostic
     → clés canoniques de DOMAINE_KEYWORDS ci-dessus. */
  const GESTE_ALIAS = {
    pac: 'pac_aireau', pac_geothermique: 'pac_eaueau', biomasse: 'chaudiere_bois',
    vmc: 'ventilation', vmc_df: 'ventilation', solaire: 'solaire_pv',
    chauffe_eau_solaire: 'solaire_thermique', chauffage_solaire_combine: 'solaire_thermique',
    pvt_eau: 'solaire_pv', poele_buches: 'poele_bois', poele_granules: 'poele_bois',
    insert_foyer: 'poele_bois', plancher_bas: 'planchers_bas',
    sarking: 'combles', toiture_terrasse: 'combles', audit_energetique: 'audit',
  };
  function gesteKey(g){ return GESTE_ALIAS[g] || g; }

  /* Regex non-poseur (ceinture + bretelles, en plus du NOT organisme côté API).
     Note : l'ADEME utilise l'apostrophe typographique `´` dans « Tableau de l´Ordre ». */
  const NON_POSEUR = /tableau de l['’´]ordre|architecte|opqibi|bureau d['’]études|ing[ée]nierie/i;

  function artisanMatchesGeste(artisan, geste){
    const fragments = DOMAINE_KEYWORDS[gesteKey(geste)] || [];
    if (!fragments.length) return false;
    const doms = (artisan.domaines || []).map(d => (d || '').toLowerCase());
    return fragments.some(f => {
      const lf = f.toLowerCase();
      return doms.some(d => d.indexOf(lf) !== -1);
    });
  }

  /* Adresse client — priorité à l'input de la page, sinon dossier tunnel */
  function getClientAddrValue(){
    const el = document.getElementById('client-addr');
    const v = (el && el.value || '').trim();
    if (v) return v;
    const d = getDossier();
    return (((d && (d.address || (d.diagnostic && d.diagnostic.address))) || '')).trim();
  }

  /* Géocode l'adresse client via BAN (retourne {lat, lon} ou null).
     Cache mémoire indexé sur la valeur d'adresse. */
  let _coordsCache = null;
  let _coordsCacheKey = null;
  async function geocodeClientAddr(){
    const addr = getClientAddrValue();
    if (!addr){ _coordsCache = false; _coordsCacheKey = null; return null; }
    if (_coordsCacheKey === addr && _coordsCache !== null) return _coordsCache || null;
    _coordsCacheKey = addr;
    try {
      const url = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(addr) + '&limit=1';
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      const f = (json.features || [])[0];
      if (!f || !f.geometry || !f.geometry.coordinates){ _coordsCache = false; return null; }
      const [lon, lat] = f.geometry.coordinates;
      _coordsCache = { lat, lon };
      return _coordsCache;
    } catch(e){
      console.warn('[JungleRenov] Geocode BAN client :', e);
      _coordsCache = false;
      return null;
    }
  }

  /* Distance Haversine entre 2 points (en km) — pour tri/filtre côté client */
  function haversine(lat1, lon1, lat2, lon2){
    const R = 6371; // rayon Terre en km
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  /* Récupère jusqu'à 500 artisans RGE du département, en excluant côté API les
     architectes (cnoa) et, sauf recherche d'audit, les bureaux d'études (opqibi).
     Déduplique par SIRET : un artisan a une ligne ADEME par domaine/qualification. */
  async function fetchArtisansDept(dept, opts){
    opts = opts || {};
    const notOrganisme = opts.includeAudit
      ? 'NOT organisme:cnoa'
      : 'NOT organisme:cnoa AND NOT organisme:opqibi';
    const qs = 'code_postal:' + dept + '* AND ' + notOrganisme;
    const url = 'https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines'
              + '?size=500&qs=' + encodeURIComponent(qs);
    let raw;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('ADEME ' + r.status);
      raw = await r.json();
    } catch(e){
      console.error('[JungleRenov] fetch ADEME KO', e);
      return null;
    }
    const rows = Array.isArray(raw.results) ? raw.results : (raw.lines || []);
    console.info('[JungleRenov] ADEME dept ' + dept + ' — ' + rows.length + ' lignes brutes');

    const bySiret = new Map();
    for (const row of rows){
      if (NON_POSEUR.test(row.nom_certificat || '')) continue;
      if (NON_POSEUR.test(row.domaine || '')) continue;
      const key = row.siret || (row.nom_entreprise + '|' + row.code_postal);
      let a = bySiret.get(key);
      if (!a){
        a = {
          siret: row.siret, nom_entreprise: row.nom_entreprise, adresse: row.adresse,
          code_postal: row.code_postal, commune: row.commune, telephone: row.telephone,
          email: row.email, site_internet: row.site_internet,
          latitude:  (typeof row.latitude  === 'number') ? row.latitude  : null,
          longitude: (typeof row.longitude === 'number') ? row.longitude : null,
          organisme: row.organisme, nom_certificat: row.nom_certificat,
          domaines: [], qualifications: [],
        };
        if ((a.latitude === null || a.longitude === null) && typeof row._geopoint === 'string'){
          const parts = row._geopoint.split(',');
          if (parts.length === 2){
            const lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
            if (isFinite(lat) && isFinite(lon)){ a.latitude = lat; a.longitude = lon; }
          }
        }
        bySiret.set(key, a);
      }
      if (row.domaine && a.domaines.indexOf(row.domaine) === -1) a.domaines.push(row.domaine);
      if (row.nom_qualification && a.qualifications.indexOf(row.nom_qualification) === -1){
        a.qualifications.push(row.nom_qualification);
      }
    }
    return Array.from(bySiret.values());
  }

  /* Distances : les coordonnées sont déjà dans les données ADEME. */
  function attachDistances(artisans, clientCoords){
    if (!clientCoords || typeof clientCoords.lat !== 'number' || typeof clientCoords.lon !== 'number'){
      return artisans.map(a => Object.assign({}, a, { _dist: null }));
    }
    return artisans.map(a => {
      let d = null;
      if (typeof a.latitude === 'number' && typeof a.longitude === 'number'){
        d = haversine(clientCoords.lat, clientCoords.lon, a.latitude, a.longitude);
      }
      return Object.assign({}, a, { _dist: d });
    });
  }

  /* On conserve les artisans sans coordonnées connues — le tri les met en fin. */
  function filterByRadius(artisans, radiusKm){
    if (!radiusKm || radiusKm <= 0) return artisans;
    return artisans.filter(a => a._dist == null || a._dist <= radiusKm);
  }

  function sortByDistance(artisans){
    return artisans.slice().sort((x, y) => {
      if (x._dist == null && y._dist == null) return 0;
      if (x._dist == null) return 1;
      if (y._dist == null) return -1;
      return x._dist - y._dist;
    });
  }

  /* Orchestration : une requête ADEME par département, puis filtrage client
     par mots-clés `domaine`, distance et tri. */
  async function fetchArtisansRge(){
    const dep = depSel.value;
    const km = parseInt(dist.value, 10) || 30;
    const checked = [...document.querySelectorAll('.checkbox input:checked')].map(c => c.value);
    const results = document.getElementById('artisans-results');
    const list    = document.getElementById('artisans-list');
    results.hidden = false;
    setHead(null);
    list.innerHTML = skeleton();

    if (!dep){
      list.innerHTML = emptyState('Choisissez un département', 'Indiquez votre point de départ ou un département pour lancer la recherche.', false);
      return;
    }

    const gestes = checked.map(gesteKey);
    const includeAudit = gestes.indexOf('audit') !== -1;
    const artisans = await fetchArtisansDept(dep, { includeAudit });

    if (artisans === null){
      list.innerHTML = emptyState('Base ADEME indisponible', 'La base officielle ne répond pas pour le moment. Réessayez dans un instant.', false);
      return;
    }
    if (!artisans.length){
      setHead(0, km);
      list.innerHTML = emptyState('Aucun artisan dans ce département', 'Aucun artisan RGE recensé dans le département ' + dep + '. Essayez un département voisin.', false);
      return;
    }

    // Filtrage par gestes cochés (aucun coché → tout le département)
    let filtered = gestes.length
      ? artisans.filter(a => gestes.some(g => artisanMatchesGeste(a, g)))
      : artisans;

    if (!filtered.length){
      setHead(0, km);
      list.innerHTML = EMPTY_RAYON(km);
      return;
    }

    // Distance depuis le point de départ client
    const coords = await geocodeClientAddr();
    filtered = attachDistances(filtered, coords);
    const avantRayon = filtered.length;
    filtered = sortByDistance(filterByRadius(filtered, coords ? km : 0));
    if (coords) console.info('[JungleRenov] Après filtre distance ' + km + 'km : ' + filtered.length + '/' + avantRayon);

    if (!filtered.length){
      setHead(0, km);
      list.innerHTML = EMPTY_RAYON(km);
      return;
    }

    const sansCoords = filtered.filter(a => a._dist == null).length;
    const notice = !coords
      ? '<div class="artisan-notice">Renseignez votre point de départ pour trier les artisans par proximité.</div>'
      : (sansCoords > 0
          ? '<div class="artisan-notice">Distance non calculée pour ' + sansCoords + ' artisan(s) — affichés en fin de liste.</div>'
          : '');
    setHead(filtered.length, km);
    renderArtisans(list, filtered, notice);
  }

  /* ── Recherche explicite : bouton, état « filtres modifiés », ligne de résultat ── */
  const TRAV = id => (window.RFTravauxCatalog && RFTravauxCatalog.label) ? RFTravauxCatalog.label(id) : (WORK_LABELS[id] || id);
  function checkedWorks(){ return [...document.querySelectorAll('#types-travaux .checkbox input:checked, .checkbox input:checked')].map(c => c.value).filter((v, i, a) => a.indexOf(v) === i); }
  function locText(){
    const addr = getClientAddrValue(); const cp = extractPostcode(addr); const city = extractCity(addr);
    if (cp) return cp + (city ? ' ' + city : '');
    return depSel.value ? 'département ' + depSel.value : 'votre secteur';
  }
  function setHead(count, km){
    const head = document.getElementById('res-head'); if (!head) return;
    if (count == null){ head.hidden = true; return; }
    const works = checkedWorks();
    const n = works.length;
    document.getElementById('res-line').innerHTML = '<b>' + count + '</b>' + (count > 1 ? 'artisans RGE' : 'artisan RGE')
      + ' · autour de ' + escapeHtml(locText()) + ' · ' + km + ' km · ' + n + ' type' + (n > 1 ? 's' : '') + ' de travaux';
    const certs = []; works.forEach(w => { const c = CERTIFS[w]; if (c && certs.indexOf(c) === -1) certs.push(c); });
    document.getElementById('res-crit').innerHTML = (n ? '<b>Travaux&#8239;:</b> ' + works.map(w => escapeHtml(TRAV(w))).join(', ') : '<b>Travaux&#8239;:</b> tous')
      + (certs.length ? ' · <b>Qualifications&#8239;:</b> ' + certs.map(escapeHtml).join(', ') : '');
    head.hidden = false;
  }
  function skeleton(){
    const card = '<div class="sk-card" aria-hidden="true"><div class="sk-bar" style="width:45%"></div><div class="sk-bar" style="width:70%"></div><div class="sk-bar" style="width:30%"></div></div>';
    return '<div role="status"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Recherche en cours dans la base ADEME</span>' + card + card + card + '</div>';
  }
  function emptyState(title, text, widen){
    return '<div class="empty-state"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(text) + '</p>'
      + (widen ? '<button type="button" class="btn btn-secondary" data-widen="">Élargir à 100 km</button>' : '') + '</div>';
  }
  const EMPTY_RAYON = km => emptyState('Aucun artisan dans ce rayon', 'Élargissez la distance ou retirez un type de travaux.', km < 100);
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-widen]')) return;
    dist.value = 100; document.getElementById('dist-val').textContent = '100 km';
    runSearch();
  });

  let dirty = false, snap = null;
  function setDirty(v){
    dirty = v;
    document.getElementById('btn-search-label').textContent = v ? 'Rechercher · filtres modifiés' : 'Rechercher';
    document.getElementById('dirty-dot').hidden = !v;
    document.getElementById('res-notice').hidden = !v;
  }
  function updateFilterCount(){
    const el = document.getElementById('filters-count'); if (!el) return;
    el.textContent = [getClientAddrValue(), checkedWorks().length, depSel.value, dist.value].filter(Boolean).length;
  }
  function takeSnap(){
    if (snap) return;
    snap = { addr: (document.getElementById('client-addr') || {}).value || '', dep: depSel.value, dist: dist.value, works: checkedWorks() };
  }
  function runSearch(){
    setDirty(false);
    if (typeof window.RFAnnuaireSearchOverride === 'function') return window.RFAnnuaireSearchOverride();
    return fetchArtisansRge();
  }
  window.RFAnnuaireSearch = runSearch;
  const filtersEl = document.getElementById('filters');
  filtersEl.addEventListener('pointerdown', takeSnap, true);
  filtersEl.addEventListener('focusin', takeSnap, true);
  const onFilter = e => { if (e.target.closest('.f-foot') || e.target.closest('#filters-toggle')) return; setDirty(true); updateFilterCount(); };
  filtersEl.addEventListener('input', onFilter);
  filtersEl.addEventListener('change', onFilter);
  document.getElementById('btn-search').addEventListener('click', () => {
    runSearch();
    if (window.innerWidth < 1024){ filtersEl.classList.remove('open'); document.getElementById('filters-toggle').setAttribute('aria-expanded', 'false'); }
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    takeSnap();
    const el = document.getElementById('client-addr'); if (el) el.value = snap.addr;
    _coordsCacheKey = null; _coordsCache = null;
    depSel.value = snap.dep; dist.value = snap.dist; document.getElementById('dist-val').textContent = snap.dist + ' km';
    document.querySelectorAll('.checkbox input').forEach(c => { c.checked = snap.works.indexOf(c.value) !== -1; });
    refresh(); setDirty(true);
    document.querySelectorAll('#types-travaux input')[0] && document.querySelectorAll('#types-travaux input')[0].dispatchEvent(new Event('change', { bubbles: true }));
  });
  document.getElementById('filters-toggle').addEventListener('click', () => {
    const open = !filtersEl.classList.contains('open');
    filtersEl.classList.toggle('open', open);
    document.getElementById('filters-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* Rendu des cartes artisan — logique de rendu inchangée (favoris inclus) */
  function renderArtisans(list, uniq, notice){
    try {
      list.innerHTML = (notice || '') + uniq.slice(0, 15).map((a, idx) => {
        const certs = (a.domaines || []).slice(0, 3)
          .map(c => '<span class="pill">' + escapeHtml(c) + '</span>').join('');
        const tel = a.telephone ? a.telephone.toString().trim() : '';
        const telLink = tel ? '<a href="tel:' + tel.replace(/[^\d+]/g,'') + '">' + escapeHtml(tel) + '</a>' : '';
        let site = a.site_internet ? a.site_internet.toString().trim() : '';
        let siteLink = '';
        if (site){
          if (!/^https?:\/\//.test(site)) site = 'https://' + site;
          siteLink = '<a href="' + escapeAttr(site) + '" target="_blank" rel="noopener">Site web ↗</a>';
        }
        const siret = a.siret || ('idx_' + idx);
        const already = isFavorite(siret);
        const btnFav = '<button type="button" class="btn-fav' + (already ? ' added' : '') + '" data-siret="' + escapeAttr(siret) + '">' +
          (already
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 5 5L20 7"/></svg> Dans mon dossier'
            : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Ajouter au dossier') +
          '</button>';
        const distLabel = typeof a._dist === 'number'
          ? ' · à ' + (a._dist < 10 ? a._dist.toFixed(1) : Math.round(a._dist)) + ' km'
          : '';
        return '<div class="artisan-card' + (already ? ' fav' : '') + '" data-siret="' + escapeAttr(siret) + '">' +
          '<div>' +
            '<div class="artisan-name">' + escapeHtml(a.nom_entreprise || 'Entreprise') + '</div>' +
            '<div class="artisan-meta">' + escapeHtml([a.adresse, a.code_postal + ' ' + (a.commune || '')].filter(Boolean).join(' · ')) + distLabel + '</div>' +
            (certs ? '<div class="artisan-certs">' + certs + '</div>' : '') +
          '</div>' +
          '<div class="artisan-action">' + telLink + siteLink + btnFav + '</div>' +
        '</div>';
      }).join('');

      // Branche le bouton "Ajouter / Dans mon dossier" pour chaque carte
      list.querySelectorAll('.btn-fav').forEach((btn, i) => {
        btn.addEventListener('click', () => {
          const siret = btn.dataset.siret;
          if (btn.classList.contains('added')){
            removeFavorite(siret);
          } else {
            const a = uniq[i];
            addFavorite({
              siret: siret,
              nom_entreprise: a.nom_entreprise || '',
              adresse: a.adresse || '',
              code_postal: a.code_postal || '',
              commune: a.commune || '',
              telephone: a.telephone || '',
              site_internet: a.site_internet || '',
              certs: (a.domaines || []).slice(0, 6),
              addedAt: new Date().toISOString(),
            });
            btn.classList.add('added');
            btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 5 5L20 7"/></svg> Dans mon dossier';
            btn.closest('.artisan-card').classList.add('fav');
          }
        });
      });
    } catch(e){
      console.warn('ADEME RGE :', e);
      list.innerHTML = '<div class="artisan-empty">Recherche impossible pour le moment. Réessayez dans un instant.</div>';
    }
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){
    return escapeHtml(s).replace(/`/g,'&#96;');
  }

  document.querySelectorAll('.checkbox input').forEach(c => c.addEventListener('change', refresh));
  depSel.addEventListener('change', refresh);
  dist.addEventListener('input', refresh);
  /* Aucune relance automatique : la recherche ne part que du bouton « Rechercher ». */
  const addrInput = document.getElementById('client-addr');
  if (addrInput) addrInput.addEventListener('input', () => { _coordsCacheKey = null; _coordsCache = null; updateFilterCount(); });

  // Pré-remplit l'input adresse depuis le dossier tunnel si dispo
  (function prefillClientAddr(){
    const el = document.getElementById('client-addr');
    if (!el || el.value) return;
    const d = getDossier();
    const addr = (d && (d.address || (d.diagnostic && d.diagnostic.address))) || '';
    if (addr) el.value = addr;
  })();

  bind();
