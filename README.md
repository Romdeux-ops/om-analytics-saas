# ⚡ OM Analytics SaaS

<p align="center">
  <strong>Plateforme d'analyse de données, d'actualités et d'immersion interactive dédiée à l'Olympique de Marseille et à la Ligue 1.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-green?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Supabase-Auth_%26_DB-emerald?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Bun-1.3-fbf0df?style=for-the-badge&logo=bun" alt="Bun" />
</p>

---

## 🎯 Vision & Objectifs du Projet

**OM Analytics SaaS** est né de la volonté de concevoir une plateforme moderne, rapide et centralisée pour les supporters, observateurs et analystes du football marseillais.

Les objectifs clés sont :

1. **Centralisation de la Data Sportive** : Suivi en direct du calendrier des matchs, du classement de Ligue 1 avec indicateurs de forme, et consultation de l'effectif complet avec statistiques des joueurs.
2. **Agrégation Automatisée de l'Actualité** : Système de curation de presse et d'articles avec scoring de pertinence et flux continu sans bruit.
3. **Espace Communautaire (Fan Zone)** : Salons d'échange et sondages interactifs en temps réel pour fédérer la communauté olympienne.
4. **Expérience UI/UX Haute Performance** : Interface inspirée des codes graphiques de l'OM (bleu ciel, néo-futurisme, bento grid, mode sombre ultra-fluide).
5. **Prédictions & Simulation Tactique** : Offrir des outils prédictifs basés sur les données réelles et la modélisation statistique.

---

## ⏳ Zoom sur la Simulation de Match *(À venir)*

> 🔬 **Note de R&D :**  
> Le module de **simulation et de prédiction de match** est actuellement en phase de recherche active.  
> 
> Afin de proposer des prédictions véritablement pertinentes et crédibles (et non de simples jets de dés aléatoires), plusieurs approches statistiques et algorithmiques sont actuellement benchmarkées :
> - **Modèles prédictifs probabilistes** : Distribution de Poisson bivariée, calculs de dangerosité basés sur les Expected Goals ($xG$).
> - **Dynamique d'équipe & forme contextuelle** : Intégration de la forme récente des joueurs, des compositions probables, du facteur domicile/extérieur et de l'historique des confrontations.
> - **Moteur d'événements minute par minute** : Génération d'une chronologie réaliste de match (occasions, cartons, temps forts).
>
> 🚀 *Ce moteur prédictif enrichi sera déployé prochainement.*

---

## ✨ Fonctionnalités Actuelles

- 📊 **Tableau de Bord Live** : Synthèse instantanée du prochain match, de la forme de l'équipe et des dernières actualités.
- 📅 **Calendrier & Résultats** : Historique des rencontres, scores finaux et calendrier des prochaines journées de championnat.
- 🏆 **Classement Dynamique** : Vue complète de la Ligue 1 (points, différence de buts, séries de victoires/nuls/défaites, places européennes et relégation).
- 👥 **Effectif & Statistiques Joueurs** : Fiches détaillées par poste (Gardiens, Défenseurs, Milieux, Attaquants).
- 📰 **Flux Presse Intelligent** : Agrégation quotidienne d'actualités avec filtrage et notation de qualité.
- 💬 **Fan Zone** : Espaces de discussion et sondages avec votes en direct.
- 🔐 **Authentification Sécurisée** : Gestion des comptes utilisateurs et profils via Supabase Auth.

---

## 🏗️ Architecture Technique (Monorepo)

Le projet est structuré sous forme de monorepo géré avec **Bun Workspaces** :

```text
om-analytics-saas/
├── frontend/                   # Application Next.js 15 (App Router, React 19, Tailwind CSS)
│   ├── src/
│   │   ├── app/                # Routes et layouts (main, auth, welcome, simulation...)
│   │   ├── components/         # Composants UI, Bento Cards, MatchLiveInterface, FanZone...
│   │   └── lib/                # Connecteurs DB, typages, helpers UI et requêtes
├── packages/
│   ├── db/                     # Couche données partagée (Drizzle ORM, Schémas PostgreSQL)
│   │   ├── src/
│   │   │   ├── schema/         # Modèles (clubs, matches, players, fan-zone, news)
│   │   │   ├── queries/        # Requêtes SQL typées
│   │   │   └── simulator.ts    # Prototypes du moteur de simulation
│   └── football-sync/          # Scripts d'ingestion & synchronisation de données
│       ├── src/
│       │   ├── football-data.ts# Connecteur API Football-Data
│       │   ├── espn.ts         # Connecteur API ESPN
│       │   ├── news.ts         # Récupération et scoring des actualités
│       │   └── index.ts        # Script principal de synchronisation
├── Backend/                    # Companion engine Django / Python (recherches & prototypes)
├── .github/workflows/          # GitHub Actions (synchronisation quotidienne automatisée)
└── supabase/                   # Migrations et configuration locale Supabase
```

---

## 🛠️ Stack Technologique

- **Frontend** : [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Base de Données & ORM** : [PostgreSQL](https://www.postgresql.org/), [Supabase](https://supabase.com/), [Drizzle ORM](https://orm.drizzle.team/)
- **Gestionnaire de Paquets & Runtime** : [Bun](https://bun.sh/)
- **APIs & Données Externes** : Football-Data.org API, ESPN API, flux d'actualités sportives
- **Automatisation & CI/CD** : GitHub Actions (CRON de synchronisation des matchs et revues de presse)

---

## 🚀 Démarrage Rapide

### Prérequis

- [Bun](https://bun.sh/) ($\ge$ 1.3)
- [Node.js](https://nodejs.org/) ($\ge$ 20.x)
- Instance **Supabase** (locale ou cloud)
- Clé d'API gratuite sur [football-data.org](https://www.football-data.org/client/register)

### 1. Cloner le projet

```bash
git clone https://github.com/Romdeux-ops/om-analytics-saas.git
cd om-analytics-saas
```

### 2. Installer les dépendances

```bash
bun install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine (en vous basant sur `.env.example`) :

```env
# PostgreSQL & Supabase
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Synchro Football & Actualités
FOOTBALL_DATA_TOKEN=votre_cle_football_data
REVALIDATE_SECRET=votre_secret_revalidation
SITE_URL=http://localhost:3000
```

### 4. Initialiser la Base de Données

```bash
# Génération et application des schémas Drizzle
bun run db:push
```

### 5. Synchroniser les Données Football

```bash
# Récupération des équipes, classements, matchs et effectifs
bun run football:sync

# Agrégation des actualités
bun run football:sync:press
```

### 6. Lancer l'Application

```bash
bun run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponibles

| Commande | Description |
| :--- | :--- |
| `bun run dev` | Lance le serveur de développement Next.js |
| `bun run build` | Compile l'application pour la production |
| `bun run lint` | Exécute l'analyse statique du code (ESLint) |
| `bun run db:generate` | Génère les migrations Drizzle |
| `bun run db:push` | Applique le schéma Drizzle directement sur la base |
| `bun run db:studio` | Ouvre Drizzle Studio pour explorer la base de données |
| `bun run football:sync` | Synchronise les données de football (matchs, clubs, classement) |
| `bun run football:sync:press` | Synchronise et filtre les actualités de presse |

---

## 🗺️ Roadmap

- [x] Architecture Monorepo moderne (Bun, Next.js 15, Drizzle)
- [x] Synchronisation automatique du calendrier, classement et effectif
- [x] Agrégation et scoring des flux d'actualités OM
- [x] Espace Fan Zone & Sondages
- [ ] 🧪 **Finalisation de l'algorithme d'IA prédictif pour la simulation de match**
- [ ] 📈 Module d'analyses avancées des performances individuelles et collectives
- [ ] 🔔 Système de notifications live pour les jours de match

---

## 📄 Licence

Ce projet est sous licence privée / MIT — voir le fichier `LICENSE` pour plus de détails.
