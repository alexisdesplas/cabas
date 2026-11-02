# UI — Courses : propositions pour la carte « À prendre » et la page

**Statut : Brouillon, à valider par Alexis.**

| | |
|---|---|
| Date | 02/11/2026 |
| Régime | **Composition intégrale.** Tout est regroupé sous des frames `⚠ Proposition — …`. |
| Mode | 4 · Composer depuis des références, avec les jetons Hardwood (Indigo LT). |
| Figma | Fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, page `Cabas · App`, section `D · Courses — propositions carte et page · 390 · ⚠ Composition (02/11/2026)` (id `329:2012`) |
| Système | Hardwood : variables de couleur, rayons, styles de texte ; icônes Phosphor ; barre d'onglets locale existante. |
| Références | Deux captures fournies par Alexis : une liste « Groceries » (fond chaud, icônes illustrées par article, sections en capitales, avatars du foyer, boutons flottants) et un panier avec glisser pour supprimer. |
| Largeur | 390 uniquement (`memoire.md`). |

## Ce qu'on retient des références

| Référence | Ce qu'on prend | Ce qu'on laisse |
|---|---|---|
| Liste « Groceries » | Une tuile illustrée par article, sections en capitales avec filet, avatars du foyer en haut à droite, bouton d'ajout flottant | Le fond beige et les cartes laiteuses : Cabas garde le fond Hardwood. Le micro et le crayon : un seul bouton d'ajout. |
| Panier à glisser | La ligne qui suit le doigt et découvre l'action en dessous, en couleur d'état | Prix, quantité en stepper, cœur : hors sujet pour une liste de courses. |

## Écrans et composants produits

| Frame | Ce qu'elle montre |
|---|---|
| `⚠ Proposition — Carte · piste 1 — Anneau` | La carte actuelle resserrée : anneau, chiffre, deux lignes. |
| `⚠ Proposition — Carte · piste 2 — Par rayon` | Grand chiffre, barre découpée par rayon dans l'ordre du magasin, légende « Fruits 2/4 · Crèmerie 1/3 · Épicerie 0/3 ». |
| `⚠ Proposition — Carte · piste 3 — Dans l'en-tête` | Pas de carte : chiffre et barre fine sous le titre. Retenue dans les deux écrans. |
| `⚠ Proposition — Courses · nominal · tuiles et en-tête compact · 390` | En-tête « Chez nous / Courses » avec avatars, compteur, activité de Léa, rayons en capitales, lignes à tuile, panier en bas, bouton flottant. |
| `⚠ Proposition — Courses · glisser pour cocher ou retirer · 390` | Une ligne glissée à droite (vert, « Dans le panier »), une à gauche (rouge, « Retirer »), toast « retiré · Annuler ». |
| `⚠ Proposition — Ligne d'article à tuile` | Composant local, variantes `Coché=non/oui`, propriétés Nom, Détail, Emoji. |

## Composition

- **Zone qui domine** : le chiffre « 7 » à prendre, 44 px, dans l'en-tête.
- **Accent** : indigo seul ; vert et rouge n'apparaissent que comme états du geste.
- **Rupture de grille** : la ligne glissée déborde de la colonne pendant le geste.
- **Détail métier** : le détail de ligne dit pour quel repas l'article est là (« pour le curry de pois chiches du jeudi »).

## Gestes proposés

- **Glisser à droite** au-delà d'environ 30 % de la largeur : l'article passe dans le panier. Le vert se remplit au seuil, petite vibration.
- **Glisser à gauche** : retirer. Toast « retiré » avec « Annuler » pendant 5 s.
- Le tap sur la ligne coche toujours ; le crayon disparaît, l'édition passe par un appui long.

## Contenu utilisé

Articles et repas repris du menu d'exemple de l'app et de la liste réelle (Beurre doux ajouté par Léa). Le libellé le plus long est « 1 botte · pour le curry de pois chiches du jeudi », tronqué en fin de ligne.

## Contrôle mécanique

| Contrôle | Résultat |
|---|---|
| Amplitude typographique | 44 / 11 = 4 |
| Familles d'accent hors états | 1 (indigo) |
| Écarts hors propositions | 0, tout est sous `⚠ Proposition` |
| Captures | Prises à l'échelle 1 ; chevauchements voulus seulement (bouton flottant, toast, ligne glissée). |

## Questions ouvertes

1. Quelle piste de carte garder : 1, 2 ou 3 ?
2. Garder le tap pour cocher en plus du glisser, ou réserver le tap à l'édition ?

## Contrôle anti-patterns

Signaux déclenchés : aucun. Les tuiles portent des illustrations Fluent Emoji 3D (MIT), magasin `⚙ Illustrations` dans la section ; mêmes fichiers dans `icons/aliments/`.
