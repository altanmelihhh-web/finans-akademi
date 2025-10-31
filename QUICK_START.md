# 🚀 Hızlı Başlangıç Rehberi

Bu rehber, Finans Akademi uygulamasını 5 dakikada çalıştırmanıza yardımcı olacak.

## 📋 Gereksinimler

- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- İnternet bağlantısı (CDN kaynakları için)

## ⚡ 3 Adımda Başla

### Adım 1: Projeyi Aç
```bash
cd Finans
```

### Adım 2: index.html'i Tarayıcıda Aç

**Seçenek A: Dosyadan Direkt Aç**
- `index.html` dosyasına çift tıkla
- Veya tarayıcıya sürükle-bırak

**Seçenek B: Local Server ile Aç (Önerilen)**
```bash
# Python 3 varsa:
python3 -m http.server 8000

# Python 2 varsa:
python -m SimpleHTTPServer 8000

# Node.js varsa:
npx serve

# Tarayıcıda aç:
# http://localhost:8000
```

### Adım 3: Keşfet!
Uygulama hazır! Şimdi gezinmeye başlayabilirsin:
- 📊 **Dashboard**: Piyasa verilerini gör
- 📚 **Terimler**: Finans terimlerini öğren
- 📈 **Grafik Analizi**: Teknik analiz öğren
- 📰 **Haberler**: Haber okuma kılavuzu
- 🎓 **30 Günlük Plan**: Öğrenme yolculuğuna başla

---

## 🎯 İlk Kullanım İpuçları

### 1. 30 Günlük Planı Başlat
1. "30 Günlük Plan" sekmesine git
2. Gün 1'e tıkla ve içeriği oku
3. Tamamladığında checkbox'ı işaretle
4. İlerleme otomatik kaydedilir!

### 2. Terimler Sözlüğünü Kullan
1. "Terimler" sekmesine git
2. Arama kutusunu kullan (örn: "RSI")
3. Her terimi örnekleriyle incele

### 3. Grafik Analizi Pratik Yap
1. "Grafik Analizi" sekmesine git
2. Mum grafikleri ve formasyonları öğren
3. En altta "İnteraktif Pratik" bölümünde quiz çöz

### 4. Dashboard'u Takip Et
1. Piyasa verileri her 60 saniyede güncellenir
2. Kazanan/kaybeden hisseleri gözlemle
3. 30 günlük trend grafiğini incele

---

## 🔌 Gerçek API Entegrasyonu (Opsiyonel)

Şu anda uygulama **demo verilerle** çalışıyor. Gerçek zamanlı veri için:

### Hızlı API Kurulumu (5 dk)

**1. Alpha Vantage Key Al (Ücretsiz)**
```
1. https://www.alphavantage.co/support/#api-key
2. Email adresini gir
3. API key'i kopyala
```

**2. Config Dosyası Oluştur**
```bash
cp config.example.js config.js
# config.js dosyasını aç ve API key'ini yapıştır
```

**3. HTML'e Config Ekle**
```html
<!-- index.html, app.js'den önce ekle -->
<script src="config.js"></script>
<script src="js/app.js"></script>
```

**4. app.js'de Gerçek Veriyi Aktif Et**
```javascript
// js/app.js dosyasında fetchRealMarketData() fonksiyonunu kullan
```

**Detaylı rehber**: `API_GUIDE.md` dosyasını oku

---

## 📱 Mobil Kullanım

Uygulama **tam responsive**:
- Telefondan rahatlıkla kullanılabilir
- Tablet'te optimize edilmiş görünüm
- Desktop'ta geniş ekran desteği

---

## 🎓 Öğrenme Yol Haritası

### İlk Gün (15 dakika)
1. ✅ Uygulamayı aç ve keşfet
2. ✅ "Terimler" bölümünden 5 terim öğren
3. ✅ Dashboard'da piyasayı 5 dakika izle

### İlk Hafta
1. ✅ Her gün 30 dakika uygulama ile çalış
2. ✅ 30 Günlük Plan'ın 1. haftasını tamamla
3. ✅ Mum grafiklerini çizebilir hale gel

### İlk Ay
1. ✅ 30 Günlük Planı tamamla
2. ✅ TradingView'da demo hesap aç
3. ✅ Demo hesapta 10 işlem yap

### 2-3. Ay
1. ✅ Demo hesapta tutarlı pratik yap
2. ✅ Trading stratejisi oluştur
3. ✅ Gerçek para ile başlamadan önce hazır ol

---

## 🛠 Sorun Giderme

### Problem: Grafikler görünmüyor
**Çözüm**: İnternet bağlantınızı kontrol edin (Chart.js CDN'den yükleniyor)

### Problem: Veriler güncellenmiyor
**Çözüm**:
- Sayfayı yenileyin (F5)
- Tarayıcı console'unu kontrol edin (F12)
- API key doğru girilmiş mi kontrol edin

### Problem: Mobilde menü çalışmıyor
**Çözüm**: JavaScript aktif mi kontrol edin

### Problem: 30 günlük plan ilerleme kayboluyor
**Çözüm**:
- Tarayıcı localStorage'ı destekliyor mu kontrol edin
- Gizli mod kullanmayın (localStorage çalışmaz)

---

## 💡 Pro İpuçları

### 1. Klavye Kısayolları (Gelecekte Eklenecek)
- `Ctrl + 1`: Dashboard
- `Ctrl + 2`: Terimler
- `Ctrl + 3`: Grafik Analizi

### 2. Favori Hisselerini Takip Et
- Dashboard'da ilgini çeken hisseleri not al
- TradingView'da watchlist oluştur

### 3. Günlük Rutin Oluştur
```
Her sabah:
1. Dashboard'u aç (5 dk)
2. Gece neler oldu kontrol et
3. Haberler bölümünde güncel haberleri oku

Her akşam:
1. 30 Günlük Plan'dan bir görev tamamla (30 dk)
2. Grafik analizi pratik yap (15 dk)
```

### 4. Notlar Al
- Her öğrendiğin şeyi not al
- Kendi stratejini oluştur
- Hataları ve başarıları kaydet

---

## 📚 Ek Kaynaklar

### Önerilen Siteler
1. **TradingView** - https://www.tradingview.com
   - Ücretsiz grafik platformu
   - Demo hesap (paper trading)

2. **Investing.com** - https://www.investing.com
   - Ekonomik takvim
   - Gerçek zamanlı veriler

3. **Investopedia** - https://www.investopedia.com
   - Finans ansiklopedisi
   - Eğitim içerikleri

### Önerilen YouTube Kanalları
1. **The Chart Guys** - Teknik analiz
2. **Rayner Teo** - Trading stratejileri
3. **Financial Education** - Genel finans

### Önerilen Kitaplar
1. "A Random Walk Down Wall Street" - Burton Malkiel
2. "The Intelligent Investor" - Benjamin Graham
3. "Trading in the Zone" - Mark Douglas

---

## 🎯 Hedefler

### Kısa Vadeli (1 Ay)
- [ ] 30 Günlük Planı tamamla
- [ ] 20+ finans terimi öğren
- [ ] Grafik okuyabilir hale gel
- [ ] Demo hesap aç

### Orta Vadeli (3 Ay)
- [ ] Demo hesapta 50+ işlem yap
- [ ] Kendi trading stratejini oluştur
- [ ] Risk yönetimi prensiplerini uygula
- [ ] Tutarlı performans göster

### Uzun Vadeli (6+ Ay)
- [ ] Gerçek para ile işleme başla (küçük miktarla)
- [ ] Portföy oluştur ve yönet
- [ ] Psikolojik kontrolü sağla
- [ ] Sürekli öğrenmeye devam et

---

## ⚠️ Önemli Hatırlatmalar

1. **Bu bir eğitim uygulamasıdır** - Yatırım tavsiyesi değildir
2. **Demo ile başla** - Acele etme
3. **Risk yönetimi önemli** - Her işlemde stop loss kullan
4. **Sabırlı ol** - Öğrenmek zaman alır
5. **Duygusal kararlar verme** - Plan yap ve uygula

---

## 🎉 Başarıya Giden Yol

```
1. Öğren    → 30 günlük planı tamamla
2. Pratik   → Demo hesapta bol bol pratik
3. Test et  → Stratejini test et ve geliştir
4. Başla    → Küçük miktarla gerçek işlemlere başla
5. Büyüt    → Zamanla sermayeni ve deneyimini artır
```

---

## 📞 Destek

- **Sorular**: README.md dosyasını oku
- **API Sorunları**: API_GUIDE.md dosyasını oku
- **Teknik Sorunlar**: Browser console'u (F12) kontrol et

---

**Hazır mısın?** index.html'i aç ve öğrenmeye başla! 🚀

**İyi şanslar!** 📈

---

*Son Güncelleme: 2025*
*Versiyon: 1.0.0*
