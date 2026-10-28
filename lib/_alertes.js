/* ══════════════════════════════════════════════════════════════════
   JungleRenov — affichage du bloc `alertes` du moteur de calcul

   Le moteur expose depuis le référentiel du 1er septembre 2026 :
     alertes.gestesHorsParcoursGeste — gestes cochés qui n'ouvrent plus
                                        de droit isolé, avec leur date
     alertes.auditManquant          — ampleur sans audit dans la sélection
     alertes.gainClassesHypothese   — le plafond repose sur l'hypothèse basse
     alertes.tvaReduite             — TTC à 5,5 % ou à 10 %
     alertes.guichetOuvert          — guichet MaPrimeRénov'
     energie.hypothese              — le prix du kWh est une hypothèse
     referentiel                    — version et source des barèmes

   Sans ce module, un utilisateur qui coche l'isolation des combles seule
   reçoit 0 € sans aucune explication : le refus de chiffrer devient un
   blocage silencieux, plus dangereux que le bug qu'il corrige.

   API : RFAlertes.rendre(resultat, conteneur)
         RFAlertes.piedReferentiel(resultat) → chaîne
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var LIBELLES_GESTES = {
    combles: "l'isolation des combles",
    toiture_terrasse: "l'isolation de la toiture-terrasse",
    menuiseries: 'le remplacement des fenêtres',
    vmc_df: 'la ventilation double flux',
    chauffe_eau_thermo: 'le chauffe-eau thermodynamique',
    chauffe_eau_solaire: 'le chauffe-eau solaire',
    chauffage_solaire_combine: 'le chauffage solaire combiné',
    pvt_eau: 'le solaire hybride',
    poele_buches: 'le poêle à bûches',
    poele_granules: 'le poêle à granulés',
    insert_foyer: 'l\u2019insert de cheminée',
    ite: "l'isolation des murs par l'extérieur",
    biomasse: 'la chaudière biomasse',
  };

  function injectStyles() {
    if (document.getElementById('rf-alertes-styles')) return;
    var css = [
      '.rf-alertes{display:flex;flex-direction:column;gap:10px;max-width:720px;margin:22px 0}',
      '.rf-alertes:empty{display:none}',
      '.rf-alerte{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-radius:6px;font-size:17px;line-height:1.55;text-wrap:pretty}',
      '.rf-alerte svg{flex:0 0 auto;width:18px;height:18px;margin-top:1px}',
      '.rf-alerte strong{display:block;margin-bottom:3px;font-size:17px}',
      '.rf-alerte--info{background:var(--slate-50,#F4F1E8);border:1px solid var(--border,#E9E3D3);color:var(--slate-700,#123A2E)}',
      '.rf-alerte--info svg{color:var(--slate-500,#123A2E)}',
      '.rf-alerte--attention{background:#E9E3D3;border:1px solid #E9E3D3;color:#123A2E}',
      '.rf-alerte--attention strong{color:#123A2E}',
      '.rf-alerte--attention svg{color:#123A2E}',
      '.rf-alerte--bloquant{background:#FEE2E2;border:1px solid #FEE2E2;color:#991B1B}',
      '.rf-alerte--bloquant strong{color:#991B1B}',
      '.rf-alerte--bloquant svg{color:#991B1B}',
      '.rf-referentiel{max-width:720px;margin:18px 0 0;font-size:17px;color:var(--slate-500,#123A2E);text-align:center;line-height:1.55}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'rf-alertes-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  var ICO_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-5M12 8h.01"/></svg>';
  var ICO_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';

  function bloc(ton, titre, texte) {
    var ico = (ton === 'info') ? ICO_INFO : ICO_WARN;
    return '<div class="rf-alerte rf-alerte--' + ton + '">' + ico
      + '<div><strong>' + titre + '</strong>' + texte + '</div></div>';
  }

  root.RFAlertes = {
    /* Construit la liste des messages à afficher pour un résultat donné. */
    messages: function (r) {
      if (!r) return [];
      var out = [];
      var a = r.alertes || {};

      // Guichet fermé : rien d'autre ne compte.
      if (a.guichetOuvert === false) {
        out.push(bloc('bloquant', 'Guichet MaPrimeRénov\u2019 fermé',
          "Les demandes ne sont pas instruites actuellement. Votre estimation reste valable, mais le dépôt devra attendre la réouverture du guichet."));
      }

      // Refus de chiffrer : le motif doit être dit, pas deviné.
      if (r.eligible === false && r.motif) {
        out.push(bloc('attention', 'Estimation impossible',
          (r.message || r.motif) + ' Sans cette information, nous préférons ne rien afficher plutôt qu\u2019un montant faux.'));
      }

      // Gestes sortis du parcours par geste.
      var hors = a.gestesHorsParcoursGeste || [];
      if (hors.length) {
        var noms = hors.map(function (g) {
          return (LIBELLES_GESTES[g.geste] || g.geste) + ' (depuis le ' + g.depuis + ')';
        });
        out.push(bloc('attention',
          hors.length > 1 ? 'Ces travaux n\u2019ouvrent plus de droit seuls' : 'Ce geste n\u2019ouvre plus de droit seul',
          'Le décret du 25 août 2026 a retiré du parcours « par geste » : ' + noms.join(', ')
          + '. Ces travaux restent finançables, mais uniquement dans une <b>rénovation d\u2019ampleur</b> — '
          + 'au moins deux gestes et un gain de deux classes énergétiques, avec audit.'));
      }

      // Audit manquant en rénovation d'ampleur.
      if (a.auditManquant) {
        out.push(bloc('attention', 'Audit énergétique requis',
          "La rénovation d'ampleur suppose un audit énergétique réglementaire, qui certifie le gain de classes. "
          + "Il est lui-même finançable. Sans lui, le dossier ne peut pas être déposé en parcours accompagné."));
      }

      // Plafond assis sur une hypothèse, pas sur un audit.
      if (a.gainClassesHypothese) {
        out.push(bloc('info', 'Gain énergétique : hypothèse basse retenue',
          "Faute de gain de classes déclaré, nous retenons l'hypothèse la plus prudente — deux classes, "
          + "soit un plafond de dépense de 30 000 € HT. Un audit établissant trois classes ou plus porterait "
          + "ce plafond à 40 000 € HT, et donc votre aide à la hausse."));
      }

      // TVA à 10 % : le reste à charge est plus élevé qu'au taux réduit.
      if (a.tvaReduite === false) {
        out.push(bloc('info', 'TVA à 10 %, et non 5,5 %',
          "Votre situation n'ouvre pas le taux réduit de 5,5 % : le coût TTC et le reste à charge "
          + 'sont calculés à 10 %.'));
      }

      // Le prix du kWh est une hypothèse de travail.
      if (r.energie && r.energie.hypothese && r.energie.economieAn > 0) {
        var px = r.energie.prixKwhRetenu;
        out.push(bloc('info', 'Économie annuelle : une estimation',
          "Elle repose sur un prix de l'énergie de " + String(px).replace('.', ',') + ' \u20ac/kWh'
          + " et sur la consommation moyenne de votre classe énergétique. Votre facture réelle dépendra "
          + 'de votre contrat, de vos usages et du climat.'));
      }

      // CEE : fourchette, jamais un montant unique.
      if (r.aides && r.aides.cee && r.aides.cee.unique === false && r.aides.cee.max > r.aides.cee.min) {
        var fe = function (n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); };
        out.push(bloc('info', 'Prime CEE : une fourchette',
          'Entre ' + fe(r.aides.cee.min) + ' et ' + fe(r.aides.cee.max) + ", selon l'organisme qui verse la prime — "
          + "le montant exact figure sur l'offre à signer avant le début des travaux. Le total retient la borne basse."));
      }
      // Habitat dégradé : part énergétique supposée (50 %) faute de ventilation.
      var mc = r.aide && r.aide.cumuls && r.aide.cumuls.mprCumulableDetail;
      if (mc && mc.partEnergetiqueHypothese) {
        out.push(bloc('attention', 'Part énergétique supposée',
          "Faute de détail, nous retenons que la moitié du chantier concerne l'énergie (isolation, chauffage, ventilation, menuiseries). "
          + "Indiquez la part réelle pour que l'aide MaPrimeRénov' cumulable soit juste."));
      }
      // Copropriété : montant de travaux estimé, pas voté.
      var cp = r.aides && r.aides.mprCopro;
      if (cp && cp.coutCopro && cp.coutCopro.estime) {
        out.push(bloc('attention', 'Montant des travaux de l\u2019immeuble estimé',
          "Estimation, à ajuster avec le montant voté en assemblée générale ou devisé : c'est lui qui commande toute l'aide collective."));
      }

      // Le CEE n'est pas cumulable avec le parcours accompagné.
      if (r.aides && r.aides.mpr && r.aides.mpr.isRenovAmpleur
          && r.aides.cee && r.aides.cee.total === 0) {
        out.push(bloc('info', 'CEE non cumulable ici',
          "Les certificats d'économies d'énergie ne se cumulent pas avec MaPrimeRénov' "
          + "parcours accompagné. Ils apparaissent donc à 0 € — ce n'est pas un oubli."));
      }

      return out;
    },

    /* Rend les messages dans le conteneur indiqué (vidé au préalable). */
    rendre: function (r, conteneur) {
      var el = (typeof conteneur === 'string') ? document.getElementById(conteneur) : conteneur;
      if (!el) return 0;
      injectStyles();
      var msgs = this.messages(r);
      el.className = 'rf-alertes';
      el.innerHTML = msgs.join('');
      return msgs.length;
    },

    /* Pied de page : version du référentiel, pour que la date affichée soit
       celle des barèmes et non celle de la visite. */
    piedReferentiel: function (r) {
      var ref = (r && r.referentiel) || (root.RFCompute && root.RFCompute.REFERENTIEL);
      if (!ref) return '';
      return 'Barèmes en vigueur au ' + ref.version.split('-').reverse().join('/')
        + ' \u00b7 source : ' + ref.source
        + '. Estimation indicative, non contractuelle.';
    },

    rendreReferentiel: function (r, conteneur) {
      var el = (typeof conteneur === 'string') ? document.getElementById(conteneur) : conteneur;
      if (!el) return;
      injectStyles();
      el.className = 'rf-referentiel';
      el.textContent = this.piedReferentiel(r);
    },
  };
})(window);
