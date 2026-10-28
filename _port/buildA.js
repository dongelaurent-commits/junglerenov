
eval(await readFile('_port/sanitize.js'));eval(await readFile('_port/legacy.js'));eval(await readFile('_port/cssx.js'));eval(await readFile('_port/espace.js'));
var EXTRA=await readFile('_port/espace-extra.css');
var TUN=(await readFile('lib/jr-tunnel.css')).replace(/\.jr-legacy main\{[^}]*\}/,'').replace(/\.jr-legacy \.stepper\{display:none\}/,'');
var D='uploads/junglerenov-site-reference/';
var STRICT=['_compute_aids.js','_baremes_sources.js','_travaux_catalog.js','_geo.js','_mar.js','_files.js','_storage.js','_dossiers.js','_user.js','_pdf_docs.js'];
for(var f of ['_adresse_secours.js','_alertes.js','_analytics.js','_auth_guard.js','_baremes_sources.js','_compute_aids.js','_dossiers.js','_files.js','_geo.js','_geo_ui.js','_mar.js','_mar_ui.js','_partner_config.js','_pdf_docs.js','_storage.js','_transmission.js','_travaux_catalog.js','_user.js']){
  var t=jrSanitize(await readFile(D+f));
  if(STRICT.indexOf(f)<0){t=jrStripDeco(jrBumpFonts(jrNoCaps(t)));t=jrEmojiToPicto(t);}
  if(!/compute|baremes|travaux_catalog/.test(f)) t=jrPost(t);
  if(f==='_auth_guard.js') t=t.replace(/\/\* ═+\s*ENVIRONNEMENT DE DÉVELOPPEMENT LOCAL[\s\S]*?if \(!window\.RFDemoMode\)[^\n]*\n/,'');
  await saveFile('lib/'+f,t);
}
var rmArt=function(r){r.querySelectorAll('a[href*="espace-artisan"]').forEach(function(a){var li=a.closest('li');if(li)li.remove();else a.remove();});var sw=r.querySelector('#sw-artisan');if(sw&&sw.parentElement)sw.parentElement.remove();};
var esp={svg:jrSvgByHref,dom:function(r){jrBrandToLogo(r);rmArt(r);}};
for(var n of ['dashboard','mes-aides','mes-documents','mon-profil','annuaire-artisans','admin','super-admin']){await jrPageCss(n,EXTRA);await jrPortPage(n,esp);}
