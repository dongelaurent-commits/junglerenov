# Tunnel logement dégradé (tunnel-degrade) — cahier extrait de la référence
27/10/2026. Source : `uploads/junglerenov-site-reference/parcours-indigne.html`. Le moteur est `RFCompute.computeMprLogementDecent(payload)` dans `lib/_compute_aids.js`. Le résultat est stocké dans `junglerenov.indigne.result`.

## Parcours selon le statut (numéros d'écran de la référence)
- Occupant : 1, 2, 3, 6, 7, 9, 8.
- Bailleur : 1, 2, 3, 4, 6, 7, 9, 8.
- Copropriété : 1, 2, 3, 5, 7, 9, 8.

Le stepper n'affiche que les étapes du parcours suivi, numérotées sans trou.

## Écrans
1. **Situation** : propriétaire occupant, propriétaire bailleur, copropriétaire (3 cartes).
2. **État du logement** : moyennement dégradé, très dégradé ou insalubre, arrêté de police, je ne sais pas encore. Si arrêté de police, un Select « Nature de l'arrêté » : péril, insalubrité, saturnisme, sécurité des équipements communs.
3. **Le logement et le chantier** :
   - adresse avec suggestions, type (maison ou appartement), surface, année ;
   - DPE actuel et DPE visé (DpeSelector × 2) ;
   - coût estimé des travaux HT ;
   - part énergie HT, facultative : 50 % retenus par défaut, et l'hypothèse est signalée.
4. **Convention Loc'Avantages** (bailleur seulement) : oui, je souhaite en savoir plus, non.
5. **Copropriété** :
   - adresse propre de la copropriété, nombre de lots, année ;
   - immatriculation au registre : oui, non, je ne sais pas ;
   - part de lots en résidence principale, en % (seuil 75 %, ou 65 % jusqu'à 20 lots).
6. **Revenus** : personnes au foyer et revenu fiscal de référence. Le champ Région est supprimé : envoyer `'Grand Est'`, comme l'énergétique.
7. **Récapitulatif**.
9. **Calcul**.
8. **Résultats et remise**.

## Données envoyées au moteur (à reproduire champ par champ)
- `variant` ; `rfr` ; `foyer` (1 par défaut) ; `region: 'Grand Est'`.
- `ageLogementAnnees` : année en cours − année de construction.
- `surface` ; `coutTravauxHT`.
- `partEnergetique` : part énergie ÷ coût, plafonnée à 1. Laissée vide si non saisie.
- `dpeAvant` et `dpeApres` : la lettre, ou `'unknown'`.
- `etatLogement` : « je ne sais pas » devient `'moyennement_degrade'`.
- `arretePolice` (arrêté choisi et type renseigné) et `arreteType`.
- `nbLotsCopro` ; `partResidencePrincipale` ; `immatriculation`.
- `conventionLocAvantages` : vrai sauf réponse « non », pour le bailleur seulement. `conventionReponse`.
- `gainEnergetiquePct` : selon le nombre de classes gagnées entre DPE actuel et DPE visé, 3 ou plus → 50, 2 → 35, sinon 0.
- `logement` : adresse, code postal, ville, département, code INSEE, type, surface, année, DPE avant et après.
- `coproAdresse`, `coproCodePostal` et `coproVille` pour la copropriété.

## Résultat retourné
`{ eligible, variant, categorie, travaux{coutHT, coutRetenu, plafondApplique, totalHT, totalTTC}, aide{base, primeSortiePassoire, total, totalApresEcretement, tauxApplique, ecretement, mpld, mprCumulable, local, localNom, ecoPtz}, resteACharge, derogatoire, atteintClasseE, dpeInconnu, conditions{auditEnergetique, accompagnementOperateur, engagementResidencePrincipale}, source }`.

## Gabarit partagé — décision à prendre
La consigne demande d'extraire un `tunnel-layout.css` commun. Or les pages sont écrites en styles en ligne, et la règle du projet interdit les feuilles de classes. Le gabarit partagé existe déjà sous forme de composants communs dans `lib/jr-v2.js` : TunnelHeader, Stepper, QuestionBlock, ChoiceGrid, ChoiceCard, DpeSelector, ProjectRecap, Notice, Table, StickyFooter, IconBadge.

Proposition : compléter `lib/jr-v2.js` avec les composants qui manquent, pour que les trois pages n'aient plus de mise en page propre et n'assemblent que ces composants :
- `StepTitle` : micro-label, H1, intro ;
- `FormCard` ;
- `CalcStep` : anneau et six lignes ;
- `ResultHero` : le bloc encre ;
- `KeyFigures` : les trois chiffres ;
- `ActionBlock` ;
- `PdfBlock` ;
- `GuaranteeBlock`.
