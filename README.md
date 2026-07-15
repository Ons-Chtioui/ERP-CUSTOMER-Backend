<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">API backend de l'ERP — gestion de stock, production (BOM), commandes et commercial.</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" alt="NestJS 10" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-orange" alt="TypeORM" />
</p>

## Description

API backend d'un **ERP web sur mesure**, développée avec [NestJS](https://nestjs.com/).
Le système couvre la gestion complète d'une activité de production/négoce :
stock multi-entrepôts, composants et produits finis avec nomenclature (BOM),
commandes, gestion commerciale (devis/factures/avoirs/bons de livraison),
utilisateurs & rôles, dashboard, emails/notifications et génération de PDF.

## Modules fonctionnels

| # | Module | Contenu |
|---|--------|---------|
| 1 | **Authentification & Utilisateurs** | Connexion JWT, rôles (Super Admin, Admin Société, Responsable Stock, Responsable Commercial, Comptable, Opérateur), permissions granulaires, historique de connexions, reset de mot de passe |
| 2 | **Entrepôts** | Multi-entrepôts, stock consolidé, transferts inter-entrepôts, inventaire, alertes stock minimum |
| 3 | **Composants** | CRUD, références uniques, catégories, fournisseurs, historique entrées/sorties, codes-barres/QR |
| 4 | **Produits finis & Nomenclature (BOM)** | Définition des composants requis, calcul automatique du stock produit disponible, décrémentation automatique à la validation de commande, coût de revient, variantes |
| 5 | **Commandes** | Workflow de validation (Brouillon → Confirmée → En préparation → Expédié → Livrée / Annulée), déduction stock automatique, historique, PDF |
| 6 | **Commercial** | Devis (avec conversion en facture), factures (TVA, numérotation auto, facturation partielle), avoirs (avec retour de stock), bons de livraison |
| 7 | **Dashboard & Analytics** | Chiffre d'affaires, produits les plus vendus, état du stock, ruptures, performance par entrepôt, KPIs, export Excel/PDF |
| 8 | **Emails & Notifications** | Emails automatiques (devis, factures, relances, alertes stock), file d'attente (Bull/Redis), suivi temps réel (SSE), historique |
| 9 | **Génération PDF** | Factures, devis, bons de livraison, avoirs, inventaires, rapports |

## Stack technique

- **Framework :** NestJS 10 (TypeScript strict)
- **Base de données :** PostgreSQL 16 via TypeORM
- **Emails :** `@nestjs-modules/mailer` + Nodemailer (SMTP Gmail), file Bull + Redis
- **Temps réel :** Server-Sent Events (statut d'envoi d'emails)
- **Documents :** PDFKit (PDF), ExcelJS (export Excel)
- **Auth :** Passport + JWT (access token courte durée + refresh token httpOnly)

## Installation

```bash
pnpm install
```

Copier le fichier d'environnement et renseigner les variables (voir `.env.example` si présent — base de données, JWT, SMTP, Redis) :

```bash
cp .env.example .env
```

## Lancer le projet

```bash
# développement (watch mode)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

## Base de données

```bash
# peupler la base avec les rôles, permissions et données de départ
pnpm run seed

# resynchroniser les permissions après ajout de nouvelles routes protégées
pnpm run permissions:sync
```

## Qualité & vérifications

```bash
# vérification TypeScript (sans compiler) — à lancer avant tout commit
pnpm run typecheck

# lint
pnpm run lint

# tests unitaires
pnpm run test

# tests e2e
pnpm run test:e2e

# couverture de tests
pnpm run test:cov
```

Un hook **pre-commit** (Husky) exécute `typecheck` automatiquement avant
chaque commit, et le même contrôle tourne en CI (GitHub Actions) sur chaque
push/pull request — voir `.github/workflows/ci.yml`.

## Architecture — points notables

- **Verrous pessimistes** sur les opérations de stock pour garantir l'atomicité des déductions concurrentes
- **Machines à états** pour le cycle de vie des commandes et des documents commerciaux
- **RBAC/ABAC hybride** : rôles + permissions granulaires par action
- **EmailsService** centralise tout l'envoi d'emails (log, file d'attente, SSE) — les autres modules (Documents, Auth) délèguent à ce service plutôt que d'appeler `MailerService` directement

## Ressources NestJS

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation TypeORM](https://typeorm.io)