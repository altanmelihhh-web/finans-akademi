#!/bin/bash
###############################################################################
# Finans Akademi - Setup Cron Job
# Configures automatic content syncing
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync-cron.sh"

echo "🔧 Setting up cron job for automatic content sync..."

# Make sync script executable
chmod +x "$SYNC_SCRIPT"

# Get sync interval from .env or use default (daily at 2 AM)
CRON_SCHEDULE="${SYNC_INTERVAL:-0 2 * * *}"

# Create cron job
CRON_JOB="$CRON_SCHEDULE $SYNC_SCRIPT"

# Check if cron job already exists
crontab -l 2>/dev/null | grep -q "$SYNC_SCRIPT" && {
    echo "⚠️  Cron job already exists. Removing old one..."
    crontab -l | grep -v "$SYNC_SCRIPT" | crontab -
}

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Schedule: $CRON_SCHEDULE"
echo "📝 Script: $SYNC_SCRIPT"
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove this job: crontab -e (then delete the line)"
