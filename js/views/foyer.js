import { state, foyer, auth, DEMO } from "../data.js";
import { h, icon, btn, navbar, pageHead, pill, field, input, confirmSheet, toast, go, dateShort, plural } from "../ui.js";

const initiales = p => (p || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();

function membresCarte() {
  return h("div", { class: "list" }, state.membres.map(m => h("div", { class: "row" },
    h("span", { class: "initiales" }, initiales(m.prenom)),
    h("div", { class: "row-main" }, h("span", { class: "body-md medium fort" }, m.prenom || "Sans prénom"),
      h("span", { class: "caption" }, m.user_id === state.user.id ? `toi${m.created_at <= state.foyer.created_at ? " · a créé le foyer" : ""}` : `a rejoint le ${dateShort(m.created_at)}`)))));
}

function compteCarte() {
  return h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("div", { class: "row-main" }, h("span", { class: "overline" }, "Connecté"), h("span", { class: "body-md medium fort" }, state.user.email)),
      pill(state.horsLigne ? "Hors ligne" : "À jour", state.horsLigne ? null : "succes")),
    h("p", { class: "caption" }, DEMO ? "Mode démo : rien ne part sur un serveur." : "La liste et les repas sont sur ton compte, à jour sur les deux téléphones."),
    btn("Se déconnecter", { variant: "ghost", full: true, onClick: () => confirmSheet({ title: "Se déconnecter ?", message: "La liste reste sur le compte et chez l'autre. Tu la retrouves en te reconnectant.", confirmLabel: "Se déconnecter", cancelLabel: "Rester connecté", onConfirm: () => auth.signOut() }) }));
}

async function partagerCode() {
  const f = state.foyer, texte = `Rejoins notre foyer Cabas avec le code ${f.code} — ${location.origin}${location.pathname}`;
  if (navigator.share) { try { await navigator.share({ title: "Cabas", text: texte }); } catch {} return; }
  try { await navigator.clipboard.writeText(f.code); toast("Code copié"); } catch { toast(f.code); }
}

export function foyerView() {
  const f = state.foyer, seul = state.membres.length < 2;
  const sous = seul ? `${f.nom} · créé ${dateShort(f.created_at)} · 1 personne` : `${f.nom} · ${plural(state.membres.length, "personne", "personnes")} · ${plural(state.articles.filter(a => !a.coche).length, "article sur la liste", "articles sur la liste")}`;
  const expire = new Date(f.code_expire_le) < new Date();
  const body = [];
  if (seul) body.push(h("div", { class: "card" },
    h("span", { class: "overline" }, "Code d'invitation"),
    h("span", { class: "display-sm num" }, f.code),
    h("p", { class: "body-sm" }, expire ? "Ce code a expiré : demande-en un nouveau." : `L'autre le saisit dans Cabas après avoir créé son compte. Valable jusqu'au ${dateShort(f.code_expire_le)}, puis un nouveau code.`),
    expire ? btn("Nouveau code", { variant: "primary", size: "lg", full: true, onClick: () => foyer.renouvelerCode() }) : btn("Partager le code", { variant: "primary", size: "lg", full: true, icon: "share", onClick: partagerCode })));
  body.push(h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Membres")), membresCarte());
  if (!seul) body.push(btn("Inviter quelqu'un d'autre", { variant: "ghost", full: true, onClick: async () => { if (expire) await foyer.renouvelerCode(); partagerCode(); } }));
  body.push(h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Rayons du magasin")),
    h("div", { class: "card" }, h("p", { class: "body-sm fort" }, f.rayons.join(" · ")), h("p", { class: "caption" }, "La liste suit cet ordre. Celui de votre magasin habituel."), btn("Modifier l'ordre", { variant: "ghost", full: true, onClick: () => go("#/foyer/rayons") })));
  body.push(h("div", { class: "section-title" }, h("h2", { class: "heading-md" }, "Compte")), compteCarte());
  if (!seul) body.push(btn("Quitter le foyer", { variant: "ghost", full: true, onClick: () => confirmSheet({ title: "Quitter le foyer ?", message: `Tu ne verras plus la liste ni les repas de ${f.nom}. L'autre les garde, et pourra t'inviter de nouveau.`, confirmLabel: "Quitter le foyer", cancelLabel: "Rester", destructive: true, onConfirm: () => foyer.quitter() }) }));
  const el = h("div", { class: "screen" }, pageHead("Foyer", sous), h("div", { class: "scroll" }, body));
  return { el, tab: "foyer" };
}

// Connecté sans foyer : créer, ou rejoindre avec un code.
export function foyerChoixView() {
  let code = "", err = null;
  const champ = input({ placeholder: "ABC-123", autocapitalize: "characters", autocomplete: "off", "aria-label": "Code d'invitation", onInput: e => { code = e.target.value; } });
  const rendu = () => { const el = h("div", { class: "screen no-tabs" },
    pageHead("Votre foyer", "Une seule liste pour vous deux. L'un crée le foyer, l'autre le rejoint avec le code."),
    h("div", { class: "scroll" },
      h("div", { class: "card" }, h("h2", { class: "heading-md" }, "Créer notre foyer"), h("p", { class: "body-sm" }, "Tu reçois un code à partager. La liste démarre vide."),
        btn("Créer le foyer", { variant: "primary", size: "lg", full: true, onClick: () => foyer.creer().catch(e => toast(e.message)) })),
      h("div", { class: "card" }, h("h2", { class: "heading-md" }, "Rejoindre un foyer"),
        field({ label: "Code d'invitation", input: champ, help: "Demande-le à la personne qui a créé le foyer.", error: err }),
        btn("Rejoindre", { variant: "secondary", size: "lg", full: true, onClick: async () => { try { await foyer.rejoindre(code.trim()); } catch (e) { err = e.message; const n = rendu(); document.getElementById("app").replaceChildren(n); } } })),
      btn("Se déconnecter", { variant: "ghost", full: true, onClick: () => auth.signOut() })));
    return el; };
  return { el: rendu() };
}

// Ordre des rayons : on maintient une ligne et on la glisse (drag and drop, demande d'Alexis).
export function rayonsView() {
  let ordre = [...state.foyer.rayons];
  const liste = h("div", { class: "list" });
  const dessiner = () => liste.replaceChildren(ordre.map((r, i) => {
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
      btn("Enregistrer", { variant: "primary", size: "lg", full: true, onClick: async () => { await foyer.saveRayons(ordre); toast("Ordre enregistré"); go("#/foyer"); } })));
  return { el, tab: "foyer" };
}
