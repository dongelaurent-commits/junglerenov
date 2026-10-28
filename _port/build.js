
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
for(var n of ['glossaire-aides','page-info']){await jrPageCss(n,EXTRA);await jrPortPage(n,{remove:['header.site','footer.site'],svg:jrSvgByHref,dom:function(r){jrBrandToLogo(r);rmArt(r);}});}
for(var n of ['parcours-autonomie','parcours-indigne']){await jrPageCss(n,EXTRA+'\n'+TUN+'\n.jr-legacy .stepper{display:none}');await jrPortPage(n,{remove:['header.simple'],html:function(h){return h.replace(/>\s*←\s*/g,'>').replace(/\s*→\s*</g,'<');}});}
await jrPortPage('onboarding-diagnostic',{remove:['header.simple'],
  svg:function(svg){
    if(svg.closest('.input-icon')){var inp=svg.closest('.input-icon').querySelector('input');return inp&&inp.id==='rfr'?'avis-imposition':'logement';}
    if(svg.closest('#lead-magnet-success'))return 'valide';if(svg.closest('#lead-magnet'))return 'email';if(svg.closest('.lock-cta'))return 'remise-partenaire';
    if(svg.closest('.check'))return {n:'valide',s:48};if(svg.closest('#scen-sources-box'))return 'document';},
  dom:function(r){var fr=r.querySelector('#step-8 .rf-tx__free');if(fr){var g=r.ownerDocument.createElement('div');g.className='jr-garantie';g.innerHTML='<span data-jr-picto="valide"></span><div><h3>100 % indépendant · sans démarchage</h3><p>Aucun artisan ne nous paie pour être recommandé. Nous ne vous appellerons jamais sans votre demande.</p></div>';fr.parentNode.insertBefore(g,fr);}var dg=r.querySelector('#dept optgroup');if(dg){dg.setAttribute('label','Lorraine');dg.setAttribute('data-jr','jr-dept-lorraine');var og=r.ownerDocument.createElement('optgroup');og.setAttribute('label','Autres départements du Grand Est (liste d\'attente)');['08','10','51','52','67','68'].forEach(function(v){var o=dg.querySelector('option[value="'+v+'"]');if(o)og.appendChild(o);});dg.parentNode.insertBefore(og,dg.nextSibling);}var m=r.querySelector('.rf-eligibility-matrix__note');if(m)m.textContent='Chaque aide est indiquée : applicable, sous conditions ou non applicable.';},
  html:function(h){return h.replace('Continuer →','Continuer').replace('← Précédent','Précédent');},
  code:function(c){return c.replace('MODE UPGRADE (depuis Mon profil > Passer en Premium)','REPRISE DU DOSSIER (depuis Mon profil)').replace(/CTA de paiement/g,'CTA').replace(/CTA paiement/g,'CTA');}});
