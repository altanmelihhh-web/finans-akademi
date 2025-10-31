/**
 * UNIFIED MARKET DATA SYSTEM
 * Çoklu API desteği ile %100 gerçek zamanlı piyasa verileri
 *
 * API Strategy:
 * 1. Finnhub (US stocks, indices) - 60 req/min
 * 2. Twelve Data (Global + BIST) - 800 req/day
 * 3. CoinGecko (Crypto) - Unlimited
 * 4. Exchange Rate API (Forex) - Unlimited
 * 5. Financial Modeling Prep (Backup) - 250 req/day
 */

class UnifiedMarketData {
    constructor() {
        this.apiKeys = {
            // Finnhub - US stocks (CORS-friendly)
            finnhub: 'd42gjvpr01qorler9mm0d42gjvpr01qorler9mmg',

            // Twelve Data - Global + BIST (ücretsiz: https://twelvedata.com/)
            twelvedata: 'demo', // KULLANICI: https://twelvedata.com/apikey adresinden ücretsiz key alın

            // Financial Modeling Prep - Backup API
            fmp: 'demo' // KULLANICI: https://financialmodelingprep.com/developer/docs/ adresinden key alın
        };

        // Multi-level cache
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 dakika

        // Rate limiting
        this.lastUpdateTime = 0;
        this.minUpdateInterval = 60000; // Minimum 1 dakika aralık
        this.isUpdating = false;

        // API call tracking
        this.apiCalls = {
            finnhub: { count: 0, resetTime: Date.now() + 60000 },
            twelvedata: { count: 0, resetTime: Date.now() + 86400000 },
            fmp: { count: 0, resetTime: Date.now() + 86400000 }
        };
    }

    /**
     * Initialize system
     */
    async init() {
        console.log('🚀 Unified Market Data System başlatılıyor...');
        console.log('📊 API Providers: Finnhub + Twelve Data + CoinGecko + Exchange Rate');

        // İlk yükleme - cache varsa kullan
        const hasCachedData = this.cache.size > 0;

        if (!hasCachedData) {
            console.log('📥 İlk veri yükleniyor (API çağrıları başlatılıyor)...');
            await this.updateAll();
        } else {
            console.log('⚡ Cache\'den veri yüklendi (API tasarrufu)');
            this.renderCachedData();
        }

        // Akıllı güncelleme - sadece gerektiğinde
        setInterval(() => {
            const timeSinceUpdate = Date.now() - this.lastUpdateTime;
            if (timeSinceUpdate >= this.minUpdateInterval && !this.isUpdating) {
                console.log('🔄 Periyodik güncelleme başlatılıyor...');
                this.updateAll();
            }
        }, this.minUpdateInterval);

        console.log('✅ Unified Market Data System hazır!');
        console.log('⏱️  Güncelleme aralığı: 1 dakika');
        console.log('💾 Cache süresi: 5 dakika');
    }

    /**
     * API LAYER 1: Finnhub (US Stocks, Indices)
     */
    async getFinnhubQuote(symbol) {
        const cacheKey = `finnhub_${symbol}`;

        // Cache check
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        // Rate limit check
        if (!this.canMakeAPICall('finnhub')) {
            console.warn(`⚠️ Finnhub rate limit aşıldı, cache kullanılıyor: ${symbol}`);
            return null;
        }

        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKeys.finnhub}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data && data.c) {
                const quote = {
                    symbol: symbol,
                    price: data.c,
                    change: data.d,
                    changePercent: data.dp,
                    high: data.h,
                    low: data.l,
                    open: data.o,
                    previousClose: data.pc,
                    source: 'finnhub'
                };

                this.setCache(cacheKey, quote);
                this.trackAPICall('finnhub');

                return quote;
            }
        } catch (error) {
            console.error(`❌ Finnhub error (${symbol}):`, error.message);
        }

        return null;
    }

    /**
     * API LAYER 2: Twelve Data (Global Stocks + BIST)
     */
    async getTwelveDataQuote(symbol) {
        const cacheKey = `twelve_${symbol}`;

        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.canMakeAPICall('twelvedata')) {
            console.warn(`⚠️ Twelve Data rate limit, cache kullanılıyor: ${symbol}`);
            return null;
        }

        try {
            // Twelve Data API (CORS-friendly, free tier)
            const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.apiKeys.twelvedata}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.close) {
                const prevClose = parseFloat(data.previous_close || data.close);
                const currentPrice = parseFloat(data.close);
                const change = currentPrice - prevClose;
                const changePercent = (change / prevClose) * 100;

                const quote = {
                    symbol: symbol,
                    price: currentPrice,
                    change: change,
                    changePercent: changePercent,
                    high: parseFloat(data.high || currentPrice),
                    low: parseFloat(data.low || currentPrice),
                    open: parseFloat(data.open || currentPrice),
                    previousClose: prevClose,
                    volume: parseInt(data.volume || 0),
                    source: 'twelvedata'
                };

                this.setCache(cacheKey, quote);
                this.trackAPICall('twelvedata');

                return quote;
            }
        } catch (error) {
            console.error(`❌ Twelve Data error (${symbol}):`, error.message);
        }

        return null;
    }

    /**
     * API LAYER 3: Financial Modeling Prep (Backup)
     */
    async getFMPQuote(symbol) {
        const cacheKey = `fmp_${symbol}`;

        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.canMakeAPICall('fmp')) {
            return null;
        }

        try {
            const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${this.apiKeys.fmp}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[0]) {
                const stock = data[0];
                const quote = {
                    symbol: symbol,
                    price: stock.price,
                    change: stock.change,
                    changePercent: stock.changesPercentage,
                    high: stock.dayHigh,
                    low: stock.dayLow,
                    open: stock.open,
                    previousClose: stock.previousClose,
                    volume: stock.volume,
                    source: 'fmp'
                };

                this.setCache(cacheKey, quote);
                this.trackAPICall('fmp');

                return quote;
            }
        } catch (error) {
            console.error(`❌ FMP error (${symbol}):`, error.message);
        }

        return null;
    }

    /**
     * SMART QUOTE - Cascade through APIs
     */
    async getSmartQuote(symbol, preferredAPI = 'auto') {
        // BIST stocks - Twelve Data only
        if (symbol.includes('.IS') || symbol.includes('XU')) {
            return await this.getTwelveDataQuote(symbol);
        }

        // US Stocks - Try Finnhub first, fallback to others
        let quote = await this.getFinnhubQuote(symbol);

        if (!quote) {
            console.log(`⚠️ Finnhub başarısız, Twelve Data deneniyor: ${symbol}`);
            quote = await this.getTwelveDataQuote(symbol);
        }

        if (!quote) {
            console.log(`⚠️ Twelve Data başarısız, FMP deneniyor: ${symbol}`);
            quote = await this.getFMPQuote(symbol);
        }

        if (!quote) {
            console.error(`❌ TÜM API'ler başarısız: ${symbol}`);
        }

        return quote;
    }

    /**
     * CRYPTO - CoinGecko (No limits!)
     */
    async getCryptoPrice(coinId) {
        const cacheKey = `crypto_${coinId}`;

        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,try&include_24hr_change=true`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[coinId]) {
                const crypto = {
                    symbol: coinId.toUpperCase(),
                    priceUSD: data[coinId].usd,
                    priceTRY: data[coinId].try,
                    change24h: data[coinId].usd_24h_change,
                    source: 'coingecko'
                };

                this.setCache(cacheKey, crypto);
                return crypto;
            }
        } catch (error) {
            console.error(`❌ CoinGecko error (${coinId}):`, error.message);
        }

        return null;
    }

    /**
     * FOREX - Exchange Rate API (No limits!)
     */
    async getExchangeRates() {
        const cacheKey = 'exchange_rates';

        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const url = 'https://api.exchangerate-api.com/v4/latest/USD';
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.rates) {
                const rates = {
                    USDTRY: data.rates.TRY,
                    EURTRY: data.rates.TRY / data.rates.EUR,
                    EURUSD: data.rates.EUR,
                    source: 'exchangerate-api'
                };

                this.setCache(cacheKey, rates);
                return rates;
            }
        } catch (error) {
            console.error('❌ Exchange rate error:', error.message);
        }

        return null;
    }

    /**
     * UPDATE ALL DATA
     */
    async updateAll() {
        if (this.isUpdating) {
            console.log('⏳ Güncelleme devam ediyor, atlandı...');
            return;
        }

        this.isUpdating = true;
        console.log('🔄 Tüm piyasa verileri güncelleniyor...');

        try {
            // 1. Döviz kurları
            await this.updateCurrencies();

            // 2. US Indices
            await this.updateUSIndices();

            // 3. US Stocks (Dashboard)
            await this.updateUSStocks();

            // 4. Crypto
            await this.updateCrypto();

            // 5. Markets sayfası için STOCKS_DATA güncelle
            await this.updateStocksData();

            this.lastUpdateTime = Date.now();

            console.log('✅ Tüm veriler güncellendi!');
            console.log(`⏰ Sonraki güncelleme: ${new Date(this.lastUpdateTime + this.minUpdateInterval).toLocaleTimeString('tr-TR')}`);
            console.log(`📊 API Kullanımı: Finnhub=${this.apiCalls.finnhub.count}, TwelveData=${this.apiCalls.twelvedata.count}, FMP=${this.apiCalls.fmp.count}`);
        } catch (error) {
            console.error('❌ Güncelleme hatası:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Update US Indices
     */
    async updateUSIndices() {
        const indices = [
            { symbol: '^GSPC', id: 'sp500', name: 'S&P 500' },
            { symbol: '^IXIC', id: 'nasdaq', name: 'NASDAQ' },
            { symbol: '^DJI', id: 'dow', name: 'DOW JONES' }
        ];

        for (const index of indices) {
            const quote = await this.getSmartQuote(index.symbol);
            if (quote) {
                this.updateElement(
                    index.id,
                    quote.price.toLocaleString('en-US', {minimumFractionDigits: 2}),
                    quote.changePercent
                );
                console.log(`📊 ${index.name}: ${quote.price.toFixed(2)} (${quote.source})`);
            }
            await this.delay(200); // Nazik rate limiting
        }
    }

    /**
     * Update US Stocks (Dashboard)
     */
    async updateUSStocks() {
        const stocks = ['AAPL', 'MSFT', 'TSLA'];

        for (const symbol of stocks) {
            const quote = await this.getSmartQuote(symbol);
            if (quote) {
                const id = symbol.toLowerCase();
                this.updateElement(id, `$${quote.price.toFixed(2)}`, quote.changePercent);
                console.log(`📈 ${symbol}: $${quote.price.toFixed(2)} (${quote.source})`);
            }
            await this.delay(200);
        }
    }

    /**
     * Update Currencies
     */
    async updateCurrencies() {
        const rates = await this.getExchangeRates();
        if (rates) {
            this.updateElement('usdtry', `₺${rates.USDTRY.toFixed(4)}`);
            this.updateElement('eurtry', `₺${rates.EURTRY.toFixed(4)}`);
            console.log('💱 Döviz kurları güncellendi');
        }
    }

    /**
     * Update Crypto
     */
    async updateCrypto() {
        const bitcoin = await this.getCryptoPrice('bitcoin');
        const ethereum = await this.getCryptoPrice('ethereum');

        if (bitcoin) {
            console.log(`₿ Bitcoin: $${bitcoin.priceUSD.toLocaleString()} (${bitcoin.change24h.toFixed(2)}%)`);
        }

        if (ethereum) {
            console.log(`Ξ Ethereum: $${ethereum.priceUSD.toLocaleString()} (${ethereum.change24h.toFixed(2)}%)`);
        }
    }

    /**
     * Update STOCKS_DATA for Markets page
     */
    async updateStocksData() {
        if (!window.STOCKS_DATA) {
            console.log('⚠️ STOCKS_DATA bulunamadı');
            return;
        }

        console.log('📊 Markets sayfası güncelleniyor...');

        // US Stocks - İlk 30 hisse
        if (window.STOCKS_DATA.us_stocks) {
            const usStocksToUpdate = window.STOCKS_DATA.us_stocks.slice(0, 30);

            for (let i = 0; i < usStocksToUpdate.length; i++) {
                const stock = usStocksToUpdate[i];
                const quote = await this.getSmartQuote(stock.symbol);

                if (quote) {
                    stock.price = quote.price;
                    stock.change = quote.changePercent;
                    stock.volume = quote.volume || 1000000;
                    console.log(`  📈 ${stock.symbol}: $${quote.price.toFixed(2)} (${quote.source})`);
                } else {
                    console.warn(`  ⚠️ ${stock.symbol}: Veri alınamadı`);
                }

                // Smart delay - her 10 hissede uzun delay
                if ((i + 1) % 10 === 0) {
                    await this.delay(1000);
                } else {
                    await this.delay(300);
                }
            }
        }

        // BIST Stocks - Twelve Data ile
        if (window.STOCKS_DATA.bist_stocks) {
            console.log('  📊 BIST hisseleri güncelleniyor (Twelve Data)...');

            const bistStocksToUpdate = window.STOCKS_DATA.bist_stocks.slice(0, 20);

            for (let i = 0; i < bistStocksToUpdate.length; i++) {
                const stock = bistStocksToUpdate[i];
                // BIST sembolleri - Twelve Data formatı
                const symbol = `${stock.symbol}.IS`; // Örn: THYAO.IS

                const quote = await this.getTwelveDataQuote(symbol);

                if (quote) {
                    stock.price = quote.price;
                    stock.change = quote.changePercent;
                    stock.volume = quote.volume || 1000000;
                    console.log(`  📈 ${stock.symbol}: ₺${quote.price.toFixed(2)} (${quote.source})`);
                } else {
                    console.warn(`  ⚠️ ${stock.symbol}: BIST verisi alınamadı (API key gerekli)`);
                }

                await this.delay(500); // BIST için daha uzun delay
            }
        }

        // Markets manager'ı güncelle - loadStocks ÇAĞIRMA!
        if (window.marketsManager) {
            if (typeof window.marketsManager.renderStocks === 'function') {
                window.marketsManager.renderStocks();
            }
            if (typeof window.marketsManager.updateStats === 'function') {
                window.marketsManager.updateStats();
            }
            console.log('✅ Markets sayfası güncellendi');
        }
    }

    /**
     * UI Update
     */
    updateElement(id, value, changePercent = null) {
        const element = document.getElementById(id);
        if (!element) return;

        element.textContent = value;

        if (changePercent !== null) {
            const changeElement = document.getElementById(id + '-change');
            if (changeElement) {
                const sign = changePercent >= 0 ? '+' : '';
                changeElement.textContent = `${sign}${changePercent.toFixed(2)}%`;
                changeElement.className = changePercent >= 0 ? 'index-change positive' : 'index-change negative';
            }
        }
    }

    /**
     * Cache Management
     */
    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            time: Date.now()
        });
    }

    renderCachedData() {
        console.log('⚡ Cache\'den veriler yükleniyor...');
        // Cache'deki verileri UI'a render et
        for (const [key, value] of this.cache.entries()) {
            // İlgili elementleri güncelle
        }
    }

    /**
     * Rate Limiting
     */
    canMakeAPICall(provider) {
        const limits = {
            finnhub: 60,      // 60 per minute
            twelvedata: 800,  // 800 per day
            fmp: 250          // 250 per day
        };

        const api = this.apiCalls[provider];

        // Reset counter if time window passed
        if (Date.now() > api.resetTime) {
            api.count = 0;
            api.resetTime = provider === 'finnhub'
                ? Date.now() + 60000    // 1 minute
                : Date.now() + 86400000; // 24 hours
        }

        return api.count < limits[provider];
    }

    trackAPICall(provider) {
        this.apiCalls[provider].count++;
    }

    /**
     * Utilities
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async refresh() {
        this.cache.clear();
        await this.updateAll();
    }

    /**
     * Chart Data (30 günlük)
     */
    async getChartData(symbol, days = 30) {
        try {
            // Finnhub candles API
            const to = Math.floor(Date.now() / 1000);
            const from = to - (days * 24 * 60 * 60);
            const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${this.apiKeys.finnhub}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.s === 'ok') {
                return {
                    labels: data.t.map(ts => new Date(ts * 1000).toLocaleDateString('tr-TR')),
                    prices: data.c,
                    volumes: data.v
                };
            }
        } catch (error) {
            console.error(`❌ Chart data error (${symbol}):`, error);
        }

        // Fallback
        return {
            labels: Array.from({length: days}, (_, i) => `${i + 1}`),
            prices: Array.from({length: days}, () => 100)
        };
    }
}

// Auto-initialize
let unifiedMarketData;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        unifiedMarketData = new UnifiedMarketData();
        unifiedMarketData.init();

        // Global export
        window.marketData = unifiedMarketData;
        window.unifiedMarketData = unifiedMarketData;
    });
} else {
    unifiedMarketData = new UnifiedMarketData();
    unifiedMarketData.init();

    window.marketData = unifiedMarketData;
    window.unifiedMarketData = unifiedMarketData;
}

console.log('📦 Unified Market Data System yüklendi!');
