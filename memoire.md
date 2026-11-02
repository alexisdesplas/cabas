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

- 31/10/2026 — Retours d'Alexis sur la démo : (1) le champ d'ajout doit **chercher** en tapant → base de ~250 produits courants avec rayon (`js/produits.js`), suggestions sous le champ ; (2) la **quantité** se saisit dans la même phrase (« 3 courgettes », « 500 g riz », « avocats x2 ») ; (3) une **note** libre par article (colonne `articles.note`, champ dans la fiche) ; (4) écran Foyer remis au niveau du Figma (blocs à 8 px, Carte compte avec tuile, pill, Synchroniser · Se déconnecter). Le brouillon du champ survit aux rafraîchissements temps réel.
- 31/10/2026 — **Dette Figma** : les écrans `Liste — en cours` et `Liste — modifier un article` n'ont pas encore l'état « suggestions en tapant », le placeholder « Ajouter… ex. 3 courgettes, 500 g riz » ni le champ Note. À remettre au niveau du code.

- 31/10/2026 — Projet Supabase `cabas` créé par Alexis (réf. `kjmwfxykxeiszfarvkvj`), clé **publishable** (nouveau format, remplace anon) dans `js/config.js`. Schéma exécuté, puis les droits des rôles de l'API ajoutés à la main (le projet ne les donnait pas par défaut : « permission denied for table foyers ») et reportés dans `schema.sql`. L'anon n'a volontairement aucun droit sur les tables : seul `authenticated` passe, filtré par RLS.
- 02/11/2026 — Écran Foyer : la carte « Code d'invitation » **reste visible une fois à deux** (demande d'Alexis : en démo « Elle » rejoint 6 s après la création et le code disparaissait aussitôt). Seul : carte en tête, bouton primaire. À deux : carte après les membres, bouton secondaire, texte « Pour inviter quelqu'un d'autre » ; le lien « Inviter quelqu'un d'autre » sous les membres est retiré, la carte le remplace. Figma `Foyer` à mettre au niveau.
- 02/11/2026 — **Auth Supabase, URL** (tableau de bord → Authentication → URL Configuration) : Site URL `http://192.168.1.11:8766/index.html` (le Mac sur le Wi-Fi local), Redirect URLs `http://192.168.1.11:8766/**` et `http://localhost:8766/**`. Avant : Site URL par défaut `localhost:3000`, donc les liens de reset et de validation d'e-mail tombaient dans le vide. **Au déploiement Vercel** : remplacer le Site URL par l'adresse Vercel et l'ajouter aux Redirect URLs. Premier test à deux : chacun avait scanné le QR `?demo` (données locales, foyer factice « 7KQ-4MZ »), d'où l'absence de synchro.
- 02/11/2026 — **Déployé sur Vercel** : projet `cabas` (compte alexisdesplas-5949), production sur **https://cabas-six-rose.vercel.app** (`cabas.vercel.app` appartient à quelqu'un d'autre). Déploiement par `vercel deploy --prod --yes` depuis le dossier (projet lié, `.vercel/` ignoré par git). Variables en production : `SUPABASE_URL`, `SUPABASE_ANON_KEY` ; **`ANTHROPIC_API_KEY` reste à ajouter par Alexis** dans Settings → Environment Variables, puis redéployer, sinon « Préparer les repas » échoue. Les URL `*-alexisdesplas-5949s-projects.vercel.app` sont protégées par Vercel Authentication (302 vers le SSO) : donner aux téléphones l'adresse `cabas-six-rose`. Supabase : Site URL passé à `https://cabas-six-rose.vercel.app/index.html`, Redirect URL `https://cabas-six-rose.vercel.app/**` ajoutée (les deux adresses locales restent).
- 02/11/2026 — **Bug du lien de reset** : `redirectTo` portait `#/compte/mot-de-passe`, Supabase ajoutait `#access_token=…` derrière, et supabase-js ne lisait plus le jeton → retour sur l'écran de connexion. Corrigé : `redirectTo` sans route, l'événement `PASSWORD_RECOVERY` ouvre l'écran. Cache SW v4, redéployé. Testé par Alexis : à confirmer avec un nouvel e-mail.
- 02/11/2026 — **E-mails Supabase plafonnés** : le service d'envoi intégré limite à 2 e-mails par heure (journal Auth : `429 over_email_send_rate_limit` sur `/recover` à 18:54 et 18:55). Le tableau de bord n'offre que des actions par e-mail (recovery, magic link), pas de mot de passe direct. Message traduit dans `erreur()`. **Dépannage qui marche** : dans l'éditeur SQL, `update auth.users set encrypted_password = crypt('…', gen_salt('bf')), updated_at = now() where email = '…';` (Alexis saisit le mot de passe lui-même). À faire si ça gêne : brancher un SMTP perso (Resend, Brevo…) dans Authentication → Emails → SMTP Settings, ce qui lève aussi la limite.
- 02/11/2026 — **Validation d'e-mail à l'inscription désactivée** (Authentication → Sign In / Providers → « Confirm email » off, fait par Alexis). Les comptes se créent et se connectent sans e-mail ; seul « mot de passe oublié » en envoie encore. Accepté parce qu'un compte sans code d'invitation ne voit rien (RLS par foyer). Le code gère toujours le cas `aValider` si on réactive un jour.
- 02/11/2026 — **Ajout impossible pour Alexis, possible pour Léa** : Alexis testait sur `http://192.168.1.11:8766` (Mac, HTTP) où `crypto.randomUUID` n'existe pas (contexte non sécurisé) ; l'ajout plantait en silence avant la requête, Léa en HTTPS passait. Corrigé : `uuid()` avec repli `getRandomValues`, erreur d'ajout affichée en toast. Même passe : `.add input` à 16 px (sinon iOS zoome au focus) et un seul anneau de focus sur le cadre (`.add:focus-within`). Cache SW v6. **Règle : tester sur l'adresse Vercel, pas sur l'IP du Mac.**
- 02/11/2026 — **Nouveau mécanisme d'ajout** (demande d'Alexis : le champ en tête de liste gênait, hors de portée sur une longue liste, coincé par le clavier, « + » ambigu). Choix : **bouton flottant « + »** en bas à droite de la liste → **écran dédié `#/ajouter`** (`js/views/ajouter.js`) : champ en haut avec clavier, suggestions en dessous, un tap ajoute sans quitter l'écran, compteur « n articles ajoutés » sous le champ, « Terminé ». Avant de taper : **Habituels** (≥ 2 ajouts, par fréquence) et **Derniers ajouts**, sans ce qui est déjà à prendre. Historique dans `foyers.habituels` (jsonb, mis à jour à chaque ajout manuel, pas ceux du menu) — **colonne à créer par Alexis** : `alter table public.foyers add column if not exists habituels jsonb not null default '{}'::jsonb;` (dans `schema.sql`). Le routeur appelle `update()` d'une vue au lieu de la remplacer quand elle le propose : le champ garde le focus et le clavier. Relais clavier iOS : focus d'un champ temporaire dans le geste du bouton. Alternatives écartées : barre fixée au-dessus des onglets (clavier iOS), onglet « Ajouter ». **Dette Figma** : écrans Liste (bouton flottant, sans champ), Ajouter vide, Ajouter en frappe.

## Hypothèses ouvertes
- Prénom de la copine d'Alexis pour le contenu réel des écrans : à demander.
- Rayons et leur ordre : à valider avec l'ordre du magasin habituel.
- Ajout d'article : champ rapide en bas de la liste plutôt qu'un écran dédié (exception à la règle de Fluide « écrans dédiés pour les saisies », à valider).
