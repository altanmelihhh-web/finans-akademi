// ===================================
// Configuration File
// ===================================

// Bu dosyayı 'config.js' olarak kopyalayın ve kendi API key'lerinizi girin
// UYARI: config.js dosyasını Git'e push ETMEYİN!

const CONFIG = {
    // API Keys
    api: {
        alphaVantage: 'YOUR_ALPHA_VANTAGE_KEY_HERE',  // https://www.alphavantage.co/support/#api-key
        finnhub: 'YOUR_FINNHUB_KEY_HERE',             // https://finnhub.io/register
        tcmb: 'YOUR_TCMB_KEY_HERE',                   // https://evds2.tcmb.gov.tr/
        rapidApi: 'YOUR_RAPIDAPI_KEY_HERE'            // https://rapidapi.com/ (opsiyonel)
    },

    // Backend Proxy URL (eğer kullanıyorsanız)
    proxy: {
        enabled: false,
        baseUrl: 'http://localhost:3001'  // Backend proxy URL'iniz
    },

    // Market Data Settings
    market: {
        updateInterval: 60000,  // 60 saniye (milisaniye cinsinden)
        retryAttempts: 3,
        retryDelay: 5000,  // 5 saniye
        cacheTimeout: 60000  // 60 saniye
    },

    // Tracked Symbols
    symbols: {
        us: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'NVDA'],
        bist: ['THYAO', 'GARAN', 'AKBNK', 'ISCTR', 'ASELS', 'KCHOL', 'EREGL'],
        indices: {
            us: [
                { symbol: '^GSPC', name: 'S&P 500' },
                { symbol: '^IXIC', name: 'NASDAQ' },
                { symbol: '^DJI', name: 'Dow Jones' }
            ],
            turkey: [
                { symbol: 'XU100.IS', name: 'BIST 100' }
            ]
        },
        forex: ['USD/TRY', 'EUR/TRY', 'GBP/TRY']
    },

    // Feature Flags
    features: {
        realTimeData: false,         // Gerçek zamanlı veri çekme aktif mi?
        tradingViewWidgets: true,    // TradingView widget'ları kullan
        notifications: false,        // Fiyat uyarıları (gelecekte)
        darkMode: true,              // Dark mode varsayılan
        analytics: false             // Google Analytics (gelecekte)
    },

    // UI Settings
    ui: {
        defaultPage: 'dashboard',
        animationSpeed: 300,  // ms
        chartColors: {
            primary: '#2563eb',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b'
        },
        numberFormat: {
            locale: 'tr-TR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    },

    // Rate Limiting (API isteklerini sınırla)
    rateLimiting: {
        alphaVantage: {
            maxRequests: 5,
            timeWindow: 60000  // 1 dakika
        },
        finnhub: {
            maxRequests: 60,
            timeWindow: 60000  // 1 dakika
        }
    },

    // Error Handling
    errors: {
        showUserFriendlyMessages: true,
        logToConsole: true,
        sendToBackend: false  // Hata raporlama servisi (gelecekte)
    },

    // Development/Production
    environment: 'development',  // 'development' veya 'production'

    // Debug Mode
    debug: true
};

// CONFIG objesini dışa aktar (eğer module sistemi kullanıyorsanız)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Global scope'a ekle
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}

// ===================================
// Kullanım Örnekleri
// ===================================

/*
// config.js oluşturduktan sonra HTML'de:
<script src="config.js"></script>
<script src="js/app.js"></script>

// app.js içinde:
const apiKey = APP_CONFIG.api.alphaVantage;
const updateInterval = APP_CONFIG.market.updateInterval;

// Örnek API çağrısı:
async function fetchStockData(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${APP_CONFIG.api.alphaVantage}`;
    const response = await fetch(url);
    return await response.json();
}

// Proxy kullanımı:
if (APP_CONFIG.proxy.enabled) {
    const url = `${APP_CONFIG.proxy.baseUrl}/api/stock/${symbol}`;
} else {
    const url = `https://www.alphavantage.co/query?...`;
}
*/

// ===================================
// .gitignore'a Ekle
// ===================================

/*
# .gitignore dosyasına ekleyin:
config.js
.env
*/

// ===================================
// Güvenlik Notları
// ===================================

/*
1. Bu dosyayı ASLA Git'e commit etmeyin
2. API key'leri ASLA frontend'de saklamayın (production için backend proxy kullanın)
3. Production'da environment variables kullanın
4. HTTPS kullanın
5. Rate limiting uygulayın
*/
