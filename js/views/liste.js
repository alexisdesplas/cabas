import { state, articles, prenomDe, teinteDe, initialeDe, RAYONS_DEFAUT } from "../data.js";
import { relaisClavier } from "./ajouter.js";
import { illustration, illustrationCle } from "../illustrations.js";
import { h, icon, btn, navbar, field, input, confirmSheet, toast, go, plural, tuile, avatar, enTete, compteur, titreSection } from "../ui.js";

const rayonsDuFoyer = () => state.foyer?.rayons || RAYONS_DEFAUT;
const detail = a => [a.quantite, a.note, a.source ? `pour ${a.source.replace(/ \(.*\)$/, "").toLowerCase()}` : `ajouté par ${prenomDe(a.ajoute_par)}`].filter(Boolean).join(" · ");
export const avatarsDuFoyer = () => h("div", { class: "avatars" }, [...state.membres].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(m => avatar(initialeDe(m.prenom), teinteDe(m.user_id), "sm", m.prenom)));
const SEUIL = 0.3;        // part de la largeur à glisser pour déclencher
const APPUI_LONG = 450;   // ms

// Ligne d'article (DA du 02/11/2026) : tuile, nom et détail, coche à droite.
// Tap : coche. Glisser à droite : dans le panier. Glisser à gauche : retirer, annulable. Appui long : modifier.
function ligne(a) {
  const row = h("div", { class: `row article${a.coche ? " on" : ""}`, role: "checkbox", "aria-checked": String(a.coche), tabindex: 0,
    onKeydown: e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); articles.toggle(a.id); } if (e.key === "e") go(`#/article/${a.id}`); } },
    tuile(illustration(a.nom, a.rayon), 44),
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, a.nom), h("span", { class: "caption" }, detail(a))),
    h("span", { class: "check" }, icon("check")));
  const fondD = h("div", { class: "swipe-fond droite" }, icon("check"), h("span", null, a.coche ? "À reprendre" : "Dans le panier"));
  const fondG = h("div", { class: "swipe-fond gauche" }, h("span", null, "Retirer"), icon("x"));
  const wrap = h("div", { class: "swipe" }, fondD, fondG, row);

  let x0 = 0, y0 = 0, dx = 0, actif = false, horizontal = null, timer = null, longue = false;
  const largeur = () => wrap.clientWidth || 342;
  const poser = v => { row.style.transform = v ? `translateX(${v}px)` : ""; const p = Math.abs(v) / largeur(); fondD.classList.toggle("pret", v > 0 && p > SEUIL); fondG.classList.toggle("pret", v < 0 && p > SEUIL); fondD.style.opacity = v > 0 ? 1 : 0; fondG.style.opacity = v < 0 ? 1 : 0; };
  const finir = () => { row.classList.remove("glisse"); poser(0); actif = false; horizontal = null; };
  row.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; actif = true; horizontal = null; longue = false;
    timer = setTimeout(() => { if (horizontal) return; longue = true; actif = false; navigator.vibrate?.(10); go(`#/article/${a.id}`); }, APPUI_LONG);
  });
  row.addEventListener("pointermove", e => {
    if (!actif) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) { horizontal = Math.abs(mx) > Math.abs(my); clearTimeout(timer); if (horizontal) { row.setPointerCapture(e.pointerId); row.classList.add("glisse"); } else actif = false; }
    if (horizontal) { dx = mx; poser(dx); }
  });
  const lacher = async e => {
    clearTimeout(timer);
    if (!actif) return;
    const p = dx / largeur();
    if (horizontal && p > SEUIL) { finir(); navigator.vibrate?.(8); await articles.toggle(a.id); }
    else if (horizontal && p < -SEUIL) { row.style.transition = "transform 160ms var(--ease), opacity 160ms"; row.style.opacity = 0; poser(-largeur()); navigator.vibrate?.(8); setTimeout(() => retirer(a), 150); }
    else if (horizontal) finir();
    else if (!longue && Math.abs(dx) < 8) { finir(); articles.toggle(a.id); }
    else finir();
  };
  row.addEventListener("pointerup", lacher);
  row.addEventListener("pointercancel", () => { clearTimeout(timer); finir(); });
  row.addEventListener("contextmenu", e => e.preventDefault());
  return wrap;
}

// Retrait par le glisser : l'article part, le toast permet de le remettre tel quel.
async function retirer(a) {
  const copie = { nom: a.nom, quantite: a.quantite, rayon: a.rayon, note: a.note || "", source: a.source || "" };
  await articles.remove(a.id);
  toast(`${a.nom} retiré`, { tone: "succes", action: { label: "Annuler", onClick: () => articles.add(copie) } });
}

// Bouton flottant « Ajouter » : ouvre l'écran dédié. Le relais clavier se fait dans le geste.
const fab = () => h("button", { type: "button", class: "fab", "aria-label": "Ajouter un article", onClick: () => { relaisClavier(); go("#/ajouter"); } }, icon("plus"));

function groupe(nom, items, droite) { return h("div", { class: "groupe" }, titreSection(nom, droite ?? items.length), h("div", { class: "lignes" }, items.map(ligne))); }

export function listeView() {
  const tous = state.articles, restants = tous.filter(a => !a.coche), panier = tous.filter(a => a.coche);
  const activite = state.activite && Date.now() - state.activite.t < 60000 ? state.activite : null;
  const fini = tous.length > 0 && restants.length === 0;
  const children = [enTete((state.foyer?.nom || "Chez nous").toUpperCase(), "Courses", avatarsDuFoyer())];

  if (tous.length === 0) {
    children.push(h("div", { class: "card vide" },
      tuile(illustrationCle("shopping_cart"), 96, false),
      h("p", { class: "heading-md" }, "Rien à acheter pour l'instant"),
      h("p", { class: "body-sm discret" }, "Ajoute tes articles avec le bouton +, ou laisse Claude préparer les repas de la semaine et la liste qui va avec."),
      btn("Préparer les repas de la semaine", { variant: "primary", size: "lg", full: true, onClick: () => go("#/repas/formulaire") })));
  } else {
    children.push(compteur(restants.length, "à prendre", `${panier.length} sur ${tous.length} dans le panier`, panier.length / tous.length, fini ? "succes" : null));
    if (state.horsLigne) children.push(h("div", { class: "bandeau attention" }, `Hors ligne${state.enAttente ? ` · ${plural(state.enAttente, "modification en attente", "modifications en attente")}, envoyées dès que le réseau revient.` : " · la liste affichée est la dernière reçue."}`));
    if (activite) children.push(h("div", { class: "bandeau" }, activite.texte));
    if (fini) children.push(h("div", { class: "card finies" },
      h("div", { class: "finies-haut" }, tuile(illustrationCle("party_popper"), 56), h("div", { class: "row-main" }, h("span", { class: "heading-md" }, "Tout est dans le panier"), h("span", { class: "caption" }, "Vide le panier : la liste repart propre, et ces achats rejoignent tes placards."))),
      btn("Terminer les courses", { variant: "primary", size: "lg", full: true, onClick: terminer })));
    for (const r of rayonsDuFoyer()) { const dedans = restants.filter(a => a.rayon === r); if (dedans.length) children.push(groupe(r.toUpperCase(), dedans)); }
    const autres = restants.filter(a => !rayonsDuFoyer().includes(a.rayon));
    if (autres.length) children.push(groupe("AUTRES", autres));
    if (panier.length) children.push(h("div", { class: "groupe" },
      h("div", { class: "sec" }, h("span", { class: "overline" }, "DANS LE PANIER"), h("span", { class: "filet" }), fini ? h("span", { class: "caption num" }, panier.length) : h("button", { type: "button", class: "lien", onClick: viderPanier }, "Vider le panier")),
      h("div", { class: "lignes" }, panier.map(ligne))));
  }
  const el = h("div", { class: "screen" }, h("div", { class: "scroll" }, children), fab());
  return { el, tab: "" };
}

function terminer() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Terminer les courses ?", message: `${n > 1 ? `Les ${n} articles du panier sortent` : "L'article du panier sort"} de la liste et rejoignent tes placards. Le menu de la semaine reste.`, confirmLabel: "Terminer les courses", cancelLabel: "Pas encore",
    onConfirm: async () => { await articles.viderPanier(); toast("Courses terminées", { tone: "succes" }); } });
}
function viderPanier() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Vider le panier ?", message: `${n > 1 ? `Les ${n} articles cochés sortent` : "L'article coché sort"} de la liste. Pour ${n > 1 ? "les" : "le"} remettre à prendre, ${n > 1 ? "décoche-les" : "décoche-le"} plutôt.`, confirmLabel: "Vider le panier", cancelLabel: "Annuler", destructive: true,
    onConfirm: async () => { await articles.viderPanier(); toast("Panier vidé", { tone: "succes" }); } });
}

// Quantité : nombre + unité. « 250 g » → { n: 250, u: "g" } ; « 3 » → { n: 3, u: "" } ; « 1 botte » → { n: 1, u: "botte" }.
const UNITES = ["", "g", "kg", "cl", "L"];
const PAS = { "": 1, g: 50, kg: 0.5, cl: 10, L: 0.5 };
const lireQuantite = q => { const m = (q || "").trim().match(/^([\d]+(?:[.,]\d+)?)\s*(.*)$/); return m ? { n: parseFloat(m[1].replace(",", ".")), u: m[2].trim() } : { n: q ? NaN : 1, u: q || "" }; };
const ecrireQuantite = ({ n, u }) => (Number.isFinite(n) ? `${String(n).replace(".", ",")}${u ? " " + u : ""}` : u);

// Écran dédié : aperçu, nom, quantité en compteur, rayon, note, retirer. (Appui long sur une ligne.)
export function articleView({ id }) {
  const a = state.articles.find(x => x.id === id);
  if (!a) { go("#/"); return { el: h("div") }; }
  const v = { nom: a.nom, rayon: a.rayon, note: a.note || "", q: lireQuantite(a.quantite) };
  const nom = input({ value: v.nom, onInput: e => { v.nom = e.target.value; } });
  const note = input({ value: v.note, placeholder: "Ex. bien mûrs, la marque bleue, pas en sachet", onInput: e => { v.note = e.target.value; } });
  const rayons = rayonsDuFoyer().includes(a.rayon) ? rayonsDuFoyer() : [...rayonsDuFoyer(), a.rayon];
  const sel = h("select", { class: "input", onChange: e => { v.rayon = e.target.value; } }, rayons.map(r => h("option", { value: r, selected: r === v.rayon }, r)));

  // Compteur de quantité : − valeur +, unité en puces ; le pas suit l'unité ; tap sur la valeur pour la taper.
  const valeur = h("button", { type: "button", class: "qte-valeur num", "aria-label": "Quantité, toucher pour saisir", onClick: () => { const s = prompt("Quantité", Number.isFinite(v.q.n) ? String(v.q.n) : ""); if (s != null && s.trim()) { v.q.n = parseFloat(s.replace(",", ".")); maj(); } } });
  const unites = h("div", { class: "unites" });
  const maj = () => {
    valeur.textContent = Number.isFinite(v.q.n) ? String(v.q.n).replace(".", ",") : "—";
    const liste = UNITES.includes(v.q.u) ? UNITES : [...UNITES, v.q.u];
    unites.replaceChildren(...liste.map(u => h("button", { type: "button", class: `unite${u === v.q.u ? " on" : ""}`, "aria-pressed": String(u === v.q.u), onClick: () => { v.q.u = u; if (!Number.isFinite(v.q.n)) v.q.n = PAS[u] || 1; maj(); } }, u || "pièce")));
  };
  const pas = () => PAS[v.q.u] ?? 1;
  const arrondi = x => Math.round(x * 100) / 100;
  const moins = h("button", { type: "button", class: "qte-btn", "aria-label": "Moins", onClick: () => { v.q.n = arrondi(Math.max(0, (Number.isFinite(v.q.n) ? v.q.n : pas()) - pas())); maj(); } }, icon("minus"));
  const plus = h("button", { type: "button", class: "qte-btn plus", "aria-label": "Plus", onClick: () => { v.q.n = arrondi((Number.isFinite(v.q.n) ? v.q.n : 0) + pas()); maj(); } }, icon("plus"));
  maj();
  const qte = h("div", { class: "qte" }, h("div", { class: "qte-pas" }, moins, valeur, plus), unites);

  const enregistrer = async () => {
    if (!v.nom.trim()) { nom.focus(); return; }
    await articles.update(id, { nom: v.nom.trim(), quantite: ecrireQuantite(v.q), rayon: v.rayon, note: v.note.trim() });
    go("#/");
  };
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Courses", href: "#/" }, title: "Modifier" }),
    h("div", { class: "scroll" },
      h("div", { class: "hero" }, tuile(illustration(a.nom, a.rayon), 72, false), h("div", { class: "row-main" }, h("h1", { class: "heading-xl" }, a.nom), h("span", { class: "caption" }, `${a.ajoute_par === state.user?.id ? "Ajouté par toi" : `Ajouté par ${prenomDe(a.ajoute_par)}`}${a.source ? ` · ${a.source}` : ""}`))),
      h("div", { class: "card champs" },
        field({ label: "Article", input: nom }),
        field({ label: "Quantité", input: qte, help: "Le pas suit l'unité : 50 g, 0,5 kg, 1 pièce. Touche le chiffre pour le taper." }),
        field({ label: "Rayon", input: sel }),
        field({ label: "Note", input: note })),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: enregistrer }),
      h("button", { type: "button", class: "lien danger", onClick: () => confirmSheet({ title: `Retirer ${a.nom} ?`, message: a.source ? "Le menu de la semaine ne change pas." : "Tu pourras le rajouter à tout moment.", confirmLabel: "Retirer", destructive: true, onConfirm: async () => { await articles.remove(id); go("#/"); } }) }, "Retirer de la liste")));
  return { el };
}
