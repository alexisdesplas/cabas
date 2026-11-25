import { state, menus, achats, articles, lundi, dateKey, notify } from "../data.js";
import { illustration, illustrationCle, illustrationPlat } from "../illustrations.js";
import { avatarsDuFoyer } from "./liste.js";
import { h, icon, btn, navbar, hint, field, input, stepper, chips, jauge, sheet, confirmSheet, toast, go, dateShort, plural, tuile, enTete, titreSection } from "../ui.js";

const ENVIES = ["Végétarien", "Rapide", "De saison", "Poisson", "Réconfortant", "Batch cooking", "Léger"];
// Temps en cuisine : de 10 min à 1 h 30 par pas de 5, et un cran de plus pour « peu importe » (temps vide pour l'API).
const TEMPS_MAX = 95;
const tempsTexte = v => (v >= TEMPS_MAX ? "" : v < 60 ? `${v} min` : v === 60 ? "1 h" : `1 h ${String(v - 60).padStart(2, "0")}`);
const tempsLabel = v => tempsTexte(v) || "Peu importe";
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
// « Du 2 au 8 novembre », « Du 30 novembre au 6 décembre » : le surtitre de l'écran Repas.
const periode = debut => { const a = new Date(debut), b = new Date(debut); b.setDate(b.getDate() + 6); return `Du ${a.getDate()}${a.getMonth() !== b.getMonth() ? " " + MOIS[a.getMonth()] : ""} au ${b.getDate()} ${MOIS[b.getMonth()]}`; };

// Ce qui se passe entre le formulaire et le menu enregistré vit ici, le temps de la session.
let demande = { repas: 5, personnes: 2, envies: ["Végétarien", "Rapide", "De saison"], tempsMin: 40, temps: "40 min", eviter: "", placards: "", placardsChoisis: null };
// Achetés aux dernières courses (trois semaines), les plus récents d'abord : proposés précochés comme « déjà dans les placards ».
const achatsRecents = () => achats().filter(a => Date.now() - new Date(a.le) < 21 * 86400000).sort((a, b) => new Date(b.le) - new Date(a.le)).slice(0, 14).map(a => a.nom);
// Ce qui part à l'API : le texte libre et les puces gardées, réunis dans « placards ».
const requete = () => ({ ...demande, placards: [demande.placards.trim(), ...(demande.placardsChoisis || [])].filter(Boolean).join(", ") });
let etat = null; // null | { phase: "prepare" | "propose" | "erreur", menu?, erreur?, depuis? }

const aAcheterDe = r => r.ingredients.filter(x => !x.deja_la).length;

export function repasView() {
  if (etat) return etatView();
  const m = state.menu;
  const semaineCourante = m && dateKey(m.semaine) >= dateKey(lundi());
  if (!m || !m.ajoute && !semaineCourante) return repasFormView();
  const passe = !semaineCourante;
  const surListe = m.repas.flatMap(r => r.ingredients).filter(i => !i.deja_la).length;
  const el = h("div", { class: "screen" }, h("div", { class: "scroll" },
    enTete(periode(m.semaine).toUpperCase(), "Repas", avatarsDuFoyer()),
    passe ? h("div", { class: "bandeau neutre" }, "Cette semaine est passée. Prépare la suivante quand tu veux.")
      : m.ajoute ? h("div", { class: "bandeau succes" }, `${plural(surListe, "article du menu est", "articles du menu sont")} sur la liste des courses.`)
      : h("div", { class: "bandeau" }, `${plural(menus.aAcheter(m), "article à ajouter", "articles à ajouter")} à la liste.`),
    !m.ajoute && !passe && btn(`Ajouter les ${menus.aAcheter(m)} articles à la liste`, { variant: "primary", size: "lg", full: true, onClick: () => ajouter(m) }),
    h("div", { class: "groupe" }, titreSection("LES REPAS", m.repas.length), h("div", { class: "lignes" }, m.repas.map((r, i) => carteRepas(r, i, { actions: !passe, onOpen: () => go(`#/repas/${i}`) })))),
    btn(passe ? "Préparer la semaine prochaine" : "Préparer un nouveau menu", { variant: passe ? "primary" : "secondary", size: "lg", full: true, onClick: () => go("#/repas/formulaire") })));
  return { el, tab: "repas" };
}

// Carte d'un plat : tuile illustrée, jour, plat, temps et articles. Tap : le détail. « ⋯ » : modifier, remplacer, retirer. (Le détail, lui, n'a pas d'illustration : Alexis, 02/11/2026.)
function carteRepas(r, i, { actions, onOpen }) {
  return h("div", { class: "row plat" },
    h("button", { type: "button", class: "row-main plat-ouvrir", onClick: onOpen },
      tuile(illustrationPlat(r.plat), 56),
      h("span", { class: "overline accent" }, r.jour),
      h("span", { class: "heading-md" }, r.plat),
      h("span", { class: "caption" }, `${r.temps_min} min · ${plural(aAcheterDe(r), "article à acheter", "articles à acheter")}`)),
    actions && h("button", { type: "button", class: "plat-plus", "aria-label": `Modifier, remplacer ou retirer ${r.plat}`, onClick: () => actionsPlat(i) }, icon("more")));
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
  const envoyer = btn("Préparer le menu", { variant: "primary", size: "lg", full: true, onClick: lancer });
  const verif = () => {
    const ok = d.repas > 0;
    err.style.display = ok ? "none" : ""; envoyer.disabled = !ok;
    resume.textContent = `${plural(d.repas, "repas", "repas")} · ${plural(d.personnes, "personne", "personnes")}${d.temps ? ` · ${d.temps} max` : ""}`;
  };
  verif();
  const el = h("div", { class: "screen formulaire" }, h("div", { class: "scroll" },
    enTete("SEMAINE DU " + dateShort(semaineVisee()).toUpperCase(), "Repas", avatarsDuFoyer()),
    h("p", { class: "body-md entete-sous" }, "Dis ce qui vous tente : Claude prépare le menu et la liste de courses qui va avec."),
    h("div", { class: "groupe" }, titreSection("COMBIEN DE REPAS"), combien, err),
    h("div", { class: "groupe" }, titreSection("ENVIES", "plusieurs choix"), chips(ENVIES, d.envies, v => { d.envies = v; })),
    h("div", { class: "groupe" }, titreSection("TEMPS EN CUISINE", temps.valeur),
      h("div", { class: "card jauge-carte" }, temps.el,
        h("div", { class: "jauge-reperes" }, h("span", { class: "caption" }, "10 min"), h("span", { class: "caption" }, "Peu importe")),
        h("p", { class: "caption" }, "Au maximum, un soir de semaine."))),
    h("div", { class: "groupe" }, titreSection("PRÉCISIONS"),
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

// Squelette d'une carte de plat : la tuile et trois lignes, balayées par un reflet (animation CSS).
const squelette = () => h("div", { class: "card skeleton", "aria-hidden": "true" }, h("i", { class: "q" }), h("div", { class: "skeleton-lignes" }, h("i", { class: "s" }), h("i", { class: "t" }), h("i", { class: "d" })));

function etatView() {
  const d = demande, n = d.repas;
  let body, sur, titre = "Repas";
  if (etat.phase === "prepare") { sur = `ENVOYÉ À ${new Date(etat.depuis || Date.now()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`; body = [
    h("div", { class: "card vide" }, h("span", { class: "cuisson" }, tuile(illustrationCle("cooking"), 96, false)),
      h("p", { class: "heading-md" }, `Claude prépare ${plural(n, "repas", "repas")} pour ${d.personnes}`), h("p", { class: "body-sm discret" }, rappel())),
    [1, 2, 3].map(squelette),
    btn("Annuler", { variant: "ghost", full: true, onClick: () => { etat = null; go("#/repas/formulaire"); notify(); } })]; }
  else if (etat.phase === "erreur") { sur = "PAS DE RÉPONSE"; body = [
    h("div", { class: "card vide" }, tuile(illustrationCle("pot_of_food"), 96, false),
      h("p", { class: "heading-md" }, "Claude n'a pas répondu"), h("p", { class: "body-sm discret" }, `${etat.erreur}. Tes réponses sont gardées.`),
      btn("Réessayer", { variant: "primary", size: "lg", full: true, onClick: lancer }),
      btn("Modifier mes réponses", { variant: "ghost", full: true, onClick: () => { etat = null; go("#/repas/formulaire"); notify(); } }))]; }
  else {
    const m = etat.menu, aAcheter = menus.aAcheter(m), dejaListe = menus.dejaLa(m) - m.repas.flatMap(r => r.ingredients).filter(i => i.deja_la).length, chezVous = m.repas.flatMap(r => r.ingredients).filter(i => i.deja_la).length;
    titre = "Menu proposé"; sur = `${plural(n, "REPAS", "REPAS")} POUR ${d.personnes} · ${periode(semaineVisee()).toUpperCase()}`;
    body = [
      h("div", { class: "card recap" }, h("span", { class: "overline" }, "La liste qui va avec"),
        h("div", { class: "stats" },
          h("div", { class: "stat accent" }, h("span", { class: "heading-xl num" }, String(aAcheter)), h("span", { class: "caption" }, "à ajouter")),
          h("div", { class: "stat" }, h("span", { class: "heading-xl num" }, String(dejaListe)), h("span", { class: "caption" }, "sur la liste")),
          h("div", { class: "stat" }, h("span", { class: "heading-xl num" }, String(chezVous)), h("span", { class: "caption" }, "chez vous"))),
        h("div", { class: "barre recap-barre" }, h("div", { class: "fait" , style: { width: `${Math.round(aAcheter / Math.max(1, aAcheter + dejaListe + chezVous) * 100)}%` } })),
        h("p", { class: "caption" }, `${plural(aAcheter + dejaListe + chezVous, "ingrédient au total", "ingrédients au total")} : seuls les ${aAcheter} manquants partent sur la liste.`),
        btn(aAcheter > 1 ? `Ajouter les ${aAcheter} articles à la liste` : "Ajouter l'article à la liste", { variant: "primary", size: "lg", full: true, onClick: () => accepter(m) }),
        btn("Refaire tout le menu", { variant: "ghost", full: true, onClick: lancer })),
      h("div", { class: "groupe" }, titreSection("LES REPAS", m.repas.length), h("div", { class: "lignes" }, m.repas.map((r, i) => carteRepas(r, i, { actions: true, onOpen: () => detailSheet(r) }))))];
  }
  return { el: h("div", { class: "screen" }, h("div", { class: "scroll" }, enTete(sur, titre, avatarsDuFoyer()), body)), tab: "repas" };
}

// ——— Modifier, remplacer, retirer un plat (décision du 02/11/2026) : on dit ce qui ne va pas, Claude ajuste.
const sourceMenu = () => etat?.menu || state.menu;
const RAISONS_MODIF = ["Sans oignons", "Moins long", "Pour 4", "Plus de légumes", "Moins épicé", "Sans four"];
const RAISONS_REMPL = ["Plus léger", "Plus rapide", "Avec du poisson", "Avec de la viande", "On l'a mangé récemment", "Sans four"];

// Feuille « Ce plat » : trois choix, chacun ouvre sa feuille.
function actionsPlat(i) {
  const r = sourceMenu().repas[i];
  const choix = (ic, titre, sous, onPick) => h("button", { type: "button", class: "row choix", onClick: onPick }, h("span", { class: "choix-ic" }, icon(ic)), h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, titre), h("span", { class: "caption" }, sous)), icon("chevron", "chev"));
  sheet({ title: cap(r.jour), body: close => [
    h("p", { class: "body-md fort" }, r.plat),
    h("div", { class: "lignes" },
      choix("pencil", "Modifier le plat", "Garder l'idée, changer un détail : sans oignons, pour quatre…", () => { close(); modifierPlat(i); }),
      choix("sparkle", "Remplacer le plat", "Une autre idée, en disant ce que vous voudriez.", () => { close(); remplacerPlat(i); }),
      choix("x", "Retirer du menu", "Un repas de moins cette semaine.", () => { close(); retirerPlat(i); }))
  ] });
}

// Feuille de saisie : des puces de raisons + un champ libre, puis Claude répond dans la même feuille.
function feuilleDemande({ titre, plat, question, aide, raisons, placeholder, bouton, envoyer }) {
  let choisies = [], libre = "";
  const texte = () => [...choisies, libre.trim()].filter(Boolean).join(", ");
  const champ = h("textarea", { class: "input", rows: 2, placeholder, onInput: e => { libre = e.target.value; valider(); } });
  const ok = btn(bouton, { variant: "primary", size: "lg", full: true });
  const valider = () => { ok.disabled = !texte(); };
  const dlg = sheet({ title: titre, body: close => {
    ok.onclick = () => repondre(close);
    valider();
    return [h("p", { class: "body-md" }, h("span", { class: "fort medium" }, plat), " · ", question), chips(raisons, [], v => { choisies = v; valider(); }), field({ label: "Ou avec tes mots", input: champ, help: aide }), ok];
  } });
  async function repondre(close) {
    const corps = dlg.querySelector(".sheet-body");
    corps.replaceChildren(h("p", { class: "body-md" }, `« ${texte()} » : Claude s'en occupe.`), squelette());
    try { corps.replaceChildren(...await envoyer(texte(), close)); }
    catch (e) { corps.replaceChildren(hint(`${e.message}. Réessaie dans un instant.`, "danger", "warning"), btn("Fermer", { variant: "ghost", full: true, onClick: close })); }
  }
  return dlg;
}

// Aperçu d'un plat proposé dans une feuille : plat, temps, articles, ingrédients à tuile.
const apercuPlat = r => h("div", { class: "card apercu" },
  h("div", { class: "apercu-haut" }, tuile(illustrationPlat(r.plat), 56), h("div", { class: "row-main" }, h("span", { class: "overline accent" }, r.jour), h("span", { class: "heading-md" }, r.plat),
    h("span", { class: "caption" }, `${r.temps_min} min · ${plural(aAcheterDe(r), "article à acheter", "articles à acheter")}`))),
  h("div", { class: "apercu-ings" }, r.ingredients.map(x => h("span", { class: `pill${x.deja_la ? "" : " accent"}` }, x.nom))));

// Le plat reste, un détail change : Claude renvoie la même recette ajustée.
function modifierPlat(i) {
  const r = sourceMenu().repas[i];
  feuilleDemande({ titre: "Modifier le plat", plat: r.plat, question: "Qu'est-ce qui ne va pas ?", raisons: RAISONS_MODIF, placeholder: "Ex. remplace la crème par du yaourt", aide: "Claude garde le plat et ajuste la recette et les quantités.", bouton: "Ajuster le plat",
    envoyer: async (remarque, close) => {
      const res = await menus.demander({ ...requete(), modifier: { jour: r.jour, plat: r.plat, remarque, ingredients: r.ingredients.map(x => x.nom) }, autres: sourceMenu().repas.filter((_, k) => k !== i).map(x => x.plat) });
      const nouveau = { ...res.repas[0], jour: r.jour };
      return [h("p", { class: "body-md" }, "Voilà la version ajustée :"), apercuPlat(nouveau),
        btn("Prendre cette version", { variant: "primary", size: "lg", full: true, onClick: async () => { await poserPlat(i, nouveau); close(); toast(`${cap(r.jour)} : plat modifié`, { tone: "succes" }); } }),
        btn("Autre essai", { variant: "ghost", full: true, onClick: () => { close(); modifierPlat(i); } })];
    } });
}

// Un autre plat à la place, avec ce qu'on voudrait.
function remplacerPlat(i) {
  const r = sourceMenu().repas[i];
  feuilleDemande({ titre: `Remplacer le plat de ${r.jour}`, plat: r.plat, question: "Qu'est-ce que vous voudriez à la place ?", raisons: RAISONS_REMPL, placeholder: "Ex. quelque chose avec les courgettes du frigo", aide: "Avec les mêmes envies que le menu. Laisse vide pour une autre idée au hasard.", bouton: "Proposer autre chose",
    envoyer: async (souhait, close) => {
      const res = await menus.demander({ ...requete(), remplacer: { jour: r.jour, plat: r.plat, souhait }, autres: sourceMenu().repas.filter((_, k) => k !== i).map(x => x.plat) });
      const nouveau = { ...res.repas[0], jour: r.jour };
      return [h("p", { class: "body-md" }, "Claude propose à la place :"), apercuPlat(nouveau),
        btn("Prendre celui-ci", { variant: "primary", size: "lg", full: true, onClick: async () => { await poserPlat(i, nouveau); close(); toast(`${cap(r.jour)} : ${nouveau.plat}`, { tone: "succes" }); } }),
        btn("Une autre idée", { variant: "ghost", full: true, onClick: () => { close(); remplacerPlat(i); } })];
    } });
}

// Un repas de moins : le plat sort du menu, et ses articles encore à prendre sortent de la liste.
function retirerPlat(i) {
  const m = sourceMenu(), r = m.repas[i];
  const lies = m.ajoute && !etat ? articlesDuPlat(r) : [];
  confirmSheet({ title: `Retirer le plat de ${r.jour} ?`, message: `${r.plat} sort du menu${lies.length ? `, et ${plural(lies.length, "article encore à prendre sort", "articles encore à prendre sortent")} de la liste` : ""}. Les autres repas ne changent pas.`, confirmLabel: "Retirer du menu", cancelLabel: "Garder", destructive: true,
    onConfirm: async () => {
      m.repas.splice(i, 1);
      for (const a of lies) await articles.remove(a.id);
      if (!etat) await menus.update({ repas: m.repas });
      notify(); toast(`${r.plat} retiré du menu`, { tone: "succes" });
      if (location.hash.startsWith("#/repas/") && !location.hash.endsWith("formulaire")) go("#/repas");
    } });
}

// Articles de la liste venus de ce plat et pas encore dans le panier.
const articlesDuPlat = r => state.articles.filter(a => a.source === `${r.plat} (${r.jour})` && !a.coche);

// Pose un plat (modifié ou remplacé) à la place de l'ancien. Si le menu est déjà sur la liste, les articles suivent.
async function poserPlat(i, nouveau) {
  const m = sourceMenu(), ancien = m.repas[i];
  m.repas[i] = nouveau;
  if (etat) { notify(); return; }
  await menus.update({ repas: m.repas });
  if (m.ajoute) {
    for (const a of articlesDuPlat(ancien)) if (!nouveau.ingredients.some(x => x.nom.toLowerCase() === a.nom.toLowerCase())) await articles.remove(a.id);
    await menus.ajouterALaListe({ repas: [nouveau] });
  }
  notify();
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

// Ingrédients à tuile et étapes numérotées (DA du 02/11/2026).
function detailBody(r) {
  const etatDe = i => i.deja_la ? ["chez vous", ""] : state.articles.find(a => a.nom.toLowerCase() === i.nom.toLowerCase())?.coche ? ["dans le panier", "succes"] : ["sur la liste", "accent"];
  return [
    h("div", { class: "groupe" }, titreSection("INGRÉDIENTS", r.ingredients.length),
      h("div", { class: "lignes" }, r.ingredients.map(i => { const [txt, ton] = etatDe(i); return h("div", { class: "row" }, tuile(illustration(i.nom, i.rayon), 44), h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, i.nom), i.quantite && h("span", { class: "caption" }, i.quantite)), h("span", { class: `caption etat ${ton}` }, txt)); }))),
    h("div", { class: "groupe" }, titreSection("ÉTAPES", r.etapes.length),
      h("div", { class: "card etapes" }, r.etapes.map((e, k) => h("div", { class: "etape" }, h("span", { class: "etape-num num" }, String(k + 1)), h("p", { class: "body-md" }, e.replace(/^\d+\s*[·.)-]\s*/, ""))))))
  ];
}
function detailSheet(r) { sheet({ title: r.plat, body: detailBody(r) }); }

export function repasDetailView({ i }) {
  const m = state.menu, r = m?.repas[Number(i)];
  if (!r) { go("#/repas"); return { el: h("div") }; }
  const passe = dateKey(m.semaine) < dateKey(lundi());
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Repas", href: "#/repas" }, title: cap(r.jour) }),
    h("div", { class: "scroll" },
      h("div", { class: "hero plat-hero" }, h("div", { class: "row-main" }, h("h1", { class: "heading-xl" }, r.plat), h("span", { class: "caption num" }, `${r.temps_min} min · pour ${m.demande?.personnes || 2}`))),
      detailBody(r),
      !passe && h("div", { class: "actions-plat" },
        btn("Modifier", { variant: "secondary", icon: "pencil", onClick: () => modifierPlat(Number(i)) }),
        btn("Remplacer", { variant: "secondary", icon: "sparkle", onClick: () => remplacerPlat(Number(i)) }),
        btn("Retirer", { variant: "danger", icon: "x", onClick: () => retirerPlat(Number(i)) }))));
  return { el, tab: "repas" };
}
