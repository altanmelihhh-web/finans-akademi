# Cloudflare Worker - RSS Proxy

## 📋 Kurulum

### 1. Wrangler CLI Yükle (Cloudflare'in aracı)
```bash
npm install -g wrangler
```

### 2. Cloudflare'a Login
```bash
wrangler login
```

### 3. Worker'ı Deploy Et
```bash
cd workers
wrangler deploy
```

## 🚀 Kullanım

Worker deploy edildikten sonra şu URL'yi kullan:

```
https://rss-proxy.YOUR-SUBDOMAIN.workers.dev/?url=RSS_URL
```

### Örnek:
```
https://rss-proxy.YOUR-SUBDOMAIN.workers.dev/?url=https://www.foreks.com/rss/haber.xml
```

## 🔧 news.js'de Güncelleme

```javascript
// Worker URL'ini değiştir
this.workerUrl = 'https://rss-proxy.YOUR-SUBDOMAIN.workers.dev'
```

## ✅ Avantajlar

- ✅ CORS sorunu yok (Worker proxy görevi görür)
- ✅ Ücretsiz (100k request/gün)
- ✅ Hızlı (Cloudflare edge network)
- ✅ 5 dakika cache
- ✅ Tüm RSS feedleri çalışır
- ✅ XML'den JSON'a otomatik dönüşüm

## 📊 Limitler

**Cloudflare Workers Free Tier:**
- 100,000 request/gün
- 10ms CPU time/request
- Yeterli bir haber sitesi için!

## 🔄 Güncelleme

Worker kodunu değiştirdikten sonra:
```bash
wrangler deploy
```

## 🌐 Custom Domain (İsteğe Bağlı)

Kendi domain'inizde kullanmak için wrangler.toml'da:
```toml
routes = [
  { pattern = "yoursite.com/api/rss", custom_domain = true }
]
```
