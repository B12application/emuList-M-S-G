const fs = require("fs");
const pdfParse = require("pdf-parse");

const FILE_PATH = "./ekstre.pdf";

// Tutar metnini temizleyip sayıya çevirir
function parseAmount(str) {
    return parseFloat(
        str
            .replace(/\./g, "")
            .replace(",", ".")
            .replace("TL", "")
            .replace("-", "")
            .trim()
    );
}

// GG.MM.YYYY formatını YYYY-MM-DD formatına çevirir
function formatDate(trDate) {
    const [day, month, year] = trDate.split(".");
    return `${year}-${month}-${day}`;
}

// Açıklama metnindeki gereksiz kelimeleri ve şehir isimlerini temizler[cite: 1]
function cleanDescription(desc) {
    return desc
        .replace(/(Giden Transfer|Gelen Transfer|Encard Harcaması|Diğer|Ödeme|İptal\/İade|Para Yatırma|Para Çekme)/gi, "$1 ")
        .replace(/\d{10,}/g, "") // uzun işlem kodları
        .replace(/\b(ISTANBUL|ANKARA|IZMIR|KAYSERI|ANTALYA|NIGDE|KONYA|TR|TRTR|POS SATIŞ|POS|MAH|CADDESİ|CD|SOK)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

// İşlem metninden temiz bir başlık (Title) üretir[cite: 1]
function extractTitle(desc) {
    const cleaned = cleanDescription(desc).toLowerCase();

    // Öncelikli Özel Tanımlamalar
    if (cleaned.includes("trendyol - yemek") || cleaned.includes("trendyol yemek")) return "Trendyol - Yemek";
    if (cleaned.includes("trendyol")) return "Trendyol";
    if (cleaned.includes("amazon")) return "Amazon";
    if (cleaned.includes("n11")) return "N11";
    if (cleaned.includes("getir")) return "Getir";
    if (cleaned.includes("yemeksepeti")) return "Yemeksepeti";
    if (cleaned.includes("vodafone")) return "Vodafone";
    if (cleaned.includes("binance") || cleaned.includes("bn teknoloji")) return "Binance";
    if (cleaned.includes("microsoft") || cleaned.includes("msbill")) return "Microsoft";
    if (cleaned.includes("steam")) return "Steam";
    if (cleaned.includes("epic games")) return "Epic Games";
    if (cleaned.includes("openai") || cleaned.includes("chatgpt")) return "OpenAI";
    if (cleaned.includes("canva")) return "Canva";

    // Transfer işlemlerinde kişi ismini ayıkla
    if (cleaned.includes("giden transfer") || cleaned.includes("gelen transfer")) {
        let name = cleaned
            .replace("giden transfer", "")
            .replace("gelen transfer", "")
            .split(",")[0]
            .trim();

        // Kelimelerin ilk harflerini büyüt
        return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    // Diğer durumlarda ilk kelimeyi al ve düzelt
    const words = cleaned.split(" ");
    if (words[0]) {
        return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    return "Bilinmeyen İşlem";
}

// Metin içeriğine göre mikro kategorizasyon yapar[cite: 1]
function detectCategory(desc, type) {
    const d = desc.toLowerCase();

    // 1. KRİTİK AYRIMLAR
    if (d.includes("trendyol - yemek") || d.includes("trendyol yemek")) return "Trendyol - Yemek";
    if (d.includes("tema") || d.includes("bağış") || d.includes("vakfı")) return "Bağış & Sosyal Sorumluluk";

    // 2. ARAÇ VE ULAŞIM (Getirilen detaylar)[cite: 1]
    if (d.includes("yedek parça") || d.includes("oto") || d.includes("otomotiv") || d.includes("bakım") || d.includes("lastik")) return "Araç Bakım & Parça";
    if (d.includes("petrol") || d.includes("akaryakıt") || d.includes("opet") || d.includes("shell") || d.includes("total") || d.includes("yurtpet") || d.includes("yakıt")) return "Akaryakıt";
    if (d.includes("obilet") || d.includes("bilet") || d.includes("otobüs") || d.includes("uçak")) return "Ulaşım & Seyahat";

    // 3. TEKNOLOJİ VE DİJİTAL
    if (d.includes("openai") || d.includes("chatgpt") || d.includes("canva") || d.includes("x corp") || d.includes("twitter") || d.includes("google cloud") || d.includes("apple.com/bill")) return "Dijital Abonelik";
    if (d.includes("steam") || d.includes("epic games") || d.includes("microsoft store") || d.includes("msbill") || d.includes("oyun")) return "Oyun & Eğlence";
    if (d.includes("binance") || d.includes("bn teknoloji") || d.includes("kripto")) return "Yatırım & Kripto";

    // 4. EV, MARKET VE CANLILAR[cite: 1]
    if (d.includes("pet shop") || d.includes("petshop") || d.includes("veteriner") || d.includes("alfa pet")) return "Evcil Hayvan";
    if (d.includes("market") || d.includes("a101") || d.includes("bim") || d.includes("sok") || d.includes("şok") || d.includes("migros") || d.includes("file") || d.includes("gıda")) return "Market & Gıda";
    if (d.includes("eczane") || d.includes("hastane") || d.includes("doktor") || d.includes("sağlık")) return "Sağlık";
    if (d.includes("berber") || d.includes("kuaför") || d.includes("gratis") || d.includes("bakım")) return "Kişisel Bakım";

    // 5. GASTRONOMİ
    if (d.includes("getir") || d.includes("yemeksepeti") || d.includes("dominos") || d.includes("pizza") || d.includes("kebap") || d.includes("pide") || d.includes("burger") || d.includes("restoran") || d.includes("lokanta")) return "Dışarıda Yemek";
    if (d.includes("cafe") || d.includes("kafe") || d.includes("kahve") || d.includes("starbucks") || d.includes("mackbear") || d.includes("pastane") || d.includes("simit")) return "Kafe & Tatlı";

    // 6. FATURALAR
    if (d.includes("vodafone") || d.includes("turkcell") || d.includes("telekom")) return "GSM & İnternet";
    if (d.includes("elektrik") || d.includes("su ") || d.includes("asat") || d.includes("kayserigaz") || d.includes("gaz faturası")) return "Ev Faturaları";
    if (d.includes("superonline") || d.includes("millenicom")) return "İnternet Faturası";

    // 7. ALIŞVERİŞ
    if (d.includes("amazon") || d.includes("n11") || d.includes("hepsiburada")) return "Genel Alışveriş (Online)";
    if (d.includes("trendyol") && !d.includes("yemek")) return "Trendyol (Alışveriş)";
    if (d.includes("lcw") || d.includes("defacto") || d.includes("boyner") || d.includes("dolap")) return "Giyim & Aksesuar";

    // 8. EĞİTİM VE RESMİ
    if (d.includes("kurs") || d.includes("akademi") || d.includes("eğitim") || d.includes("udemy")) return "Eğitim & Gelişim";
    if (d.includes("noter") || d.includes("belediye") || d.includes("vergi") || d.includes("harç")) return "Resmi İşlemler & Vergi";

    // 9. FİNANSAL
    if (d.includes("iade")) return "İade Gelen";
    if (d.includes("komisyon") || d.includes("bsmv") || d.includes("masraf")) return "Banka Masraf & Vergi";

    if (type === "income") return "Gelen Transfer & Gelir";
    return "Giden Transfer & Ödemeler";
}

async function run() {
    try {
        const buffer = fs.readFileSync(FILE_PATH);
        const data = await pdfParse(buffer);
        const rawLines = data.text.split("\n");

        // Satırları mantıksal olarak birleştir (Tarih ile başlayan satır yeni işlemdir)
        const mergedLines = [];
        let current = "";
        for (let line of rawLines) {
            line = line.trim();
            if (!line) continue;
            if (/^\d{2}\.\d{2}\.\d{4}/.test(line)) {
                if (current) mergedLines.push(current);
                current = line;
            } else {
                current += " " + line;
            }
        }
        if (current) mergedLines.push(current);

        const transactions = [];

        for (let line of mergedLines) {
            try {
                // PDF Başlık ve alt bilgi satırlarını atla
                if (line.includes("Enpara Bank") || line.includes("www.enpara") || line.includes("Sayfa") || line.includes("Mersis")) continue;

                const dateMatch = line.match(/^\d{2}\.\d{2}\.\d{4}/);
                if (!dateMatch) continue;

                const date = formatDate(dateMatch[0]);

                // --- 2025 ÖNCESİ VERİLERİ FİLTRELEME ---[cite: 1]
                const year = parseInt(date.split("-")[0]);
                if (year < 2025) continue;

                const amounts = line.match(/-?[\d\.,]+ TL/g);
                if (!amounts || amounts.length === 0) continue;

                // İşlem tutarını al (Bakiyeyi değil, işlem miktarını seçer)
                const rawAmount = amounts.length > 1 ? amounts[amounts.length - 2] : amounts[0];
                const amount = Math.abs(parseAmount(rawAmount));
                const type = rawAmount.includes("-") ? "expense" : "income";

                // Kredi kartı ödemeleri ve ATM işlemlerini temizle (İsteğe bağlı)[cite: 1]
                if (line.includes("kredi kartı ödemesi") || line.includes("ATM'sinden para")) continue;

                let desc = line.replace(dateMatch[0], "").replace(/-?[\d\.,]+ TL/g, "").trim();
                desc = cleanDescription(desc);

                const title = extractTitle(desc);
                const category = detectCategory(desc, type);

                if (!title || title.length < 2) continue;

                transactions.push({ title, amount, date, category, description: desc, type });
            } catch (err) { /* Parse hatası alan satırları sessizce atla */ }
        }

        // JSON dosyasına yaz
        fs.writeFileSync("output.json", JSON.stringify(transactions, null, 2));

        // Analiz Raporu[cite: 1]
        const uniqueCategories = new Set(transactions.map(t => t.category));
        console.log("\n" + "=".repeat(40));
        console.log("🚀 İŞLEM TAMAMLANDI!");
        console.log("-".repeat(40));
        console.log(`📅 Filtre: 2025 yılı ve sonrası`);
        console.log(`📊 Toplam Veri Sayısı: ${transactions.length} adet`);
        console.log(`🏷️  Benzersiz Kategori Sayısı: ${uniqueCategories.size} adet`);
        console.log("=".repeat(40));
        console.log(`📋 Kategorileriniz:\n${[...uniqueCategories].sort().join(", ")}`);
        console.log("=".repeat(40) + "\n");

    } catch (err) {
        console.error("❌ Kritik Hata:", err);
    }
}

run();