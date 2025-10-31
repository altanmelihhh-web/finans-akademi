#!/usr/bin/env python3
"""
Finans Akademi - Auto Data Sync Script
Automatically syncs site content to FAISS index
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from data_loader import SiteContentLoader
from rag_chatbot import FinansRAGChatbot


def sync_content():
    """Sync site content to FAISS index"""
    logger.info("="*60)
    logger.info("Starting content sync...")
    logger.info("="*60)

    try:
        # Load environment
        load_dotenv()

        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise Exception("OPENAI_API_KEY not found in environment")

        # Load site content
        logger.info("Loading site content...")
        loader = SiteContentLoader()

        pages_to_index = os.getenv("PAGES_TO_INDEX", "").split(",")
        if not pages_to_index or pages_to_index == [""]:
            pages_to_index = None

        documents = loader.load_html_files(pages_to_index)

        if not documents:
            logger.warning("No documents found to index")
            return False

        logger.info(f"Loaded {len(documents)} documents from site")

        # Save documents to JSON (for backup)
        loader.save_documents(documents, "./data/site_content.json")

        # Initialize chatbot and build index
        logger.info("Building FAISS index...")
        chatbot = FinansRAGChatbot(
            openai_api_key=openai_key,
            faiss_index_path=os.getenv("FAISS_INDEX_PATH", "./data/faiss_index")
        )

        chatbot.build_index(documents)

        logger.info("✅ Content sync completed successfully")
        logger.info(f"   Documents: {len(documents)}")
        logger.info(f"   Index path: {chatbot.faiss_index_path}")
        logger.info(f"   Timestamp: {datetime.now().isoformat()}")

        return True

    except Exception as e:
        logger.error(f"❌ Sync failed: {e}")
        return False


def main():
    """Main entry point"""
    # Configure logging
    log_file = Path(__file__).parent.parent / "logs" / "sync.log"
    log_file.parent.mkdir(exist_ok=True)

    logger.add(
        log_file,
        rotation="10 MB",
        retention="30 days",
        level="INFO"
    )

    # Run sync
    success = sync_content()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
