import { state, foyer, auth, synchroniser, DEMO, teinteDe, initialeDe } from "../data.js";
import { illustrationCle } from "../illustrations.js";
import { h, icon, btn, navbar, pageHead, pill, field, input, confirmSheet, toast, go, dateShort, plural, tuile, avatar, enTete, titreSection } from "../ui.js";


// Créateur : la colonne cree_par ; à défaut (ancien schéma), le plus ancien compte du foyer.
const createur = () => state.foyer?.cree_par || [...state.membres].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.user_id;

function membresCarte() {
  const moiCreateur = createur() === state.user.id;
  return h("div", { class: "lignes" }, [...state.membres].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(m => {
    const moi = m.user_id === state.user.id, cree = m.user_id === createur();
    const sous = [moi ? "toi" : null, cree ? "a créé le foyer" : `a rejoint le ${dateShort(m.created_at)}`].filter(Boolean).join(" · ");
    return h("div", { class: "row" },
      avatar(initialeDe(m.prenom), teinteDe(m.user_id), "md"),
      h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, m.prenom || "Sans prénom"), h("span", { class: "caption" }, sous)),
      moiCreateur && !moi && btn("Retirer", { variant: "ghost", onClick: () => retirer(m) }));
  }));
}

function retirer(m) {
  const nom = m.prenom || "ce membre";
  confirmSheet({ title: `Retirer ${nom} ?`, message: `${nom} ne verra plus la liste ni les repas de ${state.foyer.nom}. Le code d'invitation change : pour revenir, il lui faudra le nouveau.`,
    confirmLabel: `Retirer ${nom}`, cancelLabel: "Annuler", destructive: true,
    onConfirm: async () => { try { await foyer.retirer(m.user_id); toast(`${nom} ne fait plus partie du foyer`, { tone: "succes" }); } catch (e) { toast(e.message, { tone: "erreur" }); } } });
}

// Carte compte (proposition Fluide) : tuile, e-mail, état, dernière synchro, Synchroniser · Se déconnecter.
function compteCarte() {
  const quand = state.majLe ? new Date(state.majLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", { class: "tuile" }, icon("cloud")),
      h("div", { class: "row-main" }, h("span", { class: "overline" }, state.horsLigne ? "Hors ligne" : "Connecté"), h("span", { class: "body-md medium fort" }, state.user.email)),
      pill(state.horsLigne ? "En attente" : "À jour", state.horsLigne ? "attention" : "succes")),
    h("p", { class: "caption" }, DEMO ? "Mode démo : rien ne part sur un serveur." : quand ? `Dernière synchro aujourd'hui à ${quand}.` : "Synchronisation en cours."),
    h("div", { class: "actions" },
      btn("Synchroniser", { variant: "secondary", onClick: async () => { await synchroniser(); toast("À jour", { tone: "succes" }); } }),
      btn("Se déconnecter", { variant: "ghost", onClick: () => confirmSheet({ title: "Se déconnecter ?", message: "La liste reste sur le compte et chez l'autre. Tu la retrouves en te reconnectant.", confirmLabel: "Se déconnecter", cancelLabel: "Rester connecté", onConfirm: () => auth.signOut() }) })));
}
const bloc = (titre, ...contenu) => h("div", { class: "groupe" }, titreSection(titre.toUpperCase()), ...contenu);

async function partagerCode() {
  const f = state.foyer, texte = `Rejoins notre foyer Cabas avec le code ${f.code} — ${location.origin}${location.pathname}`;
  if (navigator.share) { try { await navigator.share({ title: "Cabas", text: texte }); } catch {} return; }
  try { await navigator.clipboard.writeText(f.code); toast("Code copié", { tone: "succes" }); } catch { toast(f.code); }
}

export function foyerView() {
  const f = state.foyer, seul = state.membres.length < 2;
  const sous = seul ? `${f.nom} · créé ${dateShort(f.created_at)} · 1 personne` : `${f.nom} · ${plural(state.membres.length, "personne", "personnes")} · ${plural(state.articles.filter(a => !a.coche).length, "article sur la liste", "articles sur la liste")}`;
  const expire = new Date(f.code_expire_le) < new Date();
  const body = [];
  // La carte du code reste visible à deux (décision du 02/11/2026) : en premier quand on est seul, après les membres sinon.
  const carteCode = h("div", { class: "card" },
    h("div", { class: "code-haut" }, tuile(illustrationCle("house"), 56), h("div", { class: "row-main" }, h("span", { class: "overline" }, "Code d'invitation"), h("span", { class: "display-sm num" }, f.code))),
    h("p", { class: "body-sm" }, expire ? "Ce code a expiré : demande-en un nouveau." : seul
      ? `L'autre le saisit dans Cabas après avoir créé son compte. Valable jusqu'au ${dateShort(f.code_expire_le)}, puis un nouveau code.`
      : `Pour inviter quelqu'un d'autre dans ${f.nom}. Valable jusqu'au ${dateShort(f.code_expire_le)}, puis un nouveau code.`),
    expire ? btn("Nouveau code", { variant: "primary", size: "lg", full: true, onClick: () => foyer.renouvelerCode() })
      : btn("Partager le code", { variant: seul ? "primary" : "secondary", size: "lg", full: true, icon: "share", onClick: partagerCode }));
  if (seul) body.push(bloc("Inviter", carteCode));
  body.push(bloc("Membres", membresCarte()));
  if (!seul) body.push(bloc("Inviter", carteCode));
  body.push(bloc("Compte", compteCarte()));
  if (!seul) body.push(btn("Quitter le foyer", { variant: "ghost", full: true, onClick: () => confirmSheet({ title: "Quitter le foyer ?", message: `Tu ne verras plus la liste ni les repas de ${f.nom}. L'autre les garde, et pourra t'inviter de nouveau.`, confirmLabel: "Quitter le foyer", cancelLabel: "Rester", destructive: true, onConfirm: () => foyer.quitter() }) }));
  const el = h("div", { class: "screen" }, h("div", { class: "scroll" }, enTete(f.nom.toUpperCase(), "Foyer"), h("p", { class: "caption num entete-sous" }, sous), body));
  return { el, tab: "foyer" };
}

// Connecté sans foyer : créer, ou rejoindre avec un code.
export function foyerChoixView() {
  const rendu = () => { const el = h("div", { class: "screen no-tabs" },
    pageHead("Votre foyer", "Une seule liste pour vous deux. L'un crée le foyer, l'autre le rejoint avec le code."),
    h("div", { class: "scroll" },
      h("div", { class: "card" }, h("h2", { class: "heading-md" }, "Créer notre foyer"), h("p", { class: "body-sm" }, "Tu reçois un code à partager. La liste démarre vide."),
        btn("Créer le foyer", { variant: "primary", size: "lg", full: true, onClick: () => foyer.creer().catch(e => toast(e.message, { tone: "erreur" })) })),
      h("div", { class: "card" }, h("h2", { class: "heading-md" }, "Rejoindre un foyer"), h("p", { class: "body-sm" }, "L'autre te montre un code de six caractères dans son onglet Foyer."),
        btn("J'ai un code", { variant: "secondary", size: "lg", full: true, onClick: () => go("#/foyer/rejoindre") })),
      btn("Se déconnecter", { variant: "ghost", full: true, onClick: () => auth.signOut() })));
    return el; };
  return { el: rendu() };
}

// Ordre des rayons : on maintient une ligne et on la glisse (drag and drop, demande d'Alexis).
export function rayonsView() {
  let ordre = [...state.foyer.rayons];
  const liste = h("div", { class: "list" });
  const dessiner = () => liste.replaceChildren(...ordre.map((r, i) => {
    const row = h("div", { class: "row drag", "data-i": i },
      h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, r)),
      h("span", { class: "icon-btn handle", "aria-hidden": "true" }, icon("dots")));
    row.addEventListener("pointerdown", e => debut(e, row, i));
    return row;
  }));
  const debut = (e, row, from) => {
    e.preventDefault(); row.setPointerCapture(e.pointerId); row.classList.add("lifted");
    const rows = [...liste.children], hauteur = row.offsetHeight, y0 = e.clientY; let to = from;
    const move = ev => {
      const dy = ev.clientY - y0; row.style.transform = `translateY(${dy}px)`;
      to = Math.min(rows.length - 1, Math.max(0, from + Math.round(dy / hauteur)));
      rows.forEach((r, i) => { if (r === row) return; r.style.transform = i > from && i <= to ? `translateY(-${hauteur}px)` : i < from && i >= to ? `translateY(${hauteur}px)` : ""; });
    };
    const fin = () => {
      row.removeEventListener("pointermove", move); row.removeEventListener("pointerup", fin); row.removeEventListener("pointercancel", fin);
      row.classList.remove("lifted"); rows.forEach(r => { r.style.transform = ""; });
      if (to !== from) { const [x] = ordre.splice(from, 1); ordre.splice(to, 0, x); }
      dessiner();
    };
    row.addEventListener("pointermove", move); row.addEventListener("pointerup", fin); row.addEventListener("pointercancel", fin);
  };
  dessiner();
  const el = h("div", { class: "screen" },
    navbar({ back: { label: "Foyer", href: "#/foyer" }, title: "Ordre des rayons", subtitle: "votre magasin habituel" }),
    h("div", { class: "scroll" },
      h("p", { class: "body-sm discret" }, "La liste suit cet ordre, du premier rayon à la caisse. Maintiens un rayon et glisse-le pour le déplacer."),
      liste,
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: async () => { await foyer.saveRayons(ordre); toast("Ordre enregistré", { tone: "succes" }); go("#/foyer"); } })));
  return { el, tab: "foyer" };
}

// Saisie du code d'invitation en six cases (décision du 02/11/2026). Un seul vrai champ, invisible, couvre les cases :
// le clavier s'ouvre au tap, le collage « 7KQ-4MZ » passe, et le sixième caractère valide tout seul.
export function rejoindreView() {
  let code = "", err = null, enCours = false;
  const nettoyer = v => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const cases = Array.from({ length: 6 }, () => h("span", { class: "case", "aria-hidden": "true" }));
  const reel = h("input", { class: "code-reel", type: "text", inputmode: "text", autocapitalize: "characters", autocomplete: "one-time-code", autocorrect: "off", spellcheck: "false", maxlength: "7", "aria-label": "Code d'invitation, six caractères",
    onInput: e => { code = nettoyer(e.target.value); e.target.value = code; err = null; rendre(); if (code.length === 6) valider(); },
    onKeydown: e => { if (e.key === "Enter") valider(); }, onFocus: () => rendre(), onBlur: () => rendre() });
  const aide = h("p", { class: "caption code-aide" });
  const bouton = btn("Rejoindre", { variant: "primary", size: "lg", full: true, onClick: () => valider() });
  function rendre() {
    const focus = document.activeElement === reel;
    cases.forEach((c, i) => { c.textContent = code[i] || ""; c.classList.toggle("pleine", !!code[i]); c.classList.toggle("active", focus && i === Math.min(code.length, 5)); });
    aide.textContent = err || (enCours ? "Vérification…" : "Six lettres et chiffres, comme 7KQ-4MZ. Le tiret ne compte pas.");
    aide.classList.toggle("erreur", !!err);
    bouton.disabled = code.length !== 6 || enCours;
  }
  async function valider() {
    if (code.length !== 6 || enCours) return;
    enCours = true; rendre();
    try { await foyer.rejoindre(`${code.slice(0, 3)}-${code.slice(3)}`); go("#/"); toast(`Bienvenue dans ${state.foyer?.nom || "le foyer"}`, { tone: "succes" }); }
    catch (e) { err = e.message; enCours = false; code = ""; reel.value = ""; rendre(); reel.focus(); }
  }
  const grille = h("div", { class: "code-cases" }, cases.slice(0, 3), h("span", { class: "tiret", "aria-hidden": "true" }, "–"), cases.slice(3), reel);
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Votre foyer", href: "#/foyer" }, title: "Rejoindre un foyer" }),
    h("div", { class: "scroll" },
      h("p", { class: "body-md" }, "Saisis le code que l'autre te montre dans son onglet Foyer. Il reste valable sept jours."),
      h("div", { class: "card code-carte" }, h("span", { class: "overline" }, "Code d'invitation"), grille, aide),
      bouton));
  rendre();
  setTimeout(() => reel.focus(), 0);
  return { el };
}
