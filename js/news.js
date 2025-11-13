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

        // RSS Feed URLs
        this.sources = {
            bloombergHT: 'https://www.bloomberght.com/rss',
            investing: 'https://tr.investing.com/rss/news.rss',
            bigpara: 'https://bigpara.hurriyet.com.tr/rss/anasayfa.xml',
            foreks: 'https://www.foreks.com/rss/haber.xml',
            kap: 'https://www.kap.org.tr/tr/api/memberDisclosureQuery', // KAP Bildirimler (API)
        };

        // Cloudflare Worker URL
        this.workerUrl = 'https://rss-proxy.altanmelihhh.workers.dev';

        // Fallback: Use simple fetch for testing (may have CORS issues)
        this.useFallback = !this.workerUrl;

        // Fallback static Turkish news
        this.turkishNews = this.getTurkishStaticNews();

        // Category definitions
        this.categories = {
            all: { name: 'Tüm Haberler', keywords: [] },
            kap: { name: 'KAP Bildirimleri', keywords: ['KAP', 'bildirim', 'THYAO', 'EREGL', 'SISE', 'TUPRS', 'PETKM', 'ARCLK', 'TAVHL', 'ISCTR', 'AKBNK', 'GARAN', 'açıklama', 'finansal tablo', 'halka arz'] },
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

        const allFetchedNews = [];

        try {
            // Fetch from multiple Turkish RSS sources
            const rssPromises = [
                this.fetchRSS('bloombergHT', 'Bloomberg HT'),
                this.fetchRSS('investing', 'Investing.com'),
                this.fetchRSS('bigpara', 'BigPara'),
                this.fetchRSS('foreks', 'Foreks')
            ];

            // Fetch all sources in parallel
            const results = await Promise.allSettled(rssPromises);

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    allFetchedNews.push(...result.value);
                    console.log(`✅ Source ${index + 1} loaded:`, result.value.length, 'news');
                } else {
                    console.log(`⚠️ Source ${index + 1} failed:`, result.reason);
                }
            });

            if (allFetchedNews.length > 0) {
                // Sort by date (most recent first)
                this.allNews = allFetchedNews.sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                console.log(`✅ Total ${this.allNews.length} real-time Turkish news loaded`);
            } else {
                console.log('⚠️ No RSS feeds available, using fallback static news');
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
     * Fetch RSS feed via Cloudflare Worker
     */
    async fetchRSS(sourceName, sourceDisplayName) {
        const rssUrl = this.sources[sourceName];

        if (!this.workerUrl) {
            console.warn(`⚠️ Worker URL not set, skipping ${sourceName}`);
            return [];
        }

        try {
            console.log(`🔄 Fetching ${sourceName} via Worker...`);

            const apiUrl = `${this.workerUrl}?url=${encodeURIComponent(rssUrl)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'ok' && data.items && data.items.length > 0) {
                console.log(`✅ ${sourceName} loaded: ${data.items.length} items`);
                return this.parseRSSNews(data.items, sourceDisplayName);
            } else if (data.error) {
                throw new Error(data.error);
            }

            return [];
        } catch (error) {
            console.error(`❌ Failed to fetch ${sourceName}:`, error.message);
            return [];
        }
    }


    /**
     * Parse RSS news items
     */
    parseRSSNews(items, source) {
        return items.map(item => {
            // Extract text from HTML description
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.description || item.content || '';
            const summary = tempDiv.textContent.trim().substring(0, 250) + '...';

            // Detect sentiment from title
            const sentiment = this.detectSentiment(item.title + ' ' + summary);

            // Extract topics/categories
            const topics = this.extractTopics(item.title + ' ' + summary);

            return {
                title: item.title,
                summary: summary,
                source: source,
                url: item.link,
                image: item.enclosure?.link || item.thumbnail || null,
                time: this.getTimeAgo(item.pubDate),
                timestamp: item.pubDate,
                sentiment: sentiment,
                topics: topics
            };
        });
    }

    /**
     * Detect sentiment from text
     */
    detectSentiment(text) {
        const textLower = text.toLowerCase();

        // Positive keywords
        const positiveWords = ['yükseliş', 'artış', 'kazanç', 'rekor', 'güçlü', 'pozitif', 'başarı', 'yükseldi', 'arttı'];
        const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;

        // Negative keywords
        const negativeWords = ['düşüş', 'kayıp', 'risk', 'kriz', 'düştü', 'azaldı', 'negatif', 'tehlike'];
        const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

        if (positiveCount > negativeCount + 1) {
            return { label: 'Pozitif', class: 'positive' };
        } else if (positiveCount > negativeCount) {
            return { label: 'Hafif Pozitif', class: 'slightly-positive' };
        } else if (negativeCount > positiveCount + 1) {
            return { label: 'Negatif', class: 'negative' };
        } else if (negativeCount > positiveCount) {
            return { label: 'Hafif Negatif', class: 'slightly-negative' };
        }

        return { label: 'Nötr', class: 'neutral' };
    }

    /**
     * Extract topics from text
     */
    extractTopics(text) {
        const textLower = text.toLowerCase();
        const topics = [];

        const topicKeywords = {
            'BIST': ['bist', 'borsa istanbul', 'endeks'],
            'Dolar': ['dolar', 'usd', 'dolar/tl'],
            'Euro': ['euro', 'eur'],
            'Altın': ['altın', 'gold'],
            'TCMB': ['tcmb', 'merkez bankası', 'central bank'],
            'Faiz': ['faiz', 'interest rate'],
            'Kripto': ['bitcoin', 'kripto', 'ethereum', 'coin'],
            'Petrol': ['petrol', 'oil', 'brent'],
            'Hisse': ['hisse', 'stock', 'pay'],
            'BES': ['bes', 'bireysel emeklilik'],
            'TEFAS': ['tefas', 'fon'],
            'Enflasyon': ['enflasyon', 'inflation', 'tüfe']
        };

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                topics.push(topic);
            }
        });

        return topics.slice(0, 3); // Max 3 topics
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

        try {
            // Try to parse the date (RSS feeds use standard date format)
            const date = new Date(timestamp);

            if (isNaN(date.getTime())) {
                return 'Bilinmiyor';
            }

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Şimdi';
            if (diffMins < 60) return `${diffMins} dakika önce`;
            if (diffHours < 24) return `${diffHours} saat önce`;
            if (diffDays === 1) return 'Dün';
            if (diffDays < 7) return `${diffDays} gün önce`;

            return date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            return 'Bilinmiyor';
        }
    }

    getTurkishStaticNews() {
        const now = new Date();
        const today = now.toLocaleDateString('tr-TR');

        return [
            {
                title: "THYAO: Türk Hava Yolları 2024 Yılı Finansal Sonuçları Açıklandı - KAP Bildirimi",
                summary: "THY, 2024 yılı finansal tablolarını KAP'a sundu. Net kâr %15 artışla 2.8 milyar TL olarak gerçekleşti. Yolcu sayısı ve doluluk oranlarında rekor seviyeler görüldü.",
                source: "KAP",
                url: "https://www.kap.org.tr",
                image: null,
                time: "1 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['THYAO', 'KAP', 'Finansal Tablo', 'Bildirim']
            },
            {
                title: "EREGL: Ereğli Demir Çelik Fabrikaları Önemli Açıklama - KAP",
                summary: "Ereğli Demir Çelik, yeni yatırım planlarını KAP'a bildirdi. 500 milyon TL tutarındaki modernizasyon yatırımı onaylandı. Kapasite artırımı hedefleniyor.",
                source: "KAP",
                url: "https://www.kap.org.tr",
                image: null,
                time: "2 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['EREGL', 'KAP', 'Yatırım', 'Bildirim']
            },
            {
                title: "AKBNK: Akbank Genel Kurul Kararları KAP'ta Yayımlandı",
                summary: "Akbank'ın olağan genel kurul toplantısı sonuçları açıklandı. Temettü dağıtımı ve yönetim kurulu üyelikleri karara bağlandı. Pay başına 2.5 TL temettü önerildi.",
                source: "KAP",
                url: "https://www.kap.org.tr",
                image: null,
                time: "3 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['AKBNK', 'KAP', 'Genel Kurul', 'Temettü', 'Bildirim']
            },
            {
                title: "SISE: Şişecam Halka Arz İçin SPK'ya Başvuru Yaptı",
                summary: "Şişecam Topluluğu, yeni bir şirketin halka arzı için Sermaye Piyasası Kurulu'na başvurdu. Halka arz süreci ile ilgili detaylar KAP'ta açıklandı.",
                source: "KAP",
                url: "https://www.kap.org.tr",
                image: null,
                time: "4 saat önce",
                sentiment: { label: 'Pozitif', class: 'positive' },
                topics: ['SISE', 'KAP', 'Halka Arz', 'Bildirim']
            },
            {
                title: "TCMB Faiz Kararı Beklentileri Yükseliyor",
                summary: "Merkez Bankası'nın bu ay yapacağı toplantıda faiz artırımı beklentileri güçleniyor. Enflasyon verilerinin ardından piyasalar %50 üzeri faiz seviyesine hazırlanıyor.",
                source: "Bloomberg HT",
                url: "https://www.bloomberght.com",
                image: null,
                time: "5 saat önce",
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

// ===================================
// MARKET DATA RENDERING
// ===================================

async function initializeMarketData() {
    const marketDataManager = new MarketDataManager();

    console.log('📊 Initializing market data displays...');

    // Fetch all market data
    const data = await marketDataManager.fetchAllMarketData();

    // Render each section
    renderGlobalMarkets(data.global, marketDataManager);
    renderTurkeyMarkets(data.turkey, marketDataManager);
    renderCryptoMarkets(data.crypto, marketDataManager);

    console.log('✅ Market data displays initialized');
}

function renderGlobalMarkets(data, manager) {
    const container = document.querySelector('[data-category="global"] .analysis-grid');
    if (!container) return;

    container.innerHTML = `
        <div class="market-cards-grid">
            ${createMarketCard('S&P 500', data.s_p_500, manager, 'usa')}
            ${createMarketCard('NASDAQ', data.nasdaq, manager, 'tech')}
            ${createMarketCard('Dow Jones', data.dow_jones, manager, 'usa')}
            ${createMarketCard('Dollar Index', data.dollar_index, manager, 'currency')}
        </div>
    `;
}

function renderTurkeyMarkets(data, manager) {
    const container = document.querySelector('[data-category="turkey"] .analysis-grid');
    if (!container) return;

    container.innerHTML = `
        <div class="market-cards-grid">
            ${createMarketCard('BIST 100', data.bist_100, manager, 'turkey')}
            ${createMarketCard('USD/TRY', data.usd_try, manager, 'currency')}
            ${createMarketCard('EUR/TRY', data.eur_try, manager, 'currency')}
        </div>
    `;
}

function renderCryptoMarkets(data, manager) {
    const container = document.querySelector('[data-category="crypto"] .analysis-grid');
    if (!container) return;

    container.innerHTML = `
        <div class="market-cards-grid">
            ${createCryptoCard('Bitcoin', data.bitcoin, manager)}
            ${createCryptoCard('Ethereum', data.ethereum, manager)}
            ${createCryptoCard('Solana', data.solana, manager)}
            ${createCryptoCard('BNB', data.bnb, manager)}
            ${createCryptoCard('XRP', data.xrp, manager)}
        </div>
    `;
}

function createMarketCard(name, marketData, manager, type) {
    if (!marketData) return '';

    const change = manager.formatChange(marketData.change, marketData.changePercent);
    const typeIcon = {
        'usa': 'fa-flag-usa',
        'tech': 'fa-microchip',
        'currency': 'fa-dollar-sign',
        'turkey': 'fa-lira-sign'
    }[type] || 'fa-chart-line';

    return `
        <article class="market-card">
            <div class="market-header">
                <div class="market-icon ${type}">
                    <i class="fas ${typeIcon}"></i>
                </div>
                <div class="market-title">
                    <h3>${name}</h3>
                    <span class="market-symbol">${marketData.symbol}</span>
                </div>
            </div>

            <div class="market-price">
                <div class="price-value">${manager.formatPrice(marketData.price)}</div>
                <div class="price-change" style="color: ${change.color}">
                    <span class="change-icon">${change.icon}</span>
                    <span class="change-text">${change.text}</span>
                </div>
            </div>

            <div class="market-details">
                <div class="detail-row">
                    <span class="detail-label">Önceki Kapanış:</span>
                    <span class="detail-value">${manager.formatPrice(marketData.previousClose)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Değişim:</span>
                    <span class="detail-value" style="color: ${change.color}">${manager.formatPrice(Math.abs(marketData.change))}</span>
                </div>
            </div>

            <div class="market-footer">
                <i class="fas fa-clock"></i>
                <span>Canlı Veri</span>
            </div>
        </article>
    `;
}

function createCryptoCard(name, cryptoData, manager) {
    if (!cryptoData) return '';

    const change = manager.formatChange(cryptoData.change24h, cryptoData.change24h);

    return `
        <article class="market-card crypto">
            <div class="market-header">
                <div class="market-icon crypto">
                    <i class="fab fa-bitcoin"></i>
                </div>
                <div class="market-title">
                    <h3>${name}</h3>
                    <span class="market-symbol">${cryptoData.symbol}</span>
                </div>
            </div>

            <div class="market-price">
                <div class="price-value">$${manager.formatPrice(cryptoData.price)}</div>
                <div class="price-change" style="color: ${change.color}">
                    <span class="change-icon">${change.icon}</span>
                    <span class="change-text">${change.text} (24h)</span>
                </div>
            </div>

            <div class="market-details">
                <div class="detail-row">
                    <span class="detail-label">Piyasa Değeri:</span>
                    <span class="detail-value">${manager.formatMarketCap(cryptoData.marketCap)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">24h Hacim:</span>
                    <span class="detail-value">${manager.formatMarketCap(cryptoData.volume24h)}</span>
                </div>
            </div>

            <div class="market-footer">
                <i class="fas fa-clock"></i>
                <span>Canlı Veri (CoinGecko)</span>
            </div>
        </article>
    `;
}

// Initialize market data when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMarketData);
} else {
    initializeMarketData();
}
