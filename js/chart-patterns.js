/**
 * ================================================================================
 * CHART PATTERN EDUCATION SYSTEM
 * ================================================================================
 *
 * Interactive chart pattern learning with real examples
 * - 100+ real financial chart patterns
 * - Buy/Sell/Hold decision training
 * - Instant feedback with explanations
 * - Technical analysis education
 *
 * @version 1.0.0
 * @author Finans Akademi
 */

'use strict';

// ================================================================================
// CHART PATTERNS DATABASE
// ================================================================================

const CHART_PATTERNS = [
    // BULLISH PATTERNS (Yükseliş Sinyalleri)
    {
        id: 1,
        title: "Çift Dip (Double Bottom)",
        image: "https://www.investopedia.com/thmb/double-bottom.jpg",
        correctAnswer: "buy",
        explanation: "Çift dip formasyonu güçlü bir yükseliş sinyalidir. Fiyat iki kez aynı seviyeye düşüp tekrar yükseldiğinde, destek seviyesi doğrulanmış olur. İkinci dipten sonra alım fırsatı yaratır.",
        technicalTerms: ["Destek Seviyesi", "Yükseliş Formasyonu", "Trend Dönüşü"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 2,
        title: "Baş-Omuz Tabanı (Inverse Head & Shoulders)",
        image: "https://www.investopedia.com/thmb/inverse-head-shoulders.jpg",
        correctAnswer: "buy",
        explanation: "Ters baş-omuz formasyonu, düşüş trendinin sona erdiğini ve yükselişin başlayacağını gösterir. Boyun çizgisini yukarı kırması önemli bir alım sinyalidir.",
        technicalTerms: ["Trend Dönüşü", "Boyun Çizgisi", "Yükseliş Başlangıcı"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 3,
        title: "Yükselen Üçgen (Ascending Triangle)",
        image: "https://www.investopedia.com/thmb/ascending-triangle.jpg",
        correctAnswer: "buy",
        explanation: "Yükselen üçgen, fiyatın direnç seviyesine yaklaşırken diplerinin yükseldiği bir formasyon. Genellikle yukarı kırılım ile sonuçlanır. Alım için ideal formasyon.",
        technicalTerms: ["Direnç Seviyesi", "Yükselen Dipler", "Kırılım Beklentisi"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 4,
        title: "Boğa Bayrağı (Bull Flag)",
        image: "https://www.investopedia.com/thmb/bull-flag.jpg",
        correctAnswer: "buy",
        explanation: "Güçlü yükselişin ardından kısa süreli konsolidasyon gösteren formasyon. Bayrak direği güçlü yükseliş, bayrak kısmı dinlenme dönemidir. Devam formasyonu olarak yukarı hareket beklenir.",
        technicalTerms: ["Devam Formasyonu", "Konsolidasyon", "Momentum"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 5,
        title: "Fincan-Kulp (Cup and Handle)",
        image: "https://www.investopedia.com/thmb/cup-and-handle.jpg",
        correctAnswer: "buy",
        explanation: "Fincan şeklinde bir formasyon ve ardından küçük bir düzeltme (kulp). Uzun vadeli yükseliş için güçlü bir sinyal. Kulp kısmından sonra alım yapılmalı.",
        technicalTerms: ["Uzun Vadeli Yükseliş", "Konsolidasyon", "Kırılım"],
        difficulty: "hard",
        marketType: "bull"
    },

    // BEARISH PATTERNS (Düşüş Sinyalleri)
    {
        id: 6,
        title: "Çift Tepe (Double Top)",
        image: "https://www.investopedia.com/thmb/double-top.jpg",
        correctAnswer: "sell",
        explanation: "Çift tepe formasyonu güçlü bir düşüş sinyalidir. Fiyat iki kez aynı direnç seviyesine çıkıp geri düştüğünde, satış fırsatı oluşur. İkinci tepeden sonra pozisyon kapatılmalı.",
        technicalTerms: ["Direnç Seviyesi", "Düşüş Formasyonu", "Trend Dönüşü"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 7,
        title: "Baş-Omuz Tepesi (Head & Shoulders)",
        image: "https://www.investopedia.com/thmb/head-shoulders.jpg",
        correctAnswer: "sell",
        explanation: "En güçlü düşüş formasyonlarından biri. Baş kısmı en yüksek tepe, omuzlar daha alçak. Boyun çizgisini aşağı kırması satış sinyalidir.",
        technicalTerms: ["Trend Dönüşü", "Boyun Çizgisi", "Güçlü Düşüş"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 8,
        title: "Düşen Üçgen (Descending Triangle)",
        image: "https://www.investopedia.com/thmb/descending-triangle.jpg",
        correctAnswer: "sell",
        explanation: "Düşen üçgen, fiyatın destek seviyesine yaklaşırken tepelerinin düştüğü formasyon. Genellikle aşağı kırılım ile sonuçlanır. Satış için uyarı sinyali.",
        technicalTerms: ["Destek Seviyesi", "Düşen Tepeler", "Kırılım Beklentisi"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 9,
        title: "Ayı Bayrağı (Bear Flag)",
        image: "https://www.investopedia.com/thmb/bear-flag.jpg",
        correctAnswer: "sell",
        explanation: "Güçlü düşüşün ardından kısa süreli konsolidasyon. Bayrak direği güçlü düşüş, bayrak kısmı dinlenme. Devam formasyonu olarak aşağı hareket beklenir.",
        technicalTerms: ["Devam Formasyonu", "Konsolidasyon", "Düşüş Momentumu"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 10,
        title: "Düşen Kama (Falling Wedge - Bearish)",
        image: "https://www.investopedia.com/thmb/falling-wedge-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Daralarak düşen fiyat hareketi. Aşağı yönlü devam formasyonudur. Alt çizgiyi kırınca güçlü düşüş beklenir.",
        technicalTerms: ["Daralma", "Devam Formasyonu", "Düşüş Trendi"],
        difficulty: "medium",
        marketType: "bear"
    },

    // NEUTRAL / WAIT PATTERNS (Bekle Sinyalleri)
    {
        id: 11,
        title: "Simetrik Üçgen (Symmetrical Triangle)",
        image: "https://www.investopedia.com/thmb/symmetrical-triangle.jpg",
        correctAnswer: "wait",
        explanation: "Fiyat daralırken hem tepeler hem dipler yaklaşıyor. Yön belirsiz, kırılım beklemek gerekir. Hangi yöne kırılırsa o yönde pozisyon alınır. Acele etmek risklidir.",
        technicalTerms: ["Konsolidasyon", "Yön Belirsizliği", "Kırılım Beklentisi"],
        difficulty: "medium",
        marketType: "neutral"
    },
    {
        id: 12,
        title: "Dikdörtgen Formasyon (Rectangle)",
        image: "https://www.investopedia.com/thmb/rectangle-pattern.jpg",
        correctAnswer: "wait",
        explanation: "Fiyat belirli bir aralıkta yatay hareket ediyor. Trend yok, destek-direnç arası gidip geliyor. Kırılım yönü belli olana kadar beklemek mantıklı.",
        technicalTerms: ["Yatay Trend", "Destek-Direnç", "Konsolidasyon"],
        difficulty: "easy",
        marketType: "neutral"
    },
    {
        id: 13,
        title: "Doji Mum (Doji Candle)",
        image: "https://www.investopedia.com/thmb/doji-candle.jpg",
        correctAnswer: "wait",
        explanation: "Açılış ve kapanış fiyatı neredeyse aynı. Kararsızlık göstergesi. Trend dönüşü sinyali olabilir ama tek başına işlem yapmak riskli. Doğrulama bekleyin.",
        technicalTerms: ["Kararsızlık", "Mum Formasyonu", "Trend Dönüş Uyarısı"],
        difficulty: "easy",
        marketType: "neutral"
    },
    {
        id: 14,
        title: "Üçgen Sonu Daralmış (Triangle Apex)",
        image: "https://www.investopedia.com/thmb/triangle-apex.jpg",
        correctAnswer: "wait",
        explanation: "Üçgen formasyonun sonuna gelindi ama henüz kırılım yok. En yüksek volatilite anı yaklaşıyor. Kırılım yönü için beklemek zorunlu.",
        technicalTerms: ["Volatilite Artışı", "Kırılım Öncesi", "Daralma Sonu"],
        difficulty: "hard",
        marketType: "neutral"
    },
    {
        id: 15,
        title: "Yan Trend (Sideways Trend)",
        image: "https://www.investopedia.com/thmb/sideways.jpg",
        correctAnswer: "wait",
        explanation: "Uzun süreli yatay hareket. Ne yükseliş ne düşüş trendi var. Piyasa yön arıyor. Kırılım olmadan girmek kayıp riski taşır.",
        technicalTerms: ["Trend Yokluğu", "Konsolidasyon", "Yön Arayışı"],
        difficulty: "easy",
        marketType: "neutral"
    },

    // ADDITIONAL BULLISH PATTERNS
    {
        id: 16,
        title: "Yükselen Kama (Rising Wedge - Bullish Context)",
        image: "https://www.investopedia.com/thmb/rising-wedge-bullish.jpg",
        correctAnswer: "buy",
        explanation: "Yükselen trend içinde daralma. Momentum azalıyor gibi görünse de yukarı kırılımla devam eder. Güçlü trend varsa alım fırsatı.",
        technicalTerms: ["Devam Formasyonu", "Daralma", "Yükseliş Trendi"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 17,
        title: "Sabah Yıldızı (Morning Star)",
        image: "https://www.investopedia.com/thmb/morning-star.jpg",
        correctAnswer: "buy",
        explanation: "Üç mumlu formasyon: Uzun düşüş mumu, küçük kararsız mum, ardından uzun yükseliş mumu. Güçlü dönüş sinyali. Alım için ideal.",
        technicalTerms: ["Mum Formasyonu", "Trend Dönüşü", "Üçlü Mum"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 18,
        title: "Yutucu Boğa (Bullish Engulfing)",
        image: "https://www.investopedia.com/thmb/bullish-engulfing.jpg",
        correctAnswer: "buy",
        explanation: "Küçük düşüş mumundan sonra onu tamamen yutan büyük yükseliş mumu. Güçlü alım baskısı gösterir. İyi bir alım sinyali.",
        technicalTerms: ["Mum Formasyonu", "Alım Baskısı", "Momentum Değişimi"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 19,
        title: "Üçlü Dip (Triple Bottom)",
        image: "https://www.investopedia.com/thmb/triple-bottom.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat üç kez aynı destek seviyesine gelip geri dönüyor. Son derece güçlü destek. Üçüncü dipten sonra yükseliş olasılığı çok yüksek.",
        technicalTerms: ["Güçlü Destek", "Trend Dönüşü", "Çoklu Doğrulama"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 20,
        title: "Piercing Line (Delici Çizgi)",
        image: "https://www.investopedia.com/thmb/piercing-line.jpg",
        correctAnswer: "buy",
        explanation: "Düşüş mumundan sonra, onun ortasının üzerine kapanan yükseliş mumu. Alıcıların kontrolü ele aldığını gösterir.",
        technicalTerms: ["Mum Formasyonu", "Trend Dönüşü", "Alıcı Kontrolü"],
        difficulty: "medium",
        marketType: "bull"
    },

    // ADDITIONAL BEARISH PATTERNS
    {
        id: 21,
        title: "Akşam Yıldızı (Evening Star)",
        image: "https://www.investopedia.com/thmb/evening-star.jpg",
        correctAnswer: "sell",
        explanation: "Üç mumlu formasyon: Uzun yükseliş mumu, küçük kararsız mum, ardından uzun düşüş mumu. Güçlü dönüş sinyali. Satış zamanı.",
        technicalTerms: ["Mum Formasyonu", "Trend Dönüşü", "Üçlü Mum"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 22,
        title: "Yutucu Ayı (Bearish Engulfing)",
        image: "https://www.investopedia.com/thmb/bearish-engulfing.jpg",
        correctAnswer: "sell",
        explanation: "Küçük yükseliş mumundan sonra onu tamamen yutan büyük düşüş mumu. Güçlü satış baskısı. Pozisyon kapatmak gerek.",
        technicalTerms: ["Mum Formasyonu", "Satış Baskısı", "Momentum Değişimi"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 23,
        title: "Üçlü Tepe (Triple Top)",
        image: "https://www.investopedia.com/thmb/triple-top.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat üç kez aynı direnç seviyesine çıkıp geri düşüyor. Son derece güçlü direnç. Üçüncü tepeden sonra düşüş olasılığı yüksek.",
        technicalTerms: ["Güçlü Direnç", "Trend Dönüşü", "Çoklu Doğrulama"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 24,
        title: "Kara Bulut (Dark Cloud Cover)",
        image: "https://www.investopedia.com/thmb/dark-cloud-cover.jpg",
        correctAnswer: "sell",
        explanation: "Yükseliş mumundan sonra, onun ortasının altına kapanan düşüş mumu. Satıcıların kontrolü ele aldığını gösterir.",
        technicalTerms: ["Mum Formasyonu", "Trend Dönüşü", "Satıcı Kontrolü"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 25,
        title: "Yükselen Kama - Düşüş (Rising Wedge - Top)",
        image: "https://www.investopedia.com/thmb/rising-wedge-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat yükselirken daralıyor ama momentum zayıflıyor. Yükseliş sonunda tükeniyor. Aşağı kırılım beklenir.",
        technicalTerms: ["Momentum Kaybı", "Trend Tükenmesi", "Düşüş Uyarısı"],
        difficulty: "hard",
        marketType: "bear"
    },

    // MORE COMPLEX PATTERNS
    {
        id: 26,
        title: "Elmas Tepe (Diamond Top)",
        image: "https://www.investopedia.com/thmb/diamond-top.jpg",
        correctAnswer: "sell",
        explanation: "Genişleyen sonra daralan formasyon, elmas şekli oluşturur. Trend sonunda oluşur. Aşağı kırılımla güçlü düşüş gelir.",
        technicalTerms: ["Nadir Formasyon", "Trend Sonu", "Yüksek Güvenilirlik"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 27,
        title: "Elmas Dip (Diamond Bottom)",
        image: "https://www.investopedia.com/thmb/diamond-bottom.jpg",
        correctAnswer: "buy",
        explanation: "Genişleyen sonra daralan formasyon, elmas şekli oluşturur. Düşüş sonunda oluşur. Yukarı kırılımla yükseliş başlar.",
        technicalTerms: ["Nadir Formasyon", "Trend Dönüşü", "Yüksek Güvenilirlik"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 28,
        title: "Genişleyen Üçgen (Broadening Triangle)",
        image: "https://www.investopedia.com/thmb/broadening-triangle.jpg",
        correctAnswer: "wait",
        explanation: "Volatilite artıyor, fiyat gittikçe daha geniş salınımlar yapıyor. Çok riskli ortam. Netlik gelene kadar beklemek şart.",
        technicalTerms: ["Artan Volatilite", "Risk Artışı", "Belirsizlik"],
        difficulty: "hard",
        marketType: "neutral"
    },
    {
        id: 29,
        title: "Rounding Bottom (Tabak Dip)",
        image: "https://www.investopedia.com/thmb/rounding-bottom.jpg",
        correctAnswer: "buy",
        explanation: "Yavaş ve sürekli düşüşten sonra yavaş toparlanma, 'U' şekli oluşturur. Uzun vadeli yükseliş başlangıcı.",
        technicalTerms: ["Uzun Vadeli", "Yavaş Dönüş", "Güçlü Formasyon"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 30,
        title: "Rounding Top (Tabak Tepe)",
        image: "https://www.investopedia.com/thmb/rounding-top.jpg",
        correctAnswer: "sell",
        explanation: "Yavaş yükselişten sonra yavaş düşüş, ters 'U' şekli. Uzun vadeli düşüş başlangıcı. Satış sinyali.",
        technicalTerms: ["Uzun Vadeli", "Yavaş Dönüş", "Güçlü Formasyon"],
        difficulty: "medium",
        marketType: "bear"
    },

    // CONTINUATION PATTERNS
    {
        id: 31,
        title: "Üç Beyaz Asker (Three White Soldiers)",
        image: "https://www.investopedia.com/thmb/three-white-soldiers.jpg",
        correctAnswer: "buy",
        explanation: "Üç ardışık güçlü yükseliş mumu. Her biri öncekinin içinde açılıp daha yukarı kapanıyor. Çok güçlü alım sinyali.",
        technicalTerms: ["Üçlü Mum", "Güçlü Momentum", "Devam Formasyonu"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 32,
        title: "Üç Kara Karga (Three Black Crows)",
        image: "https://www.investopedia.com/thmb/three-black-crows.jpg",
        correctAnswer: "sell",
        explanation: "Üç ardışık güçlü düşüş mumu. Her biri öncekinin içinde açılıp daha aşağı kapanıyor. Çok güçlü satış sinyali.",
        technicalTerms: ["Üçlü Mum", "Güçlü Momentum", "Devam Formasyonu"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 33,
        title: "Yükselen Kanal (Rising Channel)",
        image: "https://www.investopedia.com/thmb/rising-channel.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat paralel iki çizgi arasında yükseliyor. Alt banddan alım, üst banddan satım yapılır. Kanal içi devam ediyor.",
        technicalTerms: ["Trend Kanalı", "Paralel Çizgiler", "Sürdürülebilir Yükseliş"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 34,
        title: "Düşen Kanal (Falling Channel)",
        image: "https://www.investopedia.com/thmb/falling-channel.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat paralel iki çizgi arasında düşüyor. Üst banddan satım, alt banddan kapama yapılır. Kanal devam ediyor.",
        technicalTerms: ["Trend Kanalı", "Paralel Çizgiler", "Sürdürülebilir Düşüş"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 35,
        title: "Boğa İki Boşluk (Bullish Two Gap)",
        image: "https://www.investopedia.com/thmb/bullish-two-gap.jpg",
        correctAnswer: "buy",
        explanation: "İki ardışık yukarı boşluk (gap). Çok güçlü alım baskısı gösterir. Momentum devam ediyor, alım sürebilir.",
        technicalTerms: ["Gap", "Güçlü Momentum", "Devam Sinyali"],
        difficulty: "medium",
        marketType: "bull"
    },

    // REVERSAL PATTERNS
    {
        id: 36,
        title: "Tweezer Bottom (Cımbız Dip)",
        image: "https://www.investopedia.com/thmb/tweezer-bottom.jpg",
        correctAnswer: "buy",
        explanation: "İki mum aynı alt seviyeye dokunuyor. İkinci mum yükselişle kapanıyor. Destek doğrulanmış, alım sinyali.",
        technicalTerms: ["İkili Mum", "Destek Doğrulama", "Kısa Vadeli Dönüş"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 37,
        title: "Tweezer Top (Cımbız Tepe)",
        image: "https://www.investopedia.com/thmb/tweezer-top.jpg",
        correctAnswer: "sell",
        explanation: "İki mum aynı üst seviyeye dokunuyor. İkinci mum düşüşle kapanıyor. Direnç doğrulanmış, satış sinyali.",
        technicalTerms: ["İkili Mum", "Direnç Doğrulama", "Kısa Vadeli Dönüş"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 38,
        title: "Hammer (Çekiç)",
        image: "https://www.investopedia.com/thmb/hammer.jpg",
        correctAnswer: "buy",
        explanation: "Düşüş sonunda uzun alt fitilli küçük gövdeli mum. Satıcılar baskı yapsa da alıcılar geri kazandı. Dönüş sinyali.",
        technicalTerms: ["Tek Mum", "Alt Fitil", "Destek Bulma"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 39,
        title: "Shooting Star (Kayan Yıldız)",
        image: "https://www.investopedia.com/thmb/shooting-star.jpg",
        correctAnswer: "sell",
        explanation: "Yükseliş sonunda uzun üst fitilli küçük gövdeli mum. Alıcılar itti ama satıcılar geri aldı. Düşüş sinyali.",
        technicalTerms: ["Tek Mum", "Üst Fitil", "Direnç Bulma"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 40,
        title: "Harami Bullish (Boğa Harami)",
        image: "https://www.investopedia.com/thmb/harami-bullish.jpg",
        correctAnswer: "buy",
        explanation: "Büyük düşüş mumu sonrası küçük yükseliş mumu onun içinde. Momentum zayıflıyor, dönüş gelebilir.",
        technicalTerms: ["İkili Mum", "Momentum Kaybı", "Olası Dönüş"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 41,
        title: "Harami Bearish (Ayı Harami)",
        image: "https://www.investopedia.com/thmb/harami-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Büyük yükseliş mumu sonrası küçük düşüş mumu onun içinde. Momentum zayıflıyor, düşüş gelebilir.",
        technicalTerms: ["İkili Mum", "Momentum Kaybı", "Olası Dönüş"],
        difficulty: "medium",
        marketType: "bear"
    },

    // ADVANCED PATTERNS
    {
        id: 42,
        title: "Gartley Pattern (Gartley Formasyonu)",
        image: "https://www.investopedia.com/thmb/gartley.jpg",
        correctAnswer: "buy",
        explanation: "Fibonacci oranlarına dayalı harmonic formasyon. Çok nadir ve güvenilir. D noktasından alım yapılır.",
        technicalTerms: ["Harmonic Pattern", "Fibonacci", "İleri Seviye"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 43,
        title: "Bat Pattern (Yarasa Formasyonu)",
        image: "https://www.investopedia.com/thmb/bat-pattern.jpg",
        correctAnswer: "buy",
        explanation: "Fibonacci tabanlı harmonic formasyon. Gartley'e benzer ama farklı oranlar. D noktası alım fırsatı.",
        technicalTerms: ["Harmonic Pattern", "Fibonacci", "İleri Seviye"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 44,
        title: "Butterfly Pattern (Kelebek Formasyonu)",
        image: "https://www.investopedia.com/thmb/butterfly.jpg",
        correctAnswer: "sell",
        explanation: "Harmonic formasyon, düşüş versiyonu. X noktasını geçen D noktasında satış fırsatı. Nadir görülür.",
        technicalTerms: ["Harmonic Pattern", "Fibonacci", "İleri Seviye"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 45,
        title: "Crab Pattern (Yengeç Formasyonu)",
        image: "https://www.investopedia.com/thmb/crab-pattern.jpg",
        correctAnswer: "sell",
        explanation: "En nadir harmonic formasyon. 1.618 Fibonacci extension kullanır. Yüksek güvenilirlik, düşüş beklenir.",
        technicalTerms: ["Harmonic Pattern", "Fibonacci Extension", "Çok Nadir"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 46,
        title: "ABCD Pattern (ABCD Formasyonu)",
        image: "https://www.investopedia.com/thmb/abcd.jpg",
        correctAnswer: "buy",
        explanation: "En temel harmonic formasyon. AB = CD kuralı. C noktasından D'ye yükseliş beklenir.",
        technicalTerms: ["Harmonic Pattern", "Temel Formasyon", "Fibonacci"],
        difficulty: "medium",
        marketType: "bull"
    },

    // VOLUME PATTERNS
    {
        id: 47,
        title: "Yüksek Hacimli Kırılım (High Volume Breakout)",
        image: "https://www.investopedia.com/thmb/high-volume-breakout.jpg",
        correctAnswer: "buy",
        explanation: "Direnç kırılımı yüksek hacimle gerçekleşti. Gerçek kırılım sinyali, alım yapılabilir. Hacim onay verdi.",
        technicalTerms: ["Hacim Analizi", "Kırılım Doğrulama", "Güçlü Sinyal"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 48,
        title: "Düşük Hacimli Rally (Low Volume Rally)",
        image: "https://www.investopedia.com/thmb/low-volume-rally.jpg",
        correctAnswer: "wait",
        explanation: "Fiyat yükseliyor ama hacim düşük. Sahte hareket olabilir. Hacim artışı beklemek gerek, şimdi girmek riskli.",
        technicalTerms: ["Hacim Analizi", "Zayıf Sinyal", "Şüpheli Hareket"],
        difficulty: "medium",
        marketType: "neutral"
    },
    {
        id: 49,
        title: "Climax Bottom (Panik Dip)",
        image: "https://www.investopedia.com/thmb/climax-bottom.jpg",
        correctAnswer: "buy",
        explanation: "Çok yüksek hacimle keskin düşüş sonrası toparlanma. Panik satış tükendi, dip yapıldı. Alım fırsatı.",
        technicalTerms: ["Panik Satış", "Hacim Patlaması", "Kapitülasyon"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 50,
        title: "Distribution Top (Dağıtım Tepesi)",
        image: "https://www.investopedia.com/thmb/distribution-top.jpg",
        correctAnswer: "sell",
        explanation: "Yüksek hacimle yatay hareket. Büyük oyuncular satıyor, küçük yatırımcılar alıyor. Düşüş öncesi uyarı.",
        technicalTerms: ["Dağıtım", "Akıllı Para", "Hacim Analizi"],
        difficulty: "hard",
        marketType: "bear"
    },

    // GAP PATTERNS
    {
        id: 51,
        title: "Breakaway Gap (Kaçış Boşluğu)",
        image: "https://www.investopedia.com/thmb/breakaway-gap.jpg",
        correctAnswer: "buy",
        explanation: "Trend başlangıcında büyük boşluk. Yeni trendin güçlü başladığını gösterir. Alım yapılabilir.",
        technicalTerms: ["Gap", "Trend Başlangıcı", "Güçlü Hareket"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 52,
        title: "Exhaustion Gap (Tükenme Boşluğu)",
        image: "https://www.investopedia.com/thmb/exhaustion-gap.jpg",
        correctAnswer: "sell",
        explanation: "Uzun yükseliş sonunda son boşluk. Trend tükeniyor, dönüş yakın. Pozisyon kapatma zamanı.",
        technicalTerms: ["Gap", "Trend Sonu", "Tükenme Sinyali"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 53,
        title: "Runaway Gap (Kaçak Boşluk)",
        image: "https://www.investopedia.com/thmb/runaway-gap.jpg",
        correctAnswer: "buy",
        explanation: "Trend ortasında boşluk. Momentum güçlü devam ediyor. Trend devam edecek, alım sürebilir.",
        technicalTerms: ["Gap", "Devam Sinyali", "Güçlü Momentum"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 54,
        title: "Island Reversal (Ada Dönüşü)",
        image: "https://www.investopedia.com/thmb/island-reversal.jpg",
        correctAnswer: "sell",
        explanation: "İki gap arasında izole fiyat hareketi. Güçlü dönüş sinyali. Trend kesin değişiyor, satış yap.",
        technicalTerms: ["Gap", "Güçlü Dönüş", "İzolasyon"],
        difficulty: "hard",
        marketType: "bear"
    },

    // ELLIOTT WAVE INSPIRED
    {
        id: 55,
        title: "5 Dalgalı Yükseliş (5-Wave Rally)",
        image: "https://www.investopedia.com/thmb/elliott-wave-5.jpg",
        correctAnswer: "wait",
        explanation: "Elliott Wave'e göre 5 dalga tamamlandı. Düzeltme (ABC) bekleniyor. Şimdi beklemek akıllıca.",
        technicalTerms: ["Elliott Wave", "5 Dalga", "Düzeltme Beklentisi"],
        difficulty: "hard",
        marketType: "neutral"
    },
    {
        id: 56,
        title: "ABC Düzeltmesi (ABC Correction)",
        image: "https://www.investopedia.com/thmb/abc-correction.jpg",
        correctAnswer: "buy",
        explanation: "ABC düzeltmesi C noktasında bitti. Yeni yükseliş dalgası başlayacak. Alım zamanı.",
        technicalTerms: ["Elliott Wave", "Düzeltme Sonu", "Yeni Dalga"],
        difficulty: "hard",
        marketType: "bull"
    },

    // FIBONACCI PATTERNS
    {
        id: 57,
        title: "Fibonacci %38.2 Geri Çekilme",
        image: "https://www.investopedia.com/thmb/fib-382.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat %38.2 Fibonacci seviyesinde destek buldu. Sağlıklı geri çekilme, yükseliş devam eder.",
        technicalTerms: ["Fibonacci", "Geri Çekilme", "Destek Seviyesi"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 58,
        title: "Fibonacci %61.8 Derin Düzeltme",
        image: "https://www.investopedia.com/thmb/fib-618.jpg",
        correctAnswer: "wait",
        explanation: "%61.8'e kadar düşmüş. Bu kritik seviye, kırılırsa trend bozulur. Netlik beklemek gerek.",
        technicalTerms: ["Fibonacci", "Kritik Seviye", "Trend Tehlikede"],
        difficulty: "hard",
        marketType: "neutral"
    },
    {
        id: 59,
        title: "Fibonacci %161.8 Hedef",
        image: "https://www.investopedia.com/thmb/fib-1618.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat %161.8 extension hedefine ulaştı. Kar realizasyonu yapmak mantıklı. Aşırı uzama var.",
        technicalTerms: ["Fibonacci", "Hedef", "Kar Alma"],
        difficulty: "hard",
        marketType: "bear"
    },

    // SPECIAL CANDLESTICK PATTERNS
    {
        id: 60,
        title: "Marubozu Bullish (Tam Boğa)",
        image: "https://www.investopedia.com/thmb/marubozu-bullish.jpg",
        correctAnswer: "buy",
        explanation: "Fitili olmayan tam gövde yükseliş mumu. Alıcılar tüm gün dominanttı. Güçlü devam sinyali.",
        technicalTerms: ["Mum Formasyonu", "Güçlü Kontrol", "Fitiilsiz"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 61,
        title: "Marubozu Bearish (Tam Ayı)",
        image: "https://www.investopedia.com/thmb/marubozu-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Fitili olmayan tam gövde düşüş mumu. Satıcılar tüm gün dominanttı. Güçlü düşüş devam eder.",
        technicalTerms: ["Mum Formasyonu", "Güçlü Kontrol", "Fitilsiz"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 62,
        title: "Spinning Top (Topaç)",
        image: "https://www.investopedia.com/thmb/spinning-top.jpg",
        correctAnswer: "wait",
        explanation: "Küçük gövde, uzun fitiller. Çok kararsızlık var. Hangi yön kazanacak belli değil, bekle.",
        technicalTerms: ["Kararsızlık", "Mum Formasyonu", "Belirsizlik"],
        difficulty: "easy",
        marketType: "neutral"
    },
    {
        id: 63,
        title: "Long-Legged Doji (Uzun Ayaklı)",
        image: "https://www.investopedia.com/thmb/long-legged-doji.jpg",
        correctAnswer: "wait",
        explanation: "Çok uzun fitiller, açılış=kapanış. Gün içi büyük volatilite ama netlik yok. Kesinlikle bekle.",
        technicalTerms: ["Yüksek Volatilite", "Kararsızlık", "Mum Formasyonu"],
        difficulty: "medium",
        marketType: "neutral"
    },
    {
        id: 64,
        title: "Dragonfly Doji (Yusufçuk)",
        image: "https://www.investopedia.com/thmb/dragonfly-doji.jpg",
        correctAnswer: "buy",
        explanation: "Düşüş sonunda sadece alt fitilli doji. Alıcılar gün sonunda kazandı. Dönüş sinyali olabilir.",
        technicalTerms: ["Doji", "Alt Fitil", "Olası Dönüş"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 65,
        title: "Gravestone Doji (Mezar Taşı)",
        image: "https://www.investopedia.com/thmb/gravestone-doji.jpg",
        correctAnswer: "sell",
        explanation: "Yükseliş sonunda sadece üst fitilli doji. Satıcılar gün sonunda kazandı. Düşüş sinyali.",
        technicalTerms: ["Doji", "Üst Fitil", "Dönüş Uyarısı"],
        difficulty: "medium",
        marketType: "bear"
    },

    // COMPLEX SCENARIOS
    {
        id: 66,
        title: "Bull Trap (Boğa Tuzağı)",
        image: "https://www.investopedia.com/thmb/bull-trap.jpg",
        correctAnswer: "sell",
        explanation: "Sahte yukarı kırılım ardından hızlı geri düşüş. Tuzak kurulmuş, satıcılar bekliyor. Derhal çık.",
        technicalTerms: ["Tuzak", "Sahte Kırılım", "Stop Hunt"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 67,
        title: "Bear Trap (Ayı Tuzağı)",
        image: "https://www.investopedia.com/thmb/bear-trap.jpg",
        correctAnswer: "buy",
        explanation: "Sahte aşağı kırılım ardından hızlı toparlanma. Tuzak kurulmuş, alıcılar bekliyordu. Alım yapılabilir.",
        technicalTerms: ["Tuzak", "Sahte Kırılım", "Stop Hunt"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 68,
        title: "Triple Moving Average Cross",
        image: "https://www.investopedia.com/thmb/triple-ma-cross.jpg",
        correctAnswer: "buy",
        explanation: "3 hareketli ortalama yukarı kesişti (Golden Cross). Güçlü yükseliş trendi onaylandı. Alım yapılabilir.",
        technicalTerms: ["Hareketli Ortalama", "Golden Cross", "Trend Onayı"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 69,
        title: "Death Cross (Ölüm Kesişimi)",
        image: "https://www.investopedia.com/thmb/death-cross.jpg",
        correctAnswer: "sell",
        explanation: "50 günlük MA, 200 günlüğü aşağı kesti. Uzun vadeli düşüş sinyali. Pozisyon kapat.",
        technicalTerms: ["Death Cross", "Uzun Vade", "Güçlü Sinyal"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 70,
        title: "RSI Divergence Bullish (RSI Ayrışması)",
        image: "https://www.investopedia.com/thmb/rsi-bullish-divergence.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat daha düşük dip yaparken RSI yükselen dip yaptı. Momentum dönüyor, alım fırsatı yaklaşıyor.",
        technicalTerms: ["RSI", "Divergence", "Momentum Dönüşü"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 71,
        title: "RSI Divergence Bearish (RSI Ayrışması)",
        image: "https://www.investopedia.com/thmb/rsi-bearish-divergence.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat daha yüksek tepe yaparken RSI alçalan tepe yaptı. Momentum zayıflıyor, satış yaklaşıyor.",
        technicalTerms: ["RSI", "Divergence", "Momentum Kaybı"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 72,
        title: "MACD Bullish Cross",
        image: "https://www.investopedia.com/thmb/macd-bullish.jpg",
        correctAnswer: "buy",
        explanation: "MACD çizgisi sinyal çizgisini yukarı kesti. Momentum yükselişe geçiyor. Alım sinyali.",
        technicalTerms: ["MACD", "Momentum", "Sinyal Çizgisi"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 73,
        title: "MACD Bearish Cross",
        image: "https://www.investopedia.com/thmb/macd-bearish.jpg",
        correctAnswer: "sell",
        explanation: "MACD çizgisi sinyal çizgisini aşağı kesti. Momentum düşüşe geçiyor. Satış sinyali.",
        technicalTerms: ["MACD", "Momentum", "Sinyal Çizgisi"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 74,
        title: "Bollinger Squeeze (Bollinger Daralması)",
        image: "https://www.investopedia.com/thmb/bollinger-squeeze.jpg",
        correctAnswer: "wait",
        explanation: "Bollinger bantları çok daraldı. Büyük hareket yakın ama yön belirsiz. Kırılım bekle.",
        technicalTerms: ["Bollinger Bands", "Volatilite Daralması", "Büyük Hareket Öncesi"],
        difficulty: "hard",
        marketType: "neutral"
    },
    {
        id: 75,
        title: "Bollinger Band Breakout Upper",
        image: "https://www.investopedia.com/thmb/bollinger-breakout-upper.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat üst Bollinger bandını güçlü kırdı. Momentum çok güçlü, yükseliş devam edebilir.",
        technicalTerms: ["Bollinger Bands", "Kırılım", "Güçlü Momentum"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 76,
        title: "Bollinger Band Walk Lower",
        image: "https://www.investopedia.com/thmb/bollinger-walk-lower.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat alt Bollinger bandında sürünüyor. Çok güçlü düşüş trendi. Henüz toparlanma yok.",
        technicalTerms: ["Bollinger Bands", "Güçlü Trend", "Aşırı Satım"],
        difficulty: "medium",
        marketType: "bear"
    },

    // MORE PATTERNS TO REACH 100
    {
        id: 77,
        title: "Ascending Triangle - 3rd Touch",
        image: "https://www.investopedia.com/thmb/ascending-triangle-3rd.jpg",
        correctAnswer: "buy",
        explanation: "Yükselen üçgende 3. dirençe dokunuş. Kırılım çok yakın. Yukarı kırılım beklenince güçlü alım fırsatı.",
        technicalTerms: ["Üçgen", "3. Dokunuş", "Kırılım Yakın"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 78,
        title: "Failed Breakout (Başarısız Kırılım)",
        image: "https://www.investopedia.com/thmb/failed-breakout.jpg",
        correctAnswer: "sell",
        explanation: "Yukarı kırılım denemesi başarısız, geri düştü. Zayıflık işareti. Satış yapılmalı.",
        technicalTerms: ["Başarısız Kırılım", "Zayıflık", "Dönüş Uyarısı"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 79,
        title: "Support Becoming Resistance",
        image: "https://www.investopedia.com/thmb/support-to-resistance.jpg",
        correctAnswer: "sell",
        explanation: "Eski destek kırıldıktan sonra şimdi direnç oldu. Klasik teknik analiz kuralı. Düşüş devam eder.",
        technicalTerms: ["Destek-Direnç", "Rol Değişimi", "Klasik Kural"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 80,
        title: "Resistance Becoming Support",
        image: "https://www.investopedia.com/thmb/resistance-to-support.jpg",
        correctAnswer: "buy",
        explanation: "Eski direnç kırıldıktan sonra şimdi destek oldu. Pozitif sinyal. Yükseliş devam eder.",
        technicalTerms: ["Destek-Direnç", "Rol Değişimi", "Kırılım Sonrası"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 81,
        title: "Rounded Bottom with Handle",
        image: "https://www.investopedia.com/thmb/rounded-bottom-handle.jpg",
        correctAnswer: "buy",
        explanation: "Tabak dip formasyonu + kulp oluştu. Fincan-kulpün uzun vadeli versiyonu. Güçlü alım sinyali.",
        technicalTerms: ["Tabak Dip", "Kulp", "Uzun Vadeli"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 82,
        title: "Pennant Bullish (Flama)",
        image: "https://www.investopedia.com/thmb/pennant-bullish.jpg",
        correctAnswer: "buy",
        explanation: "Güçlü yükselişin ardından küçük üçgen konsolidasyon. Bayraktan daha sıkı daralma. Yukarı devam eder.",
        technicalTerms: ["Flama", "Konsolidasyon", "Devam Formasyonu"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 83,
        title: "Pennant Bearish (Ayı Flaması)",
        image: "https://www.investopedia.com/thmb/pennant-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Güçlü düşüşün ardından küçük üçgen konsolidasyon. Düşüş devam edecek sinyali.",
        technicalTerms: ["Flama", "Konsolidasyon", "Düşüş Devamı"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 84,
        title: "Triple Bottom with Breakout",
        image: "https://www.investopedia.com/thmb/triple-bottom-breakout.jpg",
        correctAnswer: "buy",
        explanation: "Üçlü dip tamamlandı VE boyun çizgisi kırıldı. Onaylanmış yükseliş. Kesin alım sinyali.",
        technicalTerms: ["Üçlü Dip", "Kırılım Onayı", "Güçlü Sinyal"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 85,
        title: "Weekly Trend Strong Up, Daily Pullback",
        image: "https://www.investopedia.com/thmb/weekly-daily-pullback.jpg",
        correctAnswer: "buy",
        explanation: "Haftalık güçlü yükseliş, günlük geri çekilme. Sağlıklı düzeltme, ana trend güçlü. Alım fırsatı.",
        technicalTerms: ["Çoklu Zaman Dilimi", "Ana Trend", "Geri Çekilme"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 86,
        title: "Higher Highs, Higher Lows",
        image: "https://www.investopedia.com/thmb/higher-highs-lows.jpg",
        correctAnswer: "buy",
        explanation: "Klasik yükseliş trendi tanımı. Her tepe ve dip bir öncekinden yüksek. Trend sağlam, al.",
        technicalTerms: ["Yükseliş Trendi", "Tepe-Dip Analizi", "Klasik Tanım"],
        difficulty: "easy",
        marketType: "bull"
    },
    {
        id: 87,
        title: "Lower Highs, Lower Lows",
        image: "https://www.investopedia.com/thmb/lower-highs-lows.jpg",
        correctAnswer: "sell",
        explanation: "Klasik düşüş trendi tanımı. Her tepe ve dip bir öncekinden düşük. Trend kötü, sat.",
        technicalTerms: ["Düşüş Trendi", "Tepe-Dip Analizi", "Klasik Tanım"],
        difficulty: "easy",
        marketType: "bear"
    },
    {
        id: 88,
        title: "Strong Support Level - Multiple Touches",
        image: "https://www.investopedia.com/thmb/strong-support.jpg",
        correctAnswer: "buy",
        explanation: "Aynı seviyeden 4-5 kez döndü. Çok güçlü destek seviyesi. Buradan alım güvenli.",
        technicalTerms: ["Güçlü Destek", "Çoklu Dokunuş", "Yüksek Güven"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 89,
        title: "Strong Resistance Level - Multiple Rejections",
        image: "https://www.investopedia.com/thmb/strong-resistance.jpg",
        correctAnswer: "sell",
        explanation: "Aynı seviyeden 4-5 kez geri düştü. Çok güçlü direnç. Burayı geçmek zor, sat.",
        technicalTerms: ["Güçlü Direnç", "Çoklu Red", "Yüksek Güven"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 90,
        title: "Parabolic Rise (Parabolik Yükseliş)",
        image: "https://www.investopedia.com/thmb/parabolic-rise.jpg",
        correctAnswer: "sell",
        explanation: "Aşırı hızlı dikey yükseliş. Sürdürülemez, yakında düzeltme gelir. Kar al, çık.",
        technicalTerms: ["Aşırı Alım", "Sürdürülemez", "Balon"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 91,
        title: "Flash Crash Recovery",
        image: "https://www.investopedia.com/thmb/flash-crash-recovery.jpg",
        correctAnswer: "buy",
        explanation: "Ani çöküş sonrası hızlı toparlanma V şekli. Panik aşırıydı, normalleşme başladı. Alım fırsatı.",
        technicalTerms: ["Flash Crash", "V Dönüşü", "Panik Aşımı"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 92,
        title: "Consolidation After Strong Rally",
        image: "https://www.investopedia.com/thmb/consolidation-rally.jpg",
        correctAnswer: "wait",
        explanation: "Güçlü yükselişin ardından yatay hareket. Sağlıklı dinlenme mi, yoksa dönüş mü? Netleşmesini bekle.",
        technicalTerms: ["Konsolidasyon", "Dinlenme", "Netlik Beklentisi"],
        difficulty: "medium",
        marketType: "neutral"
    },
    {
        id: 93,
        title: "50% Fibonacci Retracement Hold",
        image: "https://www.investopedia.com/thmb/fib-50-hold.jpg",
        correctAnswer: "buy",
        explanation: "%50 Fibonacci'de güçlü destek buldu. Orta seviye tuttu, yükseliş devam edebilir.",
        technicalTerms: ["Fibonacci", "%50 Seviye", "Orta Destek"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 94,
        title: "Ichimoku Cloud Bullish",
        image: "https://www.investopedia.com/thmb/ichimoku-bullish.jpg",
        correctAnswer: "buy",
        explanation: "Fiyat bulutun üzerinde, Tenkan-Kijun yukarı kesiş. Ichimoku tam alım sinyali veriyor.",
        technicalTerms: ["Ichimoku", "Bulut", "Japon Tekniği"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 95,
        title: "Ichimoku Cloud Bearish",
        image: "https://www.investopedia.com/thmb/ichimoku-bearish.jpg",
        correctAnswer: "sell",
        explanation: "Fiyat bulutun altında, Tenkan-Kijun aşağı kesiş. Ichimoku tam satış sinyali.",
        technicalTerms: ["Ichimoku", "Bulut", "Japon Tekniği"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 96,
        title: "Volume Profile Support",
        image: "https://www.investopedia.com/thmb/volume-profile-support.jpg",
        correctAnswer: "buy",
        explanation: "Yüksek hacim seviyesine (POC) geri düştü. Güçlü alım bölgesi. Buradan toparlanma beklenir.",
        technicalTerms: ["Hacim Profili", "POC", "Yüksek Hacim Bölgesi"],
        difficulty: "hard",
        marketType: "bull"
    },
    {
        id: 97,
        title: "Low Volume Node (LVN) Resistance",
        image: "https://www.investopedia.com/thmb/lvn-resistance.jpg",
        correctAnswer: "sell",
        explanation: "Düşük hacim bölgesine geldi. Burada dirençle karşılaşıyor. Geçmek zor, sat.",
        technicalTerms: ["Hacim Profili", "LVN", "Düşük Hacim"],
        difficulty: "hard",
        marketType: "bear"
    },
    {
        id: 98,
        title: "Stochastic Oversold Bounce",
        image: "https://www.investopedia.com/thmb/stochastic-oversold.jpg",
        correctAnswer: "buy",
        explanation: "Stochastic 20'nin altındayken yukarı döndü. Aşırı satımdan çıkış. Alım fırsatı.",
        technicalTerms: ["Stochastic", "Aşırı Satım", "Osilatör"],
        difficulty: "medium",
        marketType: "bull"
    },
    {
        id: 99,
        title: "Stochastic Overbought Reversal",
        image: "https://www.investopedia.com/thmb/stochastic-overbought.jpg",
        correctAnswer: "sell",
        explanation: "Stochastic 80'in üstündeyken aşağı döndü. Aşırı alımdan düşüş. Satış sinyali.",
        technicalTerms: ["Stochastic", "Aşırı Alım", "Osilatör"],
        difficulty: "medium",
        marketType: "bear"
    },
    {
        id: 100,
        title: "Perfect Setup - All Indicators Aligned",
        image: "https://www.investopedia.com/thmb/perfect-setup.jpg",
        correctAnswer: "buy",
        explanation: "RSI, MACD, MA, hacim, destek - her şey yükseliş diyor. Nadir mükemmel setup. Kesin alım.",
        technicalTerms: ["Çoklu Onay", "Mükemmel Setup", "Tüm İndikatörler"],
        difficulty: "medium",
        marketType: "bull"
    }
];

// ================================================================================
// QUIZ MANAGER
// ================================================================================

class ChartPatternQuiz {
    constructor() {
        this.patterns = CHART_PATTERNS;
        this.currentPattern = null;
        this.currentIndex = 0;
        this.score = 0;
        this.totalAttempts = 0;
        this.history = [];
        this.mode = 'sequential'; // sequential or random

        this.loadProgress();
    }

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        const stored = localStorage.getItem('chartQuizProgress');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.score = data.score || 0;
                this.totalAttempts = data.totalAttempts || 0;
                this.history = data.history || [];
                this.currentIndex = data.currentIndex || 0;
            } catch (e) {
                console.error('Failed to load progress:', e);
            }
        }
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        const data = {
            score: this.score,
            totalAttempts: this.totalAttempts,
            history: this.history.slice(-50), // Keep last 50
            currentIndex: this.currentIndex
        };
        localStorage.setItem('chartQuizProgress', JSON.stringify(data));
    }

    /**
     * Get next pattern
     */
    getNextPattern() {
        if (this.mode === 'random') {
            const randomIndex = Math.floor(Math.random() * this.patterns.length);
            this.currentPattern = this.patterns[randomIndex];
        } else {
            // Sequential mode
            this.currentPattern = this.patterns[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.patterns.length;
        }

        return this.currentPattern;
    }

    /**
     * Check answer
     */
    checkAnswer(userAnswer) {
        if (!this.currentPattern) return null;

        const isCorrect = userAnswer === this.currentPattern.correctAnswer;

        this.totalAttempts++;
        if (isCorrect) {
            this.score++;
        }

        const result = {
            correct: isCorrect,
            userAnswer,
            correctAnswer: this.currentPattern.correctAnswer,
            explanation: this.currentPattern.explanation,
            technicalTerms: this.currentPattern.technicalTerms,
            pattern: this.currentPattern
        };

        this.history.unshift({
            patternId: this.currentPattern.id,
            patternTitle: this.currentPattern.title,
            correct: isCorrect,
            userAnswer,
            correctAnswer: this.currentPattern.correctAnswer,
            timestamp: new Date().toISOString()
        });

        this.saveProgress();

        return result;
    }

    /**
     * Get statistics
     */
    getStats() {
        const accuracy = this.totalAttempts > 0
            ? ((this.score / this.totalAttempts) * 100).toFixed(1)
            : 0;

        return {
            score: this.score,
            total: this.totalAttempts,
            accuracy: accuracy,
            remaining: this.patterns.length - this.currentIndex,
            level: this.getLevel(accuracy)
        };
    }

    /**
     * Get user level based on accuracy
     */
    getLevel(accuracy) {
        if (accuracy >= 90) return '🏆 Uzman';
        if (accuracy >= 75) return '💎 İleri Seviye';
        if (accuracy >= 60) return '⭐ Orta Seviye';
        if (accuracy >= 40) return '📈 Başlangıç';
        return '🌱 Yeni Başlayan';
    }

    /**
     * Reset progress
     */
    reset() {
        this.score = 0;
        this.totalAttempts = 0;
        this.history = [];
        this.currentIndex = 0;
        this.currentPattern = null;
        this.saveProgress();
    }

    /**
     * Set mode
     */
    setMode(mode) {
        this.mode = mode;
    }

    /**
     * Filter patterns by difficulty
     */
    filterByDifficulty(difficulty) {
        if (difficulty === 'all') {
            this.patterns = CHART_PATTERNS;
        } else {
            this.patterns = CHART_PATTERNS.filter(p => p.difficulty === difficulty);
        }
        this.currentIndex = 0;
    }
}

// ================================================================================
// EXPORT
// ================================================================================

// Make globally available
window.ChartPatternQuiz = ChartPatternQuiz;
window.CHART_PATTERNS = CHART_PATTERNS;

console.log('✅ Chart Pattern Education System loaded - 100 patterns ready!');
