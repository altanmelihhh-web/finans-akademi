/**
 * Dynamic Market Data Loader
 * Loads market data from Cloudflare Worker or Firebase
 * NO static files - 100% dynamic!
 *
 * Strategy:
 * 1. Try Cloudflare Worker first (fastest, cached 5min)
 * 2. Fallback to Firebase Firestore
 * 3. Final fallback to direct API calls
 * 4. Background updates while user navigates
 */

class DynamicMarketLoader {
    constructor() {
        // API endpoints
        this.endpoints = {
            worker: 'https://finans-akademi-market-data.altanmelihhh.workers.dev/api/market-data',
            // Firebase endpoint will be added after initialization
            firebase: null
        };

        // Cache (client-side, short TTL)
        this.cache = {
            data: null,
            timestamp: 0,
            ttl: 60000 // 1 minute (worker has 5min cache)
        };

        // State
        this.isLoading = false;
        this.lastUpdate = 0;
        this.updateInterval = null;

        // Initialize Firebase if available
        this.initializeFirebase();
    }

    /**
     * Initialize Firebase connection
     */
    async initializeFirebase() {
        if (typeof firebase !== 'undefined' && window.firebaseConfig) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(window.firebaseConfig);
                }
                this.db = firebase.firestore();
                console.log('✅ Firebase initialized for market data');
            } catch (error) {
                console.warn('⚠️ Firebase init failed:', error.message);
            }
        }
    }

    /**
     * Main function: Load market data
     * Returns immediately with cached data, updates in background
     */
    async loadMarketData(forceRefresh = false) {
        // Return cache if valid and not forcing refresh
        if (!forceRefresh && this.isCacheValid()) {
            console.log('⚡ Using cached market data');
            return this.cache.data;
        }

        // If already loading, wait for it
        if (this.isLoading) {
            console.log('⏳ Market data load in progress...');
            return this.waitForLoad();
        }

        this.isLoading = true;
        console.log('🔄 Loading fresh market data...');

        try {
            // Try Cloudflare Worker first
            let data = await this.fetchFromWorker();

            if (!data) {
                console.log('⚠️ Worker failed, trying Firebase...');
                data = await this.fetchFromFirebase();
            }

            if (!data) {
                console.log('⚠️ Firebase failed, using direct API...');
                data = await this.fetchDirectAPIs();
            }

            if (data) {
                this.cache.data = data;
                this.cache.timestamp = Date.now();
                this.lastUpdate = Date.now();
                this.isLoading = false;

                // Dispatch event for UI updates
                window.dispatchEvent(new CustomEvent('marketDataUpdated', { detail: data }));

                return data;
            } else {
                throw new Error('All data sources failed');
            }

        } catch (error) {
            console.error('❌ Market data load failed:', error);
            this.isLoading = false;

            // Return stale cache if available
            if (this.cache.data) {
                console.log('⚠️ Returning stale cache data');
                return this.cache.data;
            }

            throw error;
        }
    }

    /**
     * Fetch from Cloudflare Worker
     */
    async fetchFromWorker() {
        try {
            const response = await fetch(this.endpoints.worker, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache'
            });

            if (!response.ok) throw new Error(`Worker HTTP ${response.status}`);

            const data = await response.json();
            console.log(`✅ Data from Worker (cached: ${data.cached ? 'yes' : 'no'})`);
            return data;

        } catch (error) {
            console.error('❌ Worker fetch failed:', error.message);
            return null;
        }
    }

    /**
     * Fetch from Firebase Firestore
     */
    async fetchFromFirebase() {
        if (!this.db) return null;

        try {
            console.log('📊 Fetching from Firebase...');

            const [forexDoc, cryptoDoc, usStocksDoc, bistStocksDoc] = await Promise.all([
                this.db.doc('public/market-data/forex').get(),
                this.db.doc('public/market-data/crypto').get(),
                this.db.doc('public/market-data/us-stocks').get(),
                this.db.doc('public/market-data/bist-stocks').get()
            ]);

            const data = {
                version: '1.0.0',
                timestamp: Date.now(),
                source: 'firebase',
                forex: forexDoc.exists ? forexDoc.data() : {},
                crypto: cryptoDoc.exists ? cryptoDoc.data() : {},
                stocks: {
                    us: usStocksDoc.exists ? usStocksDoc.data() : {},
                    bist: bistStocksDoc.exists ? bistStocksDoc.data() : {}
                }
            };

            console.log('✅ Data from Firebase');
            return data;

        } catch (error) {
            console.error('❌ Firebase fetch failed:', error.message);
            return null;
        }
    }

    /**
     * Fetch directly from APIs (last resort)
     */
    async fetchDirectAPIs() {
        console.log('🔗 Fetching directly from APIs...');

        try {
            // Only fetch critical data for dashboard
            const [forex, crypto] = await Promise.all([
                this.fetchForex(),
                this.fetchCrypto()
            ]);

            return {
                version: '1.0.0',
                timestamp: Date.now(),
                source: 'direct',
                forex,
                crypto,
                stocks: { us: {}, bist: {} } // Will be populated later
            };

        } catch (error) {
            console.error('❌ Direct API fetch failed:', error.message);
            return null;
        }
    }

    /**
     * Helper: Fetch Forex
     */
    async fetchForex() {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        return {
            USDTRY: data.rates.TRY,
            EURTRY: data.rates.TRY / data.rates.EUR,
            USDJPY: data.rates.JPY,
            GBPUSD: 1 / data.rates.GBP,
            timestamp: Date.now()
        };
    }

    /**
     * Helper: Fetch Crypto
     */
    async fetchCrypto() {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();
        return {
            BTC: { price: data.bitcoin?.usd || 0, change24h: data.bitcoin?.usd_24h_change || 0 },
            ETH: { price: data.ethereum?.usd || 0, change24h: data.ethereum?.usd_24h_change || 0 },
            timestamp: Date.now()
        };
    }

    /**
     * Check if cache is valid
     */
    isCacheValid() {
        return this.cache.data && (Date.now() - this.cache.timestamp < this.cache.ttl);
    }

    /**
     * Wait for ongoing load to complete
     */
    async waitForLoad() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.isLoading) {
                    clearInterval(checkInterval);
                    resolve(this.cache.data);
                }
            }, 100);
        });
    }

    /**
     * Start background updates (call when user is on markets page)
     */
    startBackgroundUpdates(interval = 300000) { // 5 minutes
        if (this.updateInterval) return;

        console.log(`🔄 Starting background updates (every ${interval / 1000}s)`);

        this.updateInterval = setInterval(async () => {
            console.log('🔄 Background update triggered');
            await this.loadMarketData(true);
        }, interval);
    }

    /**
     * Stop background updates (call when user leaves markets page)
     */
    stopBackgroundUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Background updates stopped');
        }
    }

    /**
     * Get specific data subset
     */
    getForex() {
        return this.cache.data?.forex || null;
    }

    getCrypto() {
        return this.cache.data?.crypto || null;
    }

    getUSStocks() {
        return this.cache.data?.stocks?.us || null;
    }

    getBISTStocks() {
        return this.cache.data?.stocks?.bist || null;
    }
}

// Global instance
window.marketLoader = new DynamicMarketLoader();

// Listen for page navigation to start/stop updates
document.addEventListener('DOMContentLoaded', () => {
    // Load market data immediately on page load
    console.log('📊 Loading market data on page load...');
    window.marketLoader.loadMarketData().catch(err => {
        console.warn('⚠️ Initial market data load failed:', err.message);
    });

    // Start updates when on markets page
    const observer = new MutationObserver(() => {
        const marketsPage = document.getElementById('markets');
        if (marketsPage && marketsPage.classList.contains('active')) {
            window.marketLoader.startBackgroundUpdates();
        } else {
            window.marketLoader.stopBackgroundUpdates();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
});

console.log('✅ DynamicMarketLoader initialized');
