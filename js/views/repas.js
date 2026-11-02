import { state, menus, achats, lundi, dateKey, notify } from "../data.js";
import { h, icon, btn, navbar, pageHead, hint, field, input, stepper, chips, jauge, sheet, confirmSheet, toast, go, dateShort, plural } from "../ui.js";

const ENVIES = ["Végétarien", "Rapide", "De saison", "Poisson", "Réconfortant", "Batch cooking", "Léger"];
// Temps en cuisine : de 10 min à 1 h 30 par pas de 5, et un cran de plus pour « peu importe » (temps vide pour l'API).
const TEMPS_MAX = 95;
const tempsTexte = v => (v >= TEMPS_MAX ? "" : v < 60 ? `${v} min` : v === 60 ? "1 h" : `1 h ${String(v - 60).padStart(2, "0")}`);
const tempsLabel = v => tempsTexte(v) || "Peu importe";
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Ce qui se passe entre le formulaire et le menu enregistré vit ici, le temps de la session.
let demande = { repas: 5, personnes: 2, envies: ["Végétarien", "Rapide", "De saison"], tempsMin: 40, temps: "40 min", eviter: "", placards: "", placardsChoisis: null };
// Achetés aux dernières courses (trois semaines), les plus récents d'abord : proposés précochés comme « déjà dans les placards ».
const achatsRecents = () => achats().filter(a => Date.now() - new Date(a.le) < 21 * 86400000).sort((a, b) => new Date(b.le) - new Date(a.le)).slice(0, 14).map(a => a.nom);
// Ce qui part à l'API : le texte libre et les puces gardées, réunis dans « placards ».
const requete = () => ({ ...demande, placards: [demande.placards.trim(), ...(demande.placardsChoisis || [])].filter(Boolean).join(", ") });
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
      h("span", { class: "overline" }, cap(r.jour)),
      h("span", { class: "heading-md" }, r.plat),
      h("span", { class: "caption" }, `${r.temps_min} min · ${plural(r.ingredients.filter(x => !x.deja_la).length, "article à acheter", "articles à acheter")}`)),
    changer && btn("Changer", { variant: "ghost", onClick: () => changerPlat(i) }));
}

export function repasFormView() {
  const d = demande;
  const recents = achatsRecents();
  if (!d.placardsChoisis) d.placardsChoisis = [...recents];
  const ligne = (titre, sous, ctrl) => h("div", { class: "field-row" }, h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, titre), h("span", { class: "caption" }, sous)), ctrl);
  const combien = h("div", { class: "card combien" },
    ligne("Repas", "à cuisiner cette semaine", stepper({ value: d.repas, min: 1, max: 14, label: "repas", onChange: v => { d.repas = v; verif(); } })),
    ligne("Personnes", "pour les quantités", stepper({ value: d.personnes, min: 1, max: 8, label: "personnes", onChange: v => { d.personnes = v; verif(); } })));
  const err = h("p", { class: "caption erreur", style: { display: "none" } }, "Choisis au moins un repas.");
  const resume = h("p", { class: "caption num" });
  const temps = jauge({ value: d.tempsMin, min: 10, max: TEMPS_MAX, step: 5, label: "Temps en cuisine", format: tempsLabel, onChange: v => { d.tempsMin = v; d.temps = tempsTexte(v); verif(); } });
  const envoyer = btn("Préparer le menu", { variant: "primary", size: "lg", full: true, icon: "sparkle", onClick: () => lancer() });
  const verif = () => {
    const ok = d.repas > 0;
    err.style.display = ok ? "none" : ""; envoyer.disabled = !ok;
    resume.textContent = `${plural(d.repas, "repas", "repas")} · ${plural(d.personnes, "personne", "personnes")}${d.temps ? ` · ${d.temps} max` : ""}`;
  };
  verif();
  const el = h("div", { class: "screen formulaire" },
    pageHead("Repas de la semaine", "Dis ce qui vous tente : Claude prépare le menu et la liste de courses qui va avec."),
    h("div", { class: "scroll" },
      h("div", { class: "bloc" }, h("h2", { class: "heading-md" }, "Combien de repas"), combien, err),
      h("div", { class: "bloc" }, h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Envies"), h("span", { class: "caption" }, "plusieurs choix possibles")),
        chips(ENVIES, d.envies, v => { d.envies = v; })),
      h("div", { class: "bloc" }, h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Temps en cuisine"), temps.valeur),
        h("div", { class: "card jauge-carte" }, temps.el,
          h("div", { class: "jauge-reperes" }, h("span", { class: "caption" }, "10 min"), h("span", { class: "caption" }, "Peu importe")),
          h("p", { class: "caption" }, "Au maximum, un soir de semaine."))),
      h("div", { class: "bloc" }, h("h2", { class: "heading-md" }, "Précisions"),
        h("div", { class: "card" },
          field({ label: "À éviter", input: input({ placeholder: "champignons, fruits de mer", value: d.eviter, autocomplete: "off", onInput: e => { d.eviter = e.target.value; } }), help: "Allergies, ou ce que l'un de vous n'aime pas." }),
          field({ label: "Déjà dans les placards", input: input({ placeholder: "riz, pâtes, oignons, œufs, huile d'olive", value: d.placards, autocomplete: "off", onInput: e => { d.placards = e.target.value; } }), help: "Claude ne les mettra pas sur la liste." }),
          recents.length ? h("div", { class: "field" }, h("label", null, "Achetés aux dernières courses"),
            chips(recents, d.placardsChoisis, v => { d.placardsChoisis = v; }),
            h("div", { class: "help" }, "Comptés comme déjà là. Décoche ce qui est fini.")) : null)),
      h("div", { class: "action-bas" }, resume, envoyer)));
  return { el, tab: "repas" };
}

async function lancer() {
  etat = { phase: "prepare", depuis: Date.now() }; go("#/repas"); notify();
  try {
    const menu = await menus.demander(requete());
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
  const d = demande, n = d.repas;
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
    const res = await menus.demander({ ...requete(), remplacer: { jour: r.jour, plat: r.plat }, autres: source.repas.map(x => x.plat) });
    const nouveau = { ...res.repas[0], jour: r.jour };
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
  toast(`${plural(n, "article ajouté", "articles ajoutés")} à la liste`, { tone: "succes" });
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
