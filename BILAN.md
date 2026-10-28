# JungleRenov — version sur le design system · bilan

## Pages (prototype relié)
index → choix-parcours → onboarding-diagnostic (8 étapes) / parcours-autonomie / parcours-indigne → login → dashboard → mes-aides · mes-documents · mon-profil · annuaire-artisans · glossaire-aides · page-info · merci-liste-attente · 404 · admin · super-admin. Fichiers `*.dc.html`, liens internes réécrits.

## Logique métier
`lib/` : modules d'origine. Seuls changements : nom (JungleRenov), clés de stockage `renofacile.*` → `junglerenov.*`, liens de pages. `_compute_aids.js` : 8 lignes modifiées, toutes de ce type → mêmes résultats.
Retirés : `_demo_mode.js`, purge des dossiers de test, repli démo de `_auth_guard.js`, `espace-artisan` et ses liens, `_mobile_nav`.

## Composants ajoutés (à valider pour intégration au design system)
1. `site-header` : enveloppe de SiteHeader, 4 modes (public, tunnel avec lien retour, espace, admin), état connecté.
2. `site-footer` : enveloppe de SiteFooter, complet (liens + mention éditeur) ou compact. Il porte le bandeau de transparence sur toutes les pages.
3. Encart « Gratuit pour vous » : carte blanche, filet feuille 2 px (index, étape 8). C'est ma lecture de l'« encart garantie ».
4. Ligne d'étapes des tunnels : le Stepper du design system avec les libellés propres à chaque tunnel, synchronisé sur l'étape affichée. Forme compacte sous 1040 px.
5. Barre latérale de l'espace particulier : widget « Aides estimées » sur encre, navigation, compte. Repliée en liste de liens sur mobile.
6. Tuiles de choix des tunnels, construites sur le modèle de Choice (filet feuille 2 px et case pleine).
7. Pictogramme `chevron` employé pour les dépliants.

## Ce que j'ai dû interpréter
- Les 3 tunnels, l'espace particulier, glossaire, page-info et l'administration gardent leur balisage et leurs scripts d'origine : c'est la seule façon de reprendre les parcours tels quels. Leur habillage est réécrit sur les tokens du design system (`lib/jr-tunnel.css` écrit à la main ; `lib/css/*.css` traduits automatiquement : couleurs ramenées à la palette, Komet et Arsenica, plancher 17 px, rayons 4 et 6, aucune ombre, aucun dégradé, aucun flou). Ces zones ne s'éditent pas en direct dans l'éditeur.
- Pages reconstruites entièrement en composants : index, choix-parcours, login, 404, merci-liste-attente.
- Échelle DPE : les couleurs réglementaires A→G sont hors palette. Je les ai remplacées par des lettres sur encre ; l'état actuel et l'état projeté sont signalés par un mot.
- Flou « teaser » des résultats : supprimé, la valeur reste lisible (aucun paiement, aucun flou).
- Emoji remplacés par des pictogrammes, ou retirés. Les ✅/❌/⚠️ deviennent « Applicable / Non applicable / Sous conditions ».
- Flèches décoratives (→ ←) retirées des boutons. Majuscules et interlettrage supprimés.
- Visuel « maison en coupe » et cartes flottantes du hero (exemple ~14 000 €) : supprimés, car l'image est interdite.
- Filets colorés à gauche des encarts : remplacés par des encarts ivoire profond.
- Apostrophes : la mention du pied de page suit la typographie du design system (’). Le texte est identique à celui demandé.
- Textes conservés tels quels. Points à arbitrer : ils contiennent des mots interdits par le design system (« agréé », « officiel », « audit », « diagnostic », « artisans RGE vérifiés », « Notre accompagnateur »). Je ne les ai pas réécrits.

## Corrections du 26/10/2026
1. Bandeau de transparence en haut de toutes les pages (`bandeau-transparence.dc.html`) : sur encre, non fermable. Apostrophes typographiques (’) comme dans le design system ; les mots sont ceux demandés.
2. Échelle DPE : couleurs réglementaires A→G rétablies. C'est une exception documentée dans `lib/jr-tunnel.css` et dans les feuilles de page. Lettres en encre, en blanc sur G. Le graphique nomme toujours « actuel » et « projeté », la tuile choisie indique « Classe actuelle ».
3. Encart garantie « 100 % indépendant · sans démarchage » : placé sur l'accueil (sous le hero) et à l'étape 8 (avant « Gratuit pour vous »).
4. Vocabulaire : « diagnostic » devient « simulation » quand il désigne notre estimation (accueil, choix, tunnels, espace, scripts). Restent inchangés : diagnostic de performance énergétique, diagnostic autonomie de l'opérateur, audit énergétique (travaux). « Agréé » est conservé pour le partenaire habilité ; « bureau d'études agréé » devient « habilité ».
5. Zone (décision prise) : seul l'encart d'accueil est modifié et annonce la Lorraine (54, 55, 57, 88). Le sélecteur de départements et le calendrier de merci-liste-attente gardent les 10 départements du Grand Est : la logique d'aides régionales en dépend. Ce point est à trancher avec le garde-fou.

## Corrections du 26/10/2026, second passage
- **Financement** : une seule formulation partout (accueil ×4, étape 8 du tunnel énergétique, étape transmission des tunnels autonomie et logement dégradé, FAQ du tunnel, page d'informations ×6 dont CGU 4.3 et « Notre modèle économique »). Les variantes sont supprimées.
- **Zone** : le garde-fou `lib/_geo.js` n'active plus que les départements 54, 55, 57 et 88. Les autres départements du Grand Est passent en liste d'attente. La mention « calcul standard » est supprimée, les bannières renvoient à la liste d'attente. Dans le tunnel, le sélecteur de département sépare « Lorraine » et « Autres départements du Grand Est (liste d'attente) ». Les aides régionales (Climaxion, Région Grand Est…) restent dans le moteur et gardent leur nom d'organisme et leurs conditions d'éligibilité.
- **Partenaire habilité** : remplace « professionnel agréé », « accompagnateur agréé », « l'accompagnateur » et « votre accompagnateur ». « MAR agréé par l'Anah » et « opérateur agréé » restent, car ils désignent le dispositif. Mentions également retirées : « artisans RGE vérifiés » et « Données ADEME officielles » (remplacée par « Sources officielles Anah, ADEME »).
- **« Diagnostic » conservé** seulement pour le diagnostic de l'opérateur, le diagnostic autonomie, le diagnostic global de copropriété et le DPE.
- **Moteur de calcul** : `_compute_aids.js` n'a pas changé (8 lignes différentes de l'original : le nom et les clés de stockage).

## Refonte UI — passage 1 (accueil, tunnel énergétique, tableau de bord)
**Méthode** : `lib/jr-bridge.js` remplace les contrôles du tunnel par les composants du design system : Choice pour les tuiles, les radios et les cases, TextField pour les champs texte (même id, non contrôlé), Notice pour les encarts et AidAmount pour le résultat. L'élément d'origine reste caché dans le DOM et sert de source d'état : chaque action du composant y est répercutée. Les scripts de page et `lib/` métier ne changent pas.
**Restent natifs**, avec le gabarit exact des composants :
- les listes déroulantes : des options y sont injectées par script et la liste des départements utilise des groupes, ce que Select ne permet pas ;
- les boutons Précédent / Continuer / Créer mon dossier : leur état activé ou désactivé est piloté par script ;
- le curseur de surface.
**Tunnel** :
- encart « Pourquoi ces questions ? » à droite sur desktop, sous le titre sur mobile (étapes 1 à 5) ;
- titres de question en Komet gras 22 px plutôt que 28 px, l'étape 2 posant six questions ;
- choix en cartes de 56 px, sélection en ivoire profond avec filet feuille ;
- échelle DPE : pastille de couleur réglementaire et mot.
**Résultats (étape 7)** :
- chiffre d'aide en Arsenica, source et date, « Montant indicatif, non contractuel. » ;
- liste des aides avec organisme ou condition ;
- « Constituer mon dossier » est le seul bouton principal : le doublon du bas est masqué, le bouton du récapitulatif PDF passe en secondaire.
**Étape 8** :
- récapitulatif complété de « Ce que le partenaire reçoit » (repris du texte de consentement) et de « Ce qui reste à faire de votre côté : le dépôt, sur le site de l'Anah » ;
- garantie sur encre.
**Tableau de bord** : `lib/jr-dashboard.js` compose la page à partir de `RFDossiers` (lecture seule, sauf « J'ai fait cette étape », qui appelle `advanceEtape`) :
- bandeau de parcours sur encre, avec ligne d'étapes ;
- carte étape en cours ;
- liste des étapes avec pastilles d'état ;
- documents à préparer (DocumentRow).

La barre latérale est sur ivoire profond, repliée derrière un bouton Menu sur mobile. Les sections d'origine restent dans le DOM, masquées, pour que leurs scripts tournent sans erreur.

**Accueil** :
- hero sur ivoire, un seul bouton ;
- trois cartes d'engagement ;
- garantie sur encre ;
- ligne d'étapes du système pour « comment ça marche » ;
- financement en ivoire profond ;
- appel final en secondaire.

**Dépendent encore d'une feuille convertie** : toutes les autres pages, ainsi que les blocs du tunnel générés par script (adresse, matrice d'éligibilité, encart MAR, bloc partenaire).

## Accueil — refonte éditoriale
Fichiers : `index.dc.html` (version sobre) et `index-variante-trouee.dc.html` (variante hors répertoire, aplat #E6F2EA coupé à 45° : couleur hors palette, à n'utiliser que si elle est validée).

**Textes supprimés**
- Bandeau « Service ouvert en Lorraine » : l'information passe dans le label du hero.
- Ligne « 100 % indépendant · sans démarchage » au-dessus du H1, ligne « Estimation gratuite en 5 minutes · Aucun paiement sur ce site · Simulation gratuite, sans création de compte ».
- Paragraphe juridique du hero, ligne « Estimation en 5 minutes · Sans création de compte · Sources officielles Anah, ADEME ».
- Bouton « Voir un exemple ».
- Les trois cartes d'engagement : Indépendant, Calculs basés sur les sources officielles, Aides régionales incluses.
- Tableau « Comparé à ce qui existe aujourd'hui ».
- Section « À qui s'adresse JungleRenov » (trois cas d'usage et mention NF Z74-501).
- Les trois étapes 1·2·3 de l'ancien bloc « Gratuit pour vous ».
- Question « Si c'est gratuit, comment JungleRenov gagne sa vie ? », remplacée par la section 05.
- Question « Êtes-vous vraiment indépendants ? », reformulée en « Avez-vous des liens avec les artisans ou les énergéticiens ? ».
- Dans la FAQ : « gratuit, public » pour France Rénov', remplacé par « service public ».

**Textes modifiés, à valider**
- H1 : « Rénovez votre logement sans vous perdre dans les aides. » devient « Vos aides à la rénovation, sans vous perdre. ». L'ancien titre ne tient pas sur deux lignes à 56 px dans une demi-colonne (4 lignes à 1280).
- Chapeau ramené à une phrase, « RGE vérifiés » devenant « RGE ».
- Textes des étapes et des dispositifs raccourcis à deux lignes.

**Vérification des mots**
- « indépendant » n'apparaît qu'en section 05 (garantie).
- « gratuit » apparaît en section 05 (« Gratuit pour vous »), dans le dernier appel (« Simulation gratuite ») et dans le label du hero que vous avez fixé (« Simulation gratuite · Lorraine »).

**Écarts au design system**
- Labels en Komet 17 avec interlettrage 0,1 em, et non en mono 14 : le design system n'a pas de police mono et fixe le plancher à 17 px.
- Encre pleine pour les labels et filets ivoire profond 1 px, au lieu de l'encre à 60 % et à 10 % : la transparence est interdite par la palette fermée.

## Accueil — hero d'après la référence
La variante trouée est supprimée. Hero sur deux colonnes à partir de 1000 px :
- pastille « 100 % indépendant · sans démarchage » ;
- H1 sur trois lignes, la deuxième en feuille (exception propre au hero) ;
- chapeau ;
- bande de réassurance à trois items ;
- « Estimer mes aides » en principal et « Voir un exemple » en secondaire, qui renvoie à la section 04 ;
- à droite, une scène : maison au trait 1,5 px en SVG, hachures sur la toiture et le plancher bas, étiquettes reliées par un filet ;
- trois cartes chevauchant le bord : Gain DPE E → C, Aides cumulées sur encre, Aides totales.

**Écarts à votre brief, par cohérence**
- **Montant** : 16 450 € dans le hero comme en section 04, et non ~14 000 €. Les lignes de l'exemple détaillé (13 500 + 1 950 + 1 000 + 0) font 16 450 € en borne basse ; mettre ~14 000 € dans les deux obligerait à inventer des lignes.
- **Gain DPE** : E → C, et non E → B, puisque l'exemple dit « gain de 2 classes ».
- **Aides cumulées** : « 3 dispositifs cumulés » au lieu de « 4 dispositifs éligibles », la CEE étant à 0 € (non cumulable) dans l'exemple.
- **Réassurance** : « Simulation en 5 minutes » au lieu de « Simulation gratuite en 5 minutes », pour que « gratuit » n'apparaisse qu'une fois hors section 05 (dans le chapeau).
- **Dernier appel** : le paragraphe « Simulation gratuite, sans création de compte » est retiré, ce qui laisse un titre et un bouton.

**Écarts au design system, assumés à votre demande**
- Une illustration en SVG avec hachures, alors que le design system interdit image et motif.
- La couleur feuille lavé #E6F2EA, hors palette (pastille et bande).
- La feuille en texte pour la deuxième ligne du H1.

**Écarts maintenus**
- Pas de police mono : Komet avec interlettrage 0,1 em.
- Étiquettes à 17 px minimum : leur taille dans le SVG est recalculée selon la largeur, pour ne jamais passer sous 17 px à l'écran.
- Filet des cartes en ivoire profond plutôt qu'en encre à 10 %, la transparence étant interdite.

**Vérification**
- « indépendant » hors section 05 : une seule fois (pastille du hero).
- « gratuit » hors section 05 : une seule fois (chapeau).
- Montant d'exemple : 16 450 € dans le hero et en section 04.

## Hero — scène en papier découpé
- **Illustration** : `assets/hero-scene.svg`, un SVG autonome sans script (viewBox 520 × 420, rendu 1040 × 840), réutilisable en créa et en bannière. La même scène est intégrée en ligne dans `index.dc.html`.
- **La scène** :
  - 5 maisons en aplats, toits à 45° exacts, posées sur une ligne de sol encre ;
  - strates décalées de 8 px (bande en feuille lavé, ivoire profond ou feuille derrière les maisons de devant) ;
  - accent unique : toit pousse sur corps encre ;
  - étiquette DPE A→G aux couleurs réglementaires, lettres blanches, sur la grande maison ; repères fins « actuel » (E) et « projeté » (C).
- **Supprimé** : la maison au trait, les hachures et les étiquettes Toiture / Solaire / PAC / Plancher bas.
- **Inchangé** : les trois cartes flottantes et la colonne gauche.
- **À noter** : le D jaune porte une lettre blanche à faible contraste, comme vous l'avez demandé. Il suffit de dire si je dois la passer en encre.

## Accueil — refonte de l'exécution
**Grille**
- Conteneur de 1200 px avec marges de 32 px, soit 1136 px utiles. Hero sur deux colonnes de 556 px et gouttière de 24 px. Hauteur minimale du hero : 640 px.
- Section 02 sur 3 colonnes, section 03 sur 4 colonnes égales.
- Sur mobile : marges de 24 px, tout en une colonne.

**Scène** : redessinée aux proportions demandées, dans `assets/hero-scene.svg` (560 × 520, autonome, sans script).
- Sol de 16 px.
- Maison principale de 240 px.
- Maisons secondaires de 160 et 120 px.
- Petite maison de 96 px, au toit pousse.
- Toits à 45° (hauteur du toit = moitié de la largeur), strates décalées de 8 px.
- Fiche DPE de 180 × 220 posée contre la maison, à gauche, avec ses pastilles « projeté » et « actuel ».

**Cartes flottantes**
- Desktop : elles dépassent de 24 px aux coins de la scène.
- Mobile : elles dépassent de 12 px. La carte du montant passe sous la scène en la chevauchant de 24 px, pour ne pas couvrir la fiche.

**Section 02** : cartes-liens sans bouton radio, avec pictogramme 32 px, chevron, dispositifs en gris dans la carte. Au survol : filet feuille 2 px et fond #E6F2EA.

**Section 03** : numéros en Arsenica 48 feuille, avec un filet dessous. « Remise du dossier ». La ligne d'étapes est en pied, la dernière creuse.

**Écarts au brief, et pourquoi**
- H1 à 48 px au lieu de 56 : à 56 px, « Rénovez votre logement » mesure environ 630 px et déborde de la colonne de 556 px. À 48 px, il tient en trois lignes.
- Largeur du H1 non limitée à 11 ch : à 11 ch, il passerait sur 5 à 6 lignes. Sur mobile, même chose pour la limite de 8 ch, qui donnerait 9 lignes.
- Réassurance sur deux lignes à 1280 : les trois items à 17 px mesurent environ 680 px, plus que la colonne.
- Lettres DPE en encre (blanc sur G) : en blanc, C et D échouent au contraste AA demandé au point 6.
- Labels en Komet 17 px avec interlettrage, pastilles en 17 px, dispositifs en gris à 17 px : il n'y a pas de mono dans le design system, et le plancher est de 17 px.
- Encre pleine pour les labels, filets en ivoire profond au lieu de l'encre à 10 % : la palette est fermée, sans transparence.

**Contrôle**
- « indépendant » hors section 05 : une fois (pastille du hero).
- « gratuit » hors section 05 : une fois (chapeau du hero).
- Montant d'exemple : 16 450 € dans le hero et en section 04.
- Couleurs : palette, #E6F2EA (demandé) et couleurs DPE réglementaires.

## Accueil — points forts
**Réassurance du hero** : trois tuiles blanches de même hauteur (grille à 3 colonnes égales, une colonne sur mobile). Chacune porte un pictogramme en feuille, un mot-clé en Komet gras 20 px (« 5 minutes », « 0 € », « Sans compte ») et une légende en gris secondaire, couleur autorisée sur fond blanc.
**Section 02** : la légende est remplacée par le libellé « Aides mobilisables » et une rangée de pastilles #E6F2EA, au-dessus d'un filet. Les cartes ont toujours la même hauteur.
**Fiche DPE** : décalée de 24 px vers la gauche, pas 40, pour rester dans le cadre de la scène. Elle ne couvre plus que l'arête du mur, ni la fenêtre ni la porte.
**Cartes Gain DPE et 16 450 €** : bords gauches déjà alignés, à −24 px du cadre.

**Écarts**
- Texte des pastilles en 18 px gras au lieu de 14 : le design system interdit le texte feuille sous 18 px.
- Légendes des tuiles et libellé « Aides mobilisables » en 17 px : c'est le plancher.
- Encre pleine au lieu de l'encre à 60 % : la transparence est interdite.

**Contraste** : feuille #1F6B3F sur #E6F2EA = 5,6:1, conforme AA.

## Accueil — transposition de la version de référence
La capture n'était pas jointe : la transposition part directement du code source de la référence (`uploads/…/index.html`, hero, bandeau d'engagements et cartes de projet), proportions et positions reprises à l'identique.
- **Hero** :
  - grille 1,05 fr / 1 fr, gouttière 64 px, marges intérieures 64 / 32 ;
  - pastille, H1 56 / 1,05 / −0,025 em, chapeau 21 / 1,55 limité à 50 ch ;
  - bande de réassurance avec pictogramme ;
  - deux boutons ;
  - ligne de trois mentions.
- **Illustration** : redessinée d'après le SVG d'origine (viewBox 500 × 400) dans la palette :
  - traits en encre, hachures et panneau solaire en feuille, fenêtres en feuille lavé, sol pointillé en secondaire ;
  - pas de fond dégradé ;
  - repères Toiture, Solaire, PAC et Plancher bas ;
  - « Murs » est retiré, comme dans votre liste.
- **Cartes flottantes** : positions d'origine (24 / −18, bas 140 / −12, bas 28 / −18), pastille de pictogramme, label, valeur. Sur mobile (sous 960 px), comme sur la référence : deux cartes, la carte « Aides cumulées » est masquée.
- **Bandeau blanc** de cinq engagements sous le hero, avec pastilles de pictogramme ; 5, 3 ou 2 colonnes selon la largeur.
- **Cartes de projet** : titre, description, une pastille par dispositif (feuille lavé, texte encre).

**Écarts imposés par le design system ou les règles précédentes**
- **Polices** :
  - H1 en Komet gras : Arsenica n'est pas chargée (le navigateur affiche Abril Fatface à sa place) ;
  - Komet n'est pas chargée non plus : Red Hat Display la remplace ;
  - pas de mono dans le design system, donc labels en Komet semi-gras espacés.
- **Tailles et casse** : labels et repères à 17 px minimum, et non 11 à 13 px ; pas de petites capitales, la casse de phrase s'applique.
- **Effets et couleurs** :
  - aucune ombre ni aucun dégradé, contrairement à la référence ;
  - cartes à 6 px d'angle, et non 12 à 16 ;
  - pastille du hero sans point coloré.
- **Pictogrammes** : ceux du design system, à la place des icônes de la référence.
- **Exemple chiffré** : Gain DPE « E → C » et « 3 dispositifs cumulés », pour rester cohérent avec l'exemple de 16 450 €.
