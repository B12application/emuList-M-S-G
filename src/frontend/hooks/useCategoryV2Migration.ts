import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════
// KATEGORİLER 2.0 — KAPSAMLI KEYWORD ENGİNE
// ═══════════════════════════════════════════════════════════════
// Title alanını analiz ederek en doğru kategoriyi belirler.
// Mevcut category alanına DOKUNMAZ, sadece category2 yazar.
// ═══════════════════════════════════════════════════════════════

interface CategoryRule {
  category: string;
  keywords: string[];
  // Bazı keyword'ler diğer kategorilerle çakışabilir, öncelik sırası önemli
  priority: number;
}

// Öncelik sırası: düşük sayı = yüksek öncelik
// Örn: "SHELL-ENDIRLIK AKARY" → hem "shell" (akaryakıt) hem de genel eşleşme
const CATEGORY_V2_RULES: CategoryRule[] = [
  // ══════════════════════════════════════════════
  // ⛽ AKARYAKIT — En yüksek öncelik (çakışma riski yüksek)
  // ══════════════════════════════════════════════
  {
    category: 'Akaryakıt',
    priority: 1,
    keywords: [
      // Büyük zincirler
      'shell', 'opet', 'bp ', 'total', 'petrol ofisi', 'aytemiz', 'alpet',
      'kadoil', 'moil', 'lukoil', 'milangaz', 'sunpet', 'turkuaz',
      // Title'da geçen özel isimler
      'go benzenl', 'go benzinl', 'benzenlik', 'benzinlik',
      // Genel akaryakıt kelimeleri
      'akaryakıt', 'akaryakit', 'petrol', 'benzin', 'mazot', 'motorin',
      'lpg', 'otogaz', 'yakıt', 'yakit',
      // Verideki spesifik istasyonlar
      'yurtpet', 'aybarlar', 'demireller', 'demirller', 'kaplan petrol',
      'mavi otogaz', 'selway', 'sarpet', 'bugra petrol', 'buğra petrol',
      'dagistan petrol', 'dağistan petrol', 'timucin petrol', 'timuçin petrol',
      'isik petrol', 'ışık petrol', 'evra akaryakit', 'birsin petrol',
      'sedef akaryakit', 'doco petrol', 'sen lpg', 'şen lpg',
      'akbay petrol', 'asude timucin', 'papel elektr/tp',
      'molu petrol', 'bepet petrol', 'hel-pet', 'bozkan akaryakit',
      'total yildiz', 'total yıldız', 'zkc petrol', 'po yurtpet',
      'erken petrol', 'bagdat petrol', 'bağdat petrol', 'aydin petrol',
      'aydın petrol', 'a.timucin akaryakit', 'hm akaryakit',
      'kendiroglu petr', 'kendiroğlu petr',
      'oztoprak akaryakit', 'öztoprak akaryakit', 'öztoprak akar',
      'rte kağan akaryakit', 'rte kagan akaryakit',
      'cam kardesler opet', 'çamkardeşler', 'camkardesler',
      'atarlar petrol', 'seydisehir petrol', 'sorkun-kemer',
      'tolu akar', 'ziya baha emre akark',
      'buyukboyacioglu petr', 'büyükboyacıoğlu petr',
      'hasan oztoprak opet', 'hasan öztoprak opet',
      'opet hasan',
      'tp istasyon', 'tp İstasyon',
      'elit tur. gida ins', 'hypco',
    ]
  },

  // ══════════════════════════════════════════════
  // 🛒 MARKET — Türkiye'deki tüm market zincirleri
  // ══════════════════════════════════════════════
  {
    category: 'Market',
    priority: 2,
    keywords: [
      // Büyük zincirler
      'a101', 'bim ', 'bim-', 'bım', 'şok', 'sok ', 'sok/', 'sok-',
      'migros', 'carrefour', 'carrefoursa', 'macro center', 'macrocenter',
      'file ', 'file-', 'hakmar', 'onur market', 'bizim toptan',
      'metro market', 'happy center', 'kipa', 'tesco', 'real market',
      // Yerel marketler (verideki)
      'gulum market', 'gülüm market', 'topaca market', 'marketzade',
      'kumsal market', 'erciyes market', 'cadde pazar manav',
      'corner market', 'sagosa market', 'hisar pal market',
      'river jet super mark', 'river jet süper mark',
      'mendırek süper', 'mendirek super',
      'talas gross', 'talasliogullari market', 'talaslıoğulları market',
      'anayurt talas',
      // ŞOK market varyasyonları
      'şok-', 'sok-manavgat',
      // Migros varyasyonları
      'migrosone', 'moneypay/migros',
      // Manavgat bölgesel (BIM, A101 vb.)
      'bim v339', 'bim o710', 'bim emek',
      '6077 antalya manavgat', 'manavgat s  antalya',
      'manavgat emek mah', 'manavgat acisu', 'manavgat ekler',
      // Genel
      'süpermarket', 'supermarket', 'market',
      // Yerel gıda/manav
      'yenidogan mh m m', 'yenidoğan mh m m',
      'defacto-manavgat', // bu bir market içi mağaza
      'getir ', 'getir', // getir yemek Yeme içme'ye düşmesi için Yeme İçme önceliği yüksek olsa iyi olur ama Market priority 2. Sorun olursa ayrıştırılır.
    ]
  },

  // ══════════════════════════════════════════════
  // 🍽️ YEME İÇME — Restoranlar, fast-food, fırınlar, kasaplar
  // ══════════════════════════════════════════════
  {
    category: 'Yeme İçme',
    priority: 3,
    keywords: [
      // Yemek sipariş platformları
      'trendyol - yemek', 'trendyol yemek', 'yemeksepeti', 'getir yemek',
      'tikla gelsin', 'tıkla gelsin', 'foodgurme',
      // Fast food zincirleri
      'mcdonalds', 'mc donalds', 'mcdonald', 'burger king', 'kfc',
      'popeyes', 'dominos', 'domino', 'little caesars', 'sbarro',
      'papa john', 'arby', 'subway', 'starbucks',
      // Verideki spesifik restoranlar
      'kasap ibo', 'kasap İbo', 'kaburgaci yasar', 'kaburgacı yaşar',
      'armin restoran', 'armİn restoran',
      'pilav', 'pilavşör', 'pilavsör',
      'mahalle burger', 'papyon burger', 'side burger',
      'endless pizza', 'endless pİzza', 'b b pizza', 'bb pizza',
      'şelale italian pizza', 'selale italian pizza',
      'kose kardesler restoran', 'köşe kardeşler restoran',
      'derya usta kasap', 'bizim mutfak',
      'ms mersin tantuni', 'mersin tantuni',
      'cedric burger', 'casuva restoran',
      'beyoglu halk doner', 'beyoğlu halk döner',
      'koftevci yusuf', 'köfteci yusuf',
      'taksim sutis', 'taksim sütis', 'sütlaç',
      'meshur sariyer borekcisi', 'meşhur sarıyer börekçisi',
      'celebcioglu odun ekmegi', 'celebcioğlu odun ekmeği',
      'umit usta', 'ümit usta',
      'iklim restaurant', 'iklim restoran',
      'orman resturant', 'orman restoran',
      'catli restorant', 'çatlı restorant',
      'gunaydin tesisleri', 'günaydın tesisleri',
      'akcakoca koftecisi', 'akçakoca köftecisi',
      'adiyaman cif kofte', 'adıyaman çiğ köfte',
      'konya mevlana sofrasi', 'konya mevlana sofrası',
      'cadde tavuk dunyasi', 'cadde tavuk dünyası',
      'kasamra gida', 'usan gida turizm',
      'okurlar dinlenme',
      'ilkem lokantacilik', 'ilkem lokantacılık',
      'vefa pide', 'taskin pide', 'taşkın pide',
      'sahin karatum', 'şahin karatum',
      'ahc restoran',
      'toee gida',
      // Genel yemek kelimeleri
      'restoran', 'restaurant', 'restorant', 'lokanta', 'lokantası',
      'kebab', 'kebap', 'döner', 'doner', 'pide', 'lahmacun',
      'tantuni', 'çiğ köfte', 'cig kofte', 'ciğ köfte',
      'köfte', 'kofte', 'burger', 'pizza',
      'tavuk', 'chicken', 'et mangal',
      'börek', 'borek', 'börekçi', 'borekci',
      'simit evi', 'simitci', 'simitçi',
      'büfe', 'bufe', 'kazim büfe', 'kazım büfe',
      'fırın', 'firin', 'ekmek',
      'kasap', 'sucuk', 'pastırma',
      'kuruyemiş', 'kuruyemis', 'ozdanaci', 'özdanacı',
      'renk kuruyemis', 'bikase kuruyemiş', 'bikase kuruyemis',
      'gida mamulleri', 'gıda mamülleri', 'tellioglu gida', 'tellioğlu gıda',
      'gozdem simit', 'gözdem simit',
      'hacer simit',
      'ramazan topaca',
      'muammer lale',
      'bekir kutlu',
      'mehmet tarakcı', 'mehmet tarakçı', 'mehmet tarakci',
      'hasan duvarci', 'hasan duvarcı',
      'sarpet gida',
      'gunes unlu mam', 'güneş unlu mam',
      'bankoğlu', 'bankoglu',
      'bulent aydin', 'bülent aydın',
      'ode al/yilmaz', 'ödeal/yılmaz',
      'mustafa sacli', 'mustafa saçlı',
      'kurttas', 'kurttaş',
      'babacan cigkofte', 'babacan çiğköfte',
      'mehmet ucar', 'mehmet uçar',
    ]
  },

  // ══════════════════════════════════════════════
  // ☕ KAFE & PASTANE
  // ══════════════════════════════════════════════
  {
    category: 'Kafe & Pastane',
    priority: 4,
    keywords: [
      // Kafe zincirleri
      'starbucks', 'gloria jeans', 'tchibo', 'caribou',
      'coffeehall', 'coffee hall', 'mackbear',
      // Verideki spesifik kafeler
      'ruzgarli cafe', 'rüzgarlı cafe',
      'camlibel aile cay', 'çamlıbel aile çay', 'camlibel aile çay',
      'deep cafe', 'simitce cafe', 'simitçe cafe',
      'nar beach cafe', 'cafegram', 'cetin cafe', 'çetin cafe',
      'coffeeum', 'universite cafe', 'üniversite cafe',
      'acacia coffee', 'katikli cafe', 'katıklı cafe',
      'afara cafe', 'star pastanesi',
      'arcof kahve', 'kahve kahve',
      'caygara', 'çaygara',
      'ehg kafe', 'motto lounge',
      'boston drink', 'boston dessert',
      'jagger tekel',
      'kaju kyemis kahve', 'kaju kuruyemiş kahve',
      // Pastane & tatlıcı
      'ekleristan', 'ekleri̇stan',
      'pralin pastacilik', 'pralin pastacılık', 'pralin pastacilik',
      'rana patisserie', 'rana pâtisserie',
      'cikolata evim', 'çikolata evim',
      '1983 beyoglu cikolata', '1983 beyoğlu çikolata',
      'berenay',
      'furkan baysak pastan',
      'yayla dondurma',
      // Genel kafe kelimeleri
      'cafe', 'kafe', 'kahve', 'coffee',
      'çay bahçe', 'cay bahce', 'çay evi',
      'pastane', 'pastanesi', 'pastacılık', 'pastacilik',
      'patisserie', 'tatlıcı', 'tatlici',
      'dondurma', 'muhallebici',
      'the beaver',
    ]
  },

  // ══════════════════════════════════════════════
  // 🛍️ ALIŞVERİŞ — Online ve mağaza
  // ══════════════════════════════════════════════
  {
    category: 'Alışveriş',
    priority: 5,
    keywords: [
      // Online platformlar
      'trendyol.com', 'trendyol com', 'trendyol milla',
      'hepsiburada', 'hepsipay', 'n11', 'param/',
      'amazon', 'temu', 'aliexpress', 'shein',
      // Giyim & Moda markaları
      'adidas', 'nike', 'puma', 'new balance', 'skechers',
      'zara', 'h&m', 'mango', 'koton', 'defacto', 'lcw', 'lc waikiki',
      'colins', 'colin', 'mavi jeans', 'us polo',
      'boyner', 'beymen', 'vakko', 'ipekyol',
      'pull&bear', 'pullandbear', 'pull and bear',
      'bershka', 'massimo dutti', 'oysho',
      'iyzico/adidas', 'iyzico/pullandbear',
      'bicen magazacilik', 'bİcen mağazacılık', 'bicen mağazacilik',
      'br magazacilik', 'br mağazacılık',
      'hypa tekstil', 'hypa tekstİl',
      'sival tekstil', 'sİval tekstİl',
      'neva outlet', 'nevada tr', 'nevada ',
      'barbaros alisveris', 'barbaros alışveriş',
      'silver sun bina',
      'nesve next',
      'konya opikal', 'konya opİkal',
      // Genel
      'online alis', 'online alış',
      'getmobil', 'param/getmobil',
    ]
  },

  // ══════════════════════════════════════════════
  // 🏥 SAĞLIK
  // ══════════════════════════════════════════════
  {
    category: 'Sağlık',
    priority: 6,
    keywords: [
      'eczane', 'eczanesi', 'hastane', 'hastanesi',
      'klinik', 'muayene', 'ilac', 'ilaç',
      'diş', 'dis ', 'ortodonti', 'göz', 'goz ',
      'erciyes sagl', 'erciyes sağl',
      'genişer eczanesi', 'geniser eczanesi',
      'uluturk eczanesi', 'ulutürk eczanesi',
      'saglik', 'sağlık', 'medikal', 'medical',
      'doktor', 'dr.', 'poliklinik',
    ]
  },

  // ══════════════════════════════════════════════
  // 🛡️ SİGORTA & BES
  // ══════════════════════════════════════════════
  {
    category: 'Sigorta & BES',
    priority: 7,
    keywords: [
      'allianz', 'bes katki', 'bes katkı',
      'sigorta', 'anadolu sigorta', 'axa', 'mapfre',
      'zurich', 'groupama', 'sompo', 'hdi',
      'bireysel emeklilik', 'bes ',
    ]
  },

  // ══════════════════════════════════════════════
  // 🎮 EĞLENCE & OYUN
  // ══════════════════════════════════════════════
  {
    category: 'Eğlence & Oyun',
    priority: 8,
    keywords: [
      'steam', 'steam purchase', 'playstation', 'xbox', 'nintendo',
      'epic games', 'riot games', 'blizzard',
      'paribucineverse', 'sinema', 'cinema',
      'wraithesports', 'esports', 'e-sports',
      'lunapark', 'luna park', 'tema park',
      'teleferik', 'teleferi̇k',
      'topkapi sarayi', 'topkapı sarayı',
      'milli saraylar', 'millİ saraylar',
      'kultur as panoroma', 'kültür aş panorama',
      'kultur as yerebatan', 'kültür aş yerebatan',
      'sarayburnu', 'sarayburnu turist',
      'nigde tema park', 'niğde tema park',
      'aktur lunapark',
      'ruya hali saha', 'rüya halı saha',
      'selcuklu kultur evi', 'selçuklu kültür evi',
      'paytr/matik',
      'muze', 'müze', 'muzekart', 'müzekart',
      'anet antalya', 'anet ',
    ]
  },

  // ══════════════════════════════════════════════
  // ✈️ SEYAHAT & ULAŞIM
  // ══════════════════════════════════════════════
  {
    category: 'Seyahat & Ulaşım',
    priority: 9,
    keywords: [
      'obilet', 'biletall', 'enuygun', 'flypgs', 'pegasus',
      'thy', 'türk hava', 'turk hava', 'anadolujet', 'sunexpress',
      'metro turizm', 'metro türizm',
      'pamukkale', 'kamil koç', 'kamil koc',
      'flixbus', 'neredennereye',
      'toplu tasima', 'toplu taşıma',
      'n kolay', 'istanbulkart',
      'is-tur turizm', 'b/is-tur',
      'lifepark turizm', 'lİfepark',
      'mng kargo',
      'yolculuk', 'sefer', 'otobus', 'otobüs',
      'ucak', 'uçak', 'havayolu',
      'unluler turizm', 'ünlüler turizm',
    ]
  },

  // ══════════════════════════════════════════════
  // 📱 FATURA & ABONELİK
  // ══════════════════════════════════════════════
  {
    category: 'Fatura & Abonelik',
    priority: 10,
    keywords: [
      'elektrik', 'ck akdeniz', 'enerjisa', 'tedas', 'tedaş',
      'su faturası', 'doğalgaz', 'dogalgaz', 'igdas', 'İgdaş',
      'turk telekom', 'türk telekom', 'tt mobil', 'vodafone', 'turkcell',
      'teknocell iletisim', 'teknocell iletişim',
      'netflix', 'spotify', 'youtube', 'apple',
      'internet faturası',
    ]
  },

  // ══════════════════════════════════════════════
  // 🏛️ VERGİ & CEZA
  // ══════════════════════════════════════════════
  {
    category: 'Vergi & Ceza',
    priority: 11,
    keywords: [
      'motorlu tasit', 'motorlu taşıt', 'mtv',
      'trafik ceza', 'trafik cezası',
      'vergi', 'tahsilat',
      'belediye', 'ilçe bel', 'ilce bel',
      'cukurova ilce', 'çukurova ilçe',
    ]
  },

  // ══════════════════════════════════════════════
  // 🚗 ARAÇ GİDERLERİ
  // ══════════════════════════════════════════════
  {
    category: 'Araç Giderleri',
    priority: 12,
    keywords: [
      'araç bakım', 'arac bakim', 'car care', 'premium car',
      'oto yıkama', 'oto yikama', 'oto kuaför',
      'otopark', 'park ', 'park 3',
      'hgs', 'otoyol', 'köprü',
      'muayene', 'lastik', 'yedek parça',
      'agl premium', 'auto prof',
      'araç muayene',
    ]
  },

  // ══════════════════════════════════════════════
  // 🐾 EVCİL HAYVAN
  // ══════════════════════════════════════════════
  {
    category: 'Evcil Hayvan',
    priority: 13,
    keywords: [
      'pet shop', 'petshop', 'alfa pet',
      'veteriner', 'mama', 'pet ',
    ]
  },

  // ══════════════════════════════════════════════
  // 🌸 KİŞİSEL
  // ══════════════════════════════════════════════
  {
    category: 'Kişisel',
    priority: 14,
    keywords: [
      'berber', 'kuaför', 'kuafor',
      'çiçekçilik', 'cicekcilik', 'defne çiçek', 'defne cicek',
      'word berber',
      'zeynep sude',
      'mehmet şahin', 'mehmet sahin',
      'şaban baş', 'saban bas',
    ]
  },

  // ══════════════════════════════════════════════
  // 💰 FİNANS (Faiz, BSMV, Döviz, ATM, Para)
  // ══════════════════════════════════════════════
  {
    category: 'Finans',
    priority: 15,
    keywords: [
      'faiz', 'bsmv', 'kambiyo',
      'doviz', 'döviz', 'usd', 'eur', 'gbp',
      'tmf yatirim', 'tmf yatırım',
      'binance', 'kripto', 'bn teknoloji',
    ]
  },

  // ══════════════════════════════════════════════
  // 💳 KREDİ KARTI ÖDEMESİ
  // ══════════════════════════════════════════════
  {
    category: 'Kredi Kartı Ödemesi',
    priority: 20,
    keywords: [
      'kredi kartı ödemesi', 'kredi karti odemesi',
      'enpara.com kredi kartı',
    ]
  },

  // ══════════════════════════════════════════════
  // ↩️ İPTAL / İADE
  // ══════════════════════════════════════════════
  {
    category: 'İptal/İade',
    priority: 21,
    keywords: [
      // Bu kategori type/direction bazlı belirlenecek, keyword fallback
      'harcama iadesi', 'harcama İadesi',
    ]
  },
];

// ──────────────────────────────────────────────
// TYPE/DIRECTION bazlı kesin kurallar
// (Keyword'den ÖNCE kontrol edilir)
// ──────────────────────────────────────────────
function getCategoryByTypeAndDirection(
  type: string,
  direction: string,
  category: string,
  title: string,
  description: string
): string | null {
  const typeLower = (type || '').toLowerCase();
  const dirLower = (direction || '').toLowerCase();
  const catLower = (category || '').toLowerCase();
  const descLower = (description || '').toLowerCase();

  // Transfer'ler — kesin
  if (typeLower.includes('giden transfer') || catLower === 'giden transfer') {
    return 'Giden Transfer';
  }
  if (typeLower.includes('gelen transfer') || catLower === 'gelen transfer') {
    return 'Gelen Transfer';
  }

  // İade/İptal — direction "gelen" + type iade/iptal
  if (
    typeLower.includes('iade') ||
    typeLower.includes('iptal') ||
    catLower.includes('iptal') ||
    catLower.includes('iade')
  ) {
    return 'İptal/İade';
  }

  // Para Yatırma/Çekme
  if (typeLower.includes('para yatırma') || typeLower.includes('para yatirma') || catLower === 'para yatırma') {
    return 'Finans';
  }
  if (typeLower.includes('para çekme') || typeLower.includes('para cekme') || catLower === 'para çekme') {
    return 'Finans';
  }
  if (catLower === 'atm') {
    return 'Finans';
  }

  // Faiz/BSMV
  if (typeLower.includes('faiz') || typeLower.includes('bsmv') || catLower.includes('faiz') || catLower.includes('bsmv')) {
    return 'Finans';
  }
  if (typeLower.includes('vergi kesintisi') || typeLower.includes('kambiyo')) {
    return 'Finans';
  }
  if (catLower.includes('döviz') || catLower.includes('doviz') || typeLower.includes('alış/satış')) {
    return 'Finans';
  }

  // Kredi kartı ödemesi
  if (typeLower.includes('ödeme') && (title.toLowerCase().includes('kredi kartı') || descLower.includes('kredi kartı ödemesi'))) {
    return 'Kredi Kartı Ödemesi';
  }

  // Fatura ödemeleri — type "Ödeme" + fatura pattern
  if (typeLower.includes('ödeme') && (descLower.includes('faturası') || descLower.includes('fatura'))) {
    return 'Fatura & Abonelik';
  }

  return null; // keyword engine'e devam et
}

// ──────────────────────────────────────────────
// Keyword Matching Engine
// ──────────────────────────────────────────────
function matchCategoryByKeywords(title: string, description: string): string {
  const searchText = `${title} ${description}`.toLowerCase();

  // Öncelik sırasına göre sıralanmış kuralları kontrol et
  const sortedRules = [...CATEGORY_V2_RULES].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return 'Diğer';
}

// ──────────────────────────────────────────────
// Ana Kategorilendirme Fonksiyonu
// ──────────────────────────────────────────────
export function categorizeTitleV2(
  title: string,
  type: string,
  direction: string,
  category: string,
  description: string
): string {
  // 1. Önce type/direction bazlı kesin kurallar
  const typeBasedCategory = getCategoryByTypeAndDirection(type, direction, category, title, description);
  if (typeBasedCategory) return typeBasedCategory;

  // 2. Keyword matching
  return matchCategoryByKeywords(title, description);
}

// ══════════════════════════════════════════════
// MIGRATION HOOK
// ══════════════════════════════════════════════
export function useCategoryV2Migration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{
    total: number;
    updated: number;
    categories: Record<string, number>;
  } | null>(null);

  const runV2Migration = async () => {
    if (!user) return;
    setIsMigrating(true);
    const loadingToast = toast.loading('Kategoriler 2.0 uygulanıyor...');

    try {
      // 1. Tüm harcamaları çek
      const expensesRef = collection(db, 'expensedata');
      const q = query(expensesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const categoryCounts: Record<string, number> = {};
      let updatedCount = 0;
      const totalCount = snapshot.docs.length;

      // Firestore batch limit: 500, güvenli taraf 450
      const batchSize = 450;
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + batchSize);

        for (const docSnap of chunk) {
          const data = docSnap.data();
          const title = data.title || '';
          const type = data.type || '';
          const direction = data.direction || '';
          const category = data.category || '';
          const description = data.description || '';

          const newCategory2 = categorizeTitleV2(title, type, direction, category, description);

          // Sadece category2 alanını yaz, mevcut category'ye DOKUNMA
          if (data.category2 !== newCategory2) {
            batch.update(docSnap.ref, { category2: newCategory2 });
            updatedCount++;
          }

          categoryCounts[newCategory2] = (categoryCounts[newCategory2] || 0) + 1;
        }

        await batch.commit();
        
        // Progress toast
        const progress = Math.min(i + batchSize, totalCount);
        toast.loading(`İlerleme: ${progress}/${totalCount}...`, { id: loadingToast });
      }

      // 2. Yeni kategorileri categories koleksiyonuna ekle (category2 prefix'i ile)
      const categoriesRef = collection(db, 'categories');
      const catQuery = query(categoriesRef, where('userId', '==', user.uid));
      const catSnapshot = await getDocs(catQuery);
      const existingCatNames = catSnapshot.docs.map(d => d.data().name);

      const v2CatBatch = writeBatch(db);
      const v2Categories = Object.keys(categoryCounts);
      
      for (const catName of v2Categories) {
        const v2CatName = `v2_${catName}`;
        if (!existingCatNames.includes(v2CatName)) {
          const newCatRef = doc(collection(db, 'categories'));
          v2CatBatch.set(newCatRef, {
            name: v2CatName,
            userId: user.uid,
            createdAt: Date.now(),
            isV2: true,
          });
        }
      }
      await v2CatBatch.commit();

      setMigrationStats({
        total: totalCount,
        updated: updatedCount,
        categories: categoryCounts,
      });

      toast.success(
        `✅ Kategoriler 2.0 tamamlandı! ${updatedCount}/${totalCount} harcama güncellendi.`,
        { id: loadingToast, duration: 5000 }
      );
    } catch (error) {
      console.error('V2 Migration error:', error);
      toast.error('Hata oluştu: ' + (error as any).message, { id: loadingToast });
    } finally {
      setIsMigrating(false);
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
    }
  };

  return { runV2Migration, isMigrating, migrationStats };
}
