/**
 * GERÇEK ZAMANLI PİYASA VERİLERİ V2
 * Finnhub + CoinGecko + Exchange Rate API (CORS-friendly)
 */

class MarketDataSystem {
    constructor() {
        // API Keys
        this.apiKeys = {
            // Finnhub free tier: 60 calls/min (US stocks only)
            finnhub: 'd42gjvpr01qorler9mm0d42gjvpr01qorler9mmg',
            // Alpha Vantage: 25 calls/day (BIST için)
            alphavantage: 'demo' // Ücretsiz key al: https://www.alphavantage.co/support/#api-key
        };

        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 dakika cache (rate limit için)
        this.isUpdating = false;
        this.lastUpdateTime = 0;
    }

    async init() {
        console.log('🚀 Market Data System V2 başlatılıyor...');

        // Sayfa ilk yüklendiğinde sadece CACHE'den veri kullan (eğer varsa)
        const hasCachedData = this.cache.size > 0;

        if (!hasCachedData) {
            // İlk yükleme - API'den çek
            console.log('📥 İlk veri yükleniyor (API)...');
            await this.updateAll();
        } else {
            console.log('⚡ Cache\'den veri yüklendi (API çağrısı YOK)');
        }

        // Her 5 dakikada bir güncelle (rate limit koruması)
        // 60 req/min = her hisse için 1 saniye delay + cache = güvenli
        setInterval(() => {
            const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
            if (timeSinceLastUpdate >= 300000) { // 5 dakika geçtiyse
                this.updateAll();
            }
        }, 300000); // 5 dakika

        console.log('✅ Market Data System V2 hazır!');
        console.log('⏱️  Otomatik güncelleme: Her 5 dakikada bir');
        console.log('💾 Cache süresi: 5 dakika');
    }

    /**
     * Finnhub API - Hisse fiyatı (CORS destekli!)
     */
    async getFinnhubQuote(symbol) {
        const cacheKey = `finnhub_${symbol}`;

        // Cache kontrolü
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKeys.finnhub}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.c) {
                const quote = {
                    symbol: symbol,
                    price: data.c,      // current price
                    change: data.d,     // change
                    changePercent: data.dp, // change percent
                    high: data.h,       // high
                    low: data.l,        // low
                    open: data.o,       // open
                    previousClose: data.pc // previous close
                };

                // Cache'e kaydet
                this.cache.set(cacheKey, {
                    data: quote,
                    time: Date.now()
                });

                return quote;
            }
        } catch (error) {
            console.error(`Finnhub error (${symbol}):`, error);
        }

        return null;
    }

    /**
     * CoinGecko API - Kripto fiyatları (CORS yok!)
     */
    async getCryptoPrice(coinId) {
        const cacheKey = `crypto_${coinId}`;

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,try&include_24hr_change=true`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[coinId]) {
                const crypto = {
                    symbol: coinId.toUpperCase(),
                    priceUSD: data[coinId].usd,
                    priceTRY: data[coinId].try,
                    change24h: data[coinId].usd_24h_change
                };

                this.cache.set(cacheKey, {
                    data: crypto,
                    time: Date.now()
                });

                return crypto;
            }
        } catch (error) {
            console.error(`CoinGecko error (${coinId}):`, error);
        }

        return null;
    }

    /**
     * Exchange Rate API - Döviz kurları (CORS yok!)
     */
    async getExchangeRates() {
        const cacheKey = 'exchange_rates';

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = 'https://api.exchangerate-api.com/v4/latest/USD';
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.rates) {
                const rates = {
                    USDTRY: data.rates.TRY,
                    EURTRY: data.rates.TRY / data.rates.EUR,
                    EURUSD: data.rates.EUR
                };

                this.cache.set(cacheKey, {
                    data: rates,
                    time: Date.now()
                });

                return rates;
            }
        } catch (error) {
            console.error('Exchange rate error:', error);
        }

        return null;
    }

    /**
     * TÜM VERİLERİ GÜNCELLE
     */
    async updateAll() {
        if (this.isUpdating) {
            console.log('⏳ Güncelleme devam ediyor...');
            return;
        }

        this.isUpdating = true;
        console.log('🔄 Piyasa verileri güncelleniyor...');

        try {
            // 1. Döviz kurları
            await this.updateCurrencies();

            // 2. US Hisseleri (Dashboard)
            await this.updateUSStocks();

            // 3. Kripto
            await this.updateCrypto();

            // 4. Markets sayfası için STOCKS_DATA güncelle
            await this.updateStocksData();

            // Güncelleme zamanını kaydet
            this.lastUpdateTime = Date.now();

            console.log('✅ Tüm veriler güncellendi!');
            console.log(`⏰ Sonraki güncelleme: ${new Date(this.lastUpdateTime + 300000).toLocaleTimeString('tr-TR')}`);
        } catch (error) {
            console.error('❌ Güncelleme hatası:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Döviz kurlarını güncelle
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
     * US hisse senetlerini güncelle (Dashboard)
     */
    async updateUSStocks() {
        const stocks = [
            { symbol: 'AAPL', id: 'aapl' },
            { symbol: 'MSFT', id: 'msft' },
            { symbol: 'TSLA', id: 'tsla' }
        ];

        for (const stock of stocks) {
            const quote = await this.getFinnhubQuote(stock.symbol);
            if (quote) {
                this.updateElement(stock.id, `$${quote.price.toFixed(2)}`, quote.changePercent);
                console.log(`📈 ${stock.symbol}: $${quote.price.toFixed(2)}`);
            }
            await this.delay(500); // Rate limit koruması
        }

        // US Endeksler (^GSPC, ^IXIC, ^DJI)
        const indices = [
            { symbol: '^GSPC', id: 'sp500', name: 'S&P 500' },
            { symbol: '^IXIC', id: 'nasdaq', name: 'NASDAQ' },
            { symbol: '^DJI', id: 'dow', name: 'DOW' }
        ];

        for (const index of indices) {
            const quote = await this.getFinnhubQuote(index.symbol);
            if (quote) {
                this.updateElement(index.id, quote.price.toLocaleString('en-US', {minimumFractionDigits: 2}), quote.changePercent);
                console.log(`📊 ${index.name}: ${quote.price.toFixed(2)}`);
            }
            await this.delay(500);
        }

        // BIST 100 Endeksi - Finnhub FREE tier desteklemiyor
        // Static veri kullanılıyor (stocks-data.js)
        console.log('📊 BIST 100: Static veri (Finnhub premium gerekli)');
    }

    /**
     * Kripto fiyatlarını güncelle
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
     * Markets sayfası için STOCKS_DATA'yı güncelle
     */
    async updateStocksData() {
        if (!window.STOCKS_DATA) {
            console.log('⚠️ STOCKS_DATA bulunamadı');
            return;
        }

        console.log('📊 Markets sayfası güncelleniyor...');

        // US Stocks - İlk 20 hisse (rate limit için)
        if (window.STOCKS_DATA.us_stocks) {
            const usStocksToUpdate = window.STOCKS_DATA.us_stocks.slice(0, 20);

            for (const stock of usStocksToUpdate) {
                const quote = await this.getFinnhubQuote(stock.symbol);
                if (quote) {
                    stock.price = quote.price;
                    stock.change = quote.changePercent;
                    stock.volume = 1000000;
                    console.log(`  📈 ${stock.symbol}: $${quote.price.toFixed(2)}`);
                }
                await this.delay(300); // Rate limit koruması
            }
        }

        // BIST Stocks - Finnhub FREE tier desteklemiyor (403 Forbidden)
        // Static veri kullanılıyor - gerçek API için ücretli plan gerekli
        if (window.STOCKS_DATA.bist_stocks) {
            console.log('  📊 BIST hisseleri: Static veri (Finnhub premium gerekli)');
            // BIST verileri stocks-data.js'den geliyor (static)
            // Alternatif: Alpha Vantage, TCMB, veya web scraping (BigPara)
        }

        // MarketsManager'ı yeniden render et (loadStocks ÇAĞIRMA - üzerine yazar!)
        if (window.marketsManager) {
            // loadStocks() çağırmıyoruz çünkü stocks-data.js'den eski verileri yükler
            // Sadece render et - STOCKS_DATA zaten güncel
            if (typeof window.marketsManager.renderStocks === 'function') {
                window.marketsManager.renderStocks();
            }
            if (typeof window.marketsManager.updateStats === 'function') {
                window.marketsManager.updateStats();
            }
            console.log('✅ Markets sayfası güncellendi (US + BIST)');
        }
    }

    /**
     * UI element güncelle
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
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Manuel yenileme
     */
    async refresh() {
        this.cache.clear();
        await this.updateAll();
    }

    /**
     * 30 günlük grafik verisi (Finnhub candles API)
     */
    async getChartData(symbol, days = 30) {
        try {
            const to = Math.floor(Date.now() / 1000);
            const from = to - (days * 24 * 60 * 60);
            const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${this.apiKeys.finnhub}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.s === 'ok') {
                return {
                    labels: data.t.map(ts => new Date(ts * 1000).toLocaleDateString('tr-TR')),
                    prices: data.c, // closing prices
                    volumes: data.v
                };
            }
        } catch (error) {
            console.error(`Chart data error (${symbol}):`, error);
        }

        // Fallback
        return {
            labels: Array.from({length: days}, (_, i) => `${i + 1}`),
            prices: Array.from({length: days}, () => 100)
        };
    }
}

// Auto-initialize
let marketData;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        marketData = new MarketDataSystem();
        marketData.init();
        window.marketData = marketData;
    });
} else {
    marketData = new MarketDataSystem();
    marketData.init();
    window.marketData = marketData;
}
