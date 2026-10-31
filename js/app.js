import { state, subscribe, init, DEMO } from "./data.js";
import { h, icon, go } from "./ui.js";
import { listeView, articleView } from "./views/liste.js";
import { repasView, repasFormView, repasDetailView } from "./views/repas.js";
import { foyerView, foyerChoixView, rayonsView } from "./views/foyer.js";
import { connecterView, creerView, validerView, motDePasseView } from "./views/compte.js";

// Routes : #/chemin/:param. Chaque vue renvoie { el, tab? }.
const ROUTES = [
  ["", listeView],
  ["article/:id", articleView],
  ["repas", repasView],
  ["repas/formulaire", repasFormView],
  ["repas/:i", repasDetailView],
  ["foyer", foyerView],
  ["foyer/rayons", rayonsView],
  ["compte", connecterView],
  ["compte/creer", creerView],
  ["compte/valider", validerView],
  ["compte/mot-de-passe", motDePasseView]
];

function match(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  for (const [pattern, view] of ROUTES) {
    const segs = pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params = {};
    if (segs.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = decodeURIComponent(parts[i])), true) : s === parts[i]))) return { view, params, pattern };
  }
  return { view: listeView, params: {}, pattern: "" };
}

const TABS = [["", "cart", "Liste"], ["repas", "fork", "Repas"], ["foyer", "house", "Foyer"]];
function tabbar(current) {
  return h("div", { class: "tabbar" },
    h("nav", { "aria-label": "Navigation principale" },
      TABS.map(([route, ic, label]) => h("button", { class: "tab", "aria-current": current === route ? "page" : null, onClick: () => go(`#/${route}`) }, icon(ic), label))));
}

const root = document.getElementById("app");
let lastHash = null;

function render() {
  if (!state.pret) { root.replaceChildren(h("div", { class: "screen" }, h("div", { class: "scroll", style: { justifyContent: "center", alignItems: "center" } }, h("p", { class: "caption" }, "Cabas…")))); return; }
  let { view, params, pattern } = match(location.hash);
  // Pas connecté : écrans de compte seulement. Connecté sans foyer : créer ou rejoindre.
  if (!state.user && !pattern.startsWith("compte")) { view = connecterView; params = {}; }
  else if (state.user && !state.foyer && !pattern.startsWith("compte/mot-de-passe")) { view = foyerChoixView; params = {}; }
  else if (state.user && state.foyer && pattern.startsWith("compte") && pattern !== "compte/mot-de-passe") { view = listeView; params = {}; }
  const scroller = root.querySelector(".scroll");
  const keep = location.hash === lastHash && scroller ? scroller.scrollTop : 0;
  const current = view(params);
  root.replaceChildren(current.el);
  if (current.tab !== undefined) root.append(tabbar(current.tab));
  const next = root.querySelector(".scroll");
  if (next) next.scrollTop = keep;
  lastHash = location.hash;
}

addEventListener("hashchange", render);
subscribe(() => { if (!document.querySelector("dialog[open]")) render(); });
document.addEventListener("close", () => setTimeout(render), true);
render();
init().catch(e => { console.error(e); state.pret = true; render(); });
if (DEMO) document.title = "Cabas · démo";
