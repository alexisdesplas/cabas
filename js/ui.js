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

// Icônes Phosphor (phosphoricons.com, MIT, licence dans icons/PHOSPHOR-LICENSE) : tracés « regular » remplis, grille 256 ; variantes « Fill » pour l'onglet actif.
const PATHS = {
  caretLeft: "M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z",
  caretRight: "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z",
  plus: "M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z",
  minus: "M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z",
  check: "M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z",
  x: "M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z",
  cart: "M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z",
  fork: "M72,88V40a8,8,0,0,1,16,0V88a8,8,0,0,1-16,0ZM216,40V224a8,8,0,0,1-16,0V176H152a8,8,0,0,1-8-8,268.75,268.75,0,0,1,7.22-56.88c9.78-40.49,28.32-67.63,53.63-78.47A8,8,0,0,1,216,40ZM200,53.9c-32.17,24.57-38.47,84.42-39.7,106.1H200ZM119.89,38.69a8,8,0,1,0-15.78,2.63L112,88.63a32,32,0,0,1-64,0l7.88-47.31a8,8,0,1,0-15.78-2.63l-8,48A8.17,8.17,0,0,0,32,88a48.07,48.07,0,0,0,40,47.32V224a8,8,0,0,0,16,0V135.32A48.07,48.07,0,0,0,128,88a8.17,8.17,0,0,0-.11-1.31Z",
  house: "M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z",
  sparkle: "M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z",
  warning: "M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z",
  pencil: "M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z",
  more: "M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z",
  chevron: "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z",
  dots: "M104,60A12,12,0,1,1,92,48,12,12,0,0,1,104,60Zm60,12a12,12,0,1,0-12-12A12,12,0,0,0,164,72ZM92,116a12,12,0,1,0,12,12A12,12,0,0,0,92,116Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,116ZM92,184a12,12,0,1,0,12,12A12,12,0,0,0,92,184Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,184Z",
  cloud: "M160,40A88.09,88.09,0,0,0,81.29,88.67,64,64,0,1,0,72,216h88a88,88,0,0,0,0-176Zm0,160H72a48,48,0,0,1,0-96c1.1,0,2.2,0,3.29.11A88,88,0,0,0,72,128a8,8,0,0,0,16,0,72,72,0,1,1,72,72Zm37.66-93.66a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L144,148.69l42.34-42.35A8,8,0,0,1,197.66,106.34Z",
  wifiOff: "M213.92,210.62a8,8,0,1,1-11.84,10.76l-52-57.15a60,60,0,0,0-57.41,7.24,8,8,0,1,1-9.42-12.93A75.43,75.43,0,0,1,128,144c1.28,0,2.55,0,3.82.1L104.9,114.49A108,108,0,0,0,61,135.31,8,8,0,0,1,49.73,134,8,8,0,0,1,51,122.77a124.27,124.27,0,0,1,41.71-21.66L69.37,75.4a155.43,155.43,0,0,0-40.29,24A8,8,0,0,1,18.92,87,171.87,171.87,0,0,1,58,62.86L42.08,45.38A8,8,0,1,1,53.92,34.62ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192ZM237.08,87A172.3,172.3,0,0,0,106,49.4a8,8,0,1,0,2,15.87A158.33,158.33,0,0,1,128,64a156.25,156.25,0,0,1,98.92,35.37A8,8,0,0,0,237.08,87ZM195,135.31a8,8,0,0,0,11.24-1.3,8,8,0,0,0-1.3-11.24,124.25,124.25,0,0,0-51.73-24.2A8,8,0,1,0,150,114.24,108.12,108.12,0,0,1,195,135.31Z",
  share: "M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z",
  cartFill: "M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Z",
  forkFill: "M216,40V224a8,8,0,0,1-16,0V176H152a8,8,0,0,1-8-8,268.75,268.75,0,0,1,7.22-56.88c9.78-40.49,28.32-67.63,53.63-78.47A8,8,0,0,1,216,40Zm-96.11-1.31a8,8,0,1,0-15.78,2.63L111.89,88H88V40a8,8,0,0,0-16,0V88H48.11l7.78-46.68a8,8,0,1,0-15.78-2.63l-8,48A8.17,8.17,0,0,0,32,88a48.07,48.07,0,0,0,40,47.32V224a8,8,0,0,0,16,0V135.32A48.07,48.07,0,0,0,128,88a8.17,8.17,0,0,0-.11-1.31Z",
  houseFill: "M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"
};
export function icon(name, cls) {
  const svg = h("svg", { viewBox: "0 0 256 256", fill: "currentColor", "aria-hidden": "true", class: cls });
  svg.append(h("path", { svg: true, d: PATHS[name] || PATHS.warning }));
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

// ——— DA « tuiles » (02/11/2026)
// Tuile illustrée : fond page dans une ligne ou une carte (fond=true), illustration seule quand elle est posée sur la page.
export const tuile = (src, taille = 44, fond = true) => h("span", { class: `tuile t${taille}${fond ? "" : " nue"}`, "aria-hidden": "true" }, h("img", { src, alt: "", loading: "lazy", decoding: "async" }));
export const avatar = (initiale, teinte, taille = "sm", titre) => h("span", { class: `avatar av-${teinte} av-${taille}`, title: titre || null, "aria-label": titre || null }, initiale);
// En-tête compact : surtitre en capitales, titre, et à droite les avatars du foyer (ou autre chose).
export function enTete(sur, titre, droite) { return h("div", { class: "entete" }, h("div", { class: "entete-titre" }, h("span", { class: "overline" }, sur), h("h1", { class: "heading-xl" }, titre)), droite || null); }
export const avatarsFoyer = membres => h("div", { class: "avatars" }, membres.map(m => m));
// Compteur : grand chiffre, libellé, info à droite, barre fine.
export function compteur(n, libelle, droite, pct, ton) { return h("div", { class: `compteur${ton ? " " + ton : ""}` }, h("div", { class: "compteur-ligne" }, h("span", { class: "display-sm num" }, String(n)), h("span", { class: "body-md discret" }, libelle), droite && h("span", { class: "caption num" }, droite)), h("div", { class: "barre" }, h("div", { class: "fait", style: { width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%` } }))); }
// Titre de section : capitales, filet, compte à droite.
export const titreSection = (nom, droite) => h("div", { class: "sec" }, h("span", { class: "overline" }, nom), h("span", { class: "filet" }), droite != null && (droite instanceof Node ? droite : h("span", { class: "caption num" }, String(droite))));

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

// Jauge : un curseur à pas, le remplissage suit la valeur (variable --pct), la valeur formatée est rendue à part.
export function jauge({ value, min = 0, max = 100, step = 1, format = String, label, onChange }) {
  const input = h("input", { type: "range", min, max, step, value, "aria-label": label });
  const valeur = h("span", { class: "jauge-valeur num" });
  const maj = () => { const v = Number(input.value); valeur.textContent = format(v); input.style.setProperty("--pct", `${((v - min) / (max - min)) * 100}%`); };
  input.addEventListener("input", () => { maj(); onChange(Number(input.value)); });
  maj();
  return { el: h("div", { class: "jauge" }, input), valeur };
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
  // Fermeture animée : la classe « out » joue la sortie, puis le dialog se ferme vraiment.
  const close = () => { if (dlg.classList.contains("out")) return; dlg.classList.add("out"); setTimeout(() => dlg.close(), 170); };
  dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
  dlg.addEventListener("cancel", e => { e.preventDefault(); close(); });
  dlg.append(
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
