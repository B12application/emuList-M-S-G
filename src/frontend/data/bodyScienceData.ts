// src/frontend/data/bodyScienceData.ts
// Spor Bilimi & Beden Geliştirme / İnceltme Rehberi
// Brad Schoenfeld, ACSM, FFMI ve Spor Hekimliği Standartları Temelli

import type { ValidMeasurementKey, BodyMeasurements, Gender } from '../services/bodyProfileService';

export interface RegionalGuide {
  key: ValidMeasurementKey;
  regionName: string;
  category: 'upper' | 'arms' | 'core' | 'legs';
  targetMuscles: string;
  anatomyOverview: string;

  // Nasıl Büyütülür? (Hipertrofi Bilimi)
  howToGrow: {
    mechanism: string;
    primaryExercises: Array<{
      name: string;
      setsReps: string;
      tip: string;
    }>;
    hypertrophyTips: string[];
    restAndRecovery: string;
  };

  // Nasıl İnceltilir / Küçültülür? (Sıkılaşma & Yağ Oranı)
  howToReduce: {
    spotReductionMyth: string;
    reductionStrategy: string;
    tighteningExercises: Array<{
      name: string;
      focus: string;
    }>;
    nutritionAndWaterAdvice: string;
  };

  commonMistakes: string[];
  scientificReference: string;
}

export const REGIONAL_GUIDES: Record<ValidMeasurementKey, RegionalGuide> = {
  neckCm: {
    key: 'neckCm',
    regionName: 'Boyun',
    category: 'upper',
    targetMuscles: 'Sternocleidomastoid, Trapezius (Üst Parça), Splenius Capitis',
    anatomyOverview: 'Boyun omurlarını destekleyen, başın dik duruşunu ve omurga sağlığını koruyan kritik kas grubudur.',
    howToGrow: {
      mechanism: 'Boyun kasları yüksek oranda yavaş kasılan (Tip 1) lifler barındırır. Kontrollü eksantrik yükleme ve izometrik dirençle kalınlaşır.',
      primaryExercises: [
        { name: 'Neck Flexion / Extension (Plaka veya Boyun Kayışı)', setsReps: '3 set x 15-20 tekrar', tip: 'Asla ani sarsma yapmayın, çenenizi göğse yaklaştırırken yavaş kontrol sağlayın.' },
        { name: 'Barbell Shrugs (Trapez Odaklı)', setsReps: '4 set x 10-12 tekrar', tip: 'Omuzları geriye yuvarlamayın, doğrudan kulaklara doğru yukarı çekip 1 saniye sıkın.' },
      ],
      hypertrophyTips: [
        'Dövüş sporcuları ve ragbi oyuncularının boyun protokolü haftalık 2 seanstır.',
        'Hafif ağırlık ve yüksek tekrar ile başlayarak omurga disklerini riske atmayın.',
      ],
      restAndRecovery: 'Boyun kasları günlük postürde sürekli çalıştığı için seanslar arası en az 48 saat dinlenmelidir.',
    },
    howToReduce: {
      spotReductionMyth: 'Boyun altındaki yağ (gıdı) bölgesel egzersizle erimez; sistemik vücut yağı düştükçe doğal olarak kaybolur.',
      reductionStrategy: 'Genel vücut yağ oranını %14 altına (erkek) veya %22 altına (kadın) düşürmek gıdıyı tamamen yok eder. Ayrıca "Forward Head Posture" (ileri baş duruşu) düzeltilmelidir.',
      tighteningExercises: [
        { name: 'Chin Tucks (Çene Geriye Çekme)', focus: 'Derin boyun fleksörlerini güçlendirerek gıdının sarkmasını önler.' },
        { name: 'Platysma Germe', focus: 'Boyun ön kasını gererek derinin sıkılaşmasına katkı sağlar.' },
      ],
      nutritionAndWaterAdvice: 'Yüksek sodyum tüketimi çene altında ödeme yol açar. Günlük en az 3 litre su içerek lenfatik drenajı artırın.',
    },
    commonMistakes: ['Başınızı geriye atarken boyun omurlarını sıkıştırmak', 'Aşırı ağır plaka kullanmak'],
    scientificReference: 'Journal of Strength and Conditioning Research (2019): "Cervical Spine Strengthening and Hypertrophy in Athletes".',
  },

  shoulderCm: {
    key: 'shoulderCm',
    regionName: 'Omuz',
    category: 'upper',
    targetMuscles: 'Deltoideus (Ön, Yan, Arka Başlar) ve Supraspinatus',
    anatomyOverview: 'Omuz başları genişledikçe beli optik olarak çok daha ince gösterir (Adonis V-Taper estetiğinin 1 numaralı belirleyicisidir).',
    howToGrow: {
      mechanism: 'Lateral (Yan) deltoid özellikle esneme altında ve orta-yüksek tekrarlarda (12-20) mekanik gerilimle genişler. Arka omuz ise omuza 3 boyutlu derinlik katar.',
      primaryExercises: [
        { name: 'Dumbbell / Cable Lateral Raise', setsReps: '4 set x 12-15 tekrar (1 RIR)', tip: 'Dirsekleri kırmayın, serçe parmağını tavana değil bileği ve dirseği aynı hizada kaldırın.' },
        { name: 'Overhead Dumbbell / Barbell Press', setsReps: '3 set x 6-10 tekrar', tip: 'Başınızı öne alırken trapezleri aşırı devreye sokmadan omuzdan itin.' },
        { name: 'Face Pull (İp ile Arka Omuz)', setsReps: '4 set x 15-20 tekrar', tip: 'İpi göz hizasına çekip dirsekleri dışa açın, dış rotasyon yapın.' },
      ],
      hypertrophyTips: [
        'Haftada en az 14-18 direkt set lateral omuz çalışmak genişliği katlar.',
        'Kablo lateral raise, dambıla kıyasla hareketin en alt noktasında bile gerilim sağladığı için hipertrofide %30 daha üstündür.',
      ],
      restAndRecovery: 'Deltoidler hızlı toparlanır; haftada 2-3 güne bölünerek çalıştırılması önerilir.',
    },
    howToReduce: {
      spotReductionMyth: 'Omuz bölgesinde yağ fazlalığı nadirdir; genelde dar omuzlar yetersiz kas kütlesi ve kambur duruştan kaynaklanır.',
      reductionStrategy: 'Omuz genişliğini azaltmak estetik açıdan önerilmez. Eğer omuz çevresi yağlı ise sistemik kalori açığı ile yağ azaltılırken omuz kasları korunmalıdır.',
      tighteningExercises: [
        { name: 'Band Pull-Aparts', focus: 'Omuzları geriye açarak kambur duruşu düzeltir ve omuz başlarını dikleştirir.' },
      ],
      nutritionAndWaterAdvice: 'Yeterli protein (kg başına 1.8-2.2g) alarak omuz kaslarını koruyun.',
    },
    commonMistakes: ['Sadece Overhead Press yapıp lateral raise ve face pullu ihmal etmek', 'Lateral raise sırasında gövdeyi sallayarak momentum kullanmak'],
    scientificReference: 'Schoenfeld, B. et al. (2020): "Regional Deltoid Hypertrophy and Exercise Angle Analysis".',
  },

  chestCm: {
    key: 'chestCm',
    regionName: 'Göğüs',
    category: 'upper',
    targetMuscles: 'Pectoralis Major (Klavikular/Üst Baş & Sternal/Orta-Alt Baş), Pectoralis Minor',
    anatomyOverview: 'Üst göğüs (köprücük kemiği altı) dolu olduğunda göğüs sarkık görünmez, zırh gibi yukarı kalkar.',
    howToGrow: {
      mechanism: 'Göğüs kasları esneme pozisyonunda (deep stretch) aşırı hipertrofik yanıt verir. Dumbbell fly ve dipste en alt noktada 1 saniye beklemek lif aktivasyonunu zirveye taşır.',
      primaryExercises: [
        { name: 'Incline Dumbbell Press (30° Eğim)', setsReps: '4 set x 8-12 tekrar', tip: '30 dereceden dik açı yapmayın, yoksa ön omuza biner. Kürek kemiklerini geride kilitleyin.' },
        { name: 'Flat Barbell / Dumbbell Bench Press', setsReps: '3 set x 6-8 tekrar', tip: 'Barı göğse kontrollü indirin (2-3 saniye eksantrik), sıçratmayın.' },
        { name: 'Weighted Dips veya Cable Crossover', setsReps: '3 set x 12-15 tekrar', tip: 'Öne doğru hafif eğilerek alt ve dış göğsü izole edin.' },
      ],
      hypertrophyTips: [
        'Eksantrik (indirme) fazını 3 saniyede tamamlamak kas hasarını ve mekanik gerilimi maksimize eder.',
        'Üst göğüs antrenmanın başında taze enerjiyle çalışılmalıdır.',
      ],
      restAndRecovery: 'Ağır göğüs seansından sonra 72 saat dinlenme optimaldir.',
    },
    howToReduce: {
      spotReductionMyth: 'Göğüsteki fazla yağ (jinekomasti benzeri görünüm) şınav çekerek erimez; sistemik kalori açığı gerektirir.',
      reductionStrategy: 'Eğer göğüste sarkma veya fazla yağlanma varsa: Üst göğsü (Incline) büyüterek göğüs dokusunu yukarı çekin ve %12-14 genel yağ oranına inin.',
      tighteningExercises: [
        { name: 'Incline Push-Ups / Cable Upper Fly', focus: 'Üst göğüs liflerini gerginleştirerek alt göğüsteki sarkık görüntüyü toplar.' },
      ],
      nutritionAndWaterAdvice: 'İşlenmiş östrojenik gıdalardan (aşırı soya, alkol) kaçınarak hormonal dengeyi koruyun.',
    },
    commonMistakes: ['Kürek kemiklerini (scapula) sabitlemeyip omzu öne fırlatmak', 'Eksantrik fazı kontrolsüzce göğse çarptırmak'],
    scientificReference: 'European Journal of Sport Science (2021): "Effects of Bench Angle on Pectoralis Major Clavicular Head Activation".',
  },

  waistCm: {
    key: 'waistCm',
    regionName: 'Bel',
    category: 'core',
    targetMuscles: 'Transversus Abdominis (Doğal Beden Korsesi), Internal/External Obliques',
    anatomyOverview: 'Bel çevresi hem estetiğin hem de visseral (iç organ) yağlanmanın en kritik barometresidir. Boyun yarısından az olmalıdır.',
    howToGrow: {
      mechanism: 'Beli kalınlaştırmak çoğu sporcunun istemediği bir durumdur. Ancak güreş, powerlifting gibi sporlarda omurga desteği için kalın oblik kasları hedeflenir.',
      primaryExercises: [
        { name: 'Heavy Barbell Squat & Deadlift', setsReps: '3-5 tekrar', tip: 'Kemer kullanımı ve karın içi basınç (valsalva) omurga çevresini kalınlaştırır.' },
        { name: 'Weighted Side Bends (Dambıl ile Yan Eğilme)', setsReps: '3 set x 12 tekrar', tip: 'Oblikleri kalınlaştırarak beli genişletir (estetik arayanlar bundan kaçınmalıdır!).' },
      ],
      hypertrophyTips: ['Estetik V-Taper isteyenler ağır ağırlıkla yan karın (oblique) çalışmamalıdır.'],
      restAndRecovery: 'Karın kasları dayanıklılık odaklıdır, haftalık 2-3 seans yeterlidir.',
    },
    howToReduce: {
      spotReductionMyth: 'Mekik çekmek beldeki simitleri (love handles) eritmez. Bel çevresi alfa-2 adrenerjik reseptörleri en yoğun bölgedir; en son eriyen inatçı yağ deposudur.',
      reductionStrategy: 'Sistemik kalori açığı (günlük 400-600 kcal), günlük 8.000-10.000 adım (NEAT) ve haftada 2 seans HIIT kardiyo. Ek olarak Vakum Egzersizi beli 3-5 cm daraltır.',
      tighteningExercises: [
        { name: 'Stomach Vacuum (Mide Vakumu)', focus: 'Transversus abdominis kasını sıkarak iç organları içeri çeker, beli direkt 3-6 cm inceltir.' },
        { name: 'Paloff Press (Anti-Rotasyon)', focus: 'Oblikleri kalınlaştırmadan çekirdek stabilitesi sağlar.' },
        { name: 'Hollow Body Hold', focus: 'Derin karın duvarını güçlendirir.' },
      ],
      nutritionAndWaterAdvice: 'İnsülin dalgalanmalarını durdurun: Basit şeker ve rafine unu kesin. Bel çevresi doğrudan insülin direnciyle ilişkilidir.',
    },
    commonMistakes: ['Beli inceltmek için ağırlıklı yan bükülme (side bend) yapmak (beli kalınlaştırır!)', 'Kardiyoyu aç karna yapınca mucize beklemek (toplam kalori açığı esastır)'],
    scientificReference: 'American College of Sports Medicine (ACSM, 2022): "Waist-to-Height Ratio as a Stronger Marker of Visceral Adiposity than BMI".',
  },

  upperAbdomenCm: {
    key: 'upperAbdomenCm',
    regionName: 'Üst Karın',
    category: 'core',
    targetMuscles: 'Rectus Abdominis (Üst Segment) ve Linea Alba',
    anatomyOverview: 'Midenin hemen altındaki baklavaların ilk iki sırasını oluşturan bölgedir.',
    howToGrow: {
      mechanism: 'Karın kasları da diğer iskelet kasları gibi büyümek için dirençli aşırı yüklemeye (weighted progressive overload) ihtiyaç duyar.',
      primaryExercises: [
        { name: 'Cable Kneeling Crunch (Kablo Mekik)', setsReps: '3 set x 12-15 tekrar', tip: 'Kollardan değil, omurgayı yuvarlayarak göğüs kafesini leğen kemiğine yaklaştırın.' },
        { name: 'Weighted Decline Crunch', setsReps: '3 set x 10-12 tekrar', tip: 'Geriye yatarken karın kaslarında esnemeyi hissedin.' },
      ],
      hypertrophyTips: ['Boş mekik yerine ağırlıklı karın hareketleri baklavaların dışarı fırlamasını sağlar.'],
      restAndRecovery: 'Haftada 2-3 gün, set sonlarında 60 saniye dinlenmeyle.',
    },
    howToReduce: {
      spotReductionMyth: '1.000 mekik çekseniz bile üzerindeki yağ tabakası kalori açığı olmadan erimez.',
      reductionStrategy: 'Yağ oranını erkeklerde %12, kadınlarda %20 altına indirmek üst karın çizgilerini belirginleştirir.',
      tighteningExercises: [
        { name: 'Plank (Dirsek Üstü Duruş)', focus: 'Tüm karın duvarını sıkılaştırır.' },
      ],
      nutritionAndWaterAdvice: 'Mide şişkinliğini önlemek için gaz yapan yapay tatlandırıcılardan ve aşırı sodyumdan kaçının.',
    },
    commonMistakes: ['Boyundan çekerek mekiği omurga yerine boyunla yapmak', 'Hızlı ve savurarak tekrar tamamlamak'],
    scientificReference: 'Journal of Orthopaedic & Sports Physical Therapy (2020): "Electromyographic Analysis of Upper Rectus Abdominis Activation".',
  },

  lowerAbdomenCm: {
    key: 'lowerAbdomenCm',
    regionName: 'Alt Karın',
    category: 'core',
    targetMuscles: 'Rectus Abdominis (Alt Bölüm), Piramidalis, Pelvik Taban',
    anatomyOverview: 'Göbek deliği ile kasık arasındaki bölgedir; genetik olarak vücudun en son yağ bıraktığı inatçı depodur.',
    howToGrow: {
      mechanism: 'Pelvik tilt (leğen kemiğini yukarı ve içeri yuvarlama) hareketiyle uyarılır. Bacakları sadece yukarı kaldırmak psoas kasını çalıştırır, karın için kalçayı yukarı yuvarlamak şarttır.',
      primaryExercises: [
        { name: 'Hanging Leg / Knee Raise with Pelvic Curl', setsReps: '3 set x 10-15 tekrar', tip: 'Bacakları kaldırıp bırakmayın; kalçanızı göğsünüze doğru yukarı kıvırın.' },
        { name: 'Reverse Crunch on Incline Bench', setsReps: '3 set x 12-15 tekrar', tip: 'Ayaklar yere değmeden kalçayı sehpaya 5 cm kaldırıp 1 saniye sıkın.' },
      ],
      hypertrophyTips: ['Alt karın lifleri pelvik rotasyon olmadan tam kasılamaz.'],
      restAndRecovery: 'Haftada 2-3 kez yeterlidir.',
    },
    howToReduce: {
      spotReductionMyth: 'Alt göbek "en son giren en ilk çıkar" kuralının tersine; vücudun ilk depolayıp en son yaktığı yerdir.',
      reductionStrategy: 'Sabırlı bir kalori açığı gereklidir. Erkeklerde %10-11 yağ oranına inmeden alt karındaki son 2 cm gitmez. Anterior Pelvic Tilt (leğen kemiğinin öne eğik olması) düzeltilmelidir.',
      tighteningExercises: [
        { name: 'Deadbug (Ölü Böcek Egzersizi)', focus: 'Alt karnı sabitlerken leğen kemiğini nötr pozisyona getirerek göbeğin fırlamasını önler.' },
        { name: 'Glute Bridge (Kalça Köprüsü)', focus: 'Kalçayı güçlendirerek öne devrilen leğen kemiğini geriye çeker.' },
      ],
      nutritionAndWaterAdvice: 'Alkol ve geç saatte yenen ağır yemekler kortizolü artırarak alt göbek yağlanmasını tetikler.',
    },
    commonMistakes: ['Bacak kaldırmada beli sehpaya yapıştırmayıp bel boşluğunu açarak bel ağrısı yaratmak', 'Pelvisi yuvarlamadan sadece kalça bükücüleri çalıştırmak'],
    scientificReference: 'Contreras, B. et al. (2018): "Biomechanical Comparison of Hanging Leg Raises and Pelvic Posterior Tilt".',
  },

  upperArmLeftCm: {
    key: 'upperArmLeftCm',
    regionName: 'Üst Kol (Sol)',
    category: 'arms',
    targetMuscles: 'Biceps Brachii (Kısa & Uzun Baş), Triceps Brachii (Uzun, Lateral, Medial Baş), Brachialis',
    anatomyOverview: 'Kol hacminin %60-65’ini Triceps, %35-40’ını Biceps oluşturur. Kolu büyütmenin anahtarı Triceps uzun baştır.',
    howToGrow: {
      mechanism: 'Biceps supinasyon (avuç içini yukarı döndürme) ile, Triceps ise dirsek ekstansiyonu ile büyür. Brachialis kası ise biceps ile triceps arasını doldurarak kolu dışarı iter.',
      primaryExercises: [
        { name: 'Incline Dumbbell Curl (Biceps Uzun Baş Esneme)', setsReps: '3 set x 8-12 tekrar', tip: 'Dirsekleri geride tutarak bicepsi tam esnetin.' },
        { name: 'Overhead Cable Triceps Extension', setsReps: '4 set x 10-15 tekrar', tip: 'Kollar baş üstündeyken Triceps uzun başı maksimum gerilim altına girer.' },
        { name: 'Hammer Curl (Brachialis ve Kol Kalınlığı)', setsReps: '3 set x 10-12 tekrar', tip: 'Nötr tutuşla kolun yan profilini kalınlaştırır.' },
        { name: 'Close-Grip Bench Press', setsReps: '3 set x 6-8 tekrar', tip: 'Tricepse ağır mekanik yük bindirir.' },
      ],
      hypertrophyTips: [
        'Kollar haftalık 14-18 toplam setle en iyi gelişimi gösterir.',
        'Sadece biceps basmak kolu büyütmez; Triceps hacmin 2 katıdır.',
      ],
      restAndRecovery: 'Çekiş ve itiş günlerinde dolaylı çalıştığı için haftalık hacmi iyi planlanmalıdır.',
    },
    howToReduce: {
      spotReductionMyth: 'Kollardaki sallantı (özellikle triceps arkasındaki sarkma) lokal çalışmayla erimez; sistemik yağ yakımı şarttır.',
      reductionStrategy: 'Kalori açığı ile vücut yağını düşürürken, Triceps ve Biceps kaslarını hipertrofi ile doldurarak derinin gergin ve sıkı durmasını sağlayın.',
      tighteningExercises: [
        { name: 'Triceps Rope Pushdown', focus: 'Triceps lateral başını sıkarak at nalı görüntüsü kazandırır.' },
        { name: 'Diamond Push-Up', focus: 'Vücut ağırlığıyla kol arkasını sıkılaştırır.' },
      ],
      nutritionAndWaterAdvice: 'Yeterli protein alarak kol kası kaybı yaşamadan yağdan kilo verin.',
    },
    commonMistakes: ['Biceps curl yaparken dirsekleri öne atıp omuzdan yardım almak', 'Kısa hareket aralığı (half-reps) uygulamak'],
    scientificReference: 'Schoenfeld, B. (2020): "Science and Development of Muscle Hypertrophy - Arm Muscle Architecture".',
  },

  upperArmRightCm: {
    key: 'upperArmRightCm',
    regionName: 'Üst Kol (Sağ)',
    category: 'arms',
    targetMuscles: 'Biceps Brachii, Triceps Brachii, Brachialis',
    anatomyOverview: 'Sağ kol genelde dominant koldur. Sol kola kıyasla 0.5-1 cm fark normaldir ancak 1.5 cm üzeri asimetri düzeltilmelidir.',
    howToGrow: {
      mechanism: 'Biceps ve Triceps için tam hareket açısı (ROM) ve bağımsız dambıl/kablo çalışması asimetriyi önler.',
      primaryExercises: [
        { name: 'Dumbbell Preacher Curl', setsReps: '3 set x 10-12 tekrar', tip: 'Hileyi sıfırlar, bicepsin alt ucunu izole eder.' },
        { name: 'Single Arm Cable Pushdown', setsReps: '3 set x 12-15 tekrar', tip: 'Sağ ve sol kola eşit bağımsız direnç verir.' },
      ],
      hypertrophyTips: ['Eğer sağ kol sol koldan büyükse, her sete zayıf olan sol kolla başlayın ve sağ kolla solun yaptığı kadar tekrar yapın.'],
      restAndRecovery: 'Haftada 2 seans direkt kol çalışması idealdir.',
    },
    howToReduce: {
      spotReductionMyth: 'Sağ kola daha fazla ağırlık basmak yağı eritmez.',
      reductionStrategy: 'Genel kalori açığı ile koldaki deri altı yağını azaltıp kas dokusunu diri tutmak.',
      tighteningExercises: [
        { name: 'Dips', focus: 'Kol arkasını ve omuz bağlantısını gerginleştirir.' },
      ],
      nutritionAndWaterAdvice: 'Karbonhidrat ve su dengesi kas içi glikojeni doldurarak kolun sönük değil diri durmasını sağlar.',
    },
    commonMistakes: ['Daima halter/bar kullanmak (dominant kol ağırlığı çeker ve asimetri büyür)', 'Aşırı ağır girip sallanmak'],
    scientificReference: 'Journal of Sports Sciences: "Unilateral vs Bilateral Resistance Training for Arm Hypertrophy".',
  },

  forearmLeftCm: {
    key: 'forearmLeftCm',
    regionName: 'Ön Kol (Sol)',
    category: 'arms',
    targetMuscles: 'Brachioradialis, Pronator Teres, Flexor/Extensor Carpi Radialis',
    anatomyOverview: 'Kavrama kuvvetini belirleyen, tişört giyildiğinde gücün en belirgin göstergesi olan kas grubudur.',
    howToGrow: {
      mechanism: 'Ön kol kasları gün boyu kavrama işlevinde aktiftir. Büyümeleri için ağır izometrik tutuşlar ve bilek bükme hareketleri gerekir.',
      primaryExercises: [
        { name: 'Farmer’s Walk (Ağır Dambıl Taşıma)', setsReps: '3 set x 40-50 metre', tip: 'Ağır dambılları dik duruşla sıkarak taşıyın.' },
        { name: 'Reverse Barbell / Cable Curl', setsReps: '3 set x 12-15 tekrar', tip: 'Ters tutuşla Brachioradialis kasını doğrudan hedefler.' },
        { name: 'Wrist Curl & Wrist Roller', setsReps: '3 set x 15-20 tekrar', tip: 'Bileği tam büküp tam açın.' },
      ],
      hypertrophyTips: ['Çekiş antrenmanlarında her zaman kayış (strap) kullanmayın; el kavrama kuvvetinizi serbest bırakın.'],
      restAndRecovery: 'Hızlı toparlanır, haftada 3 gün çalıştırılabilir.',
    },
    howToReduce: {
      spotReductionMyth: 'Ön kolda yağ birikimi çok nadirdir. Genelde bilek ince, kas azdır.',
      reductionStrategy: 'Kollarda aşırı su tutuluyorsa sodyum azaltılmalı ve bol su tüketilmelidir.',
      tighteningExercises: [{ name: 'Dead Hang (Barda Asılı Kalma)', focus: 'Kavrama gücünü ve ön kol tendonlarını çelikleştirir.' }],
      nutritionAndWaterAdvice: 'Kreatin kullanımı ön kol kas hücrelerini suyla doldurarak hacim kazandırır.',
    },
    commonMistakes: ['Bilek hareketlerinde aşırı ağır girip karpal tüneli zedelemek', 'Ön kolu tamamen yok sayıp sırtta hep kayışa sığınmak'],
    scientificReference: 'Sports Medicine: "Grip Strength and Forearm Hypertrophy Mechanisms in Athletes".',
  },

  forearmRightCm: {
    key: 'forearmRightCm',
    regionName: 'Ön Kol (Sağ)',
    category: 'arms',
    targetMuscles: 'Brachioradialis, Flexors, Extensors',
    anatomyOverview: 'Yazı yazma ve günlük alet kullanımında dominant olan koldur.',
    howToGrow: {
      mechanism: 'Ağır deadlift, barfiks ve farmer walk ile mekanik aşırı yükleme.',
      primaryExercises: [
        { name: 'Behind the Back Wrist Curl', setsReps: '3 set x 15 tekrar', tip: 'Bileği arkada bükerek fleksiyon kaslarını doldurur.' },
      ],
      hypertrophyTips: ['Sol ön kol ile sağ arasındaki farkı kapatmak için zayıf tarafa 1 ekstra set uygulayın.'],
      restAndRecovery: 'Haftada 2-3 gün.',
    },
    howToReduce: {
      spotReductionMyth: 'Ön kol yağlanması sistemik yağın bir sonucudur.',
      reductionStrategy: 'Kalori açığı ve temiz beslenme.',
      tighteningExercises: [{ name: 'Reverse Curl', focus: 'Bilek ve ön kolu sıkar.' }],
      nutritionAndWaterAdvice: 'Günde 3 litre su ile ödemi atın.',
    },
    commonMistakes: ['Bilek eklemini ısıtmadan ani yüklere girmek'],
    scientificReference: 'Journal of Hand Therapy: "Forearm Musculature and Hypertrophy Responses".',
  },

  thighLeftCm: {
    key: 'thighLeftCm',
    regionName: 'Uyluk (Sol Bacak)',
    category: 'legs',
    targetMuscles: 'Quadriceps (Vastus Medialis, Lateralis, Rectus Femoris), Hamstrings, Adductors',
    anatomyOverview: 'Vücuttaki en büyük kas kütlesidir. Metabolizmanın ve testosteron salınımının ana motorudur.',
    howToGrow: {
      mechanism: 'Bacaklar derin fleksiyon (derin diz bükme) ve esneme altında muazzam büyür. Paralel altına inen squat, quadricepsi %40 daha fazla uyarır.',
      primaryExercises: [
        { name: 'Barbell Back Squat (Tam Derinlik)', setsReps: '4 set x 6-10 tekrar', tip: 'Dizleri içe kapatmayın, topuklardan itin, paralel altına inin.' },
        { name: 'Leg Press (Ayaklar Tabanda)', setsReps: '4 set x 10-15 tekrar', tip: 'Dizleri yukarıda kilitlemeyin, gerilimi kasta tutun.' },
        { name: 'Romanian Deadlift (RDL - Hamstring)', setsReps: '3 set x 8-12 tekrar', tip: 'Kalçayı geriye itin, hamstringlerde derin esneme yakalayın.' },
        { name: 'Bulgarian Split Squat', setsReps: '3 set x 10 tekrar (her bacak)', tip: 'Sağ ve sol bacak arasındaki kuvvet farkını tamamen sıfırlar.' },
      ],
      hypertrophyTips: [
        'Bacakları büyütmek için haftalık 16-20 set gereklidir.',
        'Leg extension gibi makinelerde tepe noktada 1-2 saniye sıkıştırma (peak contraction) uygulayın.',
      ],
      restAndRecovery: 'Bacak kasları büyüktür; ağır antrenmandan sonra en az 72 saat dinlenme ister.',
    },
    howToReduce: {
      spotReductionMyth: 'Bacaklardaki selülit veya kalınlık bacak açma-kapama makinesiyle yok edilemez.',
      reductionStrategy: 'Sistemik kalori açığı ile bacak yağı eritilir. Bacakları hantal göstermeyen, sıkı ve atletik bir form için yüksek tekrarlı lunge ve yürüyüşler kombine edilmelidir.',
      tighteningExercises: [
        { name: 'Walking Lunges (Yürüyüş Lunge)', focus: 'Bacak arkasını ve iç bacağı sıkılaştırarak selülit görünümünü yok eder.' },
        { name: 'Kettlebell Swings', focus: 'Kalça ve arka bacağı sıkılaştırırken yüksek kalori yakar.' },
      ],
      nutritionAndWaterAdvice: 'Bacaklarda su tutulması hormonal olabilir; potasyum zengini besinler (muz, ıspanak, patates) tüketin.',
    },
    commonMistakes: ['Squatta yarım çökmek (half-squat) - dizlere biner, kası büyütmez', 'Arka bacağı (hamstrings) tamamen ihmal edip sadece ön bacak basmak'],
    scientificReference: 'Schoenfeld, B. et al. (2021): "Squat Depth and Knee Angle Hypertrophy Mechanisms in Trained Males".',
  },

  thighRightCm: {
    key: 'thighRightCm',
    regionName: 'Uyluk (Sağ Bacak)',
    category: 'legs',
    targetMuscles: 'Quadriceps, Hamstrings, Glutes',
    anatomyOverview: 'Sağ bacak dominant sıçrama veya destek bacağı olabilir.',
    howToGrow: {
      mechanism: 'Bileşik bacak hareketleri ve tek taraflı (unilateral) yüklemeler.',
      primaryExercises: [
        { name: 'Hack Squat', setsReps: '3 set x 10-12 tekrar', tip: 'Sırtı yaslayıp derin çökün.' },
        { name: 'Walking Dumbbell Lunge', setsReps: '3 set x 12 adım', tip: 'Diz 90 derece bükülsün.' },
      ],
      hypertrophyTips: ['Sol bacakla eşit güç ve hacimde olması için unilateral çalışmaları ön plana alın.'],
      restAndRecovery: 'Haftada 2 bacak günü (İtiş/Çekiş veya Quad/Hamstring odaklı).',
    },
    howToReduce: {
      spotReductionMyth: 'Bacak inceltmek kalori açığı ve doğru kardiyo kombinasyonudur.',
      reductionStrategy: 'Düşük tempolu eğimli yürüyüş (Incline Walking) kas kaybetmeden bacak yağını eritir.',
      tighteningExercises: [{ name: 'Step-Up', focus: 'Bacak ve kalça bağlantısını dikleştirir.' }],
      nutritionAndWaterAdvice: 'Yeterli hidrasyon bacak dolaşımını düzenler.',
    },
    commonMistakes: ['Ağır kiloda formun bozulması ve dizlerin içeri çökmesi (valgus)'],
    scientificReference: 'Journal of Strength and Conditioning Research: "Unilateral vs Bilateral Leg Hypertrophy".',
  },

  calfLeftCm: {
    key: 'calfLeftCm',
    regionName: 'Baldır (Sol Kalf)',
    category: 'legs',
    targetMuscles: 'Gastrocnemius (Ayakta çalışan dış kalp) ve Soleus (Oturarak çalışan derin düz kas)',
    anatomyOverview: 'Vücudun genetik olarak büyütülmesi en zor kasıdır. Aşil tendonu çok elastiktir; momentumu kesmek şarttır.',
    howToGrow: {
      mechanism: 'Aşil tendonunun yay etkisini yok etmek için hareketin en alt esneme noktasında 2-3 saniye TAM DURAKLAMA (dead stop) yapılmalıdır. Yaylanarak kalf büyütülemez!',
      primaryExercises: [
        { name: 'Standing Calf Raise (Ayakta Kalf)', setsReps: '4 set x 8-12 tekrar', tip: 'En altta 2 saniye bekle, patlayıcı şekilde yüksel, tepede 2 saniye sık.' },
        { name: 'Seated Calf Raise (Oturarak Kalf)', setsReps: '4 set x 15-20 tekrar', tip: 'Dizler 90 dereceyken Soleus kasını izole eder; baldırı kalınlaştırır.' },
        { name: 'Leg Press Toe Press', setsReps: '3 set x 15 tekrar', tip: 'Ayak uçlarıyla güvenli ağırlık basımı.' },
      ],
      hypertrophyTips: [
        'Kalf kasları günlük yürüyüşte binlerce tekrar gördüğü için sadece ağır ağırlık + tam esneme + duraklama ile şoklanabilir.',
        'Haftada 3-4 gün antrenman sonlarında 10 dakika ayrılmalıdır.',
      ],
      restAndRecovery: 'Gastrocnemius hızlı, Soleus ise çok yavaş yorulur; sık antrenmanı sever.',
    },
    howToReduce: {
      spotReductionMyth: 'Kalın kalf genelde genetik kemik yapısı veya ödem kaynaklıdır.',
      reductionStrategy: 'Bileklerdeki ödemi atmak için sodyum dengesi ve lenfatik drenaj. Yağ fazlalığı varsa sistemik diyet.',
      tighteningExercises: [{ name: 'Foam Rolling & Calf Stretch', focus: 'Sertleşmiş kalf kaslarını esneterek bacak silüetini uzatır.' }],
      nutritionAndWaterAdvice: 'Magnezyum ve potasyum alarak kalf kramplarını ve şişkinliği önleyin.',
    },
    commonMistakes: ['Yaylanarak (bouncing) yapmak - kası değil sadece aşil tendonunu çalıştırır', 'En alt esneme noktasına hiç inmemek'],
    scientificReference: 'Brad Schoenfeld (2020): "Calf Muscle Hypertrophy: The Role of Pause at the Stretched Position".',
  },

  calfRightCm: {
    key: 'calfRightCm',
    regionName: 'Baldır (Sağ Kalf)',
    category: 'legs',
    targetMuscles: 'Gastrocnemius, Soleus',
    anatomyOverview: 'Sağ bacağın alt motorudur.',
    howToGrow: {
      mechanism: 'Yavaş eksantrik ve derin esneme duraklaması.',
      primaryExercises: [
        { name: 'Single-Leg Standing Calf Raise', setsReps: '3 set x 15 tekrar', tip: 'Dambıl elde tek bacakla tam derinlikte çalışın.' },
      ],
      hypertrophyTips: ['Tek bacak çalışmaları iki baldır arasındaki santimetre farkını kapatır.'],
      restAndRecovery: 'Haftalık 12-16 set.',
    },
    howToReduce: {
      spotReductionMyth: 'Baldır bölgesine lokal krem veya termal bant sarmak yağı eritmez.',
      reductionStrategy: 'Kardiyo ve kalori açığı.',
      tighteningExercises: [{ name: 'Downward Dog Stretch', focus: 'Baldır arkasını rahatlatır.' }],
      nutritionAndWaterAdvice: 'Tuzu azaltın, suyu artırın.',
    },
    commonMistakes: ['Aşırı ağır takıp 2 cm hareket mesafesiyle oynamak'],
    scientificReference: 'Journal of Applied Physiology: "Soleus vs Gastrocnemius Muscle Fiber Composition".',
  },

  hipCm: {
    key: 'hipCm',
    regionName: 'Kalça',
    category: 'core',
    targetMuscles: 'Gluteus Maximus (Vücudun en güçlü kası), Gluteus Medius, Gluteus Minimus',
    anatomyOverview: 'Dik duruş, omurga sağlığı, patlayıcı güç ve estetik alt gövdenin temel taşıdır.',
    howToGrow: {
      mechanism: 'Kalça kası (Gluteus Maximus) yatay itişlerde (Hip Thrust) dikey çökmelerden (Squat) %50 daha fazla tepe kasılması yaşar.',
      primaryExercises: [
        { name: 'Barbell Hip Thrust', setsReps: '4 set x 8-12 tekrar', tip: 'Sırtı sehpaya yaslayın, çene göğüste kilitli, tepe noktada kalçayı 2 saniye sıkın.' },
        { name: 'Romanian Deadlift (RDL)', setsReps: '3 set x 8-10 tekrar', tip: 'Kalçayı geriye iterek alt kalça-hamstring bağını kaldırın.' },
        { name: 'Cable Kickback / Glute Medius Abduction', setsReps: '3 set x 15 tekrar', tip: 'Üst kalçayı doldurarak yuvarlak ve dik form verir.' },
      ],
      hypertrophyTips: [
        'Ağır kalça itişi (Hip Thrust) haftada en az 1-2 kez uygulanmalıdır.',
        'Masa başı çalışanlarda kalça amnezisi (uyuyan kalça sendromu) olur; antrenman öncesi bantla kalça aktivasyonu yapın.',
      ],
      restAndRecovery: 'Gluteus Maximus büyüktür, 48-72 saat dinlenme ister.',
    },
    howToReduce: {
      spotReductionMyth: 'Kalçada fazla yağ toplanması östrojen dominansı ve genetik yapıya bağlıdır.',
      reductionStrategy: 'Kalori açığıyla sistemik yağ eritilirken, kalça kasları hipertrofiyle kaldırılırsa sarkan yağ yukarı toplanır ve taş gibi dik bir form kazanır.',
      tighteningExercises: [
        { name: 'Step-Up onto High Box', focus: 'Kalçayı yukarı kaldırır, basen sarkmasını toparlar.' },
        { name: 'Stairmaster (Merdiven Kardiyosu)', focus: 'Yağ yakarken kalçayı diri tutan en etkili kardiyodur.' },
      ],
      nutritionAndWaterAdvice: 'İşlenmiş yağları ve trans yağları keserek hücresel yangıyı ve selüliti azaltın.',
    },
    commonMistakes: ['Hip thrust yaparken beli büküp yükü bele vermek', 'Dizleri içeri kapatmak (kalça medius devreden çıkar)'],
    scientificReference: 'Contreras, B. et al. (2020): "A Comparison of Gluteus Maximus EMG Activity in Hip Thrust vs Squat".',
  },
};

// ── Beden Oranları & Kişisel Teşhis Motoru ───────────────

export interface ProportionDiagnostic {
  vTaper: {
    ratio: number;
    status: 'ideal' | 'good' | 'needs_work';
    title: string;
    advice: string;
  } | null;
  waistToHeight: {
    ratio: number;
    status: 'healthy' | 'overweight' | 'risk';
    title: string;
    advice: string;
  } | null;
  armSymmetry: {
    diffCm: number;
    hasAsymmetry: boolean;
    advice: string;
  } | null;
  legSymmetry: {
    diffCm: number;
    hasAsymmetry: boolean;
    advice: string;
  } | null;
  priorityActions: {
    reduceAreas: Array<{ name: string; reason: string; priorityAction: string }>;
    growAreas: Array<{ name: string; reason: string; priorityAction: string }>;
  };
}

export function analyzeBodyProportions(
  heightCm: number,
  weightKg: number,
  gender: Gender,
  measurements: BodyMeasurements
): ProportionDiagnostic {
  const reduceAreas: Array<{ name: string; reason: string; priorityAction: string }> = [];
  const growAreas: Array<{ name: string; reason: string; priorityAction: string }> = [];

  // 1. V-Taper (Omuz / Bel Oranı)
  let vTaper: ProportionDiagnostic['vTaper'] = null;
  if (measurements.shoulderCm > 0 && measurements.waistCm > 0) {
    const ratio = Math.round((measurements.shoulderCm / measurements.waistCm) * 100) / 100;
    if (ratio >= 1.55) {
      vTaper = {
        ratio,
        status: 'ideal',
        title: '🌟 Mükemmel Adonis Altın Oranı (V-Taper)',
        advice: 'Omuz genişliğiniz ile bel inceliğiniz altın orana (1.618) çok yakın! Bu estetik formu korumak için belinizi kalınlaştırmadan omuz hipertrofisini sürdürün.',
      };
    } else if (ratio >= 1.35) {
      vTaper = {
        ratio,
        status: 'good',
        title: '👍 Dengeli Atletik Oran',
        advice: 'Oranınız iyi durumda. V-Taper görünümünü zirveye taşımak için: Beli 2-4 cm inceltin ve Lateral Deltoid (Yan Omuz) ile Sırt (Latissimus) genişletmeye odaklanın.',
      };
    } else {
      vTaper = {
        ratio,
        status: 'needs_work',
        title: '⚠️ Geliştirilmesi Gereken V-Taper (Kare Beden)',
        advice: 'Bel genişliği omuza göre fazla veya omuzlar dar kalmış. Öncelik: Kalori açığı ile bel çevresindeki yağı eritmek ve haftalık 16 set Lateral Raise + Barfiks ile omuz çatısını açmaktır.',
      };
      reduceAreas.push({
        name: 'Bel & Yan Simitler',
        reason: 'Omuz / Bel oranını bozarak bedeni kare ve tıknaz gösteriyor.',
        priorityAction: 'Günlük 500 kcal açık + Mide Vakumu + Şeker/un kesintisi.',
      });
      growAreas.push({
        name: 'Yan Omuz & Kanat (Sırt)',
        reason: 'Gövdeyi yukarıdan genişleterek beli optik olarak anında ince gösterir.',
        priorityAction: 'Kablo Lateral Raise + Geniş Tutuş Lat Pulldown.',
      });
    }
  }

  // 2. Bel / Boy Oranı (WHtR - Visseral Yağlanma Teşhisi)
  let waistToHeight: ProportionDiagnostic['waistToHeight'] = null;
  if (heightCm > 0 && measurements.waistCm > 0) {
    const ratio = Math.round((measurements.waistCm / heightCm) * 100) / 100;
    if (ratio < 0.49) {
      waistToHeight = {
        ratio,
        status: 'healthy',
        title: '✅ Sağlıklı & Estetik Bel Oranı (WHtR < 0.50)',
        advice: 'İç organ yağlanması (visseral yağ) riskiniz minimum seviyede. Kardiyovasküler sağlık ve insülin duyarlılığınız harika durumda.',
      };
    } else if (ratio <= 0.54) {
      waistToHeight = {
        ratio,
        status: 'overweight',
        title: '⚠️ Hafif Bel Kalınlaşması (WHtR: 0.50 - 0.54)',
        advice: 'Bel çevreniz boyunuzun yarısını geçmiş durumda. Karaciğer ve iç organ çevresinde hafif yağlanma başlamış olabilir. Kalori açığı ile 4-6 cm incelme hedeflenmelidir.',
      };
      reduceAreas.push({
        name: 'Bel & Karın Bölgesi',
        reason: 'Bel/Boy oranı eşiği aşılmış, metabolik risk ve göbek belirginliği.',
        priorityAction: 'Günde 8.000+ adım atın, akşam 20:00 sonrası kaloriyi kesin.',
      });
    } else {
      waistToHeight = {
        ratio,
        status: 'risk',
        title: '🚨 Visseral Yağlanma Uyarısı (WHtR > 0.55)',
        advice: 'Bel çevreniz boyunuza göre belirgin derecede yüksek. Bu durum insülin direnci ve tansiyon riskini katlar. Acil olarak yağ yakım protokolü başlatılmalıdır.',
      };
      reduceAreas.push({
        name: 'Alt & Üst Karın (Visseral Yağ)',
        reason: 'Yüksek metabolik risk ve göbek fırlaması.',
        priorityAction: 'Kardiyo + Düşük glisemik indeksli beslenme + Günlük 500 kcal kalori açığı.',
      });
    }
  }

  // 3. Kol Simetrisi (Sağ vs Sol Kol)
  let armSymmetry: ProportionDiagnostic['armSymmetry'] = null;
  if (measurements.upperArmRightCm > 0 && measurements.upperArmLeftCm > 0) {
    const diffCm = Math.round(Math.abs(measurements.upperArmRightCm - measurements.upperArmLeftCm) * 10) / 10;
    const hasAsymmetry = diffCm >= 1.2;
    armSymmetry = {
      diffCm,
      hasAsymmetry,
      advice: hasAsymmetry
        ? `Kollarınız arasında ${diffCm} cm fark var. Bu belirgin bir asimetridir! Çözüm: Halter/bar çalışmalarını bırakıp tek kollu dambıl/kablo hareketlerine geçin. Her sete zayıf olan tarafla başlayın ve dominant kolla sadece zayıf kolun yaptığı kadar tekrar yapın.`
        : `Kollarınız arasındaki fark ${diffCm} cm ile normal ve dengeli aralıkta (1 cm altı doğal kabul edilir).`,
    };
  }

  // 4. Bacak Simetrisi (Sağ vs Sol Uyluk)
  let legSymmetry: ProportionDiagnostic['legSymmetry'] = null;
  if (measurements.thighRightCm > 0 && measurements.thighLeftCm > 0) {
    const diffCm = Math.round(Math.abs(measurements.thighRightCm - measurements.thighLeftCm) * 10) / 10;
    const hasAsymmetry = diffCm >= 1.5;
    legSymmetry = {
      diffCm,
      hasAsymmetry,
      advice: hasAsymmetry
        ? `Bacaklarınız arasında ${diffCm} cm fark var. Çözüm: Çift bacak squat yerine Bulgarian Split Squat ve tek bacak Leg Press ekleyin.`
        : `Bacak simetriniz dengeli (${diffCm} cm fark).`,
    };
  }

  // 5. Kollar İnce mi? (Kol / Boy Oranı)
  const avgArm = (measurements.upperArmLeftCm + measurements.upperArmRightCm) / 2;
  if (avgArm > 0 && heightCm > 0) {
    const armRatio = avgArm / heightCm;
    if (armRatio < 0.19) {
      growAreas.push({
        name: 'Üst Kol (Pazu & Triceps)',
        reason: `Mevcut kol ölçünüz boyunuza göre ince kalmış (oran: ${armRatio.toFixed(2)} < 0.20).`,
        priorityAction: 'Haftada 16 direkt set: Incline Dumbbell Curl + Overhead Triceps Extension.',
      });
    }
  }

  // 6. Baldırlar İnce mi?
  const avgCalf = (measurements.calfLeftCm + measurements.calfRightCm) / 2;
  if (avgCalf > 0 && avgArm > 0) {
    if (avgCalf < avgArm - 2) {
      growAreas.push({
        name: 'Baldır (Kalf)',
        reason: 'Baldırlarınız kollarınıza göre ince kalmış; klasik "tavuk bacak" dengesizliğini önlemek için kalf hipertrofisi şart.',
        priorityAction: 'En altta 2 saniye duraklamalı Ayakta ve Oturarak Kalf Kaldırma (haftada 3 gün).',
      });
    }
  }

  return {
    vTaper,
    waistToHeight,
    armSymmetry,
    legSymmetry,
    priorityActions: {
      reduceAreas,
      growAreas,
    },
  };
}
