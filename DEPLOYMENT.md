# 📤 Guide de Déploiement sur GitHub

## ✅ État Actuel du Projet

✓ **Git initialisé** et commits créés  
✓ **Fichiers documentés** (README, ARCHITECTURE, CONTRIBUTING)  
✓ **Remote configuré** (`origin`)  

**Commits à pousser:**
```
3992375 chore: nettoyer template Expo par défaut
0c18494 Initial commit
```

## 🔐 Configuration GitHub - Deux Méthodes

### **Méthode 1️⃣: Personal Access Token (Simple & Rapide)**

#### 1. Créer un token
1. Va sur https://github.com/settings/tokens/new
2. Remplis comme suit:
   - **Token name**: `SMART-TRACK-SAFRAN-GIT`
   - **Expiration**: `90 days`
   - **Select scopes**: Coche `repo` (pour accès complet repo)
3. Clique **Generate token**
4. **Copie le token** (tu ne le reverras qu'une fois!)

#### 2. Utiliser le token
```bash
git push -u origin main
# Username: jemaamontassar (ton username GitHub)
# Password: (colle le token généré)
```

### **Méthode 2️⃣: SSH Key (Sécurisée & Permanente)**

#### 1. Générer une clé SSH
```bash
ssh-keygen -t ed25519 -C "jemaamontassar@gmail.com"
# Appuie sur Enter pour l'emplacement par défaut
# Ajoute une passphrase (optionnel)
```

#### 2. Ajouter la clé à GitHub
```bash
# Copie ta clé publique
cat ~/.ssh/id_ed25519.pub
```
1. Va sur https://github.com/settings/ssh/new
2. Colle ta clé publique
3. Clique **Add SSH key**

#### 3. Tester la connexion
```bash
ssh -T git@github.com
```

#### 4. Pousser le code
```bash
git push -u origin main
```

---

## 🚀 Commandes Pour Pousser (Choose One)

### Si tu utilises **Méthode 1 (Token)**:
```bash
git push -u origin main
# Enter username and token when prompted
```

### Si tu utilises **Méthode 2 (SSH)**:
```bash
git push -u origin main
# Entrée SSH automatique
```

---

## ✨ Après le Push

Une fois pushé, tu auras:

1. **Repository sur GitHub** avec l'historique complet
2. **README** visible avec instructions
3. **ARCHITECTURE.md** pour la documentation structure
4. **CONTRIBUTING.md** pour les contributeurs

## 📋 Prochaines Étapes Recommandées

1. **Ajouter des Branch Protection Rules**
   - Settings > Branches > Add rule
   - Branch: `main`
   - Require pull request reviews
   - Require status checks to pass

2. **Créer une branche `develop`**
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

3. **Ajouter des GitHub Actions** (CI/CD)
   - ESLint automatique
   - Tests Supabase
   - Build checks

4. **Configurer les Secrets**
   - Settings > Secrets and variables > Actions
   - Ajouter `SUPABASE_URL` et `SUPABASE_ANON_KEY`

---

## ❓ Troubleshooting

**Erreur: "Username or token incorrect"**
→ Utilise un Personal Access Token, pas ton mot de passe GitHub

**Erreur: "SSH key permission denied"**
→ Génère une nouvelle clé SSH ou ajoute `ssh-agent` à Git

**Erreur: "Repository not found"**
→ Vérifie le nom du repository et l'accès

---

**Support**: https://docs.github.com/en/authentication
