// Fonction Vercel : le formulaire « Repas de la semaine » → Claude → un menu JSON.
// La clé API reste ici. On vérifie d'abord que la personne est connectée à Supabase.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Ingredient = z.object({
  nom: z.string().describe("Nom tel qu'on le cherche en rayon, ex. « Lait de coco »"),
  quantite: z.string().describe("Quantité pour le nombre de personnes, ex. « 2 boîtes », « 400 g », « 1 botte » ; vide si évident"),
  rayon: z.string().describe("Un des rayons donnés, exactement"),
  deja_la: z.boolean().describe("true si c'est dans les placards ou déjà sur la liste")
});
const Repas = z.object({
  jour: z.string().describe("Jour en français, minuscules : lundi … dimanche"),
  plat: z.string().describe("Nom du plat, court"),
  temps_min: z.number().int().describe("Temps total en cuisine, minutes"),
  ingredients: z.array(Ingredient),
  etapes: z.array(z.string()).describe("3 à 6 étapes courtes")
});
const Menu = z.object({ repas: z.array(Repas) });

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "POST attendu" });
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ erreur: "non connecté" });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ erreur: "session invalide" });

  const d = req.body || {};
  // Un seul nombre de repas (décision du 02/11/2026) ; les anciens clients envoyaient diners + dejeuners.
  const nbRepas = Math.min(14, Number(d.repas) || (Number(d.diners) || 0) + (Number(d.dejeuners) || 0)), personnes = Number(d.personnes) || 2;
  if (nbRepas === 0) return res.status(400).json({ erreur: "au moins un repas" });
  const rayons = Array.isArray(d.rayons) && d.rayons.length ? d.rayons : ["Fruits et légumes", "Crèmerie", "Boucherie et poisson", "Épicerie", "Boissons", "Surgelés", "Hygiène et maison"];
  const remplacer = d.remplacer; // { jour, plat } : on ne redemande que ce plat

  const consigne = [
    `Tu prépares les repas de la semaine d'un foyer de ${personnes} personne${personnes > 1 ? "s" : ""}, en France, et la liste de courses qui va avec.`,
    remplacer
      ? `Propose UN SEUL autre plat pour ${remplacer.jour}, différent de « ${remplacer.plat} » et des autres plats du menu : ${(d.autres || []).join(", ") || "aucun"}.`
      : `Propose ${nbRepas} repas, du lundi au dimanche dans l'ordre (un par jour ; au-delà de sept, deux le même jour), sans répéter un plat ni un ingrédient principal deux jours de suite.`,
    d.envies?.length ? `Envies : ${d.envies.join(", ")}.` : "",
    d.temps ? `Un soir de semaine, ${d.temps} en cuisine au maximum.` : "",
    d.eviter ? `À éviter absolument (allergies ou dégoûts) : ${d.eviter}.` : "",
    d.placards ? `Déjà dans les placards, ne pas les mettre sur la liste (deja_la = true) : ${d.placards}.` : "",
    d.deja_liste?.length ? `Déjà sur la liste de courses (deja_la = true) : ${d.deja_liste.join(", ")}.` : "",
    `Rayons du magasin, à reprendre tels quels pour chaque ingrédient : ${rayons.join(" · ")}.`,
    "Les plats sont simples, de saison, avec des ingrédients qu'on trouve dans un supermarché français. Les quantités sont pour le nombre de personnes. Pas de sel, poivre ni huile sur la liste.",
    remplacer ? "" : "Les plats restent au nombre demandé."
  ].filter(Boolean).join("\n");

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { format: zodOutputFormat(Menu), effort: "medium" },
      system: "Tu es un cuisinier de famille, pratique et précis. Tu réponds en français.",
      messages: [{ role: "user", content: consigne }]
    });
    if (response.stop_reason === "refusal") return res.status(502).json({ erreur: "Claude n'a pas voulu répondre" });
    const menu = response.parsed_output;
    if (!menu) return res.status(502).json({ erreur: "réponse illisible" });
    return res.status(200).json(menu);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ erreur: "trop de demandes, réessaie dans une minute" });
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ erreur: "clé API Claude invalide" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ erreur: `Claude : ${e.status}` });
    return res.status(500).json({ erreur: "erreur inattendue" });
  }
}
