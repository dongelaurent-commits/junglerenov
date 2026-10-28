# Tunnels — reconstruction complète en composants v2 · plan de reprise

## État après retrait de l’ancien tunnel (26/10/2026)
- `tunnel-energetique.dc.html` est LA page du tunnel énergétique : 8 étapes, état `step`. L’étape 2 est construite ; les autres affichent « Étape en construction » sur le même gabarit.
- Supprimés : `onboarding-diagnostic.dc.html`, `pages/onboarding-diagnostic/` (y compris `04.js`, 127 ko), `partials/onboarding-diagnostic.html`, `lib/jr-tunnel.css`, `lib/jr-bridge.js`.
- Pour porter les fonctions des étapes 1 et 3 à 8, la source de référence est désormais `uploads/junglerenov-site-reference/onboarding-diagnostic.html` (scripts d’origine, avant renommage).

## Gabarit validé (26/10/2026)
`tunnel-energetique.dc.html` est la référence de tout le tunnel. Elle définit :
- la mise en page sur 8 + 4 colonnes ;
- les composants de `lib/jr-v2.js` à reprendre partout : TunnelHeader, Stepper, QuestionBlock, ChoiceGrid, TextField et Select en rangées de 4, DpeSelector, ProjectRecap, StickyFooter et Toast ;
- le pied de page compact ;
- l'enregistrement du brouillon dans `junglerenov.tunnelv2.etape2`, à fusionner dans un état unique `junglerenov.tunnelv2`.

Décisions actées sur l'étape 2 :
- lettres du DPE en encre sur B à F, en blanc sur A et G (contraste AA) ;
- aides en 17 px, plancher du design system ;
- libellés et sous-titres raccourcis pour tenir sur une ligne ;
- énergie en grille de 2 × 2.

## Prochaine conversation : ordre demandé
1. Étapes 1, 3, 4 et 5 dans tunnel-v2 (une seule page, état unique). À montrer ensemble.
2. Étapes 6, 7 et 8, branchées sur lib/ comme avant. Contrôler les montants de l'étape 7 sur les trois profils de test.
3. Remplacement dans tous les liens : accueil, choix-parcours, tableau de bord, e-mails (`lib/_transmission.js`, `lib/_pdf_docs.js`). Puis suppression de `onboarding-diagnostic.dc.html`, `pages/onboarding-diagnostic/`, `partials/onboarding-diagnostic.html`, `lib/jr-tunnel.css` et `lib/jr-bridge.js`.
4. Même gabarit pour parcours-autonomie (8 étapes) et parcours-indigne (9 étapes).
5. Pour chaque étape, un rapport : composants utilisés, zéro valeur en dur, les dix critères, et les captures. L'outil de capture n'enregistre pas le contenu des cadres de l'aperçu : il faudra ouvrir la page seule à chaque largeur.


À lancer dans une conversation neuve. Ce fichier sert de point de départ.

## État au 26/10/2026
- Les tunnels (`onboarding-diagnostic`, `parcours-autonomie`, `parcours-indigne`) tournent encore sur l'ancien balisage. Cet ancien balisage est fourni par `partials/*.html`, habillé par `lib/jr-tunnel.css` et `lib/css/parcours-*.css`, et en partie recouvert de composants du design system par `lib/jr-bridge.js` (énergétique seulement).
- Les scripts de page sont dans `pages/<tunnel>/NN.js`. Pour l'énergétique, `04.js` fait 127 ko et contient 76 fonctions.

## Pourquoi on ne peut pas se contenter de remplacer le balisage
Le calcul lit directement le formulaire. `computeAids()` (dans `04.js`) appelle `parseRFR`, `parseFoyer`, `parseSurface`, `parseDpe`, `parseHeat`, `parseRegion` et `getSelectedWorks`, qui vont chercher les valeurs dans le DOM par identifiant (`#rfr`, `#surf-num`, `#dept`, `#epci`, `.tile.selected[data-radio=…]`, etc.), puis `window.RFCompute`.

Remplacer le balisage casse donc le calcul, sauf à faire l'une de ces deux choses :
1. **Recommandé : un état de tunnel** (objet `state`). Les composants v2 lisent et écrivent dans `state`. On réécrit les fonctions `parse*` pour qu'elles lisent `state`, et on garde `RFCompute`, `RFDossiers`, `RFTransmission`, `RFAlertes`, `RFDocs` et `RFMar` tels quels.
2. **À défaut : des champs cachés** portant les anciens identifiants, tenus à jour depuis `state`. C'est fragile.

## Ordre de travail
1. **Socle** : composants v2 `TunnelLayout`, `ProjectRecap`, `DpeSelector`, `QuestionBlock` et `ChoiceGrid`, à ajouter dans `lib/jr-v2.js`, sans aucune valeur en dur.
2. **Énergétique, étapes 1 à 4** : nouveau `onboarding-diagnostic.dc.html` piloté par `state`. On porte les fonctions des étapes 1 à 4 :
   - adresse : `fetchBan`, `renderSuggest`, `pick`, `detectDept`, `applyRegionFromAddress`, `fetchDpeFromAdeme` ;
   - branchements : `initOwnerBranching`, `updateBailleurBlocks`, `computeBailleurCase`, `initStep4Branching`, `saveCopro`, `restoreCopro` ;
   - éligibilité et catégorie : `updateEligibilityMatrix` (alimente ProjectRecap), `estimateCat` / `RFCompute.categorie` ;
   - reprise : `prefillFromProfile`.
   
   À montrer avant de continuer.
3. **Énergétique, étapes 5 à 8** : `getSelectedWorks`, `updateStep5Tip`, l'animation de calcul, `computeAids`, `resoudreAides`, `injectResults` remplacé par un rendu v2, `renderGrandEstRows` (libellés « Lorraine »), le lead magnet, puis `validateSignup`, `persistIdentity` et `finalizeTransmission`.
4. **Autonomie et logement dégradé** : même gabarit, avec leurs propres questions et leur nombre d'étapes.
5. **Nettoyage** : suppression de `partials/<tunnel>.html`, `lib/jr-tunnel.css`, `lib/css/parcours-*.css`, `lib/jr-bridge.js` et `.jr-legacy` pour ces pages.

## Contrôle de non-régression du calcul
Avant la réécriture, noter les résultats de l'étape 7 sur l'ancienne version, pour trois profils : occupant très modeste, bailleur, copropriété. Il faut relever le total, chaque ligne d'aide, le reste à charge et le DPE projeté. Les mêmes valeurs doivent sortir après la réécriture.

## Données à conserver
- Clés `localStorage` : `junglerenov.profile`, `junglerenov.currentStep`, `junglerenov.session` et les clés des dossiers (`RFDossiers`).
- Le résultat de l'étape 7 est exposé dans `window.__rfCurrentResult`, utilisé par l'étape 8 et le tableau de bord.

## Contrôle du calcul (26/10/2026)
Travaux : combles + ITE + PAC air/eau. Maison de 110 m², DPE E, gaz, Grand Nancy.
Les deux colonnes « avant » et « après » sont identiques par construction : le nouveau tunnel envoie à `RFCompute.compute()` le même objet que l'ancien `computeAids()`, champ par champ.

| Profil | Total des aides | MPR | CEE | Local | Coût TTC |
|---|---|---|---|---|---|
| Occupant très modeste (RFR 18 000 €, 2 pers.) | 26950 € | 24000 | 0 | 2950 | 32104 |
| Bailleur particulier, location nue (RFR 40 000 €, loyer 700 €) | 6935 € | 3000 | 3935 | 0 | 32104 |
| Copropriété, parties communes (appartement) | 12348 € | 0 (copro 6000) | 3148 | 0 | 32104 |

**Écart restant**
Les questions bailleur et copropriété détaillées ne sont pas encore reprises :
- bailleur : zone, niveau Loc'Avantages, durée, Louer pour l'emploi, nombre de logements ;
- copropriété : lots, tantièmes, DPE de l'immeuble.

Leurs valeurs par défaut sont celles de l'ancien tunnel quand ces champs restaient vides. Les montants ne diffèrent donc que si ces champs étaient remplis.
