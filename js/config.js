/**
 * Finans Akademi - Configuration
 *
 * Bu dosyada API URL'lerini ve ayarları değiştirebilirsiniz.
 */

window.FINANS_CONFIG = {
    /**
     * Market Data Source
     * GitHub Actions her 15 dakikada bir TEFAS/BES verilerini günceller
     */
    marketData: {
        // Statik JSON dosyası (GitHub Actions tarafından güncellenir)
        useStaticJson: true,
        jsonUrl: './data/market-data.json',

        // Fallback: Eski API yöntemi (devre dışı)
        useLegacyApi: false
    },

    /**
     * Feature Flags - Hangi varlık sınıflarını gösterelim?
     */
    features: {
        showTEFAS: false,  // TEFAS - Kapalı (API erişim sorunu)
        showBES: false,    // BES - Kapalı (API erişim sorunu)
        showUS: true,      // US hisselerini göster
        showBIST: true     // BIST hisselerini göster
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
