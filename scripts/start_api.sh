#!/bin/bash
###############################################################################
# Finans Akademi - Start API Server
# Starts the FastAPI backend server
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

echo "🚀 Starting Finans Akademi Chatbot API..."

# Check if .env exists
if [ ! -f "config/.env" ]; then
    echo "❌ config/.env not found!"
    echo "Please copy config/.env.example to config/.env and configure it."
    exit 1
fi

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run setup.sh first."
    exit 1
fi

source venv/bin/activate

# Load environment variables
export $(cat config/.env | grep -v '^#' | xargs)

# Create required directories
mkdir -p data logs

# Check if FAISS index exists
if [ ! -d "data/faiss_index" ]; then
    echo "⚠️  FAISS index not found. Building initial index..."
    python3 api/data_sync.py || {
        echo "❌ Failed to build initial index"
        exit 1
    }
fi

# Get configuration from .env
API_HOST="${API_HOST:-0.0.0.0}"
API_PORT="${API_PORT:-8000}"
API_WORKERS="${API_WORKERS:-4}"
API_RELOAD="${API_RELOAD:-false}"

# Start server
echo "📡 Starting server on http://${API_HOST}:${API_PORT}"
echo "🔄 Workers: ${API_WORKERS}"
echo "🔧 Reload: ${API_RELOAD}"
echo ""

if [ "$API_RELOAD" = "true" ]; then
    # Development mode with auto-reload
    uvicorn api.api:app \
        --host "$API_HOST" \
        --port "$API_PORT" \
        --reload
else
    # Production mode
    uvicorn api.api:app \
        --host "$API_HOST" \
        --port "$API_PORT" \
        --workers "$API_WORKERS"
fi
