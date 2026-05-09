# Berry X — Enterprise Fintech Platform

A production-grade fintech platform targeting the Nigerian and African market, built as a monorepo.

## Architecture

```
berry-x/
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   ├── web/          # Next.js 14 customer-facing web app
│   └── admin/        # Next.js 14 operations/admin dashboard
├── packages/
│   └── types/        # Shared TypeScript types and enums
├── infrastructure/
│   ├── docker/       # Docker Compose (dev + prod)
│   ├── nginx/        # Nginx configuration
│   ├── k8s/          # Kubernetes manifests
│   └── scripts/      # Deployment scripts
└── docs/
    ├── architecture/ # Database schema, ADRs
    ├── api/          # API documentation
    └── deployment/   # Deployment guides
```

## Core Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT + refresh tokens, 2FA (TOTP), PIN, OTP verification |
| **Wallets** | Multi-currency, double-entry ledger, daily limits by KYC tier |
| **Bill Payments** | Airtime, data, electricity (DISCOS), cable TV via VTPass |
| **Crypto Exchange** | Buy/sell BTC/ETH/USDT/USDC at live rates |
| **P2P Trading** | Peer-to-peer crypto with escrow protection |
| **Virtual Accounts** | Dedicated Monnify accounts for wallet funding |
| **KYC** | 4-tier verification (₦20K → ₦100K → ₦500K → unlimited) |
| **Provider Orchestration** | Circuit breaker, automatic failover, health monitoring |
| **Feature Flags** | Real-time feature toggles with Redis caching |
| **Notifications** | Push, email, SMS via Firebase/SendGrid/Termii |
| **Support** | Ticket system with admin assignment |
| **Analytics** | Revenue, volume, user growth charts |
| **Admin Dashboard** | Full operations panel for all platform functions |

## Tech Stack

### Backend (apps/api)
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 16 + TypeORM
- **Cache**: Redis (ioredis) + BullMQ queues
- **Auth**: Passport.js + JWT + bcrypt
- **Docs**: Swagger/OpenAPI at `/api/docs`

### Web App (apps/web)
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion
- **State**: Zustand
- **Data fetching**: TanStack Query

### Admin Dashboard (apps/admin)
- **Framework**: Next.js 14
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Auth**: Admin JWT authentication

## Provider Orchestration

The platform uses a circuit breaker pattern for payment provider reliability:

```
CLOSED → OPEN (after 5 consecutive failures)
OPEN → HALF_OPEN (after 60 seconds)
HALF_OPEN → CLOSED (on success) | OPEN (on failure)
```

Supported providers: **Paystack**, **Monnify**, **Flutterwave**, **VTPass**

## KYC Tiers

| Tier | Daily Limit | Single Transfer | Balance Cap |
|------|-------------|-----------------|-------------|
| 0 | ₦20,000 | ₦5,000 | ₦50,000 |
| 1 | ₦100,000 | ₦50,000 | ₦300,000 |
| 2 | ₦500,000 | ₦200,000 | ₦1,000,000 |
| 3 | ₦5,000,000 | ₦2,000,000 | ₦50,000,000 |

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Yarn 4+

### Development

```bash
# Start infrastructure (PostgreSQL + Redis)
yarn docker:up

# Install dependencies
yarn install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations & seeds
yarn db:migrate
yarn db:seed

# Start all services
yarn dev

# Or start individually:
yarn dev:api      # http://localhost:3001
yarn dev:web      # http://localhost:3000
yarn dev:admin    # http://localhost:3002
```

### API Documentation

Swagger UI: `http://localhost:3001/api/docs`

### Environment Variables

See [.env.example](.env.example) for all required variables.

Key variables:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — 64-byte hex secrets
- `DB_*` — PostgreSQL connection
- `REDIS_*` — Redis connection
- `PAYSTACK_SECRET_KEY` / `MONNIFY_*` / `FLUTTERWAVE_*` — Payment providers
- `VTPASS_API_KEY` — Bills provider

## Production Deployment

```bash
# Build production images
yarn docker:build

# Deploy with docker-compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

See [docs/deployment/](docs/deployment/) for Kubernetes and CI/CD setup.

## Database Schema

Full PostgreSQL DDL: [docs/architecture/database-schema.sql](docs/architecture/database-schema.sql)

Key tables: `users`, `wallets`, `transactions`, `ledger_entries`, `kyc_records`, `virtual_accounts`, `payment_providers`, `feature_flags`, `notifications`, `support_tickets`, `crypto_orders`, `p2p_orders`, `audit_logs`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` — Lint, test, build on every PR
- `deploy.yml` — Deploy to production on merge to `main`

## Security

- All passwords hashed with bcrypt (cost 12)
- BVN/NIN encrypted with AES-256
- JWT access tokens (15m) + refresh tokens (7d)
- Rate limiting: 100 req/min per IP
- Helmet.js for HTTP security headers
- CORS configured per environment

## License

Proprietary — All rights reserved © 2025 Berry X
