/* JungleRenov — gate d'accès aux pages connectées (client).
   À inclure APRÈS _storage.js sur chaque page protégée :
     <script src="_storage.js"></script>
     <script src="_auth_guard.js"></script>

   Logique :
   1. Pas de session  → redirection vers login.dc.html avec ?return=<url>
   2. Session admin/super_admin → accès libre (les admins peuvent inspecter les pages clients)
   3. Session cliente → accès libre

   Le service est gratuit pour le particulier : aucune condition financière
   ne conditionne l'accès à une page ni à une étape du parcours. */


(function(){
  // --- Helpers ---------------------------------------------------
  function isAdminUser(user){
    return user && (user.role === 'admin' || user.role === 'super_admin');
  }

  // --- Redirection vers login ------------------------------------
  function redirectToLogin(){
    const target = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = 'login.dc.html?return=' + target;
  }

  // --- Gate ------------------------------------------------------
  /* Le seul motif de blocage est l'absence de session. Il n'existe plus
     aucune condition de paiement ni d'échéance. */
  function runGate(){
    if (!window.RFStore){
      // _storage.js pas chargé — ne bloque pas mais log
      console.warn('[auth-guard] RFStore indisponible — gate désactivé');
      return;
    }
    const user = RFStore.getCurrentUser ? RFStore.getCurrentUser() : null;
    if (!user){ redirectToLogin(); return; }
    // Les admins ont accès libre aux pages clientes pour QA
    if (isAdminUser(user)) return;
  }

  // Exécute au plus tôt (DOM peut ne pas être prêt encore)
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', runGate);
  } else {
    runGate();
  }
})();
