"""
Finans Akademi - Enhanced LangChain Chatbot with Web Search
RAG + DuckDuckGo fallback for comprehensive answers
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from loguru import logger
from duckduckgo_search import DDGS

from rag_chatbot import FinansRAGChatbot


class EnhancedFinansChatbot(FinansRAGChatbot):
    """
    Enhanced chatbot with web search fallback

    Strategy:
    1. Try site content first (RAG with FAISS)
    2. If confidence < threshold, supplement with web search
    3. Combine both sources for comprehensive answer
    """

    def __init__(
        self,
        openai_api_key: str,
        faiss_index_path: str = "./data/faiss_index",
        embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        llm_model: str = "gpt-4-turbo-preview",
        top_k: int = 5,
        similarity_threshold: float = 0.7,
        web_search_enabled: bool = True,
        web_search_threshold: float = 0.6,
        trusted_sources: List[str] = None
    ):
        super().__init__(
            openai_api_key=openai_api_key,
            faiss_index_path=faiss_index_path,
            embedding_model=embedding_model,
            llm_model=llm_model,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )

        self.web_search_enabled = web_search_enabled
        self.web_search_threshold = web_search_threshold

        # Trusted Turkish finance sources
        if trusted_sources is None:
            self.trusted_sources = [
                "investing.com",
                "bigpara.com",
                "mynet.com",
                "doviz.com",
                "bloomberght.com",
                "reuters.com",
                "aa.com.tr",  # Anadolu Ajansı
                "ekonomim.com",
                "dunya.com"
            ]
        else:
            self.trusted_sources = trusted_sources

        # DuckDuckGo search
        self.ddgs = DDGS()

        logger.info(f"Enhanced chatbot initialized (web_search={'enabled' if web_search_enabled else 'disabled'})")

    def web_search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Perform web search using DuckDuckGo

        Args:
            query: Search query
            max_results: Maximum number of results to return

        Returns:
            List of search results with title, url, snippet
        """
        try:
            logger.info(f"Performing web search: {query}")

            # Add "Türkiye" or "finans" to make it more relevant
            search_query = f"{query} finans Türkiye"

            results = []
            search_results = self.ddgs.text(search_query, max_results=max_results * 2)

            # Filter and prioritize trusted sources
            trusted_results = []
            other_results = []

            for result in search_results:
                url = result.get("href", "")
                title = result.get("title", "")
                snippet = result.get("body", "")

                # Check if from trusted source
                is_trusted = any(source in url.lower() for source in self.trusted_sources)

                result_data = {
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "is_trusted": is_trusted
                }

                if is_trusted:
                    trusted_results.append(result_data)
                else:
                    other_results.append(result_data)

                # Stop if we have enough results
                if len(trusted_results) >= max_results:
                    break

            # Combine results, prioritizing trusted sources
            results = (trusted_results + other_results)[:max_results]

            logger.info(f"Found {len(results)} web search results ({len(trusted_results)} from trusted sources)")
            return results

        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return []

    def get_enhanced_answer(
        self,
        question: str,
        chat_history: List[Dict] = None,
        force_web_search: bool = False
    ) -> Dict[str, Any]:
        """
        Get answer using hybrid approach (site content + web search)

        Args:
            question: User's question
            chat_history: Previous conversation
            force_web_search: Force web search even if site content is good

        Returns:
            Answer with metadata
        """
        start_time = datetime.now()

        # Step 1: Get answer from site content (RAG)
        site_result = self.get_answer(question, chat_history)
        site_confidence = site_result["confidence"]

        logger.info(f"Site content confidence: {site_confidence:.4f}")

        # Step 2: Decide if web search is needed
        need_web_search = (
            self.web_search_enabled and
            (force_web_search or site_confidence < self.web_search_threshold)
        )

        web_results = []
        final_answer = site_result["answer"]
        source_type = site_result["source_type"]

        if need_web_search:
            logger.info("Performing web search for additional context")
            web_results = self.web_search(question)

            if web_results:
                # Step 3: Combine site content + web search results
                web_context = self._format_web_results(web_results)

                # Create enhanced prompt
                enhanced_prompt = f"""Sana iki kaynak veriyorum:

**Site İçeriğimizden:**
{site_result.get('context_used', 'Bilgi bulunamadı')}

**Web Araması Sonuçları:**
{web_context}

Soru: {question}

Lütfen her iki kaynağı da kullanarak Türkçe, detaylı ve anlaşılır bir cevap ver.
Eğer web'den bilgi kullanıyorsan, kaynağı belirt."""

                final_answer = self.llm.predict(enhanced_prompt)
                source_type = "hybrid" if site_confidence > 0.3 else "web_search"

        # Calculate total response time
        response_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return {
            "answer": final_answer,
            "source_type": source_type,
            "confidence": site_confidence,
            "documents_retrieved": site_result["documents_retrieved"],
            "similarity_scores": site_result["similarity_scores"],
            "metadata": site_result["metadata"],
            "web_search_performed": need_web_search,
            "web_sources": web_results if need_web_search else [],
            "response_time_ms": response_time_ms
        }

    def _format_web_results(self, web_results: List[Dict[str, Any]]) -> str:
        """Format web search results for LLM context"""
        formatted = []

        for i, result in enumerate(web_results, 1):
            title = result["title"]
            snippet = result["snippet"]
            url = result["url"]
            trusted = "✓ Güvenilir kaynak" if result["is_trusted"] else ""

            formatted.append(f"""[{i}] {title} {trusted}
{snippet}
Kaynak: {url}
""")

        return "\n\n".join(formatted)

    def chat(
        self,
        message: str,
        session_history: List[Dict] = None,
        force_web_search: bool = False
    ) -> Dict[str, Any]:
        """
        Main chat interface with enhanced features

        Args:
            message: User's message
            session_history: Previous conversation
            force_web_search: Force web search

        Returns:
            Response with metadata
        """
        logger.info(f"User question: {message}")

        # Detect if user explicitly asks for web search
        web_search_keywords = ["ara", "bul", "güncel", "son", "haber", "web"]
        if any(keyword in message.lower() for keyword in web_search_keywords):
            force_web_search = True
            logger.info("Web search forced (user keyword detected)")

        # Get enhanced answer
        result = self.get_enhanced_answer(
            message,
            session_history,
            force_web_search
        )

        logger.info(
            f"Answer generated in {result['response_time_ms']}ms "
            f"(confidence: {result['confidence']:.4f}, "
            f"source: {result['source_type']})"
        )

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

    # Initialize enhanced chatbot
    chatbot = EnhancedFinansChatbot(
        openai_api_key=openai_key,
        web_search_enabled=True
    )

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test queries
        test_questions = [
            "Hisse senedi nedir?",  # Should use site content
            "BIST 100 bugün nasıl?",  # Should trigger web search
            "RSI göstergesi nasıl kullanılır?",  # Should use site content
            "Dolar kuru son durum nedir?",  # Should trigger web search
        ]

        for question in test_questions:
            print(f"\n{'='*60}")
            print(f"❓ {question}")
            print('='*60)

            result = chatbot.chat(question)
            print(f"\n💬 {result['answer']}\n")
            print(f"📊 Source: {result['source_type']}, "
                  f"Confidence: {result['confidence']:.2f}, "
                  f"Time: {result['response_time_ms']}ms")

            if result['web_sources']:
                print(f"\n🌐 Web kaynakları:")
                for src in result['web_sources'][:3]:
                    print(f"  - {src['title']}")

    else:
        # Interactive chat
        print("🤖 Finans Asistan - Gelişmiş Sürüm")
        print("💡 Web araması için 'ara', 'güncel', 'son' gibi kelimeler kullanın")
        print("📝 Çıkmak için 'quit'")
        print("-" * 60)

        history = []
        while True:
            question = input("\n👤 Siz: ").strip()
            if question.lower() in ["quit", "exit", "q"]:
                break

            result = chatbot.chat(question, history)
            print(f"\n🤖 Asistan: {result['answer']}")

            # Show metadata
            print(f"\n📊 (Source: {result['source_type']}, "
                  f"Confidence: {result['confidence']:.2f}, "
                  f"Time: {result['response_time_ms']}ms)")

            if result['web_sources']:
                print(f"🌐 Kullanılan web kaynakları: {len(result['web_sources'])}")

            # Update history
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": result["answer"]})
