/**
 * Finans Akademi - Configuration
 *
 * Bu dosyada API URL'lerini ve ayarları değiştirebilirsiniz.
 */

window.FINANS_CONFIG = {
    /**
     * TEFAS API Configuration
     *
     * Option 1: Direct API (CORS sorunu olabilir)
     * url: 'https://ws.tefas.gov.tr/bultenapi/PortfolioInfo'
     *
     * Option 2: Cloudflare Worker Proxy (Önerilen)
     * url: 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/tefas'
     *
     * Cloudflare Worker nasıl deploy edilir:
     * cloudflare-workers/README.md dosyasına bakın
     */
    tefas: {
        // CORS olmadan çalışması için Cloudflare Worker kullan
        // Şimdilik direkt API'yi deniyoruz, CORS hatası alırsan Worker'a geç
        useProxy: false, // true yapınca Cloudflare Worker kullanır
        directUrl: 'https://ws.tefas.gov.tr/bultenapi/PortfolioInfo',
        proxyUrl: 'https://finans-akademi-tefas.YOUR-SUBDOMAIN.workers.dev/tefas',

        // Rate limiting (ms between requests)
        requestDelay: 100
    },

    /**
     * BES API Configuration
     * BES fonları için henüz API yok
     */
    bes: {
        enabled: false,
        message: 'BES fon verileri için API entegrasyonu bekleniyor'
    },

    /**
     * Feature Flags - Hangi varlık sınıflarını gösterelim?
     */
    features: {
        showTEFAS: false, // TEFAS fonlarını göster (Cloudflare Worker deploy edilince true yap)
        showBES: false,   // BES fonlarını göster (API bulununca true yap)
        showUS: true,     // US hisselerini göster
        showBIST: true    // BIST hisselerini göster
    },

    /**
     * Stock Market APIs (mevcut)
     */
    stocks: {
        us: {
            finnhub: true,
            twelvedata: true,
            alphavantage: true
        },
        bist: {
            enabled: true
        }
    },

    /**
     * Cache settings
     */
    cache: {
        ttl: 300000, // 5 minutes
        version: 3
    },

    /**
     * Debug mode
     */
    debug: true
};

console.log('⚙️ Config loaded:', window.FINANS_CONFIG);
