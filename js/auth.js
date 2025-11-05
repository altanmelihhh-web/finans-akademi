// Firebase Authentication and Database Management
// This file handles user authentication and Firestore database operations

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase (config will be loaded from firebase-config.js)
let app, auth, db, provider;
let currentUser = null;

// Initialize Firebase services
function initFirebase() {
    try {
        // Check if firebaseConfig is defined (from firebase-config.js)
        if (typeof firebaseConfig === 'undefined') {
            console.error('Firebase config not found. Please create js/firebase-config.js from template.');
            showLocalStorageMode();
            return false;
        }

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        provider = new GoogleAuthProvider();

        // Listen for auth state changes
        onAuthStateChanged(auth, handleAuthStateChange);

        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        showLocalStorageMode();
        return false;
    }
}

// Handle authentication state changes
function handleAuthStateChange(user) {
    currentUser = user;

    if (user) {
        console.log('✅ User logged in:', user.email);
        showUserProfile(user);
        loadUserDataFromFirestore(user.uid);
    } else {
        console.log('👤 No user logged in');
        showLoginButton();
        loadUserDataFromLocalStorage();
    }
}

// Show user profile in UI
function showUserProfile(user) {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <div class="user-profile">
            <img src="${user.photoURL || '/images/default-avatar.png'}" alt="Profile" class="profile-photo">
            <div class="user-info">
                <span class="user-name">${user.displayName || 'User'}</span>
                <span class="user-email">${user.email}</span>
            </div>
            <button id="logoutBtn" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i> Çıkış
            </button>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// Show login button
function showLoginButton() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <button id="loginBtn" class="login-btn">
            <i class="fas fa-sign-in-alt"></i> Giriş Yap
        </button>
    `;

    document.getElementById('loginBtn').addEventListener('click', showEmailLoginModal);
}

// Show localStorage mode notification
function showLocalStorageMode() {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <div class="local-mode-notice">
            <i class="fas fa-info-circle"></i>
            <span>Yerel modda çalışıyorsunuz. Verileriniz tarayıcıda saklanıyor.</span>
        </div>
    `;
}

// Show email login modal
function showEmailLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.id = 'authModal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Giriş Yap / Kayıt Ol</h2>

            <button onclick="handleGoogleLogin()" class="google-login-btn">
                <i class="fab fa-google"></i> Google ile devam et
            </button>

            <div class="auth-divider">
                <span>veya</span>
            </div>

            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Email ile Giriş</button>
                <button class="auth-tab" data-tab="register">Kayıt Ol</button>
            </div>

            <div id="loginForm" class="auth-form active">
                <input type="email" id="loginEmail" placeholder="Email" required>
                <input type="password" id="loginPassword" placeholder="Şifre" required>
                <button onclick="handleEmailLogin()" class="submit-btn">Giriş Yap</button>
            </div>

            <div id="registerForm" class="auth-form">
                <input type="text" id="registerName" placeholder="Ad Soyad" required>
                <input type="email" id="registerEmail" placeholder="Email" required>
                <input type="password" id="registerPassword" placeholder="Şifre (min 6 karakter)" required>
                <button onclick="handleEmailRegister()" class="submit-btn">Kayıt Ol</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetTab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
        });
    });
}

// Handle Google login
async function handleGoogleLogin() {
    if (!auth) {
        alert('Firebase yapılandırılmamış. Lütfen firebase-config.js dosyasını oluşturun.');
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('✅ Google login successful:', user.email);

        // Close modal if exists
        const modal = document.getElementById('authModal');
        if (modal) modal.remove();

        // Migrate localStorage data to Firestore
        await migrateLocalStorageToFirestore(user.uid);
    } catch (error) {
        console.error('❌ Google login error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            alert('Giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
        } else {
            alert('Giriş yapılamadı: ' + error.message);
        }
    }
}

// Handle email/password login
async function handleEmailLogin() {
    if (!auth) {
        alert('Firebase yapılandırılmamış.');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Lütfen email ve şifrenizi girin.');
        return;
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        console.log('✅ Email login successful:', user.email);

        // Close modal
        document.getElementById('authModal').remove();

        // Migrate localStorage data to Firestore
        await migrateLocalStorageToFirestore(user.uid);
    } catch (error) {
        console.error('❌ Email login error:', error);
        if (error.code === 'auth/user-not-found') {
            alert('Kullanıcı bulunamadı. Lütfen kayıt olun.');
        } else if (error.code === 'auth/wrong-password') {
            alert('Yanlış şifre.');
        } else {
            alert('Giriş yapılamadı: ' + error.message);
        }
    }
}

// Handle email/password registration
async function handleEmailRegister() {
    if (!auth) {
        alert('Firebase yapılandırılmamış.');
        return;
    }

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }

    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır.');
        return;
    }

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Update profile with name
        await updateProfile(user, {
            displayName: name
        });

        console.log('✅ Registration successful:', user.email);

        // Close modal
        document.getElementById('authModal').remove();

        // Create user document in Firestore
        await createUserDocument(user.uid);
    } catch (error) {
        console.error('❌ Registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
            alert('Bu email zaten kullanımda. Giriş yapmayı deneyin.');
        } else if (error.code === 'auth/invalid-email') {
            alert('Geçersiz email adresi.');
        } else if (error.code === 'auth/weak-password') {
            alert('Şifre çok zayıf. Daha güçlü bir şifre seçin.');
        } else {
            alert('Kayıt olunamadı: ' + error.message);
        }
    }
}

// Make functions globally available
window.handleGoogleLogin = handleGoogleLogin;
window.handleEmailLogin = handleEmailLogin;
window.handleEmailRegister = handleEmailRegister;

// Handle logout
async function handleLogout() {
    if (!auth) return;

    try {
        await signOut(auth);
        console.log('✅ Logout successful');
        // Clear local data
        localStorage.clear();
        // Reload page
        window.location.reload();
    } catch (error) {
        console.error('❌ Logout error:', error);
        alert('Çıkış yapılamadı: ' + error.message);
    }
}

// Load user data from Firestore
async function loadUserDataFromFirestore(userId) {
    if (!db) return;

    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ User data loaded from Firestore:', userData);

            // Restore SIMULATOR data to localStorage
            if (userData.sim_accounts) {
                localStorage.setItem('sim_accounts', JSON.stringify(userData.sim_accounts));
            }
            if (userData.sim_portfolio) {
                localStorage.setItem('sim_portfolio', JSON.stringify(userData.sim_portfolio));
            }
            if (userData.sim_history) {
                localStorage.setItem('sim_history', JSON.stringify(userData.sim_history));
            }
            if (userData.sim_pending_orders) {
                localStorage.setItem('sim_pending_orders', JSON.stringify(userData.sim_pending_orders));
            }
            if (userData.sim_performance) {
                localStorage.setItem('sim_performance', JSON.stringify(userData.sim_performance));
            }
            if (userData.sim_settings) {
                localStorage.setItem('sim_settings', JSON.stringify(userData.sim_settings));
            }

            // Also restore old keys for backwards compatibility
            if (userData.watchlist) {
                localStorage.setItem('watchlist', JSON.stringify(userData.watchlist));
            }
            if (userData.progress) {
                localStorage.setItem('educationProgress', JSON.stringify(userData.progress));
            }

            // Trigger UI updates - reload simulator completely
            console.log('🔄 Reloading simulator with user data...');
            if (window.simulator && typeof window.simulator.updateUI === 'function') {
                // Force reload all managers from localStorage
                if (window.simulator.accountManager) {
                    window.simulator.accountManager.accounts = window.simulator.accountManager.loadAccounts();
                }
                if (window.simulator.portfolioManager) {
                    window.simulator.portfolioManager.holdings = window.simulator.portfolioManager.loadPortfolio();
                }
                if (window.simulator.historyManager) {
                    window.simulator.historyManager.transactions = window.simulator.historyManager.loadHistory();
                }
                if (window.simulator.performanceTracker) {
                    window.simulator.performanceTracker.records = window.simulator.performanceTracker.loadPerformance();
                }
                // Update the UI
                window.simulator.updateUI();
                console.log('✅ Simulator reloaded with user data');
            }
            if (window.progressTracker && typeof window.progressTracker.loadFromLocalStorage === 'function') {
                window.progressTracker.loadFromLocalStorage();
            }
        } else {
            console.log('📝 Creating new user document');
            await createUserDocument(userId);
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
    }
}

// Create new user document in Firestore
async function createUserDocument(userId) {
    if (!db) return;

    try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
            createdAt: serverTimestamp(),
            // Simulator data (new keys)
            sim_accounts: {
                USD: { balance: 10000, currency: 'USD', symbol: '$', initialBalance: 10000 },
                TRY: { balance: 300000, currency: 'TRY', symbol: '₺', initialBalance: 300000 }
            },
            sim_portfolio: [],
            sim_history: [],
            sim_pending_orders: [],
            sim_performance: [],
            sim_settings: {},
            // Old keys for backwards compatibility
            watchlist: [],
            progress: {
                daysCompleted: {},
                quizScores: {},
                totalDaysCompleted: 0,
                currentStreak: 0,
                longestStreak: 0,
                avgQuizScore: 0,
                totalTimeSpent: 0,
                lastActive: null,
                startedAt: null
            },
            lastUpdated: serverTimestamp()
        });
        console.log('✅ User document created with simulator data');
    } catch (error) {
        console.error('❌ Error creating user document:', error);
    }
}

// Save user data to Firestore
async function saveUserDataToFirestore() {
    if (!db || !currentUser) {
        console.log('ℹ️ No user logged in, data saved to localStorage only');
        return;
    }

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Collect SIMULATOR data from localStorage
        const userData = {
            // Simulator data (new keys)
            sim_accounts: JSON.parse(localStorage.getItem('sim_accounts') || 'null'),
            sim_portfolio: JSON.parse(localStorage.getItem('sim_portfolio') || '[]'),
            sim_history: JSON.parse(localStorage.getItem('sim_history') || '[]'),
            sim_pending_orders: JSON.parse(localStorage.getItem('sim_pending_orders') || '[]'),
            sim_performance: JSON.parse(localStorage.getItem('sim_performance') || '[]'),
            sim_settings: JSON.parse(localStorage.getItem('sim_settings') || '{}'),
            // Old keys for backwards compatibility
            watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
            progress: JSON.parse(localStorage.getItem('educationProgress') || '{}'),
            lastUpdated: serverTimestamp()
        };

        // Remove null values
        Object.keys(userData).forEach(key => {
            if (userData[key] === null) {
                delete userData[key];
            }
        });

        await updateDoc(userDocRef, userData);
        console.log('✅ Simulator data saved to Firestore:', userData);
    } catch (error) {
        console.error('❌ Error saving user data:', error);
        // If document doesn't exist, create it
        if (error.code === 'not-found') {
            console.log('📝 Creating new user document...');
            await createUserDocument(currentUser.uid);
            // Retry save
            await saveUserDataToFirestore();
        }
    }
}

// Migrate localStorage data to Firestore when user logs in
async function migrateLocalStorageToFirestore(userId) {
    if (!db) return;

    try {
        // Get SIMULATOR data from localStorage
        const sim_accounts = JSON.parse(localStorage.getItem('sim_accounts') || 'null');
        const sim_portfolio = JSON.parse(localStorage.getItem('sim_portfolio') || '[]');
        const sim_history = JSON.parse(localStorage.getItem('sim_history') || '[]');
        const sim_pending_orders = JSON.parse(localStorage.getItem('sim_pending_orders') || '[]');
        const sim_performance = JSON.parse(localStorage.getItem('sim_performance') || '[]');
        const sim_settings = JSON.parse(localStorage.getItem('sim_settings') || '{}');

        // Get old data for backwards compatibility
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const progress = JSON.parse(localStorage.getItem('educationProgress') || '{}');

        // Check if user has data in Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User exists - decide whether to keep cloud data or local data
            let existingData = userDoc.data();

            // ⚡ MIGRATION: Convert old data format to new format
            const needsMigration = existingData.portfolio || existingData.transactions || existingData.cash;
            if (needsMigration) {
                console.log('🔄 Migrating old Firestore data to new format...');

                const migratedData = {
                    sim_accounts: existingData.sim_accounts || {
                        USD: {
                            balance: parseFloat(existingData.cash || 10000),
                            currency: 'USD',
                            symbol: '$',
                            initialBalance: 10000
                        },
                        TRY: {
                            balance: 300000,
                            currency: 'TRY',
                            symbol: '₺',
                            initialBalance: 300000
                        }
                    },
                    sim_portfolio: existingData.portfolio || [],
                    sim_history: existingData.transactions || [],
                    sim_pending_orders: [],
                    sim_performance: [],
                    sim_settings: {},
                    watchlist: existingData.watchlist || [],
                    progress: existingData.progress || {},
                    lastUpdated: serverTimestamp()
                };

                // Update Firebase with new format
                await updateDoc(userDocRef, migratedData);
                console.log('✅ Migration complete - old data converted to new format');

                // Update local reference
                existingData = migratedData;
            }

            console.log('🔄 User exists in Firestore. Checking data...');
            console.log('  - Cloud portfolio items:', existingData.sim_portfolio?.length || 0);
            console.log('  - Local portfolio items:', sim_portfolio.length);
            console.log('  - Cloud history items:', existingData.sim_history?.length || 0);
            console.log('  - Local history items:', sim_history.length);

            // If local data exists and has more items, ask user or merge
            const hasLocalData = sim_portfolio.length > 0 || sim_history.length > 0;
            const hasCloudData = (existingData.sim_portfolio?.length || 0) > 0 || (existingData.sim_history?.length || 0) > 0;

            if (hasLocalData && hasCloudData) {
                console.log('⚠️ Both local and cloud data exist. Keeping cloud data and discarding local.');
                // Keep cloud data - reload it to localStorage
                await loadUserDataFromFirestore(userId);
            } else if (hasLocalData && !hasCloudData) {
                // Upload local data to cloud
                console.log('📤 Uploading local data to cloud...');
                await updateDoc(userDocRef, {
                    sim_accounts: sim_accounts || existingData.sim_accounts,
                    sim_portfolio: sim_portfolio,
                    sim_history: sim_history,
                    sim_pending_orders: sim_pending_orders,
                    sim_performance: sim_performance,
                    sim_settings: sim_settings,
                    watchlist: watchlist,
                    progress: progress,
                    lastUpdated: serverTimestamp()
                });
                console.log('✅ Local data uploaded to Firestore');
            } else {
                // No local data, keep cloud data
                console.log('📥 No local data, loading from cloud...');
                await loadUserDataFromFirestore(userId);
            }
        } else {
            // New user, create document with local data
            console.log('📝 New user, creating document with local data...');
            await setDoc(userDocRef, {
                createdAt: serverTimestamp(),
                sim_accounts: sim_accounts || {
                    USD: { balance: 10000, currency: 'USD', symbol: '$', initialBalance: 10000 },
                    TRY: { balance: 300000, currency: 'TRY', symbol: '₺', initialBalance: 300000 }
                },
                sim_portfolio: sim_portfolio,
                sim_history: sim_history,
                sim_pending_orders: sim_pending_orders,
                sim_performance: sim_performance,
                sim_settings: sim_settings,
                watchlist: watchlist,
                progress: progress,
                lastUpdated: serverTimestamp()
            });
            console.log('✅ New user document created with local data');
        }
    } catch (error) {
        console.error('❌ Error migrating data:', error);
    }
}

// Merge two portfolios
function mergePortfolios(existing, local) {
    const merged = [...existing];

    local.forEach(localStock => {
        const existingIndex = merged.findIndex(s => s.symbol === localStock.symbol);
        if (existingIndex >= 0) {
            // Merge quantities
            merged[existingIndex].quantity += localStock.quantity;
        } else {
            merged.push(localStock);
        }
    });

    return merged;
}

// Load user data from localStorage (fallback)
function loadUserDataFromLocalStorage() {
    console.log('ℹ️ Loading data from localStorage');
    if (window.simulator && typeof window.simulator.loadFromStorage === 'function') {
        window.simulator.loadFromStorage();
    }
}

// Auto-save to Firestore when localStorage changes
function setupAutoSave() {
    // Override localStorage.setItem to auto-save
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);

        // Auto-save to Firestore for SIMULATOR keys
        const simulatorKeys = [
            'sim_accounts',
            'sim_portfolio',
            'sim_history',
            'sim_pending_orders',
            'sim_performance',
            'sim_settings',
            'watchlist',
            'educationProgress'
        ];

        if (simulatorKeys.includes(key)) {
            // Debounce to avoid too many writes
            clearTimeout(window.firestoreSaveTimeout);
            window.firestoreSaveTimeout = setTimeout(() => {
                console.log('💾 Auto-saving to Firestore after', key, 'changed');
                saveUserDataToFirestore();
            }, 2000); // Save after 2 seconds of inactivity
        }
    };
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const initialized = initFirebase();
    if (initialized) {
        setupAutoSave();
    }
});

// Export functions for use in other files
window.saveUserDataToFirestore = saveUserDataToFirestore;
window.getCurrentUser = () => currentUser;
