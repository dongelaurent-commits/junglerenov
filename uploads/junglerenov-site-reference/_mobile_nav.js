/* RénoFacile — Toggle sidebar mobile : injecte topbar + burger + backdrop. */
(function(){'use strict';
  function init(){
    var sidebar=document.querySelector('aside.sidebar, .sidebar, .sidebar-nav');
    if(!sidebar) return;
    var bp=Number(document.documentElement.getAttribute('data-mobilenav-bp'))||880;
    function close(){sidebar.classList.remove('open');document.body.classList.remove('sidebar-open');}
    function open(){sidebar.classList.add('open');document.body.classList.add('sidebar-open');}
    if(!document.querySelector('.mobile-topbar')){
      var topbar=document.createElement('div');
      topbar.className='mobile-topbar';
      topbar.innerHTML='<a class="mobile-topbar__brand" href="index.html"><span class="mobile-topbar__brand-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg></span><span class="mobile-topbar__brand-name">Réno<span class="accent">Facile</span></span></a><button class="mobile-topbar__burger" aria-label="Ouvrir la navigation" type="button"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>';
      document.body.insertBefore(topbar,document.body.firstChild);
    }
    if(!document.querySelector('.sidebar-backdrop')){
      var backdrop=document.createElement('div');
      backdrop.className='sidebar-backdrop';
      document.body.appendChild(backdrop);
    }
    if(!sidebar.querySelector('.sidebar-close')){
      var closeBtn=document.createElement('button');
      closeBtn.className='sidebar-close';
      closeBtn.type='button';
      closeBtn.setAttribute('aria-label','Fermer la navigation');
      closeBtn.innerHTML='✕';
      sidebar.insertBefore(closeBtn,sidebar.firstChild);
      closeBtn.addEventListener('click',close);
    }
    var burger=document.querySelector('.mobile-topbar__burger');
    if(burger) burger.addEventListener('click',open);
    var bd=document.querySelector('.sidebar-backdrop');
    if(bd) bd.addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sidebar.classList.contains('open'))close();});
    sidebar.addEventListener('click',function(e){if(e.target.closest('a'))close();});
    window.addEventListener('resize',function(){if(window.innerWidth>bp&&sidebar.classList.contains('open'))close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
