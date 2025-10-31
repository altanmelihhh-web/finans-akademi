// Theme Manager - Handle theme switching and persistence

const themes = [
    { id: 'dark-blue', name: 'Koyu Mavi (Varsayılan)', icon: '🌙' },
    { id: 'light', name: 'Açık Tema', icon: '☀️' },
    { id: 'dark-oled', name: 'Saf Siyah (OLED)', icon: '⬛' },
    { id: 'dark-purple', name: 'Mor Gece', icon: '💜' },
    { id: 'dark-green', name: 'Yeşil Orman', icon: '🌲' },
    { id: 'dark-sunset', name: 'Gün Batımı', icon: '🌅' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌆' },
    { id: 'nord', name: 'Nord (Soğuk Mavi)', icon: '🧊' },
    { id: 'dracula', name: 'Dracula', icon: '🧛' }
];

class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupThemeSelector());
        } else {
            this.setupThemeSelector();
        }
    }

    loadTheme() {
        // Try to get from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }

        // Default theme
        return 'dark-blue';
    }

    saveTheme(themeId) {
        localStorage.setItem('theme', themeId);

        // Also save to Firebase if user is logged in
        if (window.getCurrentUser && window.getCurrentUser()) {
            this.saveThemeToFirebase(themeId);
        }
    }

    async saveThemeToFirebase(themeId) {
        try {
            // This will be called by Firebase module if available
            if (window.saveUserDataToFirestore) {
                localStorage.setItem('userTheme', themeId);
                await window.saveUserDataToFirestore();
            }
        } catch (error) {
            console.log('Theme saved locally only (Firebase not available)');
        }
    }

    applyTheme(themeId) {
        if (themeId === 'dark-blue') {
            // Remove data-theme attribute for default theme
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeId);
        }
        this.currentTheme = themeId;
    }

    changeTheme(themeId) {
        this.applyTheme(themeId);
        this.saveTheme(themeId);

        // Update active state in theme selector
        this.updateThemeSelectorUI();

        // Show toast notification
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
            this.showToast(`Tema değiştirildi: ${theme.name}`);
        }
    }

    setupThemeSelector() {
        // Check if theme button already exists
        if (document.getElementById('themeBtn')) return;

        // Add theme button to navbar
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) return;

        const themeBtn = document.createElement('button');
        themeBtn.id = 'themeBtn';
        themeBtn.className = 'theme-btn';
        themeBtn.innerHTML = '<i class="fas fa-palette"></i>';
        themeBtn.title = 'Tema Değiştir';

        // Insert before auth container
        authContainer.parentNode.insertBefore(themeBtn, authContainer);

        themeBtn.addEventListener('click', () => this.showThemeSelector());
    }

    showThemeSelector() {
        // Remove existing modal if any
        const existingModal = document.getElementById('themeModal');
        if (existingModal) {
            existingModal.remove();
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'theme-modal';
        modal.id = 'themeModal';

        const themesHTML = themes.map(theme => `
            <div class="theme-option ${theme.id === this.currentTheme ? 'active' : ''}"
                 data-theme="${theme.id}">
                <span class="theme-icon">${theme.icon}</span>
                <span class="theme-name">${theme.name}</span>
                ${theme.id === this.currentTheme ? '<i class="fas fa-check theme-check"></i>' : ''}
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="theme-modal-content">
                <div class="theme-modal-header">
                    <h3><i class="fas fa-palette"></i> Tema Seç</h3>
                    <span class="close-theme-modal">&times;</span>
                </div>
                <div class="theme-options">
                    ${themesHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.close-theme-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Theme selection handlers
        modal.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.changeTheme(themeId);
                modal.remove();
            });
        });
    }

    updateThemeSelectorUI() {
        const modal = document.getElementById('themeModal');
        if (!modal) return;

        modal.querySelectorAll('.theme-option').forEach(option => {
            const themeId = option.dataset.theme;
            if (themeId === this.currentTheme) {
                option.classList.add('active');
                if (!option.querySelector('.theme-check')) {
                    option.innerHTML += '<i class="fas fa-check theme-check"></i>';
                }
            } else {
                option.classList.remove('active');
                const check = option.querySelector('.theme-check');
                if (check) check.remove();
            }
        });
    }

    showToast(message) {
        // Remove existing toast
        const existingToast = document.getElementById('themeToast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'themeToast';
        toast.className = 'theme-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
window.themeManager = themeManager;
