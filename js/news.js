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
            // Turkish RSS Feeds (Free, no API key needed)
            bloombergHT: 'https://www.bloomberght.com/rss',
            investing: 'https://tr.investing.com/rss/news.rss',
            mynet: 'https://finans.mynet.com/rss/ekonomi',
            bigpara: 'https://bigpara.hurriyet.com.tr/rss/anasayfa.xml',
            foreks: 'https://www.foreks.com/rss/haber.xml',

            // Backup: Alpha Vantage (limited)
            alphaVantage: 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=finance&apikey=demo'
        };

        // Multiple RSS to JSON converter APIs (with fallbacks)
        this.rssConverters = [
            // AllOrigins (CORS proxy - unlimited, free)
            {
                name: 'AllOrigins',
                urlTemplate: (rssUrl) => `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
            },
            // RSS2JSON (10k/day limit)
            {
                name: 'RSS2JSON',
                urlTemplate: (rssUrl) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=20`
            },
            // Corsproxy.io (free, no limits)
            {
                name: 'CorsProxy',
                urlTemplate: (rssUrl) => `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`
            }
        ];

        this.currentConverterIndex = 0;

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
     * Fetch RSS feed with multiple converter fallbacks
     */
    async fetchRSS(sourceName, sourceDisplayName) {
        const rssUrl = this.sources[sourceName];

        // Try each converter
        for (let i = 0; i < this.rssConverters.length; i++) {
            const converter = this.rssConverters[i];

            try {
                console.log(`🔄 Trying ${converter.name} for ${sourceName}...`);
                const apiUrl = converter.urlTemplate(rssUrl);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    console.warn(`❌ ${converter.name} failed with HTTP ${response.status}`);
                    continue;
                }

                let data;

                // Get data based on converter
                if (converter.name === 'CorsProxy') {
                    // CorsProxy returns raw text/XML
                    data = await response.text();
                } else {
                    // Others return JSON
                    data = await response.json();
                }

                // Parse based on converter type
                let items = null;

                if (converter.name === 'AllOrigins') {
                    // AllOrigins wraps content in 'contents'
                    if (data.contents) {
                        items = this.parseXMLFromAllOrigins(data.contents);
                    }
                } else if (converter.name === 'RSS2JSON') {
                    // RSS2JSON returns structured JSON
                    if (data.status === 'ok' && data.items) {
                        items = data.items;
                    }
                } else if (converter.name === 'CorsProxy') {
                    // CorsProxy returns raw XML string
                    items = this.parseXMLString(data);
                }

                if (items && items.length > 0) {
                    console.log(`✅ ${converter.name} succeeded for ${sourceName}: ${items.length} items`);
                    return this.parseRSSNews(items, sourceDisplayName);
                }
            } catch (error) {
                console.warn(`❌ ${converter.name} error for ${sourceName}:`, error.message);
                continue;
            }
        }

        console.error(`❌ All converters failed for ${sourceName}`);
        return [];
    }

    /**
     * Parse XML from AllOrigins response
     */
    parseXMLFromAllOrigins(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            return this.extractItemsFromXML(xmlDoc);
        } catch (error) {
            console.error('XML parse error:', error);
            return null;
        }
    }

    /**
     * Parse XML string
     */
    parseXMLString(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            return this.extractItemsFromXML(xmlDoc);
        } catch (error) {
            console.error('XML parse error:', error);
            return null;
        }
    }

    /**
     * Extract items from XML document
     */
    extractItemsFromXML(xmlDoc) {
        const items = [];
        const itemElements = xmlDoc.querySelectorAll('item');

        itemElements.forEach((item, index) => {
            if (index >= 20) return; // Limit to 20 items

            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const content = item.querySelector('content\\:encoded')?.textContent || description;

            // Try to find image
            let thumbnail = null;
            const mediaContent = item.querySelector('media\\:content, media\\:thumbnail');
            if (mediaContent) {
                thumbnail = mediaContent.getAttribute('url');
            }

            const enclosure = item.querySelector('enclosure');
            if (!thumbnail && enclosure) {
                thumbnail = enclosure.getAttribute('url');
            }

            items.push({
                title,
                link,
                description: content || description,
                pubDate,
                thumbnail,
                enclosure: thumbnail ? { link: thumbnail } : null
            });
        });

        return items;
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
