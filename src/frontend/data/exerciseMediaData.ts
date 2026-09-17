// src/frontend/data/exerciseMediaData.ts
// B12 Spor Bilimi — Egzersiz Medya & Görsel Kütüphanesi
// jsDelivr CDN tabanlı animasyonlu GIF'ler, YouTube video entegrasyonu ve adım adım form rehberi

export type ExerciseCategory =
  | 'delts'
  | 'pectorals'
  | 'lats'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'traps'
  | 'forearms'
  | 'neck'
  | 'cardio';

export interface ExerciseMedia {
  id: string;
  name: string;
  englishName: string;
  category: ExerciseCategory;
  categoryLabel: string;
  gifUrl: string;
  youtubeQuery: string;
  youtubeVideoId?: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string[];
  commonMistakes: string[];
  proTip: string;
  defaultSetsReps: string;
  keywords: string[];
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';

export const EXERCISE_MEDIA_DATABASE: ExerciseMedia[] = [
  // ── OMUZ (DELTS) ──────────────────────────────────────────
  {
    id: 'cable-lateral-raise',
    name: 'Kablo Lateral Raise (Yan Omuz Açış)',
    englishName: 'Cable Lateral Raise',
    category: 'delts',
    categoryLabel: 'Omuz',
    gifUrl: `${CDN_BASE}/delts/cable-lateral-raise.gif`,
    youtubeQuery: 'cable lateral raise form',
    youtubeVideoId: 'PPrzBWZDOhA',
    targetMuscles: ['Lateral Deltoid (Yan Omuz)', 'Supraspinatus'],
    secondaryMuscles: ['Trapezius (Üst Parça)'],
    instructions: [
      'Makarayı en alt seviyeye ayarlayın ve kabloyu tutun.',
      'Gövdenizi hafifçe makaradan uzağa eğerek başlangıç noktasında gerilim oluşturun.',
      'Dirseğinizi kırmadan ve bileği bükmeden kolunuzu omuz hizasına kadar yana kaldırın.',
      'Tepe noktada yarım saniye duraklayın, ardından 2-3 saniyede kontrollü şekilde indirin.'
    ],
    commonMistakes: [
      'Gövdeyi sallayarak momentum kullanmak',
      'Ağırlığı omuz hizasından çok yukarı kaldırıp trapezi devreye sokmak',
      'Dirsekleri düşürüp bilekleri yukarı kaldırmak'
    ],
    proTip: 'Kablo lateral raise, dambıla göre hareketin en dip noktasında bile sabit gerilim sağladığı için hipertrofide %30 daha üstündür.',
    defaultSetsReps: '4 set x 12-15 tekrar',
    keywords: ['kablo lateral raise', 'cable lateral raise', 'lateral raise', 'yan omuz', 'omuz açış']
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise (Dambıl Yan Açış)',
    englishName: 'Dumbbell Lateral Raise',
    category: 'delts',
    categoryLabel: 'Omuz',
    gifUrl: `${CDN_BASE}/delts/dumbbell-lateral-raise.gif`,
    youtubeQuery: 'dumbbell lateral raise proper form',
    youtubeVideoId: '3VcKaXpzqRo',
    targetMuscles: ['Lateral Deltoid (Yan Omuz)'],
    secondaryMuscles: ['Anterior Deltoid', 'Traps'],
    instructions: [
      'Her iki elde dambıllarla dik durun, göğüs açık, kürek kemikleri geride olsun.',
      'Dambılları doğrudan yana doğru değil, hafifçe (30 derece) öne doğru ("scapular plane") kaldırın.',
      'Dirsek ve bilekler aynı hizada, serçe parmak tavanı göstermeden paralel yükselsin.',
      'Tepe noktada sıkın, yavaşça kontrollü indirin.'
    ],
    commonMistakes: [
      'Dizlerden yaylanarak ağırlığı fırlatmak',
      'Aşırı ağır dambıl seçip hareketi yarım yapmak'
    ],
    proTip: 'Ağırlığı kaldırmaktan ziyade dambılları odanın iki yan duvarına doğru uzatmaya odaklanın (reach outwards).',
    defaultSetsReps: '4 set x 12-15 tekrar',
    keywords: ['dumbbell lateral raise', 'dambıl lateral', 'dambıl yan açış', 'lateral raise']
  },
  {
    id: 'overhead-shoulder-press',
    name: 'Overhead Dumbbell / Barbell Press (Baş Üstü Pres)',
    englishName: 'Overhead Shoulder Press',
    category: 'delts',
    categoryLabel: 'Omuz',
    gifUrl: `${CDN_BASE}/delts/smith-standing-military-press.gif`,
    youtubeQuery: 'overhead press form',
    youtubeVideoId: '2yjwXTZQDDI',
    targetMuscles: ['Anterior Deltoid (Ön Omuz)', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps Brachii', 'Üst Göğüs'],
    instructions: [
      'Ağırlığı köprücük kemiği veya omuz hizasında kavrayın.',
      'Karın ve kalça kaslarınızı sıkarak omurganızı nötr ve sabit tutun.',
      'Nefes vererek ağırlığı başınızın tam üzerine dikey bir hatta itin.',
      'Tepe noktada dirsekleri kilitlemeden önce hafifçe durun, kontrollü şekilde omuza indirin.'
    ],
    commonMistakes: [
      'Beli aşırı içeri büküp geriye yatmak (lordoz)',
      'Dirsekleri aşırı geriye açıp omuz manşetini sıkıştırmak'
    ],
    proTip: 'Dambılla yaparken avuç içlerini tam karşıya değil hafif 45 derece içe bakacak şekilde tutmak omuz sağlığını korur.',
    defaultSetsReps: '3-4 set x 6-10 tekrar',
    keywords: ['overhead press', 'military press', 'omuz pres', 'baş üstü pres', 'dumbbell press']
  },
  {
    id: 'face-pull',
    name: 'Face Pull (İp ile Arka Omuz & Duruş)',
    englishName: 'Cable Face Pull',
    category: 'delts',
    categoryLabel: 'Omuz',
    gifUrl: `${CDN_BASE}/delts/band-standing-rear-delt-row.gif`,
    youtubeQuery: 'face pull proper form',
    youtubeVideoId: 'rep-qVOkqgk',
    targetMuscles: ['Posterior Deltoid (Arka Omuz)', 'Rotator Cuff'],
    secondaryMuscles: ['Rhomboids', 'Orta & Alt Trapez'],
    instructions: [
      'Çift halat aparatını kablo makarasının göz hizasına veya biraz üzerine takın.',
      'Halatı baş parmaklar arkaya bakacak şekilde alttan tutun.',
      'Dirsekleri yukarı ve dışarı açarak halatın ortasını burnunuza/alnınıza doğru çekin.',
      'Bitişte elleri arkaya doğru döndürerek omuz dış rotasyonu yapın ve 2 saniye sıkın.'
    ],
    commonMistakes: [
      'Gövdeyi geriye fırlatmak',
      'Dirsekleri gövdeye yapıştırıp sadece bicepsi çekmek'
    ],
    proTip: 'Modern oturma ve masa başı kamburluğunu düzelten, omuz sakatlıklarını sıfıra indiren en hayati egzersizdir.',
    defaultSetsReps: '4 set x 15-20 tekrar',
    keywords: ['face pull', 'kablo face pull', 'arka omuz', 'ip ile arka omuz']
  },
  {
    id: 'band-pull-aparts',
    name: 'Band Pull-Aparts (Direnç Bandı ile Açış)',
    englishName: 'Band Pull-Aparts',
    category: 'delts',
    categoryLabel: 'Omuz',
    gifUrl: `${CDN_BASE}/delts/band-front-lateral-raise.gif`,
    youtubeQuery: 'band pull aparts form',
    youtubeVideoId: 'fo3xR0c3hX0',
    targetMuscles: ['Posterior Deltoid', 'Rhomboids'],
    secondaryMuscles: ['Trapezius', 'Rotator Cuff'],
    instructions: [
      'Direnç bandını omuz genişliğinde kollar önde düz olarak tutun.',
      'Kolları kırmadan bandı göğsünüze değecek kadar iki yana açın.',
      'Kürek kemiklerinizi arkada birbirine bastırarak 1 saniye sıkın.'
    ],
    commonMistakes: ['Omuzları yukarı kulaklara doğru çekmek', 'Bandı savurarak geri bırakmak'],
    proTip: 'Omuz başlarını dikleştirir ve göğsün öne fırlamasını sağlayarak V-Taper görünümünü pekiştirir.',
    defaultSetsReps: '3 set x 20-25 tekrar',
    keywords: ['band pull-aparts', 'bant açış', 'omuz toparlama']
  },

  // ── GÖĞÜS (PECTORALS) ─────────────────────────────────────
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press (30° Eğimli Göğüs Pres)',
    englishName: 'Incline Dumbbell Bench Press',
    category: 'pectorals',
    categoryLabel: 'Göğüs',
    gifUrl: `${CDN_BASE}/pectorals/barbell-incline-bench-press.gif`,
    youtubeQuery: 'incline dumbbell press form',
    youtubeVideoId: '8iPEnn-ltC8',
    targetMuscles: ['Pectoralis Major (Üst Klavikular Baş)'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps Brachii'],
    instructions: [
      'Sehpayı 30 derece açıya ayarlayın (daha dik açı yükü ön omuza kaydırır).',
      'Kürek kemiklerinizi arkada birleştirin ve göğsünüzü dışarı çıkarın.',
      'Dambılları kontrollü şekilde göğsün üst hizasına kadar indirin (derin esneme).',
      'Nefes vererek tepeye doğru basın, ancak tepe noktada dambılları birbirine çarpmayın.'
    ],
    commonMistakes: [
      'Sehpayı 45-60 derece gibi çok dik yapmak',
      'Dirsekleri 90 derece açarak omuz eklemine yük bindirmek (45-60 derece açı idealdir)'
    ],
    proTip: 'Göğsün sarkık görünmesini önleyen, boyundan aşağıya doğru zırh gibi dolgunluk katan 1 numaralı harekettir.',
    defaultSetsReps: '4 set x 8-12 tekrar',
    keywords: ['incline dumbbell press', 'incline press', 'üst göğüs pres', 'eğimli pres']
  },
  {
    id: 'flat-barbell-bench-press',
    name: 'Flat Barbell Bench Press (Düz Sehpa Göğüs Pres)',
    englishName: 'Barbell Bench Press',
    category: 'pectorals',
    categoryLabel: 'Göğüs',
    gifUrl: `${CDN_BASE}/pectorals/barbell-bench-press.gif`,
    youtubeQuery: 'barbell bench press form',
    youtubeVideoId: 'rT7DgCr-3pg',
    targetMuscles: ['Pectoralis Major (Orta & Genel Göğüs)'],
    secondaryMuscles: ['Triceps', 'Ön Omuz'],
    instructions: [
      'Sehpaya sırt üstü yatın, ayaklar yere tam bassın.',
      'Barı omuz genişliğinden biraz daha geniş tutuşla kavrayın.',
      'Barı göğüs kemiğinin alt ucuna doğru 2-3 saniyede kontrollü indirin.',
      'Topuklardan güç alarak patlayıcı şekilde yukarı itin.'
    ],
    commonMistakes: [
      'Barı göğse çarptırıp zıplatmak',
      'Ayakları yerden kesip sehpaya koymak (denge ve güç kaybı)'
    ],
    proTip: 'Eksantrik (indirme) süresini 3 saniyeye uzatmak lif hasarını ve büyümeyi maksimuma çıkarır.',
    defaultSetsReps: '3-4 set x 6-8 tekrar',
    keywords: ['bench press', 'barbell bench press', 'göğüs pres', 'düz sehpa']
  },
  {
    id: 'chest-dips',
    name: 'Chest Dips (Geniş & Öne Eğimli Dips)',
    englishName: 'Chest Dips',
    category: 'pectorals',
    categoryLabel: 'Göğüs',
    gifUrl: `${CDN_BASE}/pectorals/korean-dips.gif`,
    youtubeQuery: 'chest dips form',
    youtubeVideoId: '2z8JmcrW-As',
    targetMuscles: ['Alt & Dış Göğüs', 'Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Ön Omuz'],
    instructions: [
      'Paralel barlara çıkın ve gövdenizi 30 derece öne eğin.',
      'Çenenizi göğse doğru yaklaştırın, bacakları hafifçe geride tutun.',
      'Dirsekler 90 derece bükülene ve göğüste derin esneme olana kadar inin.',
      'Göğüs kaslarını sıkarak başlangıç noktasına yükselin.'
    ],
    commonMistakes: [
      'Dik durup hareketi tamamen tricepse yıkmak',
      'Omuzları içe doğru yuvarlayarak aşırı derine inmek'
    ],
    proTip: 'Üst vücudun squatı olarak bilinir; göğsün alt sınır çizgisini bıçak gibi keskinleştirir.',
    defaultSetsReps: '3 set x 10-15 tekrar',
    keywords: ['chest dips', 'dips', 'alt göğüs dips', 'paralel bar dips']
  },

  // ── SIRT & KANAT (LATS / BACK) ────────────────────────────
  {
    id: 'wide-grip-lat-pulldown',
    name: 'Geniş Tutuş Lat Pulldown (Kanat Çekiş)',
    englishName: 'Wide-Grip Lat Pulldown',
    category: 'lats',
    categoryLabel: 'Sırt & Kanat',
    gifUrl: `${CDN_BASE}/lats/cable-bar-lateral-pulldown.gif`,
    youtubeQuery: 'lat pulldown form',
    youtubeVideoId: 'CAwf7n6Luuc',
    targetMuscles: ['Latissimus Dorsi (Kanat Kası)'],
    secondaryMuscles: ['Biceps Brachii', 'Rhomboids', 'Arka Omuz'],
    instructions: [
      'Bacak desteğini uyluklarınızı sıkıca tutacak şekilde ayarlayın.',
      'Barı omuz genişliğinden açık bir açıyla kavrayın.',
      'Gövdenizi 10-15 derece geriye yaslayıp göğsünüzü yukarı kaldırın.',
      'Dirseklerinizi doğrudan kalçalarınıza doğru çekerek barı üst göğüs hizasına indirin.',
      'Tepe noktada kanat kaslarınızı gererek yavaşça yukarı bırakın.'
    ],
    commonMistakes: [
      'Barı boyun arkasına çekmek (omuz ve boyun omurlarına zararlıdır)',
      'Gövdeyi 45 derece geriye savurarak beli kullanmak'
    ],
    proTip: 'Barı ellerinizle çekmeyi değil, dirseklerinizi ceplerinize doğru bastırmayı hayal edin (mind-muscle connection). V-Taper için en kritik sırt hareketidir.',
    defaultSetsReps: '4 set x 10-12 tekrar',
    keywords: ['lat pulldown', 'geniş tutuş lat pulldown', 'kanat çekiş', 'sırt çekiş', 'pulldown']
  },
  {
    id: 'pull-ups',
    name: 'Barfiks (Geniş Tutuş Pull-Up)',
    englishName: 'Pull-Up',
    category: 'lats',
    categoryLabel: 'Sırt & Kanat',
    gifUrl: `${CDN_BASE}/lats/alternate-lateral-pulldown.gif`,
    youtubeQuery: 'pull ups form',
    youtubeVideoId: 'eGo4IYlbE5g',
    targetMuscles: ['Latissimus Dorsi', 'Teres Major'],
    secondaryMuscles: ['Biceps', 'Core', 'Ön Kol'],
    instructions: [
      'Barı eller omuzdan açık şekilde kavrayın ve tam asılın.',
      'Kürek kemiklerini aşağıya bastırarak hareketi başlatın.',
      'Çene barın hizasına gelene kadar göğsü bara yaklaştırın.',
      'Aşağıya inerken kontrollü 3 saniyede tam esnemeye ulaşın.'
    ],
    commonMistakes: ['Bacakları savurarak kipping yapmak', 'Yarım inip tam esnemeyi kaçırmak'],
    proTip: 'Kendi vücut ağırlığınızla yapabildiğiniz 10 temiz barfiks, V-Taper sırt genişliğini garantiler.',
    defaultSetsReps: '3-4 set x 6-10 tekrar',
    keywords: ['barfiks', 'pull up', 'pull-up', 'sırt barfiks']
  },

  // ── PAZU & BICEPS (ARMS) ──────────────────────────────────
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl (Eğimli Sehpa Biceps Esneme)',
    englishName: 'Incline Dumbbell Curl',
    category: 'biceps',
    categoryLabel: 'Pazu & Ön Kol',
    gifUrl: `${CDN_BASE}/biceps/band-alternating-biceps-curl.gif`,
    youtubeQuery: 'incline dumbbell curl form',
    youtubeVideoId: 'soxrZlIl35U',
    targetMuscles: ['Biceps Brachii (Uzun Baş - Long Head)'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    instructions: [
      'Sehpayı 45-60 derece eğime ayarlayın ve sırt üstü yaslanın.',
      'Kollarınızı tamamen aşağı sarkıtarak bicepsin uzun başında maksimum esnemeyi hissedin.',
      'Dirseklerinizi geride ve sabit tutarak dambılları yukarı doğru bükün.',
      'Yukarı çıkarken avuç içlerinizi dışa doğru döndürün (supinasyon) ve tepe noktada 1 saniye sıkın.'
    ],
    commonMistakes: [
      'Dirsekleri öne fırlatarak yükü ön omuza aktarmak',
      'Hızlıca bırakıp esneme fazındaki kas gerilimini kaçırmak'
    ],
    proTip: 'Bicepsin tepe noktasını (peak) oluşturan uzun başı gerilim altında esneterek kalınlaştıran en etkili bilimsel harekettir.',
    defaultSetsReps: '3 set x 8-12 tekrar',
    keywords: ['incline dumbbell curl', 'incline curl', 'biceps curl', 'eğimli biceps curl', 'pazu curl']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl (Çekiç Büküş - Kol Kalınlığı)',
    englishName: 'Dumbbell Hammer Curl',
    category: 'biceps',
    categoryLabel: 'Pazu & Ön Kol',
    gifUrl: `${CDN_BASE}/biceps/cable-hammer-curl-with-rope.gif`,
    youtubeQuery: 'hammer curl form',
    youtubeVideoId: 'zC3nLlEvin4',
    targetMuscles: ['Brachialis', 'Brachioradialis (Ön Kol)'],
    secondaryMuscles: ['Biceps Brachii'],
    instructions: [
      'Dambılları avuç içleri birbirine bakacak şekilde (nötr tutuş) tutun.',
      'Gövdenizi sallamadan ağırlığı omuz hizasına doğru kaldırın.',
      'Tepe noktada brachialis kasınızı sıkarak 1 saniye bekleyin ve yavaşça indirin.'
    ],
    commonMistakes: ['Beli sallayarak ivme kazanmak', 'Bilekleri bükmek'],
    proTip: 'Brachialis kası biceps ile triceps arasını doldurarak pazuyu dışarı fırlatır; kolun tişört içindeki yan genişliğini sağlar.',
    defaultSetsReps: '3 set x 10-12 tekrar',
    keywords: ['hammer curl', 'çekiç büküş', 'brachialis', 'cable hammer curl']
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl (Sehpada İzole Biceps Curl)',
    englishName: 'Preacher Curl',
    category: 'biceps',
    categoryLabel: 'Pazu & Ön Kol',
    gifUrl: `${CDN_BASE}/biceps/barbell-preacher-curl.gif`,
    youtubeQuery: 'preacher curl form',
    youtubeVideoId: 'fIWP-FRFNU0',
    targetMuscles: ['Biceps Brachii (Kısa Baş & Alt Bağlantı)'],
    secondaryMuscles: ['Brachialis'],
    instructions: [
      'Kollarınızı preacher sehpasına yerleştirin, koltuk altları tam mindere otursun.',
      'Barı omuz genişliğinde alttan kavrayın.',
      'Sadece dirsek ekleminden bükerek ağırlığı çene hizasına doğru çekin.',
      'Aşağıya inerken kontrollü inin, dirsekleri aşırı geriye kitlemeyin.'
    ],
    commonMistakes: ['Aşırı ağır takıp altta dirsek tendonunu zorlamak', 'Gövdeyi mindereden kaldırmak'],
    proTip: 'Hileyi sıfırlar, iki kol arasındaki kuvvet asimetrisini kapatmak için tek dambılla da uygulanabilir.',
    defaultSetsReps: '3 set x 10-12 tekrar',
    keywords: ['preacher curl', 'dumbbell preacher curl', 'izole biceps', 'sehpa curl']
  },

  // ── ARKA KOL & TRICEPS (ARMS) ─────────────────────────────
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension (Baş Üstü Triceps)',
    englishName: 'Cable Overhead Triceps Extension',
    category: 'triceps',
    categoryLabel: 'Arka Kol',
    gifUrl: `${CDN_BASE}/triceps/cable-overhead-triceps-extension-rope-attachment.gif`,
    youtubeQuery: 'overhead cable triceps extension form',
    youtubeVideoId: 'ns-rgS_n6Zg',
    targetMuscles: ['Triceps Brachii (Uzun Baş - Long Head)'],
    secondaryMuscles: ['Triceps Lateral/Medial Baş'],
    instructions: [
      'Kablo makarasına çift halat takın, makarayı sırt hizasına getirin.',
      'Makaradan bir adım öne çıkıp hafifçe öne doğru eğilin (lunge duruşu).',
      'Dirseklerinizi başınızın yanında sabitleyin.',
      'Kolları öne doğru tam açarak tricepsin uzun başını sıkın, ipin uçlarını dışa yayın.',
      'Geri dönerken başınızın arkasına doğru derin esneme yakalayın.'
    ],
    commonMistakes: ['Dirsekleri iki yana kanat gibi açmak', 'Gövdeyi sallayarak itmek'],
    proTip: 'Triceps uzun başı sadece kol baş üzerindeyken tam gerilim altına girer. Kolun toplam hacminin %60ı tricepstir.',
    defaultSetsReps: '4 set x 10-15 tekrar',
    keywords: ['overhead triceps extension', 'overhead cable triceps', 'baş üstü triceps', 'triceps rope']
  },
  {
    id: 'triceps-rope-pushdown',
    name: 'Cable Triceps Rope Pushdown (İp ile İtiş)',
    englishName: 'Cable Triceps Pushdown',
    category: 'triceps',
    categoryLabel: 'Arka Kol',
    gifUrl: `${CDN_BASE}/triceps/cable-pushdown.gif`,
    youtubeQuery: 'triceps pushdown form',
    youtubeVideoId: '2-LAMcpzODU',
    targetMuscles: ['Triceps Lateral & Medial Baş (At Nalı Görünümü)'],
    secondaryMuscles: ['Triceps Uzun Baş'],
    instructions: [
      'Makarayı en üste ayarlayın, halatı kavrayın.',
      'Dirseklerinizi gövdenizin yanlarına kilitleyin ve hareket boyunca oynatmayın.',
      'Nefes vererek kolları aşağıya doğru tam kilitleyin ve halatın uçlarını dışa doğru ayırın.',
      'En altta 1 saniye tricepsi taş gibi sıkın, yavaşça 90 dereceye kadar yükselin.'
    ],
    commonMistakes: ['Dirsekleri öne ve arkaya sallamak', 'Ağırlığın üzerine abanarak göğüsle basmak'],
    proTip: 'Kol arkasındaki sallantıyı ve sarkmayı yok eden, at nalı gibi keskin hatlar kazandıran temel harekettir.',
    defaultSetsReps: '4 set x 12-15 tekrar',
    keywords: ['triceps pushdown', 'cable pushdown', 'ip ile arka kol', 'triceps rope pushdown']
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press (Dar Tutuş Göğüs/Triceps)',
    englishName: 'Close-Grip Bench Press',
    category: 'triceps',
    categoryLabel: 'Arka Kol',
    gifUrl: `${CDN_BASE}/triceps/elbow-dips.gif`,
    youtubeQuery: 'close grip bench press form',
    youtubeVideoId: 'nEF0bv2FW94',
    targetMuscles: ['Triceps Brachii (Tüm Başlar)'],
    secondaryMuscles: ['Ön Omuz', 'İç Göğüs'],
    instructions: [
      'Düz sehpaya yatın, barı omuz genişliğinde (eller arası ~30 cm) tutun.',
      'Barı indirirken dirsekleri gövdeye yakın tutun.',
      'Alt göğüs hizasından patlayıcı şekilde tricepsleri sıkarak yukarı itin.'
    ],
    commonMistakes: ['Elleri 10 cm gibi aşırı dar tutup bilekleri sakatlamak'],
    proTip: 'Tricepse en yüksek mekanik aşırı yükü bindiren bileşik kitle hareketidir.',
    defaultSetsReps: '3 set x 6-8 tekrar',
    keywords: ['close-grip bench press', 'dar tutuş bench', 'dar tutuş pres']
  },

  // ── ÖN KOL (FOREARMS) ─────────────────────────────────────
  {
    id: 'farmers-walk',
    name: 'Farmer’s Walk (Ağır Dambıl Taşıma)',
    englishName: 'Farmer’s Walk',
    category: 'forearms',
    categoryLabel: 'Ön Kol & Kavrama',
    gifUrl: `${CDN_BASE}/quads/farmers-walk.gif`,
    youtubeQuery: 'farmers walk proper form',
    youtubeVideoId: 'Fkzk_RqlYig',
    targetMuscles: ['Brachioradialis', 'Ön Kol Fleksörleri', 'Kavrama Gücü'],
    secondaryMuscles: ['Trapezius', 'Core', 'Bacaklar'],
    instructions: [
      'Her iki elinize ağır dambıl veya kettlebell alın.',
      'Göğsünüzü dik tutun, omuzları geriye alın, karnınızı sıkın.',
      'Küçük ve kontrollü adımlarla dik duruşunuzu hiç bozmadan yürüyün.'
    ],
    commonMistakes: ['Omuzları öne düşürüp kamburlaşmak', 'Adımları savurarak atmak'],
    proTip: 'Tişörtten taşan damarlı ve kalın ön kollar ile demir gibi kavrama gücünün en sağlam sırrıdır.',
    defaultSetsReps: '3-4 set x 40-50 metre',
    keywords: ['farmers walk', 'farmer’s walk', 'ağır dambıl taşıma', 'kavrama gücü']
  },
  {
    id: 'wrist-curls',
    name: 'Wrist Curl & Behind Back Curl (Bilek Bükme)',
    englishName: 'Barbell Wrist Curl',
    category: 'forearms',
    categoryLabel: 'Ön Kol & Kavrama',
    gifUrl: `${CDN_BASE}/forearms/modified-push-up-to-lower-arms.gif`,
    youtubeQuery: 'wrist curls form',
    youtubeVideoId: 'FWnP3j2q3oA',
    targetMuscles: ['Ön Kol Fleksör ve Ekstansör Kasları'],
    instructions: [
      'Ön kollarınızı sehpaya veya uyluklarınıza sabitleyin, bilekler boşlukta kalsın.',
      'Dambıl veya barı parmak uçlarına kadar salıp derin esneme yakalayın.',
      'Sadece bileğinizi yukarı bükerek ön kollarınızı taş gibi sıkın.'
    ],
    commonMistakes: ['Aşırı ağır girip karpal tüneli zorlamak'],
    proTip: 'Hafif ağırlık ve yüksek tekrar (15-20) ile inanılmaz bir kan pompalanması (pump) sağlar.',
    defaultSetsReps: '3 set x 15-20 tekrar',
    keywords: ['wrist curl', 'bilek bükme', 'ön kol curl', 'behind the back wrist curl']
  },

  // ── KARIN & BEL (ABS / CORE) ──────────────────────────────
  {
    id: 'stomach-vacuum',
    name: 'Stomach Vacuum (Mide Vakumu - Doğal Bel Korsesi)',
    englishName: 'Stomach Vacuum',
    category: 'abs',
    categoryLabel: 'Karın & Bel',
    gifUrl: `${CDN_BASE}/abs/bodyweight-incline-side-plank.gif`,
    youtubeQuery: 'stomach vacuum proper form Arnold',
    youtubeVideoId: 'gDbjP_3V7j4',
    targetMuscles: ['Transversus Abdominis (En Derin Karın Duvarı)'],
    secondaryMuscles: ['İç ve Dış Oblikler'],
    instructions: [
      'Sabah aç karnına ayakta veya eller dizde hafif öne eğilerek durun.',
      'Ciğerlerinizdeki tüm havayı son damlasına kadar ağzınızdan dışarı üfleyin.',
      'Nefes almadan göbek deliğinizi omurganıza ve yukarı kaburgaların altına doğru vakumlayarak çekin.',
      'Bu gergin pozisyonda nefes tutarak 15-25 saniye sabit kalın.',
      'Yavaşça nefes alarak serbest bırakın ve 3-5 tekrar uygulayın.'
    ],
    commonMistakes: ['İçeride hava bırakmak', 'Göğsü şişirip karın yerine akciğeri kullanmak'],
    proTip: 'Transversus kası doğal bir korse gibi iç organları içeri çeker. Düzenli yapıldığında bel çevresini doğrudan 3-6 cm daraltır.',
    defaultSetsReps: '3-4 set x 20 saniye tutuş',
    keywords: ['mide vakumu', 'stomach vacuum', 'vakum egzersizi', 'bel inceltme', 'transversus abdominis']
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg / Knee Raise with Pelvic Tilt (Asılarak Bacak Kaldırma)',
    englishName: 'Hanging Leg Raise',
    category: 'abs',
    categoryLabel: 'Karın & Bel',
    gifUrl: `${CDN_BASE}/abs/hanging-leg-hip-raise.gif`,
    youtubeQuery: 'hanging leg raise form',
    youtubeVideoId: 'Pr1ieGZ5atk',
    targetMuscles: ['Alt Karın (Rectus Abdominis Alt Bölüm)'],
    secondaryMuscles: ['İliopsoas', 'Ön Kol'],
    instructions: [
      'Barfiks barına asılın veya dip barlarında dirseklerinizi sabitleyin.',
      'Sadece bacakları kaldırmayın; leğen kemiğinizi (pelvis) göğsünüze doğru yukarı kıvırın.',
      'Tepe noktada alt karın kaslarınızı 1 saniye sıkın.',
      'Bacakları geriye savurmadan, sallanmayı önleyerek kontrollü indirin.'
    ],
    commonMistakes: [
      'Pelvisi kıvırmadan sadece kalça bükücüleri (bacakları) oynatmak',
      'Vücudu sarkaç gibi sallayarak ivmeyle yapmak'
    ],
    proTip: 'Alt karındaki inatçı göbeği toparlayan ve V-Cut adonis çizgisini çıkaran en etkili harekettir.',
    defaultSetsReps: '3 set x 10-15 tekrar',
    keywords: ['hanging leg raise', 'bacak kaldırma', 'alt karın', 'hanging leg / knee raise', 'pelvic curl']
  },
  {
    id: 'cable-kneeling-crunch',
    name: 'Cable Kneeling Crunch (Kablo Mekik)',
    englishName: 'Cable Kneeling Crunch',
    category: 'abs',
    categoryLabel: 'Karın & Bel',
    gifUrl: `${CDN_BASE}/abs/curl-up.gif`,
    youtubeQuery: 'cable kneeling crunch form',
    youtubeVideoId: '2fOROhyOzJ8',
    targetMuscles: ['Rectus Abdominis (Üst & Orta Karın - Baklavalar)'],
    secondaryMuscles: ['Oblikler'],
    instructions: [
      'Kablo makarasına halat takın ve makaranın önüne diz çökün.',
      'Halatı başınızın iki yanına sabitleyin (eller hareket boyunca oynamasın).',
      'Kalçanızı sabit tutarak omurganızı öne doğru yuvarlayın ve göğsünüzü leğen kemiğinize yaklaştırın.',
      'Tepe noktada karnınızı taş gibi sıkın, yavaşça geriye açılarak esneyin.'
    ],
    commonMistakes: [
      'Kollardan çekerek kolla mekik çekmek',
      'Kalçayı geriye oturtarak kalça bükücüleri çalıştırmak'
    ],
    proTip: 'Karın kaslarını derinleştiren ve baklavaların dışarı fırlamasını sağlayan en iyi ağırlıklı aşırı yükleme hareketidir.',
    defaultSetsReps: '3-4 set x 12-15 tekrar',
    keywords: ['cable kneeling crunch', 'kablo mekik', 'cable crunch', 'karın mekik', 'baklava']
  },
  {
    id: 'dead-bug',
    name: 'Deadbug (Ölü Böcek Egzersizi - Çekirdek Stabilitesi)',
    englishName: 'Dead Bug',
    category: 'abs',
    categoryLabel: 'Karın & Bel',
    gifUrl: `${CDN_BASE}/abs/dead-bug.gif`,
    youtubeQuery: 'dead bug exercise form',
    youtubeVideoId: 'g_BYB0R-4Ws',
    targetMuscles: ['Derin Karın Duvarı', 'Pelvik Taban'],
    secondaryMuscles: ['Kalça Bükücüler'],
    instructions: [
      'Sırt üstü yatın, kollar tavana dik, dizler 90 derece bükülü olsun.',
      'Bel çukurunu yere tamamen yapıştırın (aradan el geçmemeli).',
      'Sağ kolunuzu geriye uzatırken sol bacağınızı öne doğru düzleştirin.',
      'Belin yerden kalkmasına asla izin vermeden başlangıç pozisyonuna dönün ve diğer tarafı yapın.'
    ],
    commonMistakes: ['Beli yerden kaldırıp yükü bele bindirmek'],
    proTip: 'Anterior Pelvic Tilt (öne eğik leğen kemiği) nedeniyle fırlayan göbek görüntüsünü düzeltir.',
    defaultSetsReps: '3 set x 12 tekrar (her iki taraf)',
    keywords: ['deadbug', 'dead bug', 'ölü böcek egzersizi', 'alt karın stabilite']
  },
  {
    id: 'plank',
    name: 'Plank (Dirsek Üstü Duruş)',
    englishName: 'Plank',
    category: 'abs',
    categoryLabel: 'Karın & Bel',
    gifUrl: `${CDN_BASE}/abs/front-plank-with-twist.gif`,
    youtubeQuery: 'proper plank form',
    youtubeVideoId: 'ASdvN_XEl_c',
    targetMuscles: ['Transversus Abdominis', 'Tüm Çekirdek Duvarı'],
    secondaryMuscles: ['Omuzlar', 'Glutes'],
    instructions: [
      'Dirsekler omuzların tam altında olacak şekilde yüzüstü pozisyon alın.',
      'Vücudunuz baştan topuğa kadar dümdüz bir tahta gibi olsun.',
      'Karın ve kalça kaslarınızı aynı anda maksimum kuvvetle sıkın.'
    ],
    commonMistakes: ['Kalçayı havaya dikmek veya beli aşağı sarkıtmak'],
    proTip: 'Süre tutmaktan ziyade her saniyeyi maksimum kasılma ile geçirin (RKC Plank).',
    defaultSetsReps: '3 set x 45-60 saniye',
    keywords: ['plank', 'dirsek üstü duruş', 'karın plank']
  },

  // ── BACAK & UYLUK (QUADS / HAMSTRINGS) ────────────────────
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat (Tam Derinlik Çöküş)',
    englishName: 'Barbell Back Squat',
    category: 'quads',
    categoryLabel: 'Bacak & Uyluk',
    gifUrl: `${CDN_BASE}/glutes/barbell-full-squat-side-pov.gif`,
    youtubeQuery: 'barbell squat proper form',
    youtubeVideoId: 'bEv6CCg2BC8',
    targetMuscles: ['Quadriceps (Ön Bacak)', 'Gluteus Maximus (Kalça)'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Erector Spinae'],
    instructions: [
      'Barı trapez kaslarınızın üzerine sağlamca oturtun.',
      'Ayakları omuz genişliğinde açın, ayak uçları hafif dışa baksın.',
      'Derin nefes alıp karın içi basıncı (valsalva) kilitleyin.',
      'Kalçayı geriye iterek dizleri parmak ucu yönünde açarak paralel altına kadar çökün.',
      'Topuklardan yeri iterek dik pozisyona dönün.'
    ],
    commonMistakes: [
      'Dizlerin içeri çökmesi (knee valgus)',
      'Yarım çökmek (diz sağlığına zararlıdır ve hipertrofiyi %40 düşürür)'
    ],
    proTip: 'Paralel altına inen tam derinlikteki squat, testosteron salınımını ve bacak kas kütlesini maksimize eder.',
    defaultSetsReps: '4 set x 6-10 tekrar',
    keywords: ['squat', 'barbell squat', 'back squat', 'barbell back squat', 'çöküş']
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat (Tek Bacak Ayrık Squat)',
    englishName: 'Bulgarian Split Squat',
    category: 'quads',
    categoryLabel: 'Bacak & Uyluk',
    gifUrl: `${CDN_BASE}/quads/barbell-single-leg-split-squat.gif`,
    youtubeQuery: 'bulgarian split squat form',
    youtubeVideoId: '2C-uNgKwPLE',
    targetMuscles: ['Quadriceps', 'Gluteus Medius / Maximus'],
    secondaryMuscles: ['Hamstrings', 'Denge Kasları'],
    instructions: [
      'Bir ayağınızı arkanızdaki sehpaya yerleştirin.',
      'Öndeki ayağınızla dengeli bir mesafe belirleyin.',
      'Öndeki bacağınız 90 derece bükülene kadar kalçayı aşağıya indirin.',
      'Ön topuktan güç alarak yukarı yükselin.'
    ],
    commonMistakes: ['Ön ayağı çok yakına koyup topuğu yerden kaldırmak'],
    proTip: 'İki bacak arasındaki güç ve santimetre farkını sıfırlayan, bacağı bıçak gibi şekillendiren egzersizdir.',
    defaultSetsReps: '3 set x 10-12 tekrar (her bacak)',
    keywords: ['bulgarian split squat', 'split squat', 'tek bacak squat', 'bulgar squat']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL - Arka Bacak & Kalça)',
    englishName: 'Romanian Deadlift',
    category: 'hamstrings',
    categoryLabel: 'Arka Bacak & Kalça',
    gifUrl: `${CDN_BASE}/glutes/barbell-romanian-deadlift.gif`,
    youtubeQuery: 'romanian deadlift proper form',
    youtubeVideoId: 'JCXUYuzwNrM',
    targetMuscles: ['Hamstrings (Arka Bacak)', 'Gluteus Maximus'],
    secondaryMuscles: ['Erector Spinae (Bel)', 'Ön Kol'],
    instructions: [
      'Barı omuz genişliğinde tutun, dizleri çok hafif kırın ve bu açıyı dondurun.',
      'Beli bükmeden kalçanızı odanın arkasına doğru itin (hip hinge).',
      'Bar bacaklarınıza yakın kalarak kaval kemiğinin ortasına kadar insin (derin arka bacak esnemesi).',
      'Kalçanızı öne doğru kilitleyerek başlangıç pozisyonuna dönün.'
    ],
    commonMistakes: ['Omurgayı kamburlaştırıp beli bükmek', 'Squat gibi dizleri aşırı bükmek'],
    proTip: 'Arka bacak ile kalça bağlantısını keskinleştiren ve bacak selülit görünümünü yok eden egzersizdir.',
    defaultSetsReps: '3-4 set x 8-12 tekrar',
    keywords: ['romanian deadlift', 'rdl', 'arka bacak', 'deadlift', 'barbell romanian deadlift']
  },
  {
    id: 'leg-press',
    name: 'Leg Press (Ayaklar Tabanda Ağır Yükleme)',
    englishName: 'Leg Press',
    category: 'quads',
    categoryLabel: 'Bacak & Uyluk',
    gifUrl: `${CDN_BASE}/glutes/barbell-clean-grip-front-squat.gif`,
    youtubeQuery: 'leg press form',
    youtubeVideoId: 'IZxyjW7MPJQ',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    instructions: [
      'Sırtınızı ve başınızı mindere tam yaslayın.',
      'Ayakları omuz genişliğinde platformun ortasına yerleştirin.',
      'Ağırlığı kontrollü indirip dizler 90 dereceye geldiğinde topuklardan itin.',
      'Tepe noktada dizleri asla kitlemeyin.'
    ],
    commonMistakes: ['Dizleri yukarıda kitlemek', 'Beli mindereden kaldırmak'],
    proTip: 'Omurgaya sıfır dikey baskı uygulayarak bacak liflerine ağır yük bindirmenin en güvenli yoludur.',
    defaultSetsReps: '4 set x 10-15 tekrar',
    keywords: ['leg press', 'bacak pres', 'makine bacak']
  },

  // ── BALDIR & KALF (CALVES) ────────────────────────────────
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise (Ayakta Kalf Kaldırma)',
    englishName: 'Standing Calf Raise',
    category: 'calves',
    categoryLabel: 'Baldır & Kalf',
    gifUrl: `${CDN_BASE}/calves/barbell-standing-calf-raise.gif`,
    youtubeQuery: 'standing calf raise form',
    youtubeVideoId: 'gwLzBJYoWlI',
    targetMuscles: ['Gastrocnemius (Ayakta çalışan dış kalp kalfı)'],
    secondaryMuscles: ['Soleus', 'Aşil Tendonu'],
    instructions: [
      'Ayak parmak uçlarınızı platformun kenarına koyun, topuklar serbest kalsın.',
      'En alt noktaya inin ve Aşil tendonunun yaylanma etkisini öldürmek için 2-3 saniye TAM DURAKLAYIN.',
      'Patlayıcı şekilde parmak ucunda maksimum yüksekliğe çıkın ve tepe noktada 2 saniye sıkın.',
      '3 saniyede yavaşça en alt esneme noktasına inin.'
    ],
    commonMistakes: [
      'Aşağıda yaylanarak zıplamak (kası değil sadece aşil tendonunu çalıştırır)',
      'Hareketi 2 cm aralıkla yarım yapmak'
    ],
    proTip: 'Kalf kasları günlük yürüyüşte binlerce tekrar gördüğü için sadece dipte 2-3 saniye duraklama ile büyür.',
    defaultSetsReps: '4 set x 10-12 tekrar (2 sn duraklamalı)',
    keywords: ['standing calf raise', 'ayakta kalf', 'kalf kaldırma', 'baldır', 'gastrocnemius']
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise (Oturarak Kalf Kaldırma)',
    englishName: 'Seated Calf Raise',
    category: 'calves',
    categoryLabel: 'Baldır & Kalf',
    gifUrl: `${CDN_BASE}/calves/dumbbell-seated-calf-raise.gif`,
    youtubeQuery: 'seated calf raise form',
    youtubeVideoId: 'JbyjNymZOt0',
    targetMuscles: ['Soleus (Derin düz kalf kası)'],
    secondaryMuscles: ['Aşil Tendonu'],
    instructions: [
      'Dizler 90 derece bükülü halde oturma pozisyonu alın, pedler uyluklara otursun.',
      'Topukları serbest bırakıp en dipte 2 saniye esnetin.',
      'Parmak ucunda yukarı kaldırıp tepe noktada sıkın.'
    ],
    commonMistakes: ['Hızlı hızlı yaylanmak'],
    proTip: 'Dizler bükülüyken gastrocnemius devreden çıkar, tüm yük Soleus kasına biner ve baldırı kalınlaştırır.',
    defaultSetsReps: '4 set x 15-20 tekrar',
    keywords: ['seated calf raise', 'oturarak kalf', 'soleus', 'baldır kalınlaştırma']
  },

  // ── KALÇA (GLUTES) ────────────────────────────────────────
  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust (Kalça İtişi)',
    englishName: 'Barbell Hip Thrust',
    category: 'glutes',
    categoryLabel: 'Kalça',
    gifUrl: `${CDN_BASE}/glutes/resistance-band-hip-thrusts-on-knees-female.gif`,
    youtubeQuery: 'barbell hip thrust proper form Bret Contreras',
    youtubeVideoId: 'SEdqd1n01V4',
    targetMuscles: ['Gluteus Maximus (Vücudun En Güçlü Kası)'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    instructions: [
      'Sırtınızın üst kısmını (kürek kemiği altı) sehpaya yaslayın.',
      'Barı kalça kıvrımınıza yerleştirin (sünger ped kullanın).',
      'Ayaklar omuz genişliğinde, tepe noktada kaval kemiği yere 90 derece dik olmalıdır.',
      'Çene göğüste kilitli kalsın, topuklardan güç alarak kalçanızı yukarı fırlatın.',
      'Tepe noktada kalçayı 2 saniye maksimum sertlikte sıkın.'
    ],
    commonMistakes: [
      'Beli aşırı büküp yükü omurgaya vermek (baş hep öne baksın)',
      'Tepe noktada tam kilit yapmamak'
    ],
    proTip: 'Yatay itiş sağladığı için kalça kasında squattan %50 daha fazla tepe kasılması yaratır; dik ve taş gibi bir kalçanın 1 numaralı hareketidir.',
    defaultSetsReps: '4 set x 8-12 tekrar',
    keywords: ['hip thrust', 'barbell hip thrust', 'kalça itişi', 'glute thrust']
  },

  // ── TRAPEZ & BOYUN (TRAPS & NECK) ──────────────────────────
  {
    id: 'barbell-shrugs',
    name: 'Barbell Shrugs (Trapez Kaldırma)',
    englishName: 'Barbell Shrug',
    category: 'traps',
    categoryLabel: 'Trapez & Boyun',
    gifUrl: `${CDN_BASE}/traps/barbell-shrug.gif`,
    youtubeQuery: 'barbell shrug form',
    youtubeVideoId: 'cJRVVxmytaM',
    targetMuscles: ['Trapezius (Üst Parça)'],
    secondaryMuscles: ['Levator Scapulae', 'Ön Kol'],
    instructions: [
      'Barı omuz genişliğinde tutun, kollar serbest kalsın.',
      'Omuzları doğrudan kulaklarınıza doğru yukarı çekin.',
      'Tepe noktada 1.5 saniye sıkıştırın ve yavaşça indirin.'
    ],
    commonMistakes: ['Omuzları geriye doğru yuvarlamak (omuz eklemine aşırı zararlıdır)'],
    proTip: 'Boyun ve omuz arasındaki kas kütlesini inşa ederek atletik ve güçlü bir üst çatı silüeti kurar.',
    defaultSetsReps: '4 set x 10-12 tekrar',
    keywords: ['barbell shrug', 'shrug', 'trapez', 'shrugs', 'barbell shrugs']
  }
];

// ── AKILLI EŞLEŞTİRME VE BULMA FONKSİYONU ───────────────────
export function getExerciseMedia(query: string): ExerciseMedia | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();

  // 1. Doğrudan ID eşleşmesi
  const directId = EXERCISE_MEDIA_DATABASE.find(e => e.id === clean);
  if (directId) return directId;

  // 2. İsim tam eşleşmesi
  const directName = EXERCISE_MEDIA_DATABASE.find(
    e => e.name.toLowerCase() === clean || e.englishName.toLowerCase() === clean
  );
  if (directName) return directName;

  // 3. Anahtar kelime eşleşmesi
  for (const ex of EXERCISE_MEDIA_DATABASE) {
    if (ex.keywords.some(k => clean.includes(k) || k.includes(clean))) {
      return ex;
    }
  }

  // 4. Parçalı kelime eşleşmesi
  const words = clean.split(/[\s,+/&—-]+/).filter(w => w.length > 2);
  let bestMatch: ExerciseMedia | null = null;
  let maxScore = 0;

  for (const ex of EXERCISE_MEDIA_DATABASE) {
    let score = 0;
    for (const w of words) {
      if (ex.name.toLowerCase().includes(w)) score += 3;
      if (ex.englishName.toLowerCase().includes(w)) score += 3;
      if (ex.keywords.some(k => k.includes(w))) score += 2;
      if (ex.targetMuscles.some(m => m.toLowerCase().includes(w))) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = ex;
    }
  }

  return maxScore >= 3 ? bestMatch : null;
}

// ── REÇETE METİNLERİNDEN ÇOKLU EGZERSİZLERİ AYIKLAMA ──────
export function extractExercisesFromText(text: string): ExerciseMedia[] {
  if (!text) return [];

  const foundExercises: ExerciseMedia[] = [];
  const seenIds = new Set<string>();

  // Yaygın ayraçlar: +, veya, ve, /
  const parts = text.split(/[+&/]| veya | ve /i);

  for (const part of parts) {
    const matched = getExerciseMedia(part);
    if (matched && !seenIds.has(matched.id)) {
      seenIds.add(matched.id);
      foundExercises.push(matched);
    }
  }

  // Eğer parçalara ayırarak bulunamadıysa metnin tamamını tara
  if (foundExercises.length === 0) {
    for (const ex of EXERCISE_MEDIA_DATABASE) {
      if (ex.keywords.some(k => text.toLowerCase().includes(k))) {
        if (!seenIds.has(ex.id)) {
          seenIds.add(ex.id);
          foundExercises.push(ex);
        }
      }
    }
  }

  return foundExercises;
}
