# 📊 Market Data Firestore Integration

## Mimari

### Veri Yapısı

```
Firestore:
├── /public/market-data/           (Public read, admin write only)
│   ├── dashboard                  → Forex, crypto summary
│   ├── us-stocks                  → US stock prices
│   ├── bist-stocks                → BIST stock prices
│   └── crypto                     → Cryptocurrency prices
│
└── /users/{userId}/               (Private user data)
    ├── sim_accounts               → USD/TRY balances
    ├── sim_portfolio              → User's holdings
    ├── sim_history                → Transaction history
    └── progress                   → Education progress
```

### Nasıl Çalışır?

1. **Backend Script** (`scripts/update-market-data.js`):
   - API'lerden market data çeker (Finnhub, CoinGecko, etc.)
   - Firestore `/public/market-data/` altına yazar
   - Her 5 dakikada bir çalışır (cron job ile)

2. **Client-Side** (`js/market-data-service.js`):
   - Firestore'dan real-time market data okur
   - Tüm kullanıcılar aynı veriyi görür
   - localStorage cache yok - her zaman güncel!

3. **Simulator** (`js/simulator.js`):
   - Kullanıcının portföyünü Firebase'den çeker
   - Güncel fiyatları Firestore'dan çeker
   - Kar/zarar hesaplar

## 🚀 Kurulum

### 1. Firebase Console Ayarları

#### A. Firestore Security Rules

Firebase Console → Firestore Database → Rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PUBLIC MARKET DATA
    match /public/market-data/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // USER DATA
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
\`\`\`

#### B. Service Account Key İndir

1. Firebase Console → Project Settings → Service Accounts
2. "Generate New Private Key" tıkla
3. `firebase-admin-key.json` olarak kaydet (root dizine)
4. `.gitignore`'a ekle!

### 2. Backend Script Kurulumu

\`\`\`bash
cd scripts
npm install
\`\`\`

### 3. İlk Veri Yükleme

\`\`\`bash
cd scripts
node update-market-data.js
\`\`\`

Çıktı:
\`\`\`
🔄 Fetching market data...
✅ Fetched 20/20 US stocks
📊 Updating Firestore...
✅ Dashboard updated
✅ US stocks updated
✅ BIST stocks updated
✅ Crypto updated
🎉 Market data update complete!
\`\`\`

### 4. Otomatik Güncelleme (Opsiyonel)

#### Seçenek A: Cron Job (Linux/Mac)

\`\`\`bash
crontab -e
\`\`\`

Ekle:
\`\`\`
*/5 * * * * cd /path/to/Finans/scripts && node update-market-data.js >> /tmp/market-data.log 2>&1
\`\`\`

#### Seçenek B: Firebase Cloud Scheduler

1. Google Cloud Console → Cloud Scheduler
2. Create Job:
   - Name: `update-market-data`
   - Frequency: `*/5 * * * *` (her 5 dakika)
   - Target: Cloud Run or Cloud Function
   - Script: `update-market-data.js`

#### Seçenek C: GitHub Actions (Ücretsiz!)

`.github/workflows/update-market-data.yml`:

\`\`\`yaml
name: Update Market Data

on:
  schedule:
    - cron: '*/5 * * * *'  # Her 5 dakika
  workflow_dispatch:  # Manuel trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd scripts && npm install
      - name: Update market data
        env:
          FIREBASE_SERVICE_ACCOUNT: \${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        run: |
          echo "\$FIREBASE_SERVICE_ACCOUNT" > firebase-admin-key.json
          cd scripts && node update-market-data.js
\`\`\`

GitHub Secrets'a ekle:
- `FIREBASE_SERVICE_ACCOUNT`: `firebase-admin-key.json` içeriği

## 📱 Client-Side Kullanımı

### Market Data Okuma

\`\`\`javascript
// Market data service otomatik başlatılır (auth.js'de)

// Dashboard data
const dashboard = await marketDataService.getDashboard();
console.log('USD/TRY:', dashboard.forex.USDTRY);
console.log('BTC:', dashboard.crypto.BTC.price);

// Tek bir hisse fiyatı
const price = await marketDataService.getStockPrice('AAPL');
console.log('AAPL:', price);

// Tüm US hisseleri
const usStocks = await marketDataService.getUSStocks();
console.log('US Stocks:', usStocks);

// Real-time updates dinle
marketDataService.subscribe((type, data) => {
    if (type === 'usStocks') {
        console.log('US stocks updated!', data);
        updateUI();
    }
});
\`\`\`

## 🧪 Test

### 1. Firestore Verilerini Kontrol

Firebase Console → Firestore Database:

\`\`\`
/public/market-data/
├── dashboard
│   ├── forex: {USDTRY: 35.20, ...}
│   ├── crypto: {BTC: {...}, ETH: {...}}
│   └── lastUpdate: Timestamp
├── us-stocks
│   ├── AAPL: {price: 270.04, ...}
│   ├── MSFT: {price: 514.33, ...}
│   └── ...
└── bist-stocks
    ├── THYAO: {price: 350.50, ...}
    └── ...
\`\`\`

### 2. Client-Side Test

Console'da:

\`\`\`javascript
// Check if service is ready
console.log(window.marketDataService.initialized);  // true

// Get dashboard
const data = await marketDataService.getDashboard();
console.log(data);

// Get stock price
const price = await marketDataService.getStockPrice('AAPL');
console.log('AAPL:', price);
\`\`\`

### 3. Simulator Test

1. Gmail ile giriş yap
2. Bir hisse al (örn: AAPL 10 adet)
3. Console'da:
   \`\`\`javascript
   localStorage.getItem('sim_portfolio')  // Portföyü göster
   \`\`\`
4. Başka cihazdan aynı Gmail ile giriş yap
5. Aynı portföyü görmeli!

## 🔍 Troubleshooting

### "Permission denied" hatası
- Firestore Rules'u kontrol et
- Service account key'i doğru mu?

### "No data in Firestore"
- Backend script'i çalıştır: `node scripts/update-market-data.js`
- Firebase Console'dan manuel veri ekle

### "MarketDataService not initialized"
- auth.js'in yüklendiğinden emin ol
- Console'da `window.marketDataService` kontrol et

### API rate limits
- Finnhub: 60 calls/minute (free tier)
- CoinGecko: 10-50 calls/minute
- Çözüm: Backend script'i 5 dakikada 1 çalıştır

## 💰 Maliyet

### Firebase Ücretsiz Plan Limitleri:
- ✅ Firestore: 50K reads/day
- ✅ Firestore: 20K writes/day
- ✅ Authentication: Unlimited

### Hesaplama (günlük):
- Backend writes: 288 writes/day (5 dakikada 1 × 4 document)
- User reads: ~1000 reads/day (100 aktif kullanıcı × 10 read)
- **Toplam: ~1300 operations/day** ✅ Ücretsiz planda!

### API Maliyetleri:
- Finnhub: ✅ Ücretsiz (60 calls/min)
- CoinGecko: ✅ Ücretsiz
- ExchangeRate: ✅ Ücretsiz

## 🎯 Sonuç

✅ **Market data artık sunucuda (Firestore)**
✅ **Tüm kullanıcılar aynı güncel veriyi görüyor**
✅ **localStorage sadece user data için kullanılıyor**
✅ **Cross-device sync çalışıyor**
✅ **Tamamen ücretsiz!**
