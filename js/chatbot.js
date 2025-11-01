/**
 * Finans Akademi - Chatbot Widget
 * Frontend chat interface for AI assistant
 */

class FinansChatbot {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'api/chat-api.php';
        this.sessionId = this.getOrCreateSessionId();
        this.history = [];
        this.isOpen = false;
        this.isTyping = false;

        this.init();
    }

    init() {
        // Create chat widget HTML
        this.createChatWidget();

        // Bind events
        this.bindEvents();

        // Load saved history
        this.loadHistory();
    }

    createChatWidget() {
        const widget = document.createElement('div');
        widget.id = 'finans-chatbot';
        widget.innerHTML = `
            <!-- Chat Toggle Button -->
            <button id="chat-toggle" class="chat-toggle" aria-label="Asistan ile Sohbet Et">
                <i class="fas fa-comments"></i>
                <span class="chat-badge" style="display: none;">1</span>
            </button>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window" style="display: none;">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="chat-header-info">
                        <i class="fas fa-robot"></i>
                        <div>
                            <h3>Finans Asistan</h3>
                            <span class="chat-status">Çevrimiçi</span>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button id="chat-minimize" class="chat-action-btn" aria-label="Küçült">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button id="chat-clear" class="chat-action-btn" aria-label="Sohbeti Temizle">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" class="chat-messages">
                    <!-- Welcome message -->
                    <div class="chat-message bot-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                👋 Merhaba! Ben Finans Asistan. Finans, yatırım ve borsa konularında size yardımcı olabilirim.

                                Sorularınızı yazabilirsiniz!
                            </div>
                            <div class="message-time">${this.formatTime(new Date())}</div>
                        </div>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div id="chat-typing" class="chat-typing" style="display: none;">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>Asistan yazıyor...</span>
                </div>

                <!-- Chat Input -->
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea
                            id="chat-input"
                            class="chat-input"
                            placeholder="Sorunuzu yazın..."
                            rows="1"
                            maxlength="1000"
                        ></textarea>
                        <button id="chat-send" class="chat-send-btn" aria-label="Gönder">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="chat-input-footer">
                        <span class="chat-char-count">0/1000</span>
                        <label class="chat-web-search">
                            <input type="checkbox" id="chat-force-web">
                            <span>Web'de ara</span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
    }

    bindEvents() {
        // Toggle chat window
        document.getElementById('chat-toggle').addEventListener('click', () => {
            this.toggleChat();
        });

        // Minimize chat
        document.getElementById('chat-minimize').addEventListener('click', () => {
            this.toggleChat();
        });

        // Clear chat
        document.getElementById('chat-clear').addEventListener('click', () => {
            this.clearChat();
        });

        // Send message
        document.getElementById('chat-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Input events
        const input = document.getElementById('chat-input');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
            this.autoResizeInput(e.target);
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chat-window');
        const chatBadge = document.querySelector('.chat-badge');

        if (this.isOpen) {
            chatWindow.style.display = 'flex';
            chatBadge.style.display = 'none';
            document.getElementById('chat-input').focus();
            this.scrollToBottom();
        } else {
            chatWindow.style.display = 'none';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || this.isTyping) return;

        // Clear input
        input.value = '';
        this.updateCharCount(0);
        this.autoResizeInput(input);

        // Add user message to UI
        this.addMessage('user', message);

        // Get force web search option
        const forceWebSearch = document.getElementById('chat-force-web').checked;

        // Show typing indicator
        this.showTyping();

        try {
            // Call API
            const response = await this.callAPI(message, forceWebSearch);

            // Hide typing indicator
            this.hideTyping();

            // Add bot response
            this.addMessage('assistant', response.data.answer, {
                sourceType: response.data.source_type,
                confidence: response.data.confidence,
                webSources: response.data.web_sources,
                responseTime: response.data.response_time_ms
            });

            // Save history
            this.saveHistory();

        } catch (error) {
            this.hideTyping();
            this.addMessage('assistant', `❌ Üzgünüm, bir hata oluştu: ${error.message}`, {
                isError: true
            });
        }
    }

    async callAPI(message, forceWebSearch = false) {
        // Use Gemini API directly (no backend needed!)
        const GEMINI_API_KEY = 'AIzaSyC779xiQuQ-RIPd5vCmGu5odXH8flH2kt4';
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

        const startTime = Date.now();

        try {
            // Collect market context from the page
            const marketContext = this.getMarketContext();

            // Build conversation history for Gemini
            const conversationHistory = this.history.slice(-10).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // System instruction as first message
            const systemPrompt = `Sen Finans Akademi'nin yapay zeka asistanısın. Türkçe konuşuyorsun.

GÖREVIN:
- Finans, borsa, hisse senedi, forex, kripto para, yatırım konularında yardım et
- Kullanıcıya site içindeki verileri göster (hisse fiyatları, endeksler, etc.)
- Eğitici ve anlaşılır ol, karmaşık terimleri açıkla
- Yatırım tavsiyesi verme, sadece bilgi ver

GÜNCEL PİYASA VERİLERİ:
${marketContext}

Kullanıcı sorularını bu verilerle yanıtla. Fiyatlar gerçek zamanlı!`;

            // Combine system prompt + history + current message
            const contents = [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                ...conversationHistory,
                {
                    role: 'user',
                    parts: [{ text: message }]
                }
            ];

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Gemini API error');
            }

            const data = await response.json();
            const responseTime = Date.now() - startTime;

            // Extract answer from Gemini response
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Üzgünüm, yanıt oluşturamadım.';

            return {
                data: {
                    answer: answer,
                    source_type: 'gemini_ai',
                    confidence: 0.95,
                    response_time_ms: responseTime,
                    web_sources: []
                }
            };

        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini hatası: ${error.message}`);
        }
    }

    /**
     * Collect current market data as context for AI
     */
    getMarketContext() {
        const context = [];

        // Get index values from Dashboard
        const indices = [
            { id: 'sp500', name: 'S&P 500' },
            { id: 'nasdaq', name: 'NASDAQ' },
            { id: 'dow', name: 'DOW JONES' },
            { id: 'bist100', name: 'BIST 100' },
            { id: 'usdtry', name: 'USD/TRY' },
            { id: 'eurtry', name: 'EUR/TRY' }
        ];

        indices.forEach(index => {
            const el = document.getElementById(index.id);
            const changeEl = document.getElementById(index.id + '-change');
            if (el && el.textContent !== '-') {
                const value = el.textContent;
                const change = changeEl ? changeEl.textContent : '';
                context.push(`${index.name}: ${value} ${change}`);
            }
        });

        // Get stock data if available
        if (window.STOCKS_DATA) {
            const usStocks = window.STOCKS_DATA.us_stocks || [];
            const bistStocks = window.STOCKS_DATA.bist_stocks || [];

            // Sample of stocks with prices
            const sampleStocks = [...usStocks, ...bistStocks]
                .filter(s => s.price > 0)
                .slice(0, 20);

            if (sampleStocks.length > 0) {
                context.push('\nÖRNEK HİSSELER:');
                sampleStocks.forEach(stock => {
                    const currency = stock.symbol.includes('THYAO') || stock.symbol.includes('GARAN') ? '₺' : '$';
                    context.push(`${stock.symbol} (${stock.name}): ${currency}${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%)`);
                });
            }
        }

        // Get Winners/Losers if available
        const winnersEl = document.getElementById('winners');
        const losersEl = document.getElementById('losers');

        if (winnersEl && winnersEl.textContent) {
            context.push('\nBUGÜNKÜ KAZANANLAR: ' + winnersEl.textContent);
        }

        if (losersEl && losersEl.textContent) {
            context.push('\nBUGÜNKÜ KAYBEDENLER: ' + losersEl.textContent);
        }

        return context.join('\n');
    }

    addMessage(role, text, metadata = {}) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');

        const isBot = role === 'assistant';
        messageDiv.className = `chat-message ${isBot ? 'bot-message' : 'user-message'}`;

        let metadataHTML = '';
        if (metadata.sourceType) {
            const sourceIcon = this.getSourceIcon(metadata.sourceType);
            const confidencePercent = Math.round(metadata.confidence * 100);

            metadataHTML = `
                <div class="message-metadata">
                    ${sourceIcon} ${this.getSourceText(metadata.sourceType)}
                    ${metadata.confidence ? `• ${confidencePercent}% güven` : ''}
                    ${metadata.responseTime ? `• ${metadata.responseTime}ms` : ''}
                </div>
            `;

            // Show web sources if available
            if (metadata.webSources && metadata.webSources.length > 0) {
                metadataHTML += '<div class="message-sources"><strong>Kaynaklar:</strong><ul>';
                metadata.webSources.forEach(source => {
                    const icon = source.is_trusted ? '✓' : '';
                    metadataHTML += `<li>${icon} <a href="${source.url}" target="_blank">${source.title}</a></li>`;
                });
                metadataHTML += '</ul></div>';
            }
        }

        messageDiv.innerHTML = `
            ${isBot ? `<div class="message-avatar"><i class="fas fa-robot"></i></div>` : ''}
            <div class="message-content">
                <div class="message-text ${metadata.isError ? 'error' : ''}">${this.formatMessage(text)}</div>
                ${metadataHTML}
                <div class="message-time">${this.formatTime(new Date())}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Update history
        this.history.push({
            role: role,
            content: text
        });
    }

    showTyping() {
        this.isTyping = true;
        document.getElementById('chat-typing').style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        document.getElementById('chat-typing').style.display = 'none';
    }

    clearChat() {
        if (!confirm('Sohbet geçmişini silmek istediğinize emin misiniz?')) {
            return;
        }

        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        this.history = [];
        this.sessionId = this.generateSessionId();
        this.saveSessionId();

        // Add welcome message
        this.addMessage('assistant', '👋 Sohbet temizlendi! Yeni sorularınız için buradayım.');
    }

    formatMessage(text) {
        // Convert markdown-style formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
        text = text.replace(/\n/g, '<br>'); // Line breaks

        return text;
    }

    formatTime(date) {
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getSourceIcon(sourceType) {
        const icons = {
            'site_content': '<i class="fas fa-book"></i>',
            'web_search': '<i class="fas fa-globe"></i>',
            'hybrid': '<i class="fas fa-layer-group"></i>',
            'fallback': '<i class="fas fa-question-circle"></i>',
            'gemini_ai': '<i class="fas fa-sparkles"></i>'
        };
        return icons[sourceType] || '';
    }

    getSourceText(sourceType) {
        const texts = {
            'site_content': 'Site içeriği',
            'web_search': 'Web araması',
            'hybrid': 'Karma kaynak',
            'fallback': 'Genel bilgi',
            'gemini_ai': 'Gemini AI'
        };
        return texts[sourceType] || 'Bilinmiyor';
    }

    updateCharCount(count) {
        document.querySelector('.chat-char-count').textContent = `${count}/1000`;
    }

    autoResizeInput(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // Session management
    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('finans_chat_session_id');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            this.saveSessionId();
        }
        return sessionId;
    }

    saveSessionId() {
        localStorage.setItem('finans_chat_session_id', this.sessionId);
    }

    saveHistory() {
        localStorage.setItem('finans_chat_history', JSON.stringify(this.history.slice(-20))); // Last 20
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('finans_chat_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
    }
}

// Initialize chatbot when DOM is ready
function initChatbot() {
    if (!window.finansChatbot) {
        try {
            window.finansChatbot = new FinansChatbot({
                apiUrl: 'api/chat-api.php'
            });
            console.log('✅ Finans Chatbot initialized');
        } catch (error) {
            console.error('❌ Chatbot initialization failed:', error);
        }
    }
}

// Try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    // DOM already loaded, initialize immediately
    initChatbot();
}
