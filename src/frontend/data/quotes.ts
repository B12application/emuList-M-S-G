// src/frontend/data/quotes.ts
// Film, dizi, kitap ve oyunlardan ünlü alıntılar

export interface Quote {
    text: string;
    source: string;
    type: 'movie' | 'series' | 'book' | 'game';
    author?: string;
}

export const quotes: Quote[] = [
    // MOVIES
    { text: "May the Force be with you.", source: "Star Wars", type: "movie" },
    { text: "I'm gonna make him an offer he can't refuse.", source: "The Godfather", type: "movie" },
    { text: "Here's looking at you, kid.", source: "Casablanca", type: "movie" },
    { text: "Why so serious?", source: "The Dark Knight", type: "movie" },
    { text: "Life is like a box of chocolates.", source: "Forrest Gump", type: "movie" },
    { text: "I'll be back.", source: "The Terminator", type: "movie" },
    { text: "You talking to me?", source: "Taxi Driver", type: "movie" },
    { text: "To infinity and beyond!", source: "Toy Story", type: "movie" },
    { text: "After all this time? Always.", source: "Harry Potter", type: "movie" },
    { text: "Keep your friends close, but your enemies closer.", source: "The Godfather II", type: "movie" },
    { text: "With great power comes great responsibility.", source: "Spider-Man", type: "movie" },
    { text: "Hope is a good thing, maybe the best of things.", source: "The Shawshank Redemption", type: "movie" },
    { text: "Do or do not. There is no try.", source: "Star Wars: Empire Strikes Back", type: "movie" },
    { text: "You can't handle the truth!", source: "A Few Good Men", type: "movie" },
    { text: "Just keep swimming.", source: "Finding Nemo", type: "movie" },

    // SERIES
    { text: "I am the one who knocks!", source: "Breaking Bad", type: "series" },
    { text: "Winter is coming.", source: "Game of Thrones", type: "series" },
    { text: "That's what she said.", source: "The Office", type: "series" },
    { text: "How you doin'?", source: "Friends", type: "series" },
    { text: "I've made a huge mistake.", source: "Arrested Development", type: "series" },
    { text: "Cool. Cool cool cool.", source: "Community", type: "series" },
    { text: "Say my name.", source: "Breaking Bad", type: "series" },
    { text: "Bazinga!", source: "The Big Bang Theory", type: "series" },
    { text: "Everybody lies.", source: "House M.D.", type: "series" },
    { text: "We have to go back!", source: "Lost", type: "series" },
    { text: "Surprise, motherf***er!", source: "Dexter", type: "series" },
    { text: "I drink and I know things.", source: "Game of Thrones", type: "series" },
    { text: "Legen... wait for it... dary!", source: "How I Met Your Mother", type: "series" },
    { text: "This is the way.", source: "The Mandalorian", type: "series" },
    { text: "I am inevitable.", source: "Endgame", type: "movie" },

    // BOOKS
    { text: "It is our choices that show what we truly are.", source: "Harry Potter", type: "book", author: "J.K. Rowling" },
    { text: "Not all those who wander are lost.", source: "Lord of the Rings", type: "book", author: "J.R.R. Tolkien" },
    { text: "So we beat on, boats against the current.", source: "The Great Gatsby", type: "book", author: "F. Scott Fitzgerald" },
    { text: "All animals are equal, but some are more equal than others.", source: "Animal Farm", type: "book", author: "George Orwell" },
    { text: "It was the best of times, it was the worst of times.", source: "A Tale of Two Cities", type: "book", author: "Charles Dickens" },
    { text: "Stay gold, Ponyboy. Stay gold.", source: "The Outsiders", type: "book", author: "S.E. Hinton" },
    { text: "The only way out of the labyrinth of suffering is to forgive.", source: "Looking for Alaska", type: "book", author: "John Green" },
    { text: "Whatever our souls are made of, his and mine are the same.", source: "Wuthering Heights", type: "book", author: "Emily Brontë" },
    { text: "It does not do to dwell on dreams and forget to live.", source: "Harry Potter", type: "book", author: "J.K. Rowling" },
    { text: "The truth is rarely pure and never simple.", source: "The Importance of Being Earnest", type: "book", author: "Oscar Wilde" },

    // GAMES
    { text: "War. War never changes.", source: "Fallout", type: "game" },
    { text: "It's dangerous to go alone! Take this.", source: "The Legend of Zelda", type: "game" },
    { text: "The cake is a lie.", source: "Portal", type: "game" },
    { text: "Would you kindly?", source: "BioShock", type: "game" },
    { text: "Stay awhile and listen.", source: "Diablo II", type: "game" },
    { text: "I used to be an adventurer like you, then I took an arrow in the knee.", source: "Skyrim", type: "game" },
    { text: "A man chooses, a slave obeys.", source: "BioShock", type: "game" },
    { text: "What is better - to be born good, or to overcome your evil nature?", source: "Skyrim", type: "game" },
    { text: "Nothing is true, everything is permitted.", source: "Assassin's Creed", type: "game" },
    { text: "Boy!", source: "God of War", type: "game" },
    { text: "Wind's howling.", source: "The Witcher 3", type: "game" },
    { text: "Praise the Sun!", source: "Dark Souls", type: "game" },
];

// Günün quote'unu al (günlük değişir)
export function getDailyQuote(): Quote {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % quotes.length;
    return quotes[index];
}

// Rastgele quote al
export function getRandomQuote(): Quote {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
