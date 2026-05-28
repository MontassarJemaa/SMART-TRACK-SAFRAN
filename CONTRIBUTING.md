# Guide de Contribution

## 🎯 Objectif
Ce projet suit les **meilleures pratiques** de développement pour maintenir un code **propre, maintenable et scalable**.

## 📋 Avant de Commencer

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
   # Renseigne SUPABASE_URL et SUPABASE_ANON_KEY
   ```

## 🔀 Workflow Git

### Branches
- `main` - Production (protégée)
- `develop` - Intégration continue
- `feature/*` - Nouvelles fonctionnalités (ex: `feature/scanner-ui`)
- `bugfix/*` - Corrections (ex: `bugfix/rfid-connection`)
- `docs/*` - Documentation (ex: `docs/api`)

### Créer une Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-fonctionnalite
```

## 📝 Commits Conventionnels

Format: `<type>(<scope>): <subject>`

### Types
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, pas de changement logique
- `refactor:` Refactorisation du code
- `perf:` Amélioration des performances
- `test:` Ajout/modification de tests
- `chore:` Dépendances, configuration

### Exemples
```bash
git commit -m "feat(scanner): ajouter simulation RFID"
git commit -m "fix(auth): corriger timeout session"
git commit -m "docs(README): mettre à jour commandes"
git commit -m "refactor(store): simplifier outillageSlice"
```

## ✅ Checklist Avant le Push

- [ ] Code formaté (`npm run lint`)
- [ ] Pas de `console.log()` en prod
- [ ] Types TypeScript corrects
- [ ] Nommage cohérent avec conventions
- [ ] Commit message clair
- [ ] Tests passants
- [ ] Pas de secrets en code

## 📦 Structure du Code

### Composants
```tsx
import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  onPress?: () => void;
}

/**
 * Composant MyComponent
 * Description de ce que fait le composant
 */
export const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};
```

### Services
```ts
import { supabase } from './supabaseClient';

/**
 * Récupère tous les outillages
 */
export const getAllOutillages = async () => {
  const { data, error } = await supabase
    .from('outillages')
    .select('*');
  
  if (error) throw error;
  return data;
};
```

### Hooks
```ts
import { useDispatch, useSelector } from 'react-redux';
import { setOutillages } from '../store/outillageSlice';

export const useOutillages = () => {
  const dispatch = useDispatch();
  const outillages = useSelector(state => state.outillage.items);

  const fetchOutillages = async () => {
    // Logique
  };

  return { outillages, fetchOutillages };
};
```

## 🧪 Tester Localement

```bash
# Mode développement avec rechargement
npm run dev

# Tests Supabase
npm run test:supabase

# Seed base de données
npm run seed:supabase

# Linter
npm run lint
```

## 🔄 Pull Request

1. **Push ta branche**
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

2. **Crée une PR sur GitHub**
   - Titre clair et descriptif
   - Description des changements
   - Relie les issues si applicable
   - Mentionne les personnes concernées

3. **Template PR Exemple**
   ```markdown
   ## Description
   Brève description des changements

   ## Type de changement
   - [ ] Nouvelle fonctionnalité
   - [ ] Correction de bug
   - [ ] Refactorisation

   ## Changes
   - Changement 1
   - Changement 2

   ## Test
   - [ ] Testé en local
   - [ ] Pas de régressions

   Fixes #123
   ```

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Architecture du Projet](./ARCHITECTURE.md)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

## ❓ Questions?

Ouvre une issue ou contacte l'équipe dev.

---

**Merci de contribuer! 🎉**
