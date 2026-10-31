# Mémoire — Cabas (projet « Courses »)

Nom de l'app : **Cabas**, proposé par Claude le 31/10/2026 (alternatives : Panier, Épicier), repris dans le code et le dépôt. Les pages Figma gardent « Courses » tant qu'Alexis n'a pas confirmé le nom.

Liste de courses partagée entre Alexis et sa copine : chacun se connecte avec son compte, les deux comptes partagent le même foyer et la même liste. Chacun peut ajouter, cocher et retirer des articles ; l'autre le voit en direct. Un formulaire « Repas de la semaine » envoie les envies du foyer à Claude, qui propose les repas de la semaine et la liste de courses qui va avec, à ajouter à la liste.

## Fichiers
- Code : ce dossier. PWA sans build ni dépendance installée (même convention que Tabatime et Fluide) : `index.html` + `js/` + `css/`.
- Figma : fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, intercalaire `──  MAISON` puis page `Cabas · App` (après `Fluide · User flow`, avant `──  MODÈLE`).
- Livrables UI : `livrables/courses/`.

## Design system
- Hardwood, mode « Indigo LT » (clair). Police Inter. Icônes Phosphor (Stroke, Regular).
- Largeur : 390 (iPhone) uniquement.
- Mode 3 : les écrans de Fluide (`Fluide · App`) font autorité pour la grille, les cartes, la typo et la barre d'onglets.

## Architecture (décidée le 31/10/2026)
- Données partagées et comptes : **Supabase** (Postgres + Auth e-mail / mot de passe + Realtime). Client chargé en module ESM depuis un CDN, pas de build.
- Clé API Claude : jamais dans le navigateur. Fonction serverless Vercel `api/repas` qui vérifie la session Supabase puis appelle l'API Claude ; la clé vit dans les variables d'environnement Vercel.
- Hébergement : Vercel, comme Fluide.

## Glossaire métier
- **Foyer** : le groupe qui partage la liste (Alexis + sa copine). Un compte appartient à un seul foyer ; on rejoint un foyer avec un code d'invitation.
- **Article** : une ligne de la liste (nom, quantité facultative, rayon, qui l'a ajouté, coché ou non).
- **Rayon** : regroupement des articles dans l'ordre du magasin (Fruits et légumes, Frais, Épicerie…).
- **Repas de la semaine** : le menu proposé par Claude à partir du formulaire ; ses ingrédients deviennent des articles.

## Décisions
- 31/10/2026 — Ordre : Figma d'abord (écrans hi-fi validés), puis le code aligné sur Figma. Choix d'Alexis.
- 31/10/2026 — Backend Supabase, connexion e-mail + mot de passe (chacun son compte, on sait qui a ajouté quoi). Choix d'Alexis.
- 31/10/2026 — App en light mode : Hardwood « Indigo LT » (demande d'Alexis), au lieu d'Indigo DT de Fluide.
- 31/10/2026 — Imports de librairie (icônes Phosphor) : par le serveur Figma officiel (`use_figma`), Bridge expire comme pour Fluide.
- 31/10/2026 — Écran de référence `Liste — en cours` (279:50) composé, en attente de validation. Propositions locales dans la section dédiée de `Cabas · App` : barre d'onglets (Liste, Repas, Foyer), case à cocher, ligne d'article, champ d'ajout.

- 31/10/2026 — Cadre de `Liste — en cours` validé par Alexis (« Oui, continue »). Composés : A · Liste (5 états) et B · Repas de la semaine (5 états : formulaire, Claude prépare, menu proposé, menu de la semaine, erreur). Reste C · Compte et foyer.
- 31/10/2026 — Modifier un article = écran dédié (règle de Fluide) ; ajout rapide = champ en haut de liste.

- 31/10/2026 — Cas limites ajoutés (32 écrans) : Liste 8, Repas 10, Compte et foyer 14. Livrables : `livrables/courses/ui-liste.md`, `ui-repas.md`, `ui-compte.md`, `user-flow.md`.
- 31/10/2026 — Ordre des rayons en drag and drop (poignée DotsSixVertical), pas de flèches monter / descendre. Demande d'Alexis.
- 31/10/2026 — Un seul « Se déconnecter » : celui de la Carte compte (Fluide). Remarque d'Alexis.
- 31/10/2026 — Page `Cabas · User flow` : 4 couloirs, écrans **à 100 %** (règle ferme d'Alexis, skill `flux-ui` corrigée : plus de clones à 50 %).

- 31/10/2026 — Nom **Cabas** accepté par Alexis (dossier renommé `cabas`, pages Figma renommées `Cabas · App` et `Cabas · User flow`). Dépôt public https://github.com/alexisdesplas/cabas (branche `main`), créé avec son feu vert.
- 31/10/2026 — Code écrit et testé en mode démo (`?demo`) dans le navigateur : connexion, création du foyer, ajout d'articles et doublon, menu généré (exemple), ajout des articles à la liste, drag and drop des rayons, fiche article. **Pas encore testé en vrai** : Supabase (projet à créer par Alexis, `supabase/schema.sql` à exécuter, `js/config.js` à remplir), la fonction `api/repas` (variables Vercel `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) et le déploiement Vercel.
- 31/10/2026 — API Claude : `claude-opus-5-5`, sortie structurée (`output_config.format` + zod), effort `medium`, `max_tokens` 16000, pas de `fallbacks` (un menu de la semaine ne déclenche pas de refus).

## Hypothèses ouvertes
- Prénom de la copine d'Alexis pour le contenu réel des écrans : à demander.
- Rayons et leur ordre : à valider avec l'ordre du magasin habituel.
- Ajout d'article : champ rapide en bas de la liste plutôt qu'un écran dédié (exception à la règle de Fluide « écrans dédiés pour les saisies », à valider).
