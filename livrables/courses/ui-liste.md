# UI — Courses · A · Liste   ·   Statut · Brouillon

**Date** · 31/10/2026 — **Régime** · système — **Mode** · 3 (répliquer Fluide) + 2 (briques manquantes)
**Figma** · https://www.figma.com/design/QZ94FGPStTONZYIJcXnyHX/%2FPerso — page `Courses · App`, section `A · Liste`, frame `Liste — en cours · 390 · Hardwood` (279:50)
**Système** · Hardwood, mode « Indigo LT » (clair, demandé par Alexis le 31/10/2026) — atteint par : librairie abonnée
**Largeurs produites** · 390
**Couverture composants** · 4/7 (Barre d'état et indicateur repris de Fluide, Button ghost, Barre de progression de Fluide ; propositions : barre d'onglets Courses, case à cocher, ligne d'article, champ d'ajout)

## Règles de page relevées — mode 3
| Règle | Valeur relevée | Nœud où elle a été lue |
|---|---|---|
| Largeur de contenu / gouttières | 350 / 20 | `Contenu` 211:2905 (Séances — liste) |
| Échelle d'espacement réelle | 4 · 8 · 12 · 16 | `Contenu` 211:2905, `En-tête` 211:2947, `Programme` 229:4935 |
| Cartes | fond/carte, bord/discret 1 px, radius/md, padding 16 | `Programme` 229:4935 |
| Titre d'écran | Heading/xl 28 + Body/md 14 discret, écart 8 | `Titre` 211:2948, `Sous-titre` 211:2949 |
| Chiffre héros | Display/sm 44 + Body/sm 13, écart 12 | `Ligne · compteur` 195:255 (Aujourd'hui — haut) |
| Barre d'onglets | 390 × 83, icône 24 + libellé 11 | `⚠ Proposition — Barre d'onglets` 198:359 |

## Écrans produits
| Écran | Largeurs | États composés | A · écarts | B · amplitude / accents / plissement | Capturé |
|---|---|---|---|---|---|
| Liste — en cours · 390 · Hardwood (279:50) | 390 | nominal (haut de liste) — validé en cadre le 31/10/2026 | 0 valeur en dur · 0 faux contenu · 28 nœuds hors instance (convention Fluide, voir Écarts) | 4 / 1 / OK | oui |
| Liste — vide (281:171) | 390 | liste vide, renvoi vers Repas | 0 en dur · 0 faux · 16 hors instance | 2,5 / 1 / OK | oui |
| Liste — tout est dans le panier (281:283) | 390 | 0 à prendre, « Terminer les courses » | 0 en dur · 0 faux · 20 hors instance | 4 / 1 / OK | oui |
| Liste — elle vient d'ajouter un article (281:438) | 390 | ajout en direct par l'autre compte | 0 en dur · 0 faux · 28 hors instance | 4 / 1 / OK | oui |
| Liste — modifier un article (281:546) | 390 | écran dédié : nom, quantité, rayon, retirer | 0 en dur · 0 faux · 11 hors instance | 1,5 / 1 / OK | oui |
| Liste — hors ligne (291:1045) | 390 | bandeau orange, modifications en attente | 0 en dur | 4 / 1 + orange d'état / OK | oui |
| Liste — article déjà dans la liste (291:1132) | 390 | feuille : passer la quantité à 5 ou ajouter quand même | 0 en dur | 4 / 1 / OK | oui |
| Liste — terminer les courses ? (291:1252) | 390 | feuille de confirmation sur « tout dans le panier » | 0 en dur | 4 / 1 / OK | oui |

## Composition
**La zone qui domine** · le compteur « 9 » à prendre (44 px) dans la carte Résumé, puis le bouton + plein.
**L'accent** · indigo (accent/base) : progression, case cochée, bouton +, onglet actif. Une seule famille.
**La rupture de grille** · aucune, assumé : c'est un outil qu'on lit en marchant dans le magasin.
**Le détail métier** · le détail d'un article dit d'où il vient : « ajouté par elle » ou le repas qui l'a demandé (« curry de jeudi »), ce qui relie la liste au menu généré par Claude.
**Régime** · outil — cartes pleine largeur, lignes de 56 px, pas de blanc décoratif.

## Composants
| Composant requis | Source | Où dans l'écran |
|---|---|---|
| Button (ghost, md) | système — Hardwood `Button`, repris de Fluide 229:4939 | « Vider le panier » |
| Barre de progression | proposition Fluide `⚠ Proposition — Barre de progression` | carte Résumé |
| Barre d'onglets Courses | **proposition locale** | bas d'écran |
| Case à cocher | **proposition locale** | dans chaque ligne |
| Ligne d'article | **proposition locale** | cartes de rayon |
| Champ d'ajout | **proposition locale** | sous le Résumé |

## Propositions locales — dette ouverte
| Proposition | Les requêtes essayées avant de conclure | Atomes utilisés | Promotion |
|---|---|---|---|
| Case à cocher | « checkbox » (fichier + librairies), résumé du DS local | Phosphor Check, variables accent/base, bord/base, radius/full | à décider par Alexis → `flux-design-system` |
| Ligne d'article | « checkbox », List Row Hardwood inspecté (92 px, sans propriété texte) | Case à cocher, styles Body/md/Medium et Caption/md | à décider |
| Champ d'ajout | Text Field Hardwood inspecté (116 px avec libellé, trop haut pour une saisie rapide) | Phosphor Plus, fond/carte, bord/base, accent/base | à décider |
| Barre d'onglets Courses | clone de la proposition Fluide | Phosphor ShoppingCart, ForkKnife, House | à décider |

## Contenu utilisé
| Zone | Contenu posé | Source | Cas extrême couvert |
|---|---|---|---|
| Articles | Tomates cerises, Courgettes, Coriandre fraîche, Citrons jaunes, Yaourts nature, Comté, Lait de coco, Riz basmati, Pâtes complètes, Œufs bio, Bananes | contenu à fournir (exemple de liste courante, pas la liste réelle du foyer) | libellé le plus long : 17 car. ; article sans quantité (« Pâtes complètes ») |
| Auteur | « ajouté par toi » / « ajouté par elle » | prénom de la copine d'Alexis : à demander | — |
| Rayons | Fruits et légumes, Crèmerie, Épicerie | contenu à fournir (ordre du magasin habituel) | — |

## Écarts constatés
| Écart | Où | Ce qu'on fait |
|---|---|---|
| Fluide compose ses cartes, titres et la barre d'état en frames et textes liés aux variables et styles, pas en instances : le comptage A strict relève 28 nœuds hors instance | frame 279:50 | le relevé fait autorité, même convention que Fluide ; 0 valeur en dur |
| Mode Indigo LT au lieu d'Indigo DT de Fluide | page entière | demande d'Alexis du 31/10/2026 |
| Amplitude sous 3 sur « vide » (28/11) et « modifier » (17/11) | 281:171, 281:546 | même échelle que les écrans équivalents de Fluide (titre 28, ou barre de navigation 17) : le chiffre héros 44 n'existe que là où il y a un compte à montrer |
| Champ texte Hardwood plus étroit que la colonne (marge interne du composant) | 281:546 | comportement du composant, comme dans Fluide |
| Bandeau d'activité (ajout en direct) composé localement | 281:438 | marqué `⚠ Proposition — Bandeau d'activité` |

## Contrôle mécanique
- A · valeurs en dur 0 · faux contenu 0 · chaîne répétée > 2 fois 0 · nœuds hors instance 28 (convention Fluide)
- B · amplitude 44 / 11 = 4 · familles d'accent 1 · plissement OK (« 9 » et bouton + lisibles)
- Contrôles automatiques : retours à la ligne non voulus 0
- `figma_lint_design` : non lancé
- Frames capturées et regardées : 1/1, à 1 et à 0,12

## Questions ouvertes
- Prénom de ta copine (pour « ajouté par … ») — bloque le contenu réel.
- Ordre des rayons de votre magasin habituel — bloque le tri de la liste.
- Ajout rapide en haut de la liste plutôt qu'un écran dédié : exception à la règle de Fluide, à valider.

## Contrôle anti-patterns
Aucun signal déclenché : pas de lorem, une seule famille d'accent, amplitude 4, espacements inégaux (8 dans un bloc, 16 entre blocs), un seul état composé assumé car c'est l'écran de référence à valider avant la série.
