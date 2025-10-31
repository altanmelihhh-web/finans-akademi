# 🚀 Deployment Rehberi - Finans Akademi

Bu dosya Firebase ve Cloudflare Pages kurulum talimatlarını içerir.

## 📋 Gereksinimler

- GitHub hesabı
- Google/Firebase hesabı (ücretsiz)
- Cloudflare hesabı (ücretsiz)

## 🔥 Firebase Kurulumu

### Adım 1: Firebase Projesi Oluştur

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. **Add project** butonuna tıklayın
3. Proje adını girin: `finans-akademi` (veya istediğiniz isim)
4. Google Analytics: İstersen etkinleştir (opsiyonel)
5. **Create project** tıklayın

### Adım 2: Authentication Kurulumu

1. Sol menüden **Authentication** seçin
2. **Get started** butonuna tıklayın
3. **Sign-in method** sekmesine gidin
4. **Google** provider'ı seçin ve **Enable** et
5. Support email adresinizi seçin
6. **Save** butonuna tıklayın

### Adım 3: Firestore Database Kurulumu

1. Sol menüden **Firestore Database** seçin
2. **Create database** butonuna tıklayın
3. **Production mode** seçin (security rules ekleyeceğiz)
4. Location seçin: `europe-west1` (Avrupa için)
5. **Enable** tıklayın

### Adım 4: Firestore Security Rules

1. **Rules** sekmesine gidin
2. Aşağıdaki kuralları yapıştırın:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Kullanıcılar sadece kendi verilerini okuyabilir/yazabilir
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

3. **Publish** butonuna tıklayın

### Adım 5: Firebase Config Al

1. **Project Overview** (sol üst) > ⚙️ **Project settings**
2. **General** sekmesinde aşağı kaydırın
3. **Your apps** bölümünde **</>** (Web app) ikonuna tıklayın
4. App nickname: `finans-akademi-web`
5. Firebase Hosting: **Ekleme** (Cloudflare kullanacağız)
6. **Register app** tıklayın
7. Firebase config bilgilerini kopyalayın

### Adım 6: Firebase Config Dosyası Oluştur

1. Proje klasöründe `js/firebase-config.template.js` dosyasını kopyalayın
2. `js/firebase-config.js` olarak kaydedin
3. Config bilgilerini yapıştırın:

\`\`\`javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "finans-akademi-xxxxx.firebaseapp.com",
    projectId: "finans-akademi-xxxxx",
    storageBucket: "finans-akademi-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
    measurementId: "G-XXXXXXXXXX"
};
\`\`\`

## 📦 GitHub'a Yükleme

### Adım 1: Local Test

\`\`\`bash
# Proje klasörüne gidin
cd /Users/melihcanaltan/Desktop/Finans

# Local server başlatın
python3 -m http.server 8000

# Tarayıcıda test edin
# http://localhost:8000
\`\`\`

### Adım 2: Git Repository Oluştur

\`\`\`bash
# Git init (zaten yapıldı)
git init

# Dosyaları ekle
git add .

# Commit yap
git commit -m "Initial commit: Finans Akademi with Firebase integration"

# GitHub'da yeni repository oluştur
# https://github.com/new adresine gidin
# Repository adı: finans-akademi
# Public veya Private seç
# Diğer seçenekleri işaretleme (README zaten var)

# Remote ekle (GitHub'dan kopyaladığın URL'i kullan)
git remote add origin https://github.com/KULLANICI_ADIN/finans-akademi.git

# Push yap
git branch -M main
git push -u origin main
\`\`\`

## ☁️ Cloudflare Pages Deployment

### Adım 1: Cloudflare Hesabı Oluştur

1. [Cloudflare](https://dash.cloudflare.com/sign-up) adresine gidin
2. Email ve şifre ile kayıt olun
3. Email onayı yapın

### Adım 2: Pages Projesi Oluştur

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Pages** sekmesine gidin
2. **Create a project** butonuna tıklayın
3. **Connect to Git** seçin
4. **GitHub** seçin ve yetkilendir
5. Repository'nizi seçin: `finans-akademi`
6. **Begin setup** tıklayın

### Adım 3: Build Ayarları

\`\`\`
Project name: finans-akademi
Production branch: main
Framework preset: None
Build command: (boş bırak)
Build output directory: /
\`\`\`

**Save and Deploy** tıklayın

### Adım 4: Environment Variables Ekle

1. Cloudflare Pages > Proje seç > **Settings** > **Environment variables**
2. **Add variable** butonuna tıklayın
3. Şu değişkenleri ekleyin (Firebase config'ten alın):

\`\`\`
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=finans-akademi-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=finans-akademi-xxxxx
FIREBASE_STORAGE_BUCKET=finans-akademi-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
\`\`\`

4. **Save** butonuna tıklayın

### Adım 5: Firebase Authorized Domains

1. Firebase Console > **Authentication** > **Settings** sekmesi
2. **Authorized domains** bölümüne gidin
3. **Add domain** tıklayın
4. Cloudflare Pages URL'ini ekleyin:
   - `finans-akademi.pages.dev` (veya custom domain'iniz)
5. **Add** tıklayın

### Adım 6: Deployment Tamamlandı! 🎉

- Cloudflare otomatik olarak deploy edecek (1-2 dakika)
- **View build** tıklayarak ilerlemeyi takip edin
- Deploy tamamlandığında link verilecek

## 🔄 Güncellemeler

Her GitHub push otomatik olarak Cloudflare'e deploy edilir:

\`\`\`bash
# Değişiklik yap
git add .
git commit -m "Update: yeni özellik eklendi"
git push

# Cloudflare otomatik deploy eder
\`\`\`

## 🌐 Custom Domain (Opsiyonel)

1. Cloudflare Pages > Proje > **Custom domains**
2. **Set up a custom domain** tıklayın
3. Domain adını girin (örn: `finansakademi.com`)
4. Cloudflare'in DNS kayıtlarını domain sağlayıcınıza ekleyin
5. SSL/TLS otomatik aktif olur

## 🐛 Sorun Giderme

### Firebase Config Bulunamadı

- `js/firebase-config.js` dosyasının var olduğundan emin olun
- Console'da hata kontrolü yapın (F12)
- LocalStorage modunda çalışır (Firebase olmadan)

### Google Giriş Çalışmıyor

- Firebase Authorized domains'i kontrol edin
- Popup blocker'ı devre dışı bırakın
- HTTPS üzerinden eriştiğinizden emin olun

### Cloudflare Build Hatası

- Build logs'u kontrol edin
- Environment variables'ı doğru girdiğinizden emin olun
- Repository'nin public olduğundan emin olun

### Veriler Kaydedilmiyor

- Firestore Security Rules'u kontrol edin
- Console'da Firestore hatalarına bakın
- Authentication durumunu kontrol edin

## 📊 Monitoring

### Firebase Console
- **Authentication** > Users: Kullanıcı sayısı
- **Firestore** > Data: Kaydedilen veriler
- **Usage**: Quota kullanımı

### Cloudflare Analytics
- Pages > Proje > **Analytics**
- Ziyaretçi sayısı, bandwidth, errors

## 💰 Maliyet

Her iki platform da ücretsiz planı kullanır:

**Firebase (Spark Plan - Free):**
- 10,000 document reads/day
- 10,000 document writes/day
- 1 GB storage
- 50,000 Authentication users

**Cloudflare Pages (Free):**
- Unlimited requests
- Unlimited bandwidth
- 500 builds/month
- 1 build at a time

## 📞 Destek

Sorun yaşarsan:
1. Console logs'u kontrol et (F12)
2. Firebase Console > Usage'ı kontrol et
3. Cloudflare build logs'u incele
4. GitHub Issues'a mesaj yaz

---

**İyi Şanslar! 🚀**
