
function jrHexLum(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (0.2126*r+0.7152*g+0.0722*b)/255;}
var JR_DS_HEX=['#123A2E','#F4F1E8','#E9E3D3','#FFFFFF','#1F6B3F','#8FD14F','#065F46','#ECFDF5','#991B1B','#FEE2E2','#6B7280'];
function jrMapHex(h){var u=h.toUpperCase();if(u.length===4)u='#'+u.slice(1).split('').map(c=>c+c).join('');if(JR_DS_HEX.indexOf(u)>=0)return u;if(JR_COLORS[u])return JR_COLORS[u];var L=jrHexLum(u);
  // teintes rouges / vertes saturées -> états
  var r=parseInt(u.slice(1,3),16),g=parseInt(u.slice(3,5),16),b=parseInt(u.slice(5,7),16);
  if(r>g+60&&r>b+60) return L>0.8?'#FEE2E2':'#991B1B';
  if(g>r+40&&g>b+10) return L>0.8?'#ECFDF5':(L>0.45?'#1F6B3F':'#065F46');
  if(L>0.97)return '#FFFFFF'; if(L>0.9)return '#F4F1E8'; if(L>0.75)return '#E9E3D3'; if(L>0.5)return '#6B7280'; return '#123A2E';}
function jrDecl(prop,val){
  var p=prop.trim().toLowerCase(),v=val.trim();
  if(/^--/.test(p)){ if(/#|rgba?\(|shadow|font|gradient|mono|sans|serif/i.test(v)) return null; return p+':'+v; }
  if(p==='box-shadow'||p==='text-shadow') return p+':none';
  if(p==='backdrop-filter'||p==='-webkit-backdrop-filter') return p+':none';
  if(p==='filter'&&/blur/.test(v)) return 'filter:none';
  if(p==='letter-spacing') return 'letter-spacing:normal';
  if(p==='text-transform'&&/upper/.test(v)) return 'text-transform:none';
  if(p==='font-style'&&/italic/.test(v)) return 'font-style:normal';
  if(p==='font-family') return 'font-family:var(--font-text)';
  if(p==='text-align'&&/justify/.test(v)) return 'text-align:left';
  v=v.replace(/(?:repeating-)?(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/g,function(g){var m=g.match(/#[0-9A-Fa-f]{3,6}\b|var\(--[\w-]+\)/);return m?m[0]:'var(--paper-deep)';});
  v=v.replace(/rgba?\(([^)]*)\)/g,function(m,a){var parts=a.split(',').map(s=>s.trim());var al=parts.length>3?parseFloat(parts[3]):1;var hex='#'+parts.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('');if(al>0.35)return jrMapHex(hex);return jrHexLum(hex)>0.5?'transparent':'#E9E3D3';});
  v=v.replace(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/g,jrMapHex);
  v=v.replace(/"?(Public Sans|JetBrains Mono)"?[^;]*?(sans-serif|monospace)/g,'var(--font-text)');
  if(p==='font-size'){var n=v.match(/^([\d.]+)px/);if(n&&+n[1]<17)v='17px';if(/rem|em$/.test(v)&&parseFloat(v)<1.07)v='17px';}
  if(p==='font'){v=v.replace(/italic\s*/,'').replace(/(^|\s)([\d.]+)px/,function(m,s,n){return s+(+n<17?17:n)+'px';});}
  if(p==='border-radius'){v=v.replace(/([\d.]+)px/g,function(m,n){n=+n;return (n>=999?4:n<=4?n:6)+'px';});}
  if(p==='border-left'&&/^(\d+)px\s+solid/.test(v)&&+v.match(/^(\d+)/)[1]>=2) return 'border-left:0';
  if(p==='border-left-width'&&parseFloat(v)>=2) return 'border-left-width:0';
  if(p==='transform'&&/translateY\(-\d/.test(v)) return 'transform:none';
  return p+':'+v;
}
function jrScopeSel(sel,scope){
  return sel.split(/,(?![^(]*\))/).map(function(s){s=s.trim();if(!s)return s;
    if(/^(html|body|:root)\b/.test(s)){s=s.replace(/^(html|body|:root)(\s*,?\s*body)?/,'');return scope+s;}
    return scope+' '+s;}).join(',');
}
function jrTranslateCss(css,scope){
  css=css.replace(/\/\*[\s\S]*?\*\//g,'');
  var out='',i=0;
  function block(str){
    var res='',pos=0;
    while(pos<str.length){
      var open=str.indexOf('{',pos);if(open<0)break;
      var head=str.slice(pos,open).trim();
      var d=1,j=open+1;for(;j<str.length&&d;j++){if(str[j]==='{')d++;else if(str[j]==='}')d--;}
      var inner=str.slice(open+1,j-1);
      if(/^@(media|supports)/.test(head)) res+=head+'{'+block(inner)+'}';
      else if(/^@(keyframes|-webkit-keyframes|font-face|import|charset)/.test(head)) res+=(/^@(font-face|import)/.test(head)?'':head+'{'+inner+'}');
      else { var decls=inner.split(/;(?![^(]*\))/).map(function(x){var k=x.indexOf(':');if(k<0)return null;return jrDecl(x.slice(0,k),x.slice(k+1));}).filter(Boolean);
        if(decls.length) res+=jrScopeSel(head,scope)+'{'+decls.join(';')+'}'; }
      pos=j;
    }
    return res;
  }
  return block(css);
}
var JR_ALIAS=".jr-legacy{--teal-50:var(--paper);--teal-100:var(--paper-deep);--teal-200:var(--paper-deep);--teal-300:var(--paper-deep);--teal-400:var(--action);--teal-500:var(--action);--teal-600:var(--action);--teal-700:var(--action);--teal-800:var(--ink);--teal-900:var(--ink);--amber-50:var(--paper-deep);--amber-100:var(--paper-deep);--amber-200:var(--paper-deep);--amber-300:var(--paper-deep);--amber-500:var(--ink);--amber-600:var(--ink);--amber-700:var(--ink);--amber-800:var(--ink);--amber-900:var(--ink);--slate-50:var(--paper);--slate-100:var(--paper-deep);--slate-200:var(--paper-deep);--slate-300:var(--off);--slate-400:var(--off);--slate-500:var(--ink);--slate-600:var(--ink);--slate-700:var(--ink);--slate-800:var(--ink);--slate-900:var(--ink);--success-50:var(--ok-wash);--success-100:var(--ok-wash);--success-200:var(--ok-wash);--success-500:var(--ok);--success-600:var(--ok);--success-700:var(--ok);--danger-50:var(--ko-wash);--danger-100:var(--ko-wash);--danger-200:var(--ko-wash);--danger-500:var(--ko);--danger-600:var(--ko);--danger-700:var(--ko);--warning-50:var(--paper-deep);--warning-100:var(--paper-deep);--warning-600:var(--ink);--warning-700:var(--ink);--info-50:var(--paper-deep);--info-100:var(--paper-deep);--info-600:var(--ink);--info-700:var(--ink);--violet-50:var(--paper-deep);--violet-100:var(--paper-deep);--violet-600:var(--ink);--violet-700:var(--ink);--purple-50:var(--paper-deep);--purple-600:var(--ink);--blue-50:var(--paper-deep);--blue-600:var(--ink);--red-50:var(--ko-wash);--red-600:var(--ko);--green-50:var(--ok-wash);--green-600:var(--ok);--bg:var(--paper);--surface:var(--card);--border:var(--line);--text:var(--ink);--muted:var(--ink);--shadow-xs:none;--shadow-sm:none;--shadow-md:none;--shadow-lg:none;--shadow:none;--font-sans:var(--font-text);--font-mono:var(--font-text);color:var(--ink);font:var(--type-body)}.jr-legacy [hidden]{display:none!important}.jr-legacy *{box-sizing:border-box}.jr-legacy :where(input,select,textarea,button,a,summary,[tabindex]):focus-visible{outline:var(--focus-width) solid var(--focus-ring)!important;outline-offset:var(--focus-offset)!important}.jr-legacy .jr-picto{display:inline-flex;flex:none}.jr-legacy .jr-picto svg{display:block}.jr-legacy .jr-logo{display:inline-flex;line-height:0}\n";
async function jrPageCss(NAME,extra){
  var src=await readFile('uploads/junglerenov-site-reference/'+NAME+'.html');
  var css=(src.match(/<style[^>]*>[\s\S]*?<\/style>/g)||[]).map(function(s){return s.replace(/<\/?style[^>]*>/g,'');}).join('\n');
  var out='/* JungleRenov — '+NAME+' : feuille traduite sur les tokens du design system (couleurs, typographie, rayons, aucune ombre). Générée, ne pas éditer à la main : surcharges en fin de fichier. */\n'+JR_ALIAS+jrTranslateCss(css,'.jr-legacy')+'\n/* Surcharges design system */\n'+(extra||'');
  await saveFile('lib/css/'+NAME+'.css',out);
  var left=(out.match(/#[0-9A-Fa-f]{6}\b/g)||[]).filter(function(h){return JR_DS_HEX.indexOf(h.toUpperCase())<0;});
  log(NAME,'css',out.length,'hex hors palette',left.length);
}