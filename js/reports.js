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
        this.selectedStocks = []; // For custom reports
        this.customFilters = {}; // For custom report preferences

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
        console.log('📋 Setting up report event listeners...');

        // Report type switcher
        const reportTabs = document.querySelectorAll('.report-tab');
        console.log(`📋 Found ${reportTabs.length} report tabs`);

        reportTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const reportType = e.currentTarget.dataset.report;
                console.log(`📋 Tab clicked: ${reportType}`);
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

        // Customize button - toggle custom filters
        const customizeBtn = document.getElementById('customizeReportBtn');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => this.toggleCustomFilters());
        }

        // Custom report - Apply button
        const applyCustomBtn = document.getElementById('applyCustomReport');
        if (applyCustomBtn) {
            applyCustomBtn.addEventListener('click', () => this.generateCustomReport());
        }

        // Custom report - Cancel button
        const cancelCustomBtn = document.getElementById('cancelCustomReport');
        if (cancelCustomBtn) {
            cancelCustomBtn.addEventListener('click', () => this.hideCustomFilters());
        }

        // Custom report - Save template button
        const saveTemplateBtn = document.getElementById('saveCustomTemplate');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => this.saveCustomTemplate());
        }

        // Stock search input
        const stockSearchInput = document.getElementById('stockSearchInput');
        if (stockSearchInput) {
            stockSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addStockToSelection(e.target.value.trim().toUpperCase());
                    e.target.value = '';
                }
            });
        }

        // AI Analysis - Quick question buttons
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.askAIAnalysis(question);
            });
        });

        // AI Analysis - Custom question button
        const askAiBtn = document.getElementById('askAiAnalysis');
        if (askAiBtn) {
            askAiBtn.addEventListener('click', () => {
                const question = document.getElementById('aiCustomQuestion').value.trim();
                if (question) {
                    this.askAIAnalysis(question);
                }
            });
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
     * Tomorrow tips - SMART DYNAMIC TIPS
     */
    getTomorrowTips() {
        const section = {
            title: '🔮 Yarın İçin Tavsiyeler',
            icon: 'fa-crystal-ball',
            content: []
        };

        const tips = [];

        // 1. Market-based tip
        if (window.marketDataPro) {
            const dashboardData = window.marketDataPro.cache.memory.get('dashboard');
            if (dashboardData && dashboardData.indices) {
                const sp500Change = dashboardData.indices.sp500?.changePercent || 0;
                const bist100Change = dashboardData.indices.bist100?.changePercent || 0;

                if (sp500Change > 1) {
                    tips.push("📈 **ABD piyasaları güçlü yükselişte!** Yarın BIST'te pozitif açılış beklenebilir.");
                } else if (sp500Change < -1) {
                    tips.push("📉 **ABD piyasalarında düşüş var.** Yarın temkinli olun, stop-loss'larınızı kontrol edin.");
                }

                if (bist100Change > 2) {
                    tips.push("🚀 **BIST 100 güçlü performans gösteriyor.** Momentum devam edebilir, ancak aşırı alım riskine dikkat!");
                } else if (bist100Change < -2) {
                    tips.push("⚠️ **BIST 100 düşüşte.** Fırsat arayanlara: Kaliteli hisseler indirimde olabilir.");
                }
            }
        }

        // 2. Portfolio-based tip
        if (window.simulator && window.simulator.portfolio && window.simulator.portfolio.length > 0) {
            const portfolioSize = window.simulator.portfolio.length;
            const cash = window.simulator.cash || 0;
            const initialBalance = window.simulator.initialBalance || 10000;
            const cashRatio = cash / initialBalance;

            if (portfolioSize > 10) {
                tips.push("💼 **Portföyünüz çok çeşitlenmiş.** Daha az hisseyle daha fazla odaklanmayı düşünün.");
            } else if (portfolioSize < 3 && cash < initialBalance * 0.5) {
                tips.push("⚖️ **Portföyünüz az çeşitlenmiş.** Risk yönetimi için 3-5 farklı sektörde pozisyon alın.");
            }

            if (cashRatio > 0.7) {
                tips.push("💰 **Nakitiniz çok yüksek (%${(cashRatio * 100).toFixed(0)})**. Fırsat bekliyor olabilirsiniz, ancak enflasyon nakiti eritiyor!");
            } else if (cashRatio < 0.1) {
                tips.push("🎯 **Nakit oranınız düşük.** Fırsat anlarında kullanmak için biraz nakit bulundurun.");
            }
        }

        // 3. Day-of-week specific tips
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayOfWeek = tomorrow.getDay();

        const dayTips = {
            0: "☀️ **Pazar günü:** Haftalık raporları gözden geçirin, strateji planlayın.",
            1: "📅 **Pazartesi:** Hafta başı açılışları volatil olabilir. İlk 30 dakika bekleyin.",
            2: "📊 **Salı:** ABD'de ekonomik veriler açıklanabilir. Takvimi kontrol edin.",
            3: "🎯 **Çarşamba:** Hafta ortası, TCMB faiz kararı günü olabilir mi? Kontrol edin.",
            4: "📈 **Perşembe:** İşsizlik verileri açıklanır. Piyasalarda hareket beklenir.",
            5: "💼 **Cuma:** NFP (Tarım Dışı İstihdam) günü! Piyasalarda yüksek volatilite olabilir.",
            6: "🎮 **Cumartesi:** Simülatörde pratik yapın, eğitim modüllerini tamamlayın."
        };

        if (dayTips[dayOfWeek]) {
            tips.push(dayTips[dayOfWeek]);
        }

        // 4. Learning-based tip
        if (window.progressTracker && window.progressTracker.progressData) {
            const progress = window.progressTracker.progressData;
            const completedDays = progress.totalDaysCompleted || 0;
            const streak = progress.currentStreak || 0;

            if (completedDays < 7) {
                tips.push("🎓 **Eğitim:** Henüz 1. haftayı bitirmediniz. Her gün 20 dakika ayırın!");
            } else if (streak > 5) {
                tips.push(`🔥 **${streak} günlük seri!** Harika! Yarın da devam edin, momentum kaybetmeyin.`);
            } else if (streak === 0 && completedDays > 0) {
                tips.push("📚 **Eğitim seriniz kesildi.** Yarın yeni bir günü tamamlayarak tekrar başlayın!");
            }
        }

        // 5. Technical Analysis tip
        if (window.STOCKS_DATA) {
            const allStocks = [...window.STOCKS_DATA.us_stocks, ...window.STOCKS_DATA.bist_stocks];
            const strongBuys = allStocks.filter(s => s.technicalScore && s.technicalScore >= 75);
            const strongSells = allStocks.filter(s => s.technicalScore && s.technicalScore <= 30);

            if (strongBuys.length > 0) {
                const topStock = strongBuys[0];
                tips.push(`💎 **Teknik analiz:** ${topStock.symbol} güçlü al sinyali veriyor (${Math.floor(topStock.technicalScore / 10)}/10).`);
            }

            if (strongSells.length > 0) {
                const worstStock = strongSells[0];
                tips.push(`⚠️ **Dikkat:** ${worstStock.symbol} güçlü sat sinyali veriyor. Eğer portföyünüzdeyse gözden geçirin!`);
            }
        }

        // 6. General wisdom tips (fallback)
        const generalTips = [
            "📖 **Warren Buffett:** 'Başkalarının açgözlü olduğu zaman korkun, korktukları zaman açgözlü olun.'",
            "🎯 **Kural:** Bir hisseyi almadan önce %10 düşerse ne yapacağınızı bilin.",
            "💡 **Risk Yönetimi:** Portföyünüzün max %2'sini tek bir işlemde riske atın.",
            "📊 **Analiz:** Hisse almadan önce 5 dakika teknik + temel analiz yapın. Simülatör değil, gerçek para!",
            "🧘 **Disiplin:** En iyi strateji, duygularınıza göre değil, plana göre hareket etmektir."
        ];

        // Add 1-2 general tips
        const randomTips = generalTips.sort(() => Math.random() - 0.5).slice(0, 2);
        tips.push(...randomTips);

        // Render tips
        if (tips.length === 0) {
            tips.push("💡 Yarın için piyasa verilerini takip edin ve stratejinizi gözden geçirin.");
        }

        tips.forEach(tip => {
            section.content.push({
                type: 'text',
                text: `${tip}`
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

        // Hide all special inputs
        this.hideCustomFilters();
        this.hideAIAnalysis();

        // Show report content area
        const reportContent = document.getElementById('reportContent');
        if (reportContent) {
            reportContent.style.display = 'block';
        }

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
            case 'custom':
                this.showCustomFilters();
                break;
            case 'ai-analysis':
                this.showAIAnalysis();
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

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * CUSTOM REPORTS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    /**
     * Toggle custom filters visibility
     */
    toggleCustomFilters() {
        const filters = document.getElementById('customReportFilters');
        if (filters) {
            const isVisible = filters.style.display !== 'none';
            if (isVisible) {
                this.hideCustomFilters();
            } else {
                this.showCustomFilters();
            }
        }
    }

    /**
     * Show custom filters
     */
    showCustomFilters() {
        const filters = document.getElementById('customReportFilters');
        const reportContent = document.getElementById('reportContent');

        if (filters) filters.style.display = 'block';
        if (reportContent) reportContent.style.display = 'none';

        // Load saved template if exists
        this.loadCustomTemplate();
    }

    /**
     * Hide custom filters
     */
    hideCustomFilters() {
        const filters = document.getElementById('customReportFilters');
        if (filters) filters.style.display = 'none';
    }

    /**
     * Add stock to selection
     */
    addStockToSelection(symbol) {
        if (!symbol) return;

        // Check if stock exists
        const allStocks = [
            ...window.STOCKS_DATA.us_stocks,
            ...window.STOCKS_DATA.bist_stocks
        ];

        const stock = allStocks.find(s => s.symbol === symbol);
        if (!stock) {
            alert(`Hisse bulunamadı: ${symbol}`);
            return;
        }

        // Check if already added
        if (this.selectedStocks.includes(symbol)) {
            alert(`${symbol} zaten eklendi!`);
            return;
        }

        // Add to selection
        this.selectedStocks.push(symbol);
        this.renderSelectedStocks();
    }

    /**
     * Remove stock from selection
     */
    removeStockFromSelection(symbol) {
        this.selectedStocks = this.selectedStocks.filter(s => s !== symbol);
        this.renderSelectedStocks();
    }

    /**
     * Render selected stocks
     */
    renderSelectedStocks() {
        const container = document.getElementById('selectedStocks');
        if (!container) return;

        if (this.selectedStocks.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.5);">Henüz hisse seçilmedi. Enter tuşu ile ekleyin.</p>';
            return;
        }

        container.innerHTML = this.selectedStocks.map(symbol => `
            <div class="stock-tag">
                <span>${symbol}</span>
                <span class="remove" onclick="reportsManager.removeStockFromSelection('${symbol}')">
                    <i class="fas fa-times"></i>
                </span>
            </div>
        `).join('');
    }

    /**
     * Generate custom report
     */
    async generateCustomReport() {
        if (this.selectedStocks.length === 0) {
            alert('Lütfen en az bir hisse seçin!');
            return;
        }

        // Get selected filters
        const markets = Array.from(document.querySelectorAll('input[name="market"]:checked')).map(el => el.value);
        const notifications = Array.from(document.querySelectorAll('input[name="notification"]:checked')).map(el => el.value);
        const content = Array.from(document.querySelectorAll('input[name="content"]:checked')).map(el => el.value);

        // Save filters
        this.customFilters = { markets, notifications, content };

        // Hide filters, show report
        this.hideCustomFilters();
        document.getElementById('reportContent').style.display = 'block';

        // Generate report
        const report = {
            type: 'custom',
            title: 'Özel Rapor',
            subtitle: `${this.selectedStocks.join(', ')} için özelleştirilmiş analiz`,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            sections: []
        };

        // Get stock data
        const allStocks = [
            ...window.STOCKS_DATA.us_stocks,
            ...window.STOCKS_DATA.bist_stocks
        ];

        const selectedStockData = this.selectedStocks.map(symbol =>
            allStocks.find(s => s.symbol === symbol)
        ).filter(Boolean);

        // 1. Performance Summary
        if (content.includes('performance')) {
            report.sections.push({
                title: '📊 Performans Özeti',
                icon: 'fa-chart-bar',
                content: [{
                    type: 'stocks',
                    data: selectedStockData.map(s => ({
                        symbol: s.symbol,
                        name: s.name,
                        price: s.price,
                        change: s.change,
                        market: s.market || 'us'
                    }))
                }]
            });
        }

        // 2. Technical Indicators (if selected)
        if (content.includes('technicals')) {
            report.sections.push({
                title: '📈 Teknik Göstergeler',
                icon: 'fa-chart-line',
                content: [{
                    type: 'text',
                    text: '💡 Seçili hisseler için teknik analiz özeti hazırlanıyor...'
                }]
            });
        }

        // 3. Notifications Summary
        if (notifications.length > 0) {
            const alerts = [];
            selectedStockData.forEach(stock => {
                if (notifications.includes('price-change') && Math.abs(stock.change) >= 5) {
                    alerts.push(`⚠️ **${stock.symbol}**: Büyük fiyat hareketi (${stock.change.toFixed(2)}%)`);
                }
                if (notifications.includes('volume-spike') && stock.volume && stock.volume > 1000000) {
                    alerts.push(`📊 **${stock.symbol}**: Yüksek işlem hacmi`);
                }
            });

            if (alerts.length > 0) {
                report.sections.push({
                    title: '🔔 Bildirimler',
                    icon: 'fa-bell',
                    content: alerts.map(alert => ({ type: 'text', text: alert }))
                });
            }
        }

        // 4. AI Insights (if selected)
        if (content.includes('ai-insights')) {
            report.sections.push({
                title: '🤖 AI Öngörüler',
                icon: 'fa-robot',
                content: [{
                    type: 'text',
                    text: '💡 AI destekli analiz için "AI Analiz" sekmesini kullanın!'
                }]
            });
        }

        this.currentReport = report;
        this.renderReport(report);
        this.saveToHistory(report);

        console.log('✅ Custom report generated');
    }

    /**
     * Save custom template
     */
    saveCustomTemplate() {
        const template = {
            selectedStocks: this.selectedStocks,
            filters: this.customFilters
        };

        localStorage.setItem('customReportTemplate', JSON.stringify(template));
        alert('✅ Şablon kaydedildi! Bir sonraki sefere otomatik yüklenecek.');
    }

    /**
     * Load custom template
     */
    loadCustomTemplate() {
        try {
            const stored = localStorage.getItem('customReportTemplate');
            if (stored) {
                const template = JSON.parse(stored);
                this.selectedStocks = template.selectedStocks || [];
                this.customFilters = template.filters || {};

                // Render stocks
                this.renderSelectedStocks();

                // Apply filters to checkboxes
                if (this.customFilters.markets) {
                    document.querySelectorAll('input[name="market"]').forEach(el => {
                        el.checked = this.customFilters.markets.includes(el.value);
                    });
                }
                if (this.customFilters.content) {
                    document.querySelectorAll('input[name="content"]').forEach(el => {
                        el.checked = this.customFilters.content.includes(el.value);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * AI ANALYSIS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    /**
     * Show AI analysis input
     */
    showAIAnalysis() {
        const aiInput = document.getElementById('aiAnalysisInput');
        const reportContent = document.getElementById('reportContent');

        if (aiInput) aiInput.style.display = 'block';
        if (reportContent) reportContent.style.display = 'none';
    }

    /**
     * Hide AI analysis
     */
    hideAIAnalysis() {
        const aiInput = document.getElementById('aiAnalysisInput');
        if (aiInput) aiInput.style.display = 'none';
    }

    /**
     * Ask AI for market analysis
     */
    async askAIAnalysis(question) {
        if (!question) return;

        const resultDiv = document.getElementById('aiAnalysisResult');
        const contentDiv = resultDiv.querySelector('.ai-response-content');
        const timestampDiv = resultDiv.querySelector('.ai-timestamp');

        // Show result area with loading
        resultDiv.style.display = 'block';
        contentDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> AI analiz hazırlıyor...</p>';

        try {
            // Build context from current market data
            let context = 'Mevcut piyasa durumu:\n';

            if (window.marketDataPro) {
                const dashboardData = window.marketDataPro.cache.memory.get('dashboard');
                if (dashboardData) {
                    const { indices, forex, crypto } = dashboardData;

                    context += `\nEndeksler:\n`;
                    if (indices) {
                        context += `- S&P 500: ${indices.sp500?.price?.toFixed(2)} (${indices.sp500?.changePercent?.toFixed(2)}%)\n`;
                        context += `- NASDAQ: ${indices.nasdaq?.price?.toFixed(2)} (${indices.nasdaq?.changePercent?.toFixed(2)}%)\n`;
                        context += `- BIST 100: ${indices.bist100?.price?.toFixed(2)} (${indices.bist100?.changePercent?.toFixed(2)}%)\n`;
                    }

                    context += `\nDöviz:\n`;
                    if (forex) {
                        context += `- USD/TRY: ${forex.USDTRY?.toFixed(4)}\n`;
                        context += `- EUR/TRY: ${forex.EURTRY?.toFixed(4)}\n`;
                    }

                    if (crypto && crypto.bitcoin) {
                        context += `\nKripto:\n`;
                        context += `- Bitcoin: $${crypto.bitcoin.price?.toLocaleString()} (${crypto.bitcoin.change24h?.toFixed(2)}%)\n`;
                    }
                }
            }

            context += `\nSoru: ${question}`;

            // Call Gemini AI (using existing chatbot functionality)
            let aiResponse = '';

            if (window.finansChatbot && typeof window.finansChatbot.sendMessage === 'function') {
                // Use existing chatbot
                aiResponse = await window.finansChatbot.sendMessage(context);
            } else {
                // Fallback to basic analysis
                aiResponse = this.generateBasicAnalysis(question, context);
            }

            // Display response
            contentDiv.innerHTML = this.formatAIResponse(aiResponse);
            timestampDiv.textContent = new Date().toLocaleTimeString('tr-TR');

            // Clear input
            document.getElementById('aiCustomQuestion').value = '';

        } catch (error) {
            console.error('AI Analysis error:', error);
            contentDiv.innerHTML = `
                <p style="color: #ff6b6b;">
                    ❌ AI analiz sırasında bir hata oluştu.
                    ${error.message || 'Lütfen daha sonra tekrar deneyin.'}
                </p>
            `;
        }
    }

    /**
     * Generate basic analysis (fallback)
     */
    generateBasicAnalysis(question, context) {
        // Parse market data from context
        const analysis = [];

        analysis.push('📊 **Piyasa Analizi**\n');

        if (question.toLowerCase().includes('bist')) {
            analysis.push('BIST 100 hakkında mevcut veriler context\'te mevcut.');
        }

        if (question.toLowerCase().includes('dolar') || question.toLowerCase().includes('döviz')) {
            analysis.push('Döviz kurları için güncel veriler yukarıda gösterilmektedir.');
        }

        analysis.push('\n💡 **Öneri:** Daha detaylı AI analizi için Gemini API key\'i eklemeyi unutmayın!');

        return analysis.join('\n');
    }

    /**
     * Format AI response with markdown
     */
    formatAIResponse(text) {
        if (!text) return '';

        // Convert markdown-like syntax to HTML
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/•/g, '&bull;'); // Bullets

        return `<p>${html}</p>`;
    }
}

// Initialize and export
let reportsManager;

function initReports() {
    console.log('📋 initReports() called');

    if (window.reportsManager) {
        console.log('📋 ReportsManager already initialized, refreshing...');
        window.reportsManager.generateAllReports();
        return;
    }

    console.log('📋 Creating new ReportsManager...');
    reportsManager = new ReportsManager();
    window.reportsManager = reportsManager;
}

// Export for app.js to call
window.initReports = initReports;

export { ReportsManager };
