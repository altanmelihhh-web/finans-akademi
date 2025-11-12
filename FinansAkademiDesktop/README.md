# 💻 Finans Akademi - Desktop App (Electron)

Cross-platform masaüstü uygulaması - Windows, macOS ve Linux için.

## 🚀 Hızlı Başlangıç

### Test Etmek İçin:

```bash
cd FinansAkademiDesktop
npm start
```

Uygulama açılacak ve web siteniz masaüstü app olarak çalışacak!

### Development Mode (Yerel Dosyalarla):

```bash
npm run dev
```

## 📦 Installer Oluşturma

### macOS (.dmg):

```bash
npm run build:mac
```

Çıktı: `dist/Finans Akademi-1.0.0.dmg`

### Windows (.exe):

```bash
npm run build:win
```

Çıktı: `dist/Finans Akademi Setup 1.0.0.exe`

### Linux (.AppImage, .deb):

```bash
npm run build:linux
```

Çıktı: `dist/Finans Akademi-1.0.0.AppImage`

### Tüm Platformlar (aynı anda):

```bash
npm run build:all
```

## 🎨 App Icon Ekleme

1. **512x512 PNG hazırlayın**

2. Icon formatlarına dönüştürün:
   - macOS: `.icns` (https://cloudconvert.com/png-to-icns)
   - Windows: `.ico` (https://convertio.co/png-ico/)
   - Linux: `.png` (512x512 yeterli)

3. İkonları ekleyin:
   ```
   assets/
   ├── icon.icns  (macOS)
   ├── icon.ico   (Windows)
   └── icon.png   (Linux, 512x512)
   ```

4. Build edin!

## ⚙️ Özelleştirme

### URL Değiştirme

`main.js` dosyasında 11. satır:

```javascript
const PRODUCTION_URL = 'https://your-site-url.com/';
```

### App Adı

`package.json` → `productName`:

```json
"productName": "Yeni İsim"
```

### Versiyon

`package.json` → `version`:

```json
"version": "1.0.1"
```

## 🎯 Özellikler

- ✅ Native menü çubuğu (File, Edit, View, Navigate, Help)
- ✅ Keyboard shortcuts:
  - ⌘/Ctrl+R - Yenile
  - ⌘/Ctrl+[ - Geri
  - ⌘/Ctrl+] - İleri
  - ⌘/Ctrl+H - Ana Sayfa
  - ⌘/Ctrl+Shift+I - Developer Tools
- ✅ External links otomatik tarayıcıda açılır
- ✅ Single instance (birden fazla pencere açılmaz)
- ✅ Window state persistent
- ✅ Offline cache support

## 📂 Dosya Yapısı

```
FinansAkademiDesktop/
├── main.js              # Ana Electron process
├── package.json         # Konfigürasyon & build ayarları
├── assets/              # App icons
│   ├── icon.icns
│   ├── icon.ico
│   └── icon.png
└── dist/                # Build çıktıları (otomatik oluşur)
    ├── mac/
    ├── win/
    └── linux/
```

## 🔧 Build Ayarları

### macOS

- **Kategori**: Education
- **Format**: DMG (drag-drop installer), ZIP
- **Min Version**: macOS 10.13+

### Windows

- **Installer**: NSIS (setup wizard)
- **Portable**: Taşınabilir .exe
- **Desktop shortcut**: Otomatik oluşur

### Linux

- **Format**: AppImage (taşınabilir), DEB (Ubuntu/Debian)
- **Kategori**: Education

## 🚀 Dağıtım

### 1. GitHub Releases

```bash
npm run build:all
```

`dist/` klasöründeki dosyaları GitHub Releases'a yükleyin.

### 2. Auto-Update (İleri Seviye)

electron-updater ekleyin:

```bash
npm install electron-updater
```

`main.js` içinde:

```javascript
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

### 3. Kod İmzalama (Opsiyonel)

**macOS:**
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
npm run build:mac
```

**Windows:**
```bash
export WIN_CSC_LINK=/path/to/certificate.pfx
export WIN_CSC_KEY_PASSWORD=your_password
npm run build:win
```

## 💡 İpuçları

### Development'ta Web Sitesi Değiştirmek

`main.js` içinde `isDev` kontrol eder:
- `true`: `../index.html` (yerel)
- `false`: Production URL

### Console Logs

DevTools açmak için: `Cmd/Ctrl+Shift+I`

### Cache Temizleme

```bash
rm -rf ~/Library/Application\ Support/finans-akademi/
```

## 🐛 Sorun Giderme

### Build Failed

```bash
# Cache temizle
rm -rf node_modules dist
npm install
npm run build
```

### macOS "App is damaged"

```bash
xattr -cr /Applications/Finans\ Akademi.app
```

### Windows SmartScreen Warning

Normal! İlk seferde Windows bu uyarıyı gösterir. "More info" → "Run anyway"

Kod imzalama ile bu uyarıyı kaldırabilirsiniz.

## 📊 Boyutlar

- **macOS DMG**: ~150 MB
- **Windows Installer**: ~120 MB
- **Linux AppImage**: ~140 MB

## 🔄 Güncelleme

Versiyon değiştir → Build et → Dağıt

```bash
# package.json version güncelle
"version": "1.0.1"

# Build
npm run build:mac

# Yeni DMG'yi dağıt
```

## 📄 Lisans

MIT License

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
