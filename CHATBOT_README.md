# 🤖 Finans Akademi - AI Chatbot

Akıllı finans asistanı - RAG (Retrieval-Augmented Generation) ve web araması ile güçlendirilmiş.

## 📋 Özellikler

### 🎯 Temel Özellikler
- ✅ **RAG (Retrieval-Augmented Generation)**: Site içeriğinizden akıllı arama
- ✅ **FAISS Vektör Database**: Hızlı ve verimli similarity search
- ✅ **Web Search Fallback**: Site içeriği yetersizse DuckDuckGo ile arama
- ✅ **LangChain Integration**: Gelişmiş LLM orchestration
- ✅ **GPT-4 Powered**: OpenAI'nin en güçlü modeli
- ✅ **Türkçe Optimize**: Türkçe dil desteği ve embeddings

### 🔒 Güvenlik
- ✅ Rate limiting (dakikada 20 istek)
- ✅ Input validation ve sanitization
- ✅ SQL injection, XSS, command injection koruması
- ✅ CORS policy
- ✅ Security event logging
- ✅ Session management

### 📊 Logging & Analytics
- ✅ PostgreSQL'de tam audit log
- ✅ Kullanıcı mesajları ve bot cevapları
- ✅ Confidence score tracking
- ✅ Response time metrics
- ✅ Web search metadata
- ✅ User feedback collection

### 🎨 Frontend
- ✅ Modern, responsive chat widget
- ✅ Dark mode desteği
- ✅ Typing indicators
- ✅ Source attribution (kaynak gösterimi)
- ✅ Mobile-friendly
- ✅ Session persistence (localStorage)

## 🏗️ Mimari

```
┌─────────────┐
│   Frontend  │ (chatbot.js + chatbot.css)
│  Chat Widget│
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────┐
│  PHP Gateway │ (chat-api.php)
│  + Security  │ - Rate limiting
│  + Logging   │ - Input validation
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────┐
│   FastAPI    │ (api.py)
│   Backend    │
└──────┬───────┘
       │
   ┌───┴────┐
   ▼        ▼
┌─────┐  ┌────────┐
│FAISS│  │  GPT-4 │
│Index│  │OpenAI  │
└─────┘  └────────┘
   │
   ▼
┌─────────────┐
│ DuckDuckGo  │
│ Web Search  │
└─────────────┘
```

## 📦 Kurulum

### 1. Gereksinimler

- **Python 3.8+**
- **PostgreSQL 12+**
- **PHP 7.4+** (site için)
- **OpenAI API Key** ([platform.openai.com](https://platform.openai.com))

### 2. Hızlı Kurulum

```bash
# 1. Setup script'ini çalıştır
bash scripts/setup.sh

# 2. .env dosyasını düzenle
nano config/.env
# OPENAI_API_KEY ve database ayarlarını gir

# 3. Database oluştur (eğer setup sırasında yapmadıysan)
psql -U postgres -c "CREATE DATABASE finans_chatbot;"
psql -U postgres -d finans_chatbot -f database/create_chat_audit_logs.sql

# 4. İlk index'i oluştur
source venv/bin/activate
python3 api/data_sync.py

# 5. API server'ı başlat
bash scripts/start_api.sh
```

### 3. Frontend Entegrasyonu

`index.html` dosyanıza ekleyin:

```html
<!-- Chatbot CSS -->
<link rel="stylesheet" href="css/chatbot.css">

<!-- Chatbot JS (</body> öncesi) -->
<script src="js/chatbot.js"></script>
```

## 🚀 Kullanım

### API Server'ı Başlatma

```bash
# Geliştirme (auto-reload)
bash scripts/start_api.sh

# Production (multiple workers)
# config/.env içinde API_WORKERS=4 olarak ayarlayın
```

### Manuel İndex Güncelleme

```bash
# Site içeriğini yeniden index'le
python3 api/data_sync.py
```

### Otomatik Senkronizasyon (Cron)

```bash
# Cron job kur (her gün saat 2'de)
bash scripts/setup_cron.sh

# Cron job'ları kontrol et
crontab -l
```

### Test Etme

```bash
# Interactive chat test
python3 api/langchain_chatbot.py

# Test sorularıyla
python3 api/langchain_chatbot.py test
```

## 🔧 Yapılandırma

### Önemli .env Ayarları

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview  # veya gpt-3.5-turbo (ucuz)

# RAG Settings
RAG_TOP_K=5                        # Kaç doküman getirsin
RAG_SIMILARITY_THRESHOLD=0.7       # Minimum benzerlik skoru

# Web Search
WEB_SEARCH_ENABLED=true
WEB_SEARCH_THRESHOLD=0.6          # Bu skorun altında web ara

# Rate Limiting
RATE_LIMIT_PER_MINUTE=20
RATE_LIMIT_PER_HOUR=100
```

## 📊 API Endpoints

### POST /chat
Chatbot ile konuş

**Request:**
```json
{
  "message": "Hisse senedi nedir?",
  "session_id": "uuid",
  "history": [],
  "force_web_search": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Hisse senedi...",
    "session_id": "uuid",
    "source_type": "site_content",
    "confidence": 0.92,
    "web_search_performed": false,
    "web_sources": [],
    "response_time_ms": 1234
  }
}
```

### GET /health
Sistem durumu

### POST /index/rebuild
FAISS index'i yeniden oluştur

### GET /index/stats
Index istatistikleri

## 📈 Monitoring

### Loglar

```bash
# Chatbot logs
tail -f logs/chatbot.log

# Sync logs
tail -f logs/sync.log

# Security logs
tail -f logs/security.log

# Cron logs
tail -f logs/cron.log
```

### Database Analytics

```sql
-- Günlük mesaj sayısı
SELECT DATE(created_at) as date, COUNT(*) as messages
FROM chat_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Kaynak tipine göre dağılım
SELECT source_type, COUNT(*) as count
FROM chat_messages
WHERE message_type = 'assistant'
GROUP BY source_type;

-- Ortalama confidence ve response time
SELECT
    AVG(confidence_score) as avg_confidence,
    AVG(response_time_ms) as avg_response_time,
    source_type
FROM chat_messages
WHERE message_type = 'assistant'
GROUP BY source_type;

-- Analytics view
SELECT * FROM chat_analytics
ORDER BY session_start DESC
LIMIT 10;
```

## 🎨 Özelleştirme

### Chatbot Prompt'u Değiştirme

`api/rag_chatbot.py` dosyasında:

```python
self.system_prompt = """Sen Finans Akademi'nin asistanısın...
[Prompt'u buradan özelleştirin]
"""
```

### Embedding Modeli Değiştirme

```python
# Türkçe için alternatif modeller
embedding_model = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
embedding_model = "intfloat/multilingual-e5-large"
```

### Chat Widget Görünümü

`css/chatbot.css` dosyasını düzenleyin.

## 🐛 Troubleshooting

### FAISS Index Hatası
```bash
# Index'i sil ve yeniden oluştur
rm -rf data/faiss_index
python3 api/data_sync.py
```

### OpenAI Rate Limit
```bash
# .env içinde daha ucuz model kullan
OPENAI_MODEL=gpt-3.5-turbo
```

### PostgreSQL Bağlantı Hatası
```bash
# PostgreSQL çalışıyor mu?
pg_isready

# Credentials doğru mu?
psql -U postgres -d finans_chatbot
```

### Port Kullanımda
```bash
# Port 8000 kullanımda mı?
lsof -i :8000

# Farklı port kullan
# .env içinde API_PORT=8001
```

## 📝 Geliştirme

### Yeni Kaynak Ekleme

1. Site'ye yeni sayfa ekle
2. `config/.env` içinde `PAGES_TO_INDEX` güncelle
3. Sync çalıştır: `python3 api/data_sync.py`

### Custom Embedding Model

```python
# api/rag_chatbot.py
self.embedding_model = YourCustomModel()
```

### Feedback Sistemi

```javascript
// Frontend'de feedback butonu ekle
fetch('api/chat-api.php', {
  method: 'POST',
  body: JSON.stringify({
    action: 'feedback',
    session_id: sessionId,
    message_id: messageId,
    rating: 5
  })
});
```

## 🔐 Güvenlik Notları

1. **API Key'leri asla commit etmeyin**
2. **Production'da HTTPS kullanın**
3. **Rate limiting ayarlarını test edin**
4. **.env dosyasını .gitignore'a ekleyin**
5. **PostgreSQL şifresi güçlü olsun**

## 📞 Destek

Sorun mu var?

1. Logları kontrol et: `logs/*.log`
2. Database'i kontrol et: PostgreSQL logs
3. API health check: `curl http://localhost:8000/health`

## 📜 Lisans

Bu proje Finans Akademi için özel olarak geliştirilmiştir.

---

**Geliştirici:** Claude Code
**Tarih:** 2025-10-31
**Versiyon:** 1.0.0
