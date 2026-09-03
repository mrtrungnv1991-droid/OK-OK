-- ==============================================================================
-- CYBERPOOL: SOURCE ACCOUNT CONNECTOR & WEBSITE PRODUCT SCAN ENGINE SCHEMA
-- Migration: 20260903_source_account_scanner.sql
-- Description: Core tables for managing source accounts, browser profiles,
--              raw product snapshots, multi-source offers, category mappings,
--              pricing rules, scan jobs, and audit logs.
-- ==============================================================================

-- 1. SOURCE ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS source_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(500) NOT NULL,
    username VARCHAR(255) NULL,
    encrypted_password TEXT NULL,
    encrypted_session TEXT NULL,
    browser_profile_id VARCHAR(255) NULL,
    connector_type VARCHAR(50) NOT NULL DEFAULT 'BROWSER', -- BROWSER, API, HYBRID
    scanner_profile VARCHAR(100) NULL,
    proxy_id BIGINT NULL,
    status VARCHAR(50) DEFAULT 'UNKNOWN', -- ONLINE, DEGRADED, SESSION_EXPIRED, LOGIN_FAILED, SOURCE_UNAVAILABLE, REAUTH_REQUIRED, BLOCKED, DISABLED
    balance DECIMAL(20,2) DEFAULT 0.00,
    currency VARCHAR(20) DEFAULT 'VND',
    low_balance_threshold DECIMAL(20,2) DEFAULT 200000.00,
    is_active BOOLEAN DEFAULT TRUE,
    concurrency_limit INT DEFAULT 2,
    request_delay_ms INT DEFAULT 800,
    last_login_at TIMESTAMP NULL,
    last_scan_at TIMESTAMP NULL,
    last_successful_scan_at TIMESTAMP NULL,
    last_purchase_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source_accounts_domain (domain),
    INDEX idx_source_accounts_status (status)
);

-- 2. SOURCE PRODUCTS SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS source_products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_account_id BIGINT NOT NULL,
    source_product_id VARCHAR(255) NOT NULL,
    source_url TEXT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    category_raw VARCHAR(255) NULL,
    original_price DECIMAL(20,6) NULL,
    original_currency VARCHAR(20) DEFAULT 'VND',
    stock INT NULL DEFAULT 0,
    source_status VARCHAR(100) DEFAULT 'IN_STOCK', -- IN_STOCK, OUT_OF_STOCK, DISABLED, UNKNOWN, SOURCE_REMOVED
    raw_data JSON NULL,
    is_sync_ignored BOOLEAN DEFAULT FALSE,
    missing_scan_count INT DEFAULT 0,
    first_seen_at TIMESTAMP NULL,
    last_seen_at TIMESTAMP NULL,
    last_synced_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_source_account_product (source_account_id, source_product_id),
    INDEX idx_source_products_account (source_account_id),
    INDEX idx_source_products_status (source_status),
    INDEX idx_source_products_missing (missing_scan_count)
);

-- 3. SOURCE OFFERS TABLE (MULTI-SOURCE ROUTING)
CREATE TABLE IF NOT EXISTS source_offers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    internal_product_id VARCHAR(255) NOT NULL,
    source_account_id BIGINT NOT NULL,
    source_product_id VARCHAR(255) NOT NULL,
    source_price DECIMAL(20,2) NOT NULL,
    currency VARCHAR(20) DEFAULT 'VND',
    calculated_final_price DECIMAL(20,2) NOT NULL,
    stock INT DEFAULT 0,
    priority INT DEFAULT 10,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INSUFFICIENT_FUNDS, OUT_OF_STOCK, OFFLINE
    last_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_offer_internal_source (internal_product_id, source_account_id, source_product_id),
    INDEX idx_offers_internal_product (internal_product_id),
    INDEX idx_offers_priority (priority)
);

-- 4. SOURCE CATEGORY MAPPINGS
CREATE TABLE IF NOT EXISTS source_category_mappings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_account_id BIGINT NOT NULL,
    source_category_id VARCHAR(255) NOT NULL,
    source_category_name VARCHAR(255) NOT NULL,
    internal_category_id VARCHAR(255) NULL,
    internal_category_name VARCHAR(255) NULL,
    mode VARCHAR(50) DEFAULT 'AUTO', -- AUTO, MANUAL, IGNORE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_source_category_mapping (source_account_id, source_category_id),
    INDEX idx_category_mappings_source (source_account_id)
);

-- 5. BLOCKED SOURCE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS blocked_source_products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_account_id BIGINT NOT NULL,
    source_product_id VARCHAR(255) NOT NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_blocked_source_product (source_account_id, source_product_id)
);

-- 6. SOURCE SCAN JOBS TABLE
CREATE TABLE IF NOT EXISTS source_scan_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_account_id BIGINT NOT NULL,
    scan_type VARCHAR(50) NOT NULL, -- FULL, INCREMENTAL, PRODUCT
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, SUCCESS, FAILED, CANCELLED
    progress INT DEFAULT 0,
    total_categories INT DEFAULT 0,
    processed_categories INT DEFAULT 0,
    total_products INT DEFAULT 0,
    processed_products INT DEFAULT 0,
    created_count INT DEFAULT 0,
    updated_count INT DEFAULT 0,
    skipped_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    current_step VARCHAR(255) NULL,
    correlation_id VARCHAR(100) NULL,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scan_jobs_account (source_account_id),
    INDEX idx_scan_jobs_status (status)
);

-- 7. SOURCE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS source_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    correlation_id VARCHAR(100) NULL,
    source_account_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_source_audit_account (source_account_id),
    INDEX idx_source_audit_action (action)
);
