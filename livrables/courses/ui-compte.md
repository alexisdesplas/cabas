# UI — Courses · C · Compte et foyer   ·   Statut · Brouillon

**Date** · 31/10/2026 — **Régime** · système — **Mode** · 3 (écrans Compte de Fluide, passés en Indigo LT) + 2
**Figma** · https://www.figma.com/design/QZ94FGPStTONZYIJcXnyHX/%2FPerso — page `Courses · App`, section `C · Compte et foyer` (288:801)
**Système** · Hardwood, mode « Indigo LT » — librairie abonnée
**Largeurs produites** · 390

## Parcours
Se connecter ou créer son compte (prénom, e-mail, mot de passe) → adresse à valider par e-mail → créer le foyer (code à partager) ou le rejoindre avec le code → foyer à deux. Depuis l'onglet Foyer : membres, ordre des rayons (drag and drop), compte, se déconnecter, quitter le foyer.

## Écrans produits
| Écran | États composés | Capturé |
|---|---|---|
| Compte — se connecter (288:802) | e-mail, mot de passe, mot de passe oublié, bascule vers créer | oui |
| Compte — identifiants incorrects (291:2321) | erreur sous le mot de passe | oui |
| Compte — mot de passe oublié, e-mail envoyé (291:2412) | toast | oui |
| Compte — nouveau mot de passe (291:2447) | depuis le lien reçu | oui |
| Compte — créer mon compte (288:960) | prénom, e-mail, mot de passe | oui |
| Compte — compte déjà existant (291:2364) | erreur sous l'e-mail | oui |
| Compte — adresse à valider (291:2496) | e-mail de confirmation Supabase | oui |
| Foyer — créer ou rejoindre (288:1097) | deux cartes, champ code | oui |
| Foyer — code invalide ou expiré (291:2537) | erreur sous le code | oui |
| Foyer — en attente de l'autre (288:1236) | code d'invitation en grand, « Partager le code », 1 membre | oui |
| Foyer — à deux (288:1475) | membres, rayons du magasin, compte | oui |
| Foyer — ordre des rayons (291:2657) | liste avec poignée de glisser (drag and drop, demande d'Alexis du 31/10/2026) | oui |
| Foyer — quitter le foyer ? (291:2577) | feuille | oui |
| Foyer — se déconnecter ? (288:1708) | feuille | oui |

## Composants
| Composant | Source |
|---|---|
| En-tête de compte, Lien de bascule, Carte compte, En-tête de feuille, Feuille et voile, Toast | propositions Fluide, réutilisées telles quelles (mode LT forcé) |
| Mobile Navigation Bar, Text Field (dont State=error), Button primary / secondary / ghost | Hardwood |
| Ligne de membre (288:794) | **proposition locale** : initiales, nom, détail. L'Avatar Hardwood ouvre un menu de compte (chrome), pas adapté |
| House, DotsSixVertical (poignée) | Phosphor |

## Contenu utilisé
| Zone | Contenu posé | Source |
|---|---|---|
| Prénoms | Alexis · « Elle » (initiales « ?? ») | prénom de la copine d'Alexis : à demander |
| E-mail | alexis@exemple.fr | exemple repris de Fluide |
| Code d'invitation | 7KQ-4MZ | format proposé : 6 caractères sans O/0/I/1, valable 7 jours |
| Rayons | Fruits et légumes · Crèmerie · Boucherie et poisson · Épicerie · Boissons · Surgelés · Hygiène et maison | contenu à fournir (ordre de votre magasin) |

## Écarts constatés
| Écart | Où | Ce qu'on fait |
|---|---|---|
| La Carte compte Fluide porte « Synchroniser » et « Se déconnecter » : le « Se déconnecter » que j'avais ajouté dessous faisait doublon | écrans Foyer | retiré le 31/10/2026 sur remarque d'Alexis |
| Foyer limité à 2 personnes ? « Inviter quelqu'un d'autre » est présent | 288:1475 | à trancher : un foyer peut-il avoir plus de 2 membres ? |

## Questions ouvertes
- Prénom de ta copine.
- Plus de 2 personnes dans un foyer, ou non ?
- « Synchroniser » sur la Carte compte : utile avec le temps réel Supabase, ou à retirer ?

## Contrôle anti-patterns
Aucun lorem ; une seule famille d'accent ; états d'erreur portés par le composant Text Field (State=error), pas redessinés.
