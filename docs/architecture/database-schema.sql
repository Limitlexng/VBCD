-- Berry X — PostgreSQL Database Schema
-- Generated: 2025
-- Version: 1.0.0

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'pending_verification');
CREATE TYPE user_role AS ENUM ('user', 'merchant', 'admin', 'super_admin', 'support', 'compliance', 'operations', 'finance');
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');
CREATE TYPE wallet_status AS ENUM ('active', 'frozen', 'closed', 'pending');
CREATE TYPE wallet_type AS ENUM ('fiat', 'crypto', 'escrow', 'merchant', 'system');
CREATE TYPE wallet_currency AS ENUM ('NGN', 'USD', 'BTC', 'ETH', 'USDT', 'USDC');
CREATE TYPE tx_status AS ENUM ('pending', 'processing', 'success', 'failed', 'reversed', 'expired', 'cancelled', 'awaiting_approval', 'queued');
CREATE TYPE tx_type AS ENUM ('wallet_funding', 'wallet_transfer', 'bank_transfer', 'bill_payment', 'airtime_purchase', 'data_purchase', 'electricity_payment', 'cabletv_payment', 'crypto_buy', 'crypto_sell', 'crypto_transfer', 'p2p_trade', 'merchant_payment', 'reversal', 'withdrawal', 'referral_bonus', 'cashback', 'fee', 'escrow_lock', 'escrow_release');
CREATE TYPE tx_channel AS ENUM ('app', 'web', 'api', 'ussd', 'admin');
CREATE TYPE ledger_type AS ENUM ('debit', 'credit');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'transaction', 'security', 'promotion', 'kyc');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending_user', 'resolved', 'closed');
CREATE TYPE provider_status AS ENUM ('active', 'inactive', 'maintenance', 'degraded', 'down');
CREATE TYPE circuit_state AS ENUM ('CLOSED', 'OPEN', 'HALF_OPEN');
CREATE TYPE crypto_order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'expired');
CREATE TYPE p2p_status AS ENUM ('open', 'matched', 'escrowed', 'disputed', 'completed', 'cancelled');
CREATE TYPE escrow_status AS ENUM ('locked', 'released', 'refunded', 'disputed');

-- ─────────────────────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NOT NULL UNIQUE,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash      VARCHAR(255),
  avatar_url    TEXT,
  date_of_birth DATE,
  status        user_status  NOT NULL DEFAULT 'pending_verification',
  role          user_role    NOT NULL DEFAULT 'user',
  tier          SMALLINT     NOT NULL DEFAULT 0 CHECK (tier BETWEEN 0 AND 3),
  is_email_verified   BOOLEAN NOT NULL DEFAULT false,
  is_phone_verified   BOOLEAN NOT NULL DEFAULT false,
  is_two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret   VARCHAR(255),
  referral_code VARCHAR(20)  NOT NULL UNIQUE,
  referred_by   UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- Devices
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE devices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id    VARCHAR(255) NOT NULL,
  device_name  VARCHAR(255),
  device_model VARCHAR(255),
  os           VARCHAR(50),
  os_version   VARCHAR(50),
  app_version  VARCHAR(20),
  ip_address   INET,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  is_trusted   BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON devices(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sessions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id    VARCHAR(255),
  ip_address   INET,
  user_agent   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Refresh Tokens
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_id   VARCHAR(255),
  is_revoked  BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- OTPs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  identifier  VARCHAR(255) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  purpose     VARCHAR(50)  NOT NULL,
  attempts    SMALLINT     NOT NULL DEFAULT 0,
  is_used     BOOLEAN      NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otps_identifier ON otps(identifier);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- KYC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE kyc_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier            SMALLINT    NOT NULL CHECK (tier BETWEEN 1 AND 3),
  status          kyc_status  NOT NULL DEFAULT 'pending',
  bvn_hash        VARCHAR(255),
  nin_hash        VARCHAR(255),
  bvn_verified    BOOLEAN     NOT NULL DEFAULT false,
  nin_verified    BOOLEAN     NOT NULL DEFAULT false,
  selfie_url      TEXT,
  id_type         VARCHAR(50),
  id_number_hash  VARCHAR(255),
  id_front_url    TEXT,
  id_back_url     TEXT,
  address_proof_url TEXT,
  documents       JSONB       NOT NULL DEFAULT '[]',
  review_notes    TEXT,
  reviewed_by     UUID REFERENCES users(id),
  submitted_at    TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_user_id ON kyc_records(user_id);
CREATE INDEX idx_kyc_status ON kyc_records(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Wallets
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency        wallet_currency NOT NULL DEFAULT 'NGN',
  type            wallet_type    NOT NULL DEFAULT 'fiat',
  status          wallet_status  NOT NULL DEFAULT 'active',
  balance         NUMERIC(20,8)  NOT NULL DEFAULT 0 CHECK (balance >= 0),
  ledger_balance  NUMERIC(20,8)  NOT NULL DEFAULT 0,
  pending_balance NUMERIC(20,8)  NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_deposited NUMERIC(20,8)  NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(20,8)  NOT NULL DEFAULT 0,
  daily_limit     NUMERIC(20,8)  NOT NULL DEFAULT 20000,
  wallet_tag      VARCHAR(50)    UNIQUE,
  is_default      BOOLEAN        NOT NULL DEFAULT false,
  frozen_reason   TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_wallet_tag ON wallets(wallet_tag) WHERE wallet_tag IS NOT NULL;
CREATE INDEX idx_wallets_currency ON wallets(currency);

-- ─────────────────────────────────────────────────────────────────────────────
-- Virtual Accounts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE virtual_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id       UUID    NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  account_number  VARCHAR(20) NOT NULL UNIQUE,
  account_name    VARCHAR(255) NOT NULL,
  bank_name       VARCHAR(100) NOT NULL,
  bank_code       VARCHAR(10)  NOT NULL,
  provider        VARCHAR(50)  NOT NULL,
  provider_ref    VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX idx_virtual_accounts_number ON virtual_accounts(account_number);

-- ─────────────────────────────────────────────────────────────────────────────
-- Transactions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference           VARCHAR(100) NOT NULL UNIQUE,
  idempotency_key     VARCHAR(255) UNIQUE,
  user_id             UUID         NOT NULL REFERENCES users(id),
  wallet_id           UUID         NOT NULL REFERENCES wallets(id),
  counterpart_wallet_id UUID       REFERENCES wallets(id),
  type                tx_type      NOT NULL,
  status              tx_status    NOT NULL DEFAULT 'pending',
  channel             tx_channel   NOT NULL DEFAULT 'app',
  amount              NUMERIC(20,8) NOT NULL CHECK (amount > 0),
  fee                 NUMERIC(20,8) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(20,8) NOT NULL,
  currency            VARCHAR(10)   NOT NULL DEFAULT 'NGN',
  description         TEXT         NOT NULL,
  narration           TEXT,
  metadata            JSONB        NOT NULL DEFAULT '{}',
  provider_id         UUID,
  provider_reference  VARCHAR(255),
  provider_response   JSONB,
  provider_status     VARCHAR(50),
  retry_count         SMALLINT     NOT NULL DEFAULT 0,
  max_retries         SMALLINT     NOT NULL DEFAULT 3,
  reversed_txn_id     UUID         REFERENCES transactions(id),
  ip_address          INET,
  device_id           VARCHAR(255),
  completed_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  reversed_at         TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Transaction Timeline
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE transaction_timeline (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  status         tx_status  NOT NULL,
  message        TEXT       NOT NULL,
  metadata       JSONB      NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_transaction_id ON transaction_timeline(transaction_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Ledger Entries (double-entry bookkeeping)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE ledger_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id       UUID          NOT NULL REFERENCES wallets(id),
  transaction_id  UUID          NOT NULL REFERENCES transactions(id),
  type            ledger_type   NOT NULL,
  amount          NUMERIC(20,8) NOT NULL CHECK (amount > 0),
  balance_before  NUMERIC(20,8) NOT NULL,
  balance_after   NUMERIC(20,8) NOT NULL,
  description     TEXT,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payment Providers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payment_providers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(50)  NOT NULL UNIQUE,
  display_name          VARCHAR(100),
  status                provider_status NOT NULL DEFAULT 'active',
  circuit_state         circuit_state   NOT NULL DEFAULT 'CLOSED',
  priority              SMALLINT        NOT NULL DEFAULT 1,
  is_enabled            BOOLEAN         NOT NULL DEFAULT true,
  is_sandbox            BOOLEAN         NOT NULL DEFAULT false,
  supported_services    JSONB           NOT NULL DEFAULT '[]',
  base_url              TEXT,
  api_key_enc           TEXT,
  secret_key_enc        TEXT,
  webhook_secret        TEXT,
  success_rate          NUMERIC(5,2)    NOT NULL DEFAULT 100,
  avg_response_time_ms  INTEGER         NOT NULL DEFAULT 0,
  consecutive_failures  SMALLINT        NOT NULL DEFAULT 0,
  circuit_opened_at     TIMESTAMPTZ,
  last_health_check_at  TIMESTAMPTZ,
  maintenance_message   TEXT,
  config                JSONB           NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Provider Health Logs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE provider_health_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
  success       BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL,
  error_code    VARCHAR(50),
  error_message TEXT,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_logs_provider_id ON provider_health_logs(provider_id);
CREATE INDEX idx_provider_logs_recorded_at ON provider_health_logs(recorded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Feature Flags
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE feature_flags (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key                  VARCHAR(100) NOT NULL UNIQUE,
  is_enabled           BOOLEAN      NOT NULL DEFAULT true,
  rollout_percentage   SMALLINT     NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  allowed_tiers        JSONB        NOT NULL DEFAULT '[0,1,2,3]',
  maintenance_message  TEXT,
  description          TEXT,
  updated_by           UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'info',
  title       VARCHAR(255) NOT NULL,
  message     TEXT         NOT NULL,
  data        JSONB        NOT NULL DEFAULT '{}',
  is_read     BOOLEAN      NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Support Tickets
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE support_tickets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  VARCHAR(20)    NOT NULL UNIQUE,
  user_id        UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to    UUID           REFERENCES users(id),
  subject        VARCHAR(255)   NOT NULL,
  category       VARCHAR(50)    NOT NULL,
  status         ticket_status  NOT NULL DEFAULT 'open',
  priority       VARCHAR(20)    NOT NULL DEFAULT 'medium',
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_number ON support_tickets(ticket_number);

CREATE TABLE ticket_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  message    TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Crypto Rates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE crypto_rates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency    VARCHAR(10)   NOT NULL,
  buy_rate    NUMERIC(20,8) NOT NULL,
  sell_rate   NUMERIC(20,8) NOT NULL,
  market_rate NUMERIC(20,8) NOT NULL,
  source      VARCHAR(50),
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crypto_rates_currency ON crypto_rates(currency);
CREATE INDEX idx_crypto_rates_recorded_at ON crypto_rates(recorded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Crypto Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE crypto_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id),
  wallet_id       UUID          NOT NULL REFERENCES wallets(id),
  transaction_id  UUID          REFERENCES transactions(id),
  order_type      VARCHAR(10)   NOT NULL CHECK (order_type IN ('buy', 'sell')),
  currency        VARCHAR(10)   NOT NULL,
  amount_crypto   NUMERIC(20,8) NOT NULL,
  amount_ngn      NUMERIC(20,2) NOT NULL,
  rate            NUMERIC(20,8) NOT NULL,
  fee_ngn         NUMERIC(20,2) NOT NULL,
  status          crypto_order_status NOT NULL DEFAULT 'pending',
  provider_ref    VARCHAR(255),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crypto_orders_user_id ON crypto_orders(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- P2P Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE p2p_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID          NOT NULL REFERENCES users(id),
  buyer_id        UUID          REFERENCES users(id),
  currency        VARCHAR(10)   NOT NULL,
  amount_crypto   NUMERIC(20,8) NOT NULL,
  rate            NUMERIC(20,2) NOT NULL,
  amount_ngn      NUMERIC(20,2) NOT NULL,
  min_amount      NUMERIC(20,2),
  max_amount      NUMERIC(20,2),
  payment_methods JSONB         NOT NULL DEFAULT '[]',
  status          p2p_status    NOT NULL DEFAULT 'open',
  expires_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_p2p_seller_id ON p2p_orders(seller_id);
CREATE INDEX idx_p2p_status ON p2p_orders(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Escrow
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE crypto_escrows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  p2p_order_id UUID          NOT NULL REFERENCES p2p_orders(id),
  seller_id    UUID          NOT NULL REFERENCES users(id),
  buyer_id     UUID          NOT NULL REFERENCES users(id),
  currency     VARCHAR(10)   NOT NULL,
  amount       NUMERIC(20,8) NOT NULL,
  status       escrow_status NOT NULL DEFAULT 'locked',
  released_at  TIMESTAMPTZ,
  refunded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrows_p2p_order_id ON crypto_escrows(p2p_order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Beneficiaries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE beneficiaries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  type           VARCHAR(20)  NOT NULL CHECK (type IN ('bank', 'wallet', 'crypto')),
  bank_code      VARCHAR(10),
  bank_name      VARCHAR(100),
  account_number VARCHAR(20),
  wallet_tag     VARCHAR(50),
  is_favorite    BOOLEAN NOT NULL DEFAULT false,
  last_used_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit Logs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID        REFERENCES users(id),
  actor_role  VARCHAR(50),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Merchants
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE merchants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name   VARCHAR(255) NOT NULL,
  business_type   VARCHAR(100),
  website         TEXT,
  api_key         VARCHAR(255) UNIQUE,
  webhook_url     TEXT,
  webhook_secret  VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions & Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wallets_updated_at         BEFORE UPDATE ON wallets         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at    BEFORE UPDATE ON transactions    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_providers_updated_at       BEFORE UPDATE ON payment_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_feature_flags_updated_at   BEFORE UPDATE ON feature_flags   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON support_tickets  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kyc_updated_at             BEFORE UPDATE ON kyc_records     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_crypto_orders_updated_at   BEFORE UPDATE ON crypto_orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
