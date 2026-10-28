/* RénoFacile — gate d'accès aux pages connectées (client).
   À inclure APRÈS _storage.js sur chaque page protégée :
     <script src="_storage.js"></script>
     <script src="_auth_guard.js"></script>

   Logique :
   1. Pas de session  → redirection vers login.html avec ?return=<url>
   2. Session admin/super_admin → accès libre (les admins peuvent inspecter les pages clients)
   3. Session cliente → accès libre

   Le service est gratuit pour le particulier : aucune condition financière
   ne conditionne l'accès à une page ni à une étape du parcours. */

/* ══════════════════════════════════════════════════════════════════
   ENVIRONNEMENT DE DÉVELOPPEMENT LOCAL
   Seul le poste du développeur est reconnu, et il ne bénéficie d'aucun
   privilège : ni session injectée, ni profil fictif, ni compte admin.
   Aucun nom d'hôte distant n'ouvre d'accès — une URL de préproduction
   publique est une URL publique. Pour partager un déploiement avec
   l'équipe, utiliser la protection par mot de passe de la plateforme
   d'hébergement, jamais un mode dégradé embarqué dans le code livré.

   La règle appartient à `_demo_mode.js` ; le repli ci-dessous garde ce
   fichier autonome sur les pages qui ne chargent pas le helper — il doit
   rester aligné sur lui.
   ══════════════════════════════════════════════════════════════════ */
function rfIsLocalDevFallback(){
  try {
    var host = (location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '' || /\.localhost$/.test(host);
  } catch (_) { return false; }
}
/* On ne redéclare PAS `rfIsDemoStaging` : une déclaration de fonction au niveau
   global écraserait celle de `_demo_mode.js` sur les pages qui chargent les deux. */
if (typeof window.rfIsDemoStaging !== 'function') window.rfIsDemoStaging = rfIsLocalDevFallback;
if (!window.RFDemoMode) window.RFDemoMode = { isStaging: window.rfIsDemoStaging };

(function(){
  // --- Helpers ---------------------------------------------------
  function isAdminUser(user){
    return user && (user.role === 'admin' || user.role === 'super_admin');
  }

  // --- Redirection vers login ------------------------------------
  function redirectToLogin(){
    const target = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = 'login.html?return=' + target;
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
