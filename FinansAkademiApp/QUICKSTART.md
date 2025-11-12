# ⚡ Quick Start - 5 Dakikada iOS & macOS App

En hızlı yol ile native uygulama oluşturma rehberi.

## 🎯 Adım 1: Xcode'u Aç (30 saniye)

```bash
open -a Xcode
```

Xcode açıldığında **"Create New Project"** tıklayın.

## 📱 Adım 2: iOS Project Oluştur (1 dakika)

1. **Platform**: iOS seçin
2. **Template**: App seçin → **Next**
3. **Project Settings**:
   - Product Name: `FinansAkademi`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - ✅ Use Core Data: **İŞARETSİZ** bırakın
   - ✅ Include Tests: **İŞARETSİZ** bırakın
4. **Next** → Save to Desktop
5. **Create**

## 📝 Adım 3: Dosyaları Ekle (2 dakika)

### 3.1 Mevcut Dosyaları Sil

Sol panelde:
- `ContentView.swift` dosyasına sağ tıklayın → **Delete** → **Move to Trash**
- `FinansAkademiApp.swift` dosyasına sağ tıklayın → **Delete** → **Move to Trash**

### 3.2 Yeni Dosyaları Ekle

1. Finder'da `FinansAkademiApp/FinansAkademi/Shared/` klasörünü açın

2. **Tüm `.swift` dosyalarını seçin** (4 dosya):
   - FinansAkademiApp.swift
   - ContentView.swift
   - WebView.swift
   - WebViewModel.swift

3. Dosyaları **sürükle-bırak** ile Xcode'daki `FinansAkademi` klasörüne taşıyın

4. Açılan pencerede:
   - ✅ **Copy items if needed** işaretleyin
   - ✅ **Create groups** seçin
   - ✅ **FinansAkademi** target işaretli olsun
   - **Finish**

### 3.3 Info.plist Güncelle

1. Sol panelde `Info.plist` dosyasına tıklayın (veya bulunuyorsa `FinansAkademi` → **Info** tab'ına gidin)

2. **Sağ tıklayın** → **Open As** → **Source Code**

3. `<dict>` tag'inden hemen sonra ekleyin:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

4. **Save** (⌘S)

## 🚀 Adım 4: Çalıştır! (30 saniye)

1. Üstteki **Scheme**'de device seçin:
   - **iPhone 15 Pro** (simulator)

2. **Run** butonuna basın (▶️ veya ⌘R)

3. **Build & Run** başlayacak...

4. **Simulator açılacak ve uygulamanız çalışacak!** 🎉

## 💻 BONUS: macOS Uygulaması (2 dakika)

iOS uygulaması çalıştıktan sonra macOS versiyonu ekleyin:

1. Project settings'e gidin (sol panelde en üstteki mavi ikon)
2. Alt kısımda **+** (Add Target) tıklayın
3. **macOS** → **App** seçin
4. Product Name: `FinansAkademi`
5. **Finish**

6. Sol panelde **Shared klasöründeki tüm .swift dosyalarına** tıklayın
7. Sağ panelde **Target Membership**:
   - ✅ FinansAkademi (iOS)
   - ✅ FinansAkademi (macOS) ← Bunu işaretleyin

8. macOS Info.plist ekleyin:
   - `macOS/Info.plist` dosyasını macOS target klasörüne sürükleyin

9. **Scheme**: `FinansAkademi (macOS)` seçin
10. **Device**: **My Mac** seçin
11. **Run** (⌘R)

**Mac uygulamanız açıldı!** 💻

## ⚙️ URL'i Değiştirme (30 saniye)

1. `WebViewModel.swift` dosyasını açın

2. 14. satırı bulun:

```swift
@Published var url: URL? = URL(string: "https://altanmelihhh-web.github.io/finans-akademi/")
```

3. URL'i kendi sitenize değiştirin:

```swift
@Published var url: URL? = URL(string: "https://your-site.com/")
```

4. **Save** (⌘S) ve **Run** (⌘R)

## 🎨 App Icon Ekleme (Opsiyonel)

1. 1024x1024 PNG hazırlayın
2. [https://www.appicon.co/](https://www.appicon.co/) sitesinde tüm boyutları oluşturun
3. Xcode → **Assets.xcassets** → **AppIcon** açın
4. Her boyut için PNG'yi sürükle-bırak yapın

## ✅ Başarı Kontrolü

Uygulama çalışıyorsa:

- ✅ Finans Akademi web sitesi görünüyor
- ✅ Menüler çalışıyor
- ✅ Geri/ileri butonları çalışıyor
- ✅ Yenile butonu çalışıyor

## 🐛 Sorun mu var?

### Build Failed

- Clean Build Folder: **Product** → **Clean Build Folder** (⌘⇧K)
- **Product** → **Build** (⌘B)

### "No such module WebKit"

- Xcode → **File** → **Project Settings**
- **Build System**: **New Build System**
- Clean & Build

### Simulator açılmıyor

- **Xcode** → **Settings** → **Platforms**
- iOS Simulator indirin (varsa güncelleyin)

### URL yüklenmiyor

- `WebViewModel.swift` dosyasındaki URL'i kontrol edin
- İnternet bağlantınızı kontrol edin

## 📦 App Store'a Gönderme

1. **Product** → **Archive**
2. **Validate App**
3. **Distribute App**
4. App Store Connect'te yayınlayın

Detaylı bilgi için `README.md` dosyasına bakın.

---

**🎉 Tebrikler! Native iOS & macOS uygulamanız hazır!**

Sorular için: README.md dosyasındaki **Sorun Giderme** bölümüne bakın.
