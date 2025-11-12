# 📱 Finans Akademi - Native iOS & macOS App

Native Swift uygulaması - iPhone, iPad ve Mac için Finans Akademi.

## 🎯 Özellikler

- ✅ **Native Performance** - SwiftUI ile tam native deneyim
- ✅ **Offline Mode** - İnternet olmadan önbellekten çalışır
- ✅ **Universal App** - Tek kod, iOS + macOS
- ✅ **Modern UI** - Native navigation, gestures, keyboard shortcuts
- ✅ **Caching** - WKWebView automatic caching for faster load
- ✅ **Safe Browsing** - Sandboxed WebView security

## 📋 Gereksinimler

- **macOS Ventura 13.0+** (Xcode için)
- **Xcode 15.0+**
- **iOS 15.0+** (iPhone/iPad)
- **macOS 12.0+** (Monterey veya üstü)

## 🚀 Kurulum & Çalıştırma

### Yöntem 1: Xcode ile (Önerilen)

1. **Xcode Project Oluştur:**

```bash
cd FinansAkademiApp
open -a Xcode
```

2. **File → New → Project** seçin:
   - Platform: **iOS** seçin
   - Template: **App** seçin
   - **Next** tıklayın

3. **Project ayarları:**
   - Product Name: `FinansAkademi`
   - Team: Sizin Apple Developer Team'iniz
   - Organization Identifier: `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - **Next** → **Create**

4. **Dosyaları Import Edin:**
   - Sol panelde `FinansAkademi` klasörüne sağ tıklayın
   - **Add Files to "FinansAkademi"** seçin
   - `FinansAkademi/Shared/` klasöründeki tüm `.swift` dosyalarını seçin
   - ✅ **Copy items if needed** işaretleyin
   - ✅ **Create groups** seçin
   - Targets: **FinansAkademi (iOS)** işaretli olsun
   - **Add** tıklayın

5. **macOS Target Ekleyin:**
   - Project settings'e gidin (sol panelde en üstteki mavi ikon)
   - Alt kısımda **+ (Add Target)** butonuna tıklayın
   - **macOS** → **App** seçin
   - Product Name: `FinansAkademi`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - **Finish**

6. **Shared Dosyaları macOS'a Ekleyin:**
   - Sol panelde `Shared/*.swift` dosyalarına tıklayın
   - Sağ panelde **Target Membership** bölümünde:
   - ✅ iOS target işaretli
   - ✅ macOS target işaretli

7. **Info.plist Dosyalarını Ekleyin:**
   - iOS için: `iOS/Info.plist` dosyasını iOS target'a ekleyin
   - macOS için: `macOS/Info.plist` dosyasını macOS target'a ekleyin

8. **URL'i Güncelleyin:**
   - `Shared/WebViewModel.swift` dosyasını açın
   - `url` değişkenini sitenizin URL'sine güncelleyin:

```swift
@Published var url: URL? = URL(string: "https://your-site-url.com/")
```

9. **Çalıştırın:**
   - **Scheme**: `FinansAkademi (iOS)` veya `FinansAkademi (macOS)` seçin
   - **Device**: iPhone Simulator veya Mac seçin
   - **Run** butonuna basın (⌘R)

### Yöntem 2: Manuel Xcode Project (Hızlı)

Bu script otomatik olarak Xcode projesi oluşturur:

```bash
cd /Users/melihcanaltan/Desktop/Finans/FinansAkademiApp
chmod +x create_xcode_project.sh
./create_xcode_project.sh
```

Script tamamlandığında:

```bash
open FinansAkademi.xcodeproj
```

Xcode açıldığında direkt **Run** (⌘R) yapabilirsiniz!

## 🔧 Xcode'da Ayarlar

### Bundle Identifier Güncelleme

1. Project settings → **Targets** → **FinansAkademi (iOS)**
2. **Signing & Capabilities** tab
3. **Bundle Identifier**: `com.yourname.finansakademi` olarak değiştirin
4. **Team**: Apple Developer hesabınızı seçin

macOS target için de aynı adımları tekrarlayın.

### App Icons Ekleme

App icon'ları eklemek için:

1. 1024x1024 boyutunda bir PNG hazırlayın
2. [https://www.appicon.co/](https://www.appicon.co/) sitesinde tüm boyutları oluşturun
3. Xcode'da **Assets.xcassets** → **AppIcon** açın
4. Her boyut için ilgili PNG'yi sürükle-bırak yapın

## 📱 iOS Özellikler

- ✅ Native navigation bar
- ✅ Swipe gestures (geri/ileri)
- ✅ Pull-to-refresh
- ✅ Safe area support
- ✅ Landscape & portrait modes

## 💻 macOS Özellikler

- ✅ Menu bar commands
- ✅ Keyboard shortcuts:
  - ⌘R - Yenile (Reload)
  - ⌘[ - Geri (Back)
  - ⌘] - İleri (Forward)
- ✅ Window management
- ✅ Native window controls

## 🎨 Özelleştirme

### URL Değiştirme

`Shared/WebViewModel.swift` dosyasında:

```swift
@Published var url: URL? = URL(string: "https://your-new-url.com/")
```

### App İsmi Değiştirme

1. **iOS**: `iOS/Info.plist` → **CFBundleDisplayName**
2. **macOS**: `macOS/Info.plist` → **CFBundleDisplayName**

### Renkler & Tema

`Shared/ContentView.swift` dosyasında navigation bar renklerini değiştirebilirsiniz.

## 📦 App Store'a Gönderme

### iOS App Store

1. **Archive** oluşturun:
   - **Product** → **Archive**
   - Archive tamamlandığında **Organizer** açılır

2. **Validate** edin:
   - Archive'i seçin
   - **Validate App** tıklayın
   - Hataları düzeltin

3. **Submit** edin:
   - **Distribute App** tıklayın
   - **App Store Connect** seçin
   - **Upload** tıklayın

4. **App Store Connect**'te:
   - [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
   - Yeni app oluşturun
   - Screenshots, açıklama ekleyin
   - **Submit for Review**

### macOS App Store

Aynı adımları macOS target ile tekrarlayın.

## 🐛 Sorun Giderme

### "No such module 'WebKit'"

- Xcode → **File** → **Project Settings** → **Build System**: **New Build System** seçin
- Clean Build Folder (⌘⇧K)
- Build (⌘B)

### "Signing requires a development team"

- Project settings → **Signing & Capabilities**
- **Automatically manage signing** işaretleyin
- **Team** dropdown'dan hesabınızı seçin

### "Couldn't load the page"

- `WebViewModel.swift` dosyasındaki URL'i kontrol edin
- İnternet bağlantınızı kontrol edin
- Simulator'ü restart edin

### macOS'ta "App is damaged"

- Terminal'de:

```bash
xattr -cr /Applications/FinansAkademi.app
```

## 📸 Screenshots

iOS ve macOS için App Store screenshots almanız gerekecek:

- **iOS**: 6.7" (iPhone 15 Pro Max) ve 5.5" (iPhone 8 Plus)
- **macOS**: 1280x800 minimum

## 🔐 Privacy & Permissions

App şu izinleri kullanır:

- **Internet Access** - Web sitesini yüklemek için
- **Cache Storage** - Offline mode için

`Info.plist` dosyalarında `NSAppTransportSecurity` ayarlanmış.

## 📄 Lisans

Bu uygulama Finans Akademi web sitesinin native wrapper'ıdır.

## 🤝 Destek

Sorular için:
- GitHub Issues
- Email: your@email.com

---

**Built with ❤️ using Swift & SwiftUI**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
