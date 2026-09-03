#!/usr/bin/env bash
set -e

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-cyberpool_db}"
DB_USER="${DB_USER:-cyber_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Please provide the backup file path as the first argument."
  echo "Usage: ./scripts/restore_db.sh ./backups/cyberpool_db_20260827_120000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️ [CYBERPOOL RESTORE] Restoring database '$DB_NAME' from '$BACKUP_FILE'..."
read -p "Are you sure you want to overwrite existing data in '$DB_NAME'? (y/N) " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "🚫 Restore cancelled."
  exit 0
fi

gunzip -c "$BACKUP_FILE" | PGPASSWORD="${PGPASSWORD:-cyber_secret_2026}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo "✅ [CYBERPOOL RESTORE] Database restore completed successfully!"
