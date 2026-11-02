# User flow — Cabas   ·   Statut · Brouillon

**Date** · 02/11/2026 (soir, mise à jour repas) — **Figma** · page `Cabas · User flow`, section `User flow — Cabas, 4 parcours · présentation du 02/11/2026 (mise à jour repas) · écrans de Cabas · App (A2, B2, C2) à 100 %` (id `372:3025`)
**Écrans** · à 100 %, jamais réduits (règle d'Alexis du 31/10/2026, écrite dans la skill `flux-ui`). 41 écrans posés (40 + 1 rappel), 34 flèches. Sources : sections `A2` (`347:2363`), `B2` (`350:3142`), `C2` (`350:4247`) de `Cabas · App`.

## Couloirs
| Parcours | Ligne 0 (nominal) | Branches |
|---|---|---|
| 1 · Entrée et foyer | se connecter → créer mon compte → créer ou rejoindre → saisie du code (six cases) → en attente de l'autre → à deux | identifiants incorrects, compte existant, code invalide ; mot de passe oublié → e-mail envoyé → nouveau mot de passe ; trop d'e-mails |
| 2 · La liste | en cours → glisser pour cocher ou retirer → tout dans le panier → terminer les courses ? | bouton + → Ajouter (avant de taper, en frappe, déjà dans la liste) ; appui long → modifier un article ; Léa ajoute, hors ligne, liste vide |
| 3 · Repas de la semaine | formulaire → Claude prépare → menu proposé → menu de la semaine → détail d'un repas | formulaire incomplet, Claude muet, articles déjà sur la liste, semaine passée ; **⋯ sur un plat → actions (modifier, remplacer, retirer)** → modifier le plat / remplacer (saisie) → remplacer (proposition) / retirer le plat ? |
| 4 · Foyer et compte | à deux (rappel) → retirer un membre ? | quitter le foyer ?, se déconnecter ? |

## Pastilles
- vert · nominal — orange · cas limite (vide, doublon, hors ligne, erreur) — bleu · geste qui enregistre (valider, ajouter à la liste, terminer, modifier un plat) — violet · pas toi (Claude prépare ou propose, ou l'autre téléphone agit).
- Contour orange ou violet autour des écrans qui sortent du nominal.

## Mise à jour
Le flow se régénère d'un bloc : le script `flow2.js` (scratchpad de la session du 02/11/2026, reproduit depuis `flow.js`) supprime l'ancienne section, clone les écrans sources par id et retrace flèches et pastilles. Une maquette qui change dans `Cabas · App` ne se propage pas toute seule : relancer le script, ou recloner le clone au même endroit (même nom) et refaire la pastille si ce qu'elle prouve change.
