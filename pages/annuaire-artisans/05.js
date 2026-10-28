
/* ══ Annuaire polymorphique ═══════════════════════════════════════
   La page est bâtie sur l'annuaire RGE, qui ne concerne que la rénovation
   énergétique : la certification RGE n'est pas exigée pour MaPrimeAdapt', et un
   dossier habitat dégradé mêle des lots RGE et des lots hors RGE. Ce script
   n'intervient que sur un dossier non énergétique. */
(function(){
  function activeDossier(){
    try {
      if (!window.RFDossiers) return null;
      var id = new URLSearchParams(location.search).get('dossier');
      if (!id) { try { id = localStorage.getItem('junglerenov.dossierCourant'); } catch(_){} }
      if (id){
        var byId = RFDossiers.getById(id);
        if (byId) return byId;
      }
      var actifs = (RFDossiers.getActifs && RFDossiers.getActifs()) || [];
      return actifs.length ? actifs[actifs.length - 1] : null;
    } catch (_) { return null; }
  }

  var ICONS = {
    check:  '<path d="m5 12 5 5L20 7"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    alert:  '<path d="M12 9v4M12 17h0"/><circle cx="12" cy="12" r="10"/>',
    pin:    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    shield: '<path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6Z"/>',
  };

  var CONF = {
    autonomie: {
      titre: "Trouver une entreprise d'adaptation qualifiée",
      lead: "Pour <b>MaPrimeAdapt'</b>, la certification RGE n'est pas exigée. C'est votre <b>opérateur AMO habilité par l'Anah</b> qui vous propose une short-list d'entreprises qualifiées en adaptation du logement et qui valide les devis avant le dépôt du dossier.",
      typesLabel: "Travaux d'adaptation",
      types: [
        ['douche_italienne', 'Douche italienne / remplacement baignoire'],
        ['monte_escalier', 'Monte-escalier'],
        ['wc_rehausse', "WC rehaussé et barres d'appui"],
        ['rampe_acces', "Rampe d'accès"],
        ['plateforme_elevatrice', 'Plateforme élévatrice'],
        ['elargissement_passages', 'Élargissement des passages'],
        ['volets_roulants_electriques', 'Volets roulants électriques / motorisation'],
        ['amenagement_parking', 'Aménagement place de stationnement PMR'],
      ],
      cta: 'Demander la short-list à mon opérateur AMO',
      postCta: "La certification RGE ne s'applique pas à l'adaptation du logement : votre opérateur AMO habilité par l'Anah sélectionne les entreprises et valide chaque devis. Nous n'exposons pas d'annuaire RGE ici, il serait hors sujet.",
      tipsTitre: 'Comment choisir la bonne entreprise ?',
      tips: [
        ['check', 'Validation par votre AMO obligatoire', "Votre opérateur habilité par l'Anah valide chaque devis avant le dépôt. Ne vous engagez pas sans son accord."],
        ['wallet', 'Demandez 3 devis comparables', "Même équipement (marque et modèle), même garantie, même délai. Votre AMO vous aide à les comparer."],
        ['shield', 'Vérifiez assurance décennale et RC pro', "L'attestation doit couvrir l'année des travaux. Elle est exigée pour toute demande à l'Anah."],
        ['alert', 'Normes techniques spécifiques', "Monte-escalier : certification EN 81-40. Rampe : pente ≤ 5 %. Douche : receveur extra-plat et barre de maintien."],
        ['pin', 'Privilégiez les entreprises locales', 'Meilleure réactivité à la pose comme au SAV — idéalement dans un rayon de 50 km.'],
      ],
    },
    indigne: {
      titre: 'Trouver vos artisans pour la rénovation lourde',
      lead: "Votre dossier combine une <b>partie énergétique</b> (isolation, chauffage : artisans RGE obligatoires, recherche ci-dessous dans la base ADEME) et une <b>partie mise en sécurité et salubrité</b> (électricité, plomberie, toiture, humidité) où le RGE n'est pas exigé — ces lots sont sourcés et validés par votre opérateur spécialisé habilité par l'Anah.",
      typesLabel: 'Lots énergétiques (recherche RGE)',
      types: [
        ['combles', 'Isolation des combles'],
        ['ite', 'Isolation des murs'],
        ['pac', 'Pompe à chaleur'],
        ['biomasse', 'Chaudière biomasse'],
        ['menuiseries', 'Menuiseries (portes, fenêtres)'],
        ['vmc', 'Ventilation'],
        ['audit_energetique', 'Audit énergétique (RGE Étude)'],
      ],
      horsRge: ['Mise aux normes électriques', 'Mise aux normes plomberie et sanitaires', 'Remise en état de la toiture', 'Traitement humidité et salubrité'],
      cta: 'Rechercher les artisans RGE (lots énergétiques)',
      postCta: "Recherche en direct dans la base officielle ADEME pour les lots énergétiques. Les lots de mise en sécurité et de salubrité ne relèvent pas du RGE : votre opérateur spécialisé vous en fournit la short-list.",
      tipsTitre: 'Comment coordonner vos artisans ?',
      tips: [
        ['check', 'Partie énergétique : RGE obligatoire', "Pour mobiliser MaPrimeRénov' en complément de Ma Prime Logement Décent, les artisans isolation et chauffage doivent être RGE."],
        ['shield', 'Partie salubrité : entreprises assurées', "Hors énergétique, pas d'obligation RGE — mais assurance décennale et RC pro à jour, systématiquement."],
        ['check', 'Validation par votre opérateur spécialisé', "L'opérateur habilité par l'Anah valide chaque devis dans le montage du dossier. Ne signez rien sans son accord."],
        ['wallet', 'Trois devis par lot de travaux', 'Séparez énergétique, électricité, plomberie, toiture : chaque lot se devise et se compare indépendamment.'],
        ['pin', 'Groupez les interventions', "Coordonnées par l'opérateur, les entreprises interviennent en séquence : moins de reprises, et 15 à 20 % d'économies sur le total."],
      ],
    },
  };

  /* Cases de travaux : catalogue partagé, groupé par section. Sur un dossier
     habitat dégradé, seuls les lots RGE sont cherchables dans la base ADEME ;
     les lots de mise en sécurité sont listés à part, sans case, car un geste
     inconnu du mapping RGE viderait les résultats. */
  var SECTION_TITRE = { 'Isolation thermique': 'Isolation' };
  var COURT = {
    combles: 'Combles', toiture_terrasse: 'Toiture-terrasse', ite: 'Murs par l’extérieur', menuiseries: 'Fenêtres, menuiseries',
    pac_aireau: 'PAC air/eau', pac_geothermique: 'PAC géothermique', chauffe_eau_thermo: 'Chauffe-eau thermo.',
    chauffe_eau_solaire: 'Chauffe-eau solaire', chauffage_solaire_combine: 'Solaire combiné', pvt_eau: 'Panneaux hybrides PVT',
    raccordement_reseau: 'Réseau de chaleur', poele_granules: 'Poêle à granulés', poele_buches: 'Poêle à bûches',
    insert_foyer: 'Insert, foyer fermé', biomasse: 'Chaudière biomasse', vmc_df: 'VMC double flux',
    audit_energetique: 'Audit énergétique', depose_cuve_fioul: 'Dépose cuve fioul',
  };
  function majAccordeons(){
    var host = document.getElementById('types-travaux'); if (!host) return;
    host.querySelectorAll('.tacc').forEach(function(acc){
      var n = acc.querySelectorAll('input:checked').length;
      acc.querySelector('.tacc-n').textContent = n ? n + (n > 1 ? ' cochés' : ' coché') : '';
    });
    var chips = document.getElementById('t-chips'), wrap = document.getElementById('t-chips-wrap');
    if (!chips || !wrap) return;
    var on = host.querySelectorAll('input:checked');
    wrap.hidden = !on.length;
    var all = Array.prototype.map.call(on, function(i){
      var l = i.closest('label').getAttribute('data-court');
      return '<span class="t-chip">' + l + '<button type="button" data-unchk="' + i.value + '" aria-label="Retirer ' + l + '">×</button></span>';
    });
    chips.innerHTML = all.join('');
    /* Une seule rangée : les pastilles qui débordent sont résumées par « +n ». */
    var kids = Array.prototype.slice.call(chips.children);
    if (kids.length > 1 && chips.offsetParent){
      var top0 = kids[0].offsetTop, keep = kids.length;
      for (var x = 0; x < kids.length; x++) if (kids[x].offsetTop > top0){ keep = x; break; }
      if (keep < kids.length){
        var more = function(n){ return '<span class="t-chip t-more" title="' + Array.prototype.map.call(on, function(i){ return i.closest('label').getAttribute('data-court'); }).join(', ') + '">+' + n + '</span>'; };
        var shown = keep;
        do { chips.innerHTML = all.slice(0, shown).join('') + more(all.length - shown); shown--; }
        while (shown >= 0 && chips.lastElementChild.offsetTop > chips.firstElementChild.offsetTop);
      }
    }
  }
  document.addEventListener('click', function(e){
    var h = e.target.closest('.tacc-h');
    if (h){ var open = h.getAttribute('aria-expanded') !== 'true'; h.setAttribute('aria-expanded', open ? 'true' : 'false'); document.getElementById(h.getAttribute('aria-controls')).hidden = !open; return; }
    var x = e.target.closest('[data-unchk]');
    if (x){
      var cb = document.querySelector('#types-travaux input[value="' + x.getAttribute('data-unchk') + '"]');
      if (cb){ cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  document.addEventListener('change', function(e){ if (e.target.closest && e.target.closest('#types-travaux')) majAccordeons(); });
  window.addEventListener('resize', function(){ clearTimeout(window.__jrChipT); window.__jrChipT = setTimeout(majAccordeons, 120); });
  document.addEventListener('click', function(e){ if (e.target.closest('#filters-toggle')) setTimeout(majAccordeons, 0); });

  /* Cases de travaux : catalogue partagé, un accordéon dense par section ; fermés
     par défaut sauf ceux qui contiennent une case cochée. Sur un dossier habitat
     dégradé, seuls les lots RGE sont cherchables ; les lots de mise en sécurité
     sont listés à part, sans case. */
  function renderTypes(type, prof){
    var host = document.getElementById('types-travaux');
    var cat = window.RFTravauxCatalog;
    if (!host || !cat) return null;
    var items = cat.get(type);
    var cherchables = items.filter(function(t){ return t.rge !== false; });
    var horsRge = items.filter(function(t){ return t.rge === false; });
    var choisis = (prof && prof.travaux) || [];
    if (!choisis.length){ try { var pr = JSON.parse(localStorage.getItem('junglerenov.profile') || '{}'); choisis = pr.travaux || (pr.diagnostic && pr.diagnostic.travaux) || []; } catch(_){} }

    var bySection = [];
    cherchables.forEach(function(t){
      var grp = null;
      for (var i = 0; i < bySection.length; i++) if (bySection[i].s === t.section) grp = bySection[i];
      if (!grp){ grp = { s: t.section, items: [] }; bySection.push(grp); }
      grp.items.push(t);
    });
    host.innerHTML = bySection.map(function(grp, gi){
      var anyOn = grp.items.some(function(t){ return choisis.indexOf(t.id) !== -1; });
      var id = 'tacc-b-' + gi;
      return '<div class="tacc"><button type="button" class="tacc-h" aria-expanded="' + anyOn + '" aria-controls="' + id + '">' +
        '<span class="tacc-t">' + (SECTION_TITRE[grp.s] || grp.s) + '</span><span class="tacc-n"></span><span class="tacc-c" aria-hidden="true"></span></button>' +
        '<div class="tacc-b" id="' + id + '"' + (anyOn ? '' : ' hidden') + '>' +
        grp.items.map(function(t){
          var on = choisis.indexOf(t.id) !== -1, court = COURT[t.id];
          return '<label class="checkbox' + (court ? '' : ' wrap') + '" data-court="' + (court || t.label) + '" title="' + t.label + '"><input type="checkbox" value="' + t.id + '"' + (on ? ' checked' : '') + ' /> ' + (court || t.label) + '</label>';
        }).join('') + '</div></div>';
    }).join('');

    var extraId = 'types-hors-rge';
    var prev = document.getElementById(extraId);
    if (prev) prev.remove();
    if (horsRge.length){
      var extra = document.createElement('div');
      extra.id = extraId;
      extra.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px solid var(--line)';
      extra.innerHTML = '<div class="field-label" style="margin-bottom:6px">Lots hors RGE — via votre opérateur</div>' +
        horsRge.map(function(t){ return '<div style="font-size:17px;color:#567166;padding:4px 0">' + t.label + '</div>'; }).join('');
      host.parentNode.appendChild(extra);
    }
    majAccordeons();

    var LIB = {};
    items.forEach(function(t){ LIB[t.id] = t.label; });
    return LIB;
  }

  function run(){
    var dos = activeDossier();
    var typeCourant = (dos && dos.type) || 'energetique';
    var LIB_TYPES = renderTypes(typeCourant, dos && dos.profile);
    var conf = dos && CONF[dos.type];
    if (!conf){
      // Dossier énergétique ou aucun dossier : seule la liste des travaux est
      // reconstruite, tout le reste de la page est inchangé.
      reattacher(LIB_TYPES);
      return;
    }

    var h1 = document.querySelector('main h1');
    if (h1) h1.textContent = conf.titre;
    var lead = document.querySelector('main .lead');
    if (lead) lead.innerHTML = conf.lead;

    var lbl = document.getElementById('types-label');
    if (lbl) lbl.textContent = conf.typesLabel;

    reattacher(LIB_TYPES);

    // Libellés « Pour les travaux » : les codes MPA ne sont pas connus du script
    // d'origine, on réécrit après lui.
    var LIB = {};
    conf.types.forEach(function(t){ LIB[t[0]] = t[1]; });
    function majWorksList(){
      var el = document.getElementById('works-list');
      if (!el) return;
      var checked = Array.prototype.map.call(
        document.querySelectorAll('#types-travaux .checkbox input:checked'), function(c){ return LIB[c.value] || c.value; });
      el.textContent = checked.length ? checked.join(', ') : 'à définir';
    }
    // Les tags de certification RGE ne concernent pas ces dispositifs : on
    // relance le rendu d'origine pour purger ceux calculés avant la refonte.
    if (window.RFAnnuaireRefresh) window.RFAnnuaireRefresh();
    majWorksList();

    var ctaLabel = document.getElementById('cta-open-label');
    if (ctaLabel) ctaLabel.textContent = conf.cta;
    var post = document.getElementById('post-cta-txt');
    if (post) post.textContent = conf.postCta;

    var tipsTitre = document.getElementById('tips-titre');
    if (tipsTitre) tipsTitre.textContent = conf.tipsTitre;
    var grid = document.getElementById('tips-grid');
    if (grid){
      grid.innerHTML = conf.tips.map(function(t){
        return '<div class="tip"><div class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          (ICONS[t[0]] || ICONS.check) + '</svg></div><h3>' + t[1] + '</h3><p>' + t[2] + '</p></div>';
      }).join('');
    }

    // MaPrimeAdapt' : lancer une recherche RGE n'aurait aucun sens — on explique
    // le vrai chemin (short-list de l'opérateur AMO) au lieu de requêter l'ADEME.
    if (dos.type === 'autonomie'){
      window.RFAnnuaireSearchOverride = function(){
          var res = document.getElementById('artisans-results');
          var list = document.getElementById('artisans-list');
          if (!res || !list) return;
          res.hidden = false;
          var head = document.getElementById('res-head'); if (head) head.hidden = true;
          var src = document.getElementById('res-source');
          if (src) src.hidden = true;
          list.innerHTML = '<div class="empty-state" style="align-items:flex-start;text-align:left">' +
            "<h3>Votre short-list passe par votre opérateur AMO</h3>" +
            "<p style='max-width:none'>Il est habilité par l'Anah, connaît les entreprises d'adaptation de votre département et valide les devis avant le dépôt du dossier — son forfait est pris en charge à 100 %. " +
            "Nous vous mettons en relation dès que votre rendez-vous est planifié : retrouvez la prochaine action dans " +
            "<a href='dashboard.dc.html' style='color:var(--action);font-weight:600'>votre tableau de bord</a>.</p>" +
            '</div>';
      };
    }
  }

  /* Les cases régénérées ont perdu les écouteurs posés au chargement. */
  function reattacher(LIB){
    var host = document.getElementById('types-travaux');
    if (!host) return;
    function majWorks(){
      var el = document.getElementById('works-list');
      if (!el || !LIB) return;
      var checked = Array.prototype.map.call(
        host.querySelectorAll('.checkbox input:checked'), function(c){ return LIB[c.value] || c.value; });
      el.textContent = checked.length ? checked.join(', ') : 'à définir';
    }
    host.querySelectorAll('.checkbox input').forEach(function(c){
      c.addEventListener('change', function(){
        if (window.RFAnnuaireRefresh) window.RFAnnuaireRefresh();
        majWorks();
      });
    });
    if (window.RFAnnuaireRefresh) window.RFAnnuaireRefresh();
    majWorks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
