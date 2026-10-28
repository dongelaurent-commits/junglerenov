
/* Liste d'attente géographique — lecture, KPI et export CSV. */
(function initWaitlistTab(){
  'use strict';
  if (!window.RFGeo) return;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); };
  var setTxt = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = v; };
  var TUNNELS = { ENERGETIQUE: 'Énergétique', MPA: 'Autonomie', LHI: 'Habitat dégradé' };

  function render(){
    var list = RFGeo.getWaitlist().slice().sort(function(a, b){ return b.ts - a.ts; });
    var roadmapRegions = Object.keys(RFGeo.ZONES_ROADMAP);
    var parRegion = {}, roadmap = 0, blocked = 0;

    list.forEach(function(r){
      parRegion[r.region] = (parRegion[r.region] || 0) + 1;
      if (roadmapRegions.indexOf(r.region) !== -1) roadmap++; else blocked++;
    });
    var top = Object.keys(parRegion).sort(function(a, b){ return parRegion[b] - parRegion[a]; })[0];

    setTxt('count-waitlist', list.length);
    setTxt('rf-waitlist-kpi-total', list.length);
    setTxt('rf-waitlist-kpi-region', top || '—');
    setTxt('rf-waitlist-kpi-region-n', top ? parRegion[top] + (parRegion[top] > 1 ? ' inscrits' : ' inscrit') : '—');
    setTxt('rf-waitlist-kpi-roadmap', roadmap);
    setTxt('rf-waitlist-kpi-blocked', blocked);

    var tbody = document.getElementById('rf-waitlist-tbody');
    var empty = document.getElementById('rf-waitlist-empty');
    if (!tbody) return;
    if (empty) empty.hidden = list.length > 0;
    tbody.innerHTML = list.map(function(r){
      return '<tr>' +
        '<td>' + esc(r.email) + '</td>' +
        '<td>' + (esc(r.codePostal) || '—') + '</td>' +
        '<td>' + esc(r.region) + '</td>' +
        '<td>' + esc(TUNNELS[r.tunnel] || r.tunnel || '—') + '</td>' +
        '<td>' + new Date(r.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</td>' +
      '</tr>';
    }).join('');
  }

  var exportBtn = document.getElementById('rf-waitlist-export');
  if (exportBtn) exportBtn.addEventListener('click', function(){
    var list = RFGeo.getWaitlist();
    var csv = 'email;code_postal;region;tunnel;date\n' + list.map(function(r){
      return [r.email, r.codePostal, r.region, r.tunnel, new Date(r.ts).toISOString()].join(';');
    }).join('\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'junglerenov-liste-attente-' + Date.now() + '.csv';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  });

  render();
})();
