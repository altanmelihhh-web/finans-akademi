# Finans Akademi API

Vercel Serverless Functions ile TEFAS ve BES fonları için API.

## 🚀 Deployment

### Otomatik Deploy (Önerilen)

Vercel GitHub entegrasyonu ile otomatik deploy:

1. https://vercel.com → Sign up with GitHub
2. Import Git Repository → finans-akademi seç
3. Deploy butonuna bas
4. ✅ API otomatik deploy olur!

### Manuel Deploy

```bash
# Vercel CLI kur
npm install -g vercel

# Deploy et
vercel --prod
```

## 📡 Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "Finans Akademi API",
  "version": "1.0.0"
}
```

### TEFAS Fonları
```
GET /api/tefas?code=AFH&date=2025-11-03
```

**Parameters:**
- `code` (required): Fon kodu (örn: AFH, GAH, IAH)
- `date` (required): Tarih (YYYY-MM-DD formatında)

**Response:**
```json
[
  {
    "FundCode": "AFH",
    "FundName": "Ak Portföy Hisse Senedi Fonu",
    "PricePerShare": 125.45,
    "PreviousPricePerShare": 124.78,
    "Date": "2025-11-03"
  }
]
```

### BES Fonları
```
GET /api/bes?code=AAK
```

**Parameters:**
- `code` (required): Fon kodu (örn: AAK, AEG, GAG)

**Response:**
```json
[
  {
    "FundCode": "AAK",
    "FundName": "AAK Emeklilik Yatırım Fonu",
    "Price": "0.1834",
    "ChangePercent": "0.45",
    "Date": "2025-11-03"
  }
]
```

## 🔧 Yapılandırma

Deploy sonrası, `js/config.js` dosyasında API URL'ini güncelle:

```javascript
tefas: {
    useProxy: true,
    proxyUrl: 'https://YOUR-PROJECT.vercel.app/api/tefas',
}

bes: {
    enabled: true,
    proxyUrl: 'https://YOUR-PROJECT.vercel.app/api/bes',
}
```

## 📊 Rate Limiting

- TEFAS: 5 dakika cache
- BES: 1 saat cache
- Vercel Free: 100 GB bandwidth/month (yeterli)

## 🐛 Debug

Vercel Dashboard > Functions > Logs
