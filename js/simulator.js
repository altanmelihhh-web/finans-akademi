// ===================================
// Trading Simulator
// ===================================

class TradingSimulator {
    constructor() {
        this.initialBalance = 10000;
        this.cash = this.loadData('simCash', this.initialBalance);
        this.portfolio = this.loadData('simPortfolio', []);
        this.transactionHistory = this.loadData('simHistory', []);
        this.performanceData = this.loadData('simPerformance', []);
        this.currentAction = 'buy';
        this.performanceChart = null;
    }

    loadData(key, defaultValue) {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    }

    saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    init() {
        console.log('📊 TradingSimulator.init() called');

        // Check if simulator page elements exist
        const simulatorPage = document.getElementById('simulator');
        if (!simulatorPage) {
            console.warn('⚠️ Simulator page not found, delaying init...');
            setTimeout(() => this.init(), 500);
            return;
        }

        this.setupEventListeners();
        this.loadStocksToSelect();
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        console.log('✅ TradingSimulator initialized');
    }

    setupEventListeners() {
        // Reset button
        document.getElementById('resetSimulator')?.addEventListener('click', () => this.resetAccount());

        // Export button
        document.getElementById('exportHistory')?.addEventListener('click', () => this.exportHistory());

        // Tutorial button
        document.getElementById('showTutorial')?.addEventListener('click', () => this.showTutorial());

        // Tutorial modal close button
        const tutorialModal = document.getElementById('tutorialModal');
        const modalClose = tutorialModal?.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                if (tutorialModal) tutorialModal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        if (tutorialModal) {
            tutorialModal.addEventListener('click', (e) => {
                if (e.target === tutorialModal) {
                    tutorialModal.style.display = 'none';
                }
            });
        }

        // Stock select
        document.getElementById('simStockSelect')?.addEventListener('change', (e) => this.onStockSelect(e));

        // Action buttons
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentAction = e.target.dataset.action;
                this.updateTradeInfo();
            });
        });

        // Order type
        document.getElementById('orderType')?.addEventListener('change', (e) => {
            const limitGroup = document.getElementById('limitPriceGroup');
            if (limitGroup) {
                limitGroup.style.display = e.target.value !== 'market' ? 'block' : 'none';
            }
        });

        // Quantity input
        document.getElementById('simQuantity')?.addEventListener('input', () => this.updateTradeInfo());

        // Execute trade
        document.getElementById('executeTradeBtn')?.addEventListener('click', () => this.executeTrade());

        // History filters
        document.querySelectorAll('.history-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.history-filters .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterHistory(e.target.dataset.filter);
            });
        });

        // Performance chart periods
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updatePerformanceChart(e.target.dataset.period);
            });
        });

        // Trade buttons in modal
        document.querySelectorAll('.trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const stock = marketsManager?.selectedStock;
                if (stock) {
                    // Pre-fill simulator with selected stock
                    document.getElementById('simStockSelect').value = stock.symbol;
                    this.currentAction = action;
                    this.onStockSelect({ target: { value: stock.symbol } });

                    // Switch to simulator page
                    document.querySelector('[data-page="simulator"]')?.click();

                    // Close modal
                    marketsManager?.closeModal();
                }
            });
        });
    }

    async loadStocksToSelect() {
        const select = document.getElementById('simStockSelect');
        if (!select) {
            console.warn('⚠️ simStockSelect element not found');
            return;
        }

        // Try multiple data sources
        let stocks = [];

        // Source 1: marketsManager (if ready)
        if (marketsManager && marketsManager.stocks && marketsManager.stocks.length > 0) {
            stocks = marketsManager.stocks;
            console.log('📊 Loaded stocks from marketsManager:', stocks.length);
        }
        // Source 2: STOCKS_DATA (fallback)
        else if (window.STOCKS_DATA) {
            const data = window.STOCKS_DATA;
            const features = window.FINANS_CONFIG?.features || {
                showUS: true,
                showBIST: true,
                showTEFAS: false,
                showBES: false
            };

            stocks = [
                ...(features.showUS ? data.us_stocks.map(s => ({ ...s, market: 'us' })) : []),
                ...(features.showBIST ? data.bist_stocks.map(s => ({ ...s, market: 'bist' })) : []),
                ...(features.showTEFAS ? (data.tefas_funds || []).map(s => ({ ...s, market: 'tefas' })) : []),
                ...(features.showBES ? (data.bes_funds || []).map(s => ({ ...s, market: 'bes' })) : [])
            ];
            console.log('📊 Loaded stocks from STOCKS_DATA:', stocks.length);
        }
        // Source 3: Wait for marketsManager
        else {
            console.log('⏳ Waiting for stock data...');
            setTimeout(() => this.loadStocksToSelect(), 500);
            return;
        }

        if (stocks.length === 0) {
            select.innerHTML = '<option value="">Hisseler yükleniyor...</option>';
            console.warn('⚠️ No stocks available yet');
            return;
        }

        // Filter out stocks with no price (still loading)
        const stocksWithPrices = stocks.filter(s => s.price && s.price > 0);

        if (stocksWithPrices.length === 0) {
            select.innerHTML = '<option value="">Fiyatlar yükleniyor...</option>';
            console.log('⏳ Stocks loaded but prices not ready yet, retrying...');
            // Retry after 1 second
            setTimeout(() => this.loadStocksToSelect(), 1000);
            return;
        }

        // Format price function
        const formatPrice = (price, market) => {
            if (market === 'bist' || market === 'tefas' || market === 'bes') {
                return `₺${price.toFixed(2)}`;
            }
            return `$${price.toFixed(2)}`;
        };

        // Populate select with stocks that have prices
        select.innerHTML = '<option value="">-- Hisse Seçin --</option>' +
            stocksWithPrices.map(s => {
                const priceText = formatPrice(s.price, s.market);
                return `<option value="${s.symbol}">${s.symbol} - ${s.name} (${priceText})</option>`;
            }).join('');

        console.log(`✅ Loaded ${stocksWithPrices.length} stocks with prices to simulator select`);
    }

    // Helper: Find stock from multiple sources
    findStock(symbol) {
        if (!symbol) return null;

        // Try marketsManager first (has real-time prices)
        if (marketsManager && marketsManager.stocks) {
            const stock = marketsManager.stocks.find(s => s.symbol === symbol);
            if (stock) return stock;
        }

        // Fallback to STOCKS_DATA
        if (window.STOCKS_DATA) {
            const allStocks = [
                ...window.STOCKS_DATA.us_stocks.map(s => ({ ...s, market: 'us' })),
                ...window.STOCKS_DATA.bist_stocks.map(s => ({ ...s, market: 'bist' }))
            ];
            return allStocks.find(s => s.symbol === symbol);
        }

        return null;
    }

    // Helper: Format price for display
    formatPrice(price, market) {
        if (!price || price === 0) return 'Fiyat yükleniyor...';
        if (market === 'bist') return `${price.toFixed(2)} TL`;
        return `$${price.toFixed(2)}`;
    }

    onStockSelect(e) {
        const symbol = e.target.value;
        const stock = this.findStock(symbol);

        if (!stock) {
            console.warn('⚠️ Stock not found:', symbol);
            return;
        }

        document.getElementById('simCurrentPrice').textContent = this.formatPrice(stock.price, stock.market);
        this.updateTradeInfo();
    }

    updateTradeInfo() {
        const symbol = document.getElementById('simStockSelect')?.value;
        if (!symbol) return;

        const stock = this.findStock(symbol);
        if (!stock) return;

        const quantity = parseInt(document.getElementById('simQuantity')?.value || 1);
        const subtotal = stock.price * quantity;
        const commission = subtotal * 0.001; // 0.1% commission
        const total = subtotal + commission;

        document.getElementById('simTotal').value = this.formatPrice(total, stock.market);
        document.getElementById('simCommission').textContent = this.formatPrice(commission, stock.market);

        if (this.currentAction === 'buy') {
            const afterBalance = this.cash - total;
            document.getElementById('simAfterBalance').textContent = '$' + afterBalance.toFixed(2);
            document.getElementById('simAfterBalance').style.color = afterBalance >= 0 ? '#10b981' : '#ef4444';
        } else {
            const holding = this.portfolio.find(p => p.symbol === symbol);
            const afterBalance = this.cash + (subtotal - commission);
            document.getElementById('simAfterBalance').textContent = '$' + afterBalance.toFixed(2);
            document.getElementById('simAfterBalance').style.color = '#10b981';

            // Update button state
            const executeBtn = document.getElementById('executeTradeBtn');
            if (executeBtn) {
                if (!holding || holding.quantity < quantity) {
                    executeBtn.disabled = true;
                    executeBtn.textContent = 'Yetersiz Hisse';
                } else {
                    executeBtn.disabled = false;
                    executeBtn.innerHTML = '<i class="fas fa-check"></i> İşlemi Gerçekleştir';
                }
            }
        }
    }

    executeTrade() {
        const symbol = document.getElementById('simStockSelect')?.value;
        if (!symbol) {
            alert('Lütfen bir hisse seçin');
            return;
        }

        const stock = this.findStock(symbol);
        if (!stock) {
            alert('Hisse bilgisi bulunamadı. Lütfen tekrar deneyin.');
            return;
        }

        const quantity = parseInt(document.getElementById('simQuantity')?.value || 1);
        const subtotal = stock.price * quantity;
        const commission = subtotal * 0.001;

        if (this.currentAction === 'buy') {
            const total = subtotal + commission;

            if (this.cash < total) {
                alert('Yetersiz bakiye! İşlem gerçekleştirilemedi.');
                return;
            }

            // Execute buy
            this.cash -= total;

            const existingHolding = this.portfolio.find(p => p.symbol === symbol);
            if (existingHolding) {
                // Update existing position
                const totalCost = (existingHolding.avgPrice * existingHolding.quantity) + subtotal;
                existingHolding.quantity += quantity;
                existingHolding.avgPrice = totalCost / existingHolding.quantity;
            } else {
                // Add new position
                this.portfolio.push({
                    symbol: symbol,
                    name: stock.name,
                    quantity: quantity,
                    avgPrice: stock.price,
                    market: stock.market
                });
            }

            // Record transaction
            this.transactionHistory.unshift({
                date: new Date().toISOString(),
                action: 'buy',
                symbol: symbol,
                name: stock.name,
                quantity: quantity,
                price: stock.price,
                commission: commission,
                total: total,
                market: stock.market
            });

            alert(`✅ ${quantity} adet ${symbol} başarıyla satın alındı!`);

        } else {
            // SELL
            const holding = this.portfolio.find(p => p.symbol === symbol);
            if (!holding || holding.quantity < quantity) {
                alert('Yetersiz hisse! Satış gerçekleştirilemedi.');
                return;
            }

            const total = subtotal - commission;
            this.cash += total;

            const profitLoss = (stock.price - holding.avgPrice) * quantity;

            // Update or remove position
            holding.quantity -= quantity;
            if (holding.quantity === 0) {
                this.portfolio = this.portfolio.filter(p => p.symbol !== symbol);
            }

            // Record transaction
            this.transactionHistory.unshift({
                date: new Date().toISOString(),
                action: 'sell',
                symbol: symbol,
                name: stock.name,
                quantity: quantity,
                price: stock.price,
                commission: commission,
                total: total,
                profitLoss: profitLoss,
                market: stock.market
            });

            alert(`✅ ${quantity} adet ${symbol} başarıyla satıldı! ${profitLoss >= 0 ? 'Kar' : 'Zarar'}: ${this.formatPrice(Math.abs(profitLoss), stock.market)}`);
        }

        // Save and update UI
        this.saveData('simCash', this.cash);
        this.saveData('simPortfolio', this.portfolio);
        this.saveData('simHistory', this.transactionHistory);

        this.recordPerformance();
        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        // Reset form
        document.getElementById('simQuantity').value = 1;
        this.updateTradeInfo();
    }

    updateAccountInfo() {
        let stockValue = 0;
        this.portfolio.forEach(holding => {
            const stock = this.findStock(holding.symbol);
            if (stock && stock.price) {
                stockValue += stock.price * holding.quantity;
            }
        });

        const totalBalance = this.cash + stockValue;
        const profitLoss = totalBalance - this.initialBalance;
        const profitLossPercent = (profitLoss / this.initialBalance) * 100;

        // Safe DOM updates with null checks
        const totalBalanceEl = document.getElementById('simTotalBalance');
        if (totalBalanceEl) totalBalanceEl.textContent = '$' + totalBalance.toFixed(2);

        const cashEl = document.getElementById('simCash');
        if (cashEl) cashEl.textContent = '$' + this.cash.toFixed(2);

        const stockValueEl = document.getElementById('simStockValue');
        if (stockValueEl) stockValueEl.textContent = '$' + stockValue.toFixed(2);

        const plElement = document.getElementById('simProfitLoss');
        if (plElement) {
            plElement.textContent = `$${profitLoss.toFixed(2)} (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)`;
            plElement.style.color = profitLoss >= 0 ? '#10b981' : '#ef4444';
        }

        // Update balance in trade panel
        const userBalanceEl = document.getElementById('userBalance');
        if (userBalanceEl) {
            userBalanceEl.textContent = '$' + this.cash.toFixed(2);
        }
    }

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

            // If stock not found (eg. TEFAS/BES removed), show with warning
            const currentPrice = stock ? stock.price : 0;
            const currentValue = currentPrice * holding.quantity;
            const costBasis = holding.avgPrice * holding.quantity;
            const profitLoss = currentValue - costBasis;
            const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

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
                            <span class="value">${stock ? this.formatPrice(stock.price, stock.market) : '❌ Veri Yok'}</span>
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

    quickSell(symbol) {
        const holding = this.portfolio.find(p => p.symbol === symbol);
        if (!holding) return;

        if (confirm(`${holding.quantity} adet ${symbol} satmak istiyor musunuz?`)) {
            // Pre-fill sell form
            document.getElementById('simStockSelect').value = symbol;
            document.getElementById('simQuantity').value = holding.quantity;
            this.currentAction = 'sell';

            // Update UI
            document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
            document.querySelector('.btn-toggle[data-action="sell"]').classList.add('active');

            this.onStockSelect({ target: { value: symbol } });

            // Scroll to trade panel
            document.querySelector('.trading-panel').scrollIntoView({ behavior: 'smooth' });
        }
    }

    renderTransactionHistory() {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        if (this.transactionHistory.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Henüz işlem yapmadınız</td></tr>';
            return;
        }

        tbody.innerHTML = this.transactionHistory.map(tx => {
            const date = new Date(tx.date).toLocaleString('tr-TR');
            const actionClass = tx.action === 'buy' ? 'positive' : 'negative';
            const actionText = tx.action === 'buy' ? 'ALIM' : 'SATIM';

            return `
                <tr>
                    <td>${date}</td>
                    <td><span class="badge ${actionClass}">${actionText}</span></td>
                    <td><strong>${tx.symbol}</strong></td>
                    <td>${tx.quantity}</td>
                    <td>${this.formatPrice(tx.price, tx.market)}</td>
                    <td>${this.formatPrice(tx.total, tx.market)}</td>
                    <td>${this.formatPrice(tx.commission, tx.market)}</td>
                    <td class="${tx.profitLoss >= 0 ? 'positive' : 'negative'}">
                        ${tx.profitLoss !== undefined ? this.formatPrice(Math.abs(tx.profitLoss), tx.market) : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterHistory(filter) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr:not(.empty-row)');
        rows.forEach(row => {
            const action = row.querySelector('.badge')?.textContent.toLowerCase();
            if (filter === 'all' || action?.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    recordPerformance() {
        const totalBalance = this.cash + this.portfolio.reduce((sum, holding) => {
            const stock = marketsManager?.stocks.find(s => s.symbol === holding.symbol);
            return sum + (stock ? stock.price * holding.quantity : 0);
        }, 0);

        this.performanceData.push({
            date: new Date().toISOString(),
            balance: totalBalance
        });

        // Keep only last 90 days
        if (this.performanceData.length > 90) {
            this.performanceData = this.performanceData.slice(-90);
        }

        this.saveData('simPerformance', this.performanceData);
    }

    renderPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        const labels = this.performanceData.map((d, i) => i + 1);
        const data = this.performanceData.map(d => d.balance);

        // Add initial balance if empty
        if (data.length === 0) {
            data.push(this.initialBalance);
            labels.push(1);
        }

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portföy Değeri',
                    data: data,
                    borderColor: data[data.length - 1] >= this.initialBalance ? '#10b981' : '#ef4444',
                    backgroundColor: data[data.length - 1] >= this.initialBalance ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
    }

    updatePerformanceChart(period) {
        // TODO: Implement period filtering
        this.renderPerformanceChart();
    }

    resetAccount() {
        if (!confirm('Hesabınızı sıfırlamak istediğinize emin misiniz? Tüm işlemler ve portföy silinecek!')) {
            return;
        }

        this.cash = this.initialBalance;
        this.portfolio = [];
        this.transactionHistory = [];
        this.performanceData = [];

        this.saveData('simCash', this.cash);
        this.saveData('simPortfolio', this.portfolio);
        this.saveData('simHistory', this.transactionHistory);
        this.saveData('simPerformance', this.performanceData);

        this.updateAccountInfo();
        this.renderPortfolio();
        this.renderTransactionHistory();
        this.renderPerformanceChart();

        alert('✅ Hesap başarıyla sıfırlandı!');
    }

    exportHistory() {
        if (this.transactionHistory.length === 0) {
            alert('İşlem geçmişi boş!');
            return;
        }

        const csv = this.transactionHistory.map(tx => {
            return [
                new Date(tx.date).toLocaleString('tr-TR'),
                tx.action === 'buy' ? 'ALIM' : 'SATIM',
                tx.symbol,
                tx.name,
                tx.quantity,
                tx.price,
                tx.total,
                tx.commission,
                tx.profitLoss || 0
            ].join(',');
        });

        csv.unshift('Tarih,İşlem,Sembol,Hisse,Adet,Fiyat,Toplam,Komisyon,Kar/Zarar');

        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `islem-gecmisi-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        alert('✅ İşlem geçmişi indirildi!');
    }

    showTutorial() {
        const modal = document.getElementById('tutorialModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Load simulator data from localStorage (called by auth.js)
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('finans_simulator_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.cash = data.cash || this.initialBalance;
                this.portfolio = data.portfolio || [];
                this.transactions = data.transactions || [];
                this.updateUI();
                console.log('✅ Simulator data loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load simulator data:', error);
        }
    }
}

// Initialize simulator
let simulator = null;

// Wait for both DOM and marketsManager to be ready
function initSimulator() {
    if (typeof marketsManager !== 'undefined' && marketsManager !== null) {
        simulator = new TradingSimulator();
        simulator.init();
        window.simulator = simulator; // Export to window
        console.log('✅ Trading Simulator initialized successfully');
    } else {
        // marketsManager not ready yet, wait a bit
        console.log('⏳ Waiting for marketsManager...');
        setTimeout(initSimulator, 100);
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initializing Trading Simulator...');
    initSimulator();
});

// Also initialize when markets page becomes active (in case marketsManager loads later)
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-page="simulator"]') && !simulator) {
        console.log('🔄 Simulator page activated, retrying initialization...');
        initSimulator();
    }
});
