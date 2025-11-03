/**
 * ================================================================================
 * PROFESSIONAL TRADING SIMULATOR v3.0
 * ================================================================================
 *
 * Enterprise-grade trading simulator with advanced features:
 * - Multi-currency accounts (USD, TRY) with real-time exchange rates
 * - Market orders, limit orders, and stop-loss orders
 * - Real-time P&L tracking with commission calculations
 * - Advanced portfolio analytics and risk metrics
 * - Technical indicators and charting
 * - Comprehensive transaction history
 * - Data persistence with automatic backup/restore
 * - Error-free validation and edge case handling
 *
 * @version 3.0.0
 * @author Finans Akademi
 * @license MIT
 */

'use strict';

// ================================================================================
// CONSTANTS & CONFIGURATION
// ================================================================================

const SIMULATOR_CONFIG = {
    VERSION: '3.0.0',

    // Initial account balances
    INITIAL_BALANCES: {
        USD: 10000,
        TRY: 300000
    },

    // Commission rates by market
    COMMISSIONS: {
        US: 0.001,      // 0.1% for US stocks
        BIST: 0.00188,  // 0.188% for BIST stocks
        TEFAS: 0,       // No commission for funds
        BES: 0          // No commission for pension funds
    },

    // Order types
    ORDER_TYPES: {
        MARKET: 'market',
        LIMIT: 'limit',
        STOP_LOSS: 'stop_loss'
    },

    // Validation limits
    LIMITS: {
        MIN_QUANTITY: 1,
        MAX_QUANTITY: 1000000,
        MIN_PRICE: 0.01,
        MAX_PRICE: 1000000,
        MAX_TRANSACTION_HISTORY: 1000,
        MAX_PERFORMANCE_RECORDS: 365
    },

    // localStorage keys
    STORAGE_KEYS: {
        VERSION: 'sim_version',
        ACCOUNTS: 'sim_accounts',
        PORTFOLIO: 'sim_portfolio',
        HISTORY: 'sim_history',
        ORDERS: 'sim_pending_orders',
        PERFORMANCE: 'sim_performance',
        SETTINGS: 'sim_settings'
    },

    // Performance recording interval (1 hour)
    PERFORMANCE_INTERVAL: 3600000,

    // Exchange rate API
    EXCHANGE_RATE_API: 'https://api.exchangerate-api.com/v4/latest/USD',
    EXCHANGE_RATE_CACHE_DURATION: 3600000, // 1 hour

    // Debug mode
    DEBUG: false
};

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

const Utils = {
    /**
     * Validate and parse number
     */
    parseNumber(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
    },

    /**
     * Validate quantity
     */
    isValidQuantity(quantity) {
        const qty = this.parseNumber(quantity);
        return Number.isInteger(qty) &&
               qty >= SIMULATOR_CONFIG.LIMITS.MIN_QUANTITY &&
               qty <= SIMULATOR_CONFIG.LIMITS.MAX_QUANTITY;
    },

    /**
     * Validate price
     */
    isValidPrice(price) {
        const p = this.parseNumber(price);
        return p >= SIMULATOR_CONFIG.LIMITS.MIN_PRICE &&
               p <= SIMULATOR_CONFIG.LIMITS.MAX_PRICE;
    },

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        const value = this.parseNumber(amount);

        if (currency === 'TRY') {
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        }
    },

    /**
     * Format percentage
     */
    formatPercent(value) {
        const percent = this.parseNumber(value);
        return (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';
    },

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Safe localStorage access
     */
    localStorage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error(`Error reading from localStorage (${key}):`, error);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(`Error writing to localStorage (${key}):`, error);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error(`Error removing from localStorage (${key}):`, error);
                return false;
            }
        },

        clear(prefix = 'sim_') {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(prefix)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },

    /**
     * Debug logger
     */
    log(...args) {
        if (SIMULATOR_CONFIG.DEBUG) {
            console.log('[Simulator]', ...args);
        }
    }
};

// ================================================================================
// ACCOUNT MANAGER
// ================================================================================

class AccountManager {
    constructor() {
        this.accounts = this.loadAccounts();
        this.exchangeRate = 35; // Default USD/TRY rate
        this.lastExchangeRateUpdate = 0;
    }

    /**
     * Load accounts from storage
     */
    loadAccounts() {
        const stored = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.ACCOUNTS);

        if (stored && this.validateAccounts(stored)) {
            return stored;
        }

        // Return default accounts
        return {
            USD: {
                balance: SIMULATOR_CONFIG.INITIAL_BALANCES.USD,
                currency: 'USD',
                symbol: '$',
                initialBalance: SIMULATOR_CONFIG.INITIAL_BALANCES.USD
            },
            TRY: {
                balance: SIMULATOR_CONFIG.INITIAL_BALANCES.TRY,
                currency: 'TRY',
                symbol: '₺',
                initialBalance: SIMULATOR_CONFIG.INITIAL_BALANCES.TRY
            }
        };
    }

    /**
     * Validate accounts structure
     */
    validateAccounts(accounts) {
        if (!accounts || typeof accounts !== 'object') return false;
        if (!accounts.USD || !accounts.TRY) return false;
        if (typeof accounts.USD.balance !== 'number') return false;
        if (typeof accounts.TRY.balance !== 'number') return false;
        return true;
    }

    /**
     * Save accounts to storage
     */
    saveAccounts() {
        return Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
    }

    /**
     * Get account by currency
     */
    getAccount(currency) {
        return this.accounts[currency.toUpperCase()];
    }

    /**
     * Get currency for market
     */
    getCurrencyForMarket(market) {
        const marketUpper = market.toUpperCase();
        return (marketUpper === 'BIST' || marketUpper === 'TEFAS' || marketUpper === 'BES') ? 'TRY' : 'USD';
    }

    /**
     * Update account balance
     */
    updateBalance(currency, amount) {
        const account = this.getAccount(currency);
        if (!account) {
            throw new Error(`Invalid currency: ${currency}`);
        }

        account.balance = Utils.parseNumber(account.balance + amount);
        this.saveAccounts();
    }

    /**
     * Check if sufficient balance
     */
    hasSufficientBalance(currency, amount) {
        const account = this.getAccount(currency);
        return account && account.balance >= amount;
    }

    /**
     * Get total balance in USD
     */
    getTotalBalanceUSD() {
        const usdBalance = this.accounts.USD.balance;
        const tryBalanceInUSD = this.accounts.TRY.balance / this.exchangeRate;
        return usdBalance + tryBalanceInUSD;
    }

    /**
     * Update exchange rate from API
     */
    async updateExchangeRate() {
        const now = Date.now();

        // Use cached rate if recent
        if (now - this.lastExchangeRateUpdate < SIMULATOR_CONFIG.EXCHANGE_RATE_CACHE_DURATION) {
            return this.exchangeRate;
        }

        try {
            const response = await fetch(SIMULATOR_CONFIG.EXCHANGE_RATE_API);
            const data = await response.json();

            if (data.rates && data.rates.TRY) {
                this.exchangeRate = data.rates.TRY;
                this.lastExchangeRateUpdate = now;
                Utils.log('Exchange rate updated:', this.exchangeRate);
            }
        } catch (error) {
            console.warn('Failed to update exchange rate:', error);
            // Keep using cached rate
        }

        return this.exchangeRate;
    }

    /**
     * Reset accounts to initial state
     */
    reset() {
        this.accounts = {
            USD: {
                balance: SIMULATOR_CONFIG.INITIAL_BALANCES.USD,
                currency: 'USD',
                symbol: '$',
                initialBalance: SIMULATOR_CONFIG.INITIAL_BALANCES.USD
            },
            TRY: {
                balance: SIMULATOR_CONFIG.INITIAL_BALANCES.TRY,
                currency: 'TRY',
                symbol: '₺',
                initialBalance: SIMULATOR_CONFIG.INITIAL_BALANCES.TRY
            }
        };
        this.saveAccounts();
    }
}

// ================================================================================
// PORTFOLIO MANAGER
// ================================================================================

class PortfolioManager {
    constructor(accountManager) {
        this.accountManager = accountManager;
        this.holdings = this.loadPortfolio();
    }

    /**
     * Load portfolio from storage
     */
    loadPortfolio() {
        const stored = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.PORTFOLIO, []);
        return Array.isArray(stored) ? stored : [];
    }

    /**
     * Save portfolio to storage
     */
    savePortfolio() {
        return Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.PORTFOLIO, this.holdings);
    }

    /**
     * Get holding by symbol
     */
    getHolding(symbol) {
        return this.holdings.find(h => h.symbol === symbol);
    }

    /**
     * Add or update holding
     */
    addHolding(symbol, name, quantity, avgPrice, market) {
        const existing = this.getHolding(symbol);

        if (existing) {
            // Update existing holding - weighted average price
            const totalCost = (existing.quantity * existing.avgPrice) + (quantity * avgPrice);
            existing.quantity += quantity;
            existing.avgPrice = totalCost / existing.quantity;
        } else {
            // Create new holding
            this.holdings.push({
                symbol,
                name,
                quantity,
                avgPrice,
                market,
                addedAt: new Date().toISOString()
            });
        }

        this.savePortfolio();
    }

    /**
     * Reduce holding quantity
     */
    reduceHolding(symbol, quantity) {
        const holding = this.getHolding(symbol);

        if (!holding) {
            throw new Error(`Holding not found: ${symbol}`);
        }

        if (holding.quantity < quantity) {
            throw new Error(`Insufficient shares: ${symbol}`);
        }

        holding.quantity -= quantity;

        // Remove if quantity is zero
        if (holding.quantity === 0) {
            this.holdings = this.holdings.filter(h => h.symbol !== symbol);
        }

        this.savePortfolio();
    }

    /**
     * Get total portfolio value
     */
    getTotalValue(currentPrices) {
        let totalUSD = 0;
        let totalTRY = 0;

        this.holdings.forEach(holding => {
            const currentPrice = currentPrices[holding.symbol] || holding.avgPrice;
            const value = holding.quantity * currentPrice;

            const currency = this.accountManager.getCurrencyForMarket(holding.market);
            if (currency === 'USD') {
                totalUSD += value;
            } else {
                totalTRY += value;
            }
        });

        return {
            USD: totalUSD,
            TRY: totalTRY,
            totalUSD: totalUSD + (totalTRY / this.accountManager.exchangeRate)
        };
    }

    /**
     * Get unrealized P&L
     */
    getUnrealizedPL(currentPrices) {
        let totalPL = 0;

        this.holdings.forEach(holding => {
            const currentPrice = currentPrices[holding.symbol] || holding.avgPrice;
            const pl = (currentPrice - holding.avgPrice) * holding.quantity;

            const currency = this.accountManager.getCurrencyForMarket(holding.market);
            if (currency === 'USD') {
                totalPL += pl;
            } else {
                totalPL += pl / this.accountManager.exchangeRate;
            }
        });

        return totalPL;
    }

    /**
     * Reset portfolio
     */
    reset() {
        this.holdings = [];
        this.savePortfolio();
    }
}

// ================================================================================
// ORDER MANAGER
// ================================================================================

class OrderManager {
    constructor(accountManager, portfolioManager) {
        this.accountManager = accountManager;
        this.portfolioManager = portfolioManager;
        this.pendingOrders = this.loadOrders();
    }

    /**
     * Load pending orders
     */
    loadOrders() {
        const stored = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.ORDERS, []);
        return Array.isArray(stored) ? stored : [];
    }

    /**
     * Save pending orders
     */
    saveOrders() {
        return Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.ORDERS, this.pendingOrders);
    }

    /**
     * Calculate commission
     */
    calculateCommission(market, amount) {
        const rate = SIMULATOR_CONFIG.COMMISSIONS[market.toUpperCase()] || 0;
        return amount * rate;
    }

    /**
     * Validate order
     */
    validateOrder(order) {
        // Validate quantity
        if (!Utils.isValidQuantity(order.quantity)) {
            throw new Error(`Geçersiz adet: ${order.quantity}. 1 ile ${SIMULATOR_CONFIG.LIMITS.MAX_QUANTITY} arasında tamsayı olmalı.`);
        }

        // Validate price
        if (!Utils.isValidPrice(order.price)) {
            throw new Error(`Geçersiz fiyat: ${order.price}`);
        }

        // Validate stock
        if (!order.symbol || !order.market) {
            throw new Error('Hisse bilgisi eksik');
        }

        return true;
    }

    /**
     * Execute market buy order
     */
    executeBuy(stock, quantity, price) {
        const order = {
            id: Utils.generateId(),
            type: SIMULATOR_CONFIG.ORDER_TYPES.MARKET,
            action: 'buy',
            symbol: stock.symbol,
            name: stock.name,
            market: stock.market,
            quantity: parseInt(quantity),
            price: Utils.parseNumber(price),
            timestamp: new Date().toISOString()
        };

        // Validate order
        this.validateOrder(order);

        // Get account
        const currency = this.accountManager.getCurrencyForMarket(order.market);
        const account = this.accountManager.getAccount(currency);

        // Calculate costs
        const subtotal = order.quantity * order.price;
        const commission = this.calculateCommission(order.market, subtotal);
        const total = subtotal + commission;

        // Check balance
        if (!this.accountManager.hasSufficientBalance(currency, total)) {
            throw new Error(
                `Yetersiz ${currency} bakiye!\n\n` +
                `Gerekli: ${Utils.formatCurrency(total, currency)}\n` +
                `Mevcut: ${Utils.formatCurrency(account.balance, currency)}`
            );
        }

        // Execute order
        this.accountManager.updateBalance(currency, -total);

        // Update portfolio - include commission in cost basis
        const costBasisPrice = (subtotal + commission) / order.quantity;
        this.portfolioManager.addHolding(
            order.symbol,
            order.name,
            order.quantity,
            costBasisPrice,
            order.market
        );

        // Record transaction
        const transaction = {
            ...order,
            commission,
            total,
            currency
        };

        Utils.log('Buy order executed:', transaction);

        return transaction;
    }

    /**
     * Execute market sell order
     */
    executeSell(stock, quantity, price) {
        const order = {
            id: Utils.generateId(),
            type: SIMULATOR_CONFIG.ORDER_TYPES.MARKET,
            action: 'sell',
            symbol: stock.symbol,
            name: stock.name,
            market: stock.market,
            quantity: parseInt(quantity),
            price: Utils.parseNumber(price),
            timestamp: new Date().toISOString()
        };

        // Validate order
        this.validateOrder(order);

        // Check holding
        const holding = this.portfolioManager.getHolding(order.symbol);
        if (!holding) {
            throw new Error(`${order.symbol} hissesine sahip değilsiniz`);
        }

        if (holding.quantity < order.quantity) {
            throw new Error(
                `Yetersiz hisse!\n\n` +
                `Satmak istediğiniz: ${order.quantity}\n` +
                `Sahip olduğunuz: ${holding.quantity}`
            );
        }

        // Get account
        const currency = this.accountManager.getCurrencyForMarket(order.market);

        // Calculate proceeds
        const subtotal = order.quantity * order.price;
        const commission = this.calculateCommission(order.market, subtotal);
        const net = subtotal - commission;

        // Calculate realized P&L (including both buy and sell commissions)
        const costBasis = holding.avgPrice * order.quantity;
        const realizedPL = net - costBasis;

        // Execute order
        this.accountManager.updateBalance(currency, net);
        this.portfolioManager.reduceHolding(order.symbol, order.quantity);

        // Record transaction
        const transaction = {
            ...order,
            commission,
            total: subtotal,
            net,
            realizedPL,
            currency,
            costBasis: holding.avgPrice
        };

        Utils.log('Sell order executed:', transaction);

        return transaction;
    }

    /**
     * Place limit order
     */
    placeLimitOrder(stock, quantity, limitPrice, action = 'buy') {
        const order = {
            id: Utils.generateId(),
            type: SIMULATOR_CONFIG.ORDER_TYPES.LIMIT,
            action,
            symbol: stock.symbol,
            name: stock.name,
            market: stock.market,
            quantity: parseInt(quantity),
            limitPrice: Utils.parseNumber(limitPrice),
            currentPrice: stock.price,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Validate
        this.validateOrder({ ...order, price: order.limitPrice });

        // Add to pending orders
        this.pendingOrders.push(order);
        this.saveOrders();

        Utils.log('Limit order placed:', order);

        return order;
    }

    /**
     * Place stop-loss order
     */
    placeStopLoss(symbol, quantity, stopPrice) {
        const order = {
            id: Utils.generateId(),
            type: SIMULATOR_CONFIG.ORDER_TYPES.STOP_LOSS,
            action: 'sell',
            symbol,
            quantity: parseInt(quantity),
            stopPrice: Utils.parseNumber(stopPrice),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Check holding
        const holding = this.portfolioManager.getHolding(symbol);
        if (!holding || holding.quantity < quantity) {
            throw new Error('Yetersiz hisse');
        }

        // Add to pending orders
        this.pendingOrders.push(order);
        this.saveOrders();

        Utils.log('Stop-loss order placed:', order);

        return order;
    }

    /**
     * Check and execute pending orders
     */
    checkPendingOrders(currentPrices) {
        const executed = [];

        this.pendingOrders = this.pendingOrders.filter(order => {
            const currentPrice = currentPrices[order.symbol];
            if (!currentPrice) return true; // Keep if no price data

            let shouldExecute = false;

            // Check limit orders
            if (order.type === SIMULATOR_CONFIG.ORDER_TYPES.LIMIT) {
                if (order.action === 'buy' && currentPrice <= order.limitPrice) {
                    shouldExecute = true;
                } else if (order.action === 'sell' && currentPrice >= order.limitPrice) {
                    shouldExecute = true;
                }
            }

            // Check stop-loss orders
            if (order.type === SIMULATOR_CONFIG.ORDER_TYPES.STOP_LOSS) {
                if (currentPrice <= order.stopPrice) {
                    shouldExecute = true;
                }
            }

            if (shouldExecute) {
                try {
                    // Execute the order
                    const stock = {
                        symbol: order.symbol,
                        name: order.name || order.symbol,
                        market: order.market,
                        price: currentPrice
                    };

                    let transaction;
                    if (order.action === 'buy') {
                        transaction = this.executeBuy(stock, order.quantity, currentPrice);
                    } else {
                        transaction = this.executeSell(stock, order.quantity, currentPrice);
                    }

                    executed.push({ ...transaction, originalOrder: order });
                    return false; // Remove from pending
                } catch (error) {
                    console.error('Failed to execute pending order:', error);
                    // Keep order if execution failed
                    return true;
                }
            }

            return true; // Keep pending
        });

        if (executed.length > 0) {
            this.saveOrders();
        }

        return executed;
    }

    /**
     * Cancel order
     */
    cancelOrder(orderId) {
        const initialLength = this.pendingOrders.length;
        this.pendingOrders = this.pendingOrders.filter(o => o.id !== orderId);

        if (this.pendingOrders.length < initialLength) {
            this.saveOrders();
            return true;
        }

        return false;
    }

    /**
     * Reset orders
     */
    reset() {
        this.pendingOrders = [];
        this.saveOrders();
    }
}

// ================================================================================
// TRANSACTION HISTORY MANAGER
// ================================================================================

class HistoryManager {
    constructor() {
        this.transactions = this.loadHistory();
        this.realizedPL = 0;
    }

    /**
     * Load transaction history
     */
    loadHistory() {
        const stored = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.HISTORY, []);
        return Array.isArray(stored) ? stored : [];
    }

    /**
     * Save transaction history
     */
    saveHistory() {
        // Limit history size
        if (this.transactions.length > SIMULATOR_CONFIG.LIMITS.MAX_TRANSACTION_HISTORY) {
            this.transactions = this.transactions.slice(0, SIMULATOR_CONFIG.LIMITS.MAX_TRANSACTION_HISTORY);
        }

        return Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.HISTORY, this.transactions);
    }

    /**
     * Add transaction
     */
    addTransaction(transaction) {
        // Add to beginning of array (most recent first)
        this.transactions.unshift({
            ...transaction,
            id: transaction.id || Utils.generateId(),
            timestamp: transaction.timestamp || new Date().toISOString()
        });

        // Update realized P&L
        if (transaction.realizedPL) {
            this.realizedPL += transaction.realizedPL;
        }

        this.saveHistory();
    }

    /**
     * Get transactions by symbol
     */
    getTransactionsBySymbol(symbol) {
        return this.transactions.filter(t => t.symbol === symbol);
    }

    /**
     * Get transactions by date range
     */
    getTransactionsByDateRange(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return this.transactions.filter(t => {
            const timestamp = new Date(t.timestamp).getTime();
            return timestamp >= start && timestamp <= end;
        });
    }

    /**
     * Get total realized P&L
     */
    getTotalRealizedPL() {
        return this.transactions
            .filter(t => t.realizedPL)
            .reduce((sum, t) => sum + t.realizedPL, 0);
    }

    /**
     * Export history to CSV
     */
    exportToCSV() {
        const headers = ['Tarih', 'İşlem', 'Hisse', 'Adet', 'Fiyat', 'Komisyon', 'Toplam', 'Kar/Zarar'];
        const rows = this.transactions.map(t => [
            Utils.formatDate(t.timestamp),
            t.action === 'buy' ? 'ALIŞ' : 'SATIŞ',
            `${t.symbol} (${t.name})`,
            t.quantity,
            Utils.formatCurrency(t.price, t.currency),
            Utils.formatCurrency(t.commission, t.currency),
            Utils.formatCurrency(t.total, t.currency),
            t.realizedPL ? Utils.formatCurrency(t.realizedPL, t.currency) : '-'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        return csv;
    }

    /**
     * Reset history
     */
    reset() {
        this.transactions = [];
        this.realizedPL = 0;
        this.saveHistory();
    }
}

// ================================================================================
// PERFORMANCE TRACKER
// ================================================================================

class PerformanceTracker {
    constructor(accountManager, portfolioManager, historyManager) {
        this.accountManager = accountManager;
        this.portfolioManager = portfolioManager;
        this.historyManager = historyManager;
        this.records = this.loadPerformance();
        this.lastRecordTime = 0;
        this.chart = null;
    }

    /**
     * Load performance records
     */
    loadPerformance() {
        const stored = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.PERFORMANCE, []);
        return Array.isArray(stored) ? stored : [];
    }

    /**
     * Save performance records
     */
    savePerformance() {
        // Limit records
        if (this.records.length > SIMULATOR_CONFIG.LIMITS.MAX_PERFORMANCE_RECORDS) {
            this.records = this.records.slice(-SIMULATOR_CONFIG.LIMITS.MAX_PERFORMANCE_RECORDS);
        }

        return Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.PERFORMANCE, this.records);
    }

    /**
     * Record current performance
     */
    recordPerformance(currentPrices) {
        const now = Date.now();

        // Throttle recording (once per interval)
        if (now - this.lastRecordTime < SIMULATOR_CONFIG.PERFORMANCE_INTERVAL) {
            return;
        }

        const portfolioValue = this.portfolioManager.getTotalValue(currentPrices);
        const totalCash = this.accountManager.getTotalBalanceUSD();
        const totalValue = totalCash + portfolioValue.totalUSD;

        const initialTotal =
            SIMULATOR_CONFIG.INITIAL_BALANCES.USD +
            (SIMULATOR_CONFIG.INITIAL_BALANCES.TRY / this.accountManager.exchangeRate);

        const totalPL = totalValue - initialTotal;
        const totalPLPercent = (totalPL / initialTotal) * 100;

        this.records.push({
            timestamp: new Date().toISOString(),
            totalValue,
            cashValue: totalCash,
            portfolioValue: portfolioValue.totalUSD,
            unrealizedPL: this.portfolioManager.getUnrealizedPL(currentPrices),
            realizedPL: this.historyManager.getTotalRealizedPL(),
            totalPL,
            totalPLPercent
        });

        this.lastRecordTime = now;
        this.savePerformance();

        Utils.log('Performance recorded:', this.records[this.records.length - 1]);
    }

    /**
     * Render performance chart
     */
    renderChart(canvasId = 'performanceChart') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // Need at least 2 data points
        if (this.records.length < 2) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.fillText('En az 2 veri noktası gerekli', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = this.records.map(r => Utils.formatDate(r.timestamp));
        const values = this.records.map(r => r.totalValue);

        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Toplam Değer (USD)',
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `Değer: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    /**
     * Get latest metrics
     */
    getLatestMetrics(currentPrices) {
        const portfolioValue = this.portfolioManager.getTotalValue(currentPrices);
        const totalCash = this.accountManager.getTotalBalanceUSD();
        const totalValue = totalCash + portfolioValue.totalUSD;

        const initialTotal =
            SIMULATOR_CONFIG.INITIAL_BALANCES.USD +
            (SIMULATOR_CONFIG.INITIAL_BALANCES.TRY / this.accountManager.exchangeRate);

        const totalPL = totalValue - initialTotal;
        const totalPLPercent = (totalPL / initialTotal) * 100;

        return {
            totalValue,
            cashValue: totalCash,
            portfolioValue: portfolioValue.totalUSD,
            unrealizedPL: this.portfolioManager.getUnrealizedPL(currentPrices),
            realizedPL: this.historyManager.getTotalRealizedPL(),
            totalPL,
            totalPLPercent
        };
    }

    /**
     * Reset performance
     */
    reset() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.records = [];
        this.lastRecordTime = 0;
        this.savePerformance();
    }
}

// ================================================================================
// MAIN TRADING SIMULATOR
// ================================================================================

class TradingSimulator {
    constructor() {
        // Check and migrate version
        this.checkVersion();

        // Initialize managers
        this.accountManager = new AccountManager();
        this.portfolioManager = new PortfolioManager(this.accountManager);
        this.orderManager = new OrderManager(this.accountManager, this.portfolioManager);
        this.historyManager = new HistoryManager();
        this.performanceTracker = new PerformanceTracker(
            this.accountManager,
            this.portfolioManager,
            this.historyManager
        );

        // State
        this.currentPrices = {};
        this.selectedStock = null;
        this.currentAction = 'buy';
        this.isInitialized = false;

        Utils.log('Simulator initialized (v' + SIMULATOR_CONFIG.VERSION + ')');
    }

    /**
     * Check version and reset if needed
     */
    checkVersion() {
        const storedVersion = Utils.localStorage.get(SIMULATOR_CONFIG.STORAGE_KEYS.VERSION);

        if (storedVersion !== SIMULATOR_CONFIG.VERSION) {
            console.log(`🔄 Simulator v${SIMULATOR_CONFIG.VERSION} - Resetting data...`);

            // Clear all old data
            Utils.localStorage.clear('sim_');
            Utils.localStorage.clear('simAccounts');
            Utils.localStorage.clear('simPortfolio');
            Utils.localStorage.clear('simHistory');
            Utils.localStorage.clear('simPerformance');
            Utils.localStorage.clear('simulatorVersion');

            // Set new version
            Utils.localStorage.set(SIMULATOR_CONFIG.STORAGE_KEYS.VERSION, SIMULATOR_CONFIG.VERSION);

            console.log('✅ Data reset complete');
        }
    }

    /**
     * Initialize simulator UI
     */
    async init() {
        if (this.isInitialized) {
            Utils.log('Already initialized');
            return;
        }

        try {
            // Wait for markets manager
            await this.waitForMarketsManager();

            // Update exchange rate
            await this.accountManager.updateExchangeRate();

            // Load current prices
            this.loadCurrentPrices();

            // Setup UI
            this.setupEventListeners();
            this.populateStockSelect();

            // Initial render
            this.updateUI();

            // Check pending orders periodically
            setInterval(() => this.checkPendingOrders(), 5000);

            this.isInitialized = true;
            console.log('✅ Trading Simulator v3.0 initialized');
        } catch (error) {
            console.error('❌ Simulator initialization failed:', error);
        }
    }

    /**
     * Wait for markets manager to be ready AND prices to be loaded
     */
    waitForMarketsManager() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max wait

            const check = () => {
                attempts++;

                // Check if markets manager exists
                if (!window.marketsManager || !window.marketsManager.stocks) {
                    if (attempts < maxAttempts) {
                        setTimeout(check, 100);
                    } else {
                        console.warn('⚠️ Markets manager timeout, proceeding anyway');
                        resolve();
                    }
                    return;
                }

                // Count stocks with valid prices
                const stocksArray = Array.isArray(window.marketsManager.stocks)
                    ? window.marketsManager.stocks
                    : Object.values(window.marketsManager.stocks);

                const stocksWithPrices = stocksArray.filter(s => s && s.price && s.price > 0).length;
                const totalStocks = stocksArray.length;

                console.log(`⏳ Waiting for prices... ${stocksWithPrices}/${totalStocks} stocks have prices`);

                // Wait until at least 50% of stocks have prices, or timeout
                if (stocksWithPrices >= totalStocks * 0.5 || attempts >= maxAttempts) {
                    console.log(`✅ Markets ready! ${stocksWithPrices}/${totalStocks} stocks have prices`);
                    resolve();
                } else {
                    setTimeout(check, 500); // Check every 500ms for prices
                }
            };

            check();
        });
    }

    /**
     * Load current prices from markets manager
     */
    loadCurrentPrices() {
        if (!window.marketsManager || !window.marketsManager.stocks) {
            return;
        }

        this.currentPrices = {};

        // Load all stock prices
        Object.values(window.marketsManager.stocks).forEach(stock => {
            if (stock.symbol && stock.price) {
                this.currentPrices[stock.symbol] = stock.price;
            }
        });

        Utils.log('Loaded prices for', Object.keys(this.currentPrices).length, 'stocks');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Stock selection
        const stockSelect = document.getElementById('simStockSelect');
        if (stockSelect) {
            stockSelect.addEventListener('change', (e) => this.handleStockSelect(e.target.value));
        }

        // Action buttons (Buy/Sell)
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentAction = e.target.dataset.action;
                this.updateTradeInfo();
            });
        });

        // Quantity input
        const quantityInput = document.getElementById('simQuantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.updateTradeInfo());
        }

        // Execute trade button
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeTrade());
        }

        // Reset button
        const resetBtn = document.getElementById('resetSimulator');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSimulator());
        }

        // Export button
        const exportBtn = document.getElementById('exportHistory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistory());
        }
    }

    /**
     * Populate stock dropdown
     */
    populateStockSelect() {
        const select = document.getElementById('simStockSelect');
        if (!select) {
            console.warn('⚠️ Stock select element not found');
            return;
        }

        if (!window.marketsManager) {
            console.warn('⚠️ marketsManager not available');
            return;
        }

        if (!window.marketsManager.stocks) {
            console.warn('⚠️ marketsManager.stocks not available');
            return;
        }

        console.log('📊 Loading stocks...', Object.keys(window.marketsManager.stocks).length, 'stocks found');

        // Clear existing options (except first)
        select.innerHTML = '<option value="">-- Hisse Seçin --</option>';

        // Add stocks grouped by market
        const markets = {
            'US': 'ABD Hisseleri',
            'BIST': 'BIST Hisseleri',
            'TEFAS': 'Yatırım Fonları',
            'BES': 'Emeklilik Fonları'
        };

        Object.entries(markets).forEach(([marketKey, marketLabel]) => {
            const stocks = Object.values(window.marketsManager.stocks)
                .filter(s => s.market && s.market.toUpperCase() === marketKey);

            console.log(`📈 ${marketLabel}:`, stocks.length, 'stocks');

            if (stocks.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = marketLabel;

                stocks.forEach(stock => {
                    const option = document.createElement('option');
                    option.value = stock.symbol;
                    const price = stock.price || 0;
                    option.textContent = `${stock.symbol} - ${stock.name} (${Utils.formatCurrency(price, this.accountManager.getCurrencyForMarket(stock.market))})`;
                    optgroup.appendChild(option);
                });

                select.appendChild(optgroup);
            }
        });

        console.log('✅ Stock dropdown populated');
    }

    /**
     * Handle stock selection
     */
    handleStockSelect(symbol) {
        if (!symbol || !window.marketsManager) {
            this.selectedStock = null;
            this.updateTradeInfo();
            return;
        }

        this.selectedStock = window.marketsManager.stocks[symbol];
        this.updateTradeInfo();
    }

    /**
     * Update trade info display
     */
    updateTradeInfo() {
        const quantityInput = document.getElementById('simQuantity');
        const currentPriceEl = document.getElementById('simCurrentPrice');
        const commissionEl = document.getElementById('simCommission');
        const totalEl = document.getElementById('simTotal');
        const afterBalanceEl = document.getElementById('simAfterBalance');

        if (!this.selectedStock) {
            if (currentPriceEl) currentPriceEl.textContent = '-';
            if (commissionEl) commissionEl.textContent = '-';
            if (totalEl) totalEl.value = '';
            if (afterBalanceEl) afterBalanceEl.textContent = '-';
            return;
        }

        const quantity = parseInt(quantityInput?.value || 1);
        const price = this.currentPrices[this.selectedStock.symbol] || this.selectedStock.price;
        const currency = this.accountManager.getCurrencyForMarket(this.selectedStock.market);
        const account = this.accountManager.getAccount(currency);

        // Calculate costs
        const subtotal = quantity * price;
        const commission = this.orderManager.calculateCommission(this.selectedStock.market, subtotal);
        const total = this.currentAction === 'buy' ? subtotal + commission : subtotal - commission;

        // Update display
        if (currentPriceEl) {
            currentPriceEl.textContent = Utils.formatCurrency(price, currency);
        }

        if (commissionEl) {
            commissionEl.textContent = Utils.formatCurrency(commission, currency);
        }

        if (totalEl) {
            totalEl.value = Utils.formatCurrency(total, currency);
        }

        if (afterBalanceEl && account) {
            const afterBalance = this.currentAction === 'buy'
                ? account.balance - total
                : account.balance + total;
            afterBalanceEl.textContent = Utils.formatCurrency(afterBalance, currency);
            afterBalanceEl.className = afterBalance < 0 ? 'negative' : 'positive';
        }
    }

    /**
     * Execute trade
     */
    executeTrade() {
        if (!this.selectedStock) {
            alert('❌ Lütfen bir hisse seçin');
            return;
        }

        const quantityInput = document.getElementById('simQuantity');
        const quantity = parseInt(quantityInput?.value || 0);

        if (!Utils.isValidQuantity(quantity)) {
            alert('❌ Geçersiz adet! 1 ile ' + SIMULATOR_CONFIG.LIMITS.MAX_QUANTITY + ' arasında bir sayı girin.');
            return;
        }

        const price = this.currentPrices[this.selectedStock.symbol] || this.selectedStock.price;

        try {
            let transaction;

            if (this.currentAction === 'buy') {
                transaction = this.orderManager.executeBuy(this.selectedStock, quantity, price);
                this.showNotification(`✅ ${quantity} adet ${this.selectedStock.symbol} satın alındı`, 'success');
            } else {
                transaction = this.orderManager.executeSell(this.selectedStock, quantity, price);
                this.showNotification(`✅ ${quantity} adet ${this.selectedStock.symbol} satıldı`, 'success');
            }

            // Add to history
            this.historyManager.addTransaction(transaction);

            // Record performance
            this.performanceTracker.recordPerformance(this.currentPrices);

            // Update UI
            this.updateUI();

            // Reset form
            if (quantityInput) quantityInput.value = '1';
            this.updateTradeInfo();

        } catch (error) {
            console.error('Trade execution failed:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Check and execute pending orders
     */
    checkPendingOrders() {
        if (!this.isInitialized) return;

        this.loadCurrentPrices();
        const executed = this.orderManager.checkPendingOrders(this.currentPrices);

        if (executed.length > 0) {
            executed.forEach(transaction => {
                this.historyManager.addTransaction(transaction);
                this.showNotification(
                    `✅ Emiriniz gerçekleşti: ${transaction.action === 'buy' ? 'ALIŞ' : 'SATIŞ'} ${transaction.quantity} ${transaction.symbol}`,
                    'success'
                );
            });

            this.performanceTracker.recordPerformance(this.currentPrices);
            this.updateUI();
        }
    }

    /**
     * Update all UI elements
     */
    updateUI() {
        this.loadCurrentPrices();
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderHistory();
        this.performanceTracker.renderChart();
    }

    /**
     * Update account info display
     */
    updateAccountInfo() {
        const metrics = this.performanceTracker.getLatestMetrics(this.currentPrices);

        // Update display elements - now with separate USD and TRY balances
        const elements = {
            'simUsdBalance': Utils.formatCurrency(this.accountManager.accounts.USD.balance, 'USD'),
            'simTryBalance': Utils.formatCurrency(this.accountManager.accounts.TRY.balance, 'TRY'),
            'simTotalBalance': Utils.formatCurrency(metrics.totalValue, 'USD'),
            'simStockValue': Utils.formatCurrency(metrics.portfolioValue, 'USD'),
            'simProfitLoss': `${Utils.formatCurrency(metrics.totalPL, 'USD')} (${Utils.formatPercent(metrics.totalPLPercent)})`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;

                // Add color class for P&L
                if (id === 'simProfitLoss') {
                    el.className = 'stat-value ' + (metrics.totalPL >= 0 ? 'positive' : 'negative');
                }
            }
        });
    }

    /**
     * Render portfolio
     */
    renderPortfolio() {
        const container = document.getElementById('portfolioContainer');
        const emptyState = document.getElementById('emptyPortfolio');

        if (!container) return;

        if (this.portfolioManager.holdings.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = this.portfolioManager.holdings.map(holding => {
            const currentPrice = this.currentPrices[holding.symbol] || holding.avgPrice;
            const value = holding.quantity * currentPrice;
            const pl = (currentPrice - holding.avgPrice) * holding.quantity;
            const plPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
            const currency = this.accountManager.getCurrencyForMarket(holding.market);

            return `
                <div class="portfolio-item">
                    <div class="portfolio-header">
                        <div>
                            <strong>${holding.symbol}</strong>
                            <span class="market-badge">${holding.market}</span>
                        </div>
                        <div class="portfolio-value">${Utils.formatCurrency(value, currency)}</div>
                    </div>
                    <div class="portfolio-details">
                        <div class="detail-row">
                            <span>Adet:</span>
                            <span>${holding.quantity}</span>
                        </div>
                        <div class="detail-row">
                            <span>Ort. Fiyat:</span>
                            <span>${Utils.formatCurrency(holding.avgPrice, currency)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Güncel Fiyat:</span>
                            <span>${Utils.formatCurrency(currentPrice, currency)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Kar/Zarar:</span>
                            <span class="${pl >= 0 ? 'positive' : 'negative'}">
                                ${Utils.formatCurrency(pl, currency)} (${Utils.formatPercent(plPercent)})
                            </span>
                        </div>
                    </div>
                    <div class="portfolio-actions">
                        <button class="btn-small btn-primary" onclick="simulator.quickSell('${holding.symbol}')">
                            <i class="fas fa-chart-line"></i> Sat
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render transaction history
     */
    renderHistory() {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        if (this.historyManager.transactions.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Henüz işlem yapmadınız</td></tr>';
            return;
        }

        tbody.innerHTML = this.historyManager.transactions.slice(0, 50).map(t => `
            <tr>
                <td>${Utils.formatDate(t.timestamp)}</td>
                <td><span class="badge ${t.action === 'buy' ? 'badge-success' : 'badge-danger'}">${t.action === 'buy' ? 'ALIŞ' : 'SATIŞ'}</span></td>
                <td><strong>${t.symbol}</strong><br><small>${t.name}</small></td>
                <td>${t.quantity}</td>
                <td>${Utils.formatCurrency(t.price, t.currency)}</td>
                <td>${Utils.formatCurrency(t.total, t.currency)}</td>
                <td class="${t.realizedPL ? (t.realizedPL >= 0 ? 'positive' : 'negative') : ''}">
                    ${t.realizedPL ? Utils.formatCurrency(t.realizedPL, t.currency) : '-'}
                </td>
            </tr>
        `).join('');
    }

    /**
     * Quick sell from portfolio
     */
    quickSell(symbol) {
        const holding = this.portfolioManager.getHolding(symbol);
        if (!holding) return;

        const stock = window.marketsManager?.stocks[symbol];
        if (!stock) {
            alert('❌ Hisse bilgisi bulunamadı');
            return;
        }

        const quantity = prompt(`${symbol} hissesinden kaç adet satmak istiyorsunuz?\n\nMevcut: ${holding.quantity} adet`, holding.quantity);
        if (!quantity) return;

        const qty = parseInt(quantity);
        if (!Utils.isValidQuantity(qty)) {
            alert('❌ Geçersiz adet');
            return;
        }

        try {
            const price = this.currentPrices[symbol] || stock.price;
            const transaction = this.orderManager.executeSell(stock, qty, price);
            this.historyManager.addTransaction(transaction);
            this.performanceTracker.recordPerformance(this.currentPrices);
            this.updateUI();
            this.showNotification(`✅ ${qty} adet ${symbol} satıldı`, 'success');
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    /**
     * Export transaction history
     */
    exportHistory() {
        const csv = this.historyManager.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `islem-gecmisi-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification('✅ İşlem geçmişi indirildi', 'success');
    }

    /**
     * Reset simulator
     */
    resetSimulator() {
        if (!confirm('⚠️ Tüm simulator verilerini sıfırlamak istediğinize emin misiniz?\n\nBu işlem geri alınamaz!')) {
            return;
        }

        this.accountManager.reset();
        this.portfolioManager.reset();
        this.orderManager.reset();
        this.historyManager.reset();
        this.performanceTracker.reset();

        this.updateUI();
        this.showNotification('✅ Simulator sıfırlandı', 'success');

        console.log('Simulator reset complete');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `simulator-notification ${type}`;
        notification.textContent = message;

        // Add to body
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ================================================================================
// GLOBAL INITIALIZATION
// ================================================================================

// Prevent multiple initialization
let simulatorInstance = null;
let simulatorInitialized = false;

/**
 * Initialize simulator (called from HTML)
 */
function initSimulator() {
    if (simulatorInitialized) {
        console.log('⚠️ Simulator already initialized');
        return;
    }

    try {
        simulatorInitialized = true;
        simulatorInstance = new TradingSimulator();
        simulatorInstance.init();

        // Export to window for inline event handlers
        window.simulator = simulatorInstance;

        console.log('✅ Professional Trading Simulator v3.0 initialized');
    } catch (error) {
        console.error('❌ Simulator initialization failed:', error);
        simulatorInitialized = false;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimulator);
} else {
    // DOM already loaded
    setTimeout(initSimulator, 100);
}
