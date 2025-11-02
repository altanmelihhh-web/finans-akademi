# Cloudflare Workers - Finans Akademi

Bu klasör, Finans Akademi projesi için gerekli Cloudflare Worker'ları içerir.

## 1. TEFAS Proxy Worker

**Amaç:** TEFAS (Türkiye Elektronik Fon Alım Satım Platformu) API'sine CORS olmadan erişim sağlamak.

### Kurulum Adımları:

1. **Cloudflare hesabı oluşturun** (ücretsiz):
   - https://dash.cloudflare.com/sign-up

2. **Worker oluşturun:**
   - Cloudflare Dashboard > Workers & Pages > Create Application
   - "Create Worker" seçeneğini tıklayın
   - Worker'a isim verin: `tefas-proxy` veya `finans-akademi-tefas`

3. **Kodu yapıştırın:**
   - `tefas-proxy.js` dosyasındaki tüm kodu kopyalayın
   - Cloudflare Worker editörüne yapıştırın
   - "Save and Deploy" butonuna tıklayın

4. **Worker URL'ini alın:**
   - Deploy sonrası size bir URL verilir: `https://tefas-proxy.YOUR-SUBDOMAIN.workers.dev`
   - Bu URL'i kopyalayın

5. **Finans Akademi'de ayarlayın:**
   - `js/market-data-pro.js` dosyasını açın
   - `fetchTEFASPrices()` fonksiyonunda şu satırı bulun:
     ```javascript
     const url = `https://ws.tefas.gov.tr/bultenapi/PortfolioInfo/${fund.symbol}/${today}`;
     ```
   - Şununla değiştirin:
     ```javascript
     const url = `https://tefas-proxy.YOUR-SUBDOMAIN.workers.dev/tefas/${fund.symbol}/${today}`;
     ```

### API Kullanımı:

**Health Check:**
```
GET https://tefas-proxy.YOUR-SUBDOMAIN.workers.dev/health
```

**Fon Fiyatı Çekme:**
```
GET https://tefas-proxy.YOUR-SUBDOMAIN.workers.dev/tefas/{FUND_CODE}/{DATE}
```

**Örnek:**
```
GET https://tefas-proxy.YOUR-SUBDOMAIN.workers.dev/tefas/AFH/2025-01-15
```

**Yanıt:**
```json
[
  {
    "FundCode": "AFH",
    "FundName": "Ak Portföy Hisse Senedi Fonu",
    "Date": "2025-01-15",
    "PricePerShare": 125.45,
    "PreviousPricePerShare": 124.78,
    "TotalShares": 1000000,
    "MarketValue": 125450000
  }
]
```

### Rate Limiting

- TEFAS API'si ücretsizdir ancak rate limit olabilir
- Worker kodunda 100ms delay var istekler arasında
- Cloudflare ücretsiz planı: 100,000 istek/gün (yeterlidir)

### Hata Ayıklama

Worker çalışmazsa:
1. Cloudflare Dashboard > Workers > tefas-proxy > Logs kısmından logları kontrol edin
2. Browser Console'da CORS hataları olup olmadığına bakın
3. TEFAS API'si bazı saatlerde güncellenmiyor olabilir (hafta sonu, gece)

---

## 2. BES Proxy Worker (Gelecek)

BES (Bireysel Emeklilik Sistemi) fonları için API entegrasyonu henüz eklenmedi.

### Veri Kaynakları:
- SPK (Sermaye Piyasası Kurulu): https://www.spk.gov.tr
- EGM (Emeklilik Gözetim Merkezi): https://www.egm.org.tr
- Şirket API'leri: AvivaSA, Allianz, Garanti Emeklilik vb.

---

## Maliyet

Cloudflare Workers ücretsiz planı:
- ✅ 100,000 istek/gün
- ✅ Sınırsız worker sayısı
- ✅ Global CDN
- ✅ Otomatik ölçeklendirme

Finans Akademi için yeterlidir!

---

## Destek

Sorun yaşarsanız:
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- TEFAS API Docs: https://www.tefas.gov.tr/api
