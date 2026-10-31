import { state, menus, lundi, dateKey, notify } from "../data.js";
import { h, icon, btn, navbar, pageHead, hint, field, input, stepper, chips, segmented, sheet, confirmSheet, toast, go, dateShort, plural } from "../ui.js";

const ENVIES = ["Végétarien", "Rapide", "De saison", "Poisson", "Réconfortant", "Batch cooking", "Léger"];
const TEMPS = [["20 min", "20 min"], ["40 min", "40 min"], ["1 h", "1 h"], ["", "Peu importe"]];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const momentLabel = m => (m === "dejeuner" ? "déjeuner" : "dîner");

// Ce qui se passe entre le formulaire et le menu enregistré vit ici, le temps de la session.
let demande = { diners: 5, dejeuners: 0, personnes: 2, envies: ["Végétarien", "Rapide", "De saison"], temps: "40 min", eviter: "", placards: "" };
let etat = null; // null | { phase: "prepare" | "propose" | "erreur", menu?, erreur?, depuis? }

export function repasView() {
  if (etat) return etatView();
  const m = state.menu;
  const semaineCourante = m && dateKey(m.semaine) >= dateKey(lundi());
  if (!m || !m.ajoute && !semaineCourante) return repasFormView();
  const passe = !semaineCourante;
  const fin = new Date(m.semaine); fin.setDate(fin.getDate() + 6);
  const el = h("div", { class: "screen" },
    pageHead("Repas de la semaine", `Menu du ${new Date(m.semaine).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" })} au ${dateShort(fin)}${passe ? " · terminé" : ""}`),
    h("div", { class: "scroll" },
      passe ? hint("Cette semaine est passée. Prépare la suivante quand tu veux.", "neutre")
        : m.ajoute ? hint(`${plural(m.repas.flatMap(r => r.ingredients).filter(i => !i.deja_la).length, "article du menu", "articles du menu")} sur la liste des courses.`, "succes", "check")
        : hint(`${plural(menus.aAcheter(m), "article à ajouter", "articles à ajouter")} à la liste.`, null, "cart"),
      !m.ajoute && !passe && btn(`Ajouter les ${menus.aAcheter(m)} articles à la liste`, { variant: "primary", size: "lg", full: true, onClick: () => ajouter(m) }),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Les repas")),
      m.repas.map((r, i) => carteRepas(r, i, { changer: !passe && !m.ajoute, onOpen: () => go(`#/repas/${i}`) })),
      btn(passe ? "Préparer la semaine prochaine" : "Préparer un nouveau menu", { variant: passe ? "primary" : "ghost", size: passe ? "lg" : undefined, full: true, onClick: () => go("#/repas/formulaire") })));
  return { el, tab: "repas" };
}

function carteRepas(r, i, { changer, onOpen }) {
  return h("div", { class: "card repas" },
    h("button", { class: "row-main", style: { border: 0, background: "none", padding: 0, cursor: "pointer", textAlign: "left", color: "inherit" }, onClick: onOpen },
      h("span", { class: "overline" }, `${cap(r.jour)}${r.moment === "dejeuner" ? " · midi" : ""}`),
      h("span", { class: "heading-md" }, r.plat),
      h("span", { class: "caption" }, `${r.temps_min} min · ${plural(r.ingredients.filter(x => !x.deja_la).length, "article à acheter", "articles à acheter")}`)),
    changer && btn("Changer", { variant: "ghost", onClick: () => changerPlat(i) }));
}

export function repasFormView() {
  const d = demande;
  let erreur = null;
  const combien = h("div", { class: "card" },
    h("div", { class: "field-row" }, h("span", { class: "body-md medium fort" }, "Dîners"), stepper({ value: d.diners, max: 7, label: "dîners", format: v => plural(v, "dîner", "dîners"), onChange: v => { d.diners = v; verif(); } })),
    h("div", { class: "field-row" }, h("span", { class: "body-md medium fort" }, "Déjeuners"), stepper({ value: d.dejeuners, max: 7, label: "déjeuners", format: v => plural(v, "déjeuner", "déjeuners"), onChange: v => { d.dejeuners = v; verif(); } })),
    h("div", { class: "field-row" }, h("span", { class: "body-md medium fort" }, "Personnes"), stepper({ value: d.personnes, min: 1, max: 8, label: "personnes", format: v => plural(v, "personne", "personnes"), onChange: v => { d.personnes = v; } })));
  const err = h("p", { class: "caption", style: { color: "var(--etat-danger)", display: "none" } }, "Choisis au moins un dîner ou un déjeuner.");
  combien.append(err);
  const envoyer = btn("Préparer le menu", { variant: "primary", size: "lg", full: true, icon: "sparkle", onClick: () => lancer() });
  const verif = () => { const ok = d.diners + d.dejeuners > 0; err.style.display = ok ? "none" : ""; envoyer.disabled = !ok; };
  verif();
  const el = h("div", { class: "screen" },
    pageHead("Repas de la semaine", "Dis ce qui vous tente : Claude prépare le menu et la liste de courses qui va avec."),
    h("div", { class: "scroll" },
      combien,
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Envies")),
      chips(ENVIES, d.envies, v => { d.envies = v; }),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Temps en cuisine, un soir de semaine")),
      segmented(TEMPS, d.temps, v => { d.temps = v; }),
      field({ label: "À éviter", input: h("textarea", { class: "input", placeholder: "champignons, fruits de mer", value: d.eviter, onInput: e => { d.eviter = e.target.value; } }), help: "Allergies, ou ce que l'un de vous n'aime pas." }),
      field({ label: "Déjà dans les placards", input: h("textarea", { class: "input", placeholder: "riz, pâtes, oignons, œufs, huile d'olive", value: d.placards, onInput: e => { d.placards = e.target.value; } }), help: "Claude ne les ajoutera pas à la liste." }),
      envoyer));
  return { el, tab: "repas" };
}

async function lancer() {
  etat = { phase: "prepare", depuis: Date.now() }; go("#/repas"); notify();
  try {
    const menu = await menus.demander(demande);
    etat = { phase: "propose", menu };
  } catch (e) { etat = { phase: "erreur", erreur: e.message }; }
  notify();
}

function rappel() {
  const d = demande, parts = [];
  if (d.envies.length) parts.push(d.envies.map(e => e.toLowerCase()).join(", "));
  if (d.temps) parts.push(`${d.temps} max`);
  if (d.eviter) parts.push(`sans ${d.eviter}`);
  return `${cap(parts.join(", "))}${parts.length ? ". " : ""}Ça prend une vingtaine de secondes.`;
}

function etatView() {
  const d = demande, n = d.diners + d.dejeuners;
  let body;
  if (etat.phase === "prepare") body = [
    h("div", { class: "card center" }, h("div", { class: "rond pulse" }, icon("sparkle")),
      h("p", { class: "display-xs" }, `Claude prépare ${plural(n, "repas", "repas")} pour ${d.personnes}`), h("p", { class: "body-sm" }, rappel())),
    [1, 2, 3].map(() => h("div", { class: "card skeleton" }, h("i", { class: "s" }), h("i", { class: "t" }), h("i", { class: "d" }))),
    btn("Annuler", { variant: "ghost", full: true, onClick: () => { etat = null; go("#/repas/formulaire"); notify(); } })];
  else if (etat.phase === "erreur") body = [
    h("div", { class: "card center" }, h("div", { class: "rond danger" }, icon("warning")),
      h("p", { class: "display-xs" }, "Claude n'a pas répondu"), h("p", { class: "body-sm" }, `${etat.erreur}. Tes réponses sont gardées.`),
      btn("Réessayer", { variant: "primary", size: "lg", full: true, onClick: lancer }),
      btn("Modifier mes réponses", { variant: "ghost", full: true, onClick: () => { etat = null; go("#/repas/formulaire"); notify(); } }))];
  else {
    const m = etat.menu, aAcheter = menus.aAcheter(m), dejaListe = menus.dejaLa(m) - m.repas.flatMap(r => r.ingredients).filter(i => i.deja_la).length, chezVous = m.repas.flatMap(r => r.ingredients).filter(i => i.deja_la).length;
    body = [
      h("div", { class: "card" }, h("span", { class: "overline" }, "La liste qui va avec"),
        h("div", { class: "count" }, h("span", { class: "display-sm num" }, aAcheter), h("span", { class: "body-sm" }, `${aAcheter > 1 ? "articles" : "article"} à ajouter${dejaListe ? ` · ${dejaListe} déjà sur la liste` : ""}${chezVous ? ` · ${chezVous} chez vous` : ""}`)),
        btn(`Ajouter les ${aAcheter} articles à la liste`, { variant: "primary", size: "lg", full: true, onClick: () => accepter(m) }),
        btn("Refaire tout le menu", { variant: "ghost", full: true, onClick: lancer })),
      h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Les repas")),
      m.repas.map((r, i) => carteRepas(r, i, { changer: true, onOpen: () => detailSheet(r) }))];
  }
  const titre = etat.phase === "propose" ? "Menu proposé" : "Repas de la semaine";
  const sous = etat.phase === "propose" ? `${plural(n, "repas", "repas")} pour ${d.personnes} · semaine du ${dateShort(semaineVisee())}` : `Envoyé à Claude à ${new Date(etat.depuis || Date.now()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return { el: h("div", { class: "screen" }, pageHead(titre, sous), h("div", { class: "scroll" }, body)), tab: "repas" };
}

// Un seul plat change : Claude en propose un autre avec les mêmes envies.
async function changerPlat(i) {
  const source = etat?.menu || state.menu;
  const r = source.repas[i];
  const dlg = sheet({ title: `Changer le plat de ${r.jour}`, body: [h("p", { class: "body-md" }, "Avec les mêmes envies, Claude propose à la place :"), h("div", { class: "card skeleton" }, h("i", { class: "s" }), h("i", { class: "t" }), h("i", { class: "d" }))] });
  try {
    const res = await menus.demander({ ...demande, remplacer: { jour: r.jour, moment: r.moment, plat: r.plat }, autres: source.repas.map(x => x.plat) });
    const nouveau = { ...res.repas[0], jour: r.jour, moment: r.moment };
    const corps = dlg.querySelector(".sheet-body");
    corps.replaceChildren(h("p", { class: "body-md" }, "Avec les mêmes envies, Claude propose à la place :"),
      carteRepas(nouveau, i, { changer: false, onOpen: () => detailSheet(nouveau) }),
      btn("Prendre celui-ci", { variant: "primary", size: "lg", full: true, onClick: async () => { source.repas[i] = nouveau; if (!etat) await menus.update({ repas: source.repas }); dlg.close(); notify(); } }),
      btn("Une autre idée", { variant: "ghost", full: true, onClick: () => { dlg.close(); changerPlat(i); } }));
  } catch (e) { dlg.querySelector(".sheet-body").replaceChildren(hint(`${e.message}. Réessaie dans un instant.`, "danger", "warning")); }
}

// La semaine visée : celle en cours jusqu'au jeudi, la suivante à partir du vendredi (on fait les courses pour la semaine d'après).
const semaineVisee = () => { const j = new Date().getDay(); return lundi(Date.now() + (j === 0 || j >= 5 ? 7 * 86400000 : 0)); };

async function accepter(m) {
  const semaine = dateKey(semaineVisee());
  const saved = await menus.save({ semaine, demande: { ...demande }, repas: m.repas, ajoute: false });
  etat = null;
  await ajouter(saved);
}
async function ajouter(m) {
  const n = await menus.ajouterALaListe(m);
  await menus.update({ ajoute: true });
  toast(`${plural(n, "article ajouté", "articles ajoutés")} à la liste`);
  go("#/repas");
}

function detailBody(r) {
  return [
    h("div", { class: "card" }, h("span", { class: "overline" }, "Ingrédients"),
      r.ingredients.map(i => h("div", { class: "field-row", style: { minHeight: "28px" } }, h("span", { class: "body-md fort" }, [i.nom, i.quantite].filter(Boolean).join(" · ")), h("span", { class: "caption" }, i.deja_la ? "chez vous" : state.articles.find(a => a.nom.toLowerCase() === i.nom.toLowerCase())?.coche ? "dans le panier" : "sur la liste")))),
    h("div", { class: "card" }, h("span", { class: "overline" }, "Étapes"), r.etapes.map((e, k) => h("p", { class: "body-sm" }, `${k + 1} · ${e.replace(/^\d+\s*[·.)-]\s*/, "")}`)))
  ];
}
function detailSheet(r) { sheet({ title: r.plat, body: detailBody(r) }); }

export function repasDetailView({ i }) {
  const m = state.menu, r = m?.repas[Number(i)];
  if (!r) { go("#/repas"); return { el: h("div") }; }
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Repas", href: "#/repas" }, title: r.plat, subtitle: `${r.jour} · ${r.temps_min} min · pour ${m.demande?.personnes || 2}` }),
    h("div", { class: "scroll" }, detailBody(r), !m.ajoute && btn("Changer ce plat", { variant: "ghost", full: true, onClick: () => changerPlat(Number(i)) })));
  return { el, tab: "repas" };
}
