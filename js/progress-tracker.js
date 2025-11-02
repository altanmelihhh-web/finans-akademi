/**
 * ═════════════════════════════════════════════════════════════
 * EDUCATION PROGRESS TRACKER
 * ═════════════════════════════════════════════════════════════
 *
 * Tracks user progress through the 49-day curriculum:
 * - Day completion status
 * - Quiz scores
 * - Time spent per day
 * - Overall statistics
 *
 * Syncs with Firebase Firestore for multi-device access
 */

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class ProgressTracker {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.progressData = {
            daysCompleted: {}, // { day1: { completed: true, completedAt: timestamp }, ... }
            quizScores: {},     // { day1: { score: 80, totalQuestions: 10, date: timestamp }, ... }
            totalDaysCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            avgQuizScore: 0,
            totalTimeSpent: 0,  // in minutes
            lastActive: null,
            startedAt: null
        };

        this.init();
    }

    /**
     * Initialize progress tracker
     */
    async init() {
        try {
            // Wait for Firebase to be initialized
            await this.waitForFirebase();

            // Load progress from localStorage first (instant)
            this.loadFromLocalStorage();

            // If user is logged in, sync with Firestore
            if (this.currentUser) {
                await this.loadFromFirestore();
            }

            // Setup UI listeners
            this.setupEventListeners();

            console.log('✅ Progress Tracker initialized');
        } catch (error) {
            console.error('❌ Progress Tracker init error:', error);
        }
    }

    /**
     * Wait for Firebase to be ready
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.getCurrentUser) {
                    this.currentUser = window.getCurrentUser();
                    if (typeof getFirestore === 'function') {
                        try {
                            this.db = getFirestore();
                            resolve();
                        } catch (error) {
                            console.log('⏳ Waiting for Firebase initialization...');
                            setTimeout(checkFirebase, 500);
                        }
                    } else {
                        setTimeout(checkFirebase, 500);
                    }
                } else {
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        });
    }

    /**
     * Load progress from localStorage
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('educationProgress');
            if (stored) {
                this.progressData = JSON.parse(stored);
                console.log('📚 Progress loaded from localStorage');
            }
        } catch (error) {
            console.error('❌ Error loading progress from localStorage:', error);
        }
    }

    /**
     * Save progress to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('educationProgress', JSON.stringify(this.progressData));
        } catch (error) {
            console.error('❌ Error saving progress to localStorage:', error);
        }
    }

    /**
     * Load progress from Firestore
     */
    async loadFromFirestore() {
        if (!this.db || !this.currentUser) return;

        try {
            const progressRef = doc(this.db, 'users', this.currentUser.uid);
            const progressDoc = await getDoc(progressRef);

            if (progressDoc.exists()) {
                const data = progressDoc.data();

                // Merge with localStorage (Firestore is source of truth)
                if (data.progress) {
                    this.progressData = { ...this.progressData, ...data.progress };
                    this.saveToLocalStorage();
                    console.log('✅ Progress loaded from Firestore');
                }
            } else {
                // First time user - initialize Firestore
                await this.saveToFirestore();
            }
        } catch (error) {
            console.error('❌ Error loading progress from Firestore:', error);
        }
    }

    /**
     * Save progress to Firestore
     */
    async saveToFirestore() {
        if (!this.db || !this.currentUser) {
            console.log('ℹ️ Not logged in, progress saved to localStorage only');
            return;
        }

        try {
            const progressRef = doc(this.db, 'users', this.currentUser.uid);

            await updateDoc(progressRef, {
                progress: this.progressData,
                lastUpdated: serverTimestamp()
            }).catch(async (error) => {
                // If document doesn't exist, create it
                if (error.code === 'not-found') {
                    await setDoc(progressRef, {
                        progress: this.progressData,
                        createdAt: serverTimestamp(),
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                }
            });

            console.log('✅ Progress saved to Firestore');
        } catch (error) {
            console.error('❌ Error saving progress to Firestore:', error);
        }
    }

    /**
     * Setup event listeners for day checkboxes
     */
    setupEventListeners() {
        // Listen for day checkbox changes
        document.querySelectorAll('.day-checkbox').forEach(checkbox => {
            const dayNumber = checkbox.id.replace('day', '');

            // Restore checked state from progress data
            if (this.progressData.daysCompleted[`day${dayNumber}`]?.completed) {
                checkbox.checked = true;
            }

            // Listen for changes
            checkbox.addEventListener('change', (e) => {
                this.handleDayCompletion(dayNumber, e.target.checked);
            });
        });

        console.log('✅ Progress event listeners setup');
    }

    /**
     * Handle day completion
     */
    async handleDayCompletion(dayNumber, isCompleted) {
        const dayKey = `day${dayNumber}`;

        if (isCompleted) {
            // Mark as completed
            this.progressData.daysCompleted[dayKey] = {
                completed: true,
                completedAt: Date.now()
            };

            // Update stats
            this.progressData.totalDaysCompleted = Object.keys(this.progressData.daysCompleted).filter(
                k => this.progressData.daysCompleted[k].completed
            ).length;

            // Update streak
            this.updateStreak();

            // Set start date if not set
            if (!this.progressData.startedAt) {
                this.progressData.startedAt = Date.now();
            }

            console.log(`✅ Day ${dayNumber} completed!`);
            this.showCompletionToast(dayNumber);
        } else {
            // Unmark completion
            if (this.progressData.daysCompleted[dayKey]) {
                delete this.progressData.daysCompleted[dayKey];
                this.progressData.totalDaysCompleted = Math.max(0, this.progressData.totalDaysCompleted - 1);
            }
        }

        this.progressData.lastActive = Date.now();

        // Save to both localStorage and Firestore
        this.saveToLocalStorage();
        await this.saveToFirestore();

        // Update UI
        this.updateProgressUI();
    }

    /**
     * Record quiz score
     */
    async recordQuizScore(dayNumber, score, totalQuestions) {
        const dayKey = `day${dayNumber}`;

        this.progressData.quizScores[dayKey] = {
            score: score,
            totalQuestions: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            date: Date.now()
        };

        // Recalculate average quiz score
        const scores = Object.values(this.progressData.quizScores);
        if (scores.length > 0) {
            const totalPercentage = scores.reduce((sum, s) => sum + s.percentage, 0);
            this.progressData.avgQuizScore = Math.round(totalPercentage / scores.length);
        }

        console.log(`📝 Quiz score recorded for Day ${dayNumber}: ${score}/${totalQuestions} (${this.progressData.quizScores[dayKey].percentage}%)`);

        // Save
        this.saveToLocalStorage();
        await this.saveToFirestore();

        // Update UI
        this.updateProgressUI();
    }

    /**
     * Update streak calculation
     */
    updateStreak() {
        const completedDays = Object.keys(this.progressData.daysCompleted)
            .filter(k => this.progressData.daysCompleted[k].completed)
            .map(k => parseInt(k.replace('day', '')))
            .sort((a, b) => a - b);

        if (completedDays.length === 0) {
            this.progressData.currentStreak = 0;
            return;
        }

        let currentStreak = 1;
        let longestStreak = 1;
        let tempStreak = 1;

        for (let i = 1; i < completedDays.length; i++) {
            if (completedDays[i] === completedDays[i - 1] + 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        // Current streak is the streak ending at the last completed day
        let lastDay = completedDays[completedDays.length - 1];
        for (let i = completedDays.length - 1; i >= 0; i--) {
            if (completedDays[i] === lastDay) {
                currentStreak++;
                lastDay--;
            } else {
                break;
            }
        }

        this.progressData.currentStreak = currentStreak - 1;
        this.progressData.longestStreak = Math.max(longestStreak, this.progressData.longestStreak);
    }

    /**
     * Update progress UI in dashboard/profile
     */
    updateProgressUI() {
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const percentage = Math.round((this.progressData.totalDaysCompleted / 49) * 100);
            progressBar.style.width = percentage + '%';
            progressBar.textContent = `${percentage}%`;
        }

        // Update stats
        const totalDaysEl = document.getElementById('totalDaysCompleted');
        if (totalDaysEl) {
            totalDaysEl.textContent = this.progressData.totalDaysCompleted;
        }

        const streakEl = document.getElementById('currentStreak');
        if (streakEl) {
            streakEl.textContent = this.progressData.currentStreak;
        }

        const avgQuizEl = document.getElementById('avgQuizScore');
        if (avgQuizEl) {
            avgQuizEl.textContent = this.progressData.avgQuizScore + '%';
        }
    }

    /**
     * Show completion toast notification
     */
    showCompletionToast(dayNumber) {
        const toast = document.createElement('div');
        toast.className = 'completion-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Gün ${dayNumber} tamamlandı! 🎉</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Get progress summary for leaderboard
     */
    getProgressSummary() {
        return {
            totalDaysCompleted: this.progressData.totalDaysCompleted,
            avgQuizScore: this.progressData.avgQuizScore,
            currentStreak: this.progressData.currentStreak,
            longestStreak: this.progressData.longestStreak,
            completionPercentage: Math.round((this.progressData.totalDaysCompleted / 49) * 100)
        };
    }

    /**
     * Export progress data
     */
    exportProgress() {
        return {
            ...this.progressData,
            exportedAt: Date.now()
        };
    }

    /**
     * Reset all progress (with confirmation)
     */
    async resetProgress() {
        if (!confirm('Tüm ilerlemenizi sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }

        this.progressData = {
            daysCompleted: {},
            quizScores: {},
            totalDaysCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            avgQuizScore: 0,
            totalTimeSpent: 0,
            lastActive: null,
            startedAt: null
        };

        // Clear checkboxes
        document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);

        // Save
        this.saveToLocalStorage();
        await this.saveToFirestore();

        // Update UI
        this.updateProgressUI();

        console.log('🔄 Progress reset complete');
        alert('İlerlemeniz sıfırlandı.');
    }
}

// Initialize and export
let progressTracker;

function initProgressTracker() {
    progressTracker = new ProgressTracker();
    window.progressTracker = progressTracker;
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgressTracker);
} else {
    initProgressTracker();
}

export { ProgressTracker };
