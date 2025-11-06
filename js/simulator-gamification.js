/**
 * ================================================================================
 * SIMULATOR GAMIFICATION SYSTEM
 * ================================================================================
 *
 * Enhances the trading simulator with:
 * - Achievement/Badge system
 * - Level progression
 * - Daily challenges
 * - Smart notifications & feedback
 * - Contextual tips
 *
 * @version 1.0.0
 * @author Finans Akademi
 */

'use strict';

// ================================================================================
// ACHIEVEMENTS SYSTEM
// ================================================================================

const ACHIEVEMENTS = {
    // Başlangıç başarımları
    FIRST_TRADE: {
        id: 'first_trade',
        name: 'İlk Adım',
        description: 'İlk işlemini gerçekleştir',
        icon: '🎯',
        points: 10
    },
    FIRST_PROFIT: {
        id: 'first_profit',
        name: 'İlk Kazanç',
        description: 'İlk kârlı satışını yap',
        icon: '💰',
        points: 25
    },
    FIRST_LOSS: {
        id: 'first_loss',
        name: 'Ders Alındı',
        description: 'İlk zararlı işlemini yap (öğrenme süreci!)',
        icon: '📚',
        points: 10
    },

    // İşlem hacmi başarımları
    TRADES_10: {
        id: 'trades_10',
        name: 'Aktif Trader',
        description: '10 işlem tamamla',
        icon: '📈',
        points: 50
    },
    TRADES_50: {
        id: 'trades_50',
        name: 'Deneyimli Trader',
        description: '50 işlem tamamla',
        icon: '🚀',
        points: 100
    },
    TRADES_100: {
        id: 'trades_100',
        name: 'Pro Trader',
        description: '100 işlem tamamla',
        icon: '⭐',
        points: 200
    },

    // Kâr başarımları
    PROFIT_10: {
        id: 'profit_10',
        name: 'Kâra Geçiş',
        description: 'Toplam %10 kâr et',
        icon: '📊',
        points: 75
    },
    PROFIT_25: {
        id: 'profit_25',
        name: 'Başarılı Yatırımcı',
        description: 'Toplam %25 kâr et',
        icon: '💎',
        points: 150
    },
    PROFIT_50: {
        id: 'profit_50',
        name: 'Master Trader',
        description: 'Toplam %50 kâr et',
        icon: '👑',
        points: 300
    },

    // Risk yönetimi
    STOP_LOSS_USER: {
        id: 'stop_loss_user',
        name: 'Risk Yöneticisi',
        description: '5 kez stop loss kullan',
        icon: '🛡️',
        points: 50
    },
    DIVERSIFIED: {
        id: 'diversified',
        name: 'Çeşitlendirme Ustası',
        description: 'Aynı anda 5 farklı hisse tut',
        icon: '🎨',
        points: 75
    },

    // Streak başarımları
    STREAK_7: {
        id: 'streak_7',
        name: '7 Günlük Seri',
        description: '7 gün üst üste işlem yap',
        icon: '🔥',
        points: 100
    },
    WINNING_STREAK: {
        id: 'winning_streak',
        name: 'Seri Kazanan',
        description: '5 işlem üst üste kâr et',
        icon: '🎰',
        points: 150
    },

    // Özel başarımlar
    PERFECT_TIMING: {
        id: 'perfect_timing',
        name: 'Mükemmel Zamanlama',
        description: 'Tek işlemde %20+ kâr et',
        icon: '⚡',
        points: 200
    },
    RECOVERY: {
        id: 'recovery',
        name: 'Geri Dönüş',
        description: 'Zarar sonrası kâra geç',
        icon: '🦅',
        points: 100
    }
};

// ================================================================================
// LEVEL SYSTEM
// ================================================================================

const LEVELS = [
    { level: 1, name: 'Yeni Başlayan', minPoints: 0, icon: '🌱' },
    { level: 2, name: 'Acemi Trader', minPoints: 100, icon: '📚' },
    { level: 3, name: 'Öğrenci', minPoints: 300, icon: '🎓' },
    { level: 4, name: 'Pratisyen', minPoints: 600, icon: '💼' },
    { level: 5, name: 'Deneyimli', minPoints: 1000, icon: '📈' },
    { level: 6, name: 'Uzman', minPoints: 1500, icon: '⭐' },
    { level: 7, name: 'Pro Trader', minPoints: 2500, icon: '🚀' },
    { level: 8, name: 'Master', minPoints: 4000, icon: '👑' },
    { level: 9, name: 'Efsane', minPoints: 6000, icon: '💎' },
    { level: 10, name: 'Grand Master', minPoints: 10000, icon: '🏆' }
];

// ================================================================================
// DAILY CHALLENGES
// ================================================================================

const DAILY_CHALLENGES = [
    {
        id: 'diversify_today',
        name: 'Çeşitlendir',
        description: 'Bugün 3 farklı sektörden hisse al',
        points: 50,
        icon: '🎯'
    },
    {
        id: 'set_stop_loss',
        name: 'Risk Kontrolü',
        description: 'Bugün aldığın hisselere stop loss koy',
        points: 40,
        icon: '🛡️'
    },
    {
        id: 'profitable_trade',
        name: 'Kârlı İşlem',
        description: 'Bugün en az 1 kârlı işlem yap',
        points: 30,
        icon: '💰'
    },
    {
        id: 'research_before_buy',
        name: 'Araştırmacı',
        description: 'Almadan önce şirket sayfasını incele',
        points: 25,
        icon: '🔍'
    },
    {
        id: 'limit_order',
        name: 'Stratejik Alım',
        description: 'Limit order ile işlem yap',
        points: 35,
        icon: '🎲'
    }
];

// ================================================================================
// SMART TIPS & FEEDBACK
// ================================================================================

const TIPS = {
    // İşlem öncesi uyarılar
    HIGH_PRICE_WARNING: {
        condition: (currentPrice, avgPrice) => currentPrice > avgPrice * 1.1,
        message: '⚠️ Bu hisse ortalama fiyatından %{diff} daha pahalı. Beklemek daha iyi olabilir.',
        type: 'warning'
    },
    LOW_DIVERSIFICATION: {
        condition: (portfolioSize) => portfolioSize < 3,
        message: '💡 İpucu: Riski azaltmak için 5-10 farklı hisse ile portföy oluştur.',
        type: 'tip'
    },
    NO_STOP_LOSS: {
        condition: (hasStopLoss) => !hasStopLoss,
        message: '🛡️ Önemli: Her işlemde stop loss kullanmayı unutma! Kayıpları sınırlar.',
        type: 'warning'
    },
    BIG_TRADE_WARNING: {
        condition: (tradeAmount, totalBalance) => tradeAmount > totalBalance * 0.2,
        message: '⚠️ Bu işlem portföyünün %{percent}\'i. Risk yönetimi için max %10 önerilir.',
        type: 'warning'
    },

    // İşlem sonrası geri bildirim
    GOOD_PROFIT: {
        condition: (profitPercent) => profitPercent > 10,
        message: '🎉 Harika! %{percent} kâr ettiniz. Kâr realizasyonu yapmayı düşünün.',
        type: 'success'
    },
    SMALL_PROFIT: {
        condition: (profitPercent) => profitPercent > 0 && profitPercent < 5,
        message: '✅ Kâr ettin! Küçük kazançlar birikiyor. Sabırlı ol.',
        type: 'success'
    },
    LOSS_WARNING: {
        condition: (lossPercent) => lossPercent < -10,
        message: '📚 %{percent} zarar. Stop loss kullanmayı unutma. Her kayıp bir ders!',
        type: 'info'
    },
    PANIC_SELL: {
        condition: (holdingDays, lossPercent) => holdingDays < 1 && lossPercent < -5,
        message: '⚠️ Panik satış mı? Uzun vadeli düşün. Günlük dalgalanmalar normaldir.',
        type: 'warning'
    }
};

// ================================================================================
// GAMIFICATION MANAGER
// ================================================================================

class GamificationManager {
    constructor() {
        this.achievements = this.loadAchievements();
        this.level = this.loadLevel();
        this.dailyChallenges = this.loadDailyChallenges();
        this.stats = this.loadStats();

        this.init();
    }

    init() {
        this.checkDailyReset();
        this.updateLevelDisplay();
        this.renderAchievements();
        this.renderChallenges();
        console.log('🎮 Gamification system initialized');
    }

    // ================================================================================
    // ACHIEVEMENTS
    // ================================================================================

    loadAchievements() {
        const stored = localStorage.getItem('sim_achievements');
        return stored ? JSON.parse(stored) : {};
    }

    saveAchievements() {
        localStorage.setItem('sim_achievements', JSON.stringify(this.achievements));
    }

    unlockAchievement(achievementId) {
        if (this.achievements[achievementId]) {
            return; // Already unlocked
        }

        const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
        if (!achievement) return;

        this.achievements[achievementId] = {
            unlockedAt: Date.now(),
            points: achievement.points
        };

        this.addPoints(achievement.points);
        this.saveAchievements();
        this.showAchievementUnlock(achievement);
        this.renderAchievements();
    }

    checkAchievements(transactionData, portfolioData) {
        const totalTrades = this.stats.totalTrades || 0;
        const totalProfit = this.stats.totalProfitPercent || 0;
        const winStreak = this.stats.winStreak || 0;

        // İlk işlem
        if (totalTrades === 1) {
            this.unlockAchievement('first_trade');
        }

        // İşlem sayısı başarımları
        if (totalTrades === 10) this.unlockAchievement('trades_10');
        if (totalTrades === 50) this.unlockAchievement('trades_50');
        if (totalTrades === 100) this.unlockAchievement('trades_100');

        // Kâr başarımları
        if (totalProfit >= 10) this.unlockAchievement('profit_10');
        if (totalProfit >= 25) this.unlockAchievement('profit_25');
        if (totalProfit >= 50) this.unlockAchievement('profit_50');

        // İlk kâr/zarar
        if (transactionData?.realizedPL > 0 && !this.achievements.first_profit) {
            this.unlockAchievement('first_profit');
        }
        if (transactionData?.realizedPL < 0 && !this.achievements.first_loss) {
            this.unlockAchievement('first_loss');
        }

        // Mükemmel zamanlama
        if (transactionData?.profitPercent > 20) {
            this.unlockAchievement('perfect_timing');
        }

        // Seri kazanan
        if (winStreak >= 5) {
            this.unlockAchievement('winning_streak');
        }

        // Çeşitlendirme
        if (portfolioData?.holdings?.length >= 5) {
            this.unlockAchievement('diversified');
        }
    }

    showAchievementUnlock(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-unlock';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <h4>🏆 Başarım Kazanıldı!</h4>
                <p><strong>${achievement.name}</strong></p>
                <small>${achievement.description}</small>
                <div class="achievement-points">+${achievement.points} XP</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    renderAchievements() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;

        const html = Object.values(ACHIEVEMENTS).map(achievement => {
            const unlocked = this.achievements[achievement.id];
            return `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <span class="achievement-points">${achievement.points} XP</span>
                    </div>
                    ${unlocked ? '<div class="achievement-check">✓</div>' : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // ================================================================================
    // LEVEL SYSTEM
    // ================================================================================

    loadLevel() {
        const stored = localStorage.getItem('sim_level');
        return stored ? JSON.parse(stored) : { level: 1, points: 0 };
    }

    saveLevel() {
        localStorage.setItem('sim_level', JSON.stringify(this.level));
    }

    addPoints(points) {
        const oldLevel = this.getCurrentLevel();
        this.level.points += points;
        const newLevel = this.getCurrentLevel();

        if (newLevel.level > oldLevel.level) {
            this.showLevelUp(newLevel);
        }

        this.saveLevel();
        this.updateLevelDisplay();
    }

    getCurrentLevel() {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (this.level.points >= LEVELS[i].minPoints) {
                return LEVELS[i];
            }
        }
        return LEVELS[0];
    }

    getNextLevel() {
        const current = this.getCurrentLevel();
        const currentIndex = LEVELS.findIndex(l => l.level === current.level);
        return LEVELS[currentIndex + 1] || null;
    }

    showLevelUp(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">${newLevel.icon}</div>
                <h2>🎉 Seviye Atladın!</h2>
                <p class="level-name">${newLevel.name}</p>
                <p class="level-number">Seviye ${newLevel.level}</p>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    updateLevelDisplay() {
        const current = this.getCurrentLevel();
        const next = this.getNextLevel();

        const levelEl = document.getElementById('currentLevel');
        const levelNameEl = document.getElementById('levelName');
        const levelProgressEl = document.getElementById('levelProgress');
        const levelPointsEl = document.getElementById('levelPoints');

        if (levelEl) levelEl.textContent = `${current.icon} Seviye ${current.level}`;
        if (levelNameEl) levelNameEl.textContent = current.name;

        if (next && levelProgressEl) {
            const progress = ((this.level.points - current.minPoints) / (next.minPoints - current.minPoints)) * 100;
            levelProgressEl.style.width = Math.min(progress, 100) + '%';
        }

        if (next && levelPointsEl) {
            levelPointsEl.textContent = `${this.level.points} / ${next.minPoints} XP`;
        }
    }

    // ================================================================================
    // DAILY CHALLENGES
    // ================================================================================

    loadDailyChallenges() {
        const stored = localStorage.getItem('sim_daily_challenges');
        if (!stored) return this.generateDailyChallenges();

        const data = JSON.parse(stored);
        // Check if challenges are from today
        const today = new Date().toDateString();
        if (data.date !== today) {
            return this.generateDailyChallenges();
        }

        return data.challenges;
    }

    saveDailyChallenges() {
        localStorage.setItem('sim_daily_challenges', JSON.stringify({
            date: new Date().toDateString(),
            challenges: this.dailyChallenges
        }));
    }

    generateDailyChallenges() {
        // Rastgele 3 görev seç
        const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3).map(challenge => ({
            ...challenge,
            completed: false,
            progress: 0
        }));
    }

    checkDailyReset() {
        const lastReset = localStorage.getItem('sim_last_daily_reset');
        const today = new Date().toDateString();

        if (lastReset !== today) {
            this.dailyChallenges = this.generateDailyChallenges();
            this.saveDailyChallenges();
            localStorage.setItem('sim_last_daily_reset', today);
        }
    }

    completeChallenge(challengeId) {
        const challenge = this.dailyChallenges.find(c => c.id === challengeId);
        if (!challenge || challenge.completed) return;

        challenge.completed = true;
        this.addPoints(challenge.points);
        this.saveDailyChallenges();
        this.renderChallenges();

        this.showNotification(`✅ Görev Tamamlandı: ${challenge.name} (+${challenge.points} XP)`, 'success');
    }

    renderChallenges() {
        const container = document.getElementById('dailyChallengesContainer');
        if (!container) return;

        const html = this.dailyChallenges.map(challenge => `
            <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-icon">${challenge.icon}</div>
                <div class="challenge-info">
                    <h4>${challenge.name}</h4>
                    <p>${challenge.description}</p>
                    <span class="challenge-points">+${challenge.points} XP</span>
                </div>
                ${challenge.completed ? '<div class="challenge-check">✓</div>' : ''}
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // ================================================================================
    // SMART FEEDBACK & TIPS
    // ================================================================================

    analyzeTrade(tradeData) {
        const feedback = [];

        // İşlem büyüklüğü kontrolü
        if (tradeData.amount > tradeData.totalBalance * 0.2) {
            const percent = Math.round((tradeData.amount / tradeData.totalBalance) * 100);
            feedback.push({
                type: 'warning',
                message: `⚠️ Bu işlem portföyünüzün %${percent}'i. Risk yönetimi için max %10 önerilir.`
            });
        }

        // Çeşitlendirme kontrolü
        if (tradeData.portfolioSize < 3 && tradeData.action === 'buy') {
            feedback.push({
                type: 'tip',
                message: '💡 İpucu: Riski azaltmak için 5-10 farklı hisse ile portföy oluşturun.'
            });
        }

        // Fiyat kontrolü
        if (tradeData.action === 'buy' && tradeData.currentPrice > tradeData.avgMarketPrice * 1.15) {
            feedback.push({
                type: 'warning',
                message: '⚠️ Bu hisse piyasa ortalamasından %15+ pahalı. Limit order düşünün.'
            });
        }

        return feedback;
    }

    analyzeResult(resultData) {
        const feedback = [];

        if (resultData.profitPercent > 15) {
            feedback.push({
                type: 'success',
                message: `🎉 Harika! %${resultData.profitPercent.toFixed(2)} kâr ettiniz. Mükemmel zamanlama!`
            });
        } else if (resultData.profitPercent > 0) {
            feedback.push({
                type: 'success',
                message: `✅ Tebrikler! %${resultData.profitPercent.toFixed(2)} kâr. Küçük kazançlar birikiyor.`
            });
        } else if (resultData.profitPercent < -10) {
            feedback.push({
                type: 'info',
                message: `📚 %${Math.abs(resultData.profitPercent).toFixed(2)} zarar. Her kayıp bir öğrenme fırsatı! Stop loss kullanmayı unutmayın.`
            });
        }

        // Hızlı satış kontrolü
        if (resultData.holdingDays < 1 && resultData.profitPercent < -5) {
            feedback.push({
                type: 'warning',
                message: '⚠️ Panik satış mı? Günlük dalgalanmalar normaldir. Uzun vadeli düşünün!'
            });
        }

        return feedback;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `smart-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // ================================================================================
    // STATS TRACKING
    // ================================================================================

    loadStats() {
        const stored = localStorage.getItem('sim_gamification_stats');
        return stored ? JSON.parse(stored) : {
            totalTrades: 0,
            totalProfitPercent: 0,
            winStreak: 0,
            maxWinStreak: 0,
            lastTradeDate: null,
            consecutiveDays: 0
        };
    }

    saveStats() {
        localStorage.setItem('sim_gamification_stats', JSON.stringify(this.stats));
    }

    updateStats(transaction) {
        this.stats.totalTrades++;

        // Win streak
        if (transaction.realizedPL > 0) {
            this.stats.winStreak++;
            this.stats.maxWinStreak = Math.max(this.stats.winStreak, this.stats.maxWinStreak);
        } else if (transaction.realizedPL < 0) {
            this.stats.winStreak = 0;
        }

        // Consecutive days
        const today = new Date().toDateString();
        if (this.stats.lastTradeDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (this.stats.lastTradeDate === yesterday) {
                this.stats.consecutiveDays++;

                // 7 günlük seri başarımı
                if (this.stats.consecutiveDays >= 7) {
                    this.unlockAchievement('streak_7');
                }
            } else {
                this.stats.consecutiveDays = 1;
            }
            this.stats.lastTradeDate = today;
        }

        this.saveStats();
    }
}

// ================================================================================
// EXPORT & INITIALIZATION
// ================================================================================

let gamificationManager;

function initGamification() {
    gamificationManager = new GamificationManager();
    window.gamificationManager = gamificationManager;
    console.log('🎮 Gamification ready!');
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGamification);
} else {
    initGamification();
}

export { GamificationManager, ACHIEVEMENTS, LEVELS, DAILY_CHALLENGES };
