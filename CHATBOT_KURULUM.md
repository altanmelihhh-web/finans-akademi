# 🚀 Chatbot Hızlı Kurulum Kılavuzu

## ✅ Düzeltilen Sorunlar

### 1. Chatbot Görünmüyor Sorunu - ÇÖZÜLDÜ ✓
**Neden:** DOMContentLoaded event timing sorunu
**Çözüm:** js/chatbot.js güncellendi - hem early hem late initialization destekleniyor

### 2. Sayfa Sığmıyor (%100 zoom) - ÇÖZÜLDÜ ✓
**Neden:** Grid ve table elementleri overflow yapıyordu
**Çözüm:**
- `css/viewport-fix.css` eklendi
- `css/markets.css` responsive yapıldı
- Global overflow-x kontrolü

## 🧪 Test Etme

### Chatbot'u Test Et
1. Tarayıcıda şu dosyayı aç:
   ```
   test-chatbot.html
   ```

2. Kontrol edilecekler:
   - ✅ Sağ alt köşede mor chatbot butonu var mı?
   - ✅ Console'da "✅ Finans Chatbot initialized" yazıyor mu? (F12 tuşu)
   - ✅ Butona tıklayınca pencere açılıyor mu?

3. Eğer chatbot görünmüyorsa:
   - F12 ile console'u aç
   - Hata mesajlarını kontrol et
   - `window.finansChatbot` yaz ve Enter'a bas - object dönmeli

### Viewport Testi
1. Tarayıcı zoom'unu %100 yap (Cmd/Ctrl + 0)
2. Sayfayı yenile
3. Yatay scroll bar olmamalı ✓
4. Tüm içerik ekrana sığmalı ✓

## 🔧 Hızlı Kurulum

### Adım 1: Python ve Bağımlılıklar

```bash
# Kurulum scriptini çalıştır
bash scripts/setup.sh

# Manuel kurulum isterseniz:
python3 -m venv venv
source venv/bin/activate
pip install -r config/requirements.txt
```

### Adım 2: Konfigürasyon

```bash
# .env dosyasını oluştur
cp config/.env.example config/.env

# .env dosyasını düzenle
nano config/.env
```

**Minimum gerekli ayarlar:**
```bash
OPENAI_API_KEY=sk-your-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finans_chatbot
DB_USER=postgres
DB_PASSWORD=your-password
```

### Adım 3: Database

```bash
# PostgreSQL'de database oluştur
psql -U postgres -c "CREATE DATABASE finans_chatbot;"

# Schema'yı yükle
psql -U postgres -d finans_chatbot -f database/create_chat_audit_logs.sql
```

### Adım 4: FAISS Index Oluştur

```bash
# Virtual environment'ı aktifleştir
source venv/bin/activate

# Site içeriğini index'le
python3 api/data_sync.py
```

Çıktı:
```
Loading site content...
Loaded 150 documents from site
Building FAISS index...
Created 450 chunks from 150 documents
✅ FAISS index built with 450 vectors
✅ Content sync completed successfully
```

### Adım 5: API Server'ı Başlat

```bash
# Server'ı başlat
bash scripts/start_api.sh
```

Çıktı:
```
🚀 Starting Finans Akademi Chatbot API...
📡 Starting server on http://0.0.0.0:8000
🔄 Workers: 4
```

### Adım 6: Test Et

1. Tarayıcıda `index.html` aç
2. Sağ altta chatbot butonu görünmeli 🟣
3. Butona tıkla
4. "Hisse senedi nedir?" diye sor
5. Cevap gelmeli!

## 🐛 Sorun Giderme

### Chatbot Butonu Görünmüyor

**Kontrol 1:** CSS yüklendi mi?
```javascript
// Browser console'da:
getComputedStyle(document.querySelector('.chat-toggle'))
// Object dönmeli
```

**Kontrol 2:** JS yüklendi mi?
```javascript
// Browser console'da:
window.finansChatbot
// FinansChatbot object dönmeli
```

**Kontrol 3:** DOM element var mı?
```javascript
// Browser console'da:
document.getElementById('chat-toggle')
// <button> element dönmeli
```

**Çözüm:** Hard refresh yap (Cmd+Shift+R veya Ctrl+Shift+R)

### API Server Başlamıyor

**Hata:** `OPENAI_API_KEY not configured`
```bash
# .env dosyasını kontrol et
cat config/.env | grep OPENAI_API_KEY

# Yoksa ekle
echo "OPENAI_API_KEY=sk-your-key" >> config/.env
```

**Hata:** `Database connection failed`
```bash
# PostgreSQL çalışıyor mu?
pg_isready

# Database var mı?
psql -U postgres -l | grep finans_chatbot

# Yoksa oluştur
psql -U postgres -c "CREATE DATABASE finans_chatbot;"
```

**Hata:** `Port 8000 already in use`
```bash
# Port'u değiştir
echo "API_PORT=8001" >> config/.env

# Veya mevcut process'i öldür
lsof -ti:8000 | xargs kill -9
```

### FAISS Index Yüklenemiyor

```bash
# Index var mı kontrol et
ls -la data/faiss_index/

# Yoksa yeniden oluştur
rm -rf data/faiss_index
python3 api/data_sync.py
```

### Chatbot Cevap Vermiyor

**Kontrol 1:** API çalışıyor mu?
```bash
curl http://localhost:8000/health
```

**Kontrol 2:** PHP API Gateway çalışıyor mu?
```bash
# Browser'da:
# http://localhost/api/chat-api.php
# veya PHP server başlat:
php -S localhost:8080
```

**Kontrol 3:** Network tab'ı kontrol et (F12)
- POST isteği `api/chat-api.php`'ye gidiyor mu?
- Response 200 OK mi?
- Error varsa ne diyor?

### Viewport Hala Taşıyor

1. Hard refresh yap (Cmd+Shift+R)
2. Cache'i temizle
3. `css/viewport-fix.css` yüklendi mi kontrol et:
```javascript
// Browser console:
[...document.styleSheets].find(s => s.href?.includes('viewport-fix'))
```

## 📊 Sistem Durumu Kontrolü

### Health Check
```bash
# API health
curl http://localhost:8000/health

# Beklenen response:
{
  "status": "healthy",
  "chatbot_initialized": true,
  "faiss_index_loaded": true,
  "document_count": 450,
  "web_search_enabled": true
}
```

### Database Kontrolü
```sql
-- PostgreSQL'de
psql -U postgres -d finans_chatbot

-- Table'lar var mı?
\dt

-- Mesaj sayısı
SELECT COUNT(*) FROM chat_messages;

-- Son 5 mesaj
SELECT message_type, LEFT(message_text, 50) as message
FROM chat_messages
ORDER BY created_at DESC
LIMIT 5;
```

### Log Kontrolü
```bash
# Chatbot logs
tail -f logs/chatbot.log

# Sync logs
tail -f logs/sync.log

# Security logs
tail -f logs/security.log
```

## 🎯 Hızlı Komutlar

```bash
# Setup
bash scripts/setup.sh

# Start API
bash scripts/start_api.sh

# Sync content
python3 api/data_sync.py

# Test chatbot
python3 api/langchain_chatbot.py

# Setup cron
bash scripts/setup_cron.sh

# View logs
tail -f logs/chatbot.log
```

## ✅ Başarılı Kurulum Göstergeleri

1. ✅ Tarayıcıda sağ alt köşede mor chatbot butonu var
2. ✅ Console'da "✅ Finans Chatbot initialized" mesajı var
3. ✅ API health check 200 OK dönüyor
4. ✅ Database'de chat_sessions table'ı var
5. ✅ data/faiss_index/ klasörü dolu
6. ✅ Chatbot'a soru sorulduğunda cevap geliyor
7. ✅ Sayfa %100 zoom'da düzgün görünüyor

## 📞 Yardım

Sorun devam ediyorsa:
1. `test-chatbot.html` dosyasını aç
2. Console'daki hataları kaydet
3. Network tab'ını kontrol et
4. `CHATBOT_README.md` dosyasına bak

---

**Son güncelleme:** 2025-10-31
**Durum:** ✅ Çalışıyor
