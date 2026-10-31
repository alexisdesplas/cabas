# User flow — Courses   ·   Statut · Brouillon

**Date** · 31/10/2026 — **Figma** · page `Courses · User flow`, section `User flow — Courses, 4 parcours · écrans de Courses · App à 100 %` (296:2080)
**Écrans** · à 100 %, jamais réduits (règle d'Alexis du 31/10/2026, écrite dans la skill `flux-ui`). 33 écrans posés (32 + 1 rappel), 29 flèches.

## Couloirs
| Parcours | Ligne 0 (nominal) | Branches |
|---|---|---|
| 1 · Entrée et foyer | se connecter → créer mon compte → adresse à valider → créer ou rejoindre → en attente de l'autre → à deux | identifiants incorrects, compte existant, code invalide ; mot de passe oublié → nouveau mot de passe |
| 2 · La liste | en cours → modifier un article → tout dans le panier → terminer ? → vide | elle ajoute en direct, doublon, hors ligne |
| 3 · Repas de la semaine | formulaire → Claude prépare → menu proposé → menu de la semaine → détail d'un repas | formulaire incomplet, Claude muet, changer un plat, articles déjà sur la liste, semaine passée |
| 4 · Foyer et compte | à deux (rappel) → ordre des rayons | se déconnecter ?, quitter le foyer ? |

## Pastilles
- vert · nominal — orange · cas limite (vide, doublon, hors ligne, erreur) — bleu · geste qui enregistre (valider, ajouter à la liste, terminer, se déconnecter) — violet · pas toi (Claude prépare, ou l'autre téléphone agit).
- Contour orange ou violet autour des écrans qui sortent du nominal.

## Mise à jour
Une maquette qui change dans `Courses · App` ne se propage pas : recloner le clone au même endroit (même nom), refaire la pastille si ce qu'elle prouve change.
