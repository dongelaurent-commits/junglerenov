
var JR_EMOJI={'🏠':'logement','🔑':'proprietaire','💡':'information','🏢':'logement','🏗️':'facade','🏗':'facade','🎯':'revenus','⏱️':'rendez-vous','⏱':'rendez-vous','🛡️':'valide','🛡':'valide','🤝':'email','📄':'document','📁':'dossier','📎':'televerser','📞':'telephone','✉️':'email','📧':'email','🔒':'piece-identite','👤':'proprietaire','💶':'revenus','💰':'revenus','📅':'rendez-vous','🧾':'devis','🏡':'logement','👴':'proprietaire','♿':'proprietaire','🛁':'logement','🚿':'logement','🪜':'logement','🔧':'devis','⚡':'information','🌱':'information','📍':'logement','✅':'valide','❌':'bloque','⛔':'bloque','🚫':'bloque','ℹ️':'information'};
function jrBumpFonts(t){
  t=t.replace(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g,function(m,n){return +n<17?'font-size:17px':m;});
  t=t.replace(/(font\s*:\s*(?:italic\s+)?(?:\d{3}\s+)?)(\d+(?:\.\d+)?)px/g,function(m,a,n){return +n<17?a+'17px':m;});
  return t;
}
function jrStripDeco(t){
  t=t.replace(/<span aria-hidden="true">\s*[→←]\s*<\/span>/g,'');
  t=t.replace(/\s*→\s*(<\/(?:button|a|span)>)/g,'$1').replace(/(<(?:button|a)[^>]*>)\s*←\s*/g,'$1');
  t=t.replace(/(['"\x60])←\s+/g,'$1').replace(/\s+→(['"\x60])/g,'$1');
  t=t.replace(/linear-gradient\((?:[^()]|\([^()]*\))*\)/g,'var(--paper-deep)').replace(/radial-gradient\((?:[^()]|\([^()]*\))*\)/g,'none');
  t=t.replace(/border-left\s*:\s*\d+px\s+solid\s+[^;"'\x60]+/g,'border-left:0');
  t=t.replace(/backdrop-filter\s*:\s*[^;"'\x60]+/g,'backdrop-filter:none').replace(/filter\s*:\s*blur\([^)]*\)/g,'filter:none');
  t=t.replace(/(\b[A-Za-z_$][\w$]*(?:\.[\w$]+|\([^()]*\))*)\.scrollIntoView\((?:\{[^}]*\}|true|false)?\)/g,'jrScrollTo($1)');
  return t;
}
function jrNoCaps(t){return t.replace(/text-transform\s*:\s*uppercase;?/g,'').replace(/letter-spacing\s*:\s*[^;"'\x60]+;?/g,'');}
function jrFull(t){t=jrNoCaps(t);return jrPost(jrStripDeco(jrBumpFonts(jrSanitize(t))));}
function jrRemoveIfBlock(src, cond){
  var i=src.indexOf(cond); if(i<0) return src;
  var b=src.indexOf('{',i+cond.length-1); var d=0,j=b;
  for(;j<src.length;j++){if(src[j]==='{')d++;else if(src[j]==='}'){d--;if(!d)break;}}
  var start=src.lastIndexOf('if',i);
  return src.slice(0,start)+'/* (purge des données de test retirée) */'+src.slice(j+1);
}
function jrEmojiToPicto(html){
  // emoji seuls dans un conteneur d'icône -> pictogramme
  html=html.replace(/(<span[^>]*class="[^"]*(?:icon|__icon)[^"]*"[^>]*>)\s*([^<\s]{1,4})\s*(<\/span>)/g,function(m,a,e,c){var n=JR_EMOJI[e]||JR_EMOJI[e.replace(/\uFE0F/g,'')];return n?a+'<span data-jr-picto="'+n+'"></span>'+c:m;});
  // emoji restants dans le texte : retirés
  html=html.replace(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]\uFE0F?)\s?/gu,'');
  return html;
}
function jrExtractScripts(html){
  var out=[];var re=/<script([^>]*)>([\s\S]*?)<\/script>/g,m;
  while((m=re.exec(html))){var attrs=m[1];var src=(attrs.match(/src="([^"]+)"/)||[])[1];out.push({src:src,defer:/\bdefer\b/.test(attrs),code:src?null:m[2],pos:m.index});}
  return out;
}

var JR_WORK={combles:'combles',toiture_terrasse:'combles',ite:'facade',menuiseries:'fenetres',pac_aireau:'pompe-a-chaleur',pac_geothermique:'pompe-a-chaleur',chauffe_eau_thermo:'pompe-a-chaleur',chauffe_eau_solaire:'chaudiere',chauffage_solaire_combine:'chaudiere',pvt_eau:'chaudiere',raccordement_reseau:'chaudiere',poele_granules:'chaudiere',poele_buches:'chaudiere',insert_foyer:'chaudiere',biomasse:'chaudiere',vmc_df:'logement',audit_energetique:'document',depose_cuve_fioul:'chaudiere'};
async function jrPortPage(NAME, o){
  o=o||{};
  var src=await readFile('uploads/junglerenov-site-reference/'+NAME+'.html');
  var bs=src.indexOf('<body');var be=src.indexOf('>',bs)+1;var bend=src.lastIndexOf('</body>');
  var body=src.slice(be,bend).replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'');
  var doc=new DOMParser().parseFromString('<div id="r">'+body+'</div>','text/html');var r=doc.getElementById('r');
  (o.remove||[]).forEach(function(sel){r.querySelectorAll(sel).forEach(function(e){e.remove();});});
  var mk=function(n,s){var e=doc.createElement('span');e.setAttribute('data-jr-picto',n);if(s)e.setAttribute('data-size',s);return e;};
  var stats={};
  r.querySelectorAll('svg').forEach(function(svg){
    var res=o.svg?o.svg(svg):undefined;
    if(res===undefined){var w=svg.closest('[data-work]');res=w?(JR_WORK[w.dataset.work]||'logement'):(svg.closest('[data-radio]')||svg.closest('.lc-item')||svg.closest('.dpe-arrow'))?null:((svg.closest('button,summary')&&!svg.closest('button,summary').textContent.trim())||/chev|toggle|arrow|caret/i.test((svg.parentElement&&svg.parentElement.className)||'')||/chev|toggle|arrow|caret/i.test(svg.getAttribute('class')||''))?'chevron':'information';}
    stats[res||'x']=(stats[res||'x']||0)+1;
    if(res===null){(svg.closest('.icn')||svg).remove();} else if(typeof res==='string') svg.replaceWith(mk(res)); else svg.replaceWith(mk(res.n,res.s));
  });
  r.querySelectorAll('.dpe-l,.dpe-letter').forEach(function(e){e.removeAttribute('style');});
  r.querySelectorAll('.dpe-bar .lvl').forEach(function(e){var w=(e.getAttribute('style')||'').match(/width:[^;]+/);e.setAttribute('style',w?w[0]:'');});
  r.querySelectorAll('.projet-dpe-arrow').forEach(function(e){e.textContent='puis';});
  if(o.dom) o.dom(r,doc);
  var html=jrFull(jrEmojiToPicto(r.innerHTML));
  if(o.html) html=o.html(html);
  await saveFile('partials/'+NAME+'.html','<!-- Fragment rhabillé : balisage et identifiants d\'origine conservés (les scripts métier s\'y accrochent). -->\n'+html);
  var scs=jrExtractScripts(src);var list=[];var deferred=[];var k=0;
  for(var i=0;i<scs.length;i++){var s=scs[i];
    if(s.src){ if(/_demo_mode|_mobile_nav/.test(s.src))continue; var u=/^https?:/.test(s.src)?s.src:'lib/'+s.src.replace(/^\.\//,''); (s.defer?deferred:list).push(u); continue;}
    var c=s.code; if(!c.trim()) continue;
    c=jrRemoveIfBlock(c,'if (window.rfIsDemoStaging && window.rfIsDemoStaging())');
    c=jrRemoveIfBlock(c,'if (window.rfIsDemoStaging && window.rfIsDemoStaging())');
    c=c.replace("status === 'yes' ? '✅' : (status === 'cond' ? '⚠️' : '❌')","status === 'yes' ? 'Applicable' : (status === 'cond' ? 'Sous conditions' : 'Non applicable')");
    c=c.replace(/⚠\uFE0F?\s?/g,'');
    if(o.code) c=o.code(c,k+1);
    c=jrFull(c);
    if(c.indexOf('rfIsDemoStaging')>=0 && /return;\s*$/.test('')) {}
    k++;var f='pages/'+NAME+'/'+String(k).padStart(2,'0')+'.js';await saveFile(f,c);list.push(f);
  }
  var all=list.concat(deferred);
  var bt=src.slice(bs,be);var bc=(bt.match(/class="([^"]*)"/)||[])[1]||'';var bd=(bt.match(/data-tunnel="([^"]*)"/)||[])[1]||'';
  await saveFile('pages/'+NAME+'/scripts.json',JSON.stringify({scripts:all,rootClass:bc,tunnel:bd}));
  log(NAME,JSON.stringify(stats),html.length);log(JSON.stringify(all));
  return all;
}