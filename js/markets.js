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
        await this.loadStocks();
        this.setupEventListeners();
        this.renderStocks();
        this.updateStats();
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
                    <span class="price">${this.formatCurrency(stock.price, stock.market)}</span>
                    <span class="change ${changeClass}">
                        <i class="fas fa-${changeIcon}"></i>
                        ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%
                    </span>
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

        // Update modal content
        document.getElementById('modalStockName').textContent = `${stock.name} (${stock.symbol})`;
        document.getElementById('modalPrice').textContent = this.formatCurrency(stock.price, stock.market);
        document.getElementById('modalSector').textContent = stock.sector;
        document.getElementById('modalOpen').textContent = this.formatCurrency(stock.open, stock.market);
        document.getElementById('modalHigh').textContent = this.formatCurrency(stock.high, stock.market);
        document.getElementById('modalLow').textContent = this.formatCurrency(stock.low, stock.market);
        document.getElementById('modal52High').textContent = this.formatCurrency(stock.high52w, stock.market);
        document.getElementById('modal52Low').textContent = this.formatCurrency(stock.low52w, stock.market);

        const changeEl = document.getElementById('modalChange');
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        changeEl.className = `price-change ${changeClass}`;
        changeEl.innerHTML = `
            <span class="change-value">${stock.change > 0 ? '+' : ''}${this.formatCurrency(stock.price * stock.change / 100, stock.market)}</span>
            <span class="change-percent">(${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%)</span>
        `;

        // Render chart
        this.renderModalChart(stock);

        // Update watchlist button
        const watchlistBtn = document.getElementById('modalWatchlistBtn');
        const isInWatchlist = this.watchlist.includes(stock.symbol);
        watchlistBtn.innerHTML = `<i class="${isInWatchlist ? 'fas' : 'far'} fa-star"></i>`;
        watchlistBtn.onclick = () => this.toggleWatchlist(stock.symbol);
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

        // Gerçek 30 günlük veriyi Yahoo Finance'den al
        let chartData = { labels: [], prices: [] };

        if (window.realTimeStocks && typeof window.realTimeStocks.getChartData === 'function') {
            try {
                chartData = await window.realTimeStocks.getChartData(stock.symbol);
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
document.addEventListener('DOMContentLoaded', () => {
    marketsManager = new MarketsManager();
});
