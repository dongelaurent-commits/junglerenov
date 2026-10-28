/* JungleRenov — instrumentation analytics centralisée.
   ════════════════════════════════════════════════════════════════════════════
   À configurer :
   1. Remplacer GA4_MEASUREMENT_ID par votre identifiant Google Analytics 4
      (format : "G-XXXXXXXXXX", récupéré dans Analytics → Admin → Flux de données).
   2. Remplacer HOTJAR_SITE_ID par l'identifiant Hotjar (entier, ex 1234567,
      récupéré dans Hotjar → Settings → Sites & Organizations).
   3. Mettre ANALYTICS_ENABLED à true pour activer en production.

   IMPORTANT : GA4 et Hotjar ne tracquent rien quand le site est ouvert en
   file:// (test local). Il faut un vrai domaine (junglerenov.fr) pour que
   les requêtes partent. En dev, ANALYTICS_ENABLED reste false.

   Helpers exposés :
     window.RFAnalytics.event(name, params)  → envoie un événement custom à GA4
     window.RFAnalytics.identify(userId)     → associe les events à un userId
     window.RFAnalytics.page(name)           → page view manuelle (SPA)

   Événements suggérés (à appeler depuis le code métier) :
     diagnostic_started, diagnostic_step (n°étape), diagnostic_completed
     signup_completed, transmission_viewed, transmission_submitted, dossier_transmis
     artisan_searched, artisan_favorited, document_uploaded
     dossier_signed (id), dossier_downloaded (id, type)
     consentement_retire
   ════════════════════════════════════════════════════════════════════════════ */
(function(){
  // ──────────────── CONFIG ────────────────
  const ANALYTICS_ENABLED   = false;       // ← passer à true une fois les IDs configurés
  const GA4_MEASUREMENT_ID  = 'G-XXXXXXXXXX'; // ← à remplacer
  const HOTJAR_SITE_ID      = 0;           // ← à remplacer (ex: 3456789)
  const HOTJAR_VERSION      = 6;           // version actuelle du snippet Hotjar

  // ──────────────── LOAD GA4 ────────────────
  function loadGA4(){
    if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.indexOf('G-XX') === 0) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // Configuration avec anonymisation IP (RGPD) et désactivation des publicités par défaut
    gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }

  // ──────────────── LOAD HOTJAR ────────────────
  function loadHotjar(){
    if (!HOTJAR_SITE_ID || HOTJAR_SITE_ID === 0) return;
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:HOTJAR_SITE_ID,hjsv:HOTJAR_VERSION};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  }

  // ──────────────── PUBLIC API ────────────────
  function event(name, params){
    if (!ANALYTICS_ENABLED) {
      // Mode debug local : on log dans la console pour pouvoir tester sans IDs
      try { console.debug('[RFAnalytics] event', name, params || {}); } catch {}
      return;
    }
    if (typeof window.gtag === 'function'){
      window.gtag('event', name, params || {});
    }
  }
  function identify(userId, traits){
    if (!ANALYTICS_ENABLED) return;
    if (typeof window.gtag === 'function' && userId){
      window.gtag('config', GA4_MEASUREMENT_ID, { user_id: String(userId) });
      if (traits && typeof traits === 'object'){
        window.gtag('set', 'user_properties', traits);
      }
    }
    if (typeof window.hj === 'function' && userId){
      window.hj('identify', String(userId), traits || {});
    }
  }
  function page(name){
    if (!ANALYTICS_ENABLED) return;
    if (typeof window.gtag === 'function'){
      window.gtag('event', 'page_view', {
        page_title: name || document.title,
        page_location: location.href,
        page_path: location.pathname,
      });
    }
  }

  /* ──────────────── BANDEAU COOKIES CNIL ────────────────
     Tant que l'utilisateur n'a pas donné son consentement explicite, on ne
     charge ni GA4 ni Hotjar (conformité délibération CNIL du 17 septembre 2020). */
  function getConsent(){
    try { return JSON.parse(localStorage.getItem('junglerenov.cookies.consent') || 'null'); }
    catch { return null; }
  }
  function setConsent(state){
    try {
      localStorage.setItem('junglerenov.cookies.consent', JSON.stringify({
        state: state, // 'accepted' | 'refused'
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));
    } catch {}
  }

  function showCookieBanner(){
    if (document.getElementById('rf-cookie-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'rf-cookie-banner';
    banner.style.cssText = [
      'position:fixed','bottom:16px','left:16px','right:16px','max-width:920px','margin:0 auto',
      'z-index:99998','background:#FFFFFF','border:1px solid #E9E3D3','border-radius:6px',
      'box-shadow:none','padding:20px 24px',
      'font-family:"Komet","Red Hat Display",system-ui,sans-serif','font-size:17px','color:#123A2E',
      'display:flex','gap:20px','align-items:center','flex-wrap:wrap',
    ].join(';');
    banner.innerHTML = `
      <div style="flex:1;min-width:280px;line-height:1.55">
        <strong style="display:block;margin-bottom:4px;font-size:17px">Cookies & confidentialité</strong>
        Nous utilisons des cookies de mesure d'audience (Google Analytics, Hotjar) pour comprendre comment notre site est utilisé et l'améliorer. Aucune donnée n'est revendue. Vous pouvez refuser à tout moment. <a href="page-info.dc.html?p=cookies" style="color:#1F6B3F;text-decoration:underline">En savoir plus</a>.
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" id="rf-cookie-refuse" style="background:#FFFFFF;border:1px solid #E9E3D3;color:#123A2E;padding:10px 18px;border-radius:6px;font-weight:500;font-family:inherit;cursor:pointer;font-size:17px">Refuser</button>
        <button type="button" id="rf-cookie-accept" style="background:#1F6B3F;border:0;color:#FFFFFF;padding:10px 18px;border-radius:6px;font-weight:600;font-family:inherit;cursor:pointer;font-size:17px">Accepter</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('rf-cookie-accept').addEventListener('click', () => {
      setConsent('accepted');
      banner.remove();
      loadGA4();
      loadHotjar();
    });
    document.getElementById('rf-cookie-refuse').addEventListener('click', () => {
      setConsent('refused');
      banner.remove();
    });
  }

  // ──────────────── BOOT ────────────────
  if (ANALYTICS_ENABLED){
    const consent = getConsent();
    if (consent && consent.state === 'accepted'){
      loadGA4();
      loadHotjar();
    } else if (!consent){
      // Pas de choix encore → afficher le bandeau
      if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', showCookieBanner);
      } else {
        showCookieBanner();
      }
    }
    // Si refusé : on ne charge rien, on respecte le choix
  }
  if (ANALYTICS_ENABLED && getConsent() && getConsent().state === 'accepted'){

    // Auto-identification si une session client existe (lit RFStore si dispo)
    try {
      const session = JSON.parse(localStorage.getItem('junglerenov.session') || 'null');
      if (session && session.id){
        identify(session.id, { role: session.role, email_hash: btoa(session.email || '').slice(0, 16) });
      }
    } catch {}

    // Track auto des liens externes
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="http"]');
      if (!a) return;
      const url = a.href;
      if (url.indexOf(location.host) === -1){
        event('outbound_click', { url, link_text: (a.textContent || '').trim().slice(0, 80) });
      }
    });
  }

  window.RFAnalytics = { event, identify, page, enabled: ANALYTICS_ENABLED };
})();
