// Écran « Ajouter » (décision du 02/11/2026) : remplace le champ en tête de liste.
// Champ en haut avec le clavier, suggestions en dessous ; avant de taper, les habituels du foyer et
// les derniers achats. Chaque ligne ajoute d'un tap sans quitter l'écran ; « Terminé » ramène à la liste.
import { state, articles, chercherArticle, devinerRayon, habituels, RAYONS_DEFAUT } from "../data.js";
import { suggerer, produitExact, analyser, norm } from "../produits.js";
import { h, icon, btn, navbar, input, toast, go, plural } from "../ui.js";

let brouillon = "", ajoutes = 0, ouvertLe = 0;

export function ajouterView() {
  // Nouvelle visite (plus de 2 min depuis la dernière) : on repart d'un compteur à zéro.
  if (Date.now() - ouvertLe > 120000) { ajoutes = 0; brouillon = ""; }
  ouvertLe = Date.now();
  const rayons = state.foyer?.rayons || RAYONS_DEFAUT;
  const rayonConnu = r => (rayons.includes(r) ? r : null);
  const aPrendre = () => state.articles.filter(a => !a.coche);
  const dansLaListe = nom => aPrendre().some(a => norm(a.nom) === norm(nom));

  const inp = input({ placeholder: "Ex. 3 courgettes, 500 g riz", "aria-label": "Article à ajouter", autocomplete: "off", autocorrect: "off", autocapitalize: "sentences", enterkeyhint: "done", autofocus: true, value: brouillon,
    onInput: e => { brouillon = e.target.value; rendre(); },
    onKeydown: e => {
      if (e.key === "Enter") { e.preventDefault(); const premier = zone.querySelector("button.row"); premier ? premier.click() : ajouter(analyser(brouillon)); }
      if (e.key === "Escape") vider();
    } });
  const effacer = h("button", { type: "button", class: "icon-btn effacer", "aria-label": "Effacer", onPointerdown: e => e.preventDefault(), onClick: vider }, icon("x"));
  const zone = h("div", { class: "ajout-zone" });

  function vider() { brouillon = ""; inp.value = ""; rendre(); inp.focus(); }

  const ligne = (nom, sous, onPick, libre) => h("button", { type: "button", class: `row${libre ? " libre" : ""}`, onPointerdown: e => e.preventDefault(), onClick: onPick },
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, nom), sous && h("span", { class: "caption" }, sous)), icon("plus", "plus"));
  const section = (titre, lignes) => [h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, titre)), h("div", { class: "list" }, lignes)];

  // En tapant : ce que le foyer connaît (liste + habituels), puis le catalogue, puis « Ajouter « … » ».
  function suggestions() {
    const { nom, quantite } = analyser(brouillon);
    const qte = quantite ? ` · ${quantite}` : "";
    const connus = [...state.articles.map(a => ({ nom: a.nom, rayon: a.rayon })), ...habituels().map(x => ({ nom: x.nom, rayon: x.rayon }))];
    const lignes = suggerer(nom, connus).map(p => {
      const rayon = rayonConnu(p.rayon) || devinerRayon(p.nom);
      const deja = dansLaListe(p.nom);
      return ligne(p.nom, `${rayon}${qte}${deja ? " · déjà dans la liste" : ""}`, () => ajouter({ nom: p.nom, quantite, rayon }));
    });
    if (nom.length > 1 && !produitExact(nom) && !lignes.some(l => norm(l.textContent) === norm(nom))) lignes.push(ligne(`Ajouter « ${nom} »`, `${devinerRayon(nom)}${qte}`, () => ajouter({ nom, quantite }), true));
    return lignes.length ? [h("div", { class: "list" }, lignes)] : [h("p", { class: "caption ajout-vide" }, "Continue à taper : au moins deux lettres.")];
  }

  // Avant de taper : habituels (les plus ajoutés) et derniers achats, sans ceux déjà à prendre.
  function accueil() {
    const tous = habituels().filter(x => !dansLaListe(x.nom));
    const top = [...tous].sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom, "fr")).filter(x => x.n >= 2).slice(0, 8);
    const vus = new Set(top.map(x => norm(x.nom)));
    const recents = [...tous].filter(x => !vus.has(norm(x.nom))).sort((a, b) => new Date(b.le) - new Date(a.le)).slice(0, 8);
    const out = [];
    if (top.length) out.push(...section("Habituels", top.map(x => ligne(x.nom, `${rayonConnu(x.rayon) || devinerRayon(x.nom)} · ${plural(x.n, "fois", "fois")}`, () => ajouter({ nom: x.nom, rayon: rayonConnu(x.rayon) || undefined })))));
    if (recents.length) out.push(...section("Derniers ajouts", recents.map(x => ligne(x.nom, rayonConnu(x.rayon) || devinerRayon(x.nom), () => ajouter({ nom: x.nom, rayon: rayonConnu(x.rayon) || undefined })))));
    if (!out.length) out.push(h("div", { class: "card" },
      h("p", { class: "body-md medium fort" }, "Tape le nom d'un article"),
      h("p", { class: "body-sm discret" }, "Les produits courants se proposent avec leur rayon, et la quantité se dit dans la phrase : « 3 courgettes », « 500 g riz ». Tes habitudes apparaîtront ici au fil des courses.")));
    return out;
  }

  function rendre() {
    effacer.style.display = brouillon ? "" : "none";
    zone.replaceChildren(...(brouillon.trim() ? suggestions() : accueil()));
    sous.textContent = ajoutes ? `${plural(ajoutes, "article ajouté", "articles ajoutés")}` : "À la liste du foyer";
  }

  async function ajouter({ nom, quantite = "", rayon }) {
    nom = (nom || "").trim();
    if (!nom) return;
    brouillon = ""; inp.value = "";
    rayon = rayon || devinerRayon(nom);
    const existant = chercherArticle(nom);
    try {
      if (existant && !existant.coche) {
        if (quantite && quantite !== existant.quantite) { await articles.update(existant.id, { quantite }); toast(`${existant.nom} · ${quantite}`); }
        else toast(`${existant.nom} est déjà dans la liste`);
      } else if (existant?.coche) {
        await articles.update(existant.id, { coche: false, ...(quantite ? { quantite } : {}) }); ajoutes++; toast(`${existant.nom} remis à prendre`);
      } else {
        await articles.add({ nom, quantite, rayon }); ajoutes++; toast(`${nom} ajouté${quantite ? ` · ${quantite}` : ""}`);
      }
    } catch (e) { toast(e.message || "L'ajout a échoué"); }
    rendre(); inp.focus();
  }

  const sous = h("span", null);
  const el = h("div", { class: "screen no-tabs ajouter" },
    navbar({ back: { label: "Courses", href: "#/" }, title: "Ajouter", action: { label: "Terminé", onClick: () => go("#/") } }),
    h("div", { class: "scroll" },
      h("div", { class: "ajout-champ" }, h("div", { class: "add" }, inp, effacer), h("p", { class: "caption" }, sous)),
      zone));
  rendre();
  // Le clavier : le bouton flottant a donné le focus à un champ temporaire pendant le geste, on le reprend ici.
  setTimeout(() => { inp.focus(); document.getElementById("focus-relais")?.remove(); }, 0);
  // Les mises à jour (temps réel, ajout) redessinent la zone sans remplacer le champ : le clavier reste ouvert.
  return { el, update: rendre };
}

// À appeler dans le geste (clic sur le bouton flottant) : iOS n'ouvre le clavier que depuis un geste.
export function relaisClavier() {
  const t = h("input", { id: "focus-relais", "aria-hidden": "true", style: { position: "fixed", opacity: 0, height: "1px", width: "1px", top: 0, left: 0, fontSize: "16px" } });
  document.body.append(t); t.focus();
  setTimeout(() => t.remove(), 1500);
}
