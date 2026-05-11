# Guide de Déploiement Production EXCELIOT

Ce guide détaille les étapes pour mettre en ligne la plateforme EXCELIOT.

## 1. Architecture de Production
*   **Frontend (Next.js)** : Déployé sur **Vercel** pour une performance optimale et un edge caching.
*   **Backend (API & Workers)** : Déployé sur un serveur Linux (VPS) via **Docker Compose**.
*   **Base de Données** : **Supabase** (PostgreSQL + Auth).
*   **File d'attente (Task Queue)** : **Redis**.

---

## 2. Déploiement Frontend (Vercel)
1.  Connectez votre dépôt GitHub à Vercel.
2.  Configurez les variables d'environnement suivantes dans le dashboard Vercel :
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
3.  Vercel détectera automatiquement le projet dans `apps/web`.

---

## 3. Déploiement Infrastructure (Serveur/Docker)
Sur votre serveur (Ubuntu 22.04 recommandé) :

### Prérequis
```bash
sudo apt update && sudo apt install docker.io docker-compose -y
```

### Installation
1.  Clonez le dépôt.
2.  Créez les fichiers `.env` dans `apps/api` et `apps/workers` avec vos clés Supabase et Gemini.
3.  Lancez l'infrastructure :
```bash
cd infra
docker-compose up -d --build
```

---

## 4. Maintenance & Monitoring
*   **Logs des Scrapers** : Consultables dans la table `scraping_logs` de Supabase.
*   **Dashboard Celery** : (Optionnel) Installez Flower pour monitorer les tâches en temps réel.
*   **Mise à jour des sources** : Ajoutez simplement de nouvelles sources dans la table `sources`, elles seront automatiquement prises en compte au prochain cycle de scraping.

---

## 5. Automatisation (Cron)
Le `celery-beat` est configuré pour lancer le scraping toutes les 6 heures par défaut. Vous pouvez ajuster cette fréquence dans `celery_app.py`.

---

### Commandes Utiles
*   **Forcer un scraping complet** : 
    `docker-compose exec worker python -c "from tasks.scrape_tasks import run_all_scrapers_task; run_all_scrapers_task()"`
*   **Vérifier les erreurs NLP** :
    `docker-compose logs -f worker`
