/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FINANS AKADEMİ - ADVANCED AI ASSISTANT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * İleri Seviye AI Asistan Özellikleri:
 * - 📊 Portföy analizi ve risk değerlendirmesi
 * - 🎓 Kişiselleştirilmiş öğrenme önerileri
 * - 📈 Hisse senedi analizi ve tahminler
 * - 📅 Günlük rapor özetleri
 * - 💡 Proaktif uyarılar ve bildirimler
 * - 🧠 Kullanıcı davranışı analizi
 * - 🎯 Hedef bazlı stratejiler
 */

class AIAssistant {
    constructor() {
        this.geminiApiKey = 'AIzaSyDW5g2iuTZA28fUdTVwpVCe9I-P3ySFmtI'; // Gemini API
        this.context = {
            user: null,
            portfolio: null,
            progress: null,
            marketData: null,
            reports: null
        };

        this.conversationHistory = [];
        this.userProfile = {
            riskTolerance: 'medium', // low, medium, high
            investmentGoal: 'growth', // growth, income, balanced
            experience: 'beginner', // beginner, intermediate, advanced
            learningStyle: 'visual', // visual, reading, interactive
            preferences: {}
        };

        this.init();
    }

    /**
     * Initialize AI Assistant
     */
    async init() {
        console.log('🤖 Initializing Advanced AI Assistant...');

        // Load user context
        await this.loadUserContext();

        // Analyze user profile
        this.analyzeUserProfile();

        // Setup smart command handlers
        this.setupSmartCommands();

        console.log('✅ AI Assistant ready with advanced features');
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * CONTEXT LOADING - Gather all user data
     * ═══════════════════════════════════════════════════════════════════════════
     */

    async loadUserContext() {
        try {
            // Get current user from Firebase
            if (window.getCurrentUser) {
                this.context.user = window.getCurrentUser();
            }

            // Get portfolio from simulator
            if (window.simulator) {
                this.context.portfolio = {
                    cash: window.simulator.cash || 10000,
                    holdings: window.simulator.portfolio || [],
                    transactions: window.simulator.transactions || [],
                    initialBalance: window.simulator.initialBalance || 10000
                };

                // Calculate portfolio stats
                this.context.portfolio.stats = this.calculatePortfolioStats();
            }

            // Get learning progress
            if (window.progressTracker) {
                this.context.progress = window.progressTracker.progressData;
            }

            // Get market data
            if (window.marketDataPro) {
                this.context.marketData = {
                    dashboard: window.marketDataPro.cache.memory.get('dashboard'),
                    markets: window.marketDataPro.cache.memory.get('markets')
                };
            }

            // Get latest reports
            if (window.reportsManager) {
                this.context.reports = window.reportsManager.currentReport;
            }

            console.log('📊 User context loaded:', this.context);
        } catch (error) {
            console.error('❌ Error loading user context:', error);
        }
    }

    /**
     * Calculate portfolio statistics
     */
    calculatePortfolioStats() {
        if (!this.context.portfolio) return null;

        const { cash, holdings, initialBalance } = this.context.portfolio;

        let stockValue = 0;
        let totalGain = 0;
        let totalLoss = 0;
        let bestPerformer = null;
        let worstPerformer = null;

        holdings.forEach(holding => {
            // Find stock current price
            const stock = this.findStock(holding.symbol);
            if (stock && stock.price) {
                const currentValue = stock.price * holding.quantity;
                const costBasis = holding.averagePrice * holding.quantity;
                const gain = currentValue - costBasis;
                const gainPercent = (gain / costBasis) * 100;

                stockValue += currentValue;

                if (gain > 0) totalGain += gain;
                if (gain < 0) totalLoss += Math.abs(gain);

                // Track best/worst
                if (!bestPerformer || gainPercent > bestPerformer.gainPercent) {
                    bestPerformer = { symbol: holding.symbol, gainPercent, gain };
                }
                if (!worstPerformer || gainPercent < worstPerformer.gainPercent) {
                    worstPerformer = { symbol: holding.symbol, gainPercent, gain };
                }
            }
        });

        const totalValue = cash + stockValue;
        const totalProfitLoss = totalValue - initialBalance;
        const totalProfitLossPercent = (totalProfitLoss / initialBalance) * 100;

        return {
            totalValue,
            stockValue,
            cash,
            totalProfitLoss,
            totalProfitLossPercent,
            totalGain,
            totalLoss,
            bestPerformer,
            worstPerformer,
            numberOfHoldings: holdings.length,
            diversification: this.calculateDiversification(holdings)
        };
    }

    /**
     * Calculate portfolio diversification score
     */
    calculateDiversification(holdings) {
        if (!holdings || holdings.length === 0) return 0;

        // Simple diversification: more stocks = better diversification
        // Max score at 10+ different stocks
        const score = Math.min(holdings.length / 10, 1) * 100;

        return {
            score: Math.round(score),
            level: score > 70 ? 'İyi' : score > 40 ? 'Orta' : 'Düşük',
            recommendation: score < 70 ? 'Daha fazla hisse ekleyerek diversifikasyonu artırın.' : 'Diversifikasyon seviyeniz iyi.'
        };
    }

    /**
     * Find stock by symbol
     */
    findStock(symbol) {
        if (!window.STOCKS_DATA) return null;

        const allStocks = [
            ...window.STOCKS_DATA.us_stocks,
            ...window.STOCKS_DATA.bist_stocks
        ];

        return allStocks.find(s => s.symbol === symbol);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * USER PROFILE ANALYSIS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    analyzeUserProfile() {
        if (!this.context.progress) return;

        const progress = this.context.progress;

        // Determine experience level based on progress
        if (progress.totalDaysCompleted >= 30) {
            this.userProfile.experience = 'advanced';
        } else if (progress.totalDaysCompleted >= 15) {
            this.userProfile.experience = 'intermediate';
        } else {
            this.userProfile.experience = 'beginner';
        }

        // Analyze portfolio for risk tolerance
        if (this.context.portfolio?.stats) {
            const { totalProfitLossPercent, diversification } = this.context.portfolio.stats;

            if (Math.abs(totalProfitLossPercent) > 20 || diversification.score < 40) {
                this.userProfile.riskTolerance = 'high';
            } else if (Math.abs(totalProfitLossPercent) > 10) {
                this.userProfile.riskTolerance = 'medium';
            } else {
                this.userProfile.riskTolerance = 'low';
            }
        }

        console.log('👤 User profile analyzed:', this.userProfile);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * SMART COMMAND HANDLERS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    setupSmartCommands() {
        this.smartCommands = {
            // Portfolio commands
            'portföy': () => this.analyzePortfolio(),
            'portfolio': () => this.analyzePortfolio(),
            'portföyüm': () => this.analyzePortfolio(),
            'yatırımlarım': () => this.analyzePortfolio(),
            'ne kadar': () => this.analyzePortfolio(),
            'kazandım mı': () => this.analyzePortfolio(),
            'kaybettim mi': () => this.analyzePortfolio(),

            // Stock analysis
            'hisse': (query) => this.analyzeStock(query),
            'alsam mı': (query) => this.shouldIBuy(query),
            'satsam mı': (query) => this.shouldISell(query),
            'fiyat': (query) => this.getStockPrice(query),

            // Learning recommendations
            'öğren': () => this.recommendLearning(),
            'ne öğrenmeliyim': () => this.recommendLearning(),
            'seviyem': () => this.assessLevel(),
            'ilerleme': () => this.showProgress(),

            // Reports
            'rapor': () => this.summarizeReport(),
            'piyasa': () => this.marketOverview(),
            'haberler': () => this.getNews(),
            'bugün': () => this.todaySummary(),

            // Risk & Strategy
            'risk': () => this.assessRisk(),
            'strateji': () => this.suggestStrategy(),
            'tavsiye': () => this.getAdvice(),
            'öneri': () => this.getAdvice(),

            // General
            'yardım': () => this.showHelp(),
            'help': () => this.showHelp(),
            'neler yapabilirsin': () => this.showCapabilities()
        };
    }

    /**
     * Process user message with smart detection
     */
    async processMessage(userMessage) {
        const messageLower = userMessage.toLowerCase().trim();

        // Check for smart commands
        for (const [keyword, handler] of Object.entries(this.smartCommands)) {
            if (messageLower.includes(keyword)) {
                console.log(`🎯 Smart command detected: ${keyword}`);
                return await handler(messageLower);
            }
        }

        // If no smart command, use Gemini AI
        return await this.askGemini(userMessage);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * PORTFOLIO ANALYSIS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    analyzePortfolio() {
        if (!this.context.portfolio) {
            return {
                type: 'error',
                message: 'Henüz bir portföyünüz yok. Simülatör sayfasından işlem yapmaya başlayın!'
            };
        }

        const stats = this.context.portfolio.stats;
        if (!stats) {
            return {
                type: 'error',
                message: 'Portföy istatistikleri hesaplanamadı.'
            };
        }

        const isProfitable = stats.totalProfitLoss >= 0;
        const emoji = isProfitable ? '📈' : '📉';

        let analysis = `## ${emoji} Portföy Analizi\n\n`;

        analysis += `### 💰 Genel Durum\n`;
        analysis += `- **Toplam Değer:** ${stats.totalValue.toLocaleString('tr-TR')} ₺\n`;
        analysis += `- **Nakit:** ${stats.cash.toLocaleString('tr-TR')} ₺\n`;
        analysis += `- **Hisse Değeri:** ${stats.stockValue.toLocaleString('tr-TR')} ₺\n`;
        analysis += `- **Kar/Zarar:** ${stats.totalProfitLoss >= 0 ? '+' : ''}${stats.totalProfitLoss.toLocaleString('tr-TR')} ₺ `;
        analysis += `(${stats.totalProfitLossPercent >= 0 ? '+' : ''}${stats.totalProfitLossPercent.toFixed(2)}%)\n\n`;

        if (stats.bestPerformer) {
            analysis += `### 🏆 En İyi Performans\n`;
            analysis += `**${stats.bestPerformer.symbol}:** +${stats.bestPerformer.gainPercent.toFixed(2)}% `;
            analysis += `(+${stats.bestPerformer.gain.toLocaleString('tr-TR')} ₺)\n\n`;
        }

        if (stats.worstPerformer) {
            analysis += `### ⚠️ En Kötü Performans\n`;
            analysis += `**${stats.worstPerformer.symbol}:** ${stats.worstPerformer.gainPercent.toFixed(2)}% `;
            analysis += `(${stats.worstPerformer.gain.toLocaleString('tr-TR')} ₺)\n\n`;
        }

        analysis += `### 🎯 Diversifikasyon\n`;
        analysis += `- **Skor:** ${stats.diversification.score}/100 (${stats.diversification.level})\n`;
        analysis += `- **Hisse Sayısı:** ${stats.numberOfHoldings}\n`;
        analysis += `- **Öneri:** ${stats.diversification.recommendation}\n\n`;

        // Risk assessment
        const riskLevel = this.assessPortfolioRisk(stats);
        analysis += `### 🛡️ Risk Seviyesi\n`;
        analysis += `**${riskLevel.level}** - ${riskLevel.description}\n\n`;

        // Recommendations
        analysis += `### 💡 Öneriler\n`;
        const recommendations = this.generatePortfolioRecommendations(stats);
        recommendations.forEach((rec, i) => {
            analysis += `${i + 1}. ${rec}\n`;
        });

        return {
            type: 'analysis',
            title: 'Portföy Analizi',
            content: analysis,
            stats: stats
        };
    }

    /**
     * Assess portfolio risk
     */
    assessPortfolioRisk(stats) {
        const volatility = Math.abs(stats.totalProfitLossPercent);
        const diversificationScore = stats.diversification.score;

        let riskScore = 0;

        // High volatility = higher risk
        if (volatility > 20) riskScore += 3;
        else if (volatility > 10) riskScore += 2;
        else riskScore += 1;

        // Low diversification = higher risk
        if (diversificationScore < 40) riskScore += 3;
        else if (diversificationScore < 70) riskScore += 2;
        else riskScore += 1;

        if (riskScore >= 5) {
            return {
                level: 'Yüksek Risk',
                description: 'Portföyünüz yüksek riskli. Diversifikasyonu artırın ve volatil hisselerden uzak durun.'
            };
        } else if (riskScore >= 3) {
            return {
                level: 'Orta Risk',
                description: 'Portföyünüz dengeli ancak iyileştirilebilir. Diversifikasyonu artırmayı düşünün.'
            };
        } else {
            return {
                level: 'Düşük Risk',
                description: 'Portföyünüz iyi çeşitlendirilmiş ve dengeli.'
            };
        }
    }

    /**
     * Generate portfolio recommendations
     */
    generatePortfolioRecommendations(stats) {
        const recommendations = [];

        // Diversification
        if (stats.diversification.score < 70) {
            recommendations.push(`🎯 Diversifikasyon: ${10 - stats.numberOfHoldings} hisse daha ekleyerek riski azaltın.`);
        }

        // Cash allocation
        const cashPercent = (stats.cash / stats.totalValue) * 100;
        if (cashPercent > 50) {
            recommendations.push(`💰 Nakit fazla: Paranızın %${Math.round(cashPercent)}'i nakit. Yatırıma yönlendirin.`);
        } else if (cashPercent < 10) {
            recommendations.push(`⚠️ Nakit az: Acil durum rezervi için %10-20 nakit tutun.`);
        }

        // Performance
        if (stats.totalProfitLossPercent < -10) {
            recommendations.push(`📉 Zarar yönetimi: Kayıplarınızı durdurmak için stop-loss kullanın.`);
        } else if (stats.totalProfitLossPercent > 20) {
            recommendations.push(`🎉 Kar realizasyonu: Kazançlarınızı realize etmeyi düşünün.`);
        }

        // Experience-based
        if (this.userProfile.experience === 'beginner') {
            recommendations.push(`📚 Eğitim: Daha fazla öğrenmek için Eğitim sayfasını ziyaret edin.`);
        }

        if (recommendations.length === 0) {
            recommendations.push(`✅ Portföyünüz dengeli görünüyor. Mevcut stratejinize devam edin.`);
        }

        return recommendations;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * STOCK ANALYSIS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    analyzeStock(query) {
        // Extract stock symbol from query
        const symbol = this.extractSymbol(query);

        if (!symbol) {
            return {
                type: 'question',
                message: 'Hangi hisse hakkında bilgi almak istersiniz? (Örnek: AAPL, TSLA, GARAN)'
            };
        }

        const stock = this.findStock(symbol);

        if (!stock) {
            return {
                type: 'error',
                message: `"${symbol}" sembolü bulunamadı. Lütfen geçerli bir hisse sembolü girin.`
            };
        }

        let analysis = `## 📊 ${stock.name} (${stock.symbol})\n\n`;

        analysis += `### 💵 Fiyat Bilgileri\n`;
        const currency = stock.market === 'bist' ? '₺' : '$';
        analysis += `- **Güncel Fiyat:** ${currency}${stock.price?.toFixed(2) || 'N/A'}\n`;
        analysis += `- **Değişim:** ${stock.change >= 0 ? '+' : ''}${stock.change?.toFixed(2)}% `;
        analysis += `${stock.change >= 0 ? '📈' : '📉'}\n`;
        analysis += `- **Hacim:** ${stock.volume?.toLocaleString() || 'N/A'}\n\n`;

        analysis += `### 📈 Teknik Analiz\n`;
        const trend = this.analyzeTrend(stock);
        analysis += `- **Trend:** ${trend.direction} ${trend.emoji}\n`;
        analysis += `- **Momentum:** ${trend.momentum}\n`;
        analysis += `- **Sinyal:** ${trend.signal}\n\n`;

        analysis += `### 🎯 Tavsiye\n`;
        const recommendation = this.generateStockRecommendation(stock, trend);
        analysis += recommendation;

        return {
            type: 'analysis',
            title: `${stock.symbol} Analizi`,
            content: analysis,
            stock: stock
        };
    }

    /**
     * Extract stock symbol from query
     */
    extractSymbol(query) {
        // Look for uppercase words (likely stock symbols)
        const words = query.toUpperCase().split(' ');

        for (const word of words) {
            // Check if it's a valid symbol
            if (this.findStock(word)) {
                return word;
            }
        }

        return null;
    }

    /**
     * Analyze stock trend
     */
    analyzeTrend(stock) {
        const change = stock.change || 0;

        let direction, emoji, momentum, signal;

        if (change > 2) {
            direction = 'Güçlü Yükseliş';
            emoji = '🚀';
            momentum = 'Pozitif';
            signal = 'AL';
        } else if (change > 0) {
            direction = 'Yükseliş';
            emoji = '📈';
            momentum = 'Pozitif';
            signal = 'AL';
        } else if (change > -2) {
            direction = 'Düşüş';
            emoji = '📉';
            momentum = 'Negatif';
            signal = 'BEKLE';
        } else {
            direction = 'Güçlü Düşüş';
            emoji = '⚠️';
            momentum = 'Negatif';
            signal = 'SAT';
        }

        return { direction, emoji, momentum, signal };
    }

    /**
     * Generate stock recommendation
     */
    generateStockRecommendation(stock, trend) {
        let recommendation = `**${trend.signal}** sinyali aktif.\n\n`;

        if (trend.signal === 'AL') {
            recommendation += `✅ Bu hisse yükseliş trendinde. Ancak:\n`;
            recommendation += `- Stop-loss belirleyin (öneri: %${(stock.change * -1.5).toFixed(1)} altında)\n`;
            recommendation += `- Portföyünüzün max %10'unu bu hisseye ayırın\n`;
            recommendation += `- Hedef kar: %${(stock.change * 1.5).toFixed(1)}\n`;
        } else if (trend.signal === 'BEKLE') {
            recommendation += `⏸️ Şu an beklemek daha mantıklı:\n`;
            recommendation += `- Trendin netleşmesini bekleyin\n`;
            recommendation += `- Destek seviyesine yaklaşırsa alım düşünülebilir\n`;
        } else {
            recommendation += `⚠️ Düşüş devam edebilir:\n`;
            recommendation += `- Elinizde varsa stop-loss kullanın\n`;
            recommendation += `- Toparlanma beklerseniz, uzun vadeli düşünün\n`;
        }

        recommendation += `\n💡 **Risk Uyarısı:** Bu sadece bir analiz, yatırım tavsiyesi değildir.`;

        return recommendation;
    }

    /**
     * Should I buy this stock?
     */
    shouldIBuy(query) {
        const symbol = this.extractSymbol(query);

        if (!symbol) {
            return {
                type: 'question',
                message: 'Hangi hisseyi almayı düşünüyorsunuz? (Örnek: "AAPL alsam mı?")'
            };
        }

        const stock = this.findStock(symbol);

        if (!stock) {
            return {
                type: 'error',
                message: `"${symbol}" bulunamadı.`
            };
        }

        const trend = this.analyzeTrend(stock);
        const riskLevel = this.userProfile.riskTolerance;

        let advice = `## 🤔 ${stock.symbol} Alsam Mı?\n\n`;

        advice += `### 📊 Mevcut Durum\n`;
        advice += `- **Fiyat:** ${stock.market === 'bist' ? '₺' : '$'}${stock.price?.toFixed(2)}\n`;
        advice += `- **Trend:** ${trend.direction} ${trend.emoji}\n`;
        advice += `- **Sinyal:** ${trend.signal}\n\n`;

        advice += `### 🎯 Tavsiyem\n`;

        if (trend.signal === 'AL' && riskLevel !== 'low') {
            advice += `✅ **EVET, alabilirsiniz!**\n\n`;
            advice += `**Neden?**\n`;
            advice += `- Yükseliş trendinde\n`;
            advice += `- Momentum pozitif\n`;
            advice += `- Risk toleransınıza uygun\n\n`;
            advice += `**Nasıl?**\n`;
            advice += `- Portföyünüzün max %10'u kadar\n`;
            advice += `- Stop-loss: %${(stock.change * -2).toFixed(1)} altında\n`;
            advice += `- Hedef: %${(stock.change * 2).toFixed(1)} üzerinde\n`;
        } else if (trend.signal === 'AL' && riskLevel === 'low') {
            advice += `⚠️ **DİKKATLİ OLUN**\n\n`;
            advice += `Hisse yükselişte ama risk toleransınız düşük. Küçük miktarla başlayın.\n`;
        } else if (trend.signal === 'BEKLE') {
            advice += `⏸️ **BEKLEMEK DAHA İYİ**\n\n`;
            advice += `Trend net değil. Daha iyi bir giriş noktası bekleyin.\n`;
        } else {
            advice += `❌ **ŞİMDİ ALMA**\n\n`;
            advice += `Düşüş trendinde. Destek seviyesine gelene kadar bekleyin.\n`;
        }

        advice += `\n💡 **Not:** Bu bir yatırım tavsiyesi değil, analiz amaçlıdır.`;

        return {
            type: 'advice',
            title: `${stock.symbol} Almalı Mıyım?`,
            content: advice
        };
    }

    /**
     * Should I sell this stock?
     */
    shouldISell(query) {
        const symbol = this.extractSymbol(query);

        if (!symbol) {
            return {
                type: 'question',
                message: 'Hangi hisseyi satmayı düşünüyorsunuz?'
            };
        }

        const stock = this.findStock(symbol);

        if (!stock) {
            return {
                type: 'error',
                message: `"${symbol}" bulunamadı.`
            };
        }

        // Check if user owns this stock
        const holding = this.context.portfolio?.holdings.find(h => h.symbol === symbol);

        let advice = `## 🤔 ${stock.symbol} Satsam Mı?\n\n`;

        if (holding) {
            const currentValue = stock.price * holding.quantity;
            const costBasis = holding.averagePrice * holding.quantity;
            const gain = currentValue - costBasis;
            const gainPercent = (gain / costBasis) * 100;

            advice += `### 💼 Portföyünüzde\n`;
            advice += `- **Miktar:** ${holding.quantity} adet\n`;
            advice += `- **Maliyet:** ${holding.averagePrice.toFixed(2)} ₺/adet\n`;
            advice += `- **Güncel:** ${stock.price.toFixed(2)} ₺/adet\n`;
            advice += `- **Kar/Zarar:** ${gain >= 0 ? '+' : ''}${gain.toFixed(2)} ₺ (${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%)\n\n`;
        }

        const trend = this.analyzeTrend(stock);

        advice += `### 📊 Mevcut Durum\n`;
        advice += `- **Trend:** ${trend.direction} ${trend.emoji}\n`;
        advice += `- **Sinyal:** ${trend.signal}\n\n`;

        advice += `### 🎯 Tavsiyem\n`;

        if (holding) {
            if (holding.averagePrice * holding.quantity * 0.2 < Math.abs(gain)) {
                // More than 20% profit or loss
                if (gain > 0) {
                    advice += `💰 **KAR REALİZE ET**\n\n%${gainPercent.toFixed(0)} kazandınız. Satıp karı realize edebilirsiniz.\n`;
                } else {
                    advice += `⚠️ **STOP-LOSS DÜŞÜN**\n\n%${Math.abs(gainPercent).toFixed(0)} kaybınız var. Daha fazla zarar etmemek için satmayı düşünün.\n`;
                }
            } else if (trend.signal === 'SAT') {
                advice += `📉 **SATMAYI DÜŞÜN**\n\nDüşüş trendi başladı. Koruma amaçlı satabilirsiniz.\n`;
            } else {
                advice += `✋ **BEKLE**\n\nHenüz satmak için acele etmeyin. Trend devam ediyor.\n`;
            }
        } else {
            advice += `ℹ️ Bu hisse portföyünüzde yok.\n`;
        }

        return {
            type: 'advice',
            title: `${stock.symbol} Satmalı Mıyım?`,
            content: advice
        };
    }

    /**
     * Get stock price
     */
    getStockPrice(query) {
        const symbol = this.extractSymbol(query);

        if (!symbol) {
            return {
                type: 'question',
                message: 'Hangi hissenin fiyatını öğrenmek istersiniz?'
            };
        }

        const stock = this.findStock(symbol);

        if (!stock) {
            return {
                type: 'error',
                message: `"${symbol}" bulunamadı.`
            };
        }

        const currency = stock.market === 'bist' ? '₺' : '$';
        const changeEmoji = stock.change >= 0 ? '📈' : '📉';

        return {
            type: 'info',
            message: `**${stock.name} (${stock.symbol})**\n\n` +
                     `💵 Fiyat: ${currency}${stock.price?.toFixed(2) || 'N/A'}\n` +
                     `${changeEmoji} Değişim: ${stock.change >= 0 ? '+' : ''}${stock.change?.toFixed(2)}%`
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * LEARNING RECOMMENDATIONS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    recommendLearning() {
        if (!this.context.progress) {
            return {
                type: 'info',
                message: '📚 Eğitim sayfasından 49 günlük programımıza başlayın!'
            };
        }

        const progress = this.context.progress;
        const daysCompleted = progress.totalDaysCompleted || 0;

        let recommendation = `## 🎓 Kişiselleştirilmiş Öğrenme Önerisi\n\n`;

        recommendation += `### 📊 Mevcut Durumunuz\n`;
        recommendation += `- **Tamamlanan Günler:** ${daysCompleted}/49\n`;
        recommendation += `- **İlerleme:** %${Math.round((daysCompleted / 49) * 100)}\n`;
        recommendation += `- **Seri:** ${progress.currentStreak} gün 🔥\n`;
        recommendation += `- **Ortalama Quiz:** %${progress.avgQuizScore || 0}\n\n`;

        recommendation += `### 🎯 Sıradaki Adımlar\n`;

        if (daysCompleted < 7) {
            recommendation += `1. **Temel Kavramlar** (Hafta 1) tamamlayın\n`;
            recommendation += `2. Hisse senedi, endeks ve piyasa yapısını öğrenin\n`;
            recommendation += `3. Her gün 30-60 dakika ayırın\n`;
        } else if (daysCompleted < 14) {
            recommendation += `1. **Teknik Analiz** (Hafta 2) devam edin\n`;
            recommendation += `2. Mum grafikleri ve göstergeleri öğrenin\n`;
            recommendation += `3. Simülatörde pratik yapın\n`;
        } else if (daysCompleted < 21) {
            recommendation += `1. **Temel Analiz** (Hafta 3) öğrenin\n`;
            recommendation += `2. Şirket finansal tablolarını analiz edin\n`;
            recommendation += `3. F/K, PD/DD oranlarını anlayın\n`;
        } else if (daysCompleted < 28) {
            recommendation += `1. **İleri Seviye** (Hafta 4) tamamlayın\n`;
            recommendation += `2. Opsiyon, forex ve türevleri öğrenin\n`;
            recommendation += `3. Risk yönetimi stratejileri geliştirin\n`;
        } else {
            recommendation += `1. **İleri Teknikler** (Hafta 5-7) ile devam edin\n`;
            recommendation += `2. Trading stratejileri oluşturun\n`;
            recommendation += `3. Piyasa psikolojisini anlayın\n`;
        }

        recommendation += `\n### 💡 Önerilen Kaynaklar\n`;
        recommendation += `- 📖 Kaynaklar sayfasından kitap listesine göz atın\n`;
        recommendation += `- 📊 Grafikler sayfasında teknik analiz pratik yapın\n`;
        recommendation += `- 🎮 Simülatörde risk almadan öğrenin\n`;

        return {
            type: 'recommendation',
            title: 'Öğrenme Önerisi',
            content: recommendation
        };
    }

    /**
     * Assess user level
     */
    assessLevel() {
        const progress = this.context.progress;

        if (!progress) {
            return {
                type: 'info',
                message: 'Seviyenizi belirlemek için eğitim programına başlayın!'
            };
        }

        const daysCompleted = progress.totalDaysCompleted || 0;
        const avgQuiz = progress.avgQuizScore || 0;

        let level, description, emoji;

        if (daysCompleted >= 40 && avgQuiz >= 80) {
            level = 'İleri Seviye';
            emoji = '🏆';
            description = 'Mükemmel! Finans piyasalarında ileri seviyedesiniz.';
        } else if (daysCompleted >= 25 && avgQuiz >= 70) {
            level = 'Orta-İleri Seviye';
            emoji = '⭐';
            description = 'Çok iyi ilerliyorsunuz! Biraz daha pratikle ustalaşacaksınız.';
        } else if (daysCompleted >= 15 && avgQuiz >= 60) {
            level = 'Orta Seviye';
            emoji = '📚';
            description = 'İyi bir temel oluşturdunuz. Devam edin!';
        } else if (daysCompleted >= 7) {
            level = 'Başlangıç-Orta';
            emoji = '🌱';
            description = 'Güzel başlangıç! Öğrenmeye devam edin.';
        } else {
            level = 'Başlangıç';
            emoji = '🚀';
            description = 'Yeni başlıyorsunuz. Sabırlı olun ve düzenli çalışın.';
        }

        return {
            type: 'assessment',
            title: 'Seviye Değerlendirmesi',
            content: `## ${emoji} Seviyeniz: ${level}\n\n${description}\n\n` +
                     `**Tamamlanan Günler:** ${daysCompleted}/49\n` +
                     `**Ortalama Quiz:** %${avgQuiz}`
        };
    }

    /**
     * Show progress
     */
    showProgress() {
        if (!this.context.progress) {
            return {
                type: 'info',
                message: 'İlerleme kaydınız yok. Eğitim sayfasından başlayın!'
            };
        }

        const p = this.context.progress;

        let progress = `## 📊 İlerleme Raporu\n\n`;

        progress += `### 🎯 Genel\n`;
        progress += `- **Tamamlanan:** ${p.totalDaysCompleted}/49 gün\n`;
        progress += `- **İlerleme:** %${Math.round((p.totalDaysCompleted / 49) * 100)}\n`;
        progress += `- **Seri:** ${p.currentStreak} gün 🔥\n`;
        progress += `- **En Uzun Seri:** ${p.longestStreak} gün\n\n`;

        progress += `### 📝 Quiz Performansı\n`;
        progress += `- **Ortalama Skor:** %${p.avgQuizScore || 0}\n`;
        progress += `- **Tamamlanan Quiz:** ${Object.keys(p.quizScores || {}).length}\n\n`;

        progress += `### 🎓 Sonraki Hedef\n`;
        const nextDay = p.totalDaysCompleted + 1;
        if (nextDay <= 49) {
            progress += `Gün ${nextDay} - Devam edin! 💪\n`;
        } else {
            progress += `🎉 Programı tamamladınız! Tebrikler!\n`;
        }

        return {
            type: 'report',
            title: 'İlerleme Raporu',
            content: progress
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * MARKET & REPORTS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    summarizeReport() {
        if (!this.context.reports) {
            return {
                type: 'info',
                message: 'Günlük rapor henüz oluşturulmadı. Raporlar sayfasını ziyaret edin.'
            };
        }

        const report = this.context.reports;

        let summary = `## 📋 ${report.title}\n\n`;
        summary += `**Tarih:** ${report.date}\n\n`;

        // Summarize each section briefly
        report.sections.forEach(section => {
            summary += `### ${section.title}\n`;

            // Get first 2 items from content
            const items = section.content.slice(0, 2);
            items.forEach(item => {
                if (item.text) {
                    summary += `${item.text}\n`;
                }
            });

            summary += `\n`;
        });

        summary += `\n💡 Detaylı rapor için Raporlar sayfasını ziyaret edin.`;

        return {
            type: 'summary',
            title: 'Rapor Özeti',
            content: summary
        };
    }

    marketOverview() {
        if (!this.context.marketData?.dashboard) {
            return {
                type: 'error',
                message: 'Piyasa verileri yüklenemedi.'
            };
        }

        const data = this.context.marketData.dashboard;

        let overview = `## 🌍 Piyasa Genel Görünüm\n\n`;

        if (data.indices) {
            overview += `### 📊 Endeksler\n`;
            const { sp500, nasdaq, dow, bist100 } = data.indices;

            if (sp500) {
                overview += `- **S&P 500:** ${sp500.price.toFixed(2)} (${sp500.changePercent >= 0 ? '+' : ''}${sp500.changePercent.toFixed(2)}%) ${sp500.changePercent >= 0 ? '📈' : '📉'}\n`;
            }
            if (nasdaq) {
                overview += `- **NASDAQ:** ${nasdaq.price.toFixed(2)} (${nasdaq.changePercent >= 0 ? '+' : ''}${nasdaq.changePercent.toFixed(2)}%) ${nasdaq.changePercent >= 0 ? '📈' : '📉'}\n`;
            }
            if (bist100) {
                overview += `- **BIST 100:** ${bist100.price.toFixed(2)} (${bist100.changePercent >= 0 ? '+' : ''}${bist100.changePercent.toFixed(2)}%) ${bist100.changePercent >= 0 ? '📈' : '📉'}\n`;
            }
            overview += `\n`;
        }

        if (data.forex) {
            overview += `### 💱 Döviz\n`;
            overview += `- **USD/TRY:** ₺${data.forex.USDTRY.toFixed(4)}\n`;
            overview += `- **EUR/TRY:** ₺${data.forex.EURTRY.toFixed(4)}\n\n`;
        }

        if (data.crypto) {
            overview += `### ₿ Kripto\n`;
            if (data.crypto.bitcoin) {
                overview += `- **Bitcoin:** $${data.crypto.bitcoin.price.toLocaleString()} (${data.crypto.bitcoin.change24h >= 0 ? '+' : ''}${data.crypto.bitcoin.change24h.toFixed(2)}%)\n`;
            }
            if (data.crypto.ethereum) {
                overview += `- **Ethereum:** $${data.crypto.ethereum.price.toLocaleString()} (${data.crypto.ethereum.change24h >= 0 ? '+' : ''}${data.crypto.ethereum.change24h.toFixed(2)}%)\n`;
            }
        }

        return {
            type: 'overview',
            title: 'Piyasa Görünümü',
            content: overview
        };
    }

    todaySummary() {
        let summary = `## 📅 Bugün İçin Özet\n\n`;

        // Market overview
        const market = this.marketOverview();
        if (market.type !== 'error') {
            summary += market.content + `\n\n`;
        }

        // Portfolio
        if (this.context.portfolio) {
            const portfolio = this.analyzePortfolio();
            if (portfolio.type !== 'error') {
                summary += `### 💼 Portföyünüz\n`;
                summary += `**Toplam Değer:** ${portfolio.stats.totalValue.toLocaleString('tr-TR')} ₺\n`;
                summary += `**Kar/Zarar:** ${portfolio.stats.totalProfitLoss >= 0 ? '+' : ''}${portfolio.stats.totalProfitLoss.toLocaleString('tr-TR')} ₺\n\n`;
            }
        }

        // Learning progress
        if (this.context.progress) {
            summary += `### 🎓 Öğrenme\n`;
            summary += `**Tamamlanan:** ${this.context.progress.totalDaysCompleted}/49 gün\n`;
            summary += `**Seri:** ${this.context.progress.currentStreak} gün 🔥\n`;
        }

        return {
            type: 'summary',
            title: 'Bugün',
            content: summary
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * GENERAL HELPERS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    assessRisk() {
        if (!this.context.portfolio) {
            return {
                type: 'info',
                message: 'Risk değerlendirmesi için önce portföy oluşturun.'
            };
        }

        const riskAssessment = this.assessPortfolioRisk(this.context.portfolio.stats);

        return {
            type: 'assessment',
            title: 'Risk Değerlendirmesi',
            content: `## 🛡️ Risk Analizi\n\n**Seviye:** ${riskAssessment.level}\n\n${riskAssessment.description}`
        };
    }

    suggestStrategy() {
        const experience = this.userProfile.experience;
        const riskTolerance = this.userProfile.riskTolerance;

        let strategy = `## 🎯 Size Özel Strateji\n\n`;

        strategy += `**Profiliniz:**\n`;
        strategy += `- Deneyim: ${experience === 'beginner' ? 'Başlangıç' : experience === 'intermediate' ? 'Orta' : 'İleri'}\n`;
        strategy += `- Risk Toleransı: ${riskTolerance === 'low' ? 'Düşük' : riskTolerance === 'medium' ? 'Orta' : 'Yüksek'}\n\n`;

        strategy += `### 📋 Önerilen Strateji\n`;

        if (experience === 'beginner') {
            strategy += `**Pasif Yatırım (Buy & Hold)**\n`;
            strategy += `- Diversifiye portföy oluşturun (8-10 hisse)\n`;
            strategy += `- Büyük şirketlere odaklanın (blue-chip)\n`;
            strategy += `- Uzun vadeli düşünün (1+ yıl)\n`;
            strategy += `- Düzenli katkı yapın (DCA - Dollar Cost Averaging)\n`;
        } else if (experience === 'intermediate') {
            strategy += `**Dengeli Yaklaşım**\n`;
            strategy += `- %70 uzun vadeli, %30 swing trading\n`;
            strategy += `- Teknik ve temel analiz kombinasyonu\n`;
            strategy += `- Sektör rotasyonu yapın\n`;
            strategy += `- Stop-loss kullanın\n`;
        } else {
            strategy += `**Aktif Trading**\n`;
            strategy += `- Swing ve day trading karışımı\n`;
            strategy += `- İleri teknik analiz (Fibonacci, Elliott Wave)\n`;
            strategy += `- Opsiyon stratejileri\n`;
            strategy += `- Risk/ödül oranı 1:3+\n`;
        }

        strategy += `\n### 💡 İpuçları\n`;
        strategy += `- Risk yönetimi her şeyden önemli\n`;
        strategy += `- Duygusal kararlar almayın\n`;
        strategy += `- Sürekli öğrenmeye devam edin\n`;

        return {
            type: 'strategy',
            title: 'Yatırım Stratejisi',
            content: strategy
        };
    }

    getAdvice() {
        const advice = [
            '💡 **Risk Yönetimi:** Portföyünüzün max %2\'sini bir işlemde riske atın.',
            '📊 **Diversifikasyon:** Farklı sektörlerden 8-10 hisse bulundurun.',
            '🎯 **Hedef Belirleyin:** Gerçekçi kar hedefleri koyun (%10-20).',
            '⏰ **Sabırlı Olun:** En iyi işlemler, beklemeyi bilenleredir.',
            '📚 **Sürekli Öğrenin:** Piyasa sürekli değişir, siz de değişmelisiniz.',
            '🛡️ **Stop-Loss:** Kayıplarınızı sınırlamak için mutlaka kullanın.',
            '📈 **Trend Takip:** Trende karşı değil, trendle birlikte gidin.',
            '💰 **Nakit Rezervi:** Portföyünüzün %10-20\'sini nakit tutun.'
        ];

        const randomAdvice = advice[Math.floor(Math.random() * advice.length)];

        return {
            type: 'tip',
            message: randomAdvice
        };
    }

    showHelp() {
        return {
            type: 'help',
            title: '🤖 Yapabileceklerim',
            content: `## Komutlar\n\n` +
                     `### 💼 Portföy\n` +
                     `- "portföyüm" - Detaylı analiz\n` +
                     `- "ne kadar kazandım" - Kar/zarar\n` +
                     `- "risk" - Risk değerlendirmesi\n\n` +
                     `### 📈 Hisse Analizi\n` +
                     `- "AAPL hisse" - Hisse analizi\n` +
                     `- "TSLA alsam mı" - Alım tavsiyesi\n` +
                     `- "GARAN satsam mı" - Satış tavsiyesi\n\n` +
                     `### 🎓 Öğrenme\n` +
                     `- "ne öğrenmeliyim" - Kişisel öneri\n` +
                     `- "seviyem" - Seviye değerlendirmesi\n` +
                     `- "ilerleme" - İlerleme raporu\n\n` +
                     `### 📊 Piyasa\n` +
                     `- "piyasa" - Genel durum\n` +
                     `- "rapor" - Günlük rapor özeti\n` +
                     `- "bugün" - Günlük özet\n\n` +
                     `Ayrıca doğal dilde sorularınızı sorabilirsiniz!`
        };
    }

    showCapabilities() {
        return {
            type: 'capabilities',
            title: '✨ Yeteneklerim',
            content: `## Yapabileceklerim\n\n` +
                     `✅ Portföy analizi ve risk değerlendirmesi\n` +
                     `✅ Hisse senedi analizi ve önerileri\n` +
                     `✅ Kişiselleştirilmiş öğrenme önerileri\n` +
                     `✅ Günlük piyasa raporları\n` +
                     `✅ Yatırım stratejisi önerileri\n` +
                     `✅ Teknik ve temel analiz\n` +
                     `✅ Risk yönetimi tavsiyeleri\n` +
                     `✅ Seviye değerlendirmesi\n\n` +
                     `📚 Sürekli öğreniyorum ve gelişiyorum!`
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * GEMINI AI FALLBACK
     * ═══════════════════════════════════════════════════════════════════════════
     */

    async askGemini(userMessage) {
        try {
            // Prepare context for Gemini
            const contextPrompt = this.buildContextPrompt();

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${contextPrompt}\n\nKullanıcı sorusu: ${userMessage}`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]) {
                const aiResponse = data.candidates[0].content.parts[0].text;

                return {
                    type: 'ai',
                    message: aiResponse
                };
            }

            throw new Error('No response from Gemini');

        } catch (error) {
            console.error('❌ Gemini AI error:', error);

            return {
                type: 'error',
                message: 'Şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin veya belirli komutlar kullanın (örn: "yardım").'
            };
        }
    }

    /**
     * Build context prompt for Gemini
     */
    buildContextPrompt() {
        let prompt = `Sen Finans Akademi'nin AI asistanısın. Adın Finans Asistan. Türkçe konuşuyorsun.\n\n`;

        prompt += `Kullanıcı Profili:\n`;
        prompt += `- Deneyim: ${this.userProfile.experience}\n`;
        prompt += `- Risk Toleransı: ${this.userProfile.riskTolerance}\n`;

        if (this.context.portfolio) {
            prompt += `\nPortföy:\n`;
            prompt += `- Toplam Değer: ${this.context.portfolio.stats.totalValue.toFixed(2)} ₺\n`;
            prompt += `- Kar/Zarar: ${this.context.portfolio.stats.totalProfitLoss.toFixed(2)} ₺\n`;
        }

        if (this.context.progress) {
            prompt += `\nÖğrenme İlerlemesi:\n`;
            prompt += `- Tamamlanan: ${this.context.progress.totalDaysCompleted}/49 gün\n`;
            prompt += `- Quiz Ortalaması: %${this.context.progress.avgQuizScore}\n`;
        }

        prompt += `\nGörevin: Kullanıcıya finans, yatırım ve borsa konularında yardımcı olmak. `;
        prompt += `Kısa, öz ve pratik cevaplar ver. Markdown formatı kullan. `;
        prompt += `Yatırım tavsiyesi değil, eğitim amaçlı bilgi ver.`;

        return prompt;
    }
}

// Initialize and export
let aiAssistant;

function initAIAssistant() {
    aiAssistant = new AIAssistant();
    window.aiAssistant = aiAssistant;
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIAssistant);
} else {
    initAIAssistant();
}

export { AIAssistant };
