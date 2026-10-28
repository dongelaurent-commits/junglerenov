
var JR_PAGES=['index','choix-parcours','onboarding-diagnostic','login','dashboard','mes-aides','mes-documents','mon-profil','annuaire-artisans','glossaire-aides','page-info','merci-liste-attente','404','parcours-autonomie','parcours-indigne','admin','super-admin'];
var JR_COLORS={
'#0F766E':'#1F6B3F','#115E59':'#123A2E','#134E4A':'#123A2E','#0F172A':'#123A2E','#1E293B':'#123A2E','#334155':'#123A2E','#475569':'#123A2E','#64748B':'#123A2E','#451A03':'#123A2E','#2E1065':'#123A2E','#5B21B6':'#123A2E','#7C3AED':'#123A2E','#6D28D9':'#123A2E','#1D4ED8':'#123A2E','#2563EB':'#123A2E','#94A3B8':'#6B7280',
'#78350F':'#123A2E','#92400E':'#123A2E','#B45309':'#123A2E','#D97706':'#123A2E','#F59E0B':'#123A2E',
'#F8FAFC':'#F4F1E8','#F1F5F9':'#E9E3D3','#F0FDFA':'#F4F1E8','#CCFBF1':'#E9E3D3','#E6F2EC':'#E9E3D3','#F5F3FF':'#E9E3D3','#EDE9FE':'#E9E3D3','#DBEAFE':'#E9E3D3','#EFF6FF':'#E9E3D3','#DDD6FE':'#E9E3D3','#C4B5FD':'#E9E3D3',
'#FFFBEB':'#E9E3D3','#FEF3C7':'#E9E3D3','#FDE68A':'#E9E3D3','#FCD34D':'#123A2E',
'#E2E8F0':'#E9E3D3','#E5E7EB':'#E9E3D3','#CBD5E1':'#6B7280',
'#D1FAE5':'#ECFDF5','#DCFCE7':'#ECFDF5','#A7F3D0':'#ECFDF5','#047857':'#065F46','#059669':'#065F46','#16A34A':'#065F46','#10B981':'#065F46',
'#FEF2F2':'#FEE2E2','#FECACA':'#FEE2E2','#B91C1C':'#991B1B','#DC2626':'#991B1B','#7F1D1D':'#991B1B',
'#FFF':'#FFFFFF','#fff':'#FFFFFF'};
function jrSanitize(t){
  t=jrVocab(t);
  t=t.split('rénofacile').join('junglerenov').split('Rénofacile').join('JungleRenov');
  t=t.replace(/R\u00e9noFacile|RénoFacile|RenoFacile|RÉNOFACILE|Rénofacile/g,'JungleRenov');
  t=t.replace(/Réno<span class="accent">Facile<\/span>/g,'JungleRenov');
  t=t.replace(/renofacile\.fr/g,'junglerenov.fr').replace(/renofacile\./g,'junglerenov.').replace(/renofacile/g,'junglerenov');
  t=t.replace(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/g,function(h){var k=h.length===4?h.toUpperCase():h.toUpperCase();return JR_COLORS[k]||JR_COLORS[h]||jrFallbackHex(k);});
  t=t.replace(/"Public Sans"[^;'"]*?sans-serif/g,'"Komet","Red Hat Display",system-ui,sans-serif').replace(/"JetBrains Mono"[^;'"]*?monospace/g,'"Komet","Red Hat Display",system-ui,sans-serif');
  t=t.replace(/box-shadow:[^;'"]+/g,'box-shadow:none');
  t=t.replace(/border-radius:\s*(\d+)px/g,function(m,n){n=+n;return 'border-radius:'+(n<=4?n:6)+'px';});
  t=t.replace(new RegExp('\\b('+JR_PAGES.join('|')+')\\.html\\b','g'),'$1.dc.html');
  t=t.replace(/\.dc\.dc\.html/g,'.dc.html');
  return t;
}
function jrFallbackHex(u){if(u.length===4)u='#'+u.slice(1).split('').map(function(c){return c+c;}).join('');var DS=['#123A2E','#F4F1E8','#E9E3D3','#FFFFFF','#1F6B3F','#8FD14F','#065F46','#ECFDF5','#991B1B','#FEE2E2','#6B7280'];if(DS.indexOf(u)>=0)return u;
var r=parseInt(u.slice(1,3),16),g=parseInt(u.slice(3,5),16),b=parseInt(u.slice(5,7),16);var L=(0.2126*r+0.7152*g+0.0722*b)/255;
if(r>g+60&&r>b+60)return L>0.8?'#FEE2E2':'#991B1B';if(g>r+40&&g>b+10)return L>0.8?'#ECFDF5':(L>0.45?'#1F6B3F':'#065F46');
if(L>0.97)return '#FFFFFF';if(L>0.9)return '#F4F1E8';if(L>0.75)return '#E9E3D3';if(L>0.45)return '#1F6B3F';return '#123A2E';}
function jrVocab(t){
  var R=[[/le diagnostic est gratuit/g,'la simulation est gratuite'],[/Diagnostic gratuit/g,'Simulation gratuite'],[/diagnostic gratuit/g,'simulation gratuite'],
   [/Diagnostic personnalisé approfondi/g,'Simulation personnalisée approfondie'],[/Aucun diagnostic réalisé/g,'Aucune simulation réalisée'],
   [/Du diagnostic au chantier/g,'De la simulation au chantier'],[/01 — Diagnostic/g,'01 — Simulation'],[/Diagnostic à compléter/g,'Simulation à compléter'],
   [/Diagnostic en (\d+) minutes/g,'Simulation en $1 minutes'],[/>\s*Diagnostic\s*</g,'>Simulation<'],[/'Diagnostic'/g,"'Simulation'"],
   [/\b([Ll]e|[Dd]u|[Uu]n|[Vv]otre|[Cc]e|[Mm]on|[Aa]u) diagnostic\b(?! (?:autonomie|de performance|technique|global|énergétique|thermique|immobilier|d'|des|du logement|sur place|réalisé par|de l'opérateur|ergo))/g,function(m,a){var M={'le':'la','Le':'La','du':'de la','Du':'De la','un':'une','Un':'Une','votre':'votre','Votre':'Votre','ce':'cette','Ce':'Cette','mon':'ma','Mon':'Ma','au':'à la','Au':'À la'};return M[a]+' simulation';}],
   [/bureau d'études agréé/g,"bureau d'études habilité"]];
  R.forEach(function(r){t=t.replace(r[0],r[1]);});
  return t;
}
var JR_FIN='JungleRenov est gratuit pour vous. Nous sommes rémunérés par le partenaire habilité à qui votre dossier est remis, dans le cadre d\u2019un accord conclu avec lui. Aucune commission sur vos travaux, aucun lead vendu.';
var JR_Z='en Lorraine : Meurthe-et-Moselle, Meuse, Moselle, Vosges';
function jrPost(t){
  var F=JR_FIN;
  var R=[
   // financement — variantes supprimées
   ["JungleRenov est gratuit pour vous. Nous sommes rémunérés par le professionnel agréé qui reprend votre dossier.",F],
   ["L'utilisation de JungleRenov ne vous coûte rien : aucun paiement, aucun abonnement, aucune carte bancaire. Nous sommes rémunérés par le professionnel agréé qui prend votre dossier en charge.",F],
   ["Aucune commission sur vos travaux, aucun fichier de prospects revendu. Notre seul revenu est la rémunération versée par le professionnel agréé qui reprend votre dossier.",F],
   ["Nous sommes rémunérés par le professionnel agréé (MAR ou AMO) à qui votre dossier est transmis, au titre du travail de montage que nous lui livrons. C'est un accord entre entreprises, réglé hors de ce site. Vous, vous ne payez rien : aucun lead n'est vendu, aucune commission n'est prise sur vos travaux.",F],
   ["Nous sommes rémunérés par le professionnel agréé à qui votre dossier est transmis, dans le cadre d'un accord conclu avec lui — jamais par vous. Aucun lead n'est vendu, aucune commission n'est prise sur vos travaux.",F],
   ["Le service est gratuit pour vous — notre rémunération vient du professionnel agréé qui reprend votre dossier.",F],
   ["Le service est gratuit pour vous — notre seul revenu est la rémunération versée par le professionnel agréé qui reprend votre dossier.",F],
   ["Notre seule source de revenus est la rémunération versée par le professionnel agréé qui reprend le dossier.",F],
   ["qui nous permet de rendre le service gratuit pour vous : nous sommes rémunérés par le professionnel agréé qui reprend le dossier, au titre du travail que nous lui livrons.","qui nous permet de rendre le service gratuit. "+F],
   // partenaire habilité
   [/\b([Ll]e|[Dd]u|[Aa]u|[Uu]n|[Cc]e) professionnel agréé/g,function(m,a){return a+' partenaire habilité';}],
   [/professionnel agréé/g,'partenaire habilité'],
   [/([Uu]n) accompagnateur agréé/g,'$1 partenaire habilité'],
   [/([Ll])'accompagnateur agréé/g,function(m,a){return (a==='L'?'Le':'le')+' partenaire habilité';}],
   [/accompagnateur agréé/g,'partenaire habilité'],
   [/([Vv])otre accompagnateur(?! MAR| Rénov)/g,'$1otre partenaire habilité'],
   [/([Ll])'accompagnateur(?! MAR| Rénov| AMO)/g,function(m,a){return (a==='L'?'Le':'le')+' partenaire habilité';}],
   // vocabulaire
   [/artisans RGE vérifiés/g,'artisans RGE'],[/Données ADEME officielles/g,'Sources officielles Anah, ADEME'],
   [/\b[Aa]udit gratuit\b/g,'simulation gratuite'],
   // zone
   ["V1 optimisée Grand Est","Service ouvert en Lorraine"],
   ["JungleRenov couvre en priorité l'Alsace, la Lorraine et la Champagne-Ardenne. Les autres régions bénéficient d'un calcul standard MPR/CEE/éco-PTZ.","JungleRenov intervient "+JR_Z+". Hors de ces quatre départements, vous pouvez rejoindre la liste d'attente."],
   ["JungleRenov couvre en priorité la Lorraine : Meurthe-et-Moselle, Meuse, Moselle, Vosges. Les autres régions bénéficient d'un calcul standard MPR/CEE/éco-PTZ.","JungleRenov intervient "+JR_Z+". Hors de ces quatre départements, vous pouvez rejoindre la liste d'attente."],
   [/Aides régionales Grand Est incluses/g,'Aides régionales incluses '+JR_Z],
   [/nationales et Grand Est/g,'nationales et régionales, '+JR_Z],
   [/aides Grand Est/g,'aides régionales'],
   [/Les intercommunalités du Grand Est/g,'Les intercommunalités de Lorraine'],
   ["Toutes les aides nationales et régionales du Grand Est passées au crible.","Toutes les aides nationales et régionales passées au crible, "+JR_Z+"."],
   [/\(nationales \+ Grand Est\)/g,'(nationales et régionales)'],[/Aides spécifiques Grand Est/g,'Aides régionales et locales'],
   [/aides nationales \+ Grand Est calculées/g,'aides nationales et régionales calculées'],
   [/'Grand Est ' \+ fmtEur/g,"'Aides régionales ' + fmtEur"],
   [/Aides régionales et locales Grand Est/g,'Aides régionales et locales'],[/'Aides régionales Grand Est'/g,"'Aides régionales'"],[/'Aides locales Grand Est'/g,"'Aides locales'"],[/line\('Aides Grand Est'/g,"line('Aides régionales'"],
   [/aides locales Grand Est/g,'aides locales'],
   [/JungleRenov démarre sur le Grand Est/g,'JungleRenov démarre '+JR_Z],
   [/est actuellement actif en Grand Est/g,'est actuellement actif '+JR_Z],
   ["JungleRenov accompagne actuellement les habitants du Grand Est. Simulation accessible en mode découverte — vous pouvez rejoindre la liste d\\'attente pour être prévenu·e à l\\'ouverture de votre région.","JungleRenov intervient actuellement "+JR_Z+". Hors de ces quatre départements, vous pouvez rejoindre la liste d\\'attente pour être prévenu à l\\'ouverture de votre région."],
   [" Vous pouvez simuler vos aides gratuitement — ouverture prévue "," Vous pouvez rejoindre la liste d\\'attente — ouverture prévue "],
   ["'Grand Est': ['08','10','51','52','54','55','57','67','68','88']","'Grand Est': ['54','55','57','88']  /* Lorraine uniquement */"],
   ["'Bourgogne-Franche-Comté': ['21',","'Grand Est hors Lorraine': ['08','10','51','52','67','68'],\n    'Bourgogne-Franche-Comté': ['21',"],
   ["zone couverte (Grand Est)","zone couverte (Lorraine : 54, 55, 57, 88)"],
   ["zoneIntervention: 'Grand Est'","zoneIntervention: 'Lorraine (54, 55, 57, 88)'"]
  ];
  R.push(['simulation est complété ','simulation est complétée ']);R.push(['votre dernier diagnostic','votre dernière simulation']);R.push(["de vous joindre.</p>","de vous joindre. Le compte sert à enregistrer votre dossier et à le reprendre plus tard.</p>"]);
  R.forEach(function(r){ t=(typeof r[0]==='string')?t.split(r[0]).join(r[1]):t.replace(r[0],r[1]); });
  return t;
}