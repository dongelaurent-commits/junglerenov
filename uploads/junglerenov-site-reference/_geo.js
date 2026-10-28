/* ══════════════════════════════════════════════════════════════════
   RénoFacile — Helper de couverture géographique
   Source unique pour déterminer si un code postal est dans une zone
   couverte (Grand Est), roadmap (ouverture A2) ou hors périmètre.
   ══════════════════════════════════════════════════════════════════ */
(function(root){
  'use strict';

  var ZONES_ACTIVES = {
    'Grand Est': ['08','10','51','52','54','55','57','67','68','88']
  };

  var ZONES_ROADMAP = {
    'Bourgogne-Franche-Comté': ['21','25','39','58','70','71','89','90'],
    'Hauts-de-France':         ['02','59','60','62','80'],
    'Île-de-France':           ['75','77','78','91','92','93','94','95']
  };

  var OUVERTURE_ROADMAP = 'T3 2026';

  function depFromCP(cp){
    if (!cp) return '';
    var s = String(cp).trim();
    // Corse : 20xxx se répartit entre 2A (Corse-du-Sud) et 2B (Haute-Corse).
    if (/^20/.test(s)) {
      var num = parseInt(s.substring(2, 5), 10);
      return (num >= 200) ? '2B' : '2A';
    }
    return s.substring(0, 2);
  }

  function findInZones(dep, zones){
    for (var region in zones) {
      if (zones[region].indexOf(dep) !== -1) return region;
    }
    return null;
  }

  root.RFGeo = {
    OUVERTURE_ROADMAP: OUVERTURE_ROADMAP,
    ZONES_ACTIVES: ZONES_ACTIVES,
    ZONES_ROADMAP: ZONES_ROADMAP,

    /* Extrait un code postal d'une chaîne libre (label d'adresse BAN). */
    extractCP: function(text){
      var m = /\b\d{5}\b/.exec(String(text || ''));
      return m ? m[0] : '';
    },

    /* → { status, region, ouverture }
       status : 'active' | 'waitlist' | 'blocked' | 'unknown' */
    check: function(codePostal){
      var dep = depFromCP(codePostal);
      if (!dep || dep.length < 2) return { status: 'unknown', region: null };

      var active = findInZones(dep, ZONES_ACTIVES);
      if (active) return { status: 'active', region: active };

      var waitlist = findInZones(dep, ZONES_ROADMAP);
      if (waitlist) return { status: 'waitlist', region: waitlist, ouverture: OUVERTURE_ROADMAP };

      return { status: 'blocked', region: 'Hors zone active' };
    },

    /* Enregistre un lead : { email, codePostal, region, tunnel, consentement } */
    addToWaitlist: function(payload){
      try {
        if (!payload || !payload.email || !payload.consentement) return false;
        var list = JSON.parse(localStorage.getItem('renofacile.waitlist') || '[]');
        list.push({
          email:        payload.email,
          codePostal:   payload.codePostal || '',
          region:       payload.region || '',
          tunnel:       payload.tunnel || '',
          consentement: !!payload.consentement,
          ts:           Date.now()
        });
        localStorage.setItem('renofacile.waitlist', JSON.stringify(list));
        return true;
      } catch (_) { return false; }
    },

    getWaitlist: function(){
      try { return JSON.parse(localStorage.getItem('renofacile.waitlist') || '[]'); }
      catch (_) { return []; }
    },

    bannerText: function(status, region){
      if (status === 'waitlist') {
        return 'Votre région (' + region + ') n\'est pas encore active. Vous pouvez simuler vos aides gratuitement — ouverture prévue ' + OUVERTURE_ROADMAP + '.';
      }
      if (status === 'blocked') {
        return 'RénoFacile accompagne actuellement les habitants du Grand Est. Simulation accessible en mode découverte — vous pouvez rejoindre la liste d\'attente pour être prévenu·e à l\'ouverture de votre région.';
      }
      return '';
    }
  };
})(window);
