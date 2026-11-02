import { state, articles, prenomDe, RAYONS_DEFAUT } from "../data.js";
import { relaisClavier } from "./ajouter.js";
import { h, icon, btn, navbar, pageHead, hint, field, input, confirmSheet, toast, go, ago, plural } from "../ui.js";

const rayonsDuFoyer = () => state.foyer?.rayons || RAYONS_DEFAUT;
const detail = a => [a.quantite, a.note, a.source ? a.source.replace(/ \(.*\)$/, "") : `ajouté par ${prenomDe(a.ajoute_par)}`].filter(Boolean).join(" · ");

function ligne(a) {
  return h("div", { class: `row article${a.coche ? " on" : ""}`, role: "checkbox", "aria-checked": String(a.coche), tabindex: 0,
    onClick: () => articles.toggle(a.id), onKeydown: e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); articles.toggle(a.id); } } },
    h("span", { class: "check" }, icon("check")),
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, a.nom), h("span", { class: "caption" }, detail(a))),
    h("button", { class: "icon-btn edit", "aria-label": `Modifier ${a.nom}`, onClick: e => { e.stopPropagation(); go(`#/article/${a.id}`); } }, icon("pencil")));
}

// Bouton flottant « Ajouter » : ouvre l'écran dédié (décision du 02/11/2026). Le relais clavier se fait dans le geste.
const fab = () => h("button", { type: "button", class: "fab", "aria-label": "Ajouter un article", onClick: () => { relaisClavier(); go("#/ajouter"); } }, icon("plus"));

// Carte de progression : anneau avec le nombre à prendre, fond teinté, vert quand tout est dans le panier.
function progression(restants, panier, total, fini) {
  const pct = total ? panier.length / total : 0, r = 30, c = 2 * Math.PI * r;
  const anneau = h("svg", { class: "anneau", viewBox: "0 0 72 72", "aria-hidden": "true" },
    h("circle", { svg: true, cx: 36, cy: 36, r, class: "anneau-fond" }),
    h("circle", { svg: true, cx: 36, cy: 36, r, class: "anneau-trait", style: { strokeDasharray: c, strokeDashoffset: c * (1 - pct) } }));
  const rayons = new Set(restants.map(a => a.rayon)).size;
  return h("div", { class: `card progression${fini ? " fini" : ""}` },
    h("div", { class: "progression-haut" },
      h("div", { class: "anneau-wrap" }, anneau, h("span", { class: "anneau-chiffre num" }, fini ? icon("check") : String(restants.length))),
      h("div", { class: "progression-texte" },
        h("span", { class: "overline" }, fini ? "Courses finies" : "À prendre"),
        h("span", { class: "heading-md" }, fini ? `Les ${total} articles sont dans le panier` : plural(restants.length, "article", "articles")),
        h("span", { class: "caption" }, fini ? "Vide le panier : la liste repart propre pour la prochaine fois." : `${panier.length ? `${panier.length} dans le panier · ` : ""}${plural(rayons, "rayon à parcourir", "rayons à parcourir")}`))),
    fini && btn("Terminer les courses", { variant: "primary", size: "lg", full: true, onClick: terminer }));
}

export function listeView() {
  const tous = state.articles, restants = tous.filter(a => !a.coche), panier = tous.filter(a => a.coche);
  const activite = state.activite && Date.now() - state.activite.t < 60000 ? state.activite : null;
  const sous = state.horsLigne ? `Liste du foyer · mise à jour ${state.majLe ? ago(state.majLe) : "en attente"}` : tous.length === 0 ? "Liste du foyer · rien à acheter pour l'instant" : `Liste du foyer · mise à jour ${state.majLe ? ago(state.majLe) : "à l'instant"}`;

  const children = [];
  if (state.horsLigne) children.push(hint(`Hors ligne${state.enAttente ? ` · ${plural(state.enAttente, "modification en attente", "modifications en attente")}, envoyées dès que le réseau revient.` : " · la liste affichée est la dernière reçue."}`, "attention", "wifiOff"));
  if (activite) children.push(hint(activite.texte, null, "plus"));

  if (tous.length === 0) {
    children.push(h("div", { class: "card empty" },
      h("p", { class: "body-md medium fort" }, "La liste est vide"),
      h("p", { class: "body-sm discret" }, "Ajoute tes articles avec le bouton +, ou laisse Claude préparer les repas de la semaine et la liste qui va avec."),
      btn("Préparer les repas de la semaine", { variant: "primary", size: "lg", full: true, onClick: () => go("#/repas/formulaire") })));
  } else {
    const fini = restants.length === 0;
    children.push(progression(restants, panier, tous.length, fini));
    for (const r of rayonsDuFoyer()) {
      const dedans = restants.filter(a => a.rayon === r);
      if (!dedans.length) continue;
      children.push(h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, r), h("span", { class: "caption num" }, dedans.length)),
        h("div", { class: "list" }, dedans.map(ligne)));
    }
    const autres = restants.filter(a => !rayonsDuFoyer().includes(a.rayon));
    if (autres.length) children.push(h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Autres"), h("span", { class: "caption num" }, autres.length)), h("div", { class: "list" }, autres.map(ligne)));
    if (panier.length) children.push(
      h("div", { class: "section-title" }, h("h2", { class: "heading-md discret" }, `Dans le panier · ${panier.length}`),
        !fini && btn("Vider le panier", { variant: "ghost", onClick: viderPanier })),
      h("div", { class: "list" }, panier.map(ligne)));
  }
  const el = h("div", { class: "screen" }, pageHead("Courses", sous), h("div", { class: "scroll" }, children), fab());
  return { el, tab: "" };
}

function terminer() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Terminer les courses ?", message: `Les ${n} articles du panier sortent de la liste. Le menu de la semaine reste.`, confirmLabel: "Terminer", cancelLabel: "Pas encore",
    onConfirm: async () => { await articles.viderPanier(); toast("Courses terminées", { tone: "succes" }); } });
}
function viderPanier() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Vider le panier ?", message: `Les ${n} articles cochés sortent de la liste. Pour les remettre à prendre, décoche-les plutôt.`, confirmLabel: "Vider le panier", cancelLabel: "Annuler", destructive: true,
    onConfirm: async () => { await articles.viderPanier(); toast("Panier vidé", { tone: "succes" }); } });
}

// Écran dédié : nom, quantité, rayon, retirer.
export function articleView({ id }) {
  const a = state.articles.find(x => x.id === id);
  if (!a) { go("#/"); return { el: h("div") }; }
  const v = { nom: a.nom, quantite: a.quantite, rayon: a.rayon, note: a.note || "" };
  const nom = input({ value: v.nom, onInput: e => { v.nom = e.target.value; } });
  const qte = input({ value: v.quantite, placeholder: "Facultatif", onInput: e => { v.quantite = e.target.value; } });
  const note = input({ value: v.note, placeholder: "Facultatif", onInput: e => { v.note = e.target.value; } });
  const rayons = rayonsDuFoyer().includes(a.rayon) ? rayonsDuFoyer() : [...rayonsDuFoyer(), a.rayon];
  const sel = h("select", { class: "input", onChange: e => { v.rayon = e.target.value; } }, rayons.map(r => h("option", { value: r, selected: r === v.rayon }, r)));
  const enregistrer = async () => {
    if (!v.nom.trim()) { nom.focus(); return; }
    await articles.update(id, { nom: v.nom.trim(), quantite: v.quantite.trim(), rayon: v.rayon, note: v.note.trim() });
    go("#/");
  };
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Courses", href: "#/" }, title: "Modifier l'article", subtitle: `${a.ajoute_par === state.user?.id ? "ajouté par toi" : `ajouté par ${prenomDe(a.ajoute_par)}`}${a.source ? ` · ${a.source}` : ""}` }),
    h("div", { class: "scroll" },
      field({ label: "Article", input: nom, help: "Le nom tel que vous le cherchez en rayon." }),
      field({ label: "Quantité", input: qte, help: "Ex. 2, 500 g, 1 botte." }),
      field({ label: "Rayon", input: sel, help: "Range l'article avec ses voisins du magasin." }),
      field({ label: "Note", input: note, help: "Ex. bien mûrs, la marque bleue, pas en sachet." }),
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: enregistrer }),
      btn("Retirer de la liste", { variant: "ghost", full: true, onClick: () => confirmSheet({ title: `Retirer ${a.nom} ?`, message: a.source ? "Le menu de la semaine ne change pas." : "Tu pourras le rajouter à tout moment.", confirmLabel: "Retirer", destructive: true, onConfirm: async () => { await articles.remove(id); go("#/"); } }) })));
  return { el, tab: "" };
}
