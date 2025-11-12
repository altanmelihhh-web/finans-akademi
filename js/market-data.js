// Real-time Market Data Manager
// Fetches live data from multiple financial APIs

class MarketDataManager {
    constructor() {
        this.cache = {
            crypto: null,
            global: null,
            turkey: null,
            lastUpdate: {
                crypto: 0,
                global: 0,
                turkey: 0
            }
        };

        // Cache duration: 2 minutes (APIs update frequently)
        this.cacheDuration = 2 * 60 * 1000;
    }

    // ===================================
    // CRYPTO DATA (CoinGecko API)
    // ===================================
    async fetchCryptoData() {
        console.log('📊 Fetching crypto data...');

        // Check cache
        if (this.cache.crypto && Date.now() - this.cache.lastUpdate.crypto < this.cacheDuration) {
            console.log('✅ Using cached crypto data');
            return this.cache.crypto;
        }

        try {
            const coins = 'bitcoin,ethereum,solana,binancecoin,ripple';
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('CoinGecko API error');

            const data = await response.json();

            // Transform to our format
            const cryptoData = {
                bitcoin: {
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    price: data.bitcoin.usd,
                    change24h: data.bitcoin.usd_24h_change,
                    marketCap: data.bitcoin.usd_market_cap,
                    volume24h: data.bitcoin.usd_24h_vol
                },
                ethereum: {
                    symbol: 'ETH',
                    name: 'Ethereum',
                    price: data.ethereum.usd,
                    change24h: data.ethereum.usd_24h_change,
                    marketCap: data.ethereum.usd_market_cap,
                    volume24h: data.ethereum.usd_24h_vol
                },
                solana: {
                    symbol: 'SOL',
                    name: 'Solana',
                    price: data.solana.usd,
                    change24h: data.solana.usd_24h_change,
                    marketCap: data.solana.usd_market_cap,
                    volume24h: data.solana.usd_24h_vol
                },
                bnb: {
                    symbol: 'BNB',
                    name: 'BNB',
                    price: data.binancecoin.usd,
                    change24h: data.binancecoin.usd_24h_change,
                    marketCap: data.binancecoin.usd_market_cap,
                    volume24h: data.binancecoin.usd_24h_vol
                },
                xrp: {
                    symbol: 'XRP',
                    name: 'XRP',
                    price: data.ripple.usd,
                    change24h: data.ripple.usd_24h_change,
                    marketCap: data.ripple.usd_market_cap,
                    volume24h: data.ripple.usd_24h_vol
                }
            };

            // Cache it
            this.cache.crypto = cryptoData;
            this.cache.lastUpdate.crypto = Date.now();

            console.log('✅ Crypto data loaded:', cryptoData);
            return cryptoData;
        } catch (error) {
            console.error('❌ Crypto API error:', error);
            return this.cache.crypto || this.getCryptoFallback();
        }
    }

    // ===================================
    // GLOBAL MARKETS (Yahoo Finance API)
    // ===================================
    async fetchGlobalMarketsData() {
        console.log('📊 Fetching global markets data...');

        // Check cache
        if (this.cache.global && Date.now() - this.cache.lastUpdate.global < this.cacheDuration) {
            console.log('✅ Using cached global data');
            return this.cache.global;
        }

        try {
            const symbols = [
                { symbol: '^GSPC', name: 'S&P 500' },
                { symbol: '^IXIC', name: 'NASDAQ' },
                { symbol: '^DJI', name: 'Dow Jones' },
                { symbol: 'DX-Y.NYB', name: 'Dollar Index' }
            ];

            const promises = symbols.map(async ({ symbol, name }) => {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
                const response = await fetch(url);
                const data = await response.json();

                const quote = data.chart.result[0];
                const meta = quote.meta;
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                return {
                    name,
                    symbol: symbol.replace('^', ''),
                    price: currentPrice,
                    change: change,
                    changePercent: changePercent,
                    previousClose: previousClose
                };
            });

            const results = await Promise.allSettled(promises);
            const globalData = {};

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const key = symbols[index].name.toLowerCase().replace(/\s+/g, '_');
                    globalData[key] = result.value;
                }
            });

            // Cache it
            this.cache.global = globalData;
            this.cache.lastUpdate.global = Date.now();

            console.log('✅ Global markets data loaded:', globalData);
            return globalData;
        } catch (error) {
            console.error('❌ Global markets API error:', error);
            return this.cache.global || this.getGlobalFallback();
        }
    }

    // ===================================
    // TURKEY MARKETS (Yahoo Finance API)
    // ===================================
    async fetchTurkeyMarketsData() {
        console.log('📊 Fetching Turkey markets data...');

        // Check cache
        if (this.cache.turkey && Date.now() - this.cache.lastUpdate.turkey < this.cacheDuration) {
            console.log('✅ Using cached Turkey data');
            return this.cache.turkey;
        }

        try {
            const symbols = [
                { symbol: 'XU100.IS', name: 'BIST 100' },
                { symbol: 'USDTRY=X', name: 'USD/TRY' },
                { symbol: 'EURTRY=X', name: 'EUR/TRY' }
            ];

            const promises = symbols.map(async ({ symbol, name }) => {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
                const response = await fetch(url);
                const data = await response.json();

                const quote = data.chart.result[0];
                const meta = quote.meta;
                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                return {
                    name,
                    symbol: symbol,
                    price: currentPrice,
                    change: change,
                    changePercent: changePercent,
                    previousClose: previousClose
                };
            });

            const results = await Promise.allSettled(promises);
            const turkeyData = {};

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const key = symbols[index].name.toLowerCase().replace(/[\/\s]/g, '_');
                    turkeyData[key] = result.value;
                }
            });

            // Cache it
            this.cache.turkey = turkeyData;
            this.cache.lastUpdate.turkey = Date.now();

            console.log('✅ Turkey markets data loaded:', turkeyData);
            return turkeyData;
        } catch (error) {
            console.error('❌ Turkey markets API error:', error);
            return this.cache.turkey || this.getTurkeyFallback();
        }
    }

    // ===================================
    // FETCH ALL DATA
    // ===================================
    async fetchAllMarketData() {
        console.log('📊 Fetching all market data...');

        const [crypto, global, turkey] = await Promise.allSettled([
            this.fetchCryptoData(),
            this.fetchGlobalMarketsData(),
            this.fetchTurkeyMarketsData()
        ]);

        return {
            crypto: crypto.status === 'fulfilled' ? crypto.value : this.getCryptoFallback(),
            global: global.status === 'fulfilled' ? global.value : this.getGlobalFallback(),
            turkey: turkey.status === 'fulfilled' ? turkey.value : this.getTurkeyFallback()
        };
    }

    // ===================================
    // FALLBACK DATA (if APIs fail)
    // ===================================
    getCryptoFallback() {
        return {
            bitcoin: { symbol: 'BTC', name: 'Bitcoin', price: 100000, change24h: 2.5, marketCap: 2000000000000, volume24h: 50000000000 },
            ethereum: { symbol: 'ETH', name: 'Ethereum', price: 3400, change24h: 1.8, marketCap: 400000000000, volume24h: 20000000000 },
            solana: { symbol: 'SOL', name: 'Solana', price: 215, change24h: 5.2, marketCap: 100000000000, volume24h: 5000000000 },
            bnb: { symbol: 'BNB', name: 'BNB', price: 695, change24h: 1.2, marketCap: 100000000000, volume24h: 3000000000 },
            xrp: { symbol: 'XRP', name: 'XRP', price: 2.45, change24h: 3.8, marketCap: 140000000000, volume24h: 8000000000 }
        };
    }

    getGlobalFallback() {
        return {
            's&p_500': { name: 'S&P 500', symbol: 'GSPC', price: 6850, change: 15, changePercent: 0.22, previousClose: 6835 },
            'nasdaq': { name: 'NASDAQ', symbol: 'IXIC', price: 21500, change: 100, changePercent: 0.47, previousClose: 21400 },
            'dow_jones': { name: 'Dow Jones', symbol: 'DJI', price: 44000, change: 150, changePercent: 0.34, previousClose: 43850 },
            'dollar_index': { name: 'Dollar Index', symbol: 'DX-Y.NYB', price: 106.5, change: -0.3, changePercent: -0.28, previousClose: 106.8 }
        };
    }

    getTurkeyFallback() {
        return {
            'bist_100': { name: 'BIST 100', symbol: 'XU100.IS', price: 10250, change: -80, changePercent: -0.77, previousClose: 10330 },
            'usd_try': { name: 'USD/TRY', symbol: 'USDTRY=X', price: 34.25, change: 0.15, changePercent: 0.44, previousClose: 34.10 },
            'eur_try': { name: 'EUR/TRY', symbol: 'EURTRY=X', price: 37.85, change: 0.20, changePercent: 0.53, previousClose: 37.65 }
        };
    }

    // ===================================
    // UTILITY FUNCTIONS
    // ===================================
    formatPrice(price, decimals = 2) {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    formatMarketCap(marketCap) {
        if (marketCap >= 1e12) {
            return `$${(marketCap / 1e12).toFixed(2)}T`;
        } else if (marketCap >= 1e9) {
            return `$${(marketCap / 1e9).toFixed(2)}B`;
        } else if (marketCap >= 1e6) {
            return `$${(marketCap / 1e6).toFixed(2)}M`;
        }
        return `$${marketCap.toFixed(0)}`;
    }

    formatChange(change, changePercent) {
        const sign = change >= 0 ? '+' : '';
        const color = change >= 0 ? '#10b981' : '#ef4444';
        return {
            text: `${sign}${changePercent.toFixed(2)}%`,
            color: color,
            icon: change >= 0 ? '▲' : '▼'
        };
    }
}

// Export for use in other files
window.MarketDataManager = MarketDataManager;
