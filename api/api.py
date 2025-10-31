"""
Finans Akademi - FastAPI Backend
Main API server for chatbot
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from loguru import logger

from langchain_chatbot import EnhancedFinansChatbot

# Load environment variables
load_dotenv()

# Initialize app
app = FastAPI(
    title="Finans Akademi Chatbot API",
    description="AI-powered chatbot for finance education",
    version="1.0.0"
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chatbot (singleton)
chatbot: Optional[EnhancedFinansChatbot] = None


def get_chatbot() -> EnhancedFinansChatbot:
    """Get or create chatbot instance"""
    global chatbot

    if chatbot is None:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise RuntimeError("OPENAI_API_KEY not configured")

        chatbot = EnhancedFinansChatbot(
            openai_api_key=openai_key,
            faiss_index_path=os.getenv("FAISS_INDEX_PATH", "./data/faiss_index"),
            llm_model=os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview"),
            top_k=int(os.getenv("RAG_TOP_K", "5")),
            similarity_threshold=float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.7")),
            web_search_enabled=os.getenv("WEB_SEARCH_ENABLED", "true").lower() == "true",
            web_search_threshold=float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.6")),
        )
        logger.info("Chatbot initialized")

    return chatbot


# Pydantic models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: user or assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Conversation history")
    force_web_search: Optional[bool] = Field(default=False, description="Force web search")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Chatbot response")
    session_id: str = Field(..., description="Session ID")
    source_type: str = Field(..., description="Response source type")
    confidence: float = Field(..., description="Confidence score")
    web_search_performed: bool = Field(..., description="Whether web search was performed")
    web_sources: List[Dict[str, Any]] = Field(default=[], description="Web sources used")
    response_time_ms: int = Field(..., description="Response time in milliseconds")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Session ID")
    message_id: Optional[int] = Field(None, description="Message ID from database")
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    feedback_text: Optional[str] = Field(None, max_length=500, description="Optional feedback text")


class IndexRequest(BaseModel):
    pages: Optional[List[str]] = Field(None, description="List of pages to index")


# API Routes

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "ok",
        "service": "Finans Akademi Chatbot API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        bot = get_chatbot()
        has_index = bot.index is not None
        doc_count = len(bot.documents) if bot.documents else 0

        return {
            "status": "healthy",
            "chatbot_initialized": True,
            "faiss_index_loaded": has_index,
            "document_count": doc_count,
            "web_search_enabled": bot.web_search_enabled,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
@limiter.limit(os.getenv("RATE_LIMIT_PER_MINUTE", "20/minute"))
async def chat(request: ChatRequest, req: Request):
    """
    Main chat endpoint

    Args:
        request: Chat request with message and optional history
        req: FastAPI request object (for rate limiting)

    Returns:
        Chat response with answer and metadata
    """
    try:
        # Get or create session ID
        session_id = request.session_id or str(uuid.uuid4())

        # Convert history to chatbot format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in (request.history or [])
        ]

        # Get chatbot
        bot = get_chatbot()

        # Get response
        result = bot.chat(
            message=request.message,
            session_history=history,
            force_web_search=request.force_web_search
        )

        # Build response
        response = ChatResponse(
            answer=result["answer"],
            session_id=session_id,
            source_type=result["source_type"],
            confidence=result["confidence"],
            web_search_performed=result.get("web_search_performed", False),
            web_sources=result.get("web_sources", []),
            response_time_ms=result["response_time_ms"],
            metadata={
                "documents_retrieved": result.get("documents_retrieved", 0),
                "similarity_scores": result.get("similarity_scores", [])[:3]  # Top 3
            }
        )

        logger.info(f"Chat response generated for session {session_id}")
        return response

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.post("/feedback")
@limiter.limit("10/minute")
async def submit_feedback(request: FeedbackRequest, req: Request):
    """
    Submit user feedback for a response

    Args:
        request: Feedback with rating and optional text
        req: FastAPI request object

    Returns:
        Success confirmation
    """
    try:
        # TODO: Store feedback in database via PHP API
        logger.info(f"Feedback received for session {request.session_id}: {request.rating}/5")

        return {
            "status": "success",
            "message": "Feedback received",
            "session_id": request.session_id
        }

    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=f"Feedback failed: {str(e)}")


@app.post("/index/rebuild")
async def rebuild_index(request: IndexRequest):
    """
    Rebuild FAISS index from site content

    Args:
        request: Optional list of pages to index

    Returns:
        Indexing result
    """
    try:
        from data_loader import SiteContentLoader

        # Load site content
        loader = SiteContentLoader()
        documents = loader.load_html_files(request.pages)

        if not documents:
            raise HTTPException(status_code=400, detail="No documents found to index")

        # Get chatbot and rebuild index
        bot = get_chatbot()
        bot.build_index(documents)

        return {
            "status": "success",
            "message": "Index rebuilt successfully",
            "document_count": len(documents),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Index rebuild error: {e}")
        raise HTTPException(status_code=500, detail=f"Index rebuild failed: {str(e)}")


@app.get("/index/stats")
async def index_stats():
    """Get FAISS index statistics"""
    try:
        bot = get_chatbot()

        return {
            "index_exists": bot.index is not None,
            "document_count": len(bot.documents) if bot.documents else 0,
            "embedding_dimension": bot.embedding_dim,
            "index_path": str(bot.faiss_index_path),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")


# Error handlers

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An error occurred"
        }
    )


# Startup event

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Finans Akademi Chatbot API")

    # Pre-load chatbot
    try:
        get_chatbot()
        logger.info("Chatbot pre-loaded successfully")
    except Exception as e:
        logger.warning(f"Could not pre-load chatbot: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Finans Akademi Chatbot API")


# Run server
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("API_RELOAD", "false").lower() == "true",
        workers=int(os.getenv("API_WORKERS", "1"))
    )
