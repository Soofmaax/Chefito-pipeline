# 🧠 Chefito - Système Autonome de Scraping et IA Culinaire

## 🎯 Vue d'ensemble

Chefito est un système complet qui automatise la collecte, le nettoyage et l'enrichissement de recettes de cuisine via l'IA et la génération audio. Le système est conçu pour être totalement autonome après configuration.

## 🏗️ Architecture

### Frontend (Bolt/React)
- **Dashboard principal** : Vue d'ensemble du système
- **Gestion des recettes** : CRUD complet avec filtres
- **Interface de correction** : Correction manuelle pour l'apprentissage IA
- **Monitoring audio** : Suivi de la génération audio
- **Analytics** : Métriques et performances

### Backend (PostgreSQL + Scripts)
- **Base de données** : Schéma complet avec RLS
- **Scripts de scraping** : Spoonacular API
- **IA de correction** : Nettoyage automatique
- **Génération audio** : ElevenLabs + gTTS fallback

## 📊 Workflow Complet

```
1. SCRAPING (VPS 2Go) 
   ↓ 400 recettes/jour via Spoonacular
   
2. STOCKAGE (PostgreSQL)
   ↓ recipes_raw → status: pending
   
3. CORRECTION IA (VPS XXL)
   ↓ Nettoyage + structuration
   
4. VALIDATION (recipes_clean)
   ↓ status: validated
   
5. GÉNÉRATION AUDIO (VPS XXL)
   ↓ ElevenLabs → gTTS fallback
   
6. STOCKAGE AUDIO (Cloudflare R2)
   ↓ Hash unique pour éviter doublons
   
7. APPRENTISSAGE IA
   ↓ Fine-tuning continu
```

## 🗄️ Schéma de Base de Données

### Tables principales
- `recipes_raw` : Recettes brutes scrapées
- `recipes_clean` : Recettes nettoyées et validées  
- `steps_clean` : Étapes détaillées avec métadonnées
- `steps_audio` : Fichiers audio avec hash unique
- `correction_logs` : Logs pour l'apprentissage IA
- `scraping_sessions` : Suivi des sessions de scraping

### Fonctionnalités clés
- **Hash unique** pour éviter les doublons audio
- **RLS (Row Level Security)** sur toutes les tables
- **Indexes optimisés** pour les performances
- **Métriques système** automatiques

## 🚀 Déploiement

### 1. Configuration Supabase
```bash
# Connecter à Supabase via l'interface Bolt
# Les migrations se lancent automatiquement
```

### 2. Variables d'environnement (VPS)
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# APIs externes
SPOONACULAR_API_KEY=your_spoonacular_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Stockage (optionnel)
CLOUDFLARE_R2_ENDPOINT=your_r2_endpoint
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET=chefito-audio
```

### 3. Scripts VPS (Cron Jobs)
```bash
# Scraping quotidien (22h)
0 22 * * * /usr/bin/node /path/to/spoonacular-scraper.js

# Correction IA (23h)  
0 23 * * * /usr/bin/node /path/to/ai-corrector.js

# Génération audio (1h)
0 1 * * * /usr/bin/node /path/to/audio-generator.js
```

## 🧠 IA et Apprentissage

### Correction automatique
- **NLP local** pour nettoyer les recettes
- **Classification automatique** des actions culinaires
- **Estimation des temps** de préparation/cuisson
- **Génération de conseils** et avertissements

### Apprentissage continu
- **Logs de correction** pour dataset d'entraînement
- **Fine-tuning** sur TinyLlama ou Phi-2
- **Feedback utilisateur** intégré
- **Amélioration progressive** de la précision

## 🔊 Système Audio

### Génération intelligente
- **Hash unique** par instruction (évite doublons)
- **ElevenLabs prioritaire** (haute qualité)
- **gTTS fallback** (quota dépassé)
- **Stockage optimisé** (Cloudflare R2)

### Réutilisation
- Instructions identiques = même fichier audio
- Économie de quota et stockage
- Performance optimale

## 📈 Métriques et Monitoring

### Dashboard temps réel
- Recettes scrapées/jour
- Taux de correction automatique  
- Audio générés
- Statut des services

### Analytics avancées
- Performance de l'IA
- Utilisation des quotas
- Erreurs et optimisations
- ROI du système

## 🎮 Mode Cuisine (Futur)

### Interface vocale
- Lecture automatique des étapes
- Commandes vocales ("suivant", "répète")
- Adaptation en temps réel
- Gestion des erreurs culinaires

## 💡 Optimisations

### Performance
- **Indexes optimisés** pour les requêtes fréquentes
- **Cache intelligent** pour les recettes populaires
- **CDN** pour les fichiers audio
- **Pagination** pour les grandes listes

### Coûts
- **Réutilisation audio** via hash
- **Fallback gTTS** pour économiser ElevenLabs
- **Stockage R2** moins cher que S3
- **VPS** au lieu de serverless pour l'IA

## 🔧 Maintenance

### Automatisée
- Nettoyage automatique des fichiers temporaires
- Rotation des logs
- Sauvegarde base de données
- Monitoring des quotas API

### Manuelle (occasionnelle)
- Validation des corrections IA
- Ajustement des paramètres
- Mise à jour des modèles
- Optimisation des performances

## 📋 TODO / Roadmap

### Phase 1 (Actuelle)
- [x] Interface complète
- [x] Base de données
- [x] Scripts de scraping
- [x] Correction IA basique
- [x] Génération audio

### Phase 2 (1 mois)
- [ ] Fine-tuning modèle local
- [ ] Interface vocale
- [ ] Analytics avancées
- [ ] Optimisations performance

### Phase 3 (3 mois)
- [ ] IA conversationnelle
- [ ] Recommandations personnalisées
- [ ] API publique
- [ ] Mobile app

## 🆘 Support

### Logs système
- Tous les scripts loggent dans `/var/log/chefito/`
- Dashboard affiche les erreurs en temps réel
- Alertes automatiques par email

### Debugging
- Interface de debug intégrée
- Rejeu des corrections IA
- Test des APIs externes
- Validation des données

---

**🎉 Système prêt pour la production !**

Tout est configuré pour fonctionner de manière autonome. Il suffit de :
1. Connecter Supabase
2. Configurer les VPS avec les scripts
3. Lancer le premier scraping
4. Surveiller le dashboard

L'IA apprendra de vos corrections et deviendra de plus en plus autonome ! 🚀