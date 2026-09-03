#!/usr/bin/env bash
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-cyberpool_db}"
DB_USER="${DB_USER:-cyber_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 [CYBERPOOL BACKUP] Starting automated PostgreSQL backup..."
echo "📍 Target: $BACKUP_FILE"

# Dump and compress database
PGPASSWORD="${PGPASSWORD:-cyber_secret_2026}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "✅ [CYBERPOOL BACKUP] Database backup completed successfully: $BACKUP_FILE"
echo "📊 Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 14 days of backups
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete
echo "🧹 [CYBERPOOL BACKUP] Purged backups older than 14 days."
