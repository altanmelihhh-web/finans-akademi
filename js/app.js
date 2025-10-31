// ===================================
// Global Variables & Configuration
// ===================================

let marketChart = null;
let learningProgress = 0;

// Practice scenarios for interactive learning
const practiceScenarios = [
    {
        question: "Hisse senedi 100 TL'den 95 TL'ye düştü. RSI 28 seviyesinde. Ne yapmalısın?",
        correctAnswer: "buy",
        explanation: "RSI 30'un altında, aşırı satım bölgesinde. Bu genelde alım fırsatıdır. Ancak yine de diğer göstergeleri de kontrol et!"
    },
    {
        question: "MACD çizgisi sinyal çizgisini yukarı kesti. Fiyat MA 50'nin üstünde. Ne yapmalısın?",
        correctAnswer: "buy",
        explanation: "İki güçlü alım sinyali var: MACD yukarı kesişim ve fiyat MA 50 üstünde. Yükseliş trendi güçlü!"
    },
    {
        question: "Hisse senedi direnç seviyesine 3. kez geldi ama kıramadı. RSI 75. Ne yapmalısın?",
        correctAnswer: "sell",
        explanation: "Direnç kırılamadı ve RSI aşırı alım bölgesinde. Geri çekilme ihtimali yüksek, satış veya kar realizasyonu yapılabilir."
    },
    {
        question: "Piyasada yüksek volatilite var. Önemli bir haber bekleniyor. Ne yapmalısın?",
        correctAnswer: "wait",
        explanation: "Belirsizlik dönemlerinde en iyi strateji beklemektir. Haber açıklandıktan ve piyasa tepkisi netleştikten sonra hareket et."
    },
    {
        question: "Hisse senedi destek seviyesinde. Hacim aniden 3 kat arttı. Yeşil mum oluştu. Ne yapmalısın?",
        correctAnswer: "buy",
        explanation: "Destek seviyesinde yüksek hacimli yeşil mum güçlü alım sinyalidir. Alıcılar devreye girmiş!"
    }
];

let currentScenarioIndex = 0;

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Finans Akademi Başlatılıyor...');

    // Initialize navigation
    initNavigation();

    // Initialize market data
    initMarketData();

    // Initialize charts
    initCharts();

    // Initialize search functionality
    initSearch();

    // Initialize learning tracker
    initLearningTracker();

    // Initialize practice module
    initPracticeModule();

    // Refresh market data every 60 seconds
    setInterval(updateMarketData, 60000);

    console.log('Finans Akademi hazır!');
});

// ===================================
// Navigation
// ===================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all links and pages
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Show corresponding page
            const pageName = this.getAttribute('data-page');
            const page = document.getElementById(pageName);
            if (page) {
                page.classList.add('active');

                // Save current page to localStorage
                localStorage.setItem('currentPage', pageName);

                // Trigger specific page initialization
                if (pageName === 'grafikler') {
                    initChartExamples();
                    // Re-initialize practice chart when switching to grafikler page
                    setTimeout(() => {
                        initPracticeChart();
                    }, 100);
                } else if (pageName === 'haberler') {
                    // Initialize news manager when news page is opened
                    if (!window.newsManager) {
                        window.newsManager = new NewsManager();
                        window.newsManager.init();

                        // Setup refresh button
                        const refreshBtn = document.getElementById('refreshNews');
                        if (refreshBtn) {
                            refreshBtn.addEventListener('click', () => {
                                refreshBtn.querySelector('i').classList.add('fa-spin');
                                window.newsManager.refresh().then(() => {
                                    setTimeout(() => {
                                        refreshBtn.querySelector('i').classList.remove('fa-spin');
                                    }, 500);
                                });
                            });
                        }
                    }
                }
            }
        });
    });

    // Restore last visited page on load
    const lastPage = localStorage.getItem('currentPage');
    if (lastPage && lastPage !== 'dashboard') {
        const targetLink = document.querySelector(`[data-page="${lastPage}"]`);
        if (targetLink) {
            targetLink.click();
        }
    }
}

// ===================================
// Market Data (Demo/Simulated)
// ===================================

function initMarketData() {
    updateMarketData();
}

function updateMarketData() {
    // Simulated market data - In production, you would fetch from real APIs
    // For BIST data: https://api.bigpara.com or https://evds2.tcmb.gov.tr
    // For US markets: https://finnhub.io or https://www.alphavantage.co

    const marketData = {
        sp500: { value: 4783.45, change: 1.24 },
        nasdaq: { value: 15235.84, change: 1.67 },
        dow: { value: 37305.16, change: 0.85 },
        bist100: { value: 8947.32, change: 2.15 },
        usdtry: { value: 32.45, change: 0.32 },
        eurtry: { value: 35.78, change: 0.45 },
        aapl: { value: 182.31, change: -0.67 },
        msft: { value: 371.55, change: 1.23 },
        tsla: { value: 248.42, change: -2.45 }
    };

    // Update DOM elements
    Object.keys(marketData).forEach(key => {
        const valueEl = document.getElementById(key);
        const changeEl = document.getElementById(key + '-change');

        if (valueEl && changeEl) {
            const data = marketData[key];
            valueEl.textContent = data.value.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            const changeText = (data.change > 0 ? '+' : '') + data.change.toFixed(2) + '%';
            changeEl.textContent = changeText;
            changeEl.className = 'index-change ' + (data.change > 0 ? 'positive' : 'negative');
        }
    });

    // Update winners and losers
    updateWinnersLosers();
}

function updateWinnersLosers() {
    const winners = [
        { name: 'THYAO', change: '+3.45%' },
        { name: 'ASELS', change: '+2.87%' },
        { name: 'KCHOL', change: '+2.34%' }
    ];

    const losers = [
        { name: 'GARAN', change: '-1.23%' },
        { name: 'ISCTR', change: '-1.45%' },
        { name: 'AKBNK', change: '-0.98%' }
    ];

    const winnersEl = document.getElementById('winners');
    const losersEl = document.getElementById('losers');

    if (winnersEl) {
        winnersEl.innerHTML = winners.map(w =>
            `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                <span>${w.name}</span>
                <span style="color: var(--success); font-weight: 600;">${w.change}</span>
            </div>`
        ).join('');
    }

    if (losersEl) {
        losersEl.innerHTML = losers.map(l =>
            `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                <span>${l.name}</span>
                <span style="color: var(--danger-color); font-weight: 600;">${l.change}</span>
            </div>`
        ).join('');
    }
}

// ===================================
// Charts
// ===================================

function initCharts() {
    const ctx = document.getElementById('marketChart');
    if (!ctx) return;

    // Generate sample data for 30 days
    const labels = [];
    const data = [];
    const baseValue = 4500;

    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }));

        // Generate realistic market data with trend
        const randomChange = (Math.random() - 0.45) * 50; // Slight upward bias
        const newValue = i === 30 ? baseValue : data[data.length - 1] + randomChange;
        data.push(newValue);
    }

    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'S&P 500',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#2563eb',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Değer: ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#334155',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: '#334155',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function initChartExamples() {
    // Line Chart Example
    const lineCtx = document.getElementById('lineChartExample');
    if (lineCtx && !lineCtx.chartInitialized) {
        const lineData = [100, 102, 101, 105, 107, 106, 110, 112, 111, 115];
        const lineLabels = lineData.map((_, i) => `Gün ${i + 1}`);

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [{
                    label: 'Hisse Fiyatı',
                    data: lineData,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
        lineCtx.chartInitialized = true;
    }

    // Trend Line Demo
    const trendCtx = document.getElementById('trendLineDemo');
    if (trendCtx && !trendCtx.chartInitialized) {
        const trendData = [100, 105, 103, 108, 106, 112, 110, 115, 113, 118];
        const trendLabels = trendData.map((_, i) => `Gün ${i + 1}`);
        const trendLine = trendData.map((_, i) => 100 + (i * 2)); // Uptrend line

        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    {
                        label: 'Fiyat',
                        data: trendData,
                        borderColor: '#2563eb',
                        borderWidth: 2,
                        pointRadius: 4,
                        fill: false
                    },
                    {
                        label: 'Yükseliş Trendi',
                        data: trendLine,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
        trendCtx.chartInitialized = true;
    }

    // Support & Resistance Demo
    const srCtx = document.getElementById('supportResistanceDemo');
    if (srCtx && !srCtx.chartInitialized) {
        const srData = [105, 108, 106, 110, 108, 112, 110, 108, 106, 109, 111, 109, 107];
        const support = Array(srData.length).fill(105);
        const resistance = Array(srData.length).fill(112);

        new Chart(srCtx, {
            type: 'line',
            data: {
                labels: srData.map((_, i) => `${i + 1}`),
                datasets: [
                    {
                        label: 'Fiyat',
                        data: srData,
                        borderColor: '#2563eb',
                        borderWidth: 2,
                        pointRadius: 4,
                        fill: false
                    },
                    {
                        label: 'Direnç',
                        data: resistance,
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Destek',
                        data: support,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' },
                        min: 100,
                        max: 115
                    }
                }
            }
        });
        srCtx.chartInitialized = true;
    }

    // Moving Average Demo
    const maCtx = document.getElementById('movingAverageDemo');
    if (maCtx && !maCtx.chartInitialized) {
        const maData = [100, 102, 105, 103, 107, 110, 108, 112, 115, 113, 117, 120, 118, 122, 125];
        const ma5 = calculateMA(maData, 5);
        const ma10 = calculateMA(maData, 10);

        new Chart(maCtx, {
            type: 'line',
            data: {
                labels: maData.map((_, i) => `${i + 1}`),
                datasets: [
                    {
                        label: 'Fiyat',
                        data: maData,
                        borderColor: '#94a3b8',
                        borderWidth: 1,
                        pointRadius: 2,
                        fill: false
                    },
                    {
                        label: 'MA 5',
                        data: ma5,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'MA 10',
                        data: ma10,
                        borderColor: '#2563eb',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
        maCtx.chartInitialized = true;
    }

    // Volume Demo
    const volCtx = document.getElementById('volumeDemo');
    if (volCtx && !volCtx.chartInitialized) {
        const volData = [100, 102, 105, 103, 107, 110, 108, 112, 115];
        const volumes = [1000, 1200, 2500, 1100, 1800, 3000, 1500, 2200, 2800];

        new Chart(volCtx, {
            type: 'bar',
            data: {
                labels: volData.map((_, i) => `Gün ${i + 1}`),
                datasets: [
                    {
                        label: 'Hacim',
                        data: volumes,
                        backgroundColor: volumes.map((v, i) =>
                            i > 0 && volData[i] > volData[i-1] ? '#10b981' : '#ef4444'
                        ),
                        borderWidth: 0,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    }
                }
            }
        });
        volCtx.chartInitialized = true;
    }
}

function calculateMA(data, period) {
    const ma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            ma.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            ma.push(sum / period);
        }
    }
    return ma;
}

// ===================================
// Search Functionality
// ===================================

function initSearch() {
    const searchInput = document.getElementById('termSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const termItems = document.querySelectorAll('.term-item');

        termItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// ===================================
// Learning Tracker (30-Day Plan)
// ===================================

function initLearningTracker() {
    const checkboxes = document.querySelectorAll('.day-checkbox');

    // Load progress from localStorage
    const savedProgress = JSON.parse(localStorage.getItem('learningProgress') || '{}');

    checkboxes.forEach((checkbox, index) => {
        // Restore saved state
        if (savedProgress[checkbox.id]) {
            checkbox.checked = true;
        }

        // Add event listener
        checkbox.addEventListener('change', function() {
            updateLearningProgress();
        });
    });

    // Initial progress update
    updateLearningProgress();
}

function updateLearningProgress() {
    const checkboxes = document.querySelectorAll('.day-checkbox');
    const totalDays = checkboxes.length;
    let completedDays = 0;
    const progress = {};

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            completedDays++;
        }
        progress[checkbox.id] = checkbox.checked;
    });

    // Save to localStorage
    localStorage.setItem('learningProgress', JSON.stringify(progress));

    // Update UI
    const percentage = (completedDays / totalDays) * 100;
    const progressFill = document.getElementById('learningProgress');
    const completedDaysEl = document.getElementById('completedDays');

    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }

    if (completedDaysEl) {
        completedDaysEl.textContent = completedDays;
    }

    // Congratulations message when completed
    if (completedDays === totalDays) {
        setTimeout(() => {
            alert('🎉 Tebrikler! 30 günlük öğrenme planını tamamladın! Artık demo hesap ile bol bol pratik yapabilirsin.');
        }, 500);
    }
}

// ===================================
// Practice Module
// ===================================

function initPracticeModule() {
    loadPracticeScenario();

    const practiceButtons = document.querySelectorAll('.practice-btn');
    practiceButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            checkPracticeAnswer(this.getAttribute('data-answer'));
        });
    });

    const nextBtn = document.getElementById('nextScenario');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentScenarioIndex = (currentScenarioIndex + 1) % practiceScenarios.length;
            loadPracticeScenario();
        });
    }
}

function loadPracticeScenario() {
    const scenario = practiceScenarios[currentScenarioIndex];
    const questionEl = document.getElementById('scenarioQuestion');
    const resultEl = document.getElementById('practiceResult');

    if (questionEl) {
        questionEl.textContent = scenario.question;
    }

    if (resultEl) {
        resultEl.classList.remove('show', 'correct', 'incorrect');
        resultEl.textContent = '';
    }

    // Reset button states
    document.querySelectorAll('.practice-btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
    });
}

function checkPracticeAnswer(answer) {
    const scenario = practiceScenarios[currentScenarioIndex];
    const resultEl = document.getElementById('practiceResult');
    const buttons = document.querySelectorAll('.practice-btn');

    // Disable all buttons
    buttons.forEach(btn => btn.disabled = true);

    // Mark correct/incorrect
    buttons.forEach(btn => {
        if (btn.getAttribute('data-answer') === answer) {
            if (answer === scenario.correctAnswer) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
        }
        if (btn.getAttribute('data-answer') === scenario.correctAnswer) {
            btn.classList.add('correct');
        }
    });

    // Show result
    if (resultEl) {
        resultEl.classList.add('show');
        if (answer === scenario.correctAnswer) {
            resultEl.classList.add('correct');
            resultEl.innerHTML = `<strong>✅ Doğru!</strong><br>${scenario.explanation}`;
        } else {
            resultEl.classList.add('incorrect');
            resultEl.innerHTML = `<strong>❌ Yanlış.</strong><br>${scenario.explanation}`;
        }
    }
}

// ===================================
// Utility Functions
// ===================================

function formatNumber(num, decimals = 2) {
    return num.toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCurrency(num, currency = 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency
    }).format(num);
}

function formatPercent(num) {
    return (num > 0 ? '+' : '') + num.toFixed(2) + '%';
}

// ===================================
// Real API Integration Examples
// ===================================

// Example: Fetch real market data from Alpha Vantage (requires API key)
async function fetchRealMarketData(symbol) {
    const API_KEY = 'YOUR_API_KEY_HERE'; // Get free key from https://www.alphavantage.co/
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data['Global Quote'];
    } catch (error) {
        console.error('Error fetching market data:', error);
        return null;
    }
}

// Example: Fetch BIST data (you would need to find a suitable API)
async function fetchBISTData() {
    // Example endpoint (you need to find actual BIST API)
    // const url = 'https://api.example.com/bist100';

    try {
        // const response = await fetch(url);
        // const data = await response.json();
        // return data;

        // For now, return simulated data
        return {
            value: 8947.32,
            change: 2.15
        };
    } catch (error) {
        console.error('Error fetching BIST data:', error);
        return null;
    }
}

// ===================================
// Interactive Practice Chart
// ===================================

let practiceChart = null;
let currentScenario = null;

const scenarios = [
    // Destek/Direnç Senaryoları (10 adet)
    {
        question: "Hisse fiyatı güçlü bir destek seviyesinden sekti ve hacim artıyor. Ne yapmalısın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Destek seviyesinden geri dönüş + hacim artışı = güçlü ALIM sinyali.",
        wrongExplanation: "❌ Destek seviyesinden geri dönüş + hacim artışı güçlü ALIM sinyalidir. Pozisyon açılmalı.",
        data: {
            labels: ['Gün 1', 'Gün 2', 'Gün 3', 'Gün 4', 'Gün 5', 'Gün 6', 'Gün 7'],
            prices: [100, 95, 92, 90, 91, 95, 98],
            volumes: [1000, 1200, 1500, 1800, 2500, 3000, 3500]
        }
    },
    {
        question: "Fiyat direnci 3 kez test etti ama kıramadı, hacim azalıyor. Stratejin?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Güçlü direnç test edildi ama kırılamadı + hacim azalması = momentum kaybı, SAT.",
        wrongExplanation: "❌ Direnç test edilip kırılamadıysa ve hacim azalıyorsa momentum kaybı var. Satış zamanı.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 108, 115, 118, 116, 118, 117],
            volumes: [3000, 2800, 2500, 2200, 1800, 1500, 1200]
        }
    },
    {
        question: "Destek seviyesinde düşük hacimle dip yaptı. Trend hala belirsiz. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Düşük hacimli destek testi = zayıf sinyal. Hacim artışı bekle.",
        wrongExplanation: "❌ Düşük hacimli destek güvenilmez. Hacim artışı ve net yön belirmesini bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 105, 102, 100, 101, 102, 101],
            volumes: [800, 700, 600, 500, 550, 600, 580]
        }
    },
    {
        question: "Fiyat direnci yüksek hacimle kırdı (breakout) ve üstünde kapandı. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Yüksek hacimli direnç kırılımı = güçlü yükseliş başlangıcı. ALIM yap.",
        wrongExplanation: "❌ Yüksek hacimli breakout çok güçlü alım sinyalidir. Treni kaçırma.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 105, 108, 110, 115, 118],
            volumes: [1500, 1800, 2200, 2800, 3500, 4200, 4800]
        }
    },
    {
        question: "Yüksek hacimle birlikte fiyat desteği kırdı (breakdown). Pozisyonun var, ne yapmalısın?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Yüksek hacimli destek kırılımı = güçlü düşüş başlangıcı. Stop loss tetiklenmeli, SAT.",
        wrongExplanation: "❌ Destek kırılımı + yüksek hacim = tehlike! Hemen kes.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 118, 115, 112, 108, 103, 98],
            volumes: [2000, 2500, 3000, 4000, 5500, 6000, 6500]
        }
    },
    {
        question: "Fiyat destek ve direnç arasında (range) ping-pong yapıyor. Hacim orta seviye. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Range'de kalıyorsa kırılım bekle. Erken giriş tuzak olabilir.",
        wrongExplanation: "❌ Range trading risklidir. Kırılım yönünü beklemek daha güvenli.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 110, 108, 112, 109, 113, 110],
            volumes: [1500, 1600, 1400, 1700, 1500, 1600, 1550]
        }
    },
    {
        question: "Destekten 2 kez sekip yükseldi, 3. kez test ediyor. Hacim azalıyor. Ne yapmalı?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! 3. test + düşen hacim = destek zayıflıyor. Kırılabilir, bekle.",
        wrongExplanation: "❌ Destek her test edildiğinde zayıflar. Hacim de düşüyorsa risk var.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 92, 95, 93, 98, 95, 91],
            volumes: [3000, 2800, 2500, 2200, 2000, 1700, 1500]
        }
    },
    {
        question: "Direnç kırıldı ama düşük hacimle (false breakout olabilir). Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Düşük hacimli kırılım = sahte olabilir (false breakout). Doğrulanmasını bekle.",
        wrongExplanation: "❌ Düşük hacimli breakout güvenilmez. Çoğu zaman geri döner (bull trap).",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 103, 108, 112, 113, 111, 109],
            volumes: [2000, 1800, 1500, 1200, 1000, 1100, 1050]
        }
    },
    {
        question: "Destek seviyesinde Hammer (çekiç) mum formasyonu + hacim artışı. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Hammer mumu destek seviyesinde + hacim = güçlü geri dönüş sinyali. AL.",
        wrongExplanation: "❌ Hammer mumu + destek + hacim = klasik alım formasyonu. Kaçırma.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 105, 100, 95, 96, 101, 105],
            volumes: [1200, 1500, 1800, 2500, 2800, 3200, 3500]
        }
    },
    {
        question: "Direnç seviyesinde Shooting Star (ters çekiç) + yüksek hacim. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Shooting Star dirençte + hacim = tepe formasyonu, satım sinyali.",
        wrongExplanation: "❌ Shooting Star dirençte düşüş başlangıcını gösterir. Sat veya pozisyon alma.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 110, 115, 118, 116, 113],
            volumes: [1500, 1800, 2200, 2800, 3500, 3200, 2800]
        }
    },

    // RSI & Momentum Senaryoları (10 adet)
    {
        question: "RSI 75'in üzerinde, fiyat direnç seviyesinde ve hacim düşüyor. Stratejin?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! RSI > 70 (aşırı alım) + direnç + düşen hacim = SATIM sinyali.",
        wrongExplanation: "❌ Aşırı alım bölgesinde + direnç + momentum kaybı = tehlike. Sat.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 112, 118, 122, 125, 126],
            volumes: [5000, 4500, 4000, 3000, 2500, 2000, 1500]
        }
    },
    {
        question: "RSI 25'te (aşırı satım), fiyat destek seviyesine yaklaşıyor. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! RSI < 30 + destek = aşırı satım, toparlanma fırsatı. ALIM.",
        wrongExplanation: "❌ Aşırı satım + destek = klasik dip alma fırsatı. Al.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 112, 105, 98, 92, 89, 88],
            volumes: [2000, 2500, 3000, 3500, 3800, 3600, 3200]
        }
    },
    {
        question: "RSI 55'te (nötr bölge), trend belirsiz, hacim düşük. Ne yapmalı?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! RSI nötr + trend belirsiz = net sinyal yok. Bekle.",
        wrongExplanation: "❌ Nötr bölgede pozisyon almak risk. Net yön belirmesini bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 99, 101, 100, 103, 101],
            volumes: [1000, 950, 900, 850, 900, 920, 880]
        }
    },
    {
        question: "RSI 85'te ama güçlü yükseliş trendi devam ediyor. Hacim hala yüksek. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Güçlü trendlerde RSI uzun süre aşırı alımda kalabilir. Momentum kırılmasını bekle.",
        wrongExplanation: "❌ 'RSI yüksek = sat' her zaman doğru değil. Güçlü trendlerde RSI yanıltıcı olabilir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 108, 115, 122, 128, 135, 140],
            volumes: [3000, 3500, 4000, 4500, 5000, 5200, 5500]
        }
    },
    {
        question: "RSI Divergence: Fiyat yükseliyor ama RSI düşüyor (bearish divergence). Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Bearish divergence = momentum zayıflıyor, düşüş yaklaşıyor. SAT.",
        wrongExplanation: "❌ Divergence en güçlü ters dönüş sinyalidir. Momentum kaybı başladı.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 108, 112, 115, 118, 120],
            volumes: [3000, 2800, 2500, 2200, 1900, 1600, 1400]
        }
    },
    {
        question: "RSI 28'den 45'e yükseldi, fiyat destek seviyesini kırmadı. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! RSI aşırı satımdan çıkıyor + destek tutuyor = toparlanma başladı. AL.",
        wrongExplanation: "❌ RSI toparlanması + destek = güçlü alım sinyali.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 95, 90, 88, 89, 92, 95],
            volumes: [2000, 2500, 3000, 3200, 2800, 2500, 2300]
        }
    },
    {
        question: "MACD histogramı büyüyor, RSI 60'ta, hacim artıyor. Ne yapmalısın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! MACD büyüme + RSI sağlıklı bölgede + hacim = güçlü yükseliş devam ediyor. AL.",
        wrongExplanation: "❌ Tüm göstergeler yükseliş diyor. Trend güçlü, pozisyon al.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 98, 102, 106, 110, 115, 119],
            volumes: [1800, 2200, 2600, 3000, 3500, 4000, 4500]
        }
    },
    {
        question: "RSI 78'de ama fiyat düşmeye başladı. Divergence başladı. Ne yaparsın?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Yüksek RSI + fiyat düşüşü = momentum tersine döndü. SAT.",
        wrongExplanation: "❌ Fiyat düşerken RSI yüksekse, düşüş hızlanabilir. Sat.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 125, 128, 130, 128, 125, 122],
            volumes: [4000, 4500, 4200, 3800, 3200, 2800, 2500]
        }
    },
    {
        question: "RSI 50 çizgisini aşağıdan yukarı kesti, trend yükselişte. Ne yapmalı?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! RSI 50 crossover = momentum pozitife döndü. Yükseliş trendinde ALIM.",
        wrongExplanation: "❌ RSI 50 önemli bir eşik. Yukarı geçişi alım sinyalidir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 96, 98, 100, 103, 106, 109],
            volumes: [1500, 1700, 2000, 2300, 2600, 2900, 3200]
        }
    },
    {
        question: "Stochastic %K ve %D aşırı alım bölgesinde kesişti (80'in üstünde). Ne yaparsın?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Stochastic aşırı alımda bearish crossover = satım sinyali.",
        wrongExplanation: "❌ Stochastic 80 üstünde kesişirse momentum zayıflıyor demektir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 108, 115, 120, 122, 121, 119],
            volumes: [3000, 3500, 3800, 3500, 3000, 2500, 2200]
        }
    },

    // Hareketli Ortalama Senaryoları (10 adet)
    {
        question: "Fiyat 50 günlük MA'yı yukarı kesti ve MACD golden cross verdi. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! MA crossover + MACD golden cross = güçlü yükseliş sinyali. ALIM.",
        wrongExplanation: "❌ Çift onay (MA + MACD) çok güçlü sinyal. Al.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 92, 94, 97, 101, 105, 108],
            volumes: [1500, 1800, 2200, 2800, 3500, 4000, 4500]
        }
    },
    {
        question: "Golden Cross: 50 MA yukarı kesti 200 MA'yı. Hacim patlama yapmış. Ne yapmalı?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Golden Cross tarihin en güçlü yükseliş sinyalidir. Yüksek hacimle daha da güçlü!",
        wrongExplanation: "❌ Golden Cross'u kaçırma! Uzun vadeli boğa piyasası başlamış olabilir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [85, 88, 92, 96, 101, 107, 113],
            volumes: [2000, 2500, 3000, 4000, 5500, 6500, 7000]
        }
    },
    {
        question: "Death Cross: 50 MA aşağı kesti 200 MA'yı. Hacim yüksek. Ne yaparsın?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Death Cross güçlü düşüş sinyali. Pozisyonları kapat veya kısa pozisyon al.",
        wrongExplanation: "❌ Death Cross uzun vadeli ayı piyasası sinyalidir. Tehlikeli.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 115, 110, 105, 100, 95, 90],
            volumes: [2500, 3000, 3500, 4500, 5500, 6000, 6500]
        }
    },
    {
        question: "Fiyat 200 MA'nın üstünde ama 50 MA'ya yaklaşıyor (henüz kesmedi). Ne yapmalı?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! MA'lara yaklaşma ama henüz kesişme yok = netleşmesini bekle.",
        wrongExplanation: "❌ Erken pozisyon alma. MA kesişmesini bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 108, 106, 105, 104, 103, 102],
            volumes: [2000, 1900, 1800, 1700, 1650, 1600, 1580]
        }
    },
    {
        question: "Fiyat 50 MA'dan destek alıp yukarı sıçradı, yükseliş trendi devam ediyor. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Trendde MA destek işlevi görür. Geri dönüş alım fırsatıdır.",
        wrongExplanation: "❌ MA'dan geri dönüş klasik yükseliş trendi stratejisi. Al.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 100, 105, 102, 104, 108, 112],
            volumes: [2000, 2300, 2600, 2200, 2500, 2800, 3100]
        }
    },
    {
        question: "Fiyat 50 MA'nın altına düştü, düşüş trendi başladı. Hacim artıyor. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! MA altına düşüş + hacim artışı = düşüş trendi onaylandı. SAT.",
        wrongExplanation: "❌ MA kırılımı trend değişimi demektir. Sat veya dışarıda kal.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 108, 105, 102, 98, 95, 92],
            volumes: [2000, 2300, 2700, 3200, 3600, 3900, 4100]
        }
    },
    {
        question: "Fiyat 50 ve 200 MA arasında sıkışmış, hacim düşük. Trend belirsiz. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! MA'lar arasında sıkışma = konsolidasyon. Kırılım bekle.",
        wrongExplanation: "❌ Belirsizlikte pozisyon almak risk. Kırılım yönünü bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 99, 101, 100, 103, 101],
            volumes: [1200, 1150, 1100, 1080, 1120, 1140, 1110]
        }
    },
    {
        question: "3 MA (20, 50, 200) hepsi yukarı bakıyor ve paralel. Fiyat en üstte. Ne yapmalı?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Tüm MA'lar paralel yukarı = mükemmel yükseliş trendi. Trendle git, AL.",
        wrongExplanation: "❌ Paralel yükseliş en güçlü trend formasyonudur. Kaçırma.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 95, 100, 106, 112, 118, 124],
            volumes: [2000, 2300, 2700, 3100, 3500, 3900, 4300]
        }
    },
    {
        question: "Fiyat 200 MA'yı aşağı kırdı ama düşük hacimle. False breakdown olabilir mi?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Düşük hacimli 200 MA kırılımı = sahte olabilir. Doğrulanmasını bekle.",
        wrongExplanation: "❌ Düşük hacimli kırılımlar genellikle geriye döner. Bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 102, 99, 97, 96, 97, 98],
            volumes: [2000, 1800, 1500, 1200, 1000, 1100, 1150]
        }
    },
    {
        question: "EMA 12 ve EMA 26 aşağı döndü, fiyat her ikisinin de altında. Ne yapmalısın?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Kısa vadeli EMA'lar bearish + fiyat altında = düşüş trendi. SAT veya dışarıda kal.",
        wrongExplanation: "❌ EMA'lar düşüş trendinde fiyat her zaman altında kalır. Sat.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [115, 110, 105, 100, 96, 93, 90],
            volumes: [2500, 2800, 3100, 3500, 3800, 4000, 4200]
        }
    },

    // Hacim & Momentum Senaryoları (10 adet)
    {
        question: "Hisse dar bir aralıkta (range) hareket ediyor, hacim çok düşük, trend belirsiz. Ne yapmalısın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Konsolidasyon + düşük hacim = belirsizlik. Kırılım bekle (breakout), erken pozisyon alma.",
        wrongExplanation: "❌ Dar aralık + düşük hacim = fırtına öncesi sessizlik. Kırılım yönünü bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 99, 101, 100, 102, 101],
            volumes: [800, 700, 650, 600, 580, 620, 590]
        }
    },
    {
        question: "Hacim patlaması: Normal hacmin 5 katı! Fiyat %8 yükseldi. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Anormal hacim artışı + yükseliş = büyük haber var, momentum güçlü. AL.",
        wrongExplanation: "❌ Hacim patlaması genellikle güçlü hareketin devam edeceğini gösterir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 103, 105, 108, 112, 118],
            volumes: [1000, 1200, 1300, 1500, 6500, 7000, 6800]
        }
    },
    {
        question: "Fiyat yükseldi ama hacim düşüyor (her gün daha az). Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Yükseliş + azalan hacim = momentum zayıf, sürdürülemez. SAT.",
        wrongExplanation: "❌ Hacim olmadan yükseliş devam etmez. Satış zamanı.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 103, 106, 109, 111, 113, 114],
            volumes: [5000, 4200, 3500, 2800, 2200, 1800, 1500]
        }
    },
    {
        question: "Düşüş trendinde hacim giderek azalıyor. Satış baskısı azalıyor gibi. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Düşüşte hacim azalması = satış baskısı tükeniyor ama henüz dönüş yok. Bekle.",
        wrongExplanation: "❌ Hacim azalması iyi ama henüz alım sinyali yok. Net dönüş bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 107, 104, 102, 100, 99, 98],
            volumes: [4000, 3500, 3000, 2500, 2000, 1700, 1500]
        }
    },
    {
        question: "Fiyat düşüyor ama hacim artıyor (panik satış). Ne yapmalısın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Yüksek hacimli düşüş = panik, henüz dip değil. Kapitülasyon bekle.",
        wrongExplanation: "❌ Panik satışta dip yakalamaya çalışma. Daha düşebilir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 115, 110, 105, 98, 92, 88],
            volumes: [2000, 2500, 3200, 4000, 5500, 7000, 8000]
        }
    },
    {
        question: "Hacim climax: Dev hacim + uzun düşüş mumu sonrası ertesi gün yeşil mum. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Selling climax (kapitülasyon) + yeşil gün = dip, alım fırsatı.",
        wrongExplanation: "❌ Kapitülasyon sonrası toparlanma klasik dip formasyonudur.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 105, 100, 95, 85, 87, 92],
            volumes: [2000, 2500, 3000, 4000, 9000, 6000, 4500]
        }
    },
    {
        question: "On Balance Volume (OBV) yükseliyor ama fiyat yatay. Bullish divergence. Ne yapmalı?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! OBV yükselişi = akıllı para topluyor, fiyat yakında yükselir. AL.",
        wrongExplanation: "❌ OBV fiyattan önce hareket eder. Bu bullish sinyal.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 101, 100, 102, 101, 102, 101],
            volumes: [1500, 2000, 1800, 2200, 2500, 2800, 3000]
        }
    },
    {
        question: "Hacim ortalama, fiyat yavaş yavaş yükseliyor (healthy uptrend). Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Sağlıklı istikrarlı yükseliş en iyi trend türüdür. AL ve tut.",
        wrongExplanation: "❌ Yavaş ve istikrarlı yükseliş uzun sürer. Trendle git.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 102, 104, 106, 108, 110, 112],
            volumes: [2000, 2100, 2200, 2300, 2400, 2500, 2600]
        }
    },
    {
        question: "Hacim spike + Doji mumu (kararsızlık). Trend tersine dönebilir. Ne yapmalısın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Yüksek hacimli Doji = kararsızlık, yön netleşmesini bekle.",
        wrongExplanation: "❌ Doji mumu yön değişiminin ilk işareti olabilir ama henüz net değil.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 108, 112, 115, 115, 115, 115],
            volumes: [2000, 2300, 2700, 3200, 5000, 4800, 4500]
        }
    },
    {
        question: "Price-Volume Divergence: Fiyat yeni zirve yaptı ama hacim düşük. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Yeni zirve + düşük hacim = zayıf yükseliş, tuzak olabilir. SAT.",
        wrongExplanation: "❌ Hacim onaylamayan zirve tehlikelidir. Momentum zayıf.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 110, 115, 118, 120, 122],
            volumes: [4000, 3800, 3500, 3000, 2500, 2000, 1500]
        }
    },

    // Mum Formasyonları (10 adet)
    {
        question: "Uzun yeşil mum ardından küçük kırmızı mum (Harami formasyonu). Trend devam eder mi?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Harami kararsızlık gösterir. Yön netleşmesini bekle.",
        wrongExplanation: "❌ Harami trend duraklaması veya dönüş sinyali olabilir. Bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 100, 105, 110, 118, 117, 116],
            volumes: [2000, 2500, 3000, 3500, 4000, 2800, 2500]
        }
    },
    {
        question: "3 ardışık yeşil mum (Three White Soldiers), hacim artıyor. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Three White Soldiers = çok güçlü yükseliş formasyonu. AL.",
        wrongExplanation: "❌ Bu formasyonu kaçırma! Güçlü yükseliş başlamış.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 93, 95, 100, 105, 110, 115],
            volumes: [1800, 2200, 2600, 3100, 3600, 4100, 4500]
        }
    },
    {
        question: "3 ardışık kırmızı mum (Three Black Crows), hacim yüksek. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Three Black Crows = güçlü düşüş formasyonu. SAT.",
        wrongExplanation: "❌ Bu formasyonu ciddiye al. Düşüş hızlanabilir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 118, 115, 110, 105, 100, 96],
            volumes: [2500, 3000, 3500, 4000, 4500, 5000, 5200]
        }
    },
    {
        question: "Morning Star formasyonu: Kırmızı mum + Doji + Yeşil mum. Destek seviyesinde. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Morning Star destek seviyesinde = klasik dip formasyonu. AL.",
        wrongExplanation: "❌ Morning Star en güvenilir dönüş formasyonlarındandır.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 100, 95, 92, 93, 97, 102],
            volumes: [2000, 2500, 3000, 3200, 2800, 2500, 2300]
        }
    },
    {
        question: "Evening Star formasyonu: Yeşil + Doji + Kırmızı. Direnç seviyesinde. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Evening Star dirençte = tepe formasyonu, düşüş başlıyor. SAT.",
        wrongExplanation: "❌ Evening Star güçlü ters dönüş sinyalidir. Sat.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 110, 115, 116, 113, 109],
            volumes: [2000, 2300, 2600, 3000, 2700, 2400, 2200]
        }
    },
    {
        question: "Bullish Engulfing: Küçük kırmızı mum + Büyük yeşil yutan mum. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Bullish Engulfing = güçlü alım baskısı, yükseliş başlıyor. AL.",
        wrongExplanation: "❌ Yutan formasyonlar çok güçlüdür. Momentum değişti.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 98, 95, 96, 102, 106, 110],
            volumes: [1800, 2000, 2200, 3500, 4000, 3800, 3600]
        }
    },
    {
        question: "Bearish Engulfing: Küçük yeşil + Büyük kırmızı yutan mum. Dirençte. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Bearish Engulfing dirençte = güçlü satım sinyali. SAT.",
        wrongExplanation: "❌ Dirençte bearish engulfing çok tehlikeli. Sat.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 105, 110, 115, 117, 112, 108],
            volumes: [2000, 2300, 2600, 3000, 3500, 4000, 3800]
        }
    },
    {
        question: "Long-legged Doji (çok uzun fitilli Doji), hacim yüksek. Kararsızlık zirvede. Ne yaparsın?",
        correctAnswer: "wait",
        explanation: "✅ Doğru! Uzun fitilli Doji = şiddetli mücadele, yön belirsiz. Bekle.",
        wrongExplanation: "❌ Long-legged Doji'den sonra genellikle güçlü hareket gelir. Yönünü bekle.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 103, 106, 109, 110, 109, 110],
            volumes: [2000, 2300, 2600, 3000, 4500, 4200, 4000]
        }
    },
    {
        question: "Gravestone Doji (mezar taşı): Uzun üst fitil, gövde yok, dipte oluştu. Ne yapmalı?",
        correctAnswer: "sell",
        explanation: "✅ Doğru! Gravestone Doji zirvede = bearish ters dönüş. SAT.",
        wrongExplanation: "❌ Gravestone Doji güçlü satım baskısını gösterir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 110, 115, 120, 122, 119, 116],
            volumes: [2000, 2300, 2700, 3200, 3800, 3500, 3200]
        }
    },
    {
        question: "Dragonfly Doji (yusufçuk): Uzun alt fitil, gövde yok, destekte oluştu. Ne yaparsın?",
        correctAnswer: "buy",
        explanation: "✅ Doğru! Dragonfly Doji destekte = bullish dönüş sinyali. AL.",
        wrongExplanation: "❌ Dragonfly Doji dipte güçlü alım sinyalidir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 105, 100, 95, 93, 96, 100],
            volumes: [2000, 2300, 2700, 3200, 3600, 3200, 2900]
        }
    },

    // === Üçgen Formasyonları (Triangle Patterns) - 5 scenarios ===
    {
        question: "Hisse yükselen bir üçgen formasyonu içinde (üst direnç yatay, alt destek yükseliyor). Son 2 günde hacim arttı ve fiyat üst dirence yaklaştı. Ne yaparsınız?",
        correctAnswer: 'buy',
        explanation: "✅ Yükselen üçgen (ascending triangle) genelde yukarı kırılım ile sonuçlanır. Hacim artışı kırılımın yakın olduğunu gösterir - üst direnci kırarsa ALIM fırsatı.",
        wrongExplanation: "❌ Yükselen üçgen + hacim artışı = yukarı kırılım beklentisi. Direnç kırılımında pozisyon almalısınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 98, 100, 99.5, 100, 99.8, 100],
            volumes: [1500, 1600, 1700, 1800, 2100, 2400, 2700]
        }
    },
    {
        question: "Hisse alçalan bir üçgen oluşturmuş (alt destek yatay 80 TL, üst direnç düşüyor). Fiyat 82 TL'de ve hacim artıyor. Stratejiniz?",
        correctAnswer: 'sell',
        explanation: "✅ Alçalan üçgen (descending triangle) genelde aşağı kırılım ile sonuçlanır. Alt desteğe yaklaşırken hacim artıyorsa 80 TL kırılırsa güçlü SATIM sinyali.",
        wrongExplanation: "❌ Alçalan üçgen + artan hacim = aşağı kırılım riski yüksek. Pozisyonları azaltmalı veya short açmalısınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [94, 90, 86, 85, 84, 83, 82],
            volumes: [1800, 1900, 2000, 2200, 2400, 2600, 2900]
        }
    },
    {
        question: "Simetrik üçgen formasyonu var (hem üst hem alt daralan). Fiyat üçgenin sonuna geldi, hacim düşük. Ne yapmalı?",
        correctAnswer: 'wait',
        explanation: "✅ Simetrik üçgen kırılım yönü belirsizdir. Hacim düşükse sahte kırılım riski var. Hacim artışı ile net kırılım BEKLEYİN.",
        wrongExplanation: "❌ Simetrik üçgenlerde yön belirsizdir. Hacim düşükken pozisyon almak risklidir - kırılımı bekleyin.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [110, 105, 103, 100, 99, 98, 97.5],
            volumes: [3000, 2500, 2000, 1800, 1500, 1400, 1300]
        }
    },
    {
        question: "Yükselen üçgen formasyonu 120 TL direnci 3 kez test etti. Şimdi 4. testte hacim %150 arttı ve 121 TL'ye çıktı. Pozisyon?",
        correctAnswer: 'buy',
        explanation: "✅ Üçgen formasyonunda çoklu test + hacim artışı ile kırılım = güçlü ALIM sinyali. 4. test genelde başarılı olur, hedef: üçgen tabanından yüksekliği kadar yukarı.",
        wrongExplanation: "❌ Net kırılım gerçekleşti. Hacimli kırılımlar güvenilirdir ve momentum devam eder.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [105, 112, 118, 115, 119, 118, 121],
            volumes: [1500, 1600, 1700, 1800, 1900, 2000, 5000]
        }
    },
    {
        question: "Alçalan üçgen 50 TL desteğini test ediyor. Hacim yüksek ama hâlâ kırılmadı (49.8 TL). Ne yaparsınız?",
        correctAnswer: 'wait',
        explanation: "✅ Henüz kırılım olmadı. Destek tutabilir veya kırılabilir - onay BEKLEYİN. 50 TL'nin altına net kapanış görünce satış yapabilirsiniz.",
        wrongExplanation: "❌ Kritik seviye test ediliyor ama henüz kırılmadı. Erken hareket sahte sinyal riski taşır.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [65, 58, 54, 52, 51, 50.5, 49.8],
            volumes: [2000, 2200, 2400, 2600, 2900, 3200, 3500]
        }
    },

    // === Takoz Formasyonları (Wedge Patterns) - 3 scenarios ===
    {
        question: "Yükselen takoz (rising wedge) oluşmuş: hem alt hem üst yükseliyor ama daralan kanal. Fiyat üst banttan düşüyor. Strateji?",
        correctAnswer: 'sell',
        explanation: "✅ Yükselen takoz genelde düşüş sinyalidir (bearish). Momentum zayıflar ve aşağı kırılım beklenir. Alt kanalı kırarsa SATIM.",
        wrongExplanation: "❌ Yükselen takoz yanıltıcıdır - yükseliş gibi görünse de genelde düşüş ile sonuçlanır.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 103, 106, 107, 108, 108.5, 107],
            volumes: [3000, 2700, 2400, 2100, 1900, 1700, 1500]
        }
    },
    {
        question: "Düşen takoz (falling wedge) görüyorsunuz: fiyat düşüyor ama kanal daralıyor. Hacim azalıyor ve üst bandı test ediyor. Ne yapmalı?",
        correctAnswer: 'buy',
        explanation: "✅ Düşen takoz genelde yükseliş sinyalidir (bullish). Satış baskısı azalır ve yukarı kırılım beklenir. Üst bandı kırarsa ALIM.",
        wrongExplanation: "❌ Düşen takoz yanıltıcıdır - düşüş gibi görünse de genelde yükseliş ile sonuçlanır.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [100, 95, 92, 90, 89, 88.5, 89.5],
            volumes: [3500, 3000, 2600, 2200, 1900, 1600, 1400]
        }
    },
    {
        question: "Yükselen takoz formasyonunda fiyat alt bandı kırdı ve hacim %200 arttı. Pozisyonunuz?",
        correctAnswer: 'sell',
        explanation: "✅ Yükselen takozun alt bandı kırılması güçlü SATIM sinyalidir. Hacim artışı kırılımı doğrular - düşüş trendi başlayabilir.",
        wrongExplanation: "❌ Alt band kırılımı ve hacim artışı net satış sinyalidir. Bekleme riski yüksektir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [102, 105, 107, 108, 108, 107, 103],
            volumes: [2000, 1900, 1800, 1700, 1600, 1800, 5400]
        }
    },

    // === Baş-Omuz Formasyonları (Head and Shoulders) - 3 scenarios ===
    {
        question: "Klasik baş-omuz formasyonu: Sol omuz 100 TL, baş 115 TL, sağ omuz 100 TL. Boyun çizgisi (neckline) 90 TL ve test ediliyor. Ne yaparsınız?",
        correctAnswer: 'sell',
        explanation: "✅ Baş-omuz formasyonu en güçlü trend dönüş sinyalidir. Boyun çizgisi kırılırsa SATIM. Hedef: boyun çizgisinden baş yüksekliği kadar aşağı (90-25=65 TL).",
        wrongExplanation: "❌ Baş-omuz tamamlandı ve boyun çizgisi test ediliyor. Kırılım beklerseniz geç kalırsınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [85, 100, 115, 100, 95, 92, 90],
            volumes: [2000, 2500, 3500, 2500, 2200, 2400, 2700]
        }
    },
    {
        question: "Ters baş-omuz (inverse head and shoulders): boyun çizgisi 100 TL'den hacimle kırıldı. Fiyat 102 TL. Strateji?",
        correctAnswer: 'buy',
        explanation: "✅ Ters baş-omuz düşüş trendinin sonunu işaretler. Boyun çizgisi kırılımı ALIM sinyalidir. Hedef: boyun çizgisinden baş derinliği kadar yukarı.",
        wrongExplanation: "❌ Ters baş-omuz güçlü bir yükseliş formasyonudur ve kırılım gerçekleşti. Pozisyon almalısınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 85, 75, 85, 90, 98, 102],
            volumes: [2500, 2800, 3200, 2800, 2600, 3000, 3800]
        }
    },
    {
        question: "Baş-omuz formasyonunda sağ omuz henüz tamamlanmadı (fiyat düşüyor ama boyun çizgisine 10 TL var). Ne yapmalı?",
        correctAnswer: 'wait',
        explanation: "✅ Formasyon henüz tamamlanmadı. Sağ omuz oluşmalı ve boyun çizgisi kırılmalı. Erken satış risklidir - teyit BEKLEYİN.",
        wrongExplanation: "❌ Henüz boyun çizgisi kırılmadı. Formasyon tamamlanmadan hareket etmek sahte sinyal riski taşır.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 105, 120, 105, 108, 105, 102],
            volumes: [2000, 2500, 3500, 2500, 2200, 2000, 1900]
        }
    },

    // === Çift Tepe/Dip (Double Top/Bottom) - 2 scenarios ===
    {
        question: "Çift tepe formasyonu: 150 TL'yi 2 kez test etti. Şimdi ara dip olan 140 TL'yi kırıyor (139 TL). Hacim yüksek. Pozisyon?",
        correctAnswer: 'sell',
        explanation: "✅ Çift tepe formasyonunda ara dip kırılımı SATIM sinyalidir. Hedef: tepe ile dip arası mesafe kadar aşağı (150-140=10 → 140-10=130 TL).",
        wrongExplanation: "❌ Çift tepe tamamlandı ve onay geldi. Düşüş devam edebilir.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [135, 150, 140, 150, 145, 141, 139],
            volumes: [2000, 2800, 2200, 2900, 2400, 2600, 3200]
        }
    },
    {
        question: "Çift dip formasyonu: 80 TL'yi 2 kez test etti. Ara tepe 90 TL'yi hacimle kırdı (91 TL). Ne yaparsınız?",
        correctAnswer: 'buy',
        explanation: "✅ Çift dip formasyonunda ara tepe kırılımı ALIM sinyalidir. Güçlü yükseliş başlayabilir. Hedef: dip ile tepe arası mesafe kadar yukarı (90-80=10 → 90+10=100 TL).",
        wrongExplanation: "❌ Çift dip güvenilir bir yükseliş formasyonudur ve kırılım onaylandı.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [95, 80, 90, 80, 85, 89, 91],
            volumes: [2500, 3000, 2400, 3100, 2600, 2900, 3500]
        }
    },

    // === Bayrak ve Flama (Flags and Pennants) - 2 scenarios ===
    {
        question: "Güçlü yükseliş sonrası dar bir kanal oluştu (bayrak formasyonu). Fiyat üst kanalı test ediyor ve hacim artıyor. Strateji?",
        correctAnswer: 'buy',
        explanation: "✅ Bayrak formasyonu (flag) trend devamı sinyalidir. Konsolidasyon sonrası yukarı kırılım beklenir. Hacim artışı ile ALIM yapın.",
        wrongExplanation: "❌ Bayrak formasyonu önceki trendin devam edeceğini gösterir. Kırılımda pozisyon almalısınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [90, 110, 108, 107, 106, 108, 110],
            volumes: [3500, 4500, 2000, 1800, 1900, 2200, 3000]
        }
    },
    {
        question: "Keskin düşüş sonrası simetrik daralan formasyon (flama/pennant). Fiyat alt bandı kırıyor. Ne yapmalı?",
        correctAnswer: 'sell',
        explanation: "✅ Düşüş sonrası flama genelde düşüşün devamını işaret eder. Alt band kırılımı SATIM sinyalidir.",
        wrongExplanation: "❌ Flama önceki trendin devamını gösterir. Düşüş trendindeyseniz satış yapmalısınız.",
        data: {
            labels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
            prices: [120, 95, 98, 96, 95, 93, 91],
            volumes: [4000, 5000, 2500, 2200, 2000, 2300, 2800]
        }
    }
];

function initPracticeChart() {
    const canvas = document.getElementById('practiceChart');
    if (!canvas) return;

    // Load random scenario
    loadRandomScenario();

    // Setup answer buttons
    document.querySelectorAll('.practice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            checkAnswer(this.dataset.answer);
        });
    });

    // Next scenario button
    const nextBtn = document.getElementById('nextScenario');
    if (nextBtn) {
        nextBtn.addEventListener('click', loadRandomScenario);
    }
}

function loadRandomScenario() {
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    currentScenario = scenarios[randomIndex];

    // Update question
    document.getElementById('scenarioQuestion').textContent = currentScenario.question;

    // Clear previous result
    const resultDiv = document.getElementById('practiceResult');
    if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.style.display = 'none';
    }

    // Re-enable buttons
    document.querySelectorAll('.practice-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect');
    });

    // Render chart
    renderPracticeChart(currentScenario.data);
}

function renderPracticeChart(data) {
    const canvas = document.getElementById('practiceChart');
    if (!canvas) return;

    // Destroy previous chart
    if (practiceChart) {
        practiceChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    practiceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Fiyat',
                    data: data.prices,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Hacim',
                    data: data.volumes,
                    type: 'bar',
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Grafik Analizi Pratiği',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Fiyat ($)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Hacim'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function checkAnswer(userAnswer) {
    if (!currentScenario) {
        console.error('No current scenario loaded!');
        return;
    }

    const resultDiv = document.getElementById('practiceResult');
    const isCorrect = userAnswer === currentScenario.correctAnswer;

    console.log('User Answer:', userAnswer);
    console.log('Correct Answer:', currentScenario.correctAnswer);
    console.log('Is Correct:', isCorrect);

    // Disable all buttons
    document.querySelectorAll('.practice-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === currentScenario.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === userAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Show result
    resultDiv.style.display = 'block';
    if (isCorrect) {
        resultDiv.innerHTML = `
            <div class="result-correct">
                <h3>🎉 Tebrikler! Doğru Cevap!</h3>
                <p>${currentScenario.explanation}</p>
            </div>
        `;
    } else {
        const correctAnswerText =
            currentScenario.correctAnswer === 'buy' ? '📈 ALIM' :
            currentScenario.correctAnswer === 'sell' ? '📉 SATIM' : '⏳ BEKLE';

        resultDiv.innerHTML = `
            <div class="result-incorrect">
                <h3>❌ Yanlış Cevap</h3>
                <p><strong>Doğru cevap:</strong> ${correctAnswerText}</p>
                <p>${currentScenario.wrongExplanation || currentScenario.explanation}</p>
            </div>
        `;
    }
}

// Note: Practice chart is initialized when user clicks on "Grafik Analizi" page
// See initNavigation() function above

// ===================================
// Console Info
// ===================================

console.log('%c🚀 Finans Akademi v1.0', 'color: #2563eb; font-size: 20px; font-weight: bold;');
console.log('%cGerçek API entegrasyonu için:', 'color: #10b981; font-size: 14px;');
console.log('📊 US Markets: https://www.alphavantage.co (ücretsiz)');
console.log('📊 US Markets: https://finnhub.io (ücretsiz)');
console.log('📊 Crypto: https://www.coingecko.com/api (ücretsiz)');
console.log('📊 BIST: https://www.bigpara.com (web scraping gerekebilir)');
console.log('📊 TCMB: https://evds2.tcmb.gov.tr (resmi API)');
console.log('%c💡 TradingView widget entegrasyonu için: https://www.tradingview.com/widget/', 'color: #f59e0b; font-size: 14px;');
