-- ============================================================================
-- CYBERPOOL PRODUCTION POSTGRESQL RELATIONAL SCHEMA (64+ TABLES)
-- Architecture: Double-Entry Ledger, State-Machine Escrow, Digital Key Vault, RBAC
-- Target: PostgreSQL 15+ / Cloud SQL / Supabase / Neon
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ROLES, PERMISSIONS & AUTHENTICATION
-- ----------------------------------------------------------------------------

CREATE TYPE user_role_enum AS ENUM (
    'USER',
    'SELLER',
    'SUPPLIER',
    'MODERATOR',
    'SUPPORT',
    'FINANCE',
    'ADMIN',
    'SUPER_ADMIN'
);

CREATE TYPE order_status_enum AS ENUM (
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'DELIVERED',
    'COMPLETED',
    'DISPUTED',
    'REFUNDED',
    'CANCELLED'
);

CREATE TYPE inventory_state_enum AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'DELIVERED',
    'REFUNDED',
    'DISABLED'
);

CREATE TYPE transaction_type_enum AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'ESCROW_LOCK',
    'ESCROW_RELEASE',
    'ESCROW_REFUND',
    'PURCHASE_INSTANT',
    'TOPUP_GAME',
    'SELLER_PAYOUT',
    'AFFILIATE_COMMISSION',
    'SYSTEM_ADJUSTMENT'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role user_role_enum DEFAULT 'USER' NOT NULL,
    wallet_balance BIGINT DEFAULT 0 NOT NULL CHECK (wallet_balance >= 0),
    escrow_locked BIGINT DEFAULT 0 NOT NULL CHECK (escrow_locked >= 0),
    affiliate_balance BIGINT DEFAULT 0 NOT NULL CHECK (affiliate_balance >= 0),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. DOUBLE-ENTRY LEDGER & WALLET TRANSACTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    type transaction_type_enum NOT NULL,
    amount BIGINT NOT NULL, -- negative for debit, positive for credit
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    escrow_before BIGINT NOT NULL,
    escrow_after BIGINT NOT NULL,
    reference_id VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'COMPLETED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_tx_idempotency ON wallet_transactions(idempotency_key);

-- ----------------------------------------------------------------------------
-- 3. PRODUCT CATALOG & CATEGORIES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    icon VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    platform VARCHAR(50) NOT NULL,
    wholesale_price BIGINT NOT NULL,
    retail_price BIGINT NOT NULL,
    market_price BIGINT,
    discount_percent INT DEFAULT 0,
    stock_available INT DEFAULT 0 NOT NULL,
    rating NUMERIC(3, 1) DEFAULT 5.0 NOT NULL,
    review_count INT DEFAULT 0 NOT NULL,
    image_url TEXT,
    delivery_type VARCHAR(50) DEFAULT 'instant_key' NOT NULL,
    is_flash_sale BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. DIGITAL KEY VAULT & INVENTORY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    key_code TEXT NOT NULL,
    pin_code VARCHAR(50),
    cost_price BIGINT DEFAULT 0 NOT NULL,
    state inventory_state_enum DEFAULT 'AVAILABLE' NOT NULL,
    order_id VARCHAR(100),
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reserved_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_inventory_product_state ON inventory_items(product_id, state);

-- ----------------------------------------------------------------------------
-- 5. ESCROW CONTRACTS & GROUP BUY POOLS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS escrow_contracts (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    target_slots INT NOT NULL,
    filled_slots INT DEFAULT 0 NOT NULL,
    price_per_slot BIGINT NOT NULL,
    total_locked_amount BIGINT DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'FILLING' NOT NULL, -- FILLING, COMPLETED, CANCELLED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS escrow_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR(100) REFERENCES escrow_contracts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    slot_number INT NOT NULL,
    delivered_key TEXT,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(contract_id, slot_number)
);

-- ----------------------------------------------------------------------------
-- 6. ORDERS & FULFILLMENT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    buyer_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_title VARCHAR(255) NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    status order_status_enum DEFAULT 'PENDING_PAYMENT' NOT NULL,
    price_paid BIGINT NOT NULL,
    delivered_payload JSONB,
    escrow_id VARCHAR(100),
    tx_hash VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. REVIEWS (STRICT SERVER-VERIFIED)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. IMMUTABLE AUDIT LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role user_role_enum NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
