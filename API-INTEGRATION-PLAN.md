# TEFAS ve BES API Entegrasyon Planı

## 📊 TEFAS Fonları (YAPILABİLİR ✅)

### Durum: HAZIR - Sadece Cloudflare Worker Deploy Gerekiyor

**API:** `https://ws.tefas.gov.tr/bultenapi/PortfolioInfo/{fundCode}/{date}`

**Sorun:** CORS hatası (tarayıcıdan direkt erişim engelli)

**Çözüm:** Cloudflare Worker proxy (ÜCRETSİZ)

### TEFAS Aktif Etme Adımları:

#### 1. Cloudflare Worker Deploy Et (10 dakika)
```
1. https://dash.cloudflare.com/sign-up → Hesap aç
2. Workers & Pages → Create Worker
3. İsim ver: tefas-proxy
4. cloudflare-workers/tefas-proxy.js kodunu yapıştır
5. Save and Deploy
6. URL'i kopyala: https://tefas-proxy.SENIN-SUBDOMAIN.workers.dev
```

#### 2. Config'i Güncelle
`js/config.js` dosyasında:
```javascript
tefas: {
    useProxy: true,  // false → true
    proxyUrl: 'https://tefas-proxy.SENIN-URL.workers.dev/tefas',  // Kendi URL'ini yaz
},

features: {
    showTEFAS: true,  // false → true
}
```

#### 3. Commit ve Test
```bash
git add js/config.js
git commit -m "feat: Enable TEFAS funds with Cloudflare Worker proxy"
git push
```

**Sonuç:** 20 TEFAS fonu gerçek fiyatlarla görünecek!

---

## 🏦 BES Fonları (SORUNLU ❌)

### Durum: RESMİ API YOK

**Araştırma sonuçları:**
- ❌ EGM (Emeklilik Gözetim Merkezi) - Public API yok
- ❌ SPK (Sermaye Piyasası Kurulu) - API yok
- ❌ Bireysel şirketler (Anadolu Hayat, Garanti Emeklilik) - API yok

### BES İçin Alternatif Çözümler:

#### Seçenek 1: Web Scraping (Manuel)
EGM sitesinden manuel scraping:
- https://www.egm.org.tr/data-center/statistics/ips-statistics
- https://emeklilik.egm.org.tr/en/eyf-anasayfa (Fon getirileri)

**Artılar:** Gerçek veri
**Eksiler:** Yasal sorun riski, güncellemeler zor, server load

#### Seçenek 2: Statik Veri (Önerilen)
EGM'den aylık/haftalık manuel export:
- Excel dosyası indir
- JSON'a çevir
- `js/bes-data.js` dosyasına ekle
- Haftada bir güncelle

**Artılar:** Yasal, güvenli, kolay
**Eksiler:** Gerçek zamanlı değil (haftalık güncelleme)

#### Seçenek 3: BES'i Devre Dışı Bırak (Geçici)
TEFAS çalışana kadar BES'i gizle:
```javascript
features: {
    showBES: false,  // API bulana kadar kapalı
}
```

**Artılar:** Kullanıcı boş veri görmez
**Eksiler:** BES fonları yok

### ÖNERİ: Seçenek 2 + 3 Kombinasyonu
1. Şimdilik BES'i kapat (`showBES: false`)
2. EGM'den haftalık veri export et
3. JSON dosyası oluştur
4. Hazır olunca aktif et

---

## 🎯 ŞİMDİ YAPILACAKLAR

### Öncelik 1: TEFAS'ı Aktif Et (10 dakika) ✅
1. Cloudflare Worker deploy et
2. Config güncelle
3. Test et
4. Commit/push

### Öncelik 2: BES Stratejisi Belirle
**Soru:** BES için ne yapalım?

**A)** Haftalık manuel güncelleme (statik JSON)
- Ben script yazarım, sen haftada bir export edersin
- 5 dakikalık iş, güvenli ve yasal

**B)** Şimdilik BES'i kapat
- TEFAS yeterli (20 fon)
- İleride API bulunca aktif ederiz

**C)** Web scraping proxy
- Ben scraper yazarım (riskli)
- Cloudflare Worker üzerinden EGM'yi scrape eder

**HANGİSİNİ TERCİH EDİYORSUN?**

---

## 💰 Maliyet Özeti

| Servis | Aylık İstek | Maliyet |
|--------|-------------|---------|
| TEFAS (Cloudflare Worker) | ~50,000 | **ÜCRETSİZ** |
| BES Seçenek A (Manuel) | 0 | **ÜCRETSİZ** |
| BES Seçenek B (Kapalı) | 0 | **ÜCRETSİZ** |
| BES Seçenek C (Scraping) | ~50,000 | **ÜCRETSİZ** (ama riskli) |

**TOPLAM MALİYET: 0 TL/ay** 🎉

---

## 📋 Sonraki Adımlar

1. **ŞİMDİ:** Cloudflare Worker deploy et (10 dk)
2. **SONRA:** BES stratejisi seç (A, B veya C)
3. **TEST:** TEFAS fonlarını kontrol et
4. **OPTİMİZE:** Cache stratejisi geliştir

---

## 🔗 Kaynaklar

- TEFAS Resmi: https://www.tefas.gov.tr
- TEFAS API Dokümantasyon: https://ws.tefas.gov.tr
- EGM Veri Merkezi: https://www.egm.org.tr/data-center
- Cloudflare Workers: https://dash.cloudflare.com
- Projede hazır kod: `cloudflare-workers/tefas-proxy.js`
