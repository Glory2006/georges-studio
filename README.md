# Georges Studio

Application front-end pour le studio photo Georges Studio. Elle permet de présenter les prestations, découvrir les catégories de shooting, visualiser des photos, puis réserver une séance via un calendrier interactif et un formulaire de contact.

## 🎯 Objectif du projet

Ce projet est une interface moderne et responsive destinée à :

- présenter les services du studio,
- afficher un catalogue visuel par catégorie,
- afficher les disponibilités et les créneaux réservés,
- permettre à un client de choisir une date et une heure,
- envoyer le client vers WhatsApp pour confirmer sa demande,
- fonctionner avec une API backend existante ou avec des données de secours si l’API est indisponible.

## ✨ Fonctionnalités

- page d’accueil avec mise en avant du studio et des catégories,
- galerie de photos par type de prestation,
- vues détaillées de chaque catégorie,
- carousel d’images avec rotation automatique,
- calendrier mensuel pour sélectionner une date,
- gestion des créneaux : disponible / passé / en attente / réservé,
- formulaire de réservation avec validation des champs,
- message pré-rempli pour WhatsApp,
- fallback sur des données mockées si le backend est inaccessible.

## 🧩 Stack technique

- React 19
- TypeScript
- Vite
- CSS personnalisé

## 📁 Structure du projet

```text
.
├── public/
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── config.ts
│   ├── FRONTEND_INTEGRATION_GUIDE.md
│   ├── index.css
│   ├── main.tsx
│   └── lib/
│       └── availability.js
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## ⚙️ Configuration

Le fichier principal de configuration est :

- `src/config.ts`

Il contient :

- le nom du studio,
- l’URL de l’API backend,
- le numéro WhatsApp,
- la fonction de génération du message WhatsApp.

Par défaut, l’URL est :

```ts
http://localhost:3000/api
```

Pour la personnaliser, vous pouvez définir une variable d’environnement :

```bash
VITE_API_URL=http://localhost:3000/api
```

## 🚀 Installation

1. Installer les dépendances :

```bash
npm install
```

2. Lancer le projet en mode développement :

```bash
npm run dev
```

3. Ouvrir l’application dans le navigateur :

```text
http://localhost:5173
```

## 🏗️ Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 🔌 Intégration API backend

L’application attend une API exposant des endpoints de type :

- `GET /api/type-photos`
- `GET /api/photos`
- `GET /api/photos/par-categorie/:slug`
- `GET /api/config/studio`
- `GET /api/disponibilites`

Si les appels échouent, la UI bascule automatiquement vers des données de démonstration pour continuer le fonctionnement sans backend.

## 📝 Notes importantes

- Les messages WhatsApp sont préparés automatiquement selon la catégorie sélectionnée.
- Les créneaux sont calculés selon les heures d’ouverture du studio.
- Les dates passées et les réservations non disponibles sont marquées et désactivées.
- Le projet est prêt pour une intégration avec un backend réel, tout en restant fonctionnel en mode mock.

## 👤 Auteur / contexte

Projet front-end de présentation et de réservation pour Georges Studio, conçu pour le pilotage de séances photo et la gestion visuelle des prestations.
