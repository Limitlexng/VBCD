# Berry X CodeCanyon Multi‑Tenant SaaS Overhaul (NestJS + Next.js)

This plan adapts the requested Laravel-centric roadmap to the **current Berry X monorepo architecture**:
- `apps/api` = NestJS + TypeORM
- `apps/web` and `apps/admin` = Next.js
- PostgreSQL + Redis/BullMQ

It preserves the original business goals (multi-tenant SaaS, runtime branding/config, installer simplification, optional realtime/queue stack) while mapping implementation to the existing codebase.

## 1) Tenancy Model (Additive, Backward Compatible)

- **Single database, row-level tenant scoping** via nullable `tenant_id`.
- Existing rows default to `tenant_id = NULL` and are interpreted as belonging to the **default tenant** during migration/backfill.
- Tenant resolution order per request:
  1. exact custom domain match
  2. subdomain slug match
  3. root domain fallback to default tenant

## 2) Database Changes

### New tables

1. `tenants`
   - `id uuid pk`
   - `name`, `slug unique`, `domain unique nullable`, `subdomain unique nullable`
   - `status enum(active,suspended,trial,cancelled)`
   - `plan enum(starter,pro,enterprise)`
   - `trial_ends_at timestamptz nullable`
   - `created_by uuid fk users(id)`
   - `meta jsonb`, `created_at`, `updated_at`, `deleted_at`

2. `tenant_settings`
   - `id uuid pk`
   - `tenant_id uuid fk tenants(id) on delete cascade`
   - `key text`, `value text`
   - `type enum(string,int,float,bool,json,array)`
   - `group enum(general,branding,payment,mail,features,fees,limits)`
   - `is_public boolean default false`
   - `description text nullable`
   - `updated_by uuid nullable`
   - timestamps
   - `unique(tenant_id,key)` + `index(tenant_id,group)`

3. `tenant_branding`
   - `id uuid pk`
   - `tenant_id uuid unique fk tenants(id) on delete cascade`
   - `app_name`, `logo_path`, `favicon_path`
   - `primary_color default '#7C3AED'`
   - `secondary_color default '#F59E0B'`
   - `accent_color default '#EF4444'`
   - `font_family default 'Inter'`
   - `custom_css text nullable`
   - `footer_text`, `support_email`, `support_phone`
   - timestamps

### Add `tenant_id` to scoped entities

Add nullable `tenant_id uuid` (+ index + FK) to tenant-scoped tables/entities; maintain global tables unchanged.

Special migrations:
- users: replace unique indexes with `(tenant_id,email)`, `(tenant_id,phone)`, `(tenant_id,referral_code)` and add `is_super_admin boolean default false`
- transactions: replace `unique(idempotency_key)` with `unique(tenant_id,idempotency_key)`

## 3) API Infrastructure (NestJS)

### Core services/modules

- `TenancyModule`
  - `TenantResolverService` (domain/subdomain/default lookup)
  - `TenantContextService` (request-scoped current tenant provider)
  - `TenantSettingsService` (tenant override + global fallback)
  - `TenantBrandingService`

### Request pipeline

- Global middleware `identify-tenant.middleware.ts`
  - skip installer and super-admin routes
  - resolve tenant; bind to request context
  - set permission team context (if using CASL/teams equivalent)

- Guard `tenant-active.guard.ts`
  - block suspended tenants with HTTP 503

- Guard `super-admin.guard.ts`
  - checks `user.isSuperAdmin === true`
  - bypasses tenant scoping where required

### Data scoping

- Introduce `TenantAwareRepository` helper and TypeORM query helpers:
  - auto-apply `tenant_id` filter when tenant exists
  - allow explicit bypass for super-admin and platform jobs

- For create operations, auto-populate `tenant_id` from context.

## 4) Runtime Config & Branding from DB

### Two-layer config resolution

1. Global defaults from existing configuration source
2. Tenant overrides from `tenant_settings`

`TenantSettingsService.get(key, fallback)`:
- check cache key `tenant_cfg:{tenantId}:{key}`
- fallback to global default

### Branding injection

- Admin and Web apps load branding via API endpoint:
  - `GET /tenant/branding`
- Next.js theme provider maps branding to CSS variables:
  - `--primary`, `--secondary`, `--accent`, `--font`
- Replace hardcoded app name/logo with tenant-driven values + fallback asset.

## 5) Feature & Wallet Logic Updates

- Wallet fee/limit calculations use tenant-config keys:
  - `fee.{type}.rate`
  - `kyc.tier{n}.daily_limit`
- Cross-tenant safety checks:
  - transfers and P2P trades must enforce same `tenant_id`
- Feature flag cache keys become tenant-prefixed:
  - `feature:{tenantId}:{name}`

## 6) Admin Settings UX

In `apps/admin` add settings pages:
- Branding
- Fees
- Limits
- Payment keys (stored encrypted)
- Mail settings + test email

API endpoints under tenant-admin scope:
- `/admin/settings/branding`
- `/admin/settings/fees`
- `/admin/settings/limits`
- `/admin/settings/payments`
- `/admin/settings/mail`

## 7) Super Admin Portal

Add platform scope in admin app:
- `/super` dashboard
- tenant CRUD
- suspend/reactivate
- impersonation

Super-admin users should have `tenant_id = NULL` + `is_super_admin = true`.

## 8) Installer & Stack Simplification (Architecture-Adjusted)

Because this repo is not Laravel, implement a web onboarding flow in admin/api:

1. Welcome
2. Requirements
3. Permissions
4. Database
5. Cache/Session driver (file/database/redis-equivalent strategy)
6. Mail
7. App setup (name/url/logo/colors)
8. Super Admin
9. Complete

Post-install principle:
- Keep only infra secrets in environment (`DB_*`, JWT secrets, base app URL, mail transport credentials)
- Move business/runtime settings to DB.

## 9) Implementation Sequence

1. Add migrations for tenants/settings/branding
2. Add nullable `tenant_id` columns + indexes + FK updates
3. Backfill default tenant and existing rows
4. Add tenancy middleware/guards/context
5. Update repositories/services for tenant scoping
6. Add tenant settings + branding APIs
7. Implement admin settings screens
8. Implement super-admin screens
9. Add validation/integration tests for cross-tenant isolation

## 10) Verification Matrix

- Fresh setup completes onboarding without CLI-only steps
- Branding updates propagate to both web and admin apps
- Tenant-specific fees/limits change transactional behavior
- Tenant payment credentials are used per tenant
- Suspended tenant receives 503 on scoped routes
- Tenant A data is inaccessible from Tenant B context

## 11) Open Gaps vs Original Laravel Plan

The original request references Laravel artifacts (`app/Models`, `bootstrap/app.php`, Blade, Spatie). In this repository those files do not exist; equivalent implementation is mapped to NestJS modules/middleware and Next.js UI layers.

If desired, the next iteration can break this plan into executable tickets with exact file paths under `apps/api` and `apps/admin`.
