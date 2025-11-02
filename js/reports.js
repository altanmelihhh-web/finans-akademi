/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FINANS AKADEMİ - RAPORLAR SİSTEMİ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Günlük, haftalık ve aylık piyasa raporları
 * - Sabah Raporu (08:00): Piyasa açılış öncesi özet
 * - Akşam Raporu (18:00): Günlük performans analizi
 * - Haftalık Rapor: Kazananlar/kaybedenler
 * - Portföy Analizi: Kişisel performans
 */

class ReportsManager {
    constructor() {
        this.currentReport = null;
        this.reportHistory = [];
        this.autoRefreshInterval = null;

        this.init();
    }

    /**
     * Initialize reports system
     */
    async init() {
        console.log('📊 Initializing Reports Manager...');

        // Load report history from localStorage
        this.loadReportHistory();

        // Setup event listeners
        this.setupEventListeners();

        // Generate current reports
        await this.generateAllReports();

        // Setup auto-refresh (every 1 hour)
        this.setupAutoRefresh();

        console.log('✅ Reports Manager ready');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Report type switcher
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const reportType = e.target.dataset.report;
                this.switchReport(reportType);
            });
        });

        // Manual refresh button
        const refreshBtn = document.getElementById('refreshReportsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.generateAllReports());
        }

        // Export button
        const exportBtn = document.getElementById('exportReportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        // Email subscription (future feature)
        const emailSubBtn = document.getElementById('subscribeReportBtn');
        if (emailSubBtn) {
            emailSubBtn.addEventListener('click', () => this.subscribeToReports());
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * SABAH RAPORU (Morning Report)
     * ═══════════════════════════════════════════════════════════════════════════
     */
    async generateMorningReport() {
        console.log('🌅 Generating Morning Report...');

        const report = {
            type: 'morning',
            title: 'Sabah Raporu',
            subtitle: 'Piyasa Açılış Öncesi Özet',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            sections: []
        };

        // 1. Dünya Piyasaları
        report.sections.push(await this.getGlobalMarketsSummary());

        // 2. Forex - Döviz Kurları
        report.sections.push(await this.getForexSummary());

        // 3. Kripto Piyasası
        report.sections.push(await this.getCryptoSummary());

        // 4. Beklenen Ekonomik Veriler
        report.sections.push(this.getUpcomingEvents());

        // 5. Günün Tavsiyesi (AI)
        report.sections.push(this.getTodaysTip());

        this.currentReport = report;
        this.renderReport(report);
        this.saveToHistory(report);

        return report;
    }

    /**
     * Global markets summary
     */
    async getGlobalMarketsSummary() {
        const section = {
            title: '🌍 Dünya Piyasaları',
            icon: 'fa-globe',
            content: []
        };

        try {
            // Get market data from marketDataPro
            if (window.marketDataPro) {
                const dashboardData = window.marketDataPro.cache.memory.get('dashboard');

                if (dashboardData && dashboardData.indices) {
                    const { sp500, nasdaq, dow, bist100 } = dashboardData.indices;

                    section.content.push({
                        type: 'indices',
                        data: [
                            {
                                name: 'S&P 500',
                                value: sp500?.price || 0,
                                change: sp500?.changePercent || 0,
                                sentiment: sp500?.changePercent >= 0 ? 'positive' : 'negative'
                            },
                            {
                                name: 'NASDAQ',
                                value: nasdaq?.price || 0,
                                change: nasdaq?.changePercent || 0,
                                sentiment: nasdaq?.changePercent >= 0 ? 'positive' : 'negative'
                            },
                            {
                                name: 'DOW JONES',
                                value: dow?.price || 0,
                                change: dow?.changePercent || 0,
                                sentiment: dow?.changePercent >= 0 ? 'positive' : 'negative'
                            },
                            {
                                name: 'BIST 100',
                                value: bist100?.price || 0,
                                change: bist100?.changePercent || 0,
                                sentiment: bist100?.changePercent >= 0 ? 'positive' : 'negative'
                            }
                        ]
                    });

                    // Market sentiment analysis
                    const avgChange = ((sp500?.changePercent || 0) +
                                      (nasdaq?.changePercent || 0) +
                                      (dow?.changePercent || 0)) / 3;

                    let sentiment = 'Nötr';
                    let sentimentIcon = '😐';
                    if (avgChange > 0.5) {
                        sentiment = 'Pozitif';
                        sentimentIcon = '😊';
                    } else if (avgChange < -0.5) {
                        sentiment = 'Negatif';
                        sentimentIcon = '😟';
                    }

                    section.content.push({
                        type: 'sentiment',
                        text: `Genel piyasa havası: **${sentiment}** ${sentimentIcon}`,
                        detail: `ABD endeksleri ortalama %${avgChange.toFixed(2)} ${avgChange >= 0 ? 'yükselişte' : 'düşüşte'}.`
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error generating global markets summary:', error);
        }

        return section;
    }

    /**
     * Forex summary
     */
    async getForexSummary() {
        const section = {
            title: '💱 Döviz Kurları',
            icon: 'fa-exchange-alt',
            content: []
        };

        try {
            if (window.marketDataPro) {
                const dashboardData = window.marketDataPro.cache.memory.get('dashboard');

                if (dashboardData && dashboardData.forex) {
                    const { USDTRY, EURTRY, EURUSD } = dashboardData.forex;

                    section.content.push({
                        type: 'forex',
                        data: [
                            {
                                pair: 'USD/TRY',
                                value: USDTRY?.toFixed(4) || '0.0000',
                                trend: 'neutral'
                            },
                            {
                                pair: 'EUR/TRY',
                                value: EURTRY?.toFixed(4) || '0.0000',
                                trend: 'neutral'
                            },
                            {
                                pair: 'EUR/USD',
                                value: EURUSD?.toFixed(4) || '0.0000',
                                trend: 'neutral'
                            }
                        ]
                    });

                    section.content.push({
                        type: 'text',
                        text: `💡 **Not:** Dolar ${USDTRY > 34 ? 'yükselişte' : 'düşüşte'}.`
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error generating forex summary:', error);
        }

        return section;
    }

    /**
     * Crypto summary
     */
    async getCryptoSummary() {
        const section = {
            title: '₿ Kripto Para',
            icon: 'fa-bitcoin',
            content: []
        };

        try {
            if (window.marketDataPro) {
                const dashboardData = window.marketDataPro.cache.memory.get('dashboard');

                if (dashboardData && dashboardData.crypto) {
                    const { bitcoin, ethereum } = dashboardData.crypto;

                    if (bitcoin) {
                        section.content.push({
                            type: 'crypto',
                            data: [
                                {
                                    name: 'Bitcoin',
                                    symbol: 'BTC',
                                    price: bitcoin.price,
                                    change: bitcoin.change24h,
                                    sentiment: bitcoin.change24h >= 0 ? 'positive' : 'negative'
                                },
                                {
                                    name: 'Ethereum',
                                    symbol: 'ETH',
                                    price: ethereum?.price || 0,
                                    change: ethereum?.change24h || 0,
                                    sentiment: ethereum?.change24h >= 0 ? 'positive' : 'negative'
                                }
                            ]
                        });

                        section.content.push({
                            type: 'text',
                            text: bitcoin.change24h > 2
                                ? '🚀 **Bitcoin güçlü yükselişte!**'
                                : bitcoin.change24h < -2
                                ? '⚠️ **Bitcoin düşüşte, dikkatli olun.**'
                                : '📊 **Bitcoin sakin seyrediyor.**'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error generating crypto summary:', error);
        }

        return section;
    }

    /**
     * Upcoming economic events
     */
    getUpcomingEvents() {
        const section = {
            title: '📅 Bugün Beklenen Veriler',
            icon: 'fa-calendar-alt',
            content: []
        };

        // Static data for now (can be fetched from economic calendar API)
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

        const weeklyEvents = {
            1: [ // Monday
                { time: '15:30', event: 'ABD İmalat PMI', importance: 'medium' },
                { time: '17:00', event: 'Fed Konuşmaları', importance: 'high' }
            ],
            2: [ // Tuesday
                { time: '16:00', event: 'Tüketici Güven Endeksi', importance: 'medium' }
            ],
            3: [ // Wednesday
                { time: '14:00', event: 'TCMB Faiz Kararı', importance: 'high' },
                { time: '20:00', event: 'Fed FOMC Tutanakları', importance: 'high' }
            ],
            4: [ // Thursday
                { time: '15:30', event: 'İşsizlik Maaşı Başvuruları', importance: 'low' }
            ],
            5: [ // Friday
                { time: '15:30', event: 'NFP - Tarım Dışı İstihdam', importance: 'high' },
                { time: '15:30', event: 'İşsizlik Oranı', importance: 'high' }
            ]
        };

        const todaysEvents = weeklyEvents[today] || [];

        if (todaysEvents.length > 0) {
            section.content.push({
                type: 'events',
                data: todaysEvents
            });
        } else {
            section.content.push({
                type: 'text',
                text: '✨ Bugün önemli bir ekonomik veri yayınlanmıyor.'
            });
        }

        return section;
    }

    /**
     * Today's tip
     */
    getTodaysTip() {
        const section = {
            title: '💡 Günün Tavsiyesi',
            icon: 'fa-lightbulb',
            content: []
        };

        const tips = [
            "**Risk yönetimi her şeyden önemlidir.** Portföyünüzün max %2'sini bir işlemde riske atın.",
            "**Sabırlı olun.** En iyi işlemler, beklemeyi bilenleredir.",
            "**Stop-loss kullanın.** Kayıplarınızı sınırlamak başarının anahtarıdır.",
            "**Diversifikasyon yapın.** Tüm yumurtalarınızı aynı sepete koymayın.",
            "**Duygusal kararlar almayın.** Fear ve Greed en büyük düşmanınızdır.",
            "**Öğrenmeye devam edin.** Piyasa her gün değişir, siz de değişmelisiniz.",
            "**Gerçekçi hedefler koyun.** Hızlı zengin olma peşinde koşmayın.",
            "**Backtesting yapın.** Stratejinizi test etmeden gerçek para kullanmayın."
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        section.content.push({
            type: 'tip',
            text: randomTip
        });

        return section;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * AKŞAM RAPORU (Evening Report)
     * ═══════════════════════════════════════════════════════════════════════════
     */
    async generateEveningReport() {
        console.log('🌆 Generating Evening Report...');

        const report = {
            type: 'evening',
            title: 'Akşam Raporu',
            subtitle: 'Günlük Performans Analizi',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            sections: []
        };

        // 1. Günün Kazananları
        report.sections.push(await this.getTodaysWinners());

        // 2. Günün Kaybedenleri
        report.sections.push(await this.getTodaysLosers());

        // 3. Portföy Performansı
        report.sections.push(this.getPortfolioPerformance());

        // 4. En Çok İşlem Görenler
        report.sections.push(await this.getMostTraded());

        // 5. Yarın İçin Tavsiyeler
        report.sections.push(this.getTomorrowTips());

        this.currentReport = report;
        this.renderReport(report);
        this.saveToHistory(report);

        return report;
    }

    /**
     * Today's winners
     */
    async getTodaysWinners() {
        const section = {
            title: '🏆 Günün Kazananları',
            icon: 'fa-trophy',
            content: []
        };

        try {
            if (window.STOCKS_DATA) {
                const allStocks = [
                    ...window.STOCKS_DATA.us_stocks,
                    ...window.STOCKS_DATA.bist_stocks
                ];

                const winners = allStocks
                    .filter(s => s.price > 0 && s.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 5);

                section.content.push({
                    type: 'stocks',
                    data: winners.map(s => ({
                        symbol: s.symbol,
                        name: s.name,
                        change: s.change,
                        price: s.price,
                        market: s.market || 'us'
                    }))
                });
            }
        } catch (error) {
            console.error('❌ Error getting winners:', error);
        }

        return section;
    }

    /**
     * Today's losers
     */
    async getTodaysLosers() {
        const section = {
            title: '📉 Günün Kaybedenleri',
            icon: 'fa-chart-line-down',
            content: []
        };

        try {
            if (window.STOCKS_DATA) {
                const allStocks = [
                    ...window.STOCKS_DATA.us_stocks,
                    ...window.STOCKS_DATA.bist_stocks
                ];

                const losers = allStocks
                    .filter(s => s.price > 0 && s.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 5);

                section.content.push({
                    type: 'stocks',
                    data: losers.map(s => ({
                        symbol: s.symbol,
                        name: s.name,
                        change: s.change,
                        price: s.price,
                        market: s.market || 'us'
                    }))
                });
            }
        } catch (error) {
            console.error('❌ Error getting losers:', error);
        }

        return section;
    }

    /**
     * Portfolio performance
     */
    getPortfolioPerformance() {
        const section = {
            title: '💼 Portföy Performansı',
            icon: 'fa-briefcase',
            content: []
        };

        try {
            if (window.simulator) {
                const cash = window.simulator.cash || 10000;
                const initialBalance = window.simulator.initialBalance || 10000;

                // Calculate portfolio value
                let stockValue = 0;
                if (window.simulator.portfolio) {
                    window.simulator.portfolio.forEach(holding => {
                        const stock = window.simulator.findStock(holding.symbol);
                        if (stock && stock.price) {
                            stockValue += stock.price * holding.quantity;
                        }
                    });
                }

                const totalBalance = cash + stockValue;
                const profitLoss = totalBalance - initialBalance;
                const profitLossPercent = ((profitLoss / initialBalance) * 100).toFixed(2);

                section.content.push({
                    type: 'portfolio',
                    data: {
                        cash,
                        stockValue,
                        totalBalance,
                        profitLoss,
                        profitLossPercent,
                        sentiment: profitLoss >= 0 ? 'positive' : 'negative'
                    }
                });

                const performanceText = profitLoss > 0
                    ? `🎉 **Harika!** Portföyünüz bugün %${Math.abs(profitLossPercent)} kazandı.`
                    : profitLoss < 0
                    ? `⚠️ Portföyünüz bugün %${Math.abs(profitLossPercent)} kaybetti. Yarın daha iyi olacak!`
                    : `📊 Portföyünüz bugün dengede.`;

                section.content.push({
                    type: 'text',
                    text: performanceText
                });
            } else {
                section.content.push({
                    type: 'text',
                    text: '💡 Henüz bir portföy oluşturmadınız. Simülatör sayfasından işlem yapmaya başlayın!'
                });
            }
        } catch (error) {
            console.error('❌ Error getting portfolio performance:', error);
        }

        return section;
    }

    /**
     * Most traded stocks
     */
    async getMostTraded() {
        const section = {
            title: '🔥 En Çok İşlem Görenler',
            icon: 'fa-fire',
            content: []
        };

        try {
            if (window.STOCKS_DATA) {
                const allStocks = [
                    ...window.STOCKS_DATA.us_stocks,
                    ...window.STOCKS_DATA.bist_stocks
                ];

                const mostTraded = allStocks
                    .filter(s => s.volume && s.volume > 0)
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 5);

                section.content.push({
                    type: 'stocks',
                    data: mostTraded.map(s => ({
                        symbol: s.symbol,
                        name: s.name,
                        volume: s.volume,
                        change: s.change || 0,
                        market: s.market || 'us'
                    }))
                });
            }
        } catch (error) {
            console.error('❌ Error getting most traded:', error);
        }

        return section;
    }

    /**
     * Tomorrow tips
     */
    getTomorrowTips() {
        const section = {
            title: '🔮 Yarın İçin Tavsiyeler',
            icon: 'fa-crystal-ball',
            content: []
        };

        const tips = [
            "Yarın piyasa açılmadan önce ekonomik takvimi kontrol edin.",
            "Portföyünüzü gözden geçirin ve gerekirse rebalancing yapın.",
            "Stop-loss seviyelerinizi güncelleyin.",
            "Takip ettiğiniz hisselerin haberlerini okuyun.",
            "Öğrenmeye devam edin - Eğitim sayfasında yeni bir gün tamamlayın!"
        ];

        tips.forEach(tip => {
            section.content.push({
                type: 'text',
                text: `• ${tip}`
            });
        });

        return section;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * HAFTALIK RAPOR (Weekly Report)
     * ═══════════════════════════════════════════════════════════════════════════
     */
    async generateWeeklyReport() {
        console.log('📅 Generating Weekly Report...');

        const report = {
            type: 'weekly',
            title: 'Haftalık Rapor',
            subtitle: 'Geçen Haftanın Özeti',
            timestamp: Date.now(),
            date: this.getWeekRange(),
            sections: []
        };

        // 1. Haftalık Performans
        report.sections.push(this.getWeeklyPerformance());

        // 2. Haftanın En İyileri
        report.sections.push(await this.getTodaysWinners()); // Reuse

        // 3. Öğrenme İlerlemesi
        report.sections.push(this.getLearningProgress());

        this.currentReport = report;
        this.renderReport(report);
        this.saveToHistory(report);

        return report;
    }

    /**
     * Weekly performance
     */
    getWeeklyPerformance() {
        const section = {
            title: '📊 Haftalık Performans',
            icon: 'fa-chart-bar',
            content: []
        };

        // Placeholder - would need historical data
        section.content.push({
            type: 'text',
            text: '💡 Haftalık performans verileri yakında eklenecek!'
        });

        return section;
    }

    /**
     * Learning progress
     */
    getLearningProgress() {
        const section = {
            title: '🎓 Öğrenme İlerlemesi',
            icon: 'fa-graduation-cap',
            content: []
        };

        try {
            if (window.progressTracker) {
                const progress = window.progressTracker.progressData;

                section.content.push({
                    type: 'progress',
                    data: {
                        totalDays: progress.totalDaysCompleted || 0,
                        streak: progress.currentStreak || 0,
                        avgQuiz: progress.avgQuizScore || 0
                    }
                });

                const motivationText = progress.totalDaysCompleted > 30
                    ? '🎉 **Muhteşem!** 30+ gün tamamladınız, hedefinize çok yakınsınız!'
                    : progress.totalDaysCompleted > 15
                    ? '💪 **Harika ilerleme!** Yarı yolu geçtiniz!'
                    : '🚀 **Devam edin!** Her gün yeni bir şey öğreniyorsunuz.';

                section.content.push({
                    type: 'text',
                    text: motivationText
                });
            }
        } catch (error) {
            console.error('❌ Error getting learning progress:', error);
        }

        return section;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * RENDER & UTILITIES
     * ═══════════════════════════════════════════════════════════════════════════
     */

    /**
     * Render report to UI
     */
    renderReport(report) {
        const container = document.getElementById('reportContent');
        if (!container) {
            console.warn('⚠️ Report container not found');
            return;
        }

        let html = `
            <div class="report-header">
                <h2>${report.title}</h2>
                <p class="report-subtitle">${report.subtitle}</p>
                <p class="report-date">${report.date}</p>
            </div>
        `;

        report.sections.forEach(section => {
            html += `
                <div class="report-section">
                    <h3><i class="fas ${section.icon}"></i> ${section.title}</h3>
                    <div class="section-content">
                        ${this.renderSectionContent(section.content)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Render section content
     */
    renderSectionContent(content) {
        let html = '';

        content.forEach(item => {
            switch (item.type) {
                case 'text':
                case 'tip':
                    html += `<p class="report-text">${item.text}</p>`;
                    break;

                case 'indices':
                    html += '<div class="indices-grid">';
                    item.data.forEach(index => {
                        html += `
                            <div class="index-card ${index.sentiment}">
                                <span class="index-name">${index.name}</span>
                                <span class="index-value">${index.value.toFixed(2)}</span>
                                <span class="index-change ${index.sentiment}">
                                    ${index.change >= 0 ? '+' : ''}${index.change.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    break;

                case 'forex':
                    html += '<div class="forex-grid">';
                    item.data.forEach(pair => {
                        html += `
                            <div class="forex-card">
                                <span class="forex-pair">${pair.pair}</span>
                                <span class="forex-value">${pair.value}</span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    break;

                case 'crypto':
                    html += '<div class="crypto-grid">';
                    item.data.forEach(coin => {
                        html += `
                            <div class="crypto-card ${coin.sentiment}">
                                <span class="crypto-name">${coin.symbol}</span>
                                <span class="crypto-price">$${coin.price.toLocaleString()}</span>
                                <span class="crypto-change ${coin.sentiment}">
                                    ${coin.change >= 0 ? '+' : ''}${coin.change.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    break;

                case 'stocks':
                    html += '<div class="stocks-table">';
                    item.data.forEach((stock, index) => {
                        const currency = stock.market === 'bist' ? '₺' : '$';
                        html += `
                            <div class="stock-row">
                                <span class="rank">${index + 1}</span>
                                <span class="symbol">${stock.symbol}</span>
                                <span class="name">${stock.name}</span>
                                <span class="price">${currency}${stock.price?.toFixed(2) || '-'}</span>
                                <span class="change ${stock.change >= 0 ? 'positive' : 'negative'}">
                                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    break;

                case 'events':
                    html += '<div class="events-list">';
                    item.data.forEach(event => {
                        const importanceClass = event.importance === 'high' ? 'high' : event.importance === 'medium' ? 'medium' : 'low';
                        html += `
                            <div class="event-item ${importanceClass}">
                                <span class="event-time">${event.time}</span>
                                <span class="event-name">${event.event}</span>
                                <span class="event-badge ${importanceClass}">
                                    ${event.importance === 'high' ? '🔴' : event.importance === 'medium' ? '🟡' : '🟢'}
                                </span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    break;

                case 'portfolio':
                    const data = item.data;
                    html += `
                        <div class="portfolio-summary">
                            <div class="portfolio-stat">
                                <span class="label">Toplam Değer</span>
                                <span class="value">${data.totalBalance.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div class="portfolio-stat">
                                <span class="label">Nakit</span>
                                <span class="value">${data.cash.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div class="portfolio-stat">
                                <span class="label">Hisse Değeri</span>
                                <span class="value">${data.stockValue.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div class="portfolio-stat ${data.sentiment}">
                                <span class="label">Kar/Zarar</span>
                                <span class="value">${data.profitLoss >= 0 ? '+' : ''}${data.profitLoss.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺ (${data.profitLossPercent}%)</span>
                            </div>
                        </div>
                    `;
                    break;

                case 'progress':
                    const prog = item.data;
                    html += `
                        <div class="progress-summary">
                            <div class="progress-stat">
                                <i class="fas fa-check-circle"></i>
                                <span class="value">${prog.totalDays}/49</span>
                                <span class="label">Gün Tamamlandı</span>
                            </div>
                            <div class="progress-stat">
                                <i class="fas fa-fire"></i>
                                <span class="value">${prog.streak}</span>
                                <span class="label">Gün Seri</span>
                            </div>
                            <div class="progress-stat">
                                <i class="fas fa-star"></i>
                                <span class="value">${prog.avgQuiz}%</span>
                                <span class="label">Ortalama Quiz</span>
                            </div>
                        </div>
                    `;
                    break;

                case 'sentiment':
                    html += `<p class="sentiment-text">${item.text}</p>`;
                    if (item.detail) {
                        html += `<p class="sentiment-detail">${item.detail}</p>`;
                    }
                    break;
            }
        });

        return html;
    }

    /**
     * Switch between report types
     */
    switchReport(type) {
        // Update active tab
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.report === type);
        });

        // Generate report
        switch (type) {
            case 'morning':
                this.generateMorningReport();
                break;
            case 'evening':
                this.generateEveningReport();
                break;
            case 'weekly':
                this.generateWeeklyReport();
                break;
        }
    }

    /**
     * Generate all reports
     */
    async generateAllReports() {
        const currentHour = new Date().getHours();

        // Auto-select based on time
        if (currentHour < 12) {
            await this.generateMorningReport();
        } else {
            await this.generateEveningReport();
        }

        console.log('✅ Reports generated');
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        // Refresh every hour
        this.autoRefreshInterval = setInterval(() => {
            this.generateAllReports();
        }, 3600000); // 1 hour
    }

    /**
     * Get week range string
     */
    getWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return `${monday.toLocaleDateString('tr-TR')} - ${sunday.toLocaleDateString('tr-TR')}`;
    }

    /**
     * Load report history from localStorage
     */
    loadReportHistory() {
        try {
            const stored = localStorage.getItem('reportHistory');
            if (stored) {
                this.reportHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('❌ Error loading report history:', error);
        }
    }

    /**
     * Save report to history
     */
    saveToHistory(report) {
        this.reportHistory.unshift(report);

        // Keep only last 30 reports
        if (this.reportHistory.length > 30) {
            this.reportHistory = this.reportHistory.slice(0, 30);
        }

        localStorage.setItem('reportHistory', JSON.stringify(this.reportHistory));
    }

    /**
     * Export report as PDF/text
     */
    exportReport() {
        if (!this.currentReport) {
            alert('Önce bir rapor oluşturun!');
            return;
        }

        // Simple text export for now
        let text = `${this.currentReport.title}\n`;
        text += `${this.currentReport.subtitle}\n`;
        text += `${this.currentReport.date}\n\n`;

        this.currentReport.sections.forEach(section => {
            text += `${section.title}\n`;
            text += '='.repeat(50) + '\n';
            section.content.forEach(item => {
                if (item.text) {
                    text += item.text.replace(/\*\*/g, '') + '\n';
                }
            });
            text += '\n';
        });

        // Download as text file
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapor_${this.currentReport.type}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Report exported');
    }

    /**
     * Subscribe to email reports (future feature)
     */
    subscribeToReports() {
        alert('Email bildirimleri yakında aktif olacak! 📧');
    }
}

// Initialize and export
let reportsManager;

function initReports() {
    reportsManager = new ReportsManager();
    window.reportsManager = reportsManager;
}

// Auto-initialize when reports page is active
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only init when reports page is visited
        const observer = new MutationObserver(() => {
            const reportsPage = document.getElementById('raporlar');
            if (reportsPage && reportsPage.classList.contains('active') && !window.reportsManager) {
                initReports();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    });
} else {
    const reportsPage = document.getElementById('raporlar');
    if (reportsPage && reportsPage.classList.contains('active')) {
        initReports();
    }
}

export { ReportsManager };
