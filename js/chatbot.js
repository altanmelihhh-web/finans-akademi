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
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: this.sessionId,
                history: this.history,
                force_web_search: forceWebSearch
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        return await response.json();
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
            'fallback': '<i class="fas fa-question-circle"></i>'
        };
        return icons[sourceType] || '';
    }

    getSourceText(sourceType) {
        const texts = {
            'site_content': 'Site içeriği',
            'web_search': 'Web araması',
            'hybrid': 'Karma kaynak',
            'fallback': 'Genel bilgi'
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
document.addEventListener('DOMContentLoaded', () => {
    window.finansChatbot = new FinansChatbot({
        apiUrl: 'api/chat-api.php'
    });
});
