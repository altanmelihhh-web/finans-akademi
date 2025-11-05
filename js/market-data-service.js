/**
 * Market Data Service - Firestore Integration
 * Reads public market data from Firestore instead of localStorage
 * This ensures all users see the same, up-to-date market data
 */

import { getFirestore, doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class MarketDataService {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.cache = {
            dashboard: null,
            usStocks: null,
            bistStocks: null,
            crypto: null,
            lastUpdate: 0
        };
        this.listeners = new Set();
        this.unsubscribes = [];
    }

    /**
     * Initialize service with Firebase app
     */
    async init(app) {
        try {
            this.db = getFirestore(app);
            console.log('✅ Market Data Service initialized');

            // Set up real-time listeners for market data
            this.setupRealtimeListeners();

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Market Data Service init error:', error);
            return false;
        }
    }

    /**
     * Set up real-time listeners for market data updates
     */
    setupRealtimeListeners() {
        if (!this.db) return;

        try {
            // Listen to dashboard data
            const dashboardRef = doc(this.db, 'public/market-data/dashboard');
            const unsubDashboard = onSnapshot(dashboardRef, (snapshot) => {
                if (snapshot.exists()) {
                    this.cache.dashboard = snapshot.data();
                    this.cache.lastUpdate = Date.now();
                    console.log('📊 Dashboard data updated from Firestore');
                    this.notifyListeners('dashboard', this.cache.dashboard);
                }
            }, (error) => {
                console.warn('⚠️ Dashboard listener error:', error);
            });
            this.unsubscribes.push(unsubDashboard);

            // Listen to US stocks data
            const usStocksRef = doc(this.db, 'public/market-data/us-stocks');
            const unsubUS = onSnapshot(usStocksRef, (snapshot) => {
                if (snapshot.exists()) {
                    this.cache.usStocks = snapshot.data();
                    console.log('📈 US stocks updated from Firestore');
                    this.notifyListeners('usStocks', this.cache.usStocks);
                }
            }, (error) => {
                console.warn('⚠️ US stocks listener error:', error);
            });
            this.unsubscribes.push(unsubUS);

            // Listen to BIST stocks data
            const bistStocksRef = doc(this.db, 'public/market-data/bist-stocks');
            const unsubBIST = onSnapshot(bistStocksRef, (snapshot) => {
                if (snapshot.exists()) {
                    this.cache.bistStocks = snapshot.data();
                    console.log('📈 BIST stocks updated from Firestore');
                    this.notifyListeners('bistStocks', this.cache.bistStocks);
                }
            }, (error) => {
                console.warn('⚠️ BIST stocks listener error:', error);
            });
            this.unsubscribes.push(unsubBIST);

            // Listen to crypto data
            const cryptoRef = doc(this.db, 'public/market-data/crypto');
            const unsubCrypto = onSnapshot(cryptoRef, (snapshot) => {
                if (snapshot.exists()) {
                    this.cache.crypto = snapshot.data();
                    console.log('₿ Crypto data updated from Firestore');
                    this.notifyListeners('crypto', this.cache.crypto);
                }
            }, (error) => {
                console.warn('⚠️ Crypto listener error:', error);
            });
            this.unsubscribes.push(unsubCrypto);

            console.log('👂 Real-time market data listeners active');
        } catch (error) {
            console.error('❌ Error setting up listeners:', error);
        }
    }

    /**
     * Get dashboard data (forex, indices, crypto summary)
     */
    async getDashboard() {
        if (this.cache.dashboard) {
            return this.cache.dashboard;
        }

        if (!this.db) {
            console.warn('⚠️ Firestore not initialized, returning null');
            return null;
        }

        try {
            const docRef = doc(this.db, 'public/market-data/dashboard');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.cache.dashboard = docSnap.data();
                return this.cache.dashboard;
            } else {
                console.warn('⚠️ No dashboard data in Firestore');
                return null;
            }
        } catch (error) {
            console.error('❌ Error fetching dashboard:', error);
            return null;
        }
    }

    /**
     * Get stock price by symbol
     */
    async getStockPrice(symbol) {
        // Determine market
        const market = this.getMarketForSymbol(symbol);

        let stocksData;
        if (market === 'US') {
            stocksData = this.cache.usStocks || await this.getUSStocks();
        } else if (market === 'BIST') {
            stocksData = this.cache.bistStocks || await this.getBISTStocks();
        }

        return stocksData?.[symbol] || null;
    }

    /**
     * Get all US stocks
     */
    async getUSStocks() {
        if (this.cache.usStocks) {
            return this.cache.usStocks;
        }

        if (!this.db) return null;

        try {
            const docRef = doc(this.db, 'public/market-data/us-stocks');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.cache.usStocks = docSnap.data();
                return this.cache.usStocks;
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching US stocks:', error);
            return null;
        }
    }

    /**
     * Get all BIST stocks
     */
    async getBISTStocks() {
        if (this.cache.bistStocks) {
            return this.cache.bistStocks;
        }

        if (!this.db) return null;

        try {
            const docRef = doc(this.db, 'public/market-data/bist-stocks');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.cache.bistStocks = docSnap.data();
                return this.cache.bistStocks;
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching BIST stocks:', error);
            return null;
        }
    }

    /**
     * Get crypto prices
     */
    async getCrypto() {
        if (this.cache.crypto) {
            return this.cache.crypto;
        }

        if (!this.db) return null;

        try {
            const docRef = doc(this.db, 'public/market-data/crypto');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.cache.crypto = docSnap.data();
                return this.cache.crypto;
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching crypto:', error);
            return null;
        }
    }

    /**
     * Determine market for symbol
     */
    getMarketForSymbol(symbol) {
        // Simple heuristic - you can improve this
        const usSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
        if (usSymbols.includes(symbol)) {
            return 'US';
        }
        return 'BIST';
    }

    /**
     * Subscribe to market data updates
     */
    subscribe(callback) {
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(type, data) {
        this.listeners.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('❌ Listener error:', error);
            }
        });
    }

    /**
     * Clean up listeners
     */
    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
        this.listeners.clear();
        console.log('🧹 Market Data Service cleaned up');
    }

    /**
     * Check if data is fresh (less than 5 minutes old)
     */
    isCacheFresh() {
        const MAX_AGE = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - this.cache.lastUpdate) < MAX_AGE;
    }
}

// Create singleton instance
const marketDataService = new MarketDataService();

// Export for use in other modules
window.marketDataService = marketDataService;

export default marketDataService;
