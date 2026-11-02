import { auth, DEMO } from "../data.js";
import { h, icon, btn, navbar, field, input, toast, go } from "../ui.js";

const entete = (titre, texte) => h("div", { class: "compte-head" }, h("div", { class: "rond" }, icon("house")), h("h1", { class: "heading-xl" }, titre), h("p", { class: "body-md" }, texte));
const bascule = (question, lien, href) => h("div", { class: "bascule" }, h("span", { class: "body-md discret" }, question, " "), h("button", { type: "button", onClick: () => go(href) }, lien));

// Un formulaire de compte : champs, erreurs sous le champ fautif, bouton qui attend pendant l'envoi.
function formulaire({ titre, texte, champs, action, onSubmit, apres }) {
  const vals = {}, errs = {};
  const rendu = () => {
    const inputs = champs.map(c => {
      const inp = c.type === "password" ? input({ type: "password", placeholder: c.placeholder, autocomplete: c.autocomplete, value: vals[c.id] || "", onInput: e => { vals[c.id] = e.target.value; } })
        : input({ type: c.type || "text", placeholder: c.placeholder, autocomplete: c.autocomplete, autocapitalize: c.type === "email" ? "none" : undefined, inputmode: c.type === "email" ? "email" : undefined, value: vals[c.id] || "", onInput: e => { vals[c.id] = e.target.value; } });
      return field({ label: c.label, input: inp, help: c.help, error: errs[c.id] });
    });
    const envoyer = btn(action, { variant: "primary", size: "lg", full: true, type: "submit" });
    const form = h("form", { class: "scroll", onSubmit: async e => {
      e.preventDefault();
      for (const k in errs) delete errs[k];
      for (const c of champs) if (c.requis && !(vals[c.id] || "").trim()) errs[c.id] = "À remplir.";
      if (Object.keys(errs).length) { redessiner(); return; }
      envoyer.disabled = true; envoyer.textContent = "…";
      try { await onSubmit(vals); } catch (err) { errs[champsErreur(err.message, champs)] = err.message; redessiner(); }
    } }, entete(titre, texte), ...inputs, envoyer, ...(apres ? apres(vals) : []));
    return h("div", { class: "screen no-tabs" }, form);
  };
  let el = rendu();
  const redessiner = () => { const n = rendu(); el.replaceWith(n); el = n; };
  return { el };
}
const champsErreur = (msg, champs) => (/e-mail|compte existe|adresse/i.test(msg) && champs.find(c => c.id === "email") ? "email" : /mot de passe|caractères/i.test(msg) && champs.find(c => c.id === "mdp") ? "mdp" : champs[champs.length - 1].id);

export function connecterView() {
  return formulaire({
    titre: "Ton compte Cabas",
    texte: "La liste et les repas sont partagés avec ton foyer. Connecte-toi sur chaque téléphone : tout reste à jour en direct.",
    champs: [
      { id: "email", label: "Adresse e-mail", type: "email", placeholder: "prenom@exemple.fr", autocomplete: "email", requis: true },
      { id: "mdp", label: "Mot de passe", type: "password", placeholder: "8 caractères au moins", autocomplete: "current-password", requis: true }
    ],
    action: "Me connecter",
    onSubmit: v => auth.signIn(v.email.trim(), v.mdp),
    apres: v => [
      btn("Mot de passe oublié ?", { variant: "ghost", full: true, onClick: async () => { if (!v.email?.trim()) { toast("Écris ton adresse e-mail d'abord"); return; } try { await auth.resetPassword(v.email.trim()); toast("E-mail envoyé : suis le lien reçu", { tone: "succes" }); } catch (e) { toast(e.message, { tone: "erreur" }); } } }),
      h("div", { class: "espace" }),
      bascule("Pas encore de compte ?", "Créer mon compte", "#/compte/creer"),
      DEMO && h("p", { class: "caption", style: { textAlign: "center" } }, "Mode démo : n'importe quel e-mail et mot de passe passent (« faux » refuse).")
    ]
  });
}

export function creerView() {
  return formulaire({
    titre: "Créer ton compte",
    texte: "Un compte par personne : on sait qui a ajouté quoi, et chacun garde la liste sur son téléphone.",
    champs: [
      { id: "prenom", label: "Prénom", placeholder: "Alexis", autocomplete: "given-name", help: "Affiché à côté de ce que tu ajoutes.", requis: true },
      { id: "email", label: "Adresse e-mail", type: "email", placeholder: "prenom@exemple.fr", autocomplete: "email", requis: true },
      { id: "mdp", label: "Mot de passe", type: "password", placeholder: "8 caractères au moins", autocomplete: "new-password", help: "L'iPhone peut en proposer un et le garder dans le trousseau.", requis: true }
    ],
    action: "Créer mon compte",
    onSubmit: async v => {
      if (v.mdp.length < 8) throw new Error("8 caractères au moins.");
      const { aValider } = await auth.signUp(v.prenom.trim(), v.email.trim(), v.mdp);
      if (aValider) { sessionStorage.setItem("cabas-email", v.email.trim()); go("#/compte/valider"); }
    },
    apres: () => [h("div", { class: "espace" }), bascule("Déjà un compte ?", "Me connecter", "#/compte")]
  });
}

export function validerView() {
  const email = sessionStorage.getItem("cabas-email") || "ton adresse";
  const el = h("div", { class: "screen no-tabs" },
    navbar({ back: { label: "Connexion", href: "#/compte" }, title: "Compte créé" }),
    h("div", { class: "scroll" },
      entete("Ton adresse va être validée", `Un e-mail est parti à ${email} : suis le lien pour valider ton adresse, puis connecte-toi. Ensuite, vous créez ou rejoignez votre foyer.`),
      btn("Me connecter", { variant: "primary", size: "lg", full: true, onClick: () => go("#/compte") })));
  return { el };
}

// Depuis le lien « mot de passe oublié » : Supabase a ouvert une session de récupération.
export function motDePasseView() {
  return formulaire({
    titre: "Choisis un nouveau mot de passe",
    texte: "Tu viens du lien reçu par e-mail. Une fois enregistré, tu es connecté et tu retrouves la liste du foyer.",
    champs: [{ id: "mdp", label: "Nouveau mot de passe", type: "password", placeholder: "8 caractères au moins", autocomplete: "new-password", requis: true }],
    action: "Enregistrer le mot de passe",
    onSubmit: async v => { if (v.mdp.length < 8) throw new Error("8 caractères au moins."); await auth.updatePassword(v.mdp); toast("Mot de passe enregistré", { tone: "succes" }); go("#/"); }
  });
}
