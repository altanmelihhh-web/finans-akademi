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
            console.log('✅ User data loaded from Firestore');

            // Restore data to localStorage and app state
            if (userData.watchlist) {
                localStorage.setItem('watchlist', JSON.stringify(userData.watchlist));
            }
            if (userData.portfolio) {
                localStorage.setItem('portfolio', JSON.stringify(userData.portfolio));
            }
            if (userData.transactions) {
                localStorage.setItem('transactions', JSON.stringify(userData.transactions));
            }
            if (userData.cash !== undefined) {
                localStorage.setItem('simulatorCash', userData.cash.toString());
            }

            // Trigger UI updates
            if (window.simulator) {
                window.simulator.loadFromStorage();
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
            watchlist: [],
            portfolio: [],
            transactions: [],
            cash: 10000,
            lastUpdated: serverTimestamp()
        });
        console.log('✅ User document created');
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

        const userData = {
            watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
            portfolio: JSON.parse(localStorage.getItem('portfolio') || '[]'),
            transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
            cash: parseFloat(localStorage.getItem('simulatorCash') || '10000'),
            lastUpdated: serverTimestamp()
        };

        await updateDoc(userDocRef, userData);
        console.log('✅ User data saved to Firestore');
    } catch (error) {
        console.error('❌ Error saving user data:', error);
    }
}

// Migrate localStorage data to Firestore when user logs in
async function migrateLocalStorageToFirestore(userId) {
    if (!db) return;

    try {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const portfolio = JSON.parse(localStorage.getItem('portfolio') || '[]');
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const cash = parseFloat(localStorage.getItem('simulatorCash') || '10000');

        // Check if user has data in Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User exists, merge data
            const existingData = userDoc.data();
            await updateDoc(userDocRef, {
                watchlist: [...new Set([...existingData.watchlist, ...watchlist])],
                portfolio: mergePortfolios(existingData.portfolio, portfolio),
                transactions: [...existingData.transactions, ...transactions],
                cash: cash, // Use local cash if higher?
                lastUpdated: serverTimestamp()
            });
            console.log('✅ Data merged to Firestore');
        } else {
            // New user, create document
            await setDoc(userDocRef, {
                createdAt: serverTimestamp(),
                watchlist,
                portfolio,
                transactions,
                cash,
                lastUpdated: serverTimestamp()
            });
            console.log('✅ Data migrated to Firestore');
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
    if (window.simulator) {
        window.simulator.loadFromStorage();
    }
}

// Auto-save to Firestore when localStorage changes
function setupAutoSave() {
    // Override localStorage.setItem to auto-save
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);

        // Auto-save to Firestore for specific keys
        if (['watchlist', 'portfolio', 'transactions', 'simulatorCash'].includes(key)) {
            // Debounce to avoid too many writes
            clearTimeout(window.firestoreSaveTimeout);
            window.firestoreSaveTimeout = setTimeout(() => {
                saveUserDataToFirestore();
            }, 1000); // Save after 1 second of inactivity
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
