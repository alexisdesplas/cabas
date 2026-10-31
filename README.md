# Cabas

Liste de courses partagée à deux. Chacun son compte, un seul foyer, la même liste sur les deux téléphones en direct. Un formulaire « Repas de la semaine » demande à Claude un menu et ajoute ses ingrédients à la liste.

PWA iPhone sans build : `index.html` + `js/` + `css/`. Hébergée sur Vercel, données sur Supabase, Claude appelé depuis une fonction serverless (`api/repas.js`) pour que la clé API ne quitte jamais le serveur.

## Mettre en route

1. **Supabase** — créer un projet, ouvrir l'éditeur SQL et exécuter `supabase/schema.sql`. Dans Authentication → Providers, garder « Email » avec confirmation d'adresse. Dans Authentication → URL Configuration, mettre l'URL Vercel de l'app en Site URL (les liens de validation et de mot de passe oublié y renvoient).
2. **`js/config.js`** — renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Settings → API). Ce sont des valeurs publiques, les règles RLS protègent les données.
3. **Vercel** — importer le dépôt, puis ajouter les variables d'environnement `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Chaque push sur `main` déploie.
4. **Tester sans rien** — ouvrir `index.html?demo` (données locales, menu d'exemple) : `python3 -m http.server 8766` puis http://localhost:8766/?demo.

## Fichiers

- `js/app.js` routeur et onglets · `js/data.js` données (Supabase ou démo) · `js/ui.js` briques d'interface · `js/views/` liste, repas, foyer, compte
- `css/app.css` Hardwood « Indigo LT » en variables CSS
- `api/repas.js` fonction Vercel : formulaire → Claude → menu JSON
- `supabase/schema.sql` tables, règles RLS, fonctions `creer_foyer` / `rejoindre_foyer`
- `sw.js` cache hors ligne (incrémenter `CACHE` à chaque mise à jour)
