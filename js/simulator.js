/**
 * ===================================
 * TRADING SIMULATOR V2
 * ===================================
 *
 * Robust multi-currency trading simulator with:
 * - Separate USD and TRY accounts
 * - Comprehensive validation
 * - Proper error handling
 * - Clean data persistence
 * - Accurate P&L tracking
 */

class TradingSimulator {
    constructor() {
        // Initial balances
        this.initialBalances = {
            usd: 10000,
            try: 300000
        };

        // Commission rates per market
        this.commissionRates = {
            us: 0.001,      // 0.1%
            bist: 0.00188,  // 0.188% (Turkish rate)
            tefas: 0,       // No commission
            bes: 0          // No commission
        };

        // Exchange rate for combined reporting (will be updated from API)
        this.exchangeRate = 35; // USD/TRY

        // Retry counters
        this.initRetries = 0;
        this.stockLoadRetries = 0;
        this.maxRetries = 10;

        // Performance tracking
        this.performanceChart = null;
        this.lastPerformanceRecord = 0; // Timestamp to prevent over-recording

        // Debug mode (set to false in production)
        this.debug = false; // PRODUCTION MODE

        // Check version and auto-reset if old data
        this.checkAndMigrateVersion();

        // Load data with validation
        this.loadAllData();
    }

    /**
     * Check version and migrate
     */
    checkAndMigrateVersion() {
        const currentVersion = '2.0';
        const storedVersion = localStorage.getItem('simulatorVersion');

        if (storedVersion !== currentVersion) {
            console.log('🔄 Simulator V2.0 - Resetting all data...');

            // Clear ALL old data
            localStorage.removeItem('simCash');
            localStorage.removeItem('simAccounts');
            localStorage.removeItem('simPortfolio');
            localStorage.removeItem('simHistory');
            localStorage.removeItem('simPerformance');

            // Set version
            localStorage.setItem('simulatorVersion', currentVersion);

            console.log('✅ Data reset for V2.0');
        }
    }

    /**
     * Logging helper
     */
    log(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }

    /**
     * Load and validate all data from localStorage
     */
    loadAllData() {
        // Load accounts
        const defaultAccounts = {
            usd: { balance: this.initialBalances.usd, currency: 'USD', symbol: '$' },
            try: { balance: this.initialBalances.try, currency: 'TRY', symbol: '₺' }
        };
        this.accounts = this.loadData('simAccounts', defaultAccounts);

        // Validate and migrate accounts
        this.validateAccounts();

        // Load portfolio with validation
        this.portfolio = this.loadData('simPortfolio', []);
        this.validatePortfolio();

        // Load transaction history with validation
        this.transactionHistory = this.loadData('simHistory', []);
        this.validateTransactionHistory();

        // Load performance data with validation
        this.performanceData = this.loadData('simPerformance', []);
        this.validatePerformanceData();

        // Trading state
        this.currentAction = 'buy';

        this.log('💳 Data loaded:', {
            accounts: this.accounts,
            portfolioCount: this.portfolio.length,
            transactionCount: this.transactionHistory.length,
            performancePoints: this.performanceData.length
        });
    }

    /**
     * Load data from localStorage with JSON parsing
     */
    loadData(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error(`❌ Error loading ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Save data to localStorage with quota handling
     */
    saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('❌ localStorage quota exceeded!');

                // Try to free up space
                if (key === 'simHistory' && Array.isArray(value)) {
                    const limitedHistory = value.slice(0, 50);
                    localStorage.setItem(key, JSON.stringify(limitedHistory));
                    this.transactionHistory = limitedHistory;
                    alert('⚠️ Depolama alanı dolu! Eski işlemler temizlendi.');
                    return true;
                }

                alert('⚠️ Veri kaydedilemedi! Tarayıcı depolama alanı dolu.');
                return false;
            }
            console.error(`❌ Error saving ${key}:`, error);
            return false;
        }
    }

    /**
     * Validate and migrate account structure
     */
    validateAccounts() {
        let needsSave = false;

        // Check USD account
        if (!this.accounts.usd || typeof this.accounts.usd.balance !== 'number' || isNaN(this.accounts.usd.balance)) {
            console.warn('⚠️ Invalid USD account, resetting');
            this.accounts.usd = {
                balance: this.initialBalances.usd,
                currency: 'USD',
                symbol: '$'
            };
            needsSave = true;
        }

        // Check TRY account
        if (!this.accounts.try || typeof this.accounts.try.balance !== 'number' || isNaN(this.accounts.try.balance)) {
            console.warn('⚠️ Invalid TRY account, resetting');
            this.accounts.try = {
                balance: this.initialBalances.try,
                currency: 'TRY',
                symbol: '₺'
            };
            needsSave = true;
        }

        // Migrate old single-currency data
        const oldCash = localStorage.getItem('simCash');
        if (oldCash) {
            const cash = parseFloat(oldCash);
            if (!isNaN(cash)) {
                console.log('📦 Migrating old cash to USD account');
                this.accounts.usd.balance = cash;
                needsSave = true;
            }
            localStorage.removeItem('simCash');
        }

        if (needsSave) {
            this.saveData('simAccounts', this.accounts);
        }
    }

    /**
     * Validate portfolio structure
     */
    validatePortfolio() {
        let needsSave = false;

        this.portfolio = this.portfolio.filter(holding => {
            // Check required fields
            if (!holding.symbol || !holding.quantity || !holding.avgPrice) {
                console.warn('⚠️ Invalid portfolio entry, removing:', holding);
                needsSave = true;
                return false;
            }

            // Add market field if missing
            if (!holding.market) {
                console.warn(`⚠️ Adding missing market field for ${holding.symbol}`);
                holding.market = 'us'; // Default to US
                needsSave = true;
            }

            // Validate numeric values
            holding.quantity = parseInt(holding.quantity);
            holding.avgPrice = parseFloat(holding.avgPrice);

            if (isNaN(holding.quantity) || isNaN(holding.avgPrice) || holding.quantity <= 0 || holding.avgPrice <= 0) {
                console.warn('⚠️ Invalid numeric values, removing:', holding);
                needsSave = true;
                return false;
            }

            return true;
        });

        if (needsSave) {
            this.saveData('simPortfolio', this.portfolio);
        }
    }

    /**
     * Validate transaction history
     */
    validateTransactionHistory() {
        let needsSave = false;

        this.transactionHistory = this.transactionHistory.filter(tx => {
            // Check required fields
            if (!tx.symbol || !tx.date || !tx.action) {
                console.warn('⚠️ Invalid transaction, removing:', tx);
                needsSave = true;
                return false;
            }

            // Add market field if missing
            if (!tx.market) {
                console.warn(`⚠️ Adding missing market field for transaction ${tx.symbol}`);
                tx.market = 'us';
                needsSave = true;
            }

            return true;
        });

        if (needsSave) {
            this.saveData('simHistory', this.transactionHistory);
        }
    }

    /**
     * Validate performance data
     */
    validatePerformanceData() {
        let needsSave = false;

        this.performanceData = this.performanceData.filter(entry => {
            // Check required fields
            if (!entry.date || typeof entry.balance !== 'number') {
                console.warn('⚠️ Invalid performance entry, removing:', entry);
                needsSave = true;
                return false;
            }

            // Add USD/TRY fields if missing
            if (typeof entry.usd !== 'number' || typeof entry.try !== 'number') {
                console.warn('⚠️ Adding missing currency fields to performance data');
                entry.usd = entry.balance || 0;
                entry.try = 0;
                needsSave = true;
            }

            return true;
        });

        // Keep only last 90 days
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const beforeCount = this.performanceData.length;
        this.performanceData = this.performanceData.filter(entry =>
            new Date(entry.date).getTime() >= ninetyDaysAgo
        );

        if (this.performanceData.length < beforeCount) {
            needsSave = true;
        }

        if (needsSave) {
            this.saveData('simPerformance', this.performanceData);
        }
    }

    /**
     * Get account key for a market
     */
    getAccountKey(market) {
        // Turkish markets use TRY
        if (market === 'bist' || market === 'tefas' || market === 'bes') {
            return 'try';
        }
        // US and others use USD
        return 'usd';
    }

    /**
     * Get account for a market
     */
    getAccount(market) {
        const key = this.getAccountKey(market);
        return this.accounts[key];
    }

    /**
     * Calculate commission for a market
     */
    calculateCommission(subtotal, market) {
        const rate = this.commissionRates[market] || 0.001;
        return subtotal * rate;
    }

    /**
     * Format price with currency
     */
    formatPrice(price, market) {
        if (price === undefined || price === null || isNaN(price)) {
            return 'N/A';
        }

        const account = this.getAccount(market);
        return `${account.symbol}${price.toFixed(2)}`;
    }

    /**
     * Validate price
     */
    isValidPrice(price) {
        return price !== undefined &&
               price !== null &&
               !isNaN(price) &&
               price > 0;
    }

    /**
     * Validate quantity
     */
    isValidQuantity(quantity) {
        return Number.isInteger(quantity) &&
               quantity > 0 &&
               quantity <= 100000;
    }

    /**
     * Find stock by symbol
     */
    findStock(symbol) {
        if (!window.STOCKS_DATA) {
            return null;
        }

        const allStocks = [
            ...(window.STOCKS_DATA.us_stocks || []).map(s => ({ ...s, market: 'us' })),
            ...(window.STOCKS_DATA.bist_stocks || []).map(s => ({ ...s, market: 'bist' })),
            ...(window.STOCKS_DATA.tefas_funds || []).map(s => ({ ...s, market: 'tefas' })),
            ...(window.STOCKS_DATA.bes_funds || []).map(s => ({ ...s, market: 'bes' }))
        ];

        return allStocks.find(s => s.symbol === symbol);
    }

    /**
     * Initialize simulator
     */
    init() {
        this.log('📊 TradingSimulator.init() called');

        // Check if simulator page exists
        const simulatorPage = document.getElementById('simulator');
        if (!simulatorPage) {
            if (this.initRetries < this.maxRetries) {
                this.initRetries++;
                console.warn(`⚠️ Simulator page not found, retry ${this.initRetries}/${this.maxRetries}`);
                setTimeout(() => this.init(), 500);
            } else {
                console.error('❌ Simulator failed to initialize - page not found');
            }
            return;
        }

        this.initRetries = 0;

        // Setup event listeners
        this.setupEventListeners();

        // Load stocks
        this.loadStocksToSelect();

        // Update UI
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        // Fetch exchange rate
        this.fetchExchangeRate();

        this.log('✅ TradingSimulator initialized successfully');
    }

    /**
     * Fetch current exchange rate
     */
    async fetchExchangeRate() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            if (data.rates && data.rates.TRY) {
                this.exchangeRate = data.rates.TRY;
                this.log(`💱 Exchange rate updated: 1 USD = ${this.exchangeRate.toFixed(2)} TRY`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to fetch exchange rate, using default:', this.exchangeRate);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Buy/Sell toggle
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentAction = e.target.dataset.action;
                this.updateTradeInfo();
            });
        });

        // Stock selection
        const stockSelect = document.getElementById('simStockSelect');
        if (stockSelect) {
            stockSelect.addEventListener('change', (e) => this.onStockSelect(e));
        }

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
            resetBtn.addEventListener('click', () => this.resetAccount());
        }

        // Export button
        const exportBtn = document.getElementById('exportHistory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistory());
        }

        // Tutorial button
        const tutorialBtn = document.getElementById('showTutorial');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => this.showTutorial());
        }

        // Tutorial modal close
        const tutorialModal = document.getElementById('tutorialModal');
        if (tutorialModal) {
            const closeBtn = tutorialModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    tutorialModal.style.display = 'none';
                });
            }

            tutorialModal.addEventListener('click', (e) => {
                if (e.target === tutorialModal) {
                    tutorialModal.style.display = 'none';
                }
            });
        }

        // Chart period filters
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.updatePerformanceChart(period);
            });
        });
    }

    /**
     * Load stocks into select dropdown
     */
    loadStocksToSelect() {
        const select = document.getElementById('simStockSelect');
        if (!select) {
            this.log('⚠️ Stock select element not found');
            return;
        }

        // Wait for marketsManager
        if (!window.marketsManager || !window.marketsManager.stocks) {
            if (this.stockLoadRetries < this.maxRetries) {
                this.stockLoadRetries++;
                this.log(`⏳ Waiting for marketsManager... (${this.stockLoadRetries}/${this.maxRetries})`);
                setTimeout(() => this.loadStocksToSelect(), 500);
            } else {
                select.innerHTML = '<option value="">❌ Hisseler yüklenemedi</option>';
            }
            return;
        }

        this.stockLoadRetries = 0;

        const stocks = window.marketsManager.stocks;
        this.log(`📊 Loading ${stocks.length} stocks`);

        // Wait for prices
        const stocksWithPrices = stocks.filter(s => s.price && s.price > 0);
        if (stocksWithPrices.length === 0) {
            this.log('⏳ Waiting for stock prices...');
            setTimeout(() => this.loadStocksToSelect(), 1000);
            return;
        }

        // Group by market
        const grouped = {
            'ABD Hisseleri': stocksWithPrices.filter(s => s.market === 'us'),
            'BIST Hisseleri': stocksWithPrices.filter(s => s.market === 'bist')
        };

        // Build HTML
        let html = '<option value="">Hisse seçin...</option>';

        for (const [groupName, groupStocks] of Object.entries(grouped)) {
            if (groupStocks.length > 0) {
                html += `<optgroup label="${groupName}">`;
                groupStocks.forEach(stock => {
                    const currency = stock.market === 'bist' ? '₺' : '$';
                    html += `<option value="${stock.symbol}">${stock.symbol} - ${stock.name} (${currency}${stock.price.toFixed(2)})</option>`;
                });
                html += '</optgroup>';
            }
        }

        select.innerHTML = html;
        this.log(`✅ Loaded ${stocksWithPrices.length} stocks to select`);
    }

    /**
     * Handle stock selection
     */
    onStockSelect(event) {
        const symbol = event.target.value;
        if (!symbol) return;

        const stock = this.findStock(symbol);
        if (!stock) {
            console.error('❌ Stock not found:', symbol);
            return;
        }

        // Update current price display
        const priceEl = document.getElementById('simCurrentPrice');
        if (priceEl) {
            if (this.isValidPrice(stock.price)) {
                priceEl.textContent = this.formatPrice(stock.price, stock.market);
            } else {
                priceEl.textContent = 'Fiyat yükleniyor...';
            }
        }

        this.updateTradeInfo();
    }

    /**
     * Update trade info panel
     */
    updateTradeInfo() {
        const symbol = document.getElementById('simStockSelect')?.value;
        if (!symbol) return;

        const stock = this.findStock(symbol);
        if (!stock) return;

        // Validate price
        if (!this.isValidPrice(stock.price)) {
            this.disableExecuteButton('Fiyat Bekleniyor...');
            return;
        }

        // Get and validate quantity
        const quantityInput = document.getElementById('simQuantity')?.value;
        const quantity = parseInt(quantityInput || '1');

        if (!this.isValidQuantity(quantity)) {
            this.disableExecuteButton('Geçersiz Adet');
            return;
        }

        // Calculate amounts
        const subtotal = stock.price * quantity;
        const commission = this.calculateCommission(subtotal, stock.market);
        const total = subtotal + commission;

        // Get account
        const account = this.getAccount(stock.market);

        // Update UI
        const totalEl = document.getElementById('simTotal');
        if (totalEl) {
            totalEl.value = this.formatPrice(total, stock.market);
        }

        const commissionEl = document.getElementById('simCommission');
        if (commissionEl) {
            commissionEl.textContent = this.formatPrice(commission, stock.market);
        }

        // Handle buy/sell specific logic
        if (this.currentAction === 'buy') {
            const afterBalance = account.balance - total;

            const afterBalanceEl = document.getElementById('simAfterBalance');
            if (afterBalanceEl) {
                afterBalanceEl.textContent = `${account.symbol}${afterBalance.toFixed(2)}`;
                afterBalanceEl.style.color = afterBalance >= 0 ? '#10b981' : '#ef4444';
            }

            // Enable/disable execute button
            if (afterBalance < 0) {
                this.disableExecuteButton('Yetersiz Bakiye');
            } else {
                this.enableExecuteButton();
            }
        } else {
            // SELL
            const holding = this.portfolio.find(p => p.symbol === symbol);
            const afterBalance = account.balance + (subtotal - commission);

            const afterBalanceEl = document.getElementById('simAfterBalance');
            if (afterBalanceEl) {
                afterBalanceEl.textContent = `${account.symbol}${afterBalance.toFixed(2)}`;
                afterBalanceEl.style.color = '#10b981';
            }

            // Check if has enough shares
            if (!holding || holding.quantity < quantity) {
                this.disableExecuteButton('Yetersiz Hisse');
            } else {
                this.enableExecuteButton();
            }
        }
    }

    /**
     * Disable execute button
     */
    disableExecuteButton(message) {
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.disabled = true;
            executeBtn.textContent = message;
        }
    }

    /**
     * Enable execute button
     */
    enableExecuteButton() {
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<i class="fas fa-check"></i> İşlemi Gerçekleştir';
        }
    }

    /**
     * Execute trade (buy or sell)
     */
    executeTrade() {
        const symbol = document.getElementById('simStockSelect')?.value;
        if (!symbol) {
            alert('⚠️ Lütfen bir hisse seçin');
            return;
        }

        const stock = this.findStock(symbol);
        if (!stock) {
            alert('❌ Hisse bilgisi bulunamadı');
            return;
        }

        // Validate price
        if (!this.isValidPrice(stock.price)) {
            alert('❌ Geçersiz fiyat! Lütfen bekleyin veya sayfayı yenileyin.');
            return;
        }

        // Get and validate quantity
        const quantityInput = document.getElementById('simQuantity')?.value;
        const quantity = parseInt(quantityInput || '1');

        if (!this.isValidQuantity(quantity)) {
            alert('❌ Geçersiz adet! 1-100,000 arasında bir sayı girin.');
            return;
        }

        // Calculate amounts
        const subtotal = stock.price * quantity;
        const commission = this.calculateCommission(subtotal, stock.market);

        // Get account
        const account = this.getAccount(stock.market);
        const accountKey = this.getAccountKey(stock.market);

        this.log(`💰 Executing ${this.currentAction}:`, {
            symbol,
            market: stock.market,
            accountKey,
            balance: account.balance,
            quantity,
            price: stock.price,
            subtotal,
            commission
        });

        if (this.currentAction === 'buy') {
            this.executeBuy(stock, quantity, subtotal, commission, account, accountKey);
        } else {
            this.executeSell(stock, quantity, subtotal, commission, account, accountKey);
        }
    }

    /**
     * Execute buy order
     */
    executeBuy(stock, quantity, subtotal, commission, account, accountKey) {
        const total = subtotal + commission;

        // Final balance check
        if (account.balance < total) {
            alert(`❌ Yetersiz ${account.currency} bakiye!

Gerekli: ${this.formatPrice(total, stock.market)}
Mevcut: ${this.formatPrice(account.balance, stock.market)}`);
            return;
        }

        // Deduct from account
        account.balance -= total;

        // Update portfolio
        const existingHolding = this.portfolio.find(p => p.symbol === stock.symbol);
        if (existingHolding) {
            // Update existing position - include commission in cost basis
            const previousCost = existingHolding.avgPrice * existingHolding.quantity;
            const newCost = subtotal + commission;
            const totalCost = previousCost + newCost;
            existingHolding.quantity += quantity;
            existingHolding.avgPrice = totalCost / existingHolding.quantity;
        } else {
            // Add new position
            this.portfolio.push({
                symbol: stock.symbol,
                name: stock.name,
                quantity: quantity,
                avgPrice: (subtotal + commission) / quantity,
                market: stock.market
            });
        }

        // Record transaction
        this.transactionHistory.unshift({
            date: new Date().toISOString(),
            action: 'buy',
            symbol: stock.symbol,
            name: stock.name,
            quantity: quantity,
            price: stock.price,
            commission: commission,
            total: total,
            market: stock.market
        });

        // Save all data
        this.saveData('simAccounts', this.accounts);
        this.saveData('simPortfolio', this.portfolio);
        this.saveData('simHistory', this.transactionHistory);

        // Record performance
        this.recordPerformance();

        // Update UI
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        // Reset form
        document.getElementById('simQuantity').value = 1;
        this.updateTradeInfo();

        // Success message
        alert(`✅ ${quantity} adet ${stock.symbol} başarıyla satın alındı!

Ödenen: ${this.formatPrice(total, stock.market)}
Komisyon: ${this.formatPrice(commission, stock.market)}`);

        this.log('✅ Buy executed successfully');
    }

    /**
     * Execute sell order
     */
    executeSell(stock, quantity, subtotal, commission, account, accountKey) {
        // Check holdings
        const holding = this.portfolio.find(p => p.symbol === stock.symbol);

        if (!holding || holding.quantity < quantity) {
            alert(`❌ Yetersiz hisse!

Portföyünüzde: ${holding ? holding.quantity : 0} adet
İstenen: ${quantity} adet`);
            return;
        }

        // Calculate realized P&L
        const saleProceeds = subtotal - commission;
        const costBasis = holding.avgPrice * quantity;
        const profitLoss = saleProceeds - costBasis;

        // Credit to account
        account.balance += saleProceeds;

        // Update portfolio
        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            this.portfolio = this.portfolio.filter(p => p.symbol !== stock.symbol);
        }

        // Record transaction
        this.transactionHistory.unshift({
            date: new Date().toISOString(),
            action: 'sell',
            symbol: stock.symbol,
            name: stock.name,
            quantity: quantity,
            price: stock.price,
            commission: commission,
            total: saleProceeds,
            profitLoss: profitLoss,
            market: stock.market
        });

        // Save all data
        this.saveData('simAccounts', this.accounts);
        this.saveData('simPortfolio', this.portfolio);
        this.saveData('simHistory', this.transactionHistory);

        // Record performance
        this.recordPerformance();

        // Update UI
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        // Reset form
        document.getElementById('simQuantity').value = 1;
        this.updateTradeInfo();

        // Success message
        const plText = profitLoss >= 0 ? 'Kar' : 'Zarar';
        alert(`✅ ${quantity} adet ${stock.symbol} başarıyla satıldı!

Alınan: ${this.formatPrice(saleProceeds, stock.market)}
Komisyon: ${this.formatPrice(commission, stock.market)}
${plText}: ${this.formatPrice(Math.abs(profitLoss), stock.market)}`);

        this.log('✅ Sell executed successfully');
    }

    /**
     * Record performance snapshot
     */
    recordPerformance() {
        const now = Date.now();

        // Only record once per hour to avoid excessive data
        if (now - this.lastPerformanceRecord < 3600000) {
            return;
        }

        this.lastPerformanceRecord = now;

        // Calculate portfolio values
        let usdValue = this.accounts.usd.balance;
        let tryValue = this.accounts.try.balance;

        this.portfolio.forEach(holding => {
            const stock = this.findStock(holding.symbol);
            if (stock && this.isValidPrice(stock.price)) {
                const value = stock.price * holding.quantity;
                if (this.getAccountKey(stock.market) === 'usd') {
                    usdValue += value;
                } else {
                    tryValue += value;
                }
            }
        });

        // Combined value for charting
        const combinedValue = usdValue + (tryValue / this.exchangeRate);

        this.performanceData.push({
            date: new Date().toISOString(),
            balance: combinedValue,
            usd: usdValue,
            try: tryValue
        });

        // Keep only last 90 days
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
        this.performanceData = this.performanceData.filter(entry =>
            new Date(entry.date).getTime() >= ninetyDaysAgo
        );

        this.saveData('simPerformance', this.performanceData);
    }

    /**
     * Update account info panel
     */
    updateAccountInfo() {
        // Calculate portfolio values
        let usdStockValue = 0;
        let tryStockValue = 0;

        this.portfolio.forEach(holding => {
            const stock = this.findStock(holding.symbol);
            if (stock && this.isValidPrice(stock.price)) {
                const value = stock.price * holding.quantity;
                if (this.getAccountKey(stock.market) === 'usd') {
                    usdStockValue += value;
                } else {
                    tryStockValue += value;
                }
            }
        });

        // Calculate totals
        const usdTotal = this.accounts.usd.balance + usdStockValue;
        const tryTotal = this.accounts.try.balance + tryStockValue;

        // Calculate P&L
        const usdPL = usdTotal - this.initialBalances.usd;
        const tryPL = tryTotal - this.initialBalances.try;
        const usdPLPercent = (usdPL / this.initialBalances.usd) * 100;
        const tryPLPercent = (tryPL / this.initialBalances.try) * 100;

        // Update UI elements
        this.updateElement('simTotalBalance', `$${usdTotal.toFixed(2)} / ₺${tryTotal.toFixed(2)}`);
        this.updateElement('simCash', `$${this.accounts.usd.balance.toFixed(2)} / ₺${this.accounts.try.balance.toFixed(2)}`);
        this.updateElement('simStockValue', `$${usdStockValue.toFixed(2)} / ₺${tryStockValue.toFixed(2)}`);

        const plElement = document.getElementById('simProfitLoss');
        if (plElement) {
            const avgPLPercent = (usdPLPercent + tryPLPercent) / 2;
            plElement.textContent = `$${usdPL.toFixed(2)} / ₺${tryPL.toFixed(2)} (${avgPLPercent >= 0 ? '+' : ''}${avgPLPercent.toFixed(2)}%)`;
            plElement.style.color = avgPLPercent >= 0 ? '#10b981' : '#ef4444';
        }

        // Update balance in trade panel
        this.updateElement('userBalance', `USD: $${this.accounts.usd.balance.toFixed(2)} | TRY: ₺${this.accounts.try.balance.toFixed(2)}`);
    }

    /**
     * Helper to update element text
     */
    updateElement(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }

    /**
     * Render portfolio
     */
    renderPortfolio() {
        const container = document.getElementById('portfolioContainer');
        const emptyState = document.getElementById('emptyPortfolio');

        if (this.portfolio.length === 0) {
            if (container) container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (container) container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        if (!container) return;

        container.innerHTML = this.portfolio.map(holding => {
            const stock = this.findStock(holding.symbol);

            const currentPrice = stock && this.isValidPrice(stock.price) ? stock.price : 0;
            const currentValue = currentPrice * holding.quantity;
            const costBasis = holding.avgPrice * holding.quantity;
            const profitLoss = currentValue - costBasis;
            const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

            const priceDisplay = stock && this.isValidPrice(stock.price)
                ? this.formatPrice(stock.price, stock.market)
                : '❌ Veri Yok';

            return `
                <div class="portfolio-card">
                    <div class="portfolio-header">
                        <div>
                            <h3>${holding.symbol}</h3>
                            <p class="portfolio-name">${holding.name}</p>
                        </div>
                        <button class="btn-small btn-danger" onclick="simulator.quickSell('${holding.symbol}')">
                            <i class="fas fa-minus"></i> Sat
                        </button>
                    </div>
                    <div class="portfolio-stats">
                        <div class="stat">
                            <span class="label">Adet</span>
                            <span class="value">${holding.quantity}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Ort. Maliyet</span>
                            <span class="value">${this.formatPrice(holding.avgPrice, holding.market)}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Güncel Fiyat</span>
                            <span class="value">${priceDisplay}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Toplam Değer</span>
                            <span class="value">${this.formatPrice(currentValue, holding.market)}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Kar/Zarar</span>
                            <span class="value ${profitLoss >= 0 ? 'positive' : 'negative'}">
                                ${this.formatPrice(Math.abs(profitLoss), holding.market)} (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Quick sell from portfolio
     */
    quickSell(symbol) {
        const holding = this.portfolio.find(p => p.symbol === symbol);
        if (!holding) return;

        if (!confirm(`${holding.quantity} adet ${symbol} satmak istiyor musunuz?`)) {
            return;
        }

        // Pre-fill sell form
        document.getElementById('simStockSelect').value = symbol;
        document.getElementById('simQuantity').value = holding.quantity;
        this.currentAction = 'sell';

        // Update UI
        document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        const sellBtn = document.querySelector('.btn-toggle[data-action="sell"]');
        if (sellBtn) {
            sellBtn.classList.add('active');
        }

        this.onStockSelect({ target: { value: symbol } });

        // Scroll to trade panel
        document.getElementById('tradePanel')?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Render transaction history
     */
    renderTransactionHistory() {
        const tbody = document.querySelector('#historyTable tbody');
        if (!tbody) return;

        if (this.transactionHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">
                        Henüz işlem yapılmadı
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactionHistory.map(tx => {
            const date = new Date(tx.date).toLocaleString('tr-TR');
            const action = tx.action === 'buy' ? 'ALIM' : 'SATIM';
            const actionClass = tx.action === 'buy' ? 'buy' : 'sell';

            return `
                <tr>
                    <td>${date}</td>
                    <td><span class="action-badge ${actionClass}">${action}</span></td>
                    <td><strong>${tx.symbol}</strong></td>
                    <td>${tx.quantity}</td>
                    <td>${this.formatPrice(tx.price, tx.market)}</td>
                    <td>${this.formatPrice(tx.total, tx.market)}</td>
                    <td>${this.formatPrice(tx.commission, tx.market)}</td>
                    <td>${tx.profitLoss !== undefined
                        ? `<span class="${tx.profitLoss >= 0 ? 'positive' : 'negative'}">${this.formatPrice(Math.abs(tx.profitLoss), tx.market)}</span>`
                        : '-'
                    }</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render performance chart
     */
    renderPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.performanceChart) {
            this.performanceChart.destroy();
            this.performanceChart = null;
        }

        const ctx = canvas.getContext('2d');
        const labels = this.performanceData.map((d, i) => i + 1);
        const data = this.performanceData.map(d => d.balance);

        // Initial combined balance
        const initialTotal = this.initialBalances.usd + (this.initialBalances.try / this.exchangeRate);

        // Add initial point if empty
        if (data.length === 0) {
            data.push(initialTotal);
            labels.push('Start');
        }

        const finalValue = data[data.length - 1];
        const isProfit = finalValue >= initialTotal;

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portföy Değeri (USD equiv.)',
                    data: data,
                    borderColor: isProfit ? '#10b981' : '#ef4444',
                    backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#cbd5e1' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Değer: $' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        },
                        grid: { color: '#334155' }
                    }
                }
            }
        });
    }

    /**
     * Update performance chart with period filter
     */
    updatePerformanceChart(period) {
        // Filter data
        let filteredData = this.performanceData;

        if (period !== 'all') {
            const days = parseInt(period);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            filteredData = this.performanceData.filter(entry =>
                new Date(entry.date) >= cutoffDate
            );
        }

        // Temporarily replace data
        const originalData = this.performanceData;
        this.performanceData = filteredData;

        // Re-render
        this.renderPerformanceChart();

        // Restore original data
        this.performanceData = originalData;
    }

    /**
     * Reset account
     */
    resetAccount() {
        if (!confirm('Hesabınızı sıfırlamak istediğinize emin misiniz?\n\nTüm işlemler ve portföy silinecek!')) {
            return;
        }

        // Reset accounts
        this.accounts = {
            usd: { balance: this.initialBalances.usd, currency: 'USD', symbol: '$' },
            try: { balance: this.initialBalances.try, currency: 'TRY', symbol: '₺' }
        };

        this.portfolio = [];
        this.transactionHistory = [];
        this.performanceData = [];

        // Clean up old data
        localStorage.removeItem('simCash');

        // Save new data
        this.saveData('simAccounts', this.accounts);
        this.saveData('simPortfolio', this.portfolio);
        this.saveData('simHistory', this.transactionHistory);
        this.saveData('simPerformance', this.performanceData);

        // Update UI
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        alert('✅ Hesap başarıyla sıfırlandı!\n\n💵 USD: $10,000\n💴 TRY: ₺300,000');
    }

    /**
     * Export transaction history as CSV
     */
    exportHistory() {
        if (this.transactionHistory.length === 0) {
            alert('⚠️ İşlem geçmişi boş!');
            return;
        }

        const csv = this.transactionHistory.map(tx => {
            const currency = this.getAccount(tx.market).currency;
            return [
                new Date(tx.date).toLocaleString('tr-TR'),
                tx.action === 'buy' ? 'ALIM' : 'SATIM',
                tx.symbol,
                tx.name,
                currency,
                tx.market,
                tx.quantity,
                tx.price.toFixed(2),
                tx.total.toFixed(2),
                tx.commission.toFixed(2),
                (tx.profitLoss || 0).toFixed(2)
            ].join(',');
        });

        csv.unshift('Tarih,İşlem,Sembol,Hisse,Para Birimi,Piyasa,Adet,Fiyat,Toplam,Komisyon,Kar/Zarar');

        const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `islem-gecmisi-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.log('✅ Transaction history exported');
    }

    /**
     * Show tutorial
     */
    showTutorial() {
        const modal = document.getElementById('tutorialModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

// ===================================
// INITIALIZATION
// ===================================

let simulator = null;
let simulatorInitialized = false;

function initSimulator() {
    // Prevent multiple initialization
    if (simulatorInitialized) {
        console.log('⚠️ Simulator already initialized, skipping...');
        return;
    }

    // Wait for marketsManager
    if (!window.marketsManager) {
        console.log('⏳ Waiting for marketsManager...');
        setTimeout(initSimulator, 100);
        return;
    }

    simulatorInitialized = true;

    // Create simulator instance
    simulator = new TradingSimulator();
    simulator.init();

    // Export to window for onclick handlers
    window.simulator = simulator;

    console.log('✅ Trading Simulator V2 initialized successfully');
}

// Start when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initializing Trading Simulator V2...');
    initSimulator();
});

// Also try to init when simulator page becomes active
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-page="simulator"]') && !simulatorInitialized) {
        console.log('🔄 Simulator page activated, initializing...');
        initSimulator();
    }
});
