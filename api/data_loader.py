"""
Finans Akademi - Site Content Loader
Extracts and prepares content from HTML files for RAG indexing
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from bs4 import BeautifulSoup
import html2text
from loguru import logger


class SiteContentLoader:
    """Loads and processes content from Finans Akademi website"""

    def __init__(self, site_root: str = "./"):
        self.site_root = Path(site_root)
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = False
        self.html_converter.ignore_images = True
        self.html_converter.body_width = 0

        # Content sections to extract
        self.content_sections = [
            "egitim",  # Eğitim içerikleri
            "terimler",  # Finans terimleri
            "grafikler",  # Grafik analizi
            "haberler",  # Haberler
            "kaynaklar",  # Kaynaklar
        ]

    def load_html_files(self, pages_to_index: List[str] = None) -> List[Dict[str, Any]]:
        """Load and parse HTML files from the site"""
        if pages_to_index is None:
            pages_to_index = [
                "index.html",
                "pages/markets.html",
                "pages/simulator.html",
            ]

        documents = []

        for page_path in pages_to_index:
            full_path = self.site_root / page_path
            if not full_path.exists():
                logger.warning(f"Page not found: {full_path}")
                continue

            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    html_content = f.read()

                docs = self._parse_html_page(html_content, page_path)
                documents.extend(docs)
                logger.info(f"Loaded {len(docs)} documents from {page_path}")

            except Exception as e:
                logger.error(f"Error loading {page_path}: {e}")

        logger.info(f"Total documents loaded: {len(documents)}")
        return documents

    def _parse_html_page(self, html_content: str, source_page: str) -> List[Dict[str, Any]]:
        """Parse HTML content and extract meaningful sections"""
        soup = BeautifulSoup(html_content, "lxml")
        documents = []

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()

        # Extract page title
        title = soup.find("title")
        page_title = title.get_text(strip=True) if title else source_page

        # Extract content sections
        for section_id in self.content_sections:
            section = soup.find(id=section_id)
            if section:
                docs = self._extract_section_content(section, section_id, source_page)
                documents.extend(docs)

        # Extract education weeks (Hafta 1, 2, 3, etc.)
        week_sections = soup.find_all("div", class_="week-container")
        for week in week_sections:
            docs = self._extract_week_content(week, source_page)
            documents.extend(docs)

        # Extract financial terms
        term_cards = soup.find_all("div", class_="term-card")
        for term_card in term_cards:
            doc = self._extract_term_card(term_card, source_page)
            if doc:
                documents.append(doc)

        # Extract market data sections
        market_cards = soup.find_all("div", class_="market-card")
        for market_card in market_cards:
            doc = self._extract_market_card(market_card, source_page)
            if doc:
                documents.append(doc)

        # If no specific sections found, extract main content
        if not documents:
            main_content = soup.find("main") or soup.find("body")
            if main_content:
                text = self._clean_text(main_content.get_text(separator="\n"))
                if len(text) > 100:  # Minimum content length
                    documents.append({
                        "content": text,
                        "metadata": {
                            "source": source_page,
                            "title": page_title,
                            "type": "general",
                            "extracted_at": datetime.now().isoformat()
                        }
                    })

        return documents

    def _extract_section_content(self, section, section_id: str, source_page: str) -> List[Dict[str, Any]]:
        """Extract content from a specific section"""
        documents = []

        # Get section title
        title_elem = section.find(["h1", "h2", "h3"])
        section_title = title_elem.get_text(strip=True) if title_elem else section_id

        # Extract paragraphs and lists
        content_elements = section.find_all(["p", "ul", "ol", "div"], recursive=True)

        for elem in content_elements:
            text = self._clean_text(elem.get_text(separator="\n"))
            if len(text) > 50:  # Minimum meaningful content
                documents.append({
                    "content": text,
                    "metadata": {
                        "source": source_page,
                        "section": section_id,
                        "title": section_title,
                        "type": "section_content",
                        "extracted_at": datetime.now().isoformat()
                    }
                })

        return documents

    def _extract_week_content(self, week_elem, source_page: str) -> List[Dict[str, Any]]:
        """Extract education week content"""
        documents = []

        # Get week title
        week_title = week_elem.find("h3")
        title = week_title.get_text(strip=True) if week_title else "Eğitim Haftası"

        # Extract day contents
        day_sections = week_elem.find_all("div", class_="day-section")
        for day in day_sections:
            day_title = day.find("h4")
            day_name = day_title.get_text(strip=True) if day_title else ""

            # Get all text content from day
            text = self._clean_text(day.get_text(separator="\n"))

            if len(text) > 100:
                documents.append({
                    "content": text,
                    "metadata": {
                        "source": source_page,
                        "section": "egitim",
                        "week": title,
                        "day": day_name,
                        "title": f"{title} - {day_name}",
                        "type": "education_content",
                        "extracted_at": datetime.now().isoformat()
                    }
                })

        return documents

    def _extract_term_card(self, card_elem, source_page: str) -> Dict[str, Any]:
        """Extract financial term from term card"""
        term_name = card_elem.find("h3")
        term_definition = card_elem.find("p")

        if not term_name:
            return None

        name = term_name.get_text(strip=True)
        definition = term_definition.get_text(strip=True) if term_definition else ""

        content = f"**{name}**: {definition}"

        return {
            "content": content,
            "metadata": {
                "source": source_page,
                "section": "terimler",
                "term": name,
                "title": name,
                "type": "financial_term",
                "extracted_at": datetime.now().isoformat()
            }
        }

    def _extract_market_card(self, card_elem, source_page: str) -> Dict[str, Any]:
        """Extract market data card content"""
        header = card_elem.find("h3")
        if not header:
            return None

        title = header.get_text(strip=True)
        content = self._clean_text(card_elem.get_text(separator="\n"))

        if len(content) < 50:
            return None

        return {
            "content": content,
            "metadata": {
                "source": source_page,
                "section": "markets",
                "title": title,
                "type": "market_data",
                "extracted_at": datetime.now().isoformat()
            }
        }

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        # Remove extra whitespace
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line]
        text = "\n".join(lines)

        # Remove multiple consecutive newlines
        while "\n\n\n" in text:
            text = text.replace("\n\n\n", "\n\n")

        return text.strip()

    def save_documents(self, documents: List[Dict[str, Any]], output_path: str = "./data/site_content.json"):
        """Save extracted documents to JSON file"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(documents, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved {len(documents)} documents to {output_path}")

    def load_documents(self, input_path: str = "./data/site_content.json") -> List[Dict[str, Any]]:
        """Load previously extracted documents from JSON file"""
        input_file = Path(input_path)

        if not input_file.exists():
            logger.warning(f"No saved documents found at {input_path}")
            return []

        with open(input_file, "r", encoding="utf-8") as f:
            documents = json.load(f)

        logger.info(f"Loaded {len(documents)} documents from {input_path}")
        return documents


# CLI usage
if __name__ == "__main__":
    import sys

    loader = SiteContentLoader()

    if len(sys.argv) > 1 and sys.argv[1] == "extract":
        # Extract content from site
        documents = loader.load_html_files()
        loader.save_documents(documents)
        print(f"✅ Extracted {len(documents)} documents")
    else:
        # Load existing documents
        documents = loader.load_documents()
        print(f"✅ Loaded {len(documents)} documents")

        # Print sample
        if documents:
            print("\n📄 Sample document:")
            print(json.dumps(documents[0], ensure_ascii=False, indent=2))
