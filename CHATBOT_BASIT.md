# ✅ BASIT CHATBOT - ÇALIŞIR GARANTI

## 🚀 Hemen Test Et

1. **Tarayıcıda index.html'i aç**
2. **Sağ alt köşeye bak** → MOR buton (💬) görünmeli
3. **Butona tıkla** → Chat penceresi açılır
4. **Bir şey yaz** → Cevap alırsın

## ✅ Ne Yaptık?

Önceki karmaşık sistemi attık. **200 satır basit kod:**

- ❌ API yok
- ❌ Database yok
- ❌ FastAPI yok
- ❌ OpenAI yok
- ❌ FAISS yok
- ✅ **Sadece JavaScript** → Hemen çalışır

## 💬 Demo Sorular

Chatbot şu soruları anlıyor (demo modunda):

- "Hisse senedi nedir?"
- "Forex nedir?"
- "Bitcoin nedir?"
- "Yatırım tavsiyesi"

Her soru için hazır cevaplar var (js/simple-chatbot.js içinde).

## 🔧 Nasıl Çalışıyor?

```javascript
// 1. Kullanıcı soru sorar
"Hisse senedi nedir?"

// 2. Basit kelime eşleştirme
if (soru.includes('hisse')) {
    return 'Hisse senedi, bir şirketin...'
}

// 3. Cevap gösterilir
```

## 🎨 Özelleştirme

### Daha fazla soru-cevap ekle:

`js/simple-chatbot.js` dosyasını aç, `getResponse()` fonksiyonunu bul:

```javascript
function getResponse(question) {
    const q = question.toLowerCase();

    // BURAYA EKLE:
    if (q.includes('borsa')) {
        return 'Borsa İstanbul, Türkiye\'nin organize borsasıdır.';
    }

    // Varsayılan cevap
    return 'Bu konuda size nasıl yardımcı olabilirim?';
}
```

### Renkleri değiştir:

`js/simple-chatbot.js` içindeki `<style>` bölümünü düzenle:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Değiştir: */
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

## 🚀 Gerçek API'ye Bağla (İsteğe Bağlı)

Daha sonra gerçek chatbot API'si eklemek istersen:

```javascript
// getResponse() fonksiyonunu değiştir:
async function getResponse(question) {
    const response = await fetch('api/chat-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
    });
    const data = await response.json();
    return data.answer;
}
```

## 📊 Viewport Sorunu Çözüldü mü?

Eğer sayfa hala %100 zoom'da sığmıyorsa:

1. F12 → Console
2. Şunu çalıştır:

```javascript
document.querySelectorAll('*').forEach(el => {
    if (el.scrollWidth > window.innerWidth) {
        console.log('OVERFLOW:', el, el.scrollWidth, 'px');
    }
});
```

3. Çıktıyı göster, taşan elementi düzeltelim.

## ✅ Başarı Kontrolü

Console'da görmek istediğin:
```
✅ Basit Chatbot yüklendi!
```

Sağ alt köşede: **MOR BUTON (💬)**

---

**Sonuç:** Artık çalışan bir chatbot var. API, database vs. sonra eklersin!

**İlham:** Kendi chatbot projen → [networksecurityportal-chatbot](https://github.com/altanmelihhh-web/networksecurityportal-chatbot)
