// News Manager - Fetch and display financial news
// Uses multiple free sources for reliable news feed

class NewsManager {
    constructor() {
        this.allNews = [];
        this.filteredNews = [];
        this.loading = false;
        this.currentCategory = 'all';
        this.currentSort = 'time';
        this.searchQuery = '';

        this.sources = {
            // Alpha Vantage News API (Free tier: 25 requests/day)
            alphaVantage: 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=technology,finance&apikey=demo',

            // NewsAPI.org (Free tier: 100 requests/day)
            // newsApi: 'https://newsapi.org/v2/everything?q=stock+OR+finance&language=en&sortBy=publishedAt&apiKey=YOUR_KEY',

            // Finnhub (Free tier: 60 calls/minute)
            // finnhub: 'https://finnhub.io/api/v1/news?category=general&token=YOUR_TOKEN'
        };

        // Fallback static Turkish news
        this.turkishNews = this.getTurkishStaticNews();

        // Category definitions
        this.categories = {
            all: { name: 'Tüm Haberler', keywords: [] },
            realtime: { name: 'Güncel', keywords: ['son dakika', 'canlı', 'şimdi', 'bugün'] },
            turkey: { name: 'Türkiye', keywords: ['TCMB', 'BIST', 'TL', 'Türkiye', 'İstanbul', 'Ankara'] },
            world: { name: 'Dünya', keywords: ['Fed', 'ECB', 'ABD', 'Avrupa', 'Çin', 'global'] },
            stocks: { name: 'Hisse', keywords: ['hisse', 'borsa', 'BIST', 'endeks', 'hisse senedi'] },
            crypto: { name: 'Kripto', keywords: ['Bitcoin', 'kripto', 'Ethereum', 'coin', 'blockchain'] },
            analysis: { name: 'Analiz', keywords: ['analiz', 'tahmin', 'beklenti', 'görüş', 'strateji'] },
            currency: { name: 'Döviz', keywords: ['dolar', 'euro', 'döviz', 'kur', 'parite'] },
            commodity: { name: 'Emtia', keywords: ['altın', 'petrol', 'emtia', 'metal', 'enerji'] }
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadNews();
    }

    async loadNews() {
        this.loading = true;
        this.showLoadingState();

        try {
            // Try to fetch real news from Alpha Vantage (demo)
            const response = await fetch(this.sources.alphaVantage);

            if (response.ok) {
                const data = await response.json();

                if (data.feed && data.feed.length > 0) {
                    this.allNews = this.parseAlphaVantageNews(data.feed);
                    console.log('✅ Real-time news loaded:', this.allNews.length);
                } else {
                    console.log('⚠️ API limit reached, using Turkish static news');
                    this.allNews = this.turkishNews;
                }
            } else {
                console.log('⚠️ News API unavailable, using Turkish static news');
                this.allNews = this.turkishNews;
            }
        } catch (error) {
            console.error('❌ Error fetching news:', error);
            this.allNews = this.turkishNews;
        }

        this.loading = false;
        this.applyFilters();
    }

    /**
     * Search news
     */
    search(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.applyFilters();
    }

    /**
     * Filter by category
     */
    filterByCategory(category) {
        this.currentCategory = category;
        this.applyFilters();
    }

    /**
     * Sort news
     */
    sortNews(sortType) {
        this.currentSort = sortType;
        this.applyFilters();
    }

    /**
     * Apply all filters
     */
    applyFilters() {
        let filtered = [...this.allNews];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(news =>
                news.title.toLowerCase().includes(this.searchQuery) ||
                news.summary.toLowerCase().includes(this.searchQuery) ||
                (news.topics && news.topics.some(t => t.toLowerCase().includes(this.searchQuery)))
            );
        }

        // Apply category filter
        if (this.currentCategory !== 'all') {
            const categoryKeywords = this.categories[this.currentCategory].keywords;
            filtered = filtered.filter(news => {
                const text = `${news.title} ${news.summary} ${news.topics ? news.topics.join(' ') : ''}`.toLowerCase();
                return categoryKeywords.some(keyword => text.includes(keyword.toLowerCase()));
            });
        }

        // Apply sorting
        filtered = this.sortNewsByType(filtered, this.currentSort);

        this.filteredNews = filtered;
        this.renderNews();
        this.updateStats();
    }

    /**
     * Sort news by type
     */
    sortNewsByType(news, sortType) {
        const sorted = [...news];

        switch (sortType) {
            case 'time':
                // Already sorted by time (most recent first)
                break;

            case 'sentiment-positive':
                sorted.sort((a, b) => {
                    const scoreA = this.getSentimentScore(a.sentiment.class);
                    const scoreB = this.getSentimentScore(b.sentiment.class);
                    return scoreB - scoreA;
                });
                break;

            case 'sentiment-negative':
                sorted.sort((a, b) => {
                    const scoreA = this.getSentimentScore(a.sentiment.class);
                    const scoreB = this.getSentimentScore(b.sentiment.class);
                    return scoreA - scoreB;
                });
                break;

            case 'source':
                sorted.sort((a, b) => a.source.localeCompare(b.source));
                break;
        }

        return sorted;
    }

    /**
     * Get sentiment score for sorting
     */
    getSentimentScore(sentimentClass) {
        const scores = {
            'positive': 2,
            'slightly-positive': 1,
            'neutral': 0,
            'slightly-negative': -1,
            'negative': -2
        };
        return scores[sentimentClass] || 0;
    }

    /**
     * Update stats display
     */
    updateStats() {
        const statsEl = document.getElementById('newsStats');
        if (!statsEl) return;

        const totalCount = this.allNews.length;
        const filteredCount = this.filteredNews.length;

        let statsText = `${filteredCount} haber`;
        if (filteredCount !== totalCount) {
            statsText += ` (${totalCount} haberden)`;
        }

        statsEl.textContent = statsText;
    }

    parseAlphaVantageNews(feed) {
        return feed.slice(0, 20).map(item => ({
            title: item.title,
            summary: item.summary || item.title,
            source: item.source || 'Financial News',
            url: item.url,
            image: item.banner_image,
            time: this.getTimeAgo(item.time_published),
            sentiment: this.getSentimentBadge(item.overall_sentiment_score),
            topics: item.topics ? item.topics.map(t => t.topic) : []
        }));
    }

    getSentimentBadge(score) {
        if (!score) return { label: 'Nötr', class: 'neutral' };

        if (score > 0.35) return { label: 'Pozitif', class: 'positive' };
        if (score > 0.15) return { label: 'Hafif Pozitif', class: 'slightly-positive' };
        if (score < -0.35) return { label: 'Negatif', class: 'negative' };
        if (score < -0.15) return { label: 'Hafif Negatif', class: 'slightly-negative' };

        return { label: 'Nötr', class: 'neutral' };
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'Bilinmiyor';

        // Parse timestamp: 20240131T123000
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);

        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;

        return date.toLocaleDateString('tr-TR');
    }

    getTurkishStaticNews() {
        const now = new Date();
        const today = now.toLocaleDateString('tr-TR');

        return [
            {
                title: "TCMB Faiz Kararı Beklentileri Yükseliyor",
                summary: "Merkez Bankası'nın bu ay yapacağı toplantıda faiz artırımı beklentileri güçleniyor. Enflasyon verilerinin ardından piyasalar %50 üzeri faiz seviyesine hazırlanıyor.",
                source: "Bloomberg HT",
                url: "https://www.bloomberght.com",
                image: null,
                time: "2 saat önce",
                sentiment: { label: 'Hafif Negatif', class: 'slightly-negative' },
                topics: ['TCMB', 'Faiz', 'Enflasyon']
            },
            {
                title: "BIST 100 Yeni Zirveyi Test Ediyor",
                summary: "Borsa İstanbul'da BIST 100 endeksi, yabancı alımlarının desteğiyle tarihi zirvelere yaklaşıyor. Teknik analistler 10.000 seviyesinin test edilebileceğini öngörüyor.",
                source: "Para Analiz",
                url: "https://www.paraanaliz.com",
                image: null,
                time: "4 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['BIST', 'Borsa', 'Teknik Analiz']
            },
            {
                title: "Dolar/TL Kurunda Düşüş Eğilimi Sürüyor",
                summary: "Merkez Bankası'nın sıkı para politikası ve rezerv artışları etkisiyle dolar/TL paritesi düşüş trendinde. Analistler bu trendin sürmesini bekliyor.",
                source: "Dünya Gazetesi",
                url: "https://www.dunya.com",
                image: null,
                time: "5 saat önce",
                sentiment: { label: 'Hafif Pozitif', class: 'slightly-positive' },
                topics: ['Döviz', 'TL', 'Dolar']
            },
            {
                title: "NVIDIA'nın Yeni Yapay Zeka Çipi Piyasaları Hareketlendirdi",
                summary: "NVIDIA'nın duyurduğu yeni nesil AI çipi, teknoloji hisselerinde ralliye neden oldu. Hisse senedi %8 değer kazanarak rekor kırdı.",
                source: "TechCrunch",
                url: "https://techcrunch.com",
                image: null,
                time: "6 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['NVIDIA', 'AI', 'Teknoloji']
            },
            {
                title: "Fed Başkanı Powell: Enflasyon Hedefine Ulaşmak İçin Daha Fazla Zaman Gerekli",
                summary: "Federal Reserve Başkanı Jerome Powell, enflasyonla mücadelede sabırlı olunması gerektiğini vurgulayarak faiz indirimi konusunda acele etmeyeceklerini belirtti.",
                source: "Reuters",
                url: "https://www.reuters.com",
                image: null,
                time: "8 saat önce",
                sentiment: { label: 'Nötr', class: 'neutral' },
                topics: ['Fed', 'Enflasyon', 'ABD']
            },
            {
                title: "Tesla'nın Üretim Rakamları Beklentileri Aştı",
                summary: "Tesla'nın açıkladığı çeyrek sonu üretim rakamları analist beklentilerinin üzerinde geldi. Model Y üretimi rekor seviyeye ulaştı.",
                source: "Bloomberg",
                url: "https://www.bloomberg.com",
                image: null,
                time: "10 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['Tesla', 'Otomotiv', 'Üretim']
            },
            {
                title: "Kripto Piyasalarında Yükseliş Devam Ediyor",
                summary: "Bitcoin 70.000 dolar seviyesini aşarken, Ethereum da güçlü performans sergiliyor. Kurumsal yatırımcıların ilgisi artıyor.",
                source: "Coindesk",
                url: "https://www.coindesk.com",
                image: null,
                time: "12 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['Bitcoin', 'Kripto', 'Ethereum']
            },
            {
                title: "THYAO Hisselerinde Yükseliş Sürüyor",
                summary: "Türk Hava Yolları hisseleri, artan yolcu sayıları ve olumlu finansal sonuçlarla birlikte son 1 ayda %15 değer kazandı.",
                source: "Foreks",
                url: "https://www.foreks.com",
                image: null,
                time: "14 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['THYAO', 'Havacılık', 'BIST']
            },
            {
                title: "Altın Fiyatları Yeni Zirve Yaptı",
                summary: "Ons altın fiyatı jeopolitik riskler ve zayıf dolar etkisiyle 2.400 dolar seviyesini aşarak tarihi rekor kırdı.",
                source: "Kitco",
                url: "https://www.kitco.com",
                image: null,
                time: "1 gün önce",
                sentiment: { label: 'Hafif Pozitif', class: 'slightly-positive' },
                topics: ['Altın', 'Emtia', 'Güvenli Liman']
            },
            {
                title: "Apple'ın Yeni iPhone Modelleri Satışa Çıkıyor",
                summary: "Apple'ın merakla beklenen iPhone 16 serisi önümüzdeki hafta satışa çıkıyor. Yapay zeka özellikleri ön planda.",
                source: "MacRumors",
                url: "https://www.macrumors.com",
                image: null,
                time: "1 gün önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['Apple', 'iPhone', 'Teknoloji']
            },
            {
                title: "Avrupa Merkez Bankası Faiz İndirimine Gidebilir",
                summary: "ECB yetkilileri, enflasyonun düşüş trendinde olması nedeniyle faiz indirimi sinyalleri veriyor. Haziran ayı toplantısı kritik.",
                source: "Financial Times",
                url: "https://www.ft.com",
                image: null,
                time: "1 gün önce",
                sentiment: { label: 'Hafif Pozitif', class: 'slightly-positive' },
                topics: ['ECB', 'Avrupa', 'Faiz']
            },
            {
                title: "Enerji Hisseleri Petrol Fiyatlarıyla Yükseliyor",
                summary: "Brent petrol 90 dolar seviyesini aşarken, enerji sektörü hisseleri güçlü performans sergiliyor. OPEC+ üretim kısıtlamaları etkili.",
                source: "Oil Price",
                url: "https://oilprice.com",
                image: null,
                time: "2 gün önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['Petrol', 'Enerji', 'OPEC']
            }
        ];
    }

    showLoadingState() {
        const newsContainer = document.getElementById('newsContainer');
        if (!newsContainer) return;

        newsContainer.innerHTML = `
            <div class="news-loading">
                <div class="loading-spinner"></div>
                <p>Haberler yükleniyor...</p>
            </div>
        `;
    }

    renderNews() {
        const newsContainer = document.getElementById('newsContainer');
        if (!newsContainer) return;

        if (this.filteredNews.length === 0) {
            const emptyMessage = this.searchQuery || this.currentCategory !== 'all'
                ? 'Arama kriterlerine uygun haber bulunamadı. Filtreleri değiştirmeyi deneyin.'
                : 'Şu anda haber bulunamadı.';

            newsContainer.innerHTML = `
                <div class="news-empty">
                    <i class="fas fa-newspaper"></i>
                    <p>${emptyMessage}</p>
                    ${this.searchQuery || this.currentCategory !== 'all' ? `
                        <button class="btn btn-secondary" onclick="window.newsManager.clearFilters()">
                            <i class="fas fa-times"></i> Filtreleri Temizle
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        const newsHTML = this.filteredNews.map(item => `
            <article class="news-card">
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="news-image">` : ''}
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-source">${item.source}</span>
                        <span class="news-time">${item.time}</span>
                        <span class="sentiment-badge ${item.sentiment.class}">${item.sentiment.label}</span>
                    </div>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-summary">${item.summary}</p>
                    ${item.topics && item.topics.length > 0 ? `
                        <div class="news-topics">
                            ${item.topics.slice(0, 3).map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                        </div>
                    ` : ''}
                    <a href="${item.url}" target="_blank" class="news-link">
                        Devamını Oku <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </article>
        `).join('');

        newsContainer.innerHTML = newsHTML;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.searchQuery = '';
        this.currentCategory = 'all';
        this.currentSort = 'time';

        // Reset UI
        const searchInput = document.getElementById('newsSearch');
        if (searchInput) searchInput.value = '';

        const sortSelect = document.getElementById('newsSort');
        if (sortSelect) sortSelect.value = 'time';

        // Reset category tabs
        document.querySelectorAll('.news-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === 'all') {
                tab.classList.add('active');
            }
        });

        this.applyFilters();
    }

    /**
     * Refresh news
     */
    async refresh() {
        await this.loadNews();
        this.renderNews();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('newsSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 300);
            });
        }

        // Sort select
        const sortSelect = document.getElementById('newsSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortNews(e.target.value);
            });
        }

        // Category tabs
        document.querySelectorAll('.news-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));

                // Add active to clicked tab
                tab.classList.add('active');

                // Filter by category
                this.filterByCategory(tab.dataset.category);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshNews');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Export for use in other modules
window.NewsManager = NewsManager;
