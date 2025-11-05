/**
 * Market Data Updater Script
 * Fetches market data from APIs and updates Firestore
 * Run this script every 5 minutes via cron job or Cloud Scheduler
 *
 * Usage: node scripts/update-market-data.js
 */

import admin from 'firebase-admin';
import fetch from 'node-fetch';

// Initialize Firebase Admin SDK
// You need to download service account key from Firebase Console
// and save it as firebase-admin-key.json
import serviceAccount from '../firebase-admin-key.json' assert { type: 'json' };

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'finans-akademi'
});

const db = admin.firestore();

// API Keys (add your keys here or use environment variables)
const API_KEYS = {
    FINNHUB: process.env.FINNHUB_API_KEY || 'ctffv6hr01qjd3bu4f80ctffv6hr01qjd3bu4f8g',
    COINGECKO: 'demo', // CoinGecko doesn't require API key for basic usage
    EXCHANGERATE: process.env.EXCHANGERATE_API_KEY || 'your-key-here'
};

/**
 * Fetch USD/TRY exchange rate
 */
async function fetchForex() {
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const data = await response.json();
        return {
            USDTRY: data.rates.TRY || 35.0,
            EURTRY: data.rates.TRY / (data.rates.EUR || 1),
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('❌ Forex fetch error:', error);
        return { USDTRY: 35.0, EURTRY: 37.0, timestamp: Date.now() };
    }
}

/**
 * Fetch crypto prices
 */
async function fetchCrypto() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();

        return {
            BTC: {
                price: data.bitcoin?.usd || 0,
                change24h: data.bitcoin?.usd_24h_change || 0
            },
            ETH: {
                price: data.ethereum?.usd || 0,
                change24h: data.ethereum?.usd_24h_change || 0
            },
            BNB: {
                price: data.binancecoin?.usd || 0,
                change24h: data.binancecoin?.usd_24h_change || 0
            },
            ADA: {
                price: data.cardano?.usd || 0,
                change24h: data.cardano?.usd_24h_change || 0
            },
            SOL: {
                price: data.solana?.usd || 0,
                change24h: data.solana?.usd_24h_change || 0
            },
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('❌ Crypto fetch error:', error);
        return { timestamp: Date.now() };
    }
}

/**
 * Fetch US stocks from Finnhub
 */
async function fetchUSStocks() {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
                     'JNJ', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM', 'NFLX', 'INTC'];

    const stocks = {};

    try {
        // Fetch quotes in parallel
        const promises = symbols.map(async (symbol) => {
            try {
                const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.FINNHUB}`);
                const data = await response.json();

                if (data.c && data.c > 0) {
                    stocks[symbol] = {
                        price: data.c,
                        change: data.d,
                        changePercent: data.dp,
                        high: data.h,
                        low: data.l,
                        open: data.o,
                        prevClose: data.pc
                    };
                }
            } catch (error) {
                console.error(`❌ Error fetching ${symbol}:`, error.message);
            }
        });

        await Promise.all(promises);
        console.log(`✅ Fetched ${Object.keys(stocks).length}/${symbols.length} US stocks`);
    } catch (error) {
        console.error('❌ US stocks fetch error:', error);
    }

    stocks.timestamp = Date.now();
    return stocks;
}

/**
 * Fetch BIST stocks (mock data for now - you'll need a real BIST API)
 */
async function fetchBISTStocks() {
    // TODO: Replace with real BIST API
    // For now, return mock data that will be updated manually or via scraping
    return {
        THYAO: { price: 350.50, change: 5.20, changePercent: 1.51 },
        EREGL: { price: 52.30, change: -0.85, changePercent: -1.60 },
        SISE: { price: 45.75, change: 1.20, changePercent: 2.69 },
        TUPRS: { price: 125.40, change: -2.10, changePercent: -1.65 },
        PETKM: { price: 35.60, change: 0.75, changePercent: 2.15 },
        KRDMD: { price: 8.90, change: -0.15, changePercent: -1.66 },
        ARCLK: { price: 156.80, change: 3.45, changePercent: 2.25 },
        TAVHL: { price: 97.06, change: -1.94, changePercent: -1.96 },
        ISCTR: { price: 12.35, change: -0.23, changePercent: -1.83 },
        AKBNK: { price: 62.25, change: 1.05, changePercent: 1.71 },
        timestamp: Date.now()
    };
}

/**
 * Update Firestore with market data
 */
async function updateFirestore() {
    console.log('🔄 Fetching market data...');

    try {
        // Fetch all data in parallel
        const [forex, crypto, usStocks, bistStocks] = await Promise.all([
            fetchForex(),
            fetchCrypto(),
            fetchUSStocks(),
            fetchBISTStocks()
        ]);

        console.log('📊 Updating Firestore...');

        // Update dashboard
        await db.doc('public/market-data/dashboard').set({
            forex,
            crypto: {
                BTC: crypto.BTC,
                ETH: crypto.ETH
            },
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
            timestamp: Date.now()
        }, { merge: true });
        console.log('✅ Dashboard updated');

        // Update US stocks
        await db.doc('public/market-data/us-stocks').set(usStocks, { merge: true });
        console.log('✅ US stocks updated');

        // Update BIST stocks
        await db.doc('public/market-data/bist-stocks').set(bistStocks, { merge: true });
        console.log('✅ BIST stocks updated');

        // Update full crypto data
        await db.doc('public/market-data/crypto').set(crypto, { merge: true });
        console.log('✅ Crypto updated');

        console.log('🎉 Market data update complete!');
        return true;
    } catch (error) {
        console.error('❌ Firestore update error:', error);
        return false;
    }
}

// Run the update
updateFirestore()
    .then((success) => {
        if (success) {
            console.log('✅ Script completed successfully');
            process.exit(0);
        } else {
            console.error('❌ Script failed');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    });
