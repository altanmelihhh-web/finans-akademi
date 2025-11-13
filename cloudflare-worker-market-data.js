/**
 * Cloudflare Worker - Dynamic Market Data API
 *
 * Endpoints:
 * - /api/market-data - Get all market data (cached 5min)
 * - /api/market-data/forex - Forex only
 * - /api/market-data/crypto - Crypto only
 * - /api/market-data/stocks/us - US stocks
 * - /api/market-data/stocks/bist - BIST stocks
 *
 * Deploy: wrangler deploy
 */

const CACHE_TTL = 300; // 5 minutes
const API_KEYS = {
    FINNHUB: 'ctffv6hr01qjd3bu4f80ctffv6hr01qjd3bu4f8g',
    // Add more if needed
};

const US_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
    'JNJ', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX', 'INTC',
    'CSCO', 'XOM', 'KO', 'PFE', 'MRK', 'T', 'CMCSA', 'PEP', 'ABT', 'CVX'];

const BIST_STOCKS = {
    'THYAO.IS': 'Türk Hava Yolları', 'EREGL.IS': 'Ereğli Demir Çelik', 'SISE.IS': 'Şişe Cam',
    'TUPRS.IS': 'Tüpraş', 'PETKM.IS': 'Petkim', 'KRDMD.IS': 'Kardemir',
    'ARCLK.IS': 'Arçelik', 'TAVHL.IS': 'TAV Havalimanları', 'ISCTR.IS': 'İş Bankası C',
    'AKBNK.IS': 'Akbank', 'GARAN.IS': 'Garanti BBVA', 'YKBNK.IS': 'Yapı Kredi',
    'SAHOL.IS': 'Sabancı Holding', 'TCELL.IS': 'Turkcell', 'BIMAS.IS': 'BIM',
    'ASELS.IS': 'Aselsan', 'KCHOL.IS': 'Koç Holding', 'FROTO.IS': 'Ford Otosan',
    'TOASO.IS': 'Tofaş', 'KOZAL.IS': 'Koza Altın'
};

// Fetch Forex
async function fetchForex() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            cf: { cacheTtl: 300 }
        });
        const data = await response.json();
        return {
            USDTRY: data.rates.TRY,
            EURTRY: data.rates.TRY / data.rates.EUR,
            USDJPY: data.rates.JPY,
            GBPUSD: 1 / data.rates.GBP,
            timestamp: Date.now()
        };
    } catch (error) {
        return { USDTRY: 34.50, EURTRY: 37.20, USDJPY: 149.50, GBPUSD: 1.27, timestamp: Date.now(), error: error.message };
    }
}

// Fetch Crypto
async function fetchCrypto() {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana,ripple,dogecoin,polkadot&vs_currencies=usd&include_24hr_change=true',
            { cf: { cacheTtl: 120 } }
        );
        const data = await response.json();
        return {
            BTC: { price: data.bitcoin?.usd || 0, change24h: data.bitcoin?.usd_24h_change || 0 },
            ETH: { price: data.ethereum?.usd || 0, change24h: data.ethereum?.usd_24h_change || 0 },
            BNB: { price: data.binancecoin?.usd || 0, change24h: data.binancecoin?.usd_24h_change || 0 },
            ADA: { price: data.cardano?.usd || 0, change24h: data.cardano?.usd_24h_change || 0 },
            SOL: { price: data.solana?.usd || 0, change24h: data.solana?.usd_24h_change || 0 },
            XRP: { price: data.ripple?.usd || 0, change24h: data.ripple?.usd_24h_change || 0 },
            DOGE: { price: data.dogecoin?.usd || 0, change24h: data.dogecoin?.usd_24h_change || 0 },
            DOT: { price: data.polkadot?.usd || 0, change24h: data.polkadot?.usd_24h_change || 0 },
            timestamp: Date.now()
        };
    } catch (error) {
        return { timestamp: Date.now(), error: error.message };
    }
}

// Fetch US Stocks (Yahoo Finance)
async function fetchUSStocks() {
    const stocks = {};
    const batchSize = 10;

    for (let i = 0; i < US_STOCKS.length; i += batchSize) {
        const batch = US_STOCKS.slice(i, i + batchSize);
        await Promise.all(batch.map(async (symbol) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
                const response = await fetch(url, { cf: { cacheTtl: 120 } });
                const data = await response.json();

                if (data.chart?.result?.[0]) {
                    const result = data.chart.result[0];
                    const quote = result.indicators.quote[0];
                    const meta = result.meta;
                    const current = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose || meta.previousClose;
                    const change = current - prevClose;

                    stocks[symbol] = {
                        price: current,
                        change: change,
                        changePercent: (change / prevClose) * 100,
                        open: quote.open?.[0] || current,
                        high: quote.high?.[0] || current,
                        low: quote.low?.[0] || current,
                        volume: quote.volume?.[0] || 0
                    };
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error.message);
            }
        }));

        // Rate limiting between batches
        if (i + batchSize < US_STOCKS.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    stocks.timestamp = Date.now();
    return stocks;
}

// Fetch BIST Stocks (Yahoo Finance)
async function fetchBISTStocks() {
    const stocks = {};
    const symbols = Object.keys(BIST_STOCKS);
    const batchSize = 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        await Promise.all(batch.map(async (symbol) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
                const response = await fetch(url, { cf: { cacheTtl: 120 } });
                const data = await response.json();

                if (data.chart?.result?.[0]) {
                    const result = data.chart.result[0];
                    const quote = result.indicators.quote[0];
                    const meta = result.meta;
                    const current = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose || meta.previousClose;
                    const change = current - prevClose;
                    const cleanSymbol = symbol.replace('.IS', '');

                    stocks[cleanSymbol] = {
                        name: BIST_STOCKS[symbol],
                        price: current,
                        change: change,
                        changePercent: (change / prevClose) * 100,
                        open: quote.open?.[0] || current,
                        high: quote.high?.[0] || current,
                        low: quote.low?.[0] || current,
                        volume: quote.volume?.[0] || 0
                    };
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error.message);
            }
        }));

        if (i + batchSize < symbols.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    stocks.timestamp = Date.now();
    return stocks;
}

// Main handler
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Check cache first (using KV if available, or in-memory)
            const cacheKey = `market-data-${path}`;
            let cachedData = env.MARKET_DATA_KV ? await env.MARKET_DATA_KV.get(cacheKey, 'json') : null;

            if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL * 1000)) {
                return new Response(JSON.stringify({
                    ...cachedData,
                    cached: true,
                    age: Math.floor((Date.now() - cachedData.timestamp) / 1000)
                }), {
                    headers: {
                        ...corsHeaders,
                        'Cache-Control': `public, max-age=${CACHE_TTL}`,
                        'X-Cache': 'HIT'
                    }
                });
            }

            // Fetch fresh data
            let data = {};

            if (path === '/api/market-data' || path === '/api/market-data/') {
                // Full data
                const [forex, crypto, usStocks, bistStocks] = await Promise.all([
                    fetchForex(),
                    fetchCrypto(),
                    fetchUSStocks(),
                    fetchBISTStocks()
                ]);

                data = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    forex,
                    crypto,
                    stocks: { us: usStocks, bist: bistStocks }
                };
            } else if (path === '/api/market-data/forex') {
                data = await fetchForex();
            } else if (path === '/api/market-data/crypto') {
                data = await fetchCrypto();
            } else if (path === '/api/market-data/stocks/us') {
                data = await fetchUSStocks();
            } else if (path === '/api/market-data/stocks/bist') {
                data = await fetchBISTStocks();
            } else {
                return new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404,
                    headers: corsHeaders
                });
            }

            // Save to cache
            if (env.MARKET_DATA_KV) {
                await env.MARKET_DATA_KV.put(cacheKey, JSON.stringify(data), {
                    expirationTtl: CACHE_TTL
                });
            }

            return new Response(JSON.stringify({ ...data, cached: false }), {
                headers: {
                    ...corsHeaders,
                    'Cache-Control': `public, max-age=${CACHE_TTL}`,
                    'X-Cache': 'MISS'
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: error.message,
                timestamp: Date.now()
            }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};
