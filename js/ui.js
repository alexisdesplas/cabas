// Briques d'interface : création de DOM, icônes, composants Hardwood traduits en HTML (reprises de Fluide).

export function h(tag, props, ...children) {
  const el = tag === "svg" || props?.svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false || k === "svg") continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.setAttribute("class", v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k in el && !(el instanceof SVGElement)) el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Icônes au tracé Phosphor Regular (grille 256, trait 16).
const PATHS = {
  caretLeft: "M160 208 80 128l80-80",
  caretRight: "M96 48l80 80-80 80",
  plus: "M40 128h176M128 40v176",
  minus: "M40 128h176",
  check: "M40 144l56 56L224 72",
  x: "M200 56 56 200M200 200 56 56",
  cart: "M24 48h24l28 128h120l24-80H68M96 216a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM180 216a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  fork: "M80 24v72a24 24 0 0 0 48 0V24M104 120v112M184 24c-24 24-24 72-24 96 0 16 8 32 24 32v80",
  house: "M40 216V112l88-80 88 80v104h-56v-64h-64v64z",
  sparkle: "M128 24l20 60 60 20-60 20-20 60-20-60-60-20 60-20zM208 168l8 24 24 8-24 8-8 24-8-24-24-8 24-8z",
  warning: "M128 104v40M128 180v4M114 40 22 200a16 16 0 0 0 14 24h184a16 16 0 0 0 14-24L142 40a16 16 0 0 0-28 0z",
  pencil: "M92 216H48v-44L168 52l44 44zM136 84l44 44",
  dots: "M100 60a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM156 60a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM100 136a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM156 136a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM100 212a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM156 212a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  cloud: "M80 208a56 56 0 1 1 11-111 80 80 0 0 1 157 23 44 44 0 0 1-40 88zM96 144l24 24 48-48",
  wifiOff: "M48 48l160 160M128 200v4M72 152c16-16 36-24 56-24M40 112c24-24 56-36 88-36M184 152a72 72 0 0 0-12-10M216 112a124 124 0 0 0-28-22",
  share: "M128 160V32M88 72l40-40 40 40M208 120v88H48v-88"
};
export function icon(name, cls) {
  const svg = h("svg", { viewBox: "0 0 256 256", fill: "none", stroke: "currentColor", "stroke-width": 16, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: cls });
  svg.append(h("path", { svg: true, d: PATHS[name] }));
  return svg;
}

// ——— Formats (français)
export const go = hash => { location.hash = hash; };
export function ago(t) {
  const s = Math.round((Date.now() - new Date(t).getTime()) / 1000);
  if (s < 45) return "à l'instant";
  if (s < 3600) return `il y a ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? "hier" : d < 7 ? `il y a ${d} j` : new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
export const dateLong = t => new Date(t).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const dateShort = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
export const plural = (n, un, des) => `${n} ${n > 1 ? des : un}`;

// ——— Composants
export function navbar({ back, title, subtitle, action }) {
  return h("header", { class: "navbar" },
    h("div", { class: "navbar-inner" },
      h("div", { class: "navbar-side" },
        back && h("button", { class: "navbar-back", "aria-label": `Retour à ${back.label}`, onClick: back.onClick || (() => go(back.href)) }, icon("caretLeft"), back.label)),
      h("div", { class: "navbar-title" }, h("h1", null, title), subtitle && h("span", null, subtitle)),
      h("div", { class: "navbar-side end" },
        action && h("button", { class: "navbar-action", onClick: action.onClick, disabled: action.disabled }, action.label))));
}

export function pageHead(title, subtitle, end) {
  return h("div", { class: "page-head" },
    h("div", null, h("h1", { class: "heading-xl" }, title), subtitle && h("p", { class: "body-md discret num" }, subtitle)),
    end || null);
}

export function btn(label, { variant = "secondary", size, icon: ic, full, onClick, disabled, type = "button" } = {}) {
  const cls = ["btn", variant, size, full && "full"].filter(Boolean).join(" ");
  return h("button", { class: cls, type, onClick, disabled }, ic && icon(ic), label);
}

export const pill = (label, tone) => h("span", { class: `pill${tone ? " " + tone : ""}` }, label);

export function hint(text, tone, ic) {
  return h("div", { class: `hint${tone ? " " + tone : ""}`, role: "status" }, ic && icon(ic), h("span", null, text));
}

// Le groupe tient sa propre sélection : il reste juste même quand l'écran n'est pas redessiné.
export function segmented(options, value, onChange) {
  let cur = value;
  const buttons = options.map(([v, label]) => h("button", { type: "button", "aria-pressed": String(v === cur), onClick: () => {
    if (v === cur) return;
    cur = v;
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i][0] === cur)));
    onChange(v);
  } }, label));
  return h("div", { class: "segmented", role: "group" }, buttons);
}

// Puces à choix multiples : un second tap désélectionne.
export function chips(options, values, onChange) {
  const cur = new Set(values);
  const buttons = options.map(v => h("button", { type: "button", class: "chip", "aria-pressed": String(cur.has(v)), onClick: e => {
    cur.has(v) ? cur.delete(v) : cur.add(v);
    e.currentTarget.setAttribute("aria-pressed", String(cur.has(v)));
    onChange([...cur]);
  } }, v));
  return h("div", { class: "chips" }, buttons);
}

// Stepper compact : un tap = un pas, maintien appuyé = répétition.
export function stepper({ value, min = 0, max = 14, format = String, label, onChange }) {
  let v = value;
  const display = h("span", { class: "value num" }, format(v));
  const set = x => { v = Math.min(max, Math.max(min, x)); display.textContent = format(v); onChange(v); };
  const hold = dir => {
    let timer, rep;
    const stop = () => { clearTimeout(timer); clearInterval(rep); };
    return {
      onPointerdown: e => { e.preventDefault(); set(v + dir); timer = setTimeout(() => { rep = setInterval(() => set(v + dir), 120); }, 400); },
      onPointerup: stop, onPointerleave: stop, onPointercancel: stop,
      onClick: e => { if (e.detail === 0) set(v + dir); }
    };
  };
  return h("div", { class: "stepper" },
    h("button", { type: "button", "aria-label": `Moins ${label}`, ...hold(-1) }, icon("minus")),
    display,
    h("button", { type: "button", "aria-label": `Plus ${label}`, ...hold(1) }, icon("plus")));
}

// Champ Hardwood : libellé, saisie, aide (ou erreur).
export function field({ label, help, error, input }) {
  return h("div", { class: `field${error ? " error" : ""}` },
    label && h("label", null, label), input, (error || help) && h("div", { class: "help" }, error || help));
}
export const input = props => h("input", { class: "input", ...props });

// Feuille qui monte du bas, dans un <dialog> : poignée, titre à gauche, croix de 44 px à droite.
export function sheet({ title, body }) {
  const dlg = h("dialog", { class: "sheet", "aria-label": title, onClose: () => dlg.remove() });
  const close = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
  dlg.append(
    h("div", { class: "sheet-grab", "aria-hidden": "true" }),
    h("div", { class: "sheet-head" }, h("h2", null, title), h("button", { class: "sheet-close", type: "button", "aria-label": "Fermer", onClick: close }, icon("x"))),
    h("div", { class: "sheet-body" }, typeof body === "function" ? body(close) : body));
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

// Confirmation dans une feuille : le geste qui engage en premier, la sortie sans risque en dessous.
export function confirmSheet({ title, message, confirmLabel, cancelLabel = "Annuler", destructive, onConfirm }) {
  return sheet({ title, body: close => [
    h("p", { class: "body-md" }, message),
    btn(confirmLabel, { variant: destructive ? "destructive" : "primary", size: "lg", full: true, onClick: () => { close(); onConfirm(); } }),
    btn(cancelLabel, { variant: "ghost", full: true, onClick: close })
  ] });
}

// Toast : un seul à la fois, remplacé en douceur. Ton « info » (sans icône), « succes » (coche), « erreur » (rouge, triangle).
// Placé au-dessus de la barre d'onglets ; en haut si un champ a le focus (le clavier couvre le bas). Durée selon la longueur.
// Action facultative : { label, onClick }, ex. « Annuler » après un ajout. Un tap sur le toast le ferme.
let toastTimer = null;
export function toast(text, { tone = "info", action, duree } = {}) {
  const haut = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  const sansOnglets = !document.querySelector(".tabbar");
  const ic = tone === "erreur" ? "warning" : tone === "succes" ? "check" : null;
  const classe = `toast ${tone}${haut ? " haut" : ""}${sansOnglets ? " sans-onglets" : ""}`;
  let el = document.querySelector(".toast");
  const fermer = () => { if (!el?.isConnected) return; clearTimeout(toastTimer); el.classList.remove("on"); const cible = el; setTimeout(() => cible.remove(), 220); };
  const contenu = [ic && icon(ic), h("span", { class: "toast-texte" }, text),
    action && h("button", { type: "button", class: "toast-action", onClick: e => { e.stopPropagation(); fermer(); action.onClick(); } }, action.label)];
  if (el && el.classList.contains("on")) {
    el.className = `${classe} on`; el.replaceChildren(...contenu);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  } else {
    el?.remove();
    el = h("div", { class: classe, role: tone === "erreur" ? "alert" : "status", "aria-live": tone === "erreur" ? "assertive" : "polite", onClick: fermer }, ...contenu);
    document.body.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
  }
  clearTimeout(toastTimer);
  const ms = duree ?? Math.min(6000, Math.max(tone === "erreur" ? 4000 : action ? 3500 : 2000, 1200 + text.length * 45));
  toastTimer = setTimeout(fermer, ms);
  return fermer;
}
