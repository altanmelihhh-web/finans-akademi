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
        useProxy: true, // Cloudflare Worker kullanılıyor
        directUrl: 'https://ws.tefas.gov.tr/bultenapi/PortfolioInfo',
        proxyUrl: 'https://finans-akademi-api.altanmelihhh.workers.dev/tefas',

        // Rate limiting (ms between requests)
        requestDelay: 100
    },

    /**
     * BES API Configuration
     * BES fonları Cloudflare Worker üzerinden çalışıyor
     */
    bes: {
        enabled: true,
        proxyUrl: 'https://finans-akademi-api.altanmelihhh.workers.dev/bes',
        message: 'BES fon verileri Cloudflare Worker üzerinden'
    },

    /**
     * Feature Flags - Hangi varlık sınıflarını gösterelim?
     */
    features: {
        showTEFAS: true,  // TEFAS fonlarını göster - Cloudflare Worker aktif!
        showBES: true,    // BES fonlarını göster - Cloudflare Worker aktif!
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
