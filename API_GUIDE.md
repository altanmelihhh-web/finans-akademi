# 🔌 API Entegrasyon Rehberi

Bu rehber, Finans Akademi uygulamasına gerçek zamanlı piyasa verilerini nasıl entegre edeceğinizi gösterir.

## 📋 İçindekiler

1. [Alpha Vantage (ABD Piyasaları)](#1-alpha-vantage)
2. [Finnhub (Hisse Senedi)](#2-finnhub)
3. [TCMB EVDS (Türkiye)](#3-tcmb-evds)
4. [Yahoo Finance (Alternatif)](#4-yahoo-finance)
5. [TradingView Widget](#5-tradingview-widget)
6. [Backend Proxy Kurulumu](#6-backend-proxy)

---

## 1. Alpha Vantage

### Kayıt ve API Key Alma
1. https://www.alphavantage.co/support/#api-key adresine git
2. Email adresini gir
3. API key'i al (örnek: `ABCD1234EFGH5678`)

### Kullanım Örneği

```javascript
// js/app.js dosyasında

const ALPHA_VANTAGE_KEY = 'SENİN_API_KEY';

async function getStockPrice(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data['Global Quote']) {
            return {
                symbol: symbol,
                price: parseFloat(data['Global Quote']['05. price']),
                change: parseFloat(data['Global Quote']['09. change']),
                changePercent: parseFloat(data['Global Quote']['10. change percent'].replace('%', ''))
            };
        }
    } catch (error) {
        console.error('Alpha Vantage error:', error);
        return null;
    }
}

// Kullanım
const appleData = await getStockPrice('AAPL');
console.log(appleData);
```

### Limitler
- **Ücretsiz**: 5 istek/dakika, 500 istek/gün
- **Premium**: Daha yüksek limitler ($49.99/ay'dan başlayan)

---

## 2. Finnhub

### Kayıt
1. https://finnhub.io/register adresine git
2. Hesap oluştur
3. Dashboard'dan API key'i kopyala

### Kullanım Örneği

```javascript
const FINNHUB_KEY = 'SENİN_FINNHUB_KEY';

async function getFinnhubQuote(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            symbol: symbol,
            current: data.c,  // Current price
            change: data.d,   // Change
            percentChange: data.dp,  // Percent change
            high: data.h,     // High price of the day
            low: data.l,      // Low price of the day
            open: data.o,     // Open price of the day
            previousClose: data.pc  // Previous close price
        };
    } catch (error) {
        console.error('Finnhub error:', error);
        return null;
    }
}

// Kullanım
const teslaData = await getFinnhubQuote('TSLA');
```

### Özellikler
- Gerçek zamanlı hisse senedi verileri
- Şirket haberleri
- Finansal raporlar
- Teknik göstergeler

---

## 3. TCMB EVDS (Türkiye)

### Kayıt
1. https://evds2.tcmb.gov.tr/ adresine git
2. Kayıt ol
3. API Key'i al

### Döviz Kuru Örneği

```javascript
const TCMB_KEY = 'SENİN_TCMB_KEY';

async function getExchangeRates() {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A-TP.DK.EUR.A&startDate=${today}&endDate=${today}&type=json`;

    try {
        const response = await fetch(url, {
            headers: {
                'key': TCMB_KEY
            }
        });
        const data = await response.json();

        return {
            usdtry: parseFloat(data.items[0]['TP.DK.USD.A']),
            eurtry: parseFloat(data.items[0]['TP.DK.EUR.A'])
        };
    } catch (error) {
        console.error('TCMB error:', error);
        return null;
    }
}
```

### Kullanılabilir Veriler
- Döviz kurları
- Faiz oranları
- Enflasyon
- Para arzı
- Ekonomik göstergeler

---

## 4. Yahoo Finance (Alternatif)

Yahoo Finance'in resmi API'si artık ücretli. Alternatif olarak:

### yfinance Python Library (Backend için)
```python
import yfinance as yf

def get_stock_data(symbol):
    stock = yf.Ticker(symbol)
    return {
        'price': stock.info['currentPrice'],
        'change': stock.info['regularMarketChange'],
        'changePercent': stock.info['regularMarketChangePercent']
    }
```

### RapidAPI Yahoo Finance
```javascript
const RAPID_API_KEY = 'SENİN_RAPIDAPI_KEY';

async function getYahooFinanceData(symbol) {
    const url = `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${symbol}`;

    const response = await fetch(url, {
        headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
        }
    });

    return await response.json();
}
```

---

## 5. TradingView Widget

TradingView, ücretsiz ve güçlü widget'lar sunar. API key gerekmez!

### Fiyat Grafiği Widget

```html
<!-- index.html içine ekle -->
<div id="tradingview-widget" style="height: 500px;"></div>

<script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
<script type="text/javascript">
new TradingView.widget({
    "width": "100%",
    "height": 500,
    "symbol": "NASDAQ:AAPL",
    "interval": "D",
    "timezone": "Europe/Istanbul",
    "theme": "dark",
    "style": "1",
    "locale": "tr",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "allow_symbol_change": true,
    "container_id": "tradingview-widget"
});
</script>
```

### Market Overview Widget

```html
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js" async>
  {
  "colorTheme": "dark",
  "dateRange": "12M",
  "showChart": true,
  "locale": "tr",
  "largeChartUrl": "",
  "isTransparent": false,
  "showSymbolLogo": true,
  "showFloatingTooltip": false,
  "width": "100%",
  "height": "600",
  "tabs": [
    {
      "title": "ABD",
      "symbols": [
        {"s": "NASDAQ:AAPL"},
        {"s": "NASDAQ:MSFT"},
        {"s": "NASDAQ:TSLA"}
      ]
    },
    {
      "title": "Türkiye",
      "symbols": [
        {"s": "BIST:XU100"},
        {"s": "BIST:THYAO"},
        {"s": "BIST:GARAN"}
      ]
    }
  ]
  }
  </script>
</div>
```

**Daha fazla widget**: https://www.tradingview.com/widget/

---

## 6. Backend Proxy Kurulumu

**Önemli**: Production'da API key'leri frontend'de saklamayın!

### Node.js Express Proxy

```bash
mkdir finans-api-proxy
cd finans-api-proxy
npm init -y
npm install express cors dotenv axios
```

#### .env
```
ALPHA_VANTAGE_KEY=senin_alpha_vantage_key
FINNHUB_KEY=senin_finnhub_key
TCMB_KEY=senin_tcmb_key
PORT=3001
```

#### server.js
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Alpha Vantage proxy
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await axios.get(
            `https://www.alphavantage.co/query`,
            {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: process.env.ALPHA_VANTAGE_KEY
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Finnhub proxy
app.get('/api/finnhub/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await axios.get(
            `https://finnhub.io/api/v1/quote`,
            {
                params: {
                    symbol: symbol,
                    token: process.env.FINNHUB_KEY
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// TCMB proxy
app.get('/api/exchange', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(
            `https://evds2.tcmb.gov.tr/service/evds/`,
            {
                params: {
                    series: 'TP.DK.USD.A-TP.DK.EUR.A',
                    startDate: today,
                    endDate: today,
                    type: 'json'
                },
                headers: {
                    'key': process.env.TCMB_KEY
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
```

#### Çalıştırma
```bash
node server.js
```

#### Frontend'den Kullanım
```javascript
// js/app.js

async function getStockData(symbol) {
    const response = await fetch(`http://localhost:3001/api/stock/${symbol}`);
    return await response.json();
}

async function getFinnhubData(symbol) {
    const response = await fetch(`http://localhost:3001/api/finnhub/${symbol}`);
    return await response.json();
}
```

---

## 🎯 Önerilen Veri Güncelleme Stratejisi

```javascript
// js/app.js

class MarketDataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 60 saniye
    }

    async getStockPrice(symbol) {
        // Cache kontrolü
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // API'den çek
        try {
            const data = await fetch(`/api/stock/${symbol}`).then(r => r.json());
            this.cache.set(symbol, {
                data: data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            console.error('API error:', error);
            // Fallback: Cached data varsa onu döndür
            return cached ? cached.data : null;
        }
    }

    startAutoUpdate(symbols, interval = 60000) {
        setInterval(() => {
            symbols.forEach(symbol => {
                this.getStockPrice(symbol);
            });
        }, interval);
    }
}

// Kullanım
const dataManager = new MarketDataManager();
dataManager.startAutoUpdate(['AAPL', 'MSFT', 'TSLA'], 60000);
```

---

## 📊 Rate Limiting ve Hata Yönetimi

```javascript
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }

    async throttle(fn) {
        // Eski istekleri temizle
        const now = Date.now();
        this.requests = this.requests.filter(
            time => now - time < this.timeWindow
        );

        // Limit kontrolü
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.timeWindow - (now - oldestRequest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.throttle(fn);
        }

        // İsteği kaydet ve çalıştır
        this.requests.push(now);
        return await fn();
    }
}

// Kullanım
const alphaVantageLimiter = new RateLimiter(5, 60000); // 5 istek/dakika

async function fetchWithLimit(symbol) {
    return await alphaVantageLimiter.throttle(async () => {
        return await getStockPrice(symbol);
    });
}
```

---

## 🔒 Güvenlik En İyi Uygulamaları

1. **API Keys**: Asla frontend koduna API key koymayın
2. **Environment Variables**: Backend'de `.env` kullanın
3. **CORS**: Backend'de uygun CORS politikası belirleyin
4. **Rate Limiting**: İstemci ve sunucu tarafında rate limiting uygulayın
5. **HTTPS**: Production'da sadece HTTPS kullanın
6. **Validation**: Tüm API yanıtlarını validate edin
7. **Error Handling**: API hatalarını gracefully handle edin

---

## 📈 Performans Optimizasyonu

1. **Caching**: Verileri cache'leyin (60 saniye optimal)
2. **WebSocket**: Gerçek zamanlı veri için WebSocket kullanın
3. **Batch Requests**: Mümkünse birden fazla sembolü tek istekte çekin
4. **Lazy Loading**: Sadece görünen sayfanın verilerini yükleyin
5. **Service Workers**: Offline desteği için Service Worker kullanın

---

## 🚀 Production Deployment

### Vercel ile Deploy (Ücretsiz)

1. Backend proxy'i Vercel'e deploy et
2. Frontend'i ayrı bir Vercel projesine deploy et
3. Environment variables'ı Vercel dashboard'dan ekle

### Railway ile Deploy (Backend)

```bash
# Railway CLI kur
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

---

## 📚 Ek Kaynaklar

- **Alpha Vantage Docs**: https://www.alphavantage.co/documentation/
- **Finnhub Docs**: https://finnhub.io/docs/api
- **TCMB EVDS**: https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Servis_Kullanimi.mp4
- **TradingView**: https://www.tradingview.com/widget/
- **Chart.js**: https://www.chartjs.org/docs/

---

## ❓ Sık Sorulan Sorular

**S: API limitine takıldım, ne yapmalıyım?**
A: Cache süresini artırın veya premium plana geçin. Ayrıca birden fazla API provider kullanabilirsiniz.

**S: BIST verilerini nasıl çekebilirim?**
A: BigPara veya Foreks'in sitelerinden web scraping yapabilirsiniz (robots.txt'e uygun şekilde).

**S: Gerçek zamanlı veri (streaming) nasıl olur?**
A: Finnhub WebSocket veya TradingView widget kullanın.

**S: API key'imi yanlışlıkla GitHub'a push ettim!**
A: Hemen key'i iptal edin ve yeni bir tane alın. `.env` dosyasını `.gitignore`'a ekleyin.

---

**Son Güncelleme**: 2025
**Versiyon**: 1.0.0
