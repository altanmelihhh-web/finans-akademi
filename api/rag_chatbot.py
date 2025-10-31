"""
Finans Akademi - RAG Chatbot with FAISS
LangChain + FAISS + GPT-4 for Turkish finance Q&A
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from loguru import logger

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate


class FinansRAGChatbot:
    """RAG-based chatbot for Finans Akademi using FAISS and LangChain"""

    def __init__(
        self,
        openai_api_key: str,
        faiss_index_path: str = "./data/faiss_index",
        embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        llm_model: str = "gpt-4-turbo-preview",
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ):
        self.openai_api_key = openai_api_key
        self.faiss_index_path = Path(faiss_index_path)
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold

        # Initialize embedding model (Türkçe destekli)
        logger.info(f"Loading embedding model: {embedding_model}")
        self.embedding_model = SentenceTransformer(embedding_model)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()

        # Initialize FAISS index
        self.index = None
        self.documents = []
        self.document_metadata = []

        # Initialize LLM
        logger.info(f"Initializing LLM: {llm_model}")
        self.llm = ChatOpenAI(
            model=llm_model,
            temperature=0.7,
            openai_api_key=openai_api_key
        )

        # Turkish system prompt
        self.system_prompt = """Sen Finans Akademi'nin yapay zeka asistanısın. Adın Finans Asistan.

Görevin:
- Kullanıcılara finans, yatırım, borsa ve ekonomi konularında Türkçe yardım sağlamak
- Verilen bağlam (context) bilgilerini kullanarak doğru ve detaylı cevaplar vermek
- Eğer bağlamda bilgi yoksa, bunu açıkça belirtmek
- Karmaşık konuları basit ve anlaşılır şekilde açıklamak
- Türkiye finans piyasalarına odaklanmak

Kurallar:
1. Sadece verilen bağlamdaki bilgileri kullan
2. Bilmediğin bir şey sorulursa, "Bu konuda sitemizdeki içeriklerde bilgi bulamadım" de
3. Her zaman Türkçe cevap ver
4. Finans tavsiyesi değil, eğitim veriyorsun
5. Açık, net ve arkadaşça bir dil kullan

Bağlam bilgileri:
{context}

Soru: {question}

Cevap:"""

        self.prompt_template = PromptTemplate(
            template=self.system_prompt,
            input_variables=["context", "question"]
        )

        # Load or create FAISS index
        if self.faiss_index_path.exists():
            self.load_index()
        else:
            logger.info("FAISS index not found. Will create on first indexing.")

    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings for texts using Sentence Transformers"""
        logger.info(f"Creating embeddings for {len(texts)} texts")
        embeddings = self.embedding_model.encode(
            texts,
            show_progress_bar=True,
            normalize_embeddings=True
        )
        return embeddings.astype('float32')

    def build_index(self, documents: List[Dict[str, Any]]):
        """Build FAISS index from documents"""
        logger.info(f"Building FAISS index from {len(documents)} documents")

        # Text splitter for chunking large documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        # Prepare documents and metadata
        all_chunks = []
        all_metadata = []

        for doc in documents:
            content = doc["content"]
            metadata = doc["metadata"]

            # Split long documents into chunks
            chunks = text_splitter.split_text(content)

            for i, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                chunk_metadata = metadata.copy()
                chunk_metadata["chunk_id"] = i
                chunk_metadata["total_chunks"] = len(chunks)
                all_metadata.append(chunk_metadata)

        logger.info(f"Created {len(all_chunks)} chunks from {len(documents)} documents")

        # Create embeddings
        embeddings = self.create_embeddings(all_chunks)

        # Create FAISS index (using Inner Product for normalized vectors)
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        self.index.add(embeddings)

        # Store documents and metadata
        self.documents = all_chunks
        self.document_metadata = all_metadata

        # Save index
        self.save_index()

        logger.info(f"✅ FAISS index built with {len(all_chunks)} vectors")

    def save_index(self):
        """Save FAISS index and metadata to disk"""
        self.faiss_index_path.mkdir(parents=True, exist_ok=True)

        # Save FAISS index
        index_file = self.faiss_index_path / "index.faiss"
        faiss.write_index(self.index, str(index_file))

        # Save documents
        docs_file = self.faiss_index_path / "documents.json"
        with open(docs_file, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)

        # Save metadata
        metadata_file = self.faiss_index_path / "metadata.json"
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(self.document_metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved FAISS index to {self.faiss_index_path}")

    def load_index(self):
        """Load FAISS index and metadata from disk"""
        logger.info(f"Loading FAISS index from {self.faiss_index_path}")

        # Load FAISS index
        index_file = self.faiss_index_path / "index.faiss"
        self.index = faiss.read_index(str(index_file))

        # Load documents
        docs_file = self.faiss_index_path / "documents.json"
        with open(docs_file, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        # Load metadata
        metadata_file = self.faiss_index_path / "metadata.json"
        with open(metadata_file, "r", encoding="utf-8") as f:
            self.document_metadata = json.load(f)

        logger.info(f"✅ Loaded FAISS index with {len(self.documents)} documents")

    def search(self, query: str, top_k: int = None) -> Tuple[List[str], List[float], List[Dict]]:
        """Search for relevant documents using FAISS"""
        if self.index is None:
            logger.error("FAISS index not initialized")
            return [], [], []

        if top_k is None:
            top_k = self.top_k

        # Create query embedding
        query_embedding = self.create_embeddings([query])[0:1]

        # Search FAISS index
        distances, indices = self.index.search(query_embedding, top_k)

        # Get documents, scores, and metadata
        results = []
        scores = []
        metadata = []

        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.documents):
                results.append(self.documents[idx])
                scores.append(float(dist))
                metadata.append(self.document_metadata[idx])

        return results, scores, metadata

    def get_answer(
        self,
        question: str,
        chat_history: List[Tuple[str, str]] = None
    ) -> Dict[str, Any]:
        """Get answer to question using RAG"""
        start_time = datetime.now()

        # Search for relevant documents
        relevant_docs, scores, metadata = self.search(question)

        # Check if we have good matches
        best_score = scores[0] if scores else 0.0
        logger.info(f"Best similarity score: {best_score:.4f}")

        # Prepare context from retrieved documents
        context_parts = []
        for i, (doc, score, meta) in enumerate(zip(relevant_docs, scores, metadata)):
            if score >= self.similarity_threshold:
                source = meta.get("title", meta.get("source", ""))
                context_parts.append(f"[{i+1}] {doc}\n(Kaynak: {source})")

        context = "\n\n".join(context_parts)

        # Generate answer using LLM
        if context:
            # Use context from site
            prompt = self.prompt_template.format(context=context, question=question)
            response = self.llm.predict(prompt)
            source_type = "site_content"
            confidence = best_score
        else:
            # No good context found
            response = "Bu konuda sitemizdeki içeriklerde yeterli bilgi bulamadım. Daha spesifik bir soru sorabilir veya web araması yapabilirim."
            source_type = "insufficient_context"
            confidence = 0.0

        # Calculate response time
        response_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return {
            "answer": response,
            "source_type": source_type,
            "confidence": confidence,
            "documents_retrieved": len(relevant_docs),
            "similarity_scores": scores,
            "metadata": metadata,
            "response_time_ms": response_time_ms,
            "context_used": context[:500] if context else ""  # First 500 chars for logging
        }

    def chat(self, message: str, session_history: List[Dict] = None) -> Dict[str, Any]:
        """Main chat interface"""
        logger.info(f"User question: {message}")

        # Convert session history to LangChain format
        chat_history = []
        if session_history:
            for msg in session_history[-5:]:  # Last 5 messages for context
                if msg["role"] == "user":
                    user_msg = msg["content"]
                elif msg["role"] == "assistant":
                    chat_history.append((user_msg, msg["content"]))

        # Get answer
        result = self.get_answer(message, chat_history)

        logger.info(f"Answer generated in {result['response_time_ms']}ms (confidence: {result['confidence']:.4f})")

        return result


# CLI usage
if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv

    load_dotenv()

    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        print("❌ OPENAI_API_KEY not found in environment")
        sys.exit(1)

    chatbot = FinansRAGChatbot(openai_api_key=openai_key)

    if len(sys.argv) > 1 and sys.argv[1] == "index":
        # Build index from site content
        from data_loader import SiteContentLoader

        loader = SiteContentLoader()
        documents = loader.load_html_files()

        if documents:
            chatbot.build_index(documents)
            print(f"✅ Index built with {len(documents)} documents")
        else:
            print("❌ No documents found to index")
    else:
        # Interactive chat
        print("🤖 Finans Asistan - Soru sorun (çıkmak için 'quit')")
        print("-" * 50)

        history = []
        while True:
            question = input("\n👤 Siz: ").strip()
            if question.lower() in ["quit", "exit", "q"]:
                break

            result = chatbot.chat(question, history)
            print(f"\n🤖 Asistan: {result['answer']}")
            print(f"\n📊 (Confidence: {result['confidence']:.2f}, Time: {result['response_time_ms']}ms)")

            # Update history
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": result["answer"]})
