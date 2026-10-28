/* JungleRenov — widget « Aides estimées » de la barre latérale : lit la source unique JR.totaux(JR.dossierCourant()).
   Un total = un dossier ; aucun calcul local. Remplace les anciens 02.js des pages. */
(function(){
  function refresh(){
    if (!window.JR || !JR.dossierCourant) return;
    var d = JR.dossierCourant(), t = JR.totaux(d);
    var valEl = document.getElementById('rf-aides-val'), subEl = document.getElementById('rf-aides-sub');
    var eur = function(n){ return Math.round(n || 0).toLocaleString('fr-FR') + '\u202f€'; };
    if (valEl) valEl.textContent = d ? eur(t.aides) : '—';
    if (subEl) subEl.textContent = d ? (t.base === 'devis' ? 'Sur vos devis' : 'Aides forfaitaires') : 'Simulation à compléter';
    var U = window.RFUser, n = document.getElementById('rf-me-name'), av = document.getElementById('rf-me-av');
    if (U && n) n.textContent = (U.getFullName && U.getFullName()) || 'Mon compte';
    if (U && av) av.textContent = (U.getInitials && U.getInitials()) || 'JR';
  }
  var tries = 0;
  (function wait(){ if (document.getElementById('rf-aides-val') || tries++ > 50) return refresh(); setTimeout(wait, 100); })();
  setTimeout(refresh, 800);
  window.addEventListener('jr:dossier', refresh);
})();
