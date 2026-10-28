# JungleRenov — Design System

**JungleRenov** est un service en ligne gratuit qui constitue le dossier d'aides à la rénovation des particuliers et le remet complet à un partenaire habilité. Public de 20 à 90 ans, Lorraine d'abord. Site web d'abord, mobile inclus. Registre : jeune startup par la forme, institutionnel et rassurant par la structure. Le mot « jungle » désigne la complexité administrative, **jamais la nature** (pas de feuillage, pas d'animaux, pas de photo de plante).

Un seul produit : **le site web** (accueil, simulation, espace « Mon dossier »). L'UX du site est conçue à part, sur wireframes : ce design system ne contient **aucune maquette d'écran**, seulement fondations, marque et composants.

## Sources

- `uploads/UI mockups request(4)/` (archive « UI mockups request(4).zip »)
  - `Charte graphique JungleRenov.dc.html` — **charte v1.9, octobre 2026, fait foi** (copie de lecture : `_src/charte.html`).
  - `livrables/` — logos (14 SVG), symbole système (6), favicons, avatars, 24 pictogrammes, ligne d'étapes, `jungle-renov-tokens.css` (v1.8, copie : `_src/jungle-renov-tokens-v1.8.css`).
  - `logo-*.dc.html`, `assets/*` — pistes de logo écartées (non reprises).
  - Deux photos Pexels — **non reprises** (photo interdite).
- Brief de Laurent (Studio Lab), qui précise et prime sur la charte sur trois points : Komet pour le texte (au lieu de Figtree), plancher 17 px partout, palette fermée sans transparence.
- **En attente : `mes-aides.html`** (construction de la ligne d'étapes `.rf-stepper` et de la carte « étape en cours »). Pas encore reçu : la ligne d'étapes suit la charte 4.1 avec les ajustements validés, la carte reste à aligner.

## Index

- `styles.css` — point d'entrée (imports seuls) → `tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `assets/` — `logo/`, `symbole/` (système : sur-encre, sur-ivoire, mono-encre, mono-pousse, noir, blanc), `pictos/` (01–24), `favicon/`, `avatar/`, `ligne-etapes/`.
- `guidelines/` — cartes de fondations (couleurs, type, espacements, marque, voix).
- `components/` — primitives React (voir ci-dessous).
- `SKILL.md` — version Agent Skill.
- `thumbnail.html` — vignette du projet.

## Components

- **brand/** — `Logo`, `Symbole`, `Picto` (+ `brandSvgs.js` : tracés des livrables, générés, ne pas éditer).
- **actions/** — `Button` (primary feuille · secondary · on-dark pousse · on-dark-secondary · link).
- **forms/** — `TextField` (+ `FieldError`), `Select`, `Choice`, `ChoiceGroup`, `FileDrop`.
- **feedback/** — `StatusTag`, `Notice`.
- **parcours/** — `Stepper` (ligne d'étapes, + `ETAPES`), `CurrentStepCard`, `DocumentRow`, `AidAmount`.
- **layout/** — `SiteHeader`, `SiteFooter`.

Aucune source ne définit d'inventaire de composants (la charte v1.8 a retiré tout design d'interface). Le jeu ci-dessus est taillé pour le parcours dossier ; pas de Tabs, Toast, Avatar, Tooltip, Dialog — non nécessaires à ce stade.

---

## CONTENT FUNDAMENTALS

**Ton.** « Une personne compétente qui vous accueille et prend le temps. » Calme, précis, sans emphase commerciale.

- **Vouvoiement, toujours.** Jamais « tu », jamais « on » pour désigner l'usager. « Nous » rare ; le sujet est souvent « le site » : « Le site constitue votre dossier et le remet complet au partenaire habilité. »
- **Phrases courtes, une idée chacune.** Pas de point d'exclamation.
- **Promesse = ce que fait le site, rien de plus.** On écrit « Simulation gratuite, sans engagement. » — pas « Audit énergétique offert ».
- **Montants** : toujours une estimation, toujours suivie de la source et de la date. « Estimation : 0 000 €. Source : [barème], consulté le [jj/mm/aaaa]. » Jamais « Touchez jusqu'à 0 000 € d'aides ! ». Aucun montant inventé : placeholders tant que le barème n'est pas branché.
- **Vocabulaire tenu** : partenaire habilité (jamais « notre accompagnateur », « notre conseiller ») · accompagnement administratif · simulation gratuite (jamais « audit », « diagnostic ») · aides à la rénovation (jamais « subventions de l'État ») · indépendant · estimation (jamais « montant garanti / obtenu »).
- **Mots interdits partout** : « agréé », « officiel », « labellisé », « certifié », « on s'occupe de tout », « Rénov’ » avec apostrophe **dans notre nom ou une offre**. Aucun témoignage inventé. Aucune proximité visuelle avec les dispositifs publics (logos, bleu).
- **Bandeau de transparence — texte exact, obligatoire** (pied de page, e-mails, créas) : « JungleRenov n’est pas agréé Mon Accompagnateur Rénov’. Le dépôt se fait par vous, sur le site de l’Anah. » Seul endroit où « agréé », « Rénov’ » et « Anah » apparaissent : c'est la citation d'un dispositif, pas notre nom. Défaut de `SiteFooter`.
- **Casse** : phrase normale (majuscule initiale seule), y compris boutons et titres. Boutons à l'infinitif ou au possessif : « Faire la simulation », « Ajouter mes pièces », « Remettre mon dossier ».
- **Typo française** : espace fine insécable avant € % : ; guillemets « » ; apostrophe typographique ’ ; alignement à gauche, jamais justifié.
- **Emoji** : jamais. Caractères Unicode décoratifs : non (le séparateur « · » est le seul usage courant).
- Champs : label = nom de la donnée (« Revenu fiscal de référence ») ; légende = où la trouver (« Il figure en page 1 de votre avis d'imposition. ») ; erreur = quoi faire (« Indiquez un nombre entre 1 et 12. »).

## VISUAL FOUNDATIONS

**Couleur.** Palette fermée, rien d'autre : encre `#123A2E` (texte, logo, fonds pleins) · ivoire `#F4F1E8` (**fond de page**, jamais blanc) · ivoire profond `#E9E3D3` (fonds secondaires, filets) · blanc (cartes et champs uniquement) · feuille `#1F6B3F` (action — rare, ~4 % de la page, c'est ce qui fait voir le bouton) · pousse `#8FD14F` (accent **uniquement sur encre**) · validé `#065F46`/`#ECFDF5` · bloqué `#991B1B`/`#FEE2E2` · secondaire `#6B7280` (sur blanc uniquement). Proportions type : ivoire 55, blanc 18, encre 15, reste minoritaire. Aucune transparence colorée (elle crée une couleur hors palette). Interdits : feuille sur encre, pousse sur clair, feuille en texte < 18 px.

**Type.** Arsenica Display Extrabold : logo, hero 56/60, H1 40/46, jamais sous 20 px, jamais en texte. Komet (confirmé pour le texte courant) : tout le reste — accroche Heavy Italic 32/36, H2 Bold 28/34, H3 Medium 22/28, chapeau 21/32, courant 18/28, label SemiBold 17/24, légende 17/24, chiffre d'aide Heavy Italic 44/48 tabulaire. Plancher 17 px partout. Chiffres tabulaires en tableaux et montants.

**Espace et grille.** Base 4 : 4/8/12/16/24/32/48/64 (96 pour les grandes respirations). Contenu max 1120 px, mesure 68 ch. Mise en page à gauche, colonnes simples, beaucoup d'air.

**Fonds.** Aplats francs uniquement : ivoire par défaut, bandeaux encre pour le hero, la ligne d'étapes et le pied de page. Aucune image, aucune photo, aucun motif (hachures, barres), aucune texture, aucun dégradé, aucun flou.

**Formes.** Rayons 4 px (boutons, champs, étiquettes, bandeaux) et 6 px (cartes, tuiles). Cercles uniquement pour les pastilles de la ligne d'étapes et les radios. Filets 1 px (`--line` ivoire profond en décoratif, `--line-strong` secondaire pour les champs) ; 2 px pour l'erreur et la sélection.

**Cartes.** Blanc sur ivoire, filet 1 px ivoire profond, rayon 6, **aucune ombre**. Pied de carte possible en ivoire, séparé par un filet. Jamais de filet coloré à gauche.

**Ombres et élévation.** Aucune. La hiérarchie vient du contraste ivoire / blanc / encre.

**États.** Survol : bouton feuille → encre ; pousse → ivoire ; secondaire blanc → ivoire profond ; lien feuille → encre (souligné en permanence). Pressé : pas de rétrécissement ni d'effet. Désactivé : ivoire profond + encre, curseur interdit. Focus : contour 3 px encre décalé 2 px (ivoire sur encre). Sélection (tuiles) : filet feuille 2 px + indicateur plein. Aucune information par la couleur seule : chaque état = pictogramme + mot.

**Animation.** Minimale : transitions de couleur 120 ms ease-out. Pas de rebond, pas de parallaxe, pas de fondu décoratif.

**Accessibilité.** Zones cliquables 48 px. Contrastes de la charte 2.2 ; AAA (encre/ivoire) pour les écrans destinés aux plus de 70 ans. Ligne d'étapes compacte sur mobile avec « Étape n sur 9 : … » en clair.

**Élément signature : la ligne d'étapes.** 9 étapes (Simulation, Logement, Foyer, Revenus, Travaux, Devis, Pièces, Remise, Dépôt). Pastilles Ø 34 numérotées en Komet gras ; coche sur les faites ; en cours = pastille claire cerclée (pousse sur encre, feuille sur ivoire) ; trait coloré jusqu'à la dernière faite ; libellé complet sous chaque pastille ; la dernière toujours creuse.
*Adaptations validées (26/10/2026)* : libellés et numéros à 17 px (charte : 13/14) ; « à venir » sur encre en feuille pleine (charte : `#2D5044`, hors palette) ; anneau « en cours » sur ivoire en feuille pleine 3 px (charte : feuille 25 %).

## ICONOGRAPHY

- **Système propre** : 24 pictogrammes SVG de la charte (5.1), dans `assets/pictos/` et inlinés dans le composant `Picto`. Grille 24, trait 2 px, extrémités et angles arrondis, diagonales à 45°, rectangles rayon 2. **Jamais de remplissage**, une seule couleur : encre sur clair, ivoire sur encre, blanc dans un bouton feuille ; états validé/bloqué dans leur couleur d'état.
- Tailles : 24 px en interface, 48 px en illustration de message. **Toujours accompagnés d'un mot.**
- Pas de police d'icônes, pas de bibliothèque CDN, pas d'emoji, pas de PNG. Seul glyphe ajouté : la coche de la ligne d'étapes (tracé repris de la charte 4.1), réutilisée dans `Choice`.
- **25–29 ajoutés au design system** (hors charte, même construction : grille 24, trait 2 px, extrémités rondes) : `menu`, `fermer`, `chevron`, `retour`, `information`. Le `Select` utilise `chevron` ; le bouton mobile de `SiteHeader` utilise `menu` / `fermer`, toujours avec le mot. À faire valider par Laurent.
- **Logo / symbole** : `Logo` et `Symbole` affichent les SVG livrés sans modification. Picto coloré seulement ≥ 48 px (horizontal ≥ 52 px de haut, empilé ≥ 119 px) ; en dessous, bascule automatique en monochrome (encre sur clair ; sur encre : symbole pousse plein, logo blanc). Jamais le mot sans symbole en en-tête. Zone de protection ½ J. Interdits : déformer, pivoter, ombre, contour, dégradé, couleur hors palette, fond chargé, accolement à un logo public.

## Polices — substitution

Arsenica Display (Zetafonts) et Komet (Jan Fromm) sont des polices commerciales **non fournies**. `tokens/fonts.css` les appelle via `local()` ; à défaut, la substitution de la charte s'applique : **Abril Fatface** pour Arsenica, **Red Hat Display** pour Komet (Google Fonts). Le rendu final se juge avec les polices installées.

## Intentional additions

- `brandSvgs.js` — tracés SVG des livrables, inlinés pour que les composants marchent sans chemin d'asset.
- `ChoiceGroup`, `FieldError` — assembleurs de `Choice` / `TextField`.
