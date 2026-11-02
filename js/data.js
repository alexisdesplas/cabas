// Données : comptes, foyer, articles, menus. Deux moteurs derrière la même façade :
// Supabase (le vrai), ou la démo (localStorage, menu d'exemple) quand js/config.js est vide ou que l'URL porte ?demo.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const DEMO = new URLSearchParams(location.search).has("demo") || !SUPABASE_URL;
export const RAYONS_DEFAUT = ["Fruits et légumes", "Crèmerie", "Boucherie et poisson", "Épicerie", "Boissons", "Surgelés", "Hygiène et maison"];

export const state = {
  pret: false,
  user: null,          // { id, email }
  membre: null,        // { user_id, prenom, foyer_id }
  foyer: null,         // { id, nom, code, code_expire_le, rayons }
  membres: [],         // [{ user_id, prenom, created_at }]
  articles: [],        // [{ id, nom, quantite, rayon, coche, ajoute_par, source, created_at, updated_at }]
  menu: null,          // dernier menu : { id, semaine, demande, repas, ajoute, created_at }
  majLe: null,         // dernière mise à jour reçue
  activite: null,      // { texte, t } : ce que l'autre vient de faire
  horsLigne: !navigator.onLine,
  enAttente: 0         // modifications pas encore envoyées (hors ligne)
};

const listeners = new Set();
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const notify = () => listeners.forEach(fn => fn());

export const uid = () => Math.random().toString(36).slice(2, 10);
// UUID v4 : crypto.randomUUID n'existe qu'en contexte sécurisé (HTTPS ou localhost). Sur http://192.168.x.x il est absent, et l'ajout plantait en silence.
export const uuid = () => crypto.randomUUID?.() ?? (() => { const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; const h = [...b].map(x => x.toString(16).padStart(2, "0")).join(""); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; })();
export const prenomDe = id => (id === state.user?.id ? "toi" : state.membres.find(m => m.user_id === id)?.prenom || "l'autre");
export const lundi = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
export const dateKey = d => new Date(d).toLocaleDateString("sv-SE");
const norm = s => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const chercherArticle = nom => state.articles.find(a => norm(a.nom) === norm(nom));

// Rayon deviné d'après le nom, pour l'ajout rapide ; modifiable ensuite.
const DEVINE = [
  [/tomate|courgette|salade|pomme|banane|citron|oignon|ail|carotte|poireau|avocat|coriandre|persil|basilic|fruit|légume|poire|fraise|champignon|épinard|concombre|poivron|aubergine|patate|pomme de terre|herbe/, "Fruits et légumes"],
  [/lait|yaourt|beurre|crème|fromage|comté|œuf|oeuf|emmental|mozzarella|parmesan|chèvre/, "Crèmerie"],
  [/poulet|bœuf|boeuf|porc|jambon|saumon|poisson|crevette|steak|viande|lardon|thon|cabillaud|dinde/, "Boucherie et poisson"],
  [/eau|jus|bière|vin|soda|café|thé/, "Boissons"],
  [/glace|surgelé|frites/, "Surgelés"],
  [/savon|lessive|papier|dentifrice|shampo|éponge|sac poubelle|liquide vaisselle/, "Hygiène et maison"]
];
export const devinerRayon = nom => { const n = norm(nom); const r = DEVINE.find(([re]) => re.test(n)); const rayons = state.foyer?.rayons || RAYONS_DEFAUT; return r && rayons.includes(r[1]) ? r[1] : rayons.includes("Épicerie") ? "Épicerie" : rayons[0]; };

addEventListener("online", () => { state.horsLigne = false; notify(); moteur.reprendre?.(); });
addEventListener("offline", () => { state.horsLigne = true; notify(); });

// ———————————————————————————————————————————— Démo : tout en local, deux personnes simulées
const DEMO_KEY = "cabas-demo-v1";
const demo = {
  st: null,
  load() {
    try { this.st = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch {}
    if (!this.st) this.st = { connecte: false, foyer: null, articles: [], menu: null };
  },
  save() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(this.st)); } catch {} },
  pousser() {
    state.user = this.st.connecte ? { id: "moi", email: "alexis@exemple.fr" } : null;
    state.membre = state.user ? { user_id: "moi", prenom: "Alexis", foyer_id: this.st.foyer?.id || null } : null;
    state.foyer = state.user ? this.st.foyer : null;
    state.membres = state.foyer ? [{ user_id: "moi", prenom: "Alexis", created_at: state.foyer.created_at }, ...(state.foyer.elle ? [{ user_id: "elle", prenom: "Elle", created_at: state.foyer.elle }] : [])] : [];
    state.articles = state.foyer ? this.st.articles : [];
    state.menu = state.foyer ? this.st.menu : null;
    state.pret = true;
    notify();
  },
  async init() { this.load(); this.pousser(); },
  async signUp() { this.st.connecte = true; this.save(); this.pousser(); return { aValider: false }; },
  async signIn(email, mdp) { if (mdp === "faux") throw new Error("E-mail ou mot de passe incorrect."); this.st.connecte = true; this.save(); this.pousser(); },
  async signOut() { this.st.connecte = false; this.save(); this.pousser(); },
  async resetPassword() {}, async updatePassword() {},
  async creerFoyer() {
    this.st.foyer = { id: uid(), nom: "Chez nous", code: "7KQ-4MZ", code_expire_le: new Date(Date.now() + 7 * 86400000).toISOString(), rayons: RAYONS_DEFAUT, created_at: new Date().toISOString(), elle: null };
    this.st.articles = []; this.save(); this.pousser();
    // Elle rejoint 6 s plus tard et ajoute un article : on voit le temps réel.
    setTimeout(() => { if (!this.st.foyer) return; this.st.foyer.elle = new Date().toISOString(); this.save(); this.pousser(); }, 6000);
    setTimeout(() => { if (!this.st.foyer?.elle) return; this.st.articles.push({ id: uid(), nom: "Beurre doux", quantite: "250 g", rayon: "Crèmerie", coche: false, ajoute_par: "elle", source: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); state.activite = { texte: "Elle vient d'ajouter Beurre doux en Crèmerie.", t: Date.now() }; state.majLe = Date.now(); this.save(); this.pousser(); }, 12000);
  },
  async rejoindreFoyer(code) {
    if (code.replace("-", "").toUpperCase() !== "7KQ4MZ") throw new Error("Code inconnu ou expiré. Demande-lui un nouveau code depuis son onglet Foyer.");
    await this.creerFoyer();
  },
  async quitterFoyer() { this.st.foyer = null; this.save(); this.pousser(); },
  async renouvelerCode() { this.st.foyer.code = "N3P-8RW"; this.st.foyer.code_expire_le = new Date(Date.now() + 7 * 86400000).toISOString(); this.save(); this.pousser(); },
  async saveRayons(rayons) { this.st.foyer.rayons = rayons; this.save(); this.pousser(); },
  async saveHabituels(h) { this.st.foyer.habituels = h; this.save(); },
  async addArticle(a) { const art = { id: uid(), coche: false, ajoute_par: "moi", source: "", quantite: "", note: "", ...a, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; this.st.articles.push(art); state.majLe = Date.now(); this.save(); this.pousser(); return art.id; },
  async updateArticle(id, patch) { Object.assign(this.st.articles.find(a => a.id === id), patch, { updated_at: new Date().toISOString() }); state.majLe = Date.now(); this.save(); this.pousser(); },
  async removeArticles(ids) { this.st.articles = this.st.articles.filter(a => !ids.includes(a.id)); state.majLe = Date.now(); this.save(); this.pousser(); },
  async saveMenu(menu) { this.st.menu = { id: uid(), created_at: new Date().toISOString(), ajoute: false, ...menu }; this.save(); this.pousser(); return this.st.menu; },
  async updateMenu(patch) { Object.assign(this.st.menu, patch); this.save(); this.pousser(); },
  async demanderMenu(demande) {
    await new Promise(r => setTimeout(r, 2500));
    if (demande.eviter?.toLowerCase().includes("panne")) throw new Error("Claude n'a pas répondu");
    const ex = (jour, plat, temps, ings, etapes) => ({ jour, plat, temps_min: temps, ingredients: ings.map(([nom, quantite, rayon, deja_la]) => ({ nom, quantite, rayon, deja_la: !!deja_la })), etapes });
    const tous = [
      ex("lundi", "Pâtes complètes au pesto et tomates cerises", 15, [["Pâtes complètes", "500 g", "Épicerie"], ["Pesto", "1 pot", "Épicerie"], ["Tomates cerises", "250 g", "Fruits et légumes"], ["Parmesan", "100 g", "Crèmerie"]], ["Cuire les pâtes 9 min.", "Couper les tomates cerises en deux.", "Mélanger pâtes, pesto et tomates, servir avec le parmesan."]),
      ex("mardi", "Gratin de courgettes au comté", 40, [["Courgettes", "3", "Fruits et légumes"], ["Comté", "200 g", "Crèmerie"], ["Crème fraîche", "20 cl", "Crèmerie"], ["Œufs", "", "Épicerie", true]], ["Émincer les courgettes, les faire revenir 10 min.", "Battre œufs et crème, ajouter le comté râpé.", "Verser sur les courgettes, 25 min au four à 200 °C."]),
      ex("mercredi", "Omelette aux pommes de terre, salade verte", 20, [["Pommes de terre", "500 g", "Fruits et légumes"], ["Salade verte", "1", "Fruits et légumes"], ["Œufs", "6", "Crèmerie"]], ["Cuire les pommes de terre en dés 12 min à la poêle.", "Verser les œufs battus, cuire 6 min à feu doux.", "Servir avec la salade."]),
      ex("jeudi", "Curry de pois chiches au lait de coco", 30, [["Pois chiches en boîte", "400 g", "Épicerie"], ["Lait de coco", "2 boîtes", "Épicerie"], ["Coriandre fraîche", "1 botte", "Fruits et légumes"], ["Riz basmati", "", "Épicerie", true], ["Oignon", "", "Fruits et légumes", true]], ["Faire revenir l'oignon émincé 5 min, ajouter le curry.", "Verser les pois chiches égouttés et le lait de coco, 15 min à feu doux.", "Cuire le riz pendant ce temps, servir avec la coriandre."]),
      ex("vendredi", "Tacos de haricots noirs et avocat", 25, [["Haricots noirs en boîte", "400 g", "Épicerie"], ["Tortillas", "8", "Épicerie"], ["Avocats", "2", "Fruits et légumes"], ["Citron vert", "1", "Fruits et légumes"]], ["Réchauffer les haricots avec du cumin.", "Écraser l'avocat avec le citron.", "Garnir les tortillas chaudes."]),
      ex("samedi", "Dahl de lentilles corail et épinards", 25, [["Lentilles corail", "300 g", "Épicerie"], ["Épinards", "200 g", "Fruits et légumes"], ["Lait de coco", "1 boîte", "Épicerie"]], ["Cuire les lentilles 15 min dans le lait de coco et de l'eau.", "Ajouter les épinards 3 min.", "Servir avec du riz."]),
      ex("dimanche", "Risotto aux champignons", 35, [["Riz à risotto", "300 g", "Épicerie"], ["Champignons", "300 g", "Fruits et légumes"], ["Parmesan", "80 g", "Crèmerie"]], ["Faire revenir les champignons.", "Nacrer le riz, mouiller louche par louche 18 min.", "Finir avec le parmesan."])
    ];
    if (demande.remplacer) return { repas: [tous.find(r => r.plat !== demande.remplacer.plat && !demande.autres?.includes(r.plat)) || tous[5]] };
    const n = Math.min(7, Number(demande.repas) || 0);
    return { repas: tous.slice(0, n) };
  },
  reprendre() {}
};

// ———————————————————————————————————————————— Supabase
const sb = {
  client: null, canal: null, file: [],
  async init() {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.client.auth.onAuthStateChange((evt, session) => {
      state.user = session?.user ? { id: session.user.id, email: session.user.email } : null;
      if (evt === "PASSWORD_RECOVERY") location.hash = "#/compte/mot-de-passe";
      this.charger();
    });
    const { data } = await this.client.auth.getSession();
    state.user = data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null;
    await this.charger();
  },
  async charger() {
    if (!state.user) { Object.assign(state, { membre: null, foyer: null, membres: [], articles: [], menu: null, pret: true }); this.canal?.unsubscribe(); this.canal = null; notify(); return; }
    const { data: membre } = await this.client.from("membres").select("*").eq("user_id", state.user.id).maybeSingle();
    state.membre = membre || { user_id: state.user.id, prenom: "", foyer_id: null };
    if (!state.membre.foyer_id) { Object.assign(state, { foyer: null, membres: [], articles: [], menu: null, pret: true }); notify(); return; }
    const [{ data: foyer }, { data: membres }, { data: articles }, { data: menus }] = await Promise.all([
      this.client.from("foyers").select("*").eq("id", state.membre.foyer_id).single(),
      this.client.from("membres").select("user_id, prenom, created_at").eq("foyer_id", state.membre.foyer_id).order("created_at"),
      this.client.from("articles").select("*").eq("foyer_id", state.membre.foyer_id).order("created_at"),
      this.client.from("menus").select("*").eq("foyer_id", state.membre.foyer_id).order("semaine", { ascending: false }).limit(1)
    ]);
    state.foyer = foyer; state.membres = membres || []; state.articles = articles || []; state.menu = menus?.[0] || null; state.majLe = Date.now(); state.pret = true;
    this.ecouter(); notify();
  },
  ecouter() {
    if (this.canal) return;
    const f = state.membre.foyer_id;
    this.canal = this.client.channel("foyer-" + f)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles", filter: `foyer_id=eq.${f}` }, p => {
        if (p.new.ajoute_par && p.new.ajoute_par !== state.user.id) state.activite = { texte: `${prenomDe(p.new.ajoute_par)} vient d'ajouter ${p.new.nom} en ${p.new.rayon}.`, t: Date.now() };
        this.charger();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "articles", filter: `foyer_id=eq.${f}` }, () => this.charger())
      .on("postgres_changes", { event: "*", schema: "public", table: "menus", filter: `foyer_id=eq.${f}` }, () => this.charger())
      .on("postgres_changes", { event: "*", schema: "public", table: "membres" }, () => this.charger())
      .on("postgres_changes", { event: "*", schema: "public", table: "foyers", filter: `id=eq.${f}` }, () => this.charger())
      .subscribe();
  },
  // Hors ligne : on applique localement, on garde l'ordre à envoyer, on rejoue au retour du réseau.
  async envoyer(fn) {
    if (state.horsLigne) { this.file.push(fn); state.enAttente = this.file.length; notify(); return; }
    const { error } = await fn();
    if (error) throw new Error(error.message);
  },
  async reprendre() {
    const file = this.file.splice(0);
    for (const fn of file) { try { await fn(); } catch {} }
    state.enAttente = 0; await this.charger();
  },
  erreur(e) { const m = e?.message || ""; if (/Invalid login/i.test(m)) return "E-mail ou mot de passe incorrect."; if (/already registered/i.test(m)) return "Un compte existe déjà avec cet e-mail : connecte-toi."; if (/Password should/i.test(m)) return "8 caractères au moins."; if (/code inconnu/i.test(m)) return "Code inconnu ou expiré. Demande-lui un nouveau code depuis son onglet Foyer."; if (/Email not confirmed/i.test(m)) return "Valide d'abord ton adresse : suis le lien reçu par e-mail."; if (/rate limit/i.test(m)) return "Trop d'e-mails envoyés : Supabase en limite 2 par heure. Réessaie dans une heure, ou cherche le précédent dans les indésirables."; return m || "Erreur inattendue."; },
  async signUp(prenom, email, mdp) {
    const { data, error } = await this.client.auth.signUp({ email, password: mdp, options: { data: { prenom }, emailRedirectTo: location.origin + location.pathname } });
    if (error) throw new Error(this.erreur(error));
    return { aValider: !data.session };
  },
  async signIn(email, mdp) { const { error } = await this.client.auth.signInWithPassword({ email, password: mdp }); if (error) throw new Error(this.erreur(error)); },
  async signOut() { await this.client.auth.signOut(); },
  // Pas de #route dans redirectTo : Supabase colle #access_token=… derrière, et le jeton ne serait plus lu. L'événement PASSWORD_RECOVERY (plus haut) ouvre l'écran du mot de passe.
  async resetPassword(email) { const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw new Error(this.erreur(error)); },
  async updatePassword(mdp) { const { error } = await this.client.auth.updateUser({ password: mdp }); if (error) throw new Error(this.erreur(error)); },
  async rpc(nom, args) { const { data, error } = await this.client.rpc(nom, args); if (error) throw new Error(this.erreur(error)); return data; },
  async creerFoyer() { await this.rpc("creer_foyer"); this.canal?.unsubscribe(); this.canal = null; await this.charger(); },
  async rejoindreFoyer(code) { await this.rpc("rejoindre_foyer", { p_code: code }); this.canal?.unsubscribe(); this.canal = null; await this.charger(); },
  async quitterFoyer() { await this.rpc("quitter_foyer"); this.canal?.unsubscribe(); this.canal = null; await this.charger(); },
  async renouvelerCode() { await this.rpc("renouveler_code"); await this.charger(); },
  async saveRayons(rayons) { state.foyer.rayons = rayons; notify(); await this.envoyer(() => this.client.from("foyers").update({ rayons }).eq("id", state.foyer.id)); },
  async saveHabituels(habituels) { await this.envoyer(() => this.client.from("foyers").update({ habituels }).eq("id", state.foyer.id)); },
  async addArticle(a) {
    const row = { id: uuid(), foyer_id: state.foyer.id, ajoute_par: state.user.id, coche: false, quantite: "", source: "", note: "", ...a };
    state.articles.push({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); notify();
    await this.envoyer(() => this.client.from("articles").insert(row));
    return row.id;
  },
  async updateArticle(id, patch) {
    Object.assign(state.articles.find(a => a.id === id) || {}, patch); notify();
    await this.envoyer(() => this.client.from("articles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id));
  },
  async removeArticles(ids) {
    state.articles = state.articles.filter(a => !ids.includes(a.id)); notify();
    await this.envoyer(() => this.client.from("articles").delete().in("id", ids));
  },
  async saveMenu(menu) {
    const { data, error } = await this.client.from("menus").insert({ foyer_id: state.foyer.id, ...menu }).select().single();
    if (error) throw new Error(error.message);
    state.menu = data; notify(); return data;
  },
  async updateMenu(patch) { Object.assign(state.menu, patch); notify(); await this.envoyer(() => this.client.from("menus").update(patch).eq("id", state.menu.id)); },
  async demanderMenu(demande) {
    const { data: { session } } = await this.client.auth.getSession();
    const r = await fetch("/api/repas", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(demande) });
    if (!r.ok) { let m = "Claude n'a pas répondu"; try { m = (await r.json()).erreur || m; } catch {} throw new Error(m); }
    return r.json();
  }
};

const moteur = DEMO ? demo : sb;
export const init = () => moteur.init();
// « Synchroniser » : relit tout depuis le serveur (en démo, relit le localStorage).
export const synchroniser = async () => { if (moteur.charger) await moteur.charger(); else moteur.pousser(); state.majLe = Date.now(); notify(); };
export const auth = { signUp: (p, e, m) => moteur.signUp(p, e, m), signIn: (e, m) => moteur.signIn(e, m), signOut: () => moteur.signOut(), resetPassword: e => moteur.resetPassword(e), updatePassword: m => moteur.updatePassword(m) };
export const foyer = { creer: () => moteur.creerFoyer(), rejoindre: c => moteur.rejoindreFoyer(c), quitter: () => moteur.quitterFoyer(), renouvelerCode: () => moteur.renouvelerCode(), saveRayons: r => moteur.saveRayons(r) };
// Habituels du foyer : compteur par article ajouté à la main (pas ceux du menu), gardé dans foyers.habituels (jsonb).
// Sert à l'écran Ajouter : « Habituels » et « Derniers ajouts ». Au pire, si la colonne manque, l'ajout marche quand même.
export const habituels = () => Object.values(state.foyer?.habituels || {});
const noterHabituel = async ({ nom, rayon }) => {
  if (!state.foyer) return;
  const k = norm(nom), h = { ...(state.foyer.habituels || {}) }, prev = h[k];
  h[k] = { nom, rayon, n: (prev?.n || 0) + 1, le: new Date().toISOString() };
  state.foyer.habituels = h;
  try { await moteur.saveHabituels(h); } catch (e) { console.warn("habituels non enregistrés :", e.message); }
};
const retirerHabituel = async nom => {
  const k = norm(nom), h = { ...(state.foyer?.habituels || {}) };
  if (!h[k]) return;
  if (h[k].n > 1) h[k] = { ...h[k], n: h[k].n - 1 }; else delete h[k];
  state.foyer.habituels = h;
  try { await moteur.saveHabituels(h); } catch {}
};
export const articles = {
  add: async a => { const id = await moteur.addArticle(a); noterHabituel(a); return id; },
  // « Annuler » juste après un ajout : l'article et sa trace dans les habituels s'en vont.
  annulerAjout: async (id, nom) => { await moteur.removeArticles([id]); await retirerHabituel(nom); },
  update: (id, patch) => moteur.updateArticle(id, patch),
  toggle: id => { const a = state.articles.find(x => x.id === id); return moteur.updateArticle(id, { coche: !a.coche }); },
  remove: id => moteur.removeArticles([id]),
  viderPanier: () => moteur.removeArticles(state.articles.filter(a => a.coche).map(a => a.id)),
  decocherTout: async () => { for (const a of state.articles.filter(a => a.coche)) await moteur.updateArticle(a.id, { coche: false }); }
};
export const menus = {
  demander: d => moteur.demanderMenu({ ...d, rayons: state.foyer?.rayons || RAYONS_DEFAUT, deja_liste: state.articles.filter(a => !a.coche).map(a => a.nom) }),
  save: m => moteur.saveMenu(m),
  update: p => moteur.updateMenu(p),
  // Les ingrédients à acheter deviennent des articles, sauf ceux déjà là. Renvoie le nombre ajouté.
  async ajouterALaListe(menu) {
    let n = 0;
    for (const r of menu.repas) for (const i of r.ingredients) {
      if (i.deja_la || chercherArticle(i.nom)) continue;
      await moteur.addArticle({ nom: i.nom, quantite: i.quantite || "", rayon: (state.foyer?.rayons || RAYONS_DEFAUT).includes(i.rayon) ? i.rayon : devinerRayon(i.nom), source: `${r.plat} (${r.jour})` });
      n++;
    }
    return n;
  },
  aAcheter: menu => menu.repas.flatMap(r => r.ingredients).filter(i => !i.deja_la && !chercherArticle(i.nom)).length,
  dejaLa: menu => menu.repas.flatMap(r => r.ingredients).filter(i => i.deja_la || chercherArticle(i.nom)).length
};
