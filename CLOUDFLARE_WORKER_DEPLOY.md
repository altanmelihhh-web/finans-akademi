# 🚀 Cloudflare Worker Deployment - Market Data API

## Adım 1: Wrangler Kurulumu

```bash
npm install -g wrangler
```

## Adım 2: Cloudflare'e Login

```bash
wrangler login
```

Tarayıcı açılacak, Cloudflare hesabınızla giriş yapın.

## Adım 3: Worker'ı Deploy Et

```bash
cd /Users/melihcanaltan/Desktop/Finans
wrangler deploy
```

Deploy sonrası URL alacaksınız:
```
https://finans-akademi-market-data.YOUR-SUBDOMAIN.workers.dev
```

## Adım 4: Worker URL'sini Güncelle

`js/dynamic-market-loader.js` dosyasında 13. satırı güncelleyin:

```javascript
worker: 'https://finans-akademi-market-data.YOUR-SUBDOMAIN.workers.dev/api/market-data',
```

Örnek:
```javascript
worker: 'https://finans-akademi-market-data.melihcanaltan.workers.dev/api/market-data',
```

## Adım 5: KV Namespace Oluştur (Opsiyonel ama Önerilen)

Daha hızlı caching için:

```bash
wrangler kv:namespace create "MARKET_DATA_KV"
```

Output'u kopyalayın:
```
{ binding = "MARKET_DATA_KV", id = "xxxxxxxxxxxxx" }
```

`wrangler.toml` dosyasında comment'leri kaldırıp ID'yi ekleyin:

```toml
[[kv_namespaces]]
binding = "MARKET_DATA_KV"
id = "xxxxxxxxxxxxx"  # ← Buraya ID'nizi yazın
```

Tekrar deploy edin:
```bash
wrangler deploy
```

## Adım 6: Test Et

```bash
curl https://finans-akademi-market-data.YOUR-SUBDOMAIN.workers.dev/api/market-data
```

JSON response dönmeli! ✅

## 📊 API Endpoints

- `/api/market-data` - Tüm veriler (forex, crypto, stocks)
- `/api/market-data/forex` - Sadece döviz kurları
- `/api/market-data/crypto` - Sadece kripto paralar
- `/api/market-data/stocks/us` - Sadece ABD hisseleri
- `/api/market-data/stocks/bist` - Sadece BIST hisseleri

## 🔄 Otomatik Güncelleme (Cron Job)

`wrangler.toml` dosyasında cron kısmını aktif edin:

```toml
[triggers]
crons = ["*/5 * * * *"]  # Her 5 dakikada bir
```

Worker'da scheduled event handler ekleyin:

```javascript
export default {
    async scheduled(event, env, ctx) {
        // Cache'i yenile
        await fetch('https://finans-akademi-market-data.YOUR-SUBDOMAIN.workers.dev/api/market-data');
    },

    async fetch(request, env) {
        // ... mevcut kod
    }
}
```

Tekrar deploy:
```bash
wrangler deploy
```

## ✅ Doğrulama

1. **Worker çalışıyor mu?**
   ```bash
   curl https://YOUR-WORKER-URL.workers.dev/api/market-data
   ```

2. **Client'tan erişebiliyor mu?**
   Tarayıcı console'da:
   ```javascript
   await marketLoader.loadMarketData()
   ```

3. **Cache çalışıyor mu?**
   Response header'larda:
   ```
   X-Cache: HIT    // ✅ Cache'den geldi
   X-Cache: MISS   // ⚠️ API'den çekildi
   ```

## 🎯 Sonraki Adımlar

1. ✅ Worker deploy edildi
2. ✅ URL güncellendi
3. ✅ Client entegre edildi
4. ✅ Background updates aktif
5. 🔄 Firebase fallback hazır
6. 📱 iOS app test et!

## 🐛 Sorun Giderme

### CORS Hatası
Worker'da CORS header'lar zaten var, ancak domain özelleştirmesi için:

```javascript
'Access-Control-Allow-Origin': 'https://altanmelihhh-web.github.io'
```

### Rate Limit
Yahoo Finance rate limit verirse, batch size'ı azaltın:

```javascript
const batchSize = 5; // 10'dan 5'e düşür
```

### KV Slow
İlk KV write yavaş olabilir, normal. 2. request'ten itibaren hızlı!

---

**Deploy komutu:**
```bash
cd /Users/melihcanaltan/Desktop/Finans && wrangler deploy
```

🚀 Başarılar!
