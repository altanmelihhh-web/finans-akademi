#!/bin/bash
###############################################################################
# Finans Akademi - Cron Job for Auto Sync
# Automatically syncs site content to FAISS index
###############################################################################

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Activate virtual environment if exists
if [ -d "$PROJECT_DIR/venv" ]; then
    source "$PROJECT_DIR/venv/bin/activate"
fi

# Run sync script
cd "$PROJECT_DIR" || exit 1

python3 api/data_sync.py

# Check exit code
if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Sync completed successfully" >> logs/cron.log
else
    echo "[$(date)] ❌ Sync failed" >> logs/cron.log
fi
