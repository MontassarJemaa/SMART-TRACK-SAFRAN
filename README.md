# 🏢 SAFRAN Smart Track

**Application mobile RFID pour le suivi des outillages SAFRAN**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![React Native](https://img.shields.io/badge/React%20Native-0.85-blue)]()
[![Expo](https://img.shields.io/badge/Expo-56-black)]()

## 📋 À Propos

SMART-TRACK-SAFRAN est une **application mobile multiplateforme** développée avec Expo et React Native pour gérer le suivi RFID des outils et outillages SAFRAN. L'application offre:

- ✅ Scanning RFID en temps réel
- ✅ Gestion des projets et outillages
- ✅ Localisation des équipements
- ✅ Historique complet des mouvements
- ✅ Synchronisation Supabase
- ✅ Interface intuitive et responsive

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**
- **Expo CLI** (optionnel)

### Installation

1. **Clone le repository**
   ```bash
   git clone https://github.com/MontassarJemaa/SMART-TRACK-SAFRAN.git
   cd SMART-TRACK-SAFRAN
   ```

2. **Installe les dépendances**
   ```bash
   npm install
   ```

3. **Configure l'environnement**
   ```bash
   cp .env.example .env.local
   ```
   Puis renseigne les variables:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Commandes

```bash
# Démarrage en développement
npm run dev

# Démarrage avec rechargement (cache cleared)
npm run dev

# Plateforme spécifique
npm run web       # Web
npm run android   # Android
npm run ios       # iOS

# Linting
npm run lint

# Tests
npm run test:supabase      # Test connexion Supabase
npm run seed:supabase      # Seed base de données
```

## 🗂️ Structure du Projet

```
SMART-TRACK-SAFRAN/
├── src/
│   ├── app/              # Routage Expo Router
│   ├── components/       # Composants réutilisables
│   ├── hooks/            # Hooks personnalisés
│   ├── services/         # Services (API, Supabase)
│   ├── store/            # Redux State Management
│   ├── types/            # Types TypeScript
│   ├── utils/            # Fonctions utilitaires
│   └── constants/        # Constantes (thème, config)
├── supabase/
│   └── migrations/       # Migrations SQL Supabase
├── scripts/
│   ├── test-supabase-connection.js
│   └── seed-supabase.js
├── assets/               # Images et ressources
├── .env.example          # Variables d'environnement
├── package.json
├── tsconfig.json
└── README.md
```

👉 Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour une documentation détaillée.

## 🔧 Configuration

### Variables d'Environnement

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Mode (development/production)
NODE_ENV=development
```

### Base de Données Supabase

Les migrations SQL sont dans `supabase/migrations/`:
- `001_initial_schema.sql` - Schéma initial
- `002_add_outillage_fields.sql` - Champs outillages
- `003_fix_scan_history_schema.sql` - Historique scans
- `004_inventory_improvements.sql` - Améliorations inventaire

Pour appliquer les migrations:
```bash
npm run test:supabase      # Vérifie la connexion
npm run seed:supabase      # Seed les données de test
```

## 🛠️ Stack Technologique

### Frontend
- **React Native** - Framework mobile
- **Expo** - Plateforme React Native
- **Expo Router** - Navigation déclarative
- **Redux Toolkit** - State management
- **TypeScript** - Typage statique

### Backend
- **Supabase** - PostgreSQL + Auth
- **Supabase Realtime** - Synchronisation temps réel

### Outils
- **ESLint** - Code quality
- **Expo CLI** - Développement & Build

## 📱 Fonctionnalités

### Authentification
- Login par username/email
- Gestion des sessions
- Persistance des credentials

### Scanner RFID
- Scanning en temps réel
- Simulation RFID pour développement
- Historique des scans

### Gestion des Outillages
- Création/modification d'outillages
- Association aux projets
- Localisation
- Tagging

### Projets
- Création de projets
- Association d'outillages
- Suivis détaillés

### Paramètres
- Personnalisation de l'application
- Gestion des préférences

## 🤝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les directives.

```bash
# Format commits
git commit -m "feat(scanner): ajouter simulation RFID"
git commit -m "fix(auth): corriger timeout session"
```

## 📄 License

Ce projet est sous la licence MIT - voir [LICENSE](./LICENSE) pour les détails.

## 👤 Auteur

**Montassar Jemaa** - [@MontassarJemaa](https://github.com/MontassarJemaa)

## 📞 Support

Pour les questions ou problèmes, ouvre une [issue](https://github.com/MontassarJemaa/SMART-TRACK-SAFRAN/issues).

---

**Fait avec ❤️ pour SAFRAN**
