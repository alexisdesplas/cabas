# UI — Courses · B · Repas de la semaine   ·   Statut · Brouillon

**Date** · 31/10/2026 — **Régime** · système — **Mode** · 3 (cadre de `Liste — en cours`, validé par Alexis le 31/10/2026) + 2
**Figma** · https://www.figma.com/design/QZ94FGPStTONZYIJcXnyHX/%2FPerso — page `Cabas · App`, section `B · Repas de la semaine` (282:521)
**Système** · Hardwood, mode « Indigo LT » — librairie abonnée
**Largeurs produites** · 390

## Parcours
Formulaire → Claude prépare (≈ 20 s) → menu proposé (changer un plat, tout refaire) → ajout des articles à la liste → menu de la semaine. Branche d'erreur : Claude ne répond pas, les réponses sont gardées.

## Écrans produits
| Écran | États composés | A · écarts | B · amplitude / accents / plissement | Capturé |
|---|---|---|---|---|
| Repas — formulaire (défilé complet) (282:522) | dîners, déjeuners, personnes (stepper), envies (puces), temps en cuisine (segmenté), à éviter, déjà dans les placards | 0 en dur · 0 faux · 19 hors instance | 2,5 / 1 / OK (bouton « Préparer le menu ») | oui |
| Repas — Claude prépare le menu (282:764) | chargement avec rappel des choix et squelette | 0 en dur (1 fond d'icône Phosphor de la librairie) · 0 faux | 2,5 / 1 / OK | oui |
| Repas — menu proposé (défilé complet) (284:595) | 14 articles à ajouter, 5 dîners avec « Changer » | 0 en dur · 0 faux | 4 / 1 / OK | oui |
| Repas — menu de la semaine (défilé complet) (284:857) | confirmation « 14 articles ajoutés », menu sans « Changer » | 0 en dur · 0 faux | 2,5 / 1 + vert d'état / OK | oui |
| Repas — Claude n'a pas répondu (284:1096) | erreur, réessayer, modifier mes réponses | 0 en dur (1 fond d'icône librairie) · 0 faux | 2,5 / 1 + rouge d'état / OK | oui |
| Repas — détail d'un repas (291:1597) | ingrédients avec où ils sont (liste, panier, placards), étapes, changer ce plat | 0 en dur | 2,5 / 1 / OK | oui |
| Repas — changer un plat (291:1758) | feuille : Claude propose un autre plat, « Prendre celui-ci » / « Une autre idée » | 0 en dur | 4 / 1 / OK | oui |
| Repas — formulaire incomplet (291:1868) | 0 dîner et 0 déjeuner : erreur sous le bloc, bouton désactivé | 0 en dur | 2,5 / 1 + rouge / OK | oui |
| Repas — articles déjà sur la liste (291:2013) | « 11 à ajouter · 3 déjà sur la liste · 5 chez vous » | 0 en dur | 4 / 1 / OK | oui |
| Repas — semaine passée (291:2132) | bandeau neutre, « Préparer la semaine prochaine » | 0 en dur | 2,5 / 1 / OK | oui |

## Composants
| Composant | Source |
|---|---|
| Stepper, Puce, Contrôle segmenté | propositions Fluide (Contrôle segmenté forcé en Indigo LT, il portait le mode sombre) |
| Text Field (textarea), Button primary / ghost | Hardwood |
| Carte repas (284:570) | **proposition locale** : jour, plat, détail, « Changer » masquable |
| Squelette du menu, Bandeau de confirmation | **propositions locales** composées dans l'écran |
| Sparkle, Check, Warning | Phosphor |

## Contenu utilisé
| Zone | Contenu posé | Source |
|---|---|---|
| Envies | Végétarien, Rapide, De saison, Poisson, Réconfortant, Batch cooking, Léger | contenu à fournir (vos vraies envies récurrentes) |
| À éviter, placards | champignons, fruits de mer · riz, pâtes, oignons, œufs, huile d'olive | contenu à fournir |
| Menu | 5 dîners végétariens cohérents avec la liste A (gratin de mardi, curry de jeudi) | exemple, la vraie réponse viendra de Claude |

## Ce que le formulaire envoie à Claude (pour le code)
Nombre de dîners et de déjeuners, nombre de personnes, envies cochées, temps max un soir de semaine, à éviter, déjà dans les placards. Claude renvoie un JSON : repas (jour, plat, temps, ingrédients avec quantité et rayon) et la liste fusionnée, sans ce qui est déjà dans les placards ni dans la liste.

## Questions ouvertes
- Les envies à proposer par défaut (les puces) : à demander.
- Déjeuners : utiles, ou seulement les dîners ?
- « Changer » un plat : on le redemande à Claude seul, ou on propose 2 alternatives ?

## Contrôle anti-patterns
Amplitude sous 3 sur 3 écrans sans chiffre héros, même échelle que Fluide (écart assumé). Une seule famille d'accent, les couleurs d'état (vert, rouge) ne servent qu'aux confirmations et à l'erreur. Pas de lorem.
