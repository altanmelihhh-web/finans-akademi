/**
 * SIMPLE MARKET DATA - DASHBOARD ONLY
 * Sadece Dashboard için minimal, hızlı veri çekimi
 * NO LOOPS, NO RATE LIMIT ISSUES!
 */

class SimpleMarketData {
    constructor() {
        this.apiKey = 'd42gjvpr01qorler9mm0d42gjvpr01qorler9mmg'; // Finnhub
        this.cache = {};
        this.cacheTimeout = 300000; // 5 dakika
        this.lastUpdate = 0;
    }

    async init() {
        console.log('🚀 Simple Market Data başlatılıyor (Dashboard only)...');

        // localStorage'dan cache yükle
        this.loadCache();

        // Cache valid mi?
        const cacheAge = Date.now() - this.lastUpdate;
        if (cacheAge < this.cacheTimeout && Object.keys(this.cache).length > 0) {
            console.log(`⚡ CACHE HIT! (${Math.floor(cacheAge / 1000)}s eski)`);
            this.renderFromCache();
        } else {
            console.log('📥 API\'den veri çekiliyor...');
            await this.fetchAll();
        }

        // Her 5 dakikada bir güncelle
        setInterval(() => {
            if (Date.now() - this.lastUpdate >= this.cacheTimeout) {
                this.fetchAll();
            }
        }, this.cacheTimeout);

        console.log('✅ Simple Market Data hazır!');
    }

    loadCache() {
        try {
            const stored = localStorage.getItem('simple_market_cache');
            if (stored) {
                const data = JSON.parse(stored);
                if (Date.now() - data.timestamp < this.cacheTimeout) {
                    this.cache = data.cache;
                    this.lastUpdate = data.timestamp;
                    return true;
                }
            }
        } catch (e) {
            console.error('Cache load error:', e);
        }
        return false;
    }

    saveCache() {
        try {
            localStorage.setItem('simple_market_cache', JSON.stringify({
                cache: this.cache,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Cache save error:', e);
        }
    }

    async fetchAll() {
        console.log('🔄 Dashboard güncelleniyor...');

        // Paralel çağrılar - HIZLI!
        const [forex, aapl, msft, tsla, crypto] = await Promise.all([
            this.getForex(),
            this.getStock('AAPL'),
            this.getStock('MSFT'),
            this.getStock('TSLA'),
            this.getCrypto()
        ]);

        // Cache'e kaydet
        this.cache = { forex, aapl, msft, tsla, crypto };
        this.lastUpdate = Date.now();
        this.saveCache();

        // UI güncelle
        this.renderAll();

        console.log('✅ Dashboard güncellendi!');
    }

    async getForex() {
        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            return {
                usdtry: data.rates.TRY,
                eurtry: data.rates.TRY / data.rates.EUR
            };
        } catch (e) {
            console.error('Forex error:', e);
            return this.cache.forex || { usdtry: 0, eurtry: 0 };
        }
    }

    async getStock(symbol) {
        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            return {
                price: data.c,
                change: data.dp
            };
        } catch (e) {
            console.error(`Stock error (${symbol}):`, e);
            return this.cache[symbol.toLowerCase()] || { price: 0, change: 0 };
        }
    }

    async getCrypto() {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
            const data = await res.json();
            return {
                btc: data.bitcoin.usd,
                btcChange: data.bitcoin.usd_24h_change,
                eth: data.ethereum.usd,
                ethChange: data.ethereum.usd_24h_change
            };
        } catch (e) {
            console.error('Crypto error:', e);
            return this.cache.crypto || { btc: 0, btcChange: 0, eth: 0, ethChange: 0 };
        }
    }

    renderFromCache() {
        this.renderAll();
    }

    renderAll() {
        if (!this.cache || Object.keys(this.cache).length === 0) return;

        // Forex
        if (this.cache.forex) {
            this.updateElement('usdtry', `₺${this.cache.forex.usdtry.toFixed(4)}`);
            this.updateElement('eurtry', `₺${this.cache.forex.eurtry.toFixed(4)}`);
        }

        // Stocks
        if (this.cache.aapl) {
            this.updateElement('aapl', `$${this.cache.aapl.price.toFixed(2)}`, this.cache.aapl.change);
        }
        if (this.cache.msft) {
            this.updateElement('msft', `$${this.cache.msft.price.toFixed(2)}`, this.cache.msft.change);
        }
        if (this.cache.tsla) {
            this.updateElement('tsla', `$${this.cache.tsla.price.toFixed(2)}`, this.cache.tsla.change);
        }

        // Crypto (console only - no UI elements yet)
        if (this.cache.crypto) {
            console.log(`₿ Bitcoin: $${this.cache.crypto.btc.toLocaleString()} (${this.cache.crypto.btcChange.toFixed(2)}%)`);
            console.log(`Ξ Ethereum: $${this.cache.crypto.eth.toLocaleString()} (${this.cache.crypto.ethChange.toFixed(2)}%)`);
        }
    }

    updateElement(id, value, changePercent = null) {
        const el = document.getElementById(id);
        if (!el) return;

        el.textContent = value;

        if (changePercent !== null) {
            const changeEl = document.getElementById(id + '-change');
            if (changeEl) {
                const sign = changePercent >= 0 ? '+' : '';
                changeEl.textContent = `${sign}${changePercent.toFixed(2)}%`;
                changeEl.className = changePercent >= 0 ? 'index-change positive' : 'index-change negative';
            }
        }
    }
}

// Auto-init
let simpleMarketData;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        simpleMarketData = new SimpleMarketData();
        simpleMarketData.init();
        window.simpleMarketData = simpleMarketData;
    });
} else {
    simpleMarketData = new SimpleMarketData();
    simpleMarketData.init();
    window.simpleMarketData = simpleMarketData;
}

console.log('📦 Simple Market Data loaded!');
