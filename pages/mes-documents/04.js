
/* JungleRenov — sélecteur de dossier.
   Les pièces et formulaires générés dépendent du type de dossier : le sélecteur
   fixe le contexte, mémorisé pour les autres pages de l'espace. */
(function(){
  var picker = document.getElementById('dos-picker');
  var sel    = document.getElementById('filtre-dossier');
  var hint   = document.getElementById('dos-picker-hint');
  if (!picker || !sel || !window.RFDossiers) return;

  var dossiers = RFDossiers.getActifs();
  // Un seul dossier : le sélecteur n'apporte rien, on ne l'affiche pas.
  if (dossiers.length < 2) return;

  var courant = null;
  try { courant = new URLSearchParams(location.search).get('dossier'); } catch(e){}
  if (!courant) { try { courant = localStorage.getItem('junglerenov.dossierCourant'); } catch(e){} }

  sel.innerHTML = dossiers.map(function(dos){
    var meta = RFDossiers.meta(dos.type);
    return '<option value="' + dos.id + '"' + (dos.id === courant ? ' selected' : '') + '>' +
      meta.titre + ' — ouvert le ' + RFDossiers.fmtDate(dos.transmisLe || dos.createdAt) + '</option>';
  }).join('');

  function apply(){
    var dos = RFDossiers.getById(sel.value);
    if (!dos) return;
    try { localStorage.setItem('junglerenov.dossierCourant', dos.id); } catch(e){}
    if (hint){
      hint.textContent = 'Créé le ' + RFDossiers.fmtDate(dos.transmisLe) +
        ' · ' + RFDossiers.meta(dos.type).titre;
    }
  }
  sel.addEventListener('change', function(){
    apply();
    if (window.RFDocsBind) window.RFDocsBind();
  });
  picker.hidden = false;
  apply();
})();
