// src/frontend/data/quotes.ts
// Film, dizi, kitap ve oyunlardan ünlü alıntılar

export interface Quote {
    text: string;
    textTr?: string;
    source: string;
    type: 'movie' | 'series' | 'book' | 'game';
    author?: string;
}

export const quotes: Quote[] = [
    // MOVIES
    { text: "May the Force be with you.", textTr: "Güç seninle olsun.", source: "Star Wars", type: "movie" },
    { text: "I'm gonna make him an offer he can't refuse.", textTr: "Ona reddedemeyeceği bir teklif yapacağım.", source: "The Godfather", type: "movie" },
    { text: "Here's looking at you, kid.", textTr: "Şerefine, küçüğüm.", source: "Casablanca", type: "movie" },
    { text: "Why so serious?", textTr: "Neden bu kadar ciddisin?", source: "The Dark Knight", type: "movie" },
    { text: "Life is like a box of chocolates.", textTr: "Hayat bir çikolata kutusu gibidir.", source: "Forrest Gump", type: "movie" },
    { text: "I'll be back.", textTr: "Geri döneceğim.", source: "The Terminator", type: "movie" },
    { text: "You talking to me?", textTr: "Benimle mi konuşuyorsun?", source: "Taxi Driver", type: "movie" },
    { text: "To infinity and beyond!", textTr: "Sonsuzluğa ve ötesine!", source: "Toy Story", type: "movie" },
    { text: "After all this time? Always.", textTr: "Bunca zaman sonra bile mi? Her zaman.", source: "Harry Potter", type: "movie" },
    { text: "Keep your friends close, but your enemies closer.", textTr: "Dostlarını yakın tut, düşmanlarını daha da yakın.", source: "The Godfather II", type: "movie" },
    { text: "With great power comes great responsibility.", textTr: "Büyük güç, büyük sorumluluk getirir.", source: "Spider-Man", type: "movie" },
    { text: "Hope is a good thing, maybe the best of things.", textTr: "Umut iyi bir şeydir, belki de en iyisi.", source: "The Shawshank Redemption", type: "movie" },
    { text: "Do or do not. There is no try.", textTr: "Yap ya da yapma. Denemek diye bir şey yoktur.", source: "Star Wars: Empire Strikes Back", type: "movie" },
    { text: "You can't handle the truth!", textTr: "Sen gerçeklerle yüzleşemezsin!", source: "A Few Good Men", type: "movie" },
    { text: "Just keep swimming.", textTr: "Sadece yüzmeye devam et.", source: "Finding Nemo", type: "movie" },

    // SERIES
    { text: "I am the one who knocks!", textTr: "Ben kapıyı çalan kişiyim!", source: "Breaking Bad", type: "series" },
    { text: "Winter is coming.", textTr: "Kış geliyor.", source: "Game of Thrones", type: "series" },
    { text: "That's what she said.", textTr: "O da öyle söylemişti.", source: "The Office", type: "series" },
    { text: "How you doin'?", textTr: "N'aber?", source: "Friends", type: "series" },
    { text: "I've made a huge mistake.", textTr: "Büyük bir hata yaptım.", source: "Arrested Development", type: "series" },
    { text: "Cool. Cool cool cool.", textTr: "Harika. Harika harika harika.", source: "Community", type: "series" },
    { text: "Say my name.", textTr: "Adımı söyle.", source: "Breaking Bad", type: "series" },
    { text: "Bazinga!", textTr: "Bazinga!", source: "The Big Bang Theory", type: "series" },
    { text: "Everybody lies.", textTr: "Herkes yalan söyler.", source: "House M.D.", type: "series" },
    { text: "We have to go back!", textTr: "Geri dönmeliyiz!", source: "Lost", type: "series" },
    { text: "Surprise, motherf***er!", textTr: "Sürpriz, s*******r!", source: "Dexter", type: "series" },
    { text: "I drink and I know things.", textTr: "İçerim ve bazı şeyler bilirim.", source: "Game of Thrones", type: "series" },
    { text: "Legen... wait for it... dary!", textTr: "Efsane... bekle biraz... vi!", source: "How I Met Your Mother", type: "series" },
    { text: "This is the way.", textTr: "Bu, yoldur.", source: "The Mandalorian", type: "series" },
    { text: "I am inevitable.", textTr: "Ben kaçınılmazım.", source: "Endgame", type: "movie" },

    // BOOKS
    { text: "It is our choices that show what we truly are.", textTr: "Gerçekte kim olduğumuzu gösteren şey seçimlerimizdir.", source: "Harry Potter", type: "book", author: "J.K. Rowling" },
    { text: "Not all those who wander are lost.", textTr: "Gezinen herkes kaybolmuş değildir.", source: "Lord of the Rings", type: "book", author: "J.R.R. Tolkien" },
    { text: "So we beat on, boats against the current.", textTr: "Böylece akıntıya karşı teknelerle ilerliyoruz.", source: "The Great Gatsby", type: "book", author: "F. Scott Fitzgerald" },
    { text: "All animals are equal, but some are more equal than others.", textTr: "Bütün hayvanlar eşittir ama bazıları daha eşittir.", source: "Animal Farm", type: "book", author: "George Orwell" },
    { text: "It was the best of times, it was the worst of times.", textTr: "Zamanların en iyisiydi, zamanların en kötüsüydü.", source: "A Tale of Two Cities", type: "book", author: "Charles Dickens" },
    { text: "Stay gold, Ponyboy. Stay gold.", textTr: "Altın kal, Ponyboy. Altın kal.", source: "The Outsiders", type: "book", author: "S.E. Hinton" },
    { text: "The only way out of the labyrinth of suffering is to forgive.", textTr: "Acı labirentinden çıkmanın tek yolu affetmektir.", source: "Looking for Alaska", type: "book", author: "John Green" },
    { text: "Whatever our souls are made of, his and mine are the same.", textTr: "Ruhlarımız neden yapılmış olursa olsun, onunki ve benimki aynı.", source: "Wuthering Heights", type: "book", author: "Emily Brontë" },
    { text: "It does not do to dwell on dreams and forget to live.", textTr: "Düşlere dalıp yaşamayı unutmak doğru değildir.", source: "Harry Potter", type: "book", author: "J.K. Rowling" },
    { text: "The truth is rarely pure and never simple.", textTr: "Gerçek nadiren saf, asla basit değildir.", source: "The Importance of Being Earnest", type: "book", author: "Oscar Wilde" },

    // GAMES
    { text: "War. War never changes.", textTr: "Savaş. Savaş asla değişmez.", source: "Fallout", type: "game" },
    { text: "It's dangerous to go alone! Take this.", textTr: "Yalnız gitmek tehlikeli! Bunu al.", source: "The Legend of Zelda", type: "game" },
    { text: "The cake is a lie.", textTr: "Pasta bir yalan.", source: "Portal", type: "game" },
    { text: "Would you kindly?", textTr: "Rica etsem?", source: "BioShock", type: "game" },
    { text: "Stay awhile and listen.", textTr: "Biraz kal ve dinle.", source: "Diablo II", type: "game" },
    { text: "I used to be an adventurer like you, then I took an arrow in the knee.", textTr: "Eskiden senin gibi bir maceracıydım, sonra dizime ok yedim.", source: "Skyrim", type: "game" },
    { text: "A man chooses, a slave obeys.", textTr: "İnsan seçer, köle itaat eder.", source: "BioShock", type: "game" },
    { text: "What is better - to be born good, or to overcome your evil nature?", textTr: "Hangisi daha iyi - iyi doğmak mı yoksa kötü doğanı yenmek mi?", source: "Skyrim", type: "game" },
    { text: "Nothing is true, everything is permitted.", textTr: "Hiçbir şey doğru değil, her şeye izin var.", source: "Assassin's Creed", type: "game" },
    { text: "Boy!", textTr: "Evlat!", source: "God of War", type: "game" },
    { text: "Wind's howling.", textTr: "Rüzgar uluyor.", source: "The Witcher 3", type: "game" },
    { text: "Praise the Sun!", textTr: "Güneşi Öv!", source: "Dark Souls", type: "game" },
];

export function getDailyQuote(): Quote {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % quotes.length;
    return quotes[index];
}

export function getRandomQuote(): Quote {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
