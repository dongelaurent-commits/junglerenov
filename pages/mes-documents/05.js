
/* JungleRenov — rend le widget profil de sidebar cliquable et ajoute Déconnexion */
(function(){
  function init(){
    var me = document.querySelector('.sidebar .me, aside .me');
    if (!me) return;
    me.style.cursor = 'pointer';
    me.style.position = 'relative';
    var menu = document.createElement('div');
    menu.style.cssText = 'display:none;position:absolute;bottom:calc(100% + 6px);left:0;right:0;background:#FFFFFF;border:1px solid #E9E3D3;border-radius:6px;box-shadow:none;padding:6px;z-index:50;font-size:17px';
    menu.innerHTML =
      '<a href="mon-profil.dc.html" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:6px;color:#123A2E;text-decoration:none">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>' +
        'Mon profil' +
      '</a>' +
      '<div style="height:1px;background:#E9E3D3;margin:4px 0"></div>' +
      '<a href="#" id="rf-side-logout" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:6px;color:#991B1B;text-decoration:none">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>' +
        'Se déconnecter' +
      '</a>';
    me.appendChild(menu);
    me.addEventListener('click', function(e){
      if (e.target.closest('a')) return;
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function(e){
      if (!e.target.closest('.me')) menu.style.display = 'none';
    });
    var logoutLink = document.getElementById('rf-side-logout');
    if (logoutLink){
      logoutLink.addEventListener('click', function(e){
        e.preventDefault();
        if (window.RFStore) RFStore.logout();
        else {
          ['junglerenov.session','junglerenov.profile'].forEach(function(k){ try{localStorage.removeItem(k);}catch{} });
        }
        window.location.href = 'login.dc.html';
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
