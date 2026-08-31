Yapılan Geliştirmeler Özeti
Genel Özellik Erişim Sistemi (Admin Paneli):



AdminPage.tsx
'e yeni "Özellik Yönetimi" sekmesi eklendi.
Her kullanıcı için Notlarım, Takvim, Harcamalar, Gezi Planlayıcı, Listelerim, İstatistikler, Aktiviteler, Harita, Dizi Takibi ve Kalori AI özellikleri tek tek açılıp kapatılabilir.
Normal özellikler varsayılan olarak açık, Kalori AI ise sadece adminin açtığı kullanıcılara özeldir.
Mobil Odaklı Kalori AI Chatbot:

ChatGPT / Gemini App Benzeri Deneyim: 

CalorieChatPage.tsx
 mobil odaklı tam ekran sohbet düzeni.
Fotoğraf Çekimi & Yükleme: 

CalorieChatInput.tsx
 ile doğrudan mobil kamera veya galeriden fotoğraf seçimi.
Gizlilik: Fotoğraflar veritabanına kaydedilmez, sadece analiz için base64 olarak Gemini'ye iletilir.
Öğün Kaydı: AI'ın fotoğraftan çıkardığı besinler (3 domates, 100g peynir vb.), toplam kalori, protein, karbonhidrat ve yağ değerleri 

CalorieChatMessage.tsx
 üzerinde kart olarak gösterilir ve Firestore calorie_chats koleksiyonunda saklanır.
Depolama Takibi & Temizlik: Sohbet geçmişi menüsünde toplam verilerin kaç KB/MB/GB yer kapladığı gösterilir; istenilen sohbet tek tıkla silinebilir.
Backend & Netlify Function:



calorie-chat.ts
: Gemini 2.0 Flash multimodal endpoint'i.
🔑 Yeni Gemini API Key Alma Rehberi
Google AI Studio'ya Gidin: https://aistudio.google.com/apikey adresini açıp Google hesabınızla giriş yapın.
API Key Oluşturun: "Create API key" butonuna tıklayın ve "Create API key in new project" seçeneğini seçin.
Key'i Kopyalayın: Size verilen AIzaSy... ile başlayan anahtarı kopyalayın.
Ortam Değişkenine Ekleyin:
Lokalde çalışmak için: .env dosyanıza GEMINI_API_KEY=kopyaladığınız_anahtar satırını ekleyin.
Netlify (Canlı Ortam) için: Netlify Panel → Site configuration → Environment variables → GEMINI_API_KEY olarak ekleyin.