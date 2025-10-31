#!/bin/bash
###############################################################################
# Finans Akademi - Setup Script
# Installs and configures the chatbot system
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Finans Akademi - Chatbot Setup                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Python version
echo "📋 Checking Python version..."
python3 --version || {
    echo "❌ Python 3 not found! Please install Python 3.8 or higher."
    exit 1
}

# Create virtual environment
echo ""
echo "🐍 Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo ""
echo "📥 Installing Python dependencies..."
pip install -r config/requirements.txt

echo "✅ Python dependencies installed"

# Create .env file if not exists
echo ""
echo "⚙️  Setting up configuration..."
if [ ! -f "config/.env" ]; then
    cp config/.env.example config/.env
    echo "✅ Created config/.env from template"
    echo "⚠️  IMPORTANT: Edit config/.env and add your API keys!"
else
    echo "⚠️  config/.env already exists, skipping..."
fi

# Create required directories
echo ""
echo "📁 Creating required directories..."
mkdir -p data logs data/faiss_index
echo "✅ Directories created"

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh
echo "✅ Scripts are now executable"

# Check PostgreSQL
echo ""
echo "🗄️  Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    echo ""
    read -p "Do you want to create the database now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        source config/.env 2>/dev/null || true
        DB_NAME="${DB_NAME:-finans_chatbot}"
        DB_USER="${DB_USER:-postgres}"

        echo "Creating database: $DB_NAME"

        # Create database
        createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "Database may already exist"

        # Run schema
        psql -U "$DB_USER" -d "$DB_NAME" -f database/create_chat_audit_logs.sql

        echo "✅ Database created and schema applied"
    fi
else
    echo "⚠️  PostgreSQL not found. Please install it manually."
    echo "    - macOS: brew install postgresql"
    echo "    - Ubuntu: sudo apt install postgresql"
fi

# Build initial FAISS index
echo ""
read -p "Do you want to build the initial FAISS index now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building FAISS index from site content..."

    # Check if OPENAI_API_KEY is set
    source config/.env
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ OPENAI_API_KEY not set in config/.env"
        echo "Please add your OpenAI API key and run: python3 api/data_sync.py"
    else
        python3 api/data_sync.py || {
            echo "⚠️  Index build failed. You can run it later with: python3 api/data_sync.py"
        }
    fi
fi

# Setup cron job
echo ""
read -p "Do you want to setup automatic content sync (cron job)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash scripts/setup_cron.sh
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure your environment:"
echo "   - Edit config/.env"
echo "   - Add your OPENAI_API_KEY"
echo "   - Configure database settings"
echo ""
echo "2. Start the API server:"
echo "   bash scripts/start_api.sh"
echo ""
echo "3. Access your website and test the chatbot!"
echo ""
echo "📚 Useful Commands:"
echo "   - Build index:    python3 api/data_sync.py"
echo "   - Test chatbot:   python3 api/langchain_chatbot.py"
echo "   - View logs:      tail -f logs/chatbot.log"
echo ""
echo "🆘 Need help? Check README.md"
echo ""
