# Architecture du Projet SMART-TRACK-SAFRAN

## 📁 Structure des Dossiers

```
src/
├── app/                           # Routage Expo Router
│   ├── (auth)/                    # Groupe d'authentification
│   │   └── username.tsx
│   ├── (main)/                    # Groupe des écrans principaux
│   │   ├── _layout.tsx
│   │   ├── menu.tsx
│   │   ├── scanner.tsx
│   │   ├── scan-libre.tsx
│   │   ├── projets.tsx
│   │   ├── projet-detail.tsx
│   │   ├── inventaire.tsx
│   │   ├── localisation.tsx
│   │   ├── recherche.tsx
│   │   ├── modifier-tag.tsx
│   │   ├── detail-outillage.tsx
│   │   ├── reglages.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx                # Layout racine
│   ├── index.tsx                  # Écran d'accueil
│   └── splash.tsx                 # Écran de démarrage
│
├── components/                    # Composants réutilisables
│   ├── ui/                        # Composants UI génériques
│   │   ├── SafranButton.tsx
│   │   ├── SafranCard.tsx
│   │   ├── SafranHeader.tsx
│   │   ├── OutillageCard.tsx
│   │   └── ...
│   ├── rfid/                      # Composants RFID
│   │   └── RFIDSimulator.ts
│   ├── BackgroundLogo.tsx
│   ├── Logo.tsx
│   └── ...
│
├── hooks/                         # Hooks personnalisés
│   ├── useAuth.ts                 # Authentification
│   ├── useRFID.ts                 # Gestion RFID
│   ├── useSafeBack.ts             # Gestion de la navigation
│   └── ...
│
├── services/                      # Services métier
│   ├── supabaseClient.ts          # Configuration Supabase
│   ├── outillageService.ts        # API outillages
│   ├── storageService.ts          # Gestion du stockage local
│   └── ...
│
├── store/                         # Redux State Management
│   ├── index.ts                   # Configuration du store
│   ├── outillageSlice.ts          # État des outillages
│   ├── projectSlice.ts            # État des projets
│   ├── rfidSlice.ts               # État RFID
│   ├── settingsSlice.ts           # État des paramètres
│   └── ...
│
├── types/                         # Types TypeScript
│   ├── index.ts                   # Types globaux
│   └── ...
│
├── utils/                         # Fonctions utilitaires
│   ├── epcUtils.ts                # Utilitaires EPC
│   ├── siteMapping.ts             # Mapping des sites
│   └── ...
│
├── constants/                     # Constantes
│   └── theme.ts                   # Thème de l'application
│
└── global.css                     # Styles globaux
```

## 📦 Modules Principaux

### `app/` - Routage
- Utilise **Expo Router** pour la navigation déclarative
- Groupes de routes `(auth)` et `(main)` pour l'organisation
- Chaque fichier `.tsx` = une route

### `components/` - UI Réutilisable
- `ui/` : Composants génériques (boutons, cartes, etc.)
- `rfid/` : Composants spécifiques aux lecteurs RFID
- Chaque composant dans son propre fichier

### `hooks/` - Logique Réutilisable
- `useAuth()` : Gestion d'authentification
- `useRFID()` : Interface RFID
- `useSafeBack()` : Navigation sécurisée

### `services/` - Intégrations Externes
- `supabaseClient` : Configuration et client Supabase
- `outillageService` : Appels API pour les outillages
- `storageService` : Cache local avec AsyncStorage

### `store/` - État Global (Redux)
- Slices Redux par domaine métier
- Structure par `outillageSlice`, `projectSlice`, etc.

### `types/` - Contrats TypeScript
- Interfaces et types partagés
- Contrats API
- Types de base du domaine

### `utils/` - Fonctions Utilitaires
- Parsers EPC (Electronic Product Code)
- Mappers et transformations

## 🔄 Flux de Données

```
UI Components (React)
    ↓
Hooks (useAuth, useRFID)
    ↓
Redux Store (State Management)
    ↓
Services (supabaseClient, outillageService)
    ↓
API / Local Storage
```

## 🗄️ Base de Données

Supabase avec migrations SQL dans `supabase/migrations/`:
- `001_initial_schema.sql` - Schéma initial
- `002_add_outillage_fields.sql` - Champs outillages
- `003_fix_scan_history_schema.sql` - Historique scans
- `004_inventory_improvements.sql` - Améliorations inventaire

## 📝 Conventions

### Nommage
- **Fichiers composants** : `PascalCase.tsx` (ex: `SafranButton.tsx`)
- **Fichiers services/utils** : `camelCase.ts` (ex: `outillageService.ts`)
- **Variables/fonctions** : `camelCase` (ex: `getUserData()`)

### Structure des Composants
```tsx
// Imports
import React from 'react';

// Types
interface Props { ... }

// Composant
export const MyComponent: React.FC<Props> = ({ ...props }) => {
  // État
  // Effets
  // Handlers
  // JSX
  return <></>;
};
```

### Structure des Services
```ts
// Imports
// Configuration
// Fonctions exportées
export const functionName = async (...) => { ... };
```

## 🚀 Démarrage du Projet

```bash
# Installation
npm install

# Configuration environment
cp .env.example .env.local

# Développement
npm run dev

# Build
npm run build

# Tests
npm run test:supabase
```

## 📚 Ressources

- [Expo Router](https://expo.github.io/router/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Supabase](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/)
