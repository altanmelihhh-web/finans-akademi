# 📱 Xcode Proje Kurulumu - Adım Adım Rehber

## 🎯 Adım 1: Xcode'u Açın

```bash
open -a Xcode
```

Veya Spotlight (⌘Space) ile "Xcode" yazın.

## 📝 Adım 2: Yeni Proje Oluşturun

Xcode açıldığında:

1. **"Create New Project"** butonuna tıklayın
   - Veya: File → New → Project (⌘⇧N)

2. **Platform Seçimi:**
   - **iOS** sekmesini seçin (üstte)
   - **App** template'ini seçin
   - **Next** tıklayın

## ⚙️ Adım 3: Proje Ayarları

### Project Options ekranında:

**Product Name:** `FinansAkademi`

**Team:**
- Apple Developer hesabınızı seçin
- Yoksa: "Add Account" → Apple ID ile giriş yapın

**Organization Identifier:** `com.yourname`
- Örnek: `com.melihcanaltanhh`
- Benzersiz olmalı (reverse domain)

**Bundle Identifier:** (Otomatik oluşur)
- Örnek: `com.melihcanaltanhh.FinansAkademi`

**Interface:** **SwiftUI** (önemli!)

**Language:** **Swift**

**Storage:** Core Data ve CloudKit **İŞARETSİZ** bırakın

**Include Tests:** İşaretsiz bırakabilirsiniz

**Next** tıklayın

## 💾 Adım 4: Kaydetme Konumu

1. **Konum seçin:** Desktop veya FinansAkademiApp klasörü
2. **Git**: "Create Git repository" işaretli bırakın
3. **Create** tıklayın

**Xcode projesi oluşturuldu!** ✅

---

## 🗑️ Adım 5: Default Dosyaları Silin

Sol panelde (Project Navigator):

1. **`ContentView.swift`** dosyasına **sağ tıklayın**
   - **Delete** seçin
   - **Move to Trash** tıklayın

2. **`FinansAkademiApp.swift`** dosyasına **sağ tıklayın**
   - **Delete** seçin
   - **Move to Trash** tıklayın

---

## 📂 Adım 6: Swift Dosyalarını Ekleyin

### Finder'ı Açın:

```bash
open /Users/melihcanaltan/Desktop/Finans/FinansAkademiApp/FinansAkademi/Shared/
```

### Dosyaları Xcode'a Ekleyin:

1. Finder'da **4 Swift dosyasını seçin:**
   - FinansAkademiApp.swift
   - ContentView.swift
   - WebView.swift
   - WebViewModel.swift

2. **Sürükle-bırak** ile Xcode'daki **FinansAkademi** klasörüne taşıyın

3. Açılan pencerede:
   - ✅ **Copy items if needed** işaretleyin
   - ✅ **Create groups** seçili
   - ✅ **FinansAkademi (Target)** işaretli
   - **Finish** tıklayın

**Swift dosyaları eklendi!** ✅

---

## 🔧 Adım 7: Info.plist Ayarı

### URL Yüklemek İçin İzin Ekleyin:

1. Sol panelde **`Info.plist`** dosyasını bulun
   - Yoksa: FinansAkademi → Info tab'ına gidin

2. **Sağ tıklayın** → **Open As** → **Source Code**

3. `<dict>` tag'inden **hemen sonra** bu kodu ekleyin:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

4. **File → Save** (⌘S)

**Güvenlik ayarı eklendi!** ✅

---

## 🎨 Adım 8: URL'inizi Güncelleyin

1. Sol panelde **`WebViewModel.swift`** dosyasını açın

2. **14. satırı** bulun:

```swift
@Published var url: URL? = URL(string: "https://altanmelihhh-web.github.io/finans-akademi/")
```

3. Kendi site URL'nizi yazın (veya öyle bırakın)

4. **Save** (⌘S)

---

## ▶️ Adım 9: İlk Test - iOS Simulator

### Simulator Seçin:

1. Üstte **Scheme** dropdown'ını açın (play butonunun yanında)
2. **FinansAkademi** seçili olmalı
3. **Device/Simulator** seçin:
   - **iPhone 15 Pro** (önerilen)
   - Veya başka bir iPhone modeli

### Çalıştırın:

1. **Run** butonuna basın (▶️ ikonu)
   - Veya: **⌘R** (Product → Run)

2. **Build başlayacak...**
   - İlk build 1-2 dakika sürebilir
   - Alt kısımda progress bar göreceksiniz

3. **Simulator açılacak!**
   - Uygulamanız otomatik yüklenecek
   - Finans Akademi web sitesi görünecek

**İLK TEST BAŞARILI!** 🎉📱

---

## 🐛 Hata Alırsanız:

### "Signing requires a development team"

**Çözüm:**
1. Project settings → **Signing & Capabilities**
2. ✅ **Automatically manage signing** işaretleyin
3. **Team** dropdown'dan Apple ID'nizi seçin

### "Bundle Identifier is not available"

**Çözüm:**
1. Bundle Identifier'ı değiştirin:
   - `com.yourname.FinansAkademi` → `com.yourname.FinansAkademiApp`

### "No such module 'WebKit'"

**Çözüm:**
1. **Product → Clean Build Folder** (⌘⇧K)
2. **Product → Build** (⌘B)

### Build Failed

**Çözüm:**
1. Xcode'u kapatın
2. `~/Library/Developer/Xcode/DerivedData` klasörünü silin
3. Xcode'u tekrar açın
4. Build edin

---

## 💻 Adım 10: macOS Target Ekleyin (Opsiyonel)

### macOS Uygulaması Eklemek İçin:

1. **Project settings'e gidin** (sol panelde en üstteki mavi ikon)

2. Alt kısımda **+ (Add Target)** tıklayın

3. **macOS** → **App** seçin

4. **Product Name:** `FinansAkademi`

5. **Interface:** SwiftUI

6. **Language:** Swift

7. **Finish**

### Shared Dosyaları macOS'a Ekleyin:

1. Sol panelde **tüm `.swift` dosyalarına** tıklayın (⌘ ile çoklu seçim)

2. Sağ panelde **Target Membership** bölümünde:
   - ✅ FinansAkademi (iOS)
   - ✅ FinansAkademi (macOS) ← Bunu işaretleyin

3. macOS Info.plist ekleyin:
   - `FinansAkademiApp/FinansAkademi/macOS/Info.plist` dosyasını
   - macOS target klasörüne sürükleyin

### Mac'te Test Edin:

1. **Scheme:** `FinansAkademi (macOS)` seçin
2. **Device:** **My Mac** seçin
3. **Run** (⌘R)

**Mac uygulamanız açıldı!** 💻✅

---

## 🏆 Adım 11: Gerçek Cihazda Test (Opsiyonel)

### iPhone'unuzu Bağlayın:

1. iPhone'u Mac'e USB ile bağlayın
2. iPhone'da **"Trust This Computer"** onaylayın
3. Xcode'da **Device** seçin (Scheme dropdown)
4. **Run** (⌘R)

**İlk kez gerçek cihazda çalışacak!**

⚠️ **Not:** Gerçek cihaz için Apple Developer Program üyeliği gerekir ($99/yıl)

---

## 📦 Adım 12: Archive Oluşturun (App Store İçin)

### Archive için Hazırlık:

1. **Scheme:** Generic iOS Device seçin (simulator değil!)
2. **Product → Archive** (veya ⌘⇧A düzeltemezse menüden)
3. **Archive başlayacak...** (2-5 dakika)
4. **Organizer** penceresi açılacak

**Archive hazır!** 📦

---

## 🚀 Adım 13: App Store Connect'e Upload

### Organizer'da:

1. Archive'i seçin (en üstteki)
2. **Distribute App** butonuna tıklayın
3. **App Store Connect** seçin → **Next**
4. **Upload** seçin → **Next**
5. Ayarları default bırakın → **Next**
6. **Automatically manage signing** → **Next**
7. **Upload** tıklayın

**Upload başlayacak!** (5-10 dakika)

---

## ✅ Başarı Mesajı:

"Your app was successfully uploaded to App Store Connect"

**Artık App Store Connect'te görünecek!**

---

## 🌐 Adım 14: App Store Connect'te Uygulama Oluşturun

### App Store Connect'e Gidin:

1. https://appstoreconnect.apple.com/
2. **My Apps** tıklayın
3. **+ (New App)** tıklayın

### App Bilgileri:

**Platforms:** iOS (macOS da istiyorsanız işaretleyin)

**Name:** Finans Akademi

**Primary Language:** Turkish

**Bundle ID:** `com.yourname.FinansAkademi` (dropdown'dan seçin)

**SKU:** `finans-akademi-001` (benzersiz ID)

**User Access:** Full Access

**Create** tıklayın

---

## 📸 Adım 15: App Store Listing

### App Information:

1. **Subtitle:** "Modern Finans Eğitim Platformu" (30 karakter max)
2. **Category:** Education → Primary, Finance → Secondary
3. **Content Rights:** Yok (çocuklara uygun)

### Pricing:

- **Price:** Free (veya ücretli)
- **Availability:** Tüm ülkeler

### Screenshots:

**Gerekli Boyutlar:**
- 6.7" Display (iPhone 15 Pro Max): 1290 x 2796
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

Simulator'de screenshot alın: **⌘S**

**En az 2-3 screenshot** gerekli (maksimum 10)

### Description:

```
Finans Akademi ile modern finans dünyasını öğrenin!

ÖZELLİKLER:
• 30 Günlük Öğrenme Planı
• İnteraktif Trading Simülatörü
• Gerçek Zamanlı Piyasa Verileri
• Grafik Analizi Eğitimi
• Güncel Finans Haberleri

Borsa, hisse senedi, teknik analiz ve yatırım stratejilerini
pratik yaparak öğrenin. Ücretsiz!
```

### Keywords:

```
finans,borsa,yatırım,hisse,teknik analiz,trading,BES,TEFAS,BIST
```

(100 karakter max, virgülle ayırın)

### Support URL:

```
https://github.com/altanmelihhh-web/finans-akademi
```

### Privacy Policy URL:

Basit bir privacy policy hazırlayın veya:
```
https://yoursite.com/privacy
```

---

## 🎬 Adım 16: Submit for Review

### App Review Information:

**Contact Information:**
- First Name: İsminiz
- Last Name: Soyisminiz
- Phone Number: +90...
- Email: your@email.com

**Demo Account:** (eğer login gerekliyse)
- Username: -
- Password: -

### Version Release:

- **Manually release:** Ben onayladıktan sonra yayınla
- **Automatically release:** Onaylanınca otomatik yayınla

**Submit for Review** tıklayın!

---

## ⏱️ Review Süreci:

1. **Waiting for Review:** 1-2 gün
2. **In Review:** 1-2 saat
3. **Approved:** ✅ Yayında!

veya

3. **Rejected:** ❌ Düzeltme gerekli

---

## 🎉 Tebrikler!

Uygulamanız artık App Store'da!

**Paylaş:**
- App Store Link: `https://apps.apple.com/app/idXXXXXXXXX`
- QR Kod oluştur
- Sosyal medyada duyur

---

## 📱 App Store Sonrası

### Güncelleme Yayınlama:

1. Xcode'da version değiştir (General → Version)
2. Archive oluştur
3. Upload
4. App Store Connect'te "What's New" yaz
5. Submit for Review

### İstatistikler:

App Store Connect → Analytics
- İndirme sayıları
- Kullanıcı engagement
- Crash raporları

---

**Başarılar!** 🚀📱

🤖 Generated with [Claude Code](https://claude.com/claude-code)
