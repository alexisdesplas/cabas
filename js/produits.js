// Catalogue de produits courants, avec leur rayon : sert aux suggestions du champ d'ajout.
// La recherche ignore accents et casse ; les articles déjà connus du foyer passent devant.
const R = { FL: "Fruits et légumes", CR: "Crèmerie", BP: "Boucherie et poisson", EP: "Épicerie", BO: "Boissons", SU: "Surgelés", HM: "Hygiène et maison" };
const CATALOGUE = [
  ["Pommes", R.FL], ["Poires", R.FL], ["Bananes", R.FL], ["Oranges", R.FL], ["Clémentines", R.FL], ["Citrons", R.FL], ["Citron vert", R.FL], ["Fraises", R.FL], ["Framboises", R.FL], ["Raisin", R.FL], ["Kiwis", R.FL], ["Avocats", R.FL], ["Mangue", R.FL], ["Ananas", R.FL], ["Pêches", R.FL], ["Abricots", R.FL], ["Cerises", R.FL], ["Melon", R.FL], ["Pastèque", R.FL],
  ["Tomates", R.FL], ["Tomates cerises", R.FL], ["Courgettes", R.FL], ["Aubergines", R.FL], ["Poivrons", R.FL], ["Concombre", R.FL], ["Carottes", R.FL], ["Pommes de terre", R.FL], ["Patates douces", R.FL], ["Oignons", R.FL], ["Oignons rouges", R.FL], ["Échalotes", R.FL], ["Ail", R.FL], ["Poireaux", R.FL], ["Brocoli", R.FL], ["Chou-fleur", R.FL], ["Chou kale", R.FL], ["Épinards", R.FL], ["Salade verte", R.FL], ["Roquette", R.FL], ["Mâche", R.FL], ["Champignons", R.FL], ["Haricots verts", R.FL], ["Petits pois", R.FL], ["Fenouil", R.FL], ["Céleri", R.FL], ["Betteraves", R.FL], ["Radis", R.FL], ["Navets", R.FL], ["Potimarron", R.FL], ["Butternut", R.FL], ["Gingembre", R.FL], ["Citronnelle", R.FL],
  ["Persil", R.FL], ["Coriandre fraîche", R.FL], ["Basilic", R.FL], ["Menthe", R.FL], ["Ciboulette", R.FL], ["Thym", R.FL], ["Romarin", R.FL],
  ["Lait", R.CR], ["Lait d'avoine", R.CR], ["Lait d'amande", R.CR], ["Beurre doux", R.CR], ["Beurre demi-sel", R.CR], ["Crème fraîche", R.CR], ["Crème liquide", R.CR], ["Yaourts nature", R.CR], ["Yaourts grecs", R.CR], ["Skyr", R.CR], ["Fromage blanc", R.CR], ["Petits-suisses", R.CR], ["Œufs", R.CR], ["Comté", R.CR], ["Emmental râpé", R.CR], ["Gruyère", R.CR], ["Parmesan", R.CR], ["Mozzarella", R.CR], ["Feta", R.CR], ["Chèvre", R.CR], ["Camembert", R.CR], ["Brie", R.CR], ["Roquefort", R.CR], ["Ricotta", R.CR], ["Mascarpone", R.CR], ["Tofu", R.CR], ["Pâte feuilletée", R.CR], ["Pâte brisée", R.CR], ["Pâte à pizza", R.CR],
  ["Poulet", R.BP], ["Blancs de poulet", R.BP], ["Cuisses de poulet", R.BP], ["Escalopes de dinde", R.BP], ["Steak haché", R.BP], ["Bœuf à bourguignon", R.BP], ["Côtes de porc", R.BP], ["Filet mignon", R.BP], ["Lardons", R.BP], ["Jambon blanc", R.BP], ["Jambon cru", R.BP], ["Chorizo", R.BP], ["Saucisses", R.BP], ["Merguez", R.BP], ["Saumon", R.BP], ["Saumon fumé", R.BP], ["Cabillaud", R.BP], ["Crevettes", R.BP], ["Thon frais", R.BP], ["Truite", R.BP], ["Moules", R.BP],
  ["Pâtes", R.EP], ["Pâtes complètes", R.EP], ["Spaghetti", R.EP], ["Riz", R.EP], ["Riz basmati", R.EP], ["Riz à risotto", R.EP], ["Quinoa", R.EP], ["Boulgour", R.EP], ["Semoule", R.EP], ["Lentilles", R.EP], ["Lentilles corail", R.EP], ["Pois chiches en boîte", R.EP], ["Haricots rouges en boîte", R.EP], ["Haricots noirs en boîte", R.EP], ["Maïs en boîte", R.EP], ["Tomates pelées", R.EP], ["Coulis de tomate", R.EP], ["Concentré de tomate", R.EP], ["Lait de coco", R.EP], ["Thon en boîte", R.EP], ["Sardines", R.EP], ["Farine", R.EP], ["Sucre", R.EP], ["Sucre glace", R.EP], ["Levure", R.EP], ["Chocolat noir", R.EP], ["Chocolat au lait", R.EP], ["Pépites de chocolat", R.EP], ["Cacao", R.EP], ["Miel", R.EP], ["Confiture", R.EP], ["Pâte à tartiner", R.EP], ["Céréales", R.EP], ["Flocons d'avoine", R.EP], ["Muesli", R.EP], ["Biscottes", R.EP], ["Pain de mie", R.EP], ["Pain", R.EP], ["Tortillas", R.EP], ["Huile d'olive", R.EP], ["Huile de tournesol", R.EP], ["Vinaigre balsamique", R.EP], ["Moutarde", R.EP], ["Mayonnaise", R.EP], ["Ketchup", R.EP], ["Sauce soja", R.EP], ["Pesto", R.EP], ["Sel", R.EP], ["Poivre", R.EP], ["Curry en poudre", R.EP], ["Cumin", R.EP], ["Paprika", R.EP], ["Herbes de Provence", R.EP], ["Bouillon cube", R.EP], ["Noix", R.EP], ["Amandes", R.EP], ["Noix de cajou", R.EP], ["Cacahuètes", R.EP], ["Graines de courge", R.EP], ["Chips", R.EP], ["Biscuits", R.EP], ["Gâteaux apéro", R.EP], ["Compotes", R.EP], ["Café", R.EP], ["Thé", R.EP], ["Tisane", R.EP],
  ["Eau", R.BO], ["Eau gazeuse", R.BO], ["Jus d'orange", R.BO], ["Jus de pomme", R.BO], ["Limonade", R.BO], ["Coca", R.BO], ["Bière", R.BO], ["Vin rouge", R.BO], ["Vin blanc", R.BO], ["Cidre", R.BO], ["Sirop", R.BO],
  ["Glace", R.SU], ["Frites surgelées", R.SU], ["Épinards surgelés", R.SU], ["Petits pois surgelés", R.SU], ["Poisson pané", R.SU], ["Pizza surgelée", R.SU], ["Fruits rouges surgelés", R.SU], ["Glaçons", R.SU],
  ["Papier toilette", R.HM], ["Essuie-tout", R.HM], ["Mouchoirs", R.HM], ["Lessive", R.HM], ["Adoucissant", R.HM], ["Liquide vaisselle", R.HM], ["Tablettes lave-vaisselle", R.HM], ["Éponges", R.HM], ["Sacs poubelle", R.HM], ["Produit multi-surfaces", R.HM], ["Javel", R.HM], ["Savon", R.HM], ["Gel douche", R.HM], ["Shampoing", R.HM], ["Dentifrice", R.HM], ["Brosse à dents", R.HM], ["Déodorant", R.HM], ["Coton", R.HM], ["Rasoirs", R.HM], ["Serviettes hygiéniques", R.HM], ["Tampons", R.HM], ["Papier aluminium", R.HM], ["Film alimentaire", R.HM], ["Papier cuisson", R.HM], ["Piles", R.HM], ["Ampoules", R.HM], ["Croquettes chat", R.HM], ["Croquettes chien", R.HM], ["Litière", R.HM]
];

export const norm = s => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

// « 2 avocats », « 500 g farine », « 1 L de lait », « lait 1 L », « avocats x2 » → { nom, quantite }.
const UNITES = "kg|g|l|cl|ml|boites?|boîtes?|bouteilles?|paquets?|sachets?|bottes?|tranches?|pots?|barquettes?|briques?|tablettes?|pieces?|pièces?|rouleaux?|packs?|lots?|x";
const AVANT = new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNITES})?\\s+(?:de\\s+|d')?(.+)$`, "i");
const APRES = new RegExp(`^(.+?)\\s+(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(${UNITES})?$`, "i");
const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);
export function analyser(texte) {
  const t = texte.trim().replace(/\s+/g, " ");
  let m = t.match(AVANT);
  if (m && m[3].length > 1) return { nom: majuscule(m[3]), quantite: `${m[1].replace(".", ",")}${m[2] ? " " + m[2].toLowerCase().replace(/^x$/, "") : ""}`.trim() };
  m = t.match(APRES);
  if (m && m[1].length > 1) return { nom: majuscule(m[1]), quantite: `${m[2].replace(".", ",")}${m[3] ? " " + m[3].toLowerCase().replace(/^x$/, "") : ""}`.trim() };
  return { nom: majuscule(t), quantite: "" };
}

// Suggestions pour un début de saisie : d'abord ce que le foyer connaît déjà (connus = [{ nom, rayon }]), puis le catalogue.
export function suggerer(texte, connus = [], max = 6) {
  const q = norm(analyser(texte).nom);
  if (q.length < 2) return [];
  const vus = new Set(), out = [];
  const pousser = (nom, rayon, origine) => { const k = norm(nom); if (vus.has(k)) return; vus.add(k); out.push({ nom, rayon, origine }); };
  const score = nom => { const n = norm(nom); return n === q ? 0 : n.startsWith(q) ? 1 : n.split(" ").some(w => w.startsWith(q)) ? 2 : n.includes(q) ? 3 : 9; };
  const tri = (a, b) => score(a.nom) - score(b.nom) || a.nom.localeCompare(b.nom, "fr");
  [...connus].filter(c => score(c.nom) < 9).sort(tri).forEach(c => pousser(c.nom, c.rayon, "connu"));
  CATALOGUE.map(([nom, rayon]) => ({ nom, rayon })).filter(c => score(c.nom) < 9).sort(tri).forEach(c => pousser(c.nom, c.rayon, "catalogue"));
  return out.slice(0, max);
}

// Le produit du catalogue qui porte exactement ce nom (accents et casse ignorés), sinon null.
export const produitExact = nom => { const n = norm(nom); const hit = CATALOGUE.find(([c]) => norm(c) === n); return hit ? { nom: hit[0], rayon: hit[1] } : null; };
export const rayonDuCatalogue = nom => { const n = norm(nom); const hit = CATALOGUE.find(([c]) => norm(c) === n) || CATALOGUE.find(([c]) => n.includes(norm(c)) || norm(c).includes(n)); return hit ? hit[1] : null; };
