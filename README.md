# 📚 Pati — Édition Jeunesse Guinéenne

Application mobile-first de lecture et d'écoute de livres jeunesse guinéens, multilingue (4 langues internationales + 8 langues nationales).

🔗 **Site démo** : [https://tontonmoh.github.io/syli](https://tontonmoh.github.io/syli) *(à adapter avec ton URL)*

---

## 🚀 Déploiement rapide sur GitHub Pages

### 1. Créer le repository

```bash
# Sur GitHub, crée un nouveau repo public (ex: syli)
# Puis en local :
git init
git add .
git commit -m "Initial commit: Pati app"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/syli.git
git push -u origin main
```

### 2. Activer GitHub Pages

1. Va sur ton repo GitHub → **Settings** → **Pages**
2. **Source** : sélectionne **GitHub Actions**
3. Le workflow `.github/workflows/deploy.yml` est déjà inclus → le déploiement est automatique à chaque `push`

### 3. Voir le site

Après le premier push, l'URL sera :
```
https://TON_USERNAME.github.io/syli
```

---

## 📁 Structure du projet

```
syli/
├── index.html                  # Point d'entrée
├── css/
│   └── style.css               # Styles custom
├── js/
│   ├── db.js                   # Données initiales (livres, chapitres, quiz)
│   ├── storage.js              # Couche localStorage
│   └── app.js                  # Logique applicative
├── assets/
│   ├── couvertures/            # Images de couverture (.jpg/.png)
│   └── pdfs/                   # Fichiers PDF des livres
├── .github/
│   └── workflows/
│       └── deploy.yml          # Déploiement auto GitHub Pages
└── README.md
```

---

## 📖 Ajouter tes livres finalisés

### Méthode 1 : Directement dans le code (recommandé pour la production)

1. Place tes images de couverture dans `assets/couvertures/`
2. Place tes PDFs dans `assets/pdfs/`
3. Modifie `js/db.js` :

```javascript
const DB = {
    livres: [
        {
            id: "1",
            titre: "BINTA PILOTE",
            description: "...",
            couverture_url: "assets/couvertures/binta_pilote.jpg",
            pdf_url: "assets/pdfs/binta_pilote.pdf",
            auteur: "Mohamed Doumbouya",
            couleur: "from-orange-600 to-amber-700"
        }
        // ...
    ]
};
```

4. Commit et push :
```bash
git add .
git commit -m "Ajout des livres finalisés"
git push
```

Le site se met à jour automatiquement en ~1 minute.

### Méthode 2 : Via l'interface Admin (test local)

1. Ouvre le site dans ton navigateur
2. Clique sur l'icône **⚙️ (engrenage)** en haut à droite
3. Upload une couverture et/ou un PDF par livre
4. Exporte la sauvegarde JSON pour la réimporter plus tard

> ⚠️ **Attention** : les fichiers uploadés via l'interface sont stockés dans le `localStorage` du navigateur. Ils disparaissent si tu vides le cache. Pour un déploiement permanent, utilise la Méthode 1.

---

## 🛠️ Développement local

Aucun serveur complexe n'est nécessaire. Tu peux simplement ouvrir `index.html` dans un navigateur.

Pour un serveur local léger (recommandé) :
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (npx)
npx serve .

# Avec PHP
php -S localhost:8000
```

Puis ouvre : `http://localhost:8000`

---

## 🌍 Personnaliser le nom de domaine (optionnel)

Si tu veux une URL custom (ex: `pati-guinee.org`) :

1. Achète un nom de domaine chez Namecheap, OVH, etc.
2. Dans les DNS, crée un enregistrement **CNAME** :
   - Nom : `www` ou `@`
   - Valeur : `TON_USERNAME.github.io`
3. Dans ton repo GitHub → **Settings** → **Pages** → **Custom domain**
4. Ajoute un fichier `CNAME` à la racine contenant ton domaine :
   ```
   pati-guinee.org
   ```

---

## 📝 Roadmap

- [ ] Intégrer de vrais fichiers audio (MP3) pour les 8 langues nationales
- [ ] Mode hors-ligne (Service Worker + Cache API)
- [ ] Système de comptes utilisateurs (Firebase Auth)
- [ ] Paiement mobile (Orange Money / MTN Mobile Money)
- [ ] Application Android/iOS (Capacitor / PWA)

---

## 📄 Licence

Projet développé par l'Atelier Solidaire. Tous droits réservés.
