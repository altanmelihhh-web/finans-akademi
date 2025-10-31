/**
 * GERÇEK PİYASA VERİLERİ
 * Ücretsiz API'lerle canlı veriler
 */

class RealMarketData {
    constructor() {
        // API Keys
        this.apiKeys = {
            alphavantage: 'demo', // https://www.alphavantage.co/support/#api-key
            finnhub: '', // https://finnhub.io/register (ücretsiz 60 req/min)
        };

        // Cache (rate limit için)
        this.cache = {};
        this.cacheTimeout = 60000; // 60 saniye cache

        // Rate limit
        this.lastRequestTime = 0;
        this.minRequestInterval = 12000; // 12 saniye (Alpha Vantage için 5 req/min)

        this.init();
    }

    init() {
        console.log('🔄 Gerçek piyasa verileri başlatılıyor...');
        this.updateAllMarkets();

        // Her 1 dakikada bir güncelle (rate limit için güvenli)
        setInterval(() => this.updateAllMarkets(), 60000);
    }

    async rateLimitedFetch(url, cacheKey) {
        // Cache kontrolü
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        // Rate limit
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }

        this.lastRequestTime = Date.now();

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Cache'e kaydet
            this.cache[cacheKey] = {
                data: data,
                time: Date.now()
            };

            return data;
        } catch (error) {
            console.error(`API error (${cacheKey}):`, error);
            return null;
        }
    }

    // 1. TCMB - Döviz Kurları (Resmi, Ücretsiz)
    async getTCMBRates() {
        try {
            // TCMB EVDS API (ücretsiz ama key gerekir)
            // Alternatif: Fixer.io, Exchange Rate API
            const url = 'https://api.exchangerate-api.com/v4/latest/USD';
            const data = await this.rateLimitedFetch(url, 'tcmb_rates');

            if (data && data.rates) {
                return {
                    USDTRY: data.rates.TRY,
                    EURTRY: (data.rates.TRY / data.rates.EUR)
                };
            }
        } catch (error) {
            console.error('TCMB error:', error);
        }
        return null;
    }

    // 2. CoinGecko - Kripto (Ücretsiz, API key gerektirmez)
    async getCryptoData() {
        try {
            const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';
            const data = await this.rateLimitedFetch(url, 'crypto');

            if (data) {
                return {
                    BTC: {
                        price: data.bitcoin.usd,
                        change: data.bitcoin.usd_24h_change
                    },
                    ETH: {
                        price: data.ethereum.usd,
                        change: data.ethereum.usd_24h_change
                    }
                };
            }
        } catch (error) {
            console.error('CoinGecko error:', error);
        }
        return null;
    }

    // 3. Alpha Vantage - US Endeksleri ve Hisseler (Ücretsiz 500 req/gün)
    async getUSMarketData(symbol) {
        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKeys.alphavantage}`;
            const data = await this.rateLimitedFetch(url, `alpha_${symbol}`);

            if (data && data['Global Quote']) {
                const quote = data['Global Quote'];
                return {
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', ''))
                };
            }
        } catch (error) {
            console.error(`Alpha Vantage error (${symbol}):`, error);
        }
        return null;
    }

    // 4. Finnhub - US Endeksleri (Ücretsiz 60 req/min)
    async getFinnhubQuote(symbol) {
        if (!this.apiKeys.finnhub) return null;

        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKeys.finnhub}`;
            const data = await this.rateLimitedFetch(url, `finnhub_${symbol}`);

            if (data && data.c) {
                return {
                    price: data.c, // current price
                    change: data.d, // change
                    changePercent: data.dp // change percent
                };
            }
        } catch (error) {
            console.error(`Finnhub error (${symbol}):`, error);
        }
        return null;
    }

    // 5. Yahoo Finance Scraping (Ücretsiz alternatif)
    async getYahooQuote(symbol) {
        try {
            // Yahoo Finance API (non-official but free)
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const data = await this.rateLimitedFetch(url, `yahoo_${symbol}`);

            if (data && data.chart && data.chart.result[0]) {
                const result = data.chart.result[0];
                const meta = result.meta;

                return {
                    price: meta.regularMarketPrice,
                    change: meta.regularMarketPrice - meta.previousClose,
                    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
                };
            }
        } catch (error) {
            console.error(`Yahoo Finance error (${symbol}):`, error);
        }
        return null;
    }

    // UI Güncelleme fonksiyonları
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

    async updateAllMarkets() {
        console.log('🔄 Piyasa verileri güncelleniyor...');

        // 1. Döviz kurları (TCMB)
        const rates = await this.getTCMBRates();
        if (rates) {
            this.updateElement('usdtry', `₺${rates.USDTRY.toFixed(2)}`);
            this.updateElement('eurtry', `₺${rates.EURTRY.toFixed(2)}`);
        }

        // Kısa delay (rate limit için)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. US Endeksleri (Yahoo Finance - ücretsiz ve güvenilir)
        const sp500 = await this.getYahooQuote('^GSPC'); // S&P 500
        if (sp500) {
            this.updateElement('sp500', sp500.price.toLocaleString('en-US', {maximumFractionDigits: 2}), sp500.changePercent);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const nasdaq = await this.getYahooQuote('^IXIC'); // NASDAQ
        if (nasdaq) {
            this.updateElement('nasdaq', nasdaq.price.toLocaleString('en-US', {maximumFractionDigits: 2}), nasdaq.changePercent);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const dow = await this.getYahooQuote('^DJI'); // DOW JONES
        if (dow) {
            this.updateElement('dow', dow.price.toLocaleString('en-US', {maximumFractionDigits: 2}), dow.changePercent);
        }

        // 3. Tech Hisseleri
        await new Promise(resolve => setTimeout(resolve, 2000));

        const aapl = await this.getYahooQuote('AAPL');
        if (aapl) {
            this.updateElement('aapl', `$${aapl.price.toFixed(2)}`, aapl.changePercent);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const msft = await this.getYahooQuote('MSFT');
        if (msft) {
            this.updateElement('msft', `$${msft.price.toFixed(2)}`, msft.changePercent);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const googl = await this.getYahooQuote('GOOGL');
        if (googl) {
            this.updateElement('googl', `$${googl.price.toFixed(2)}`, googl.changePercent);
        }

        console.log('✅ Piyasa verileri güncellendi!');
    }

    // Manuel güncelleme
    async refreshNow() {
        // Cache'i temizle
        this.cache = {};
        await this.updateAllMarkets();
    }
}

// Auto-initialize
let marketData;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        marketData = new RealMarketData();
    });
} else {
    marketData = new RealMarketData();
}
