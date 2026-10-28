# Instructions permanentes — JungleRenov

## Contrôle de mise en page avant toute livraison (toutes pages)
Avant chaque livraison, exécuter et joindre au rapport, pour chaque page touchée :
a. Aucun élément ne déborde de sa colonne de grille (overflow horizontal = 0 sur chaque bloc). Donner les valeurs mesurées.
b. Aucun chevauchement non prévu. Seuls sont admis : les cartes flottantes du hero, l'encart garantie sur la FAQ.
c. Aucun texte coupé ou tronqué involontairement.
d. Rangées de cartes de hauteur égale.
e. Espacements mesurés aux tokens (page-top, section-gap). Donner les valeurs mesurées.
f. Captures 1280, 1024, 375 de la page touchée.
Si un point échoue : corriger avant de livrer. Ne jamais livrer une page avec un point en échec.

Méthode de mesure dans l'aperçu (924 px) : redéfinir window.innerWidth + largeur du body + zoom, déclencher resize, puis mesurer avec getBoundingClientRect.
