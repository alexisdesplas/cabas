# UI — Direction « tuiles » déclinée sur tous les écrans

**Statut : Brouillon, à valider par Alexis.** Remplace les sections A, B, C de la page `Cabas · App`, renommées « v1, remplacée ».

| | |
|---|---|
| Date | 02/11/2026 |
| Régime | Composition intégrale, jetons Hardwood (Indigo LT), tout sous des sections `⚠ Composition`. |
| Figma | Fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, page `Cabas · App`, sections `A2` (id `347:2363`), `B2` (`350:3142`), `C2` (`350:4247`), composants locaux dans `D` et `E`. |
| Largeur | 390. |
| Illustrations | Fluent Emoji 3D (Microsoft, MIT), 230 images, magasin `⚙ Illustrations` (id `332:2174`), mêmes fichiers dans `icons/aliments/`. |

## Les règles de la direction

- **Tuile illustrée** devant chaque article, suggestion, plat et membre ; fond page, 44 px en liste, 60 px pour un plat, 96 px en accroche d'écran.
- **En-tête compact** : surtitre en capitales (nom du foyer, semaine), titre, avatars du foyer à droite. Le compteur « 7 à prendre » et sa barre fine remplacent la carte de progression (piste 3).
- **Sections en capitales** avec filet et compte à droite, plus de cartes-conteneurs autour des listes.
- **Un accent** : indigo. Le vert, l'ambre et le rouge restent des états, et des teintes d'avatar.
- **Avatars colorés** : une teinte par membre dans l'ordre d'arrivée (indigo, vert, ambre, rose).
- **Feuilles flottantes** détachées des bords ; **toasts clairs** fixés en bas, avec « Annuler ».
- **Gestes** : glisser à droite = dans le panier, à gauche = retirer ; tap = cocher ; appui long = modifier.
- **Quantité** (écran Modifier) : compteur moins / valeur / plus, puces d'unité (g, kg, pièce) ; le pas suit l'unité, appui long pour taper la valeur.
- **Tuiles posées sur la page** (accroches, aperçu, plat, états vide/erreur) : sans fond, l'illustration seule ; le fond page des tuiles ne sert que dans une carte ou une ligne.

## Écrans produits

| Section | États |
|---|---|
| A2 · Liste et Ajouter (11) | en cours · vide · tout est dans le panier · Léa vient d'ajouter · hors ligne · glisser pour cocher ou retirer · modifier un article · terminer les courses ? · Ajouter avant de taper · Ajouter en frappe · article déjà dans la liste |
| B2 · Repas (10) | formulaire · Claude prépare · menu proposé · menu de la semaine · Claude n'a pas répondu · détail d'un repas · changer un plat · formulaire incomplet · articles déjà sur la liste · semaine passée |
| C2 · Compte et foyer (15) | se connecter · créer mon compte · identifiants incorrects · compte déjà existant · e-mail envoyé · trop d'e-mails envoyés · nouveau mot de passe · créer ou rejoindre · rejoindre, saisie du code · code invalide · en attente de l'autre · à deux · retirer un membre ? · quitter le foyer ? · se déconnecter ? |

Retirés par rapport à la v1 : « ordre des rayons » (bloc retiré de l'app), « adresse à valider » (validation d'e-mail désactivée). Ajoutés : glisser, Ajouter (3), trop d'e-mails, saisie du code, retirer un membre.

## Composants locaux (`⚠ Proposition`)

Ligne d'article à tuile (Coché=non/oui) · Ligne de suggestion · Toast mobile (succès/erreur) · Avatar coloré (4 teintes × 2 tailles) · carte « À prendre », trois pistes.

## Contrôle mécanique

| Écran | Amplitude | Teintes hors états | Valeurs en dur hors propositions |
|---|---|---|---|
| A2 · Liste en cours | 4 (11 → 44) | 1 (indigo ; vert = avatar et état) | 0 — les seuls remplissages non liés sont dans les icônes de librairie |
| B2 · Repas formulaire | 4 | 1 | 0 |
| C2 · Foyer à deux | 4 | 1 (+ teintes d'avatar) | 0 |

Captures prises à l'échelle 1 pour les trois sections ; aucun débordement, aucun texte coupé.

## Questions ouvertes

1. Piste de carte : la 3 (compteur dans l'en-tête) est appliquée partout. Confirmer, ou revenir à l'anneau.
2. Tap pour cocher **et** glisser, ou glisser seul ?
3. Les teintes d'avatar s'appuient sur les jetons d'état (vert = succès, rose = danger). Les garder, ou créer des jetons d'avatar dédiés dans Hardwood ?

## Contrôle anti-patterns

Aucun signal. Deux écarts assumés et écrits : les teintes d'avatar empruntent aux couleurs d'état ; les pages `Cabas · User flow` ne sont pas encore mises à jour (dette).
