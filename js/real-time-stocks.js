/**
 * GERÇEK ZAMANLI PİYASA VERİLERİ SİSTEMİ
 * Yahoo Finance API ile 100+ hisse senedi + 30 günlük grafikler
 */

class RealTimeStockSystem {
    constructor() {
        this.cache = {};
        this.cacheTimeout = 60000; // 60 saniye
        this.updateInterval = null;
        this.stockSymbols = [
            // US Stocks
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
            'WMT', 'PG', 'MA', 'HD', 'BAC', 'DIS', 'NFLX', 'ADBE', 'CRM', 'CSCO',
            'INTC', 'AMD', 'PEP', 'KO', 'NKE', 'MRK', 'PFE', 'ABT', 'ORCL', 'QCOM',
            'IBM', 'TXN', 'AVGO', 'UNH', 'CVX', 'XOM', 'BA', 'CAT', 'GE', 'MMM',
            'HON', 'UPS', 'GS', 'MS', 'AXP', 'BLK', 'C', 'WFC', 'T', 'VZ',
            'CMCSA', 'MCD', 'SBUX', 'LOW', 'TGT', 'CVS', 'LLY', 'TMO', 'ABBV', 'BMY',
            'NEE', 'DUK', 'SO', 'D', 'AMT', 'PLD', 'SPG', 'EQIX', 'COP', 'SLB',
            'OXY', 'HAL', 'DE', 'RTX', 'LMT', 'NOC', 'FDX'
        ];

        this.stockInfo = {
            // Sector information
            'AAPL': { name: 'Apple Inc.', sector: 'Technology' },
            'MSFT': { name: 'Microsoft Corporation', sector: 'Technology' },
            'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology' },
            'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
            'TSLA': { name: 'Tesla Inc.', sector: 'Automotive' },
            'META': { name: 'Meta Platforms Inc.', sector: 'Technology' },
            'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology' },
            'JPM': { name: 'JPMorgan Chase & Co.', sector: 'Financial' },
            'V': { name: 'Visa Inc.', sector: 'Financial' },
            'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare' },
            'WMT': { name: 'Walmart Inc.', sector: 'Consumer Defensive' },
            'PG': { name: 'Procter & Gamble Co.', sector: 'Consumer Defensive' },
            'MA': { name: 'Mastercard Inc.', sector: 'Financial' },
            'HD': { name: 'The Home Depot Inc.', sector: 'Consumer Cyclical' },
            'BAC': { name: 'Bank of America Corp.', sector: 'Financial' },
            'DIS': { name: 'The Walt Disney Company', sector: 'Communication Services' },
            'NFLX': { name: 'Netflix Inc.', sector: 'Communication Services' },
            'ADBE': { name: 'Adobe Inc.', sector: 'Technology' },
            'CRM': { name: 'Salesforce Inc.', sector: 'Technology' },
            'CSCO': { name: 'Cisco Systems Inc.', sector: 'Technology' },
            'INTC': { name: 'Intel Corporation', sector: 'Technology' },
            'AMD': { name: 'Advanced Micro Devices', sector: 'Technology' },
            'PEP': { name: 'PepsiCo Inc.', sector: 'Consumer Defensive' },
            'KO': { name: 'The Coca-Cola Company', sector: 'Consumer Defensive' },
            'NKE': { name: 'Nike Inc.', sector: 'Consumer Cyclical' },
            'MRK': { name: 'Merck & Co. Inc.', sector: 'Healthcare' },
            'PFE': { name: 'Pfizer Inc.', sector: 'Healthcare' },
            'ABT': { name: 'Abbott Laboratories', sector: 'Healthcare' },
            'ORCL': { name: 'Oracle Corporation', sector: 'Technology' },
            'QCOM': { name: 'QUALCOMM Inc.', sector: 'Technology' }
        };
    }

    async init() {
        console.log('🚀 Real-Time Stock System başlatılıyor...');

        // İlk veri yüklemesi
        await this.updateAllStocks();

        // Her 1 dakikada güncelle
        this.updateInterval = setInterval(() => {
            this.updateAllStocks();
        }, 60000);

        console.log('✅ Real-Time Stock System hazır!');
    }

    /**
     * Yahoo Finance API - Tek hisse fiyatı
     */
    async getStockQuote(symbol) {
        const cacheKey = `quote_${symbol}`;

        // Cache kontrolü
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;

                const quote = {
                    symbol: symbol,
                    price: meta.regularMarketPrice,
                    previousClose: meta.previousClose || meta.chartPreviousClose,
                    change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
                    changePercent: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
                    volume: meta.regularMarketVolume || 0,
                    dayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice,
                    dayLow: meta.regularMarketDayLow || meta.regularMarketPrice
                };

                // Cache'e kaydet
                this.cache[cacheKey] = {
                    data: quote,
                    time: Date.now()
                };

                return quote;
            }
        } catch (error) {
            console.error(`Yahoo Finance error (${symbol}):`, error);
        }

        return null;
    }

    /**
     * Yahoo Finance API - 30 günlük tarihsel veri
     */
    async getHistoricalData(symbol, days = 30) {
        const cacheKey = `history_${symbol}_${days}`;

        // Cache kontrolü
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${days}d`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp;
                const quotes = result.indicators.quote[0];

                const history = timestamps.map((ts, i) => ({
                    date: new Date(ts * 1000).toLocaleDateString('tr-TR'),
                    timestamp: ts,
                    open: quotes.open[i],
                    high: quotes.high[i],
                    low: quotes.low[i],
                    close: quotes.close[i],
                    volume: quotes.volume[i]
                })).filter(item => item.close !== null); // Null değerleri filtrele

                // Cache'e kaydet
                this.cache[cacheKey] = {
                    data: history,
                    time: Date.now()
                };

                return history;
            }
        } catch (error) {
            console.error(`Historical data error (${symbol}):`, error);
        }

        return [];
    }

    /**
     * Döviz kurları (Exchange Rate API)
     */
    async getExchangeRates() {
        const cacheKey = 'exchange_rates';

        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTimeout) {
            return this.cache[cacheKey].data;
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

                this.cache[cacheKey] = {
                    data: rates,
                    time: Date.now()
                };

                return rates;
            }
        } catch (error) {
            console.error('Exchange rate error:', error);
        }

        return null;
    }

    /**
     * ABD endekslerini güncelle (^GSPC, ^IXIC, ^DJI)
     */
    async updateIndices() {
        const indices = {
            '^GSPC': 'sp500',    // S&P 500
            '^IXIC': 'nasdaq',   // NASDAQ
            '^DJI': 'dow'        // DOW JONES
        };

        for (const [symbol, id] of Object.entries(indices)) {
            const quote = await this.getStockQuote(symbol);
            if (quote) {
                this.updateElement(id, quote.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), quote.changePercent);
            }
            await this.delay(100); // Küçük delay
        }
    }

    /**
     * Dashboard hisselerini güncelle
     */
    async updateDashboardStocks() {
        const stocks = ['AAPL', 'MSFT', 'TSLA'];

        for (const symbol of stocks) {
            const quote = await this.getStockQuote(symbol);
            if (quote) {
                const id = symbol.toLowerCase();
                this.updateElement(id, `$${quote.price.toFixed(2)}`, quote.changePercent);
            }
            await this.delay(100);
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
        }
    }

    /**
     * TÜM hisseleri güncelle (Dashboard + Markets page için)
     */
    async updateAllStocks() {
        console.log('🔄 Tüm hisseler güncelleniyor...');

        // 1. Dashboard - Endeksler
        await this.updateIndices();

        // 2. Dashboard - Hisseler
        await this.updateDashboardStocks();

        // 3. Döviz kurları
        await this.updateCurrencies();

        // 4. Markets sayfası için STOCKS_DATA'yı güncelle
        if (window.STOCKS_DATA) {
            await this.updateStocksData();
        }

        console.log('✅ Tüm veriler güncellendi!');
    }

    /**
     * window.STOCKS_DATA'yı gerçek verilerle güncelle
     */
    async updateStocksData() {
        if (!window.STOCKS_DATA) return;

        const stocksToUpdate = window.STOCKS_DATA.us_stocks.map(s => s.symbol);

        for (let i = 0; i < stocksToUpdate.length; i++) {
            const symbol = stocksToUpdate[i];
            const quote = await this.getStockQuote(symbol);

            if (quote) {
                // STOCKS_DATA'yı güncelle
                const stockIndex = window.STOCKS_DATA.us_stocks.findIndex(s => s.symbol === symbol);
                if (stockIndex !== -1) {
                    window.STOCKS_DATA.us_stocks[stockIndex].price = quote.price;
                    window.STOCKS_DATA.us_stocks[stockIndex].change = quote.changePercent;
                }
            }

            // Her 10 hissede bir kısa delay (rate limit için)
            if ((i + 1) % 10 === 0) {
                await this.delay(500);
            } else {
                await this.delay(50);
            }
        }

        // MarketsManager varsa yeniden render et
        if (window.marketsManager && typeof window.marketsManager.init === 'function') {
            window.marketsManager.loadStocks();
            window.marketsManager.renderStocks();
            window.marketsManager.updateStats();
        }
    }

    /**
     * UI element güncelleme
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
        this.cache = {}; // Cache temizle
        await this.updateAllStocks();
    }

    /**
     * Tek hisse için 30 günlük grafik verisi
     */
    async getChartData(symbol) {
        const history = await this.getHistoricalData(symbol, 30);

        return {
            labels: history.map(h => h.date),
            prices: history.map(h => h.close),
            volumes: history.map(h => h.volume)
        };
    }
}

// Auto-initialize
let realTimeStocks;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        realTimeStocks = new RealTimeStockSystem();
        realTimeStocks.init();

        // Global olarak erişilebilir yap
        window.realTimeStocks = realTimeStocks;
    });
} else {
    realTimeStocks = new RealTimeStockSystem();
    realTimeStocks.init();
    window.realTimeStocks = realTimeStocks;
}
