import { state, articles, chercherArticle, devinerRayon, prenomDe, RAYONS_DEFAUT } from "../data.js";
import { suggerer, produitExact, analyser } from "../produits.js";
import { h, icon, btn, navbar, pageHead, hint, field, input, sheet, confirmSheet, toast, go, ago, plural } from "../ui.js";

const rayonsDuFoyer = () => state.foyer?.rayons || RAYONS_DEFAUT;
const detail = a => [a.quantite, a.note, a.source ? a.source.replace(/ \(.*\)$/, "") : `ajouté par ${prenomDe(a.ajoute_par)}`].filter(Boolean).join(" · ");

function ligne(a) {
  return h("div", { class: `row article${a.coche ? " on" : ""}`, role: "checkbox", "aria-checked": String(a.coche), tabindex: 0,
    onClick: () => articles.toggle(a.id), onKeydown: e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); articles.toggle(a.id); } } },
    h("span", { class: "check" }, icon("check")),
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, a.nom), h("span", { class: "caption" }, detail(a))),
    h("button", { class: "icon-btn edit", "aria-label": `Modifier ${a.nom}`, onClick: e => { e.stopPropagation(); go(`#/article/${a.id}`); } }, icon("pencil")));
}

// Ajout rapide : en tapant, les produits de la base se proposent avec leur rayon ; la quantité se dit
// dans la même phrase (« 3 courgettes », « 500 g riz »). Le texte tapé survit aux rafraîchissements de l'écran.
let brouillon = "", brouillonFocus = false;
const rayonConnu = r => rayonsDuFoyer().includes(r) ? r : null;

function champAjout() {
  const inp = input({ placeholder: "Ajouter… ex. 3 courgettes, 500 g riz", "aria-label": "Nouvel article", autocomplete: "off", autocorrect: "off", enterkeyhint: "done", value: brouillon,
    onInput: e => { brouillon = e.target.value; proposer(); },
    onFocus: () => { brouillonFocus = true; proposer(); }, onBlur: () => { brouillonFocus = false; setTimeout(() => { if (!brouillonFocus) panneau.replaceChildren(); }, 150); },
    onKeydown: e => { if (e.key === "Enter") { e.preventDefault(); const premier = panneau.querySelector("button"); premier ? premier.click() : ajouter(analyser(brouillon)); } if (e.key === "Escape") { brouillon = ""; e.target.value = ""; panneau.replaceChildren(); } } });
  const panneau = h("div", { class: "suggest", style: { display: "none" } });
  const ligne = (nom, sous, libre, onPick) => h("button", { type: "button", class: `row${libre ? " libre" : ""}`, onPointerdown: e => e.preventDefault(), onClick: onPick },
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, nom), sous && h("span", { class: "caption" }, sous)), icon("plus", "plus"));
  const proposer = () => {
    const texte = brouillon.trim();
    if (!texte) { panneau.style.display = "none"; panneau.replaceChildren(); return; }
    const { nom, quantite } = analyser(texte);
    const qte = quantite ? ` · ${quantite}` : "";
    const lignes = suggerer(nom).map(p => ligne(p.nom, `${rayonConnu(p.rayon) || devinerRayon(p.nom)}${qte}`, false, () => ajouter({ nom: p.nom, quantite, rayon: rayonConnu(p.rayon) || devinerRayon(p.nom) })));
    if (!produitExact(nom)) lignes.push(ligne(`Ajouter « ${nom} »`, `${devinerRayon(nom)}${qte}`, true, () => ajouter({ nom, quantite })));
    panneau.replaceChildren(...lignes); panneau.style.display = "";
  };
  const vider = () => { brouillon = ""; inp.value = ""; panneau.style.display = "none"; panneau.replaceChildren(); inp.focus(); };
  // On vide le champ avant d'enregistrer : l'enregistrement redessine l'écran, et le nouveau champ repart du brouillon.
  const ajouter = async ({ nom, quantite = "", rayon }) => {
    if (!nom) return;
    vider();
    rayon = rayon || devinerRayon(nom);
    const existant = chercherArticle(nom);
    if (existant && !existant.coche) {
      sheet({ title: `${existant.nom} est déjà dans la liste`, body: close => [
        h("p", { class: "body-md" }, `${existant.quantite ? `Il y en a ${existant.quantite} à prendre` : "Il est déjà à prendre"}, ${existant.ajoute_par === state.user?.id ? "ajouté par toi" : `ajouté par ${prenomDe(existant.ajoute_par)}`}. Plutôt que créer un doublon, tu veux changer la quantité ?`),
        quantite && btn(`Passer à ${quantite}`, { variant: "primary", size: "lg", full: true, onClick: async () => { close(); await articles.update(existant.id, { quantite }); toast(`${existant.nom} · ${quantite}`); } }),
        btn(quantite ? "Modifier autrement" : "Modifier la quantité", { variant: quantite ? "ghost" : "primary", size: quantite ? undefined : "lg", full: true, onClick: () => { close(); go(`#/article/${existant.id}`); } }),
        btn("Ajouter quand même", { variant: "ghost", full: true, onClick: async () => { close(); await articles.add({ nom, quantite, rayon }); } })
      ] });
      return;
    }
    if (existant?.coche) { await articles.update(existant.id, { coche: false, ...(quantite ? { quantite } : {}) }); toast(`${existant.nom} remis à prendre`); return; }
    try { await articles.add({ nom, quantite, rayon }); } catch (e) { toast(e.message || "L'ajout a échoué"); }
  };
  if (brouillonFocus) setTimeout(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); proposer(); });
  return h("div", { class: "add-wrap" },
    h("div", { class: "add" }, inp, h("button", { type: "button", "aria-label": "Ajouter", onPointerdown: e => e.preventDefault(), onClick: () => { const premier = panneau.querySelector("button"); premier ? premier.click() : ajouter(analyser(brouillon)); } }, icon("plus"))),
    panneau);
}

export function listeView() {
  const tous = state.articles, restants = tous.filter(a => !a.coche), panier = tous.filter(a => a.coche);
  const activite = state.activite && Date.now() - state.activite.t < 60000 ? state.activite : null;
  const sous = state.horsLigne ? `Liste du foyer · mise à jour ${state.majLe ? ago(state.majLe) : "en attente"}` : tous.length === 0 ? "Liste du foyer · rien à acheter pour l'instant" : `Liste du foyer · mise à jour ${state.majLe ? ago(state.majLe) : "à l'instant"}`;

  const children = [];
  if (state.horsLigne) children.push(hint(`Hors ligne${state.enAttente ? ` · ${plural(state.enAttente, "modification en attente", "modifications en attente")}, envoyées dès que le réseau revient.` : " · la liste affichée est la dernière reçue."}`, "attention", "wifiOff"));
  if (activite) children.push(hint(activite.texte, null, "plus"));

  if (tous.length === 0) {
    children.push(champAjout(), h("div", { class: "card empty" },
      h("p", { class: "body-md medium fort" }, "La liste est vide"),
      h("p", { class: "body-sm discret" }, "Ajoute un article au-dessus, ou laisse Claude préparer les repas de la semaine et la liste qui va avec."),
      btn("Préparer les repas de la semaine", { variant: "primary", size: "lg", full: true, onClick: () => go("#/repas/formulaire") })));
  } else {
    const fini = restants.length === 0;
    children.push(h("div", { class: "card" },
      h("span", { class: "overline" }, "À prendre"),
      h("div", { class: "count" }, h("span", { class: "display-sm num" }, restants.length),
        h("span", { class: "body-sm" }, fini ? `à prendre · les ${tous.length} articles sont dans le panier` : `${restants.length > 1 ? "articles" : "article"} sur ${tous.length} · ${panier.length} dans le panier`)),
      h("div", { class: "track" }, h("div", { class: "fill", style: { width: `${Math.round((panier.length / tous.length) * 100)}%` } })),
      fini && btn("Terminer les courses", { variant: "primary", size: "lg", full: true, onClick: terminer }),
      fini && h("p", { class: "caption" }, "Vide le panier : la liste repart propre pour la prochaine fois.")));
    if (!fini) children.push(champAjout());
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
  const el = h("div", { class: "screen" }, pageHead("Courses", sous), h("div", { class: "scroll" }, children));
  return { el, tab: "" };
}

function terminer() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Terminer les courses ?", message: `Les ${n} articles du panier sortent de la liste. Le menu de la semaine reste.`, confirmLabel: "Terminer", cancelLabel: "Pas encore",
    onConfirm: async () => { await articles.viderPanier(); toast("Courses terminées"); } });
}
function viderPanier() {
  const n = state.articles.filter(a => a.coche).length;
  confirmSheet({ title: "Vider le panier ?", message: `Les ${n} articles cochés sortent de la liste. Pour les remettre à prendre, décoche-les plutôt.`, confirmLabel: "Vider le panier", cancelLabel: "Annuler", destructive: true,
    onConfirm: async () => { await articles.viderPanier(); toast("Panier vidé"); } });
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
