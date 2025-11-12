/**
 * Chart Pattern Quiz UI Controller
 */

let quizManager = null;
let currentResult = null;

/**
 * Initialize quiz when page loads
 */
function initChartQuiz() {
    console.log('🎯 Initializing Chart Pattern Quiz...');

    // Create quiz manager instance
    quizManager = new ChartPatternQuiz();

    // Update stats
    updateStats();

    // Load first question automatically
    nextQuestion();

    console.log('✅ Chart Pattern Quiz initialized');
}

/**
 * Answer question
 */
function answerQuestion(answer) {
    if (!quizManager || !quizManager.currentPattern) {
        alert('Lütfen önce yeni bir soru yükleyin');
        return;
    }

    // Disable buttons
    disableButtons();

    // Check answer
    currentResult = quizManager.checkAnswer(answer);

    // Show feedback
    showFeedback(currentResult);

    // Update stats
    updateStats();
}

/**
 * Next question
 */
function nextQuestion() {
    // Hide feedback
    document.getElementById('quizFeedback').style.display = 'none';

    // Enable buttons
    enableButtons();

    // Get next pattern
    const pattern = quizManager.getNextPattern();

    // Update UI
    document.getElementById('patternTitle').innerHTML = `
        <i class="fas fa-chart-area"></i> ${pattern.title}
    `;

    document.getElementById('patternImage').src = pattern.image;
    document.getElementById('patternImage').alt = pattern.title;

    // Update difficulty badge
    const difficultyBadge = document.getElementById('patternDifficulty');
    difficultyBadge.textContent = pattern.difficulty === 'easy' ? 'KOLAY' :
                                   pattern.difficulty === 'medium' ? 'ORTA' : 'ZOR';
    difficultyBadge.className = `pattern-difficulty difficulty-${pattern.difficulty}`;

    // Reset button states
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
    });
}

/**
 * Show feedback
 */
function showFeedback(result) {
    const feedbackDiv = document.getElementById('quizFeedback');
    const headerDiv = document.getElementById('feedbackHeader');
    const explanationP = document.getElementById('feedbackExplanation');
    const termsDiv = document.getElementById('technicalTerms');

    // Set header
    if (result.correct) {
        headerDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Doğru! Tebrikler!</span>
        `;
        headerDiv.className = 'feedback-header feedback-correct';

        // Highlight correct button
        const btnId = result.correctAnswer === 'buy' ? 'btnBuy' :
                     result.correctAnswer === 'sell' ? 'btnSell' : 'btnWait';
        document.getElementById(btnId).classList.add('correct');
    } else {
        headerDiv.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>Yanlış! Doğru cevap: ${result.correctAnswer === 'buy' ? 'AL' : result.correctAnswer === 'sell' ? 'SAT' : 'BEKLE'}</span>
        `;
        headerDiv.className = 'feedback-header feedback-incorrect';

        // Highlight incorrect and correct buttons
        const userBtnId = result.userAnswer === 'buy' ? 'btnBuy' :
                         result.userAnswer === 'sell' ? 'btnSell' : 'btnWait';
        const correctBtnId = result.correctAnswer === 'buy' ? 'btnBuy' :
                            result.correctAnswer === 'sell' ? 'btnSell' : 'btnWait';

        document.getElementById(userBtnId).classList.add('incorrect');
        document.getElementById(correctBtnId).classList.add('correct');
    }

    // Set explanation
    explanationP.textContent = result.explanation;

    // Set technical terms
    termsDiv.innerHTML = result.technicalTerms.map(term => `
        <span class="term-badge">${term}</span>
    `).join('');

    // Show feedback
    feedbackDiv.style.display = 'block';

    // Scroll to feedback
    feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Update stats
 */
function updateStats() {
    const stats = quizManager.getStats();

    document.getElementById('quizAccuracy').textContent = stats.accuracy + '%';
    document.getElementById('quizScore').textContent = `${stats.score}/${stats.total}`;
    document.getElementById('quizLevel').textContent = stats.level;
    document.getElementById('quizRemaining').textContent = stats.remaining;
}

/**
 * Reset quiz
 */
function resetQuiz() {
    if (!confirm('Tüm ilerlemenizi sıfırlamak istediğinize emin misiniz?')) {
        return;
    }

    quizManager.reset();
    updateStats();
    nextQuestion();

    alert('✅ Quiz sıfırlandı!');
}

/**
 * Change mode (sequential/random)
 */
function changeMode() {
    const newMode = quizManager.mode === 'sequential' ? 'random' : 'sequential';
    quizManager.setMode(newMode);

    document.getElementById('modeText').textContent =
        newMode === 'sequential' ? 'Sıralı Mod' : 'Rastgele Mod';

    nextQuestion();
}

/**
 * Change difficulty
 */
function changeDifficulty(difficulty) {
    quizManager.filterByDifficulty(difficulty);
    nextQuestion();
}

/**
 * Disable buttons during feedback
 */
function disableButtons() {
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.disabled = true;
    });
}

/**
 * Enable buttons
 */
function enableButtons() {
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.disabled = false;
    });
}

// ================================================================================
// AUTO-INITIALIZE
// ================================================================================

// Initialize when grafikler page is shown
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on grafikler page
    const checkAndInit = () => {
        const grafiklerPage = document.getElementById('grafikler');
        if (grafiklerPage && grafiklerPage.classList.contains('active')) {
            if (!quizManager) {
                initChartQuiz();
            }
        }
    };

    // Initial check
    setTimeout(checkAndInit, 500);

    // Listen for page changes
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(checkAndInit, 300);
        });
    });
});

/**
 * Theory tab switching
 */
function showTheoryTab(tabName) {
    // Hide all theory content
    document.querySelectorAll('.theory-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active from all tabs
    document.querySelectorAll('.theory-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected content
    const selectedContent = document.getElementById(`theory-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Activate clicked tab
    event.target.closest('.theory-tab').classList.add('active');
}

// Make function globally available
window.showTheoryTab = showTheoryTab;

console.log('✅ Chart Quiz UI loaded');
