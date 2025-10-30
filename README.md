# Hurghada Dream – Mini site interne (sans build)
Un mini site interne (Devis, Activités, Disponibilités, Tarifs) pour les bureaux de l'agence **Hurghada Dream**. Aucune installation nécessaire.

## Démarrage
1. Décompressez le ZIP.
2. Ouvrez `index.html` dans un navigateur moderne (Chrome/Edge/Firefox).
3. Vos données sont stockées **localement** (localStorage du navigateur).

## Thèmes
Trois thèmes inclus : `ocean` (par défaut), `sunset`, `emerald`.
- Pour changer, ouvrez `index.html` et remplacez `<html lang="fr" data-theme="ocean">` par `sunset` ou `emerald`.
- Vous pouvez aussi aller dans **Paramètres** (bouton en haut à droite) et choisir le thème.

## Personnalisation rapide
- Modifiez `theme.css` pour ajuster les couleurs (`--brand-*`) et le rayon des angles (`--radius`).
- Le nom de l'agence, téléphone, adresse et devise par défaut se changent dans **Paramètres** (et sont mémorisés).

## Impression & export
- Dans l'onglet **Devis**, utilisez **Imprimer le devis** pour générer un PDF via la boîte de dialogue d'impression du navigateur.
- Utilisez **Copier en texte** pour coller le devis dans WhatsApp/Email.

## Limitations
- Pas d’authentification ni de sauvegarde serveur (tout reste dans le navigateur).
- Si vous videz le stockage du navigateur, les données seront perdues.

## Besoin d'une version pro ?
Je peux fournir une version avec login, export PDF stylé, multi-utilisateurs, base de données et déploiement (ex : Netlify/Vercel/Serveur interne).
