/* ══════════════════════════════════════════════════════════════════
   RénoFacile — détection de l'environnement de développement local

   SEUL le poste du développeur est reconnu. Aucun nom d'hôte distant
   n'ouvre d'accès : une URL de préproduction publique est une URL
   publique. Pour partager un déploiement avec l'équipe, utiliser la
   protection par mot de passe de la plateforme d'hébergement, jamais
   un mode dégradé embarqué dans le code livré.

   Ce fichier existe pour que les pages PUBLIQUES (tunnels de diagnostic)
   disposent de la règle SANS charger le guard d'authentification.
   `_auth_guard.js` porte la même règle en repli : les deux peuvent
   cohabiter sur une même page sans effet de bord.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  root.rfIsDemoStaging = function rfIsDemoStaging(){
    try {
      var host = (location.hostname || '').toLowerCase();
      return host === 'localhost' || host === '127.0.0.1' || host === '' || /\.localhost$/.test(host);
    } catch (_) { return false; }
  };

  root.RFDemoMode = { isStaging: root.rfIsDemoStaging };
})(window);
