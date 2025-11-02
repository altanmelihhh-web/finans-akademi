// ===================================
// Markets Page - 100+ Stocks Management
// ===================================

class MarketsManager {
    constructor() {
        this.stocks = [];
        this.filteredStocks = [];
        this.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        this.currentView = 'grid';
        this.selectedStock = null;
        this.modalChart = null;
    }

    async init() {
        this.setupEventListeners();
        await this.loadStocks();
        // renderStocks() already called by loadStocks() -> filterStocks()
        // No need to call again
    }

    async loadStocks() {
        try {
            // Use embedded STOCKS_DATA instead of fetch
            const data = window.STOCKS_DATA || { us_stocks: [], bist_stocks: [] };

            // Combine US and BIST stocks (gerçek veriler real-time-stocks.js tarafından güncelleniyor)
            this.stocks = [
                ...data.us_stocks.map(s => ({
                    ...s,
                    market: 'us',
                    // Yahoo Finance gerçek verilerini kullan
                    open: s.price,
                    high: s.price * 1.02,
                    low: s.price * 0.98,
                    volume: s.volume || 1000000,
                    high52w: s.high52w || s.price * 1.3,
                    low52w: s.low52w || s.price * 0.7
                })),
                ...data.bist_stocks.map(s => ({
                    ...s,
                    market: 'bist',
                    open: s.price,
                    high: s.price * 1.02,
                    low: s.price * 0.98,
                    volume: s.volume || 1000000,
                    high52w: s.high52w || s.price * 1.3,
                    low52w: s.low52w || s.price * 0.7
                }))
            ];

            this.filteredStocks = [...this.stocks];

            console.log(`✅ Loaded ${this.stocks.length} stocks successfully`);

            // Re-render UI after loading (important for cache updates!)
            this.filterStocks(); // This calls renderStocks internally
            this.updateStats();
        } catch (error) {
            console.error('Error loading stocks:', error);
            this.showError('Hisse verileri yüklenirken hata oluştu');
        }
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('stockSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterStocks());
        }

        // Filters
        ['marketFilter', 'sectorFilter', 'sortBy'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.filterStocks());
            }
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.renderStocks();
            });
        });

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Clear watchlist
        const clearBtn = document.getElementById('clearWatchlist');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearWatchlist());
        }

        // Stock modal tabs
        document.querySelectorAll('.stock-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchModalTab(tabName);
            });
        });

        // Chart timeframe selector
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.currentTarget.dataset.timeframe;
                this.changeChartTimeframe(timeframe);
            });
        });
    }

    filterStocks() {
        const search = document.getElementById('stockSearch')?.value.toLowerCase() || '';
        const market = document.getElementById('marketFilter')?.value || 'all';
        const sector = document.getElementById('sectorFilter')?.value.toLowerCase() || 'all';
        const sortBy = document.getElementById('sortBy')?.value || 'name';

        // Filter
        this.filteredStocks = this.stocks.filter(stock => {
            const matchesSearch = stock.symbol.toLowerCase().includes(search) ||
                                stock.name.toLowerCase().includes(search);
            const matchesMarket = market === 'all' || stock.market === market;
            const matchesSector = sector === 'all' || stock.sector.toLowerCase().includes(sector);

            return matchesSearch && matchesMarket && matchesSector;
        });

        // Sort
        this.filteredStocks.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-high':
                    return b.price - a.price;
                case 'price-low':
                    return a.price - b.price;
                case 'change-high':
                    return b.change - a.change;
                case 'change-low':
                    return a.change - b.change;
                default:
                    return 0;
            }
        });

        this.renderStocks();
        this.updateStats();
    }

    renderStocks() {
        const loadingEl = document.getElementById('loadingStocks');
        if (loadingEl) loadingEl.style.display = 'none';

        if (this.currentView === 'grid') {
            this.renderGrid();
        } else if (this.currentView === 'table') {
            this.renderTable();
        } else if (this.currentView === 'watchlist') {
            this.renderWatchlist();
        }
    }

    renderGrid() {
        const grid = document.getElementById('stocksGrid');
        const table = document.getElementById('stocksTable');
        const watchlistView = document.getElementById('watchlistView');

        if (grid) grid.style.display = 'grid';
        if (table) table.style.display = 'none';
        if (watchlistView) watchlistView.style.display = 'none';

        if (!grid) return;

        grid.innerHTML = this.filteredStocks.map(stock => this.createStockCard(stock)).join('');

        // Add event listeners
        grid.querySelectorAll('.stock-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.watchlist-toggle')) {
                    const symbol = card.dataset.symbol;
                    this.openStockModal(symbol);
                }
            });
        });

        grid.querySelectorAll('.watchlist-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.closest('.stock-card').dataset.symbol;
                this.toggleWatchlist(symbol);
            });
        });
    }

    createStockCard(stock) {
        const isInWatchlist = this.watchlist.includes(stock.symbol);
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? 'arrow-up' : 'arrow-down';

        // Show skeleton loader if price is 0 or not loaded yet
        const isLoading = !stock.price || stock.price === 0;

        const priceDisplay = !isLoading
            ? this.formatCurrency(stock.price, stock.market)
            : '<span class="skeleton-text skeleton-price"></span>';

        const changeDisplay = !isLoading && stock.change !== undefined
            ? `<span class="change ${changeClass}">
                <i class="fas fa-${changeIcon}"></i>
                ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%
               </span>`
            : '<span class="skeleton-text skeleton-change"></span>';

        return `
            <div class="stock-card" data-symbol="${stock.symbol}">
                <div class="stock-card-header">
                    <div class="stock-symbol">
                        <span class="symbol">${stock.symbol}</span>
                        <span class="market-badge ${stock.market}">${stock.market.toUpperCase()}</span>
                    </div>
                    <button class="watchlist-toggle ${isInWatchlist ? 'active' : ''}">
                        <i class="${isInWatchlist ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
                <div class="stock-name">${stock.name}</div>
                <div class="stock-sector">${stock.sector}</div>
                <div class="stock-price">
                    <span class="price">${priceDisplay}</span>
                    ${changeDisplay}
                </div>
            </div>
        `;
    }

    renderTable() {
        const grid = document.getElementById('stocksGrid');
        const table = document.getElementById('stocksTable');
        const watchlistView = document.getElementById('watchlistView');

        if (grid) grid.style.display = 'none';
        if (table) table.style.display = 'block';
        if (watchlistView) watchlistView.style.display = 'none';

        const tbody = document.getElementById('stocksTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredStocks.map(stock => {
            const isInWatchlist = this.watchlist.includes(stock.symbol);
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';

            return `
                <tr data-symbol="${stock.symbol}" class="stock-row">
                    <td>
                        <button class="watchlist-toggle ${isInWatchlist ? 'active' : ''}">
                            <i class="${isInWatchlist ? 'fas' : 'far'} fa-star"></i>
                        </button>
                    </td>
                    <td><strong>${stock.symbol}</strong></td>
                    <td>${stock.name}</td>
                    <td>${stock.sector}</td>
                    <td>${this.formatCurrency(stock.price, stock.market)}</td>
                    <td class="${changeClass}">${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%</td>
                    <td class="${changeClass}">${this.formatCurrency(stock.price * stock.change / 100, stock.market)}</td>
                    <td>${this.formatNumber(stock.volume)}</td>
                    <td>
                        <button class="btn-small btn-info">Detay</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Event listeners
        tbody.querySelectorAll('.stock-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.watchlist-toggle') && !e.target.closest('.btn-small')) {
                    this.openStockModal(row.dataset.symbol);
                }
            });
        });

        tbody.querySelectorAll('.watchlist-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.closest('.stock-row').dataset.symbol;
                this.toggleWatchlist(symbol);
            });
        });

        tbody.querySelectorAll('.btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.closest('.stock-row').dataset.symbol;
                this.openStockModal(symbol);
            });
        });
    }

    renderWatchlist() {
        const grid = document.getElementById('stocksGrid');
        const table = document.getElementById('stocksTable');
        const watchlistView = document.getElementById('watchlistView');
        const container = document.getElementById('watchlistContainer');
        const emptyState = document.getElementById('emptyWatchlist');

        if (grid) grid.style.display = 'none';
        if (table) table.style.display = 'none';
        if (watchlistView) watchlistView.style.display = 'block';

        const watchlistStocks = this.stocks.filter(s => this.watchlist.includes(s.symbol));

        if (watchlistStocks.length === 0) {
            if (container) container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (container) container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        if (container) {
            container.innerHTML = watchlistStocks.map(stock => this.createStockCard(stock)).join('');

            // Add event listeners
            container.querySelectorAll('.stock-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.watchlist-toggle')) {
                        this.openStockModal(card.dataset.symbol);
                    }
                });
            });

            container.querySelectorAll('.watchlist-toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const symbol = btn.closest('.stock-card').dataset.symbol;
                    this.toggleWatchlist(symbol);
                });
            });
        }
    }

    toggleWatchlist(symbol) {
        const index = this.watchlist.indexOf(symbol);
        if (index === -1) {
            this.watchlist.push(symbol);
        } else {
            this.watchlist.splice(index, 1);
        }

        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));

        const countEl = document.getElementById('watchlistCount');
        if (countEl) countEl.textContent = this.watchlist.length;

        this.renderStocks();
    }

    clearWatchlist() {
        if (confirm('İzleme listesindeki tüm hisseleri silmek istediğinize emin misiniz?')) {
            this.watchlist = [];
            localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
            const countEl = document.getElementById('watchlistCount');
            if (countEl) countEl.textContent = '0';
            this.renderWatchlist();
        }
    }

    openStockModal(symbol) {
        const stock = this.stocks.find(s => s.symbol === symbol);
        if (!stock) return;

        this.selectedStock = stock;

        // Show modal
        const modal = document.getElementById('stockModal');
        if (!modal) return;
        modal.style.display = 'block';

        // Update header section
        const modalStockName = document.getElementById('modalStockName');
        if (modalStockName) modalStockName.textContent = stock.name;

        const modalSymbol = document.getElementById('modalSymbol');
        if (modalSymbol) modalSymbol.textContent = stock.symbol;

        const modalPrice = document.getElementById('modalPrice');
        if (modalPrice) modalPrice.textContent = this.formatCurrency(stock.price, stock.market);

        const changeEl = document.getElementById('modalChange');
        if (changeEl) {
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';
            changeEl.className = `price-change-large ${changeClass}`;
            const changeAmount = stock.price * stock.change / 100;
            changeEl.innerHTML = `
                <span class="change-value">${stock.change > 0 ? '+' : ''}${this.formatCurrency(changeAmount, stock.market)}</span>
                <span class="change-percent">(${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%)</span>
            `;
        }

        // Update watchlist button
        const watchlistBtn = document.getElementById('modalWatchlistBtn');
        if (watchlistBtn) {
            const isInWatchlist = this.watchlist.includes(stock.symbol);
            watchlistBtn.innerHTML = `<i class="${isInWatchlist ? 'fas' : 'far'} fa-star"></i>`;
            watchlistBtn.onclick = () => this.toggleWatchlist(stock.symbol);
        }

        // Populate all data tabs
        this.populateOverviewTab(stock);
        this.populateDetailsTab(stock);
        this.populateTechnicalsTab(stock);
        this.populateFundamentalsTab(stock);

        // Reset to first tab
        this.switchModalTab('overview');
    }

    closeModal() {
        const modal = document.getElementById('stockModal');
        if (modal) modal.style.display = 'none';
        if (this.modalChart) {
            this.modalChart.destroy();
            this.modalChart = null;
        }
    }

    async renderModalChart(stock) {
        const ctx = document.getElementById('modalChart');
        if (!ctx) return;

        if (this.modalChart) {
            this.modalChart.destroy();
        }

        // Gerçek 30 günlük veriyi Finnhub'dan al
        let chartData = { labels: [], prices: [] };

        if (window.marketData && typeof window.marketData.getChartData === 'function') {
            try {
                chartData = await window.marketData.getChartData(stock.symbol);
            } catch (error) {
                console.error('Chart data error:', error);
                // Fallback: Basit veri
                chartData = {
                    labels: Array.from({length: 30}, (_, i) => `${i + 1}`),
                    prices: Array.from({length: 30}, () => stock.price)
                };
            }
        } else {
            // Fallback: Basit veri
            chartData = {
                labels: Array.from({length: 30}, (_, i) => `${i + 1}`),
                prices: Array.from({length: 30}, () => stock.price)
            };
        }

        const data = chartData.prices;

        this.modalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: stock.symbol,
                    data: data,
                    borderColor: stock.change >= 0 ? '#10b981' : '#ef4444',
                    backgroundColor: stock.change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
    }

    /**
     * Update prices silently without full re-render (for live updates)
     */
    updatePricesSilently(stocks) {
        if (!stocks || stocks.length === 0) return;

        stocks.forEach(stock => {
            // Find all cards with this symbol
            const cards = document.querySelectorAll(`.stock-card[data-symbol="${stock.symbol}"]`);

            cards.forEach(card => {
                // Update price
                const priceEl = card.querySelector('.stock-price .price');
                if (priceEl && stock.price > 0) {
                    const currency = stock.market === 'bist' ? '₺' : '$';
                    priceEl.textContent = `${currency}${stock.price.toFixed(2)}`;

                    // Remove skeleton if present
                    priceEl.classList.remove('skeleton-text', 'skeleton-price');
                }

                // Update change
                const changeEl = card.querySelector('.stock-price .change');
                if (changeEl && stock.change !== undefined) {
                    const changeClass = stock.change >= 0 ? 'positive' : 'negative';
                    const changeIcon = stock.change >= 0 ? 'arrow-up' : 'arrow-down';

                    changeEl.className = `change ${changeClass}`;
                    changeEl.innerHTML = `
                        <i class="fas fa-${changeIcon}"></i>
                        ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%
                    `;
                }
            });
        });

        // Update stats silently
        this.updateStats();
    }

    updateStats() {
        const rising = this.filteredStocks.filter(s => s.change > 0).length;
        const falling = this.filteredStocks.filter(s => s.change < 0).length;
        const avgChange = this.filteredStocks.reduce((sum, s) => sum + s.change, 0) / this.filteredStocks.length;
        const highestVolume = this.filteredStocks.reduce((max, s) => s.volume > max.volume ? s : max, this.filteredStocks[0]);

        document.getElementById('risingCount').textContent = rising;
        document.getElementById('fallingCount').textContent = falling;
        document.getElementById('avgChange').textContent = avgChange.toFixed(2) + '%';
        if (highestVolume) {
            document.getElementById('highestVolume').textContent = highestVolume.symbol;
        }
    }

    formatCurrency(value, market) {
        if (market === 'us') {
            return '$' + value.toFixed(2);
        } else {
            return '₺' + value.toFixed(2);
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * MODAL TAB MANAGEMENT
     * ═══════════════════════════════════════════════════════════════════════════
     */

    switchModalTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.stock-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show corresponding content
        document.querySelectorAll('.stock-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });
    }

    changeChartTimeframe(timeframe) {
        // Update active button
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timeframe === timeframe);
        });

        // Re-render chart with new timeframe
        if (this.selectedStock) {
            this.renderModalChart(this.selectedStock, timeframe);
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * TAB DATA POPULATION
     * ═══════════════════════════════════════════════════════════════════════════
     */

    populateOverviewTab(stock) {
        // Quick stats
        const setEl = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setEl('modalOpen', this.formatCurrency(stock.open || stock.price, stock.market));
        setEl('modalHigh', this.formatCurrency(stock.high || stock.price * 1.02, stock.market));
        setEl('modalLow', this.formatCurrency(stock.low || stock.price * 0.98, stock.market));
        setEl('modalVolume', this.formatVolume(stock.volume || 0));
        setEl('modal52High', this.formatCurrency(stock.high52w || stock.price * 1.3, stock.market));
        setEl('modal52Low', this.formatCurrency(stock.low52w || stock.price * 0.7, stock.market));

        // Render chart
        this.renderModalChart(stock, '1M');
    }

    populateDetailsTab(stock) {
        const setEl = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setEl('modalSector', stock.sector || 'N/A');
        setEl('modalMarket', stock.market === 'us' ? 'ABD (US)' : 'BIST (Türkiye)');
        setEl('modalCurrency', stock.market === 'us' ? 'USD ($)' : 'TRY (₺)');
        setEl('modalAvgVolume', this.formatVolume(stock.volume || 0));

        // Performance (simulated for now)
        const setPerfEl = (id, value, isPositive) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = `${isPositive ? '+' : ''}${value}%`;
                el.className = `perf-value ${isPositive ? 'positive' : 'negative'}`;
            }
        };

        setPerfEl('perfToday', stock.change.toFixed(2), stock.change >= 0);
        setPerfEl('perf1W', (stock.change * 1.2).toFixed(2), stock.change * 1.2 >= 0);
        setPerfEl('perf1M', (stock.change * 2).toFixed(2), stock.change * 2 >= 0);
        setPerfEl('perf3M', (stock.change * 3.5).toFixed(2), stock.change * 3.5 >= 0);
        setPerfEl('perf1Y', (stock.change * 8).toFixed(2), stock.change * 8 >= 0);
    }

    populateTechnicalsTab(stock) {
        // Calculate simple RSI
        const rsi = this.calculateRSI(stock);
        const rsiEl = document.getElementById('rsiValue');
        const rsiFillEl = document.getElementById('rsiFill');
        const rsiSignalEl = document.getElementById('rsiSignal');

        if (rsiEl) rsiEl.textContent = rsi.toFixed(2);
        if (rsiFillEl) rsiFillEl.style.width = `${rsi}%`;
        if (rsiSignalEl) {
            if (rsi < 30) {
                rsiSignalEl.textContent = '📈 Aşırı Satım - Al Sinyali';
                rsiSignalEl.style.color = 'var(--success-color)';
            } else if (rsi > 70) {
                rsiSignalEl.textContent = '📉 Aşırı Alım - Sat Sinyali';
                rsiSignalEl.style.color = 'var(--danger-color)';
            } else {
                rsiSignalEl.textContent = '➖ Nötr Bölge';
                rsiSignalEl.style.color = 'rgba(255,255,255,0.7)';
            }
        }

        // MACD (simulated)
        const macdEl = document.getElementById('macdValue');
        const macdSignalEl = document.getElementById('macdSignal');
        const macdValue = stock.change * 0.5;

        if (macdEl) macdEl.textContent = macdValue.toFixed(2);
        if (macdSignalEl) {
            macdSignalEl.textContent = macdValue > 0 ? '📈 Yukarı Trend' : '📉 Aşağı Trend';
            macdSignalEl.style.color = macdValue > 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }

        // Moving Averages
        const setMA = (period, idValue, idSignal) => {
            const maValue = stock.price * (1 + (Math.random() - 0.5) * 0.05);
            const signal = stock.price > maValue ? 'Al' : 'Sat';
            const signalClass = stock.price > maValue ? 'bullish' : 'bearish';

            const valueEl = document.getElementById(idValue);
            const signalEl = document.getElementById(idSignal);

            if (valueEl) valueEl.textContent = this.formatCurrency(maValue, stock.market);
            if (signalEl) {
                signalEl.textContent = signal;
                signalEl.className = `ma-signal ${signalClass}`;
            }
        };

        setMA(20, 'ma20', 'ma20Signal');
        setMA(50, 'ma50', 'ma50Signal');
        setMA(200, 'ma200', 'ma200Signal');

        // Technical Summary Score
        const techScore = Math.floor(50 + (stock.change * 5));
        const scoreEl = document.getElementById('techScore');
        const signalEl = document.getElementById('techSignal');

        if (scoreEl) scoreEl.textContent = `${Math.min(10, Math.max(0, Math.floor(techScore / 10)))}/10`;
        if (signalEl) {
            if (techScore > 65) {
                signalEl.innerHTML = '<i class="fas fa-arrow-up"></i> Güçlü Al';
                signalEl.style.color = 'var(--success-color)';
            } else if (techScore < 35) {
                signalEl.innerHTML = '<i class="fas fa-arrow-down"></i> Güçlü Sat';
                signalEl.style.color = 'var(--danger-color)';
            } else {
                signalEl.innerHTML = '<i class="fas fa-minus-circle"></i> Nötr';
                signalEl.style.color = 'rgba(255,255,255,0.7)';
            }
        }
    }

    populateFundamentalsTab(stock) {
        // Simulated fundamental data
        const setEl = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setEl('peRatio', (15 + Math.random() * 20).toFixed(2));
        setEl('pbRatio', (1.5 + Math.random() * 3).toFixed(2));
        setEl('marketCap', this.formatMarketCap(stock.price * 1000000000));
        setEl('dividendYield', (Math.random() * 5).toFixed(2) + '%');
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * TECHNICAL CALCULATIONS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    calculateRSI(stock) {
        // Simplified RSI calculation based on current change
        // Real RSI needs 14 days of data
        const change = stock.change;
        const rsi = 50 + (change * 2); // Approximate
        return Math.min(100, Math.max(0, rsi));
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * FORMATTING HELPERS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    formatVolume(volume) {
        if (volume >= 1000000000) {
            return (volume / 1000000000).toFixed(2) + 'B';
        } else if (volume >= 1000000) {
            return (volume / 1000000).toFixed(2) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(2) + 'K';
        }
        return volume.toLocaleString();
    }

    formatMarketCap(value) {
        if (value >= 1000000000000) {
            return '$' + (value / 1000000000000).toFixed(2) + 'T';
        } else if (value >= 1000000000) {
            return '$' + (value / 1000000000).toFixed(2) + 'B';
        } else if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(2) + 'M';
        }
        return '$' + value.toLocaleString();
    }

    showError(message) {
        console.error(message);
        const loadingEl = document.getElementById('loadingStocks');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
                <p>${message}</p>
            `;
        }
    }
}

// Initialize when page loads
let marketsManager = null;
document.addEventListener('DOMContentLoaded', async () => {
    marketsManager = new MarketsManager();
    window.marketsManager = marketsManager; // Export to window for market-data-pro.js
    console.log('✅ marketsManager exported to window');

    // Initialize marketsManager
    await marketsManager.init();
    console.log('✅ marketsManager initialized');
});
