/**
 * BASIT CHATBOT - Sıfırdan
 * Karmaşık hiçbir şey yok
 */

(function() {
    'use strict';

    // Chatbot HTML'i oluştur
    function createChatWidget() {
        const html = `
            <style>
                #simple-chat-btn {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    z-index: 9998;
                }
                #simple-chat-btn:hover {
                    transform: scale(1.1);
                }
                #simple-chat-window {
                    position: fixed;
                    bottom: 100px;
                    right: 24px;
                    width: 400px;
                    max-width: calc(100vw - 48px);
                    height: 600px;
                    max-height: calc(100vh - 150px);
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    display: none;
                    flex-direction: column;
                    z-index: 9999;
                }
                #simple-chat-window.open { display: flex; }
                .chat-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 16px 16px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: #f7fafc;
                }
                .chat-message {
                    margin-bottom: 16px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    max-width: 80%;
                }
                .chat-message.bot {
                    background: white;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                .chat-message.user {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin-left: auto;
                }
                .chat-input-box {
                    border-top: 1px solid #e2e8f0;
                    padding: 16px;
                    background: white;
                    border-radius: 0 0 16px 16px;
                }
                .chat-input-box input {
                    width: 100%;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 10px 14px;
                    font-size: 14px;
                }
                .chat-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                }
            </style>

            <button id="simple-chat-btn">💬</button>

            <div id="simple-chat-window">
                <div class="chat-header">
                    <div>
                        <h3 style="margin: 0; font-size: 18px;">Finans Asistan</h3>
                        <span style="font-size: 12px; opacity: 0.9;">Çevrimiçi</span>
                    </div>
                    <button class="chat-close" id="chat-close-btn">✕</button>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <div class="chat-message bot">
                        👋 Merhaba! Ben Finans Asistan. Size nasıl yardımcı olabilirim?
                    </div>
                </div>

                <div class="chat-input-box">
                    <input type="text" id="chat-input" placeholder="Sorunuzu yazın..." />
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // Mesaj ekle
    function addMessage(text, isUser) {
        const messages = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = 'chat-message ' + (isUser ? 'user' : 'bot');
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Basit cevaplar (API olmadan demo)
    function getResponse(question) {
        const q = question.toLowerCase();

        if (q.includes('hisse') || q.includes('stock')) {
            return 'Hisse senedi, bir şirketin sermayesinin eşit paylara bölünmüş birimlerinden biridir. Hisse senedi alarak o şirketin ortağı olursunuz.';
        }
        if (q.includes('forex') || q.includes('döviz')) {
            return 'Forex, döviz piyasasıdır. Dünya genelinde günlük 6 trilyon dolar işlem hacmi olan en büyük finansal piyasadır.';
        }
        if (q.includes('bitcoin') || q.includes('kripto')) {
            return 'Bitcoin, ilk ve en bilinen kripto para birimidir. Merkezi olmayan, blockchain teknolojisi ile çalışır.';
        }
        if (q.includes('yatırım')) {
            return 'Yatırım yapmadan önce: Risk toleransınızı belirleyin, araştırma yapın, portföyünüzü çeşitlendirin ve uzun vadeli düşünün.';
        }

        return 'Bu konuda size nasıl yardımcı olabilirim? Hisse senedi, forex, kripto para veya yatırım hakkında sorular sorabilirsiniz.';
    }

    // Event listeners
    function setupEventListeners() {
        const btn = document.getElementById('simple-chat-btn');
        const closeBtn = document.getElementById('chat-close-btn');
        const chatWindow = document.getElementById('simple-chat-window');
        const input = document.getElementById('chat-input');

        btn.addEventListener('click', () => {
            chatWindow.classList.add('open');
            input.focus();
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('open');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                const question = input.value.trim();
                addMessage(question, true);
                input.value = '';

                // Typing indicator
                setTimeout(() => {
                    const response = getResponse(question);
                    addMessage(response, false);
                }, 500);
            }
        });
    }

    // Başlat
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createChatWidget();
                setupEventListeners();
                console.log('✅ Basit Chatbot yüklendi!');
            });
        } else {
            createChatWidget();
            setupEventListeners();
            console.log('✅ Basit Chatbot yüklendi!');
        }
    }

    init();
})();
