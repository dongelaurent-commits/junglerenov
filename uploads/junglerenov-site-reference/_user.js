/* ══════════════════════════════════════════════════════════════════
   RénoFacile — Helper d'identité utilisateur
   Source unique pour récupérer prénom, nom, salutation et initiales.
   ══════════════════════════════════════════════════════════════════ */
(function(root){
  'use strict';

  function parse(key){
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (_) { return {}; }
  }

  /* Priorité : profile > user > session. Les trois sources coexistent
     selon le parcours emprunté (tunnel, login, démo). */
  function readIdentity(){
    var profile = parse('renofacile.profile');
    var user    = parse('renofacile.user');
    var session = parse('renofacile.session');
    var pick = function(a, b){
      return profile[a] || profile[b] || user[a] || user[b] || session[a] || session[b] || '';
    };
    return {
      firstname: pick('firstname', 'prenom'),
      lastname:  pick('lastname', 'nom'),
      email:     pick('email', 'mail')
    };
  }

  root.RFUser = {
    getIdentity: readIdentity,

    /* "Sophie Marin" | "Sophie" | "" selon ce qui est disponible. */
    getFullName: function(){
      var id = readIdentity();
      return [id.firstname, id.lastname].filter(Boolean).join(' ').trim();
    },

    /* "Bonjour Sophie Marin" | "Bonjour Sophie" | "Bonjour" — jamais « Bonjour vous ». */
    getGreeting: function(){
      var name = this.getFullName();
      return name ? 'Bonjour ' + name : 'Bonjour';
    },

    getFirstName: function(){ return readIdentity().firstname || ''; },

    /* "SM" pour les avatars, "R" en dernier recours. */
    getInitials: function(){
      var id = readIdentity();
      var i = ((id.firstname[0] || '') + (id.lastname[0] || '')).toUpperCase();
      return i || 'R';
    }
  };
})(window);
