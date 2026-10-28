# JungleRenov — design system v2 · note de version

**Livraisons 1 et 2 sur 4 : fondations et composants.** Elles sont à valider avant les pages.

## Fichiers
- `lib/components.css` — tokens v2, polices, socle (`.jr2`), focus, mouvement, prefers-reduced-motion.
- `lib/jr-v2.js` — 27 composants React, exposés sous `window.JRv2`. Ils n'utilisent que des tokens (contrôle : aucune couleur, taille ni durée en dur).
- `Design system v2.dc.html` — documentation : couleurs, contrastes, typographie, espaces, tokens, puis chaque composant avec ses variantes, ses états, quand l'utiliser, à faire, à ne pas faire et l'accessibilité.

## Fondations
- **Polices** : Arsenica et Komet en `local()` en attendant les woff2 ; les captures montrent donc les polices de secours (Abril Fatface, Red Hat Display). JetBrains Mono 400/500 via Google Fonts, **à auto-héberger en production**.
- **Couleur** : palette v1 et nuances d'encre calculées en aplats.
  - Texte secondaire : ink-70 `#567166` uniquement (4,71:1 sur ivoire, 5,32 sur blanc, 4,62 sur feuille lavé).
  - ink-60 et ink-40 : filets et pictogrammes ; ink-10 et ink-05 : filets et fonds.
  - **Nouvelle règle relevée au contrôle** : ink-70 sur ivoire profond donne 4,15:1, sous AA. Sur ivoire profond, le texte secondaire passe en encre pleine.
- **Typographie** : hero 56, h1 40 (Arsenica), h2 28, h3 22, chapeau 21, courant 18/28, label 17 (Komet), micro 13 en mono 500, espacé à 0,08 em (plancher levé pour ce seul style), chiffres 32 / 44 / 64.
- **Espace et grille** : 4 à 96 ; sections 96 / 64 ; conteneur 1200, gouttière 24, marges 32 / 24 ; mesure 44 rem ; zones cliquables 48 ; cartes de choix 56.
- **Mouvement** : 120 / 200 ms, courbe standard, sur la couleur, la bordure et l'opacité seulement ; mis à zéro si l'utilisateur réduit les animations.
- **Focus** : 3 px encre décalé de 2 px ; ivoire sur encre.

## Composants
- **Repris et complétés**
  - Button : principal, secondaire, tertiaire, destructif, avec pictogramme, chargement, désactivé, sur encre.
  - TextField : unité, aide, erreur, désactivé.
  - Select : avec un état d'erreur.
  - ChoiceCard et ChoiceGroup : cartes de 56 px, choix unique et multiple, erreur, option indisponible.
  - FileDrop : manquant, reçu, validé, refusé.
  - Notice : info, validé, bloqué.
  - StatusTag : validé, reçu, manquant, en cours, à venir, bloqué.
  - AidAmount : 3 tailles, sur fond clair et sur encre.
  - Stepper : celui du design system, cliquable et défilant sur mobile.
- **Créés** : Card (simple, en-tête, action, sélectionnable, lien), Table (tri, état vide), Tabs, Breadcrumb, Pagination, Modal, Toast, Tooltip, EmptyState, Skeleton, Sidebar, SectionHeader, FloatingCard, ReassuranceTile, ProjectCard, StepNumber.
- **Non refaits ici** : CurrentStepCard, DocumentRow, SiteHeader et SiteFooter restent ceux du design system. Ils seront repris en v2 pendant la livraison 3.

## Décidé
- La palette fermée, les nuances d'encre et leurs usages.
- Le micro-label en mono 13 px, réservé aux labels, repères, légendes de cartes flottantes, pastilles et barèmes.
- Feuille lavé `#E6F2EA` pour les sélections et les pastilles.

## Ouvert
- Les woff2 d'Arsenica et de Komet sous licence web.
- L'auto-hébergement de JetBrains Mono.
- Le fond de la Modal : encre pleine, puisque la transparence est interdite. Je propose de garder ce fond, à valider.
- L'intégration des tokens v2 au design system, de votre côté.

## Suite
- **Livraison 3** : index, tunnel et tableau de bord reconstruits avec `JRv2`, et suppression de `lib/jr-tunnel.css` et `lib/css/*` pour ces pages.
- **Livraison 4** : les autres pages.
- Le contrôle automatique « aucune valeur en dur » et le rapport par page arrivent avec la livraison 3.

## Livraison 3 — en cours
- **Ajoutés à `lib/jr-v2.js`** :
  - **IconBadge** : S, M, L ; variantes feuille, encre, lavé.
  - **CurrentStepCard v2** : numéro en Arsenica, état, délai et durée, « Ce qu'il faut préparer », actions.
  - **DocumentRow v2** : IconBadge lavé, libellé, légende, StatusTag, action.
  - **Button** : pictogramme après le libellé (`iconAfter`).
- **dashboard — reconstruit entièrement sur JRv2**, sans fragment hérité ni feuille convertie (`lib/css/dashboard.css` n'est plus chargé) :
  - Sidebar, avec le widget Aides estimées et l'utilisateur ;
  - bandeau de parcours sur encre, avec les deux chiffres en Arsenica et le Stepper ;
  - CurrentStepCard v2 ;
  - liste des étapes avec StatusTag, et filet feuille à gauche sur l'étape en cours ;
  - DocumentRow v2.
  
  Données lues dans `RFDossiers` ; seul « J'ai fait cette étape » écrit, via `advanceEtape`, comme avant.
- **Restent à faire** : onboarding-diagnostic, mes-aides, mes-documents, puis le reste. Les tunnels demandent de réécrire leurs scripts de page (127 ko pour l'énergétique), car ils pilotent l'ancien balisage. Il faut les traiter page par page, dans une conversation neuve.
