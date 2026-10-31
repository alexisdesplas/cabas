# Cabas — contexte pour Claude Code

Liste de courses partagée à deux (Alexis et sa copine), avec les repas de la semaine préparés par Claude. PWA iPhone sans build ni dépendance côté client : HTML/CSS/JS en modules ES, comme Fluide et Tabatime.

- Lire `memoire.md` d'abord : décisions datées, glossaire, hypothèses ouvertes.
- Figma : fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, pages `Cabas · App` (32 écrans, Hardwood « Indigo LT ») et `Cabas · User flow`. Le code est aligné sur ces écrans.
- Données partagées et comptes : Supabase (`supabase/schema.sql`, à exécuter dans l'éditeur SQL du projet). Le client lit `js/config.js` (URL + clé anon, publiques). Temps réel via `postgres_changes`.
- Clé API Claude : jamais dans le navigateur. `api/repas.js` (fonction Vercel, Node) vérifie la session Supabase puis appelle l'API Claude ; variables d'environnement Vercel `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Mode démo : `index.html?demo` fait tourner l'app sans Supabase (données dans le localStorage, menu d'exemple). Sert à tester les écrans.
- Tester en local : `python3 -m http.server 8766` (config `cabas` dans `.claude/launch.json`), viewport 390. La fonction `api/repas` demande `vercel dev`.
- À chaque mise à jour, incrémenter `CACHE` dans `sw.js` et y lister tout nouveau fichier.
- Interface en français. Écrans dédiés pour les saisies (modifier un article, ordre des rayons), feuilles pour les confirmations et les choix rapides, un champ d'ajout rapide en haut de la liste.
