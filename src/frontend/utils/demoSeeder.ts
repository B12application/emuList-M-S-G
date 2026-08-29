import { db } from '../../backend/config/firebaseConfig';
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getTMDBTrending } from '../../backend/services/tmdbApi';
import { searchBooks } from '../../backend/services/googleBooksApi';


// Fallback high-quality static media items in case API calls fail
const FALLBACK_MEDIA_ITEMS = [
  // Movies
  { title: 'Inception', type: 'movie', watched: true, rating: '8.8', genre: 'Sci-Fi, Action', image: 'https://image.tmdb.org/t/p/w500/edv5CZvR0rEk49vMNwYKABhwYVa.jpg', myRating: 9, myNote: 'Zihin bükücü bir başyapıt.' },
  { title: 'The Dark Knight', type: 'movie', watched: true, rating: '9.0', genre: 'Action, Crime', image: 'https://image.tmdb.org/t/p/w500/qJ2tW6qR7qZ1c9UnreNExdn38n.jpg', myRating: 10, myNote: 'En iyi Batman filmi.' },
  { title: 'Interstellar', type: 'movie', watched: true, rating: '8.7', genre: 'Sci-Fi, Drama', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6EwfVDxCzs25a2pY6vB.jpg', myRating: 10, myNote: 'Müzikleri ve görselliği harika.' },
  { title: 'Pulp Fiction', type: 'movie', watched: true, rating: '8.9', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/fIE3lAGcZDVEEG6tMKm0DeRuc2C.jpg', myRating: 9 },
  { title: 'The Matrix', type: 'movie', watched: true, rating: '8.7', genre: 'Sci-Fi, Action', image: 'https://image.tmdb.org/t/p/w500/f89U3w7R2lcBkKW76767fs2R2v9.jpg', myRating: 9.5 },
  { title: 'Fight Club', type: 'movie', watched: true, rating: '8.8', genre: 'Drama', image: 'https://image.tmdb.org/t/p/w500/pB8LI7RNLww27e2ld30r9d7z8tM.jpg', myRating: 9 },
  { title: 'Goodfellas', type: 'movie', watched: true, rating: '8.7', genre: 'Biography, Crime', image: 'https://image.tmdb.org/t/p/w500/aKuFiU8tCl752HSV3w3J2IC46Sv.jpg', myRating: 9.5 },
  { title: 'Whiplash', type: 'movie', watched: true, rating: '8.5', genre: 'Drama, Music', image: 'https://image.tmdb.org/t/p/w500/lIv1wPVI7Z0o27o8OWt6w2vKVEw.jpg', myRating: 10 },
  { title: 'Gladiator', type: 'movie', watched: true, rating: '8.5', genre: 'Action, Adventure', image: 'https://image.tmdb.org/t/p/w500/ty8hC421g0arQIkl6j27Z2Pvj7c.jpg', myRating: 9 },
  { title: 'Se7en', type: 'movie', watched: true, rating: '8.6', genre: 'Crime, Mystery', image: 'https://image.tmdb.org/t/p/w500/69EF686qZKe76W6VeSp4C77Y4r5.jpg', myRating: 9 },
  { title: 'The Prestige', type: 'movie', watched: true, rating: '8.5', genre: 'Drama, Mystery', image: 'https://image.tmdb.org/t/p/w500/bdN3ggrW4bj25QO7615025ZJ765.jpg', myRating: 9 },
  { title: 'Parasite', type: 'movie', watched: true, rating: '8.5', genre: 'Drama, Thriller', image: 'https://image.tmdb.org/t/p/w500/7IiTTvvItem7wSvVc211fs9KgJ.jpg', myRating: 9 },
  { title: 'The Godfather', type: 'movie', watched: true, rating: '9.2', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/3bhkrj6UgS6N4xy61SAEBX69Gbc.jpg', myRating: 10 },

  // Series
  { title: 'Breaking Bad', type: 'series', watched: true, rating: '9.5', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/ggfJA9InInS8M6mc9Y691B6AsyW.jpg', myRating: 10, totalSeasons: 5, watchedSeasons: [1, 2, 3, 4, 5], myNote: 'Tarihin en iyi dizisi.' },
  { title: 'Succession', type: 'series', watched: true, rating: '8.9', genre: 'Drama', image: 'https://image.tmdb.org/t/p/w500/749z1w56v4y176515v4176v.jpg', myRating: 9.5, totalSeasons: 4, watchedSeasons: [1, 2, 3, 4] },
  { title: 'Better Call Saul', type: 'series', watched: true, rating: '9.0', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/fC2SzyUBhMB79Pna98pZzn96pZl.jpg', myRating: 9.5, totalSeasons: 6, watchedSeasons: [1, 2, 3, 4, 5, 6] },
  { title: 'Game of Thrones', type: 'series', watched: true, rating: '9.2', genre: 'Action, Adventure', image: 'https://image.tmdb.org/t/p/w500/1XS5jNBDjTT8V11H7rIV6q54i4K.jpg', myRating: 9, totalSeasons: 8, watchedSeasons: [1, 2, 3, 4, 5, 6, 7, 8] },
  { title: 'Chernobyl', type: 'series', watched: true, rating: '9.3', genre: 'Drama, History', image: 'https://image.tmdb.org/t/p/w500/hlLXt2t76zxig5OfQAiigng61rB.jpg', myRating: 10 },
  { title: 'True Detective', type: 'series', watched: true, rating: '8.9', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/o72TFW5v84j8gK5oZ7j1zM6954v.jpg', myRating: 9.5, totalSeasons: 4, watchedSeasons: [1] },
  { title: 'The Office', type: 'series', watched: true, rating: '9.0', genre: 'Comedy', image: 'https://image.tmdb.org/t/p/w500/dgN4y1765y176v.jpg', myRating: 10, totalSeasons: 9, watchedSeasons: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { title: 'Fargo', type: 'series', watched: true, rating: '8.9', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/749v1w56v4y1765v.jpg', myRating: 9, totalSeasons: 5, watchedSeasons: [1, 2, 3] },
  { title: 'Mindhunter', type: 'series', watched: true, rating: '8.6', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/pk9754v176v.jpg', myRating: 9, totalSeasons: 2, watchedSeasons: [1, 2] },
  { title: 'Dark', type: 'series', watched: true, rating: '8.7', genre: 'Sci-Fi, Mystery', image: 'https://image.tmdb.org/t/p/w500/apGV47v176v.jpg', myRating: 9.5, totalSeasons: 3, watchedSeasons: [1, 2, 3] },
  { title: 'Severance', type: 'series', watched: false, rating: '8.7', genre: 'Sci-Fi, Thriller', image: 'https://image.tmdb.org/t/p/w500/749v1y176v.jpg', totalSeasons: 1, currentSeason: 1 },
  { title: 'The Last of Us', type: 'series', watched: true, rating: '8.8', genre: 'Action, Adventure', image: 'https://image.tmdb.org/t/p/w500/uKV1wP1HS2u15v157v.jpg', myRating: 9, totalSeasons: 1, watchedSeasons: [1] },

  // Games
  { title: 'The Witcher 3: Wild Hunt', type: 'game', watched: true, rating: '9.7', genre: 'RPG, Action', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1w99.png', myRating: 10 },
  { title: 'Red Dead Redemption 2', type: 'game', watched: true, rating: '9.8', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7h.png', myRating: 10, myNote: 'Harika bir açık dünya oyunu.' },
  { title: 'Elden Ring', type: 'game', watched: true, rating: '9.6', genre: 'RPG, Action', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4j84.png', myRating: 9.5 },
  { title: 'God of War Ragnarök', type: 'game', watched: true, rating: '9.4', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.png', myRating: 10 },
  { title: 'The Last of Us Part I', type: 'game', watched: true, rating: '9.5', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5t5v.png', myRating: 9.5 },
  { title: 'Grand Theft Auto V', type: 'game', watched: true, rating: '9.2', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r4h.png', myRating: 9 },
  { title: 'Baldur\'s Gate 3', type: 'game', watched: true, rating: '9.6', genre: 'RPG, Strategy', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co678r.png', myRating: 10 },
  { title: 'Hades', type: 'game', watched: true, rating: '9.0', genre: 'Action, Roguelike', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.png', myRating: 9 },
  { title: 'Zelda: Breath of the Wild', type: 'game', watched: true, rating: '9.6', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co315d.png', myRating: 9.5 },
  { title: 'Cyberpunk 2077', type: 'game', watched: true, rating: '8.5', genre: 'RPG, Sci-Fi', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2q85.png', myRating: 8.5 },
  { title: 'Ghost of Tsushima', type: 'game', watched: true, rating: '9.2', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co278r.png', myRating: 9 },
  { title: 'Portal 2', type: 'game', watched: true, rating: '9.8', genre: 'Puzzle, Sci-Fi', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r5d.png', myRating: 10 },

  // Books
  { title: '1984', type: 'book', watched: true, rating: '8.8', genre: 'Dystopian, Political', author: 'George Orwell', image: 'https://images-na.ssl-images-amazon.com/images/I/71k0s6mE%2BL._AC_UL600_SR600,600_.jpg', myRating: 9 },
  { title: 'Dune', type: 'book', watched: true, rating: '8.5', genre: 'Sci-Fi, Adventure', author: 'Frank Herbert', image: 'https://images-na.ssl-images-amazon.com/images/I/817E7S7uCXL._AC_UL600_SR600,600_.jpg', myRating: 9.5 },
  { title: 'Sapiens', type: 'book', watched: true, rating: '8.7', genre: 'History, Anthropology', author: 'Yuval Noah Harari', image: 'https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL._AC_UL600_SR600,600_.jpg', myRating: 9 },
  { title: 'Harry Potter ve Felsefe Taşı', type: 'book', watched: true, rating: '8.9', genre: 'Fantasy', author: 'J.K. Rowling', image: 'https://images-na.ssl-images-amazon.com/images/I/71s1A5rJ6OL._AC_UL600_SR600,600_.jpg', myRating: 9 },
  { title: 'Yüzüklerin Efendisi: Yüzük Kardeşliği', type: 'book', watched: true, rating: '9.2', genre: 'Fantasy', author: 'J.R.R. Tolkien', image: 'https://images-na.ssl-images-amazon.com/images/I/81gepf1eMqL._AC_UL600_SR600,600_.jpg', myRating: 10 },
  { title: 'Cesur Yeni Dünya', type: 'book', watched: true, rating: '8.4', genre: 'Dystopian', author: 'Aldous Huxley', image: 'https://images-na.ssl-images-amazon.com/images/I/81fH5vJ0v8L._AC_UL600_SR600,600_.jpg', myRating: 8.5 },
  { title: 'Kürk Mantolu Madonna', type: 'book', watched: true, rating: '8.6', genre: 'Roman, Klasik', author: 'Sabahattin Ali', image: 'https://images-na.ssl-images-amazon.com/images/I/81vJ9+l4N3L._AC_UL600_SR600,600_.jpg', myRating: 9 },
  { title: 'Suç ve Ceza', type: 'book', watched: true, rating: '9.0', genre: 'Klasik', author: 'Fyodor Dostoyevski', image: 'https://images-na.ssl-images-amazon.com/images/I/71uK5G9Kx7L._AC_UL600_SR600,600_.jpg', myRating: 9.5 },
  { title: 'Şeker Portakalı', type: 'book', watched: true, rating: '8.8', genre: 'Roman', author: 'Jose Mauro de Vasconcelos', image: 'https://images-na.ssl-images-amazon.com/images/I/71KkL8P3BGL._AC_UL600_SR600,600_.jpg', myRating: 9 },
  { title: 'Simyacı', type: 'book', watched: true, rating: '8.2', genre: 'Roman, Felsefe', author: 'Paulo Coelho', image: 'https://images-na.ssl-images-amazon.com/images/I/61HAE8ZGP8L._AC_UL600_SR600,600_.jpg', myRating: 8 },
  { title: 'Hayvan Çiftliği', type: 'book', watched: true, rating: '8.7', genre: 'Dystopian, Satire', author: 'George Orwell', image: 'https://images-na.ssl-images-amazon.com/images/I/71wdbKiNHDL._AC_UL600_SR600,600_.jpg', myRating: 9.5 },
  { title: 'Karakalem', type: 'book', watched: false, rating: '7.8', genre: 'Mitoloji, Kurgu', author: 'İpek Gökdel', image: 'https://images-na.ssl-images-amazon.com/images/I/81E1w3Qp1oL._AC_UL600_SR600,600_.jpg' },
  { title: 'Kozmos', type: 'book', watched: true, rating: '9.3', genre: 'Popüler Bilim', author: 'Carl Sagan', image: 'https://images-na.ssl-images-amazon.com/images/I/81X4fXWn6FL._AC_UL600_SR600,600_.jpg', myRating: 10 }
];

export const seedDemoData = async (userId: string) => {
  console.log('Clearing old demo data for user:', userId);

  // Helper function to delete old documents of a collection for this user
  const clearCollectionForUser = async (collName: string) => {
    const q = query(collection(db, collName), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const deleteBatch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
    }
  };

  // Clear existing documents to avoid duplicate seed issues
  await clearCollectionForUser('mediaItems');
  await clearCollectionForUser('expenses');
  await clearCollectionForUser('categories');
  await clearCollectionForUser('meetings');
  await clearCollectionForUser('vehicles');

  console.log('Seeding fresh demo data with 50 media items & 150 transactions across 5 months...');

  const finalMediaItems: any[] = [];

  // Try fetching real API data for movies and series from TMDB first
  try {
    const movieTrend = await getTMDBTrending('movie', 'week', 'en-US');
    const seriesTrend = await getTMDBTrending('series', 'week', 'en-US');

    // Load first 15 movies
    movieTrend.slice(0, 15).forEach((m) => {
      finalMediaItems.push({
        title: m.title || m.original_title || 'Untitled Movie',
        type: 'movie',
        watched: Math.random() > 0.3,
        rating: m.vote_average ? m.vote_average.toFixed(1) : '7.5',
        genre: 'Action, Sci-Fi', // TMDB only provides IDs here, so a generic genre
        image: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://image.tmdb.org/t/p/w500/edv5CZvR0rEk49vMNwYKABhwYVa.jpg',
        myRating: Math.floor(Math.random() * 4) + 7,
        myNote: 'Harika bir yapım, kesinlikle tavsiye ederim.'
      });
    });

    // Load first 15 series
    seriesTrend.slice(0, 15).forEach((s) => {
      finalMediaItems.push({
        title: s.name || s.original_name || 'Untitled Series',
        type: 'series',
        watched: Math.random() > 0.4,
        rating: s.vote_average ? s.vote_average.toFixed(1) : '8.0',
        genre: 'Drama, Mystery',
        image: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : 'https://image.tmdb.org/t/p/w500/ggfJA9InInS8M6mc9Y691B6AsyW.jpg',
        myRating: Math.floor(Math.random() * 3) + 8,
        totalSeasons: Math.floor(Math.random() * 4) + 2,
        watchedSeasons: [1, 2],
        myNote: 'Sezon kurgusu ve oyuncuları olağanüstü.'
      });
    });
  } catch (error) {
    console.warn('Could not fetch movies/series from TMDB, using static fallback:', error);
  }

  // Try fetching books from Google Books
  try {
    const bookList = await searchBooks('Dune');
    bookList.slice(0, 10).forEach((b) => {
      finalMediaItems.push({
        title: b.volumeInfo.title || 'Untitled Book',
        type: 'book',
        watched: Math.random() > 0.3,
        rating: b.volumeInfo.averageRating ? (b.volumeInfo.averageRating * 2).toFixed(1) : '8.2',
        genre: b.volumeInfo.categories ? b.volumeInfo.categories.join(', ') : 'Literature',
        author: b.volumeInfo.authors ? b.volumeInfo.authors.join(' & ') : 'Unknown Author',
        image: b.volumeInfo.imageLinks?.thumbnail || 'https://images-na.ssl-images-amazon.com/images/I/817E7S7uCXL._AC_UL600_SR600,600_.jpg',
        myRating: Math.floor(Math.random() * 4) + 7
      });
    });
  } catch (error) {
    console.warn('Could not fetch books from Google Books, using static fallback:', error);
  }

  // Complement or fallback to static items if total is under 50 items
  const neededFallbackCount = 50 - finalMediaItems.length;
  if (neededFallbackCount > 0) {
    // Fill the rest with fallback items that have high quality image URLs
    const slice = FALLBACK_MEDIA_ITEMS.slice(0, neededFallbackCount);
    finalMediaItems.push(...slice);
  }

  // Enforce exactly 50 items (or slice down to 50 if somehow exceeded)
  const final50Media = finalMediaItems.slice(0, 50);

  // Write Batch 1: Media Items & Categories
  const batch1 = writeBatch(db);

  // 1. Write 50 Media Items
  final50Media.forEach(item => {
    const newDocRef = doc(collection(db, 'mediaItems'));
    batch1.set(newDocRef, {
      ...item,
      userId,
      description: item.myNote || ('Demo content description for ' + item.title),
      createdAt: serverTimestamp(),
      isFavorite: Math.random() > 0.8
    });
  });

  // 2. Write 15 Categories
  const expenseCategories = [
    'Yeme İçme', 
    'Market & Alışveriş', 
    'Akaryakıt & Yol', 
    'Araç Giderleri', 
    'Kira & Ev', 
    'Faturalar', 
    'Sağlık & İlaç', 
    'Eğlence & Sosyal', 
    'Giyim & Bakım', 
    'Eğitim & Kitaplar', 
    'Seyahat & Tatil', 
    'Teknoloji & Elektronik', 
    'Hediye & Borç', 
    'Taksit Ödemeleri', 
    'Diğer Gelirler'
  ];

  expenseCategories.forEach(catName => {
    const catRef = doc(collection(db, 'categories'));
    batch1.set(catRef, {
      name: catName,
      userId,
      createdAt: serverTimestamp()
    });
  });

  // Write batch1 first
  await batch1.commit();

  // Write Batch 2 & 3: 150 Expenses spread across 5 months
  // Firestore batches have a limit of 500 writes, so 150 is easily written in batch2.
  const batch2 = writeBatch(db);

  // Let's create transactions for the last 5 months
  // We want approximately 30 transactions per month (Total 150)
  const today = new Date();
  
  // A helper to generate random date in a given month index (0 to 4 months ago)
  const getRandomDateForMonth = (monthsAgo: number) => {
    const d = new Date();
    d.setMonth(today.getMonth() - monthsAgo);
    // Random day in the month
    const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = Math.floor(Math.random() * maxDays) + 1;
    d.setDate(day);
    return d.toISOString().split('T')[0];
  };

  // We want to generate 150 items.
  // 5 Months, let's say 30 items per month.
  let transactionCounter = 0;

  for (let m = 0; m < 5; m++) {
    // 1. Seed 1 large income (Maaş) at the start of each month to keep the user's cashflow realistic
    const incomeRef = doc(collection(db, 'expenses'));
    const monthDate = new Date();
    monthDate.setMonth(today.getMonth() - m);
    monthDate.setDate(1); // 1st of month
    
    batch2.set(incomeRef, {
      amount: Math.floor(Math.random() * 20000) + 65000, // 65,000 to 85,000 TL
      category: 'Diğer Gelirler',
      description: `${monthDate.toLocaleString('tr-TR', { month: 'long' })} Maaş Ödemesi`,
      date: monthDate.toISOString().split('T')[0],
      type: 'income',
      userId,
      createdAt: serverTimestamp()
    });
    transactionCounter++;

    // 2. Seed 1 major Rent (Kira) payment
    const rentRef = doc(collection(db, 'expenses'));
    batch2.set(rentRef, {
      amount: Math.floor(Math.random() * 5000) + 18000, // 18,000 to 23,000 TL
      category: 'Kira & Ev',
      description: 'Kira Ödemesi',
      date: monthDate.toISOString().split('T')[0],
      type: 'expense',
      userId,
      createdAt: serverTimestamp()
    });
    transactionCounter++;

    // 3. Seed 1 fixed bill (Fatura)
    const billRef = doc(collection(db, 'expenses'));
    batch2.set(billRef, {
      amount: Math.floor(Math.random() * 800) + 1200, // 1,200 to 2,000 TL
      category: 'Faturalar',
      description: 'Elektrik, Su ve İnternet Faturaları',
      date: getRandomDateForMonth(m),
      type: 'expense',
      userId,
      createdAt: serverTimestamp()
    });
    transactionCounter++;

    // 4. Seed 1 fixed Loan installment
    const loanRef = doc(collection(db, 'expenses'));
    batch2.set(loanRef, {
      amount: Math.floor(Math.random() * 2000) + 3000, // 3,000 to 5,000 TL
      category: 'Taksit Ödemeleri',
      description: 'Kredi Kartı Taksiti (Elektronik)',
      date: getRandomDateForMonth(m),
      type: 'expense',
      userId,
      createdAt: serverTimestamp()
    });
    transactionCounter++;

    // 5. Seed 26 other random expenses for this month to reach ~30 total per month
    for (let r = 0; r < 26; r++) {
      const expRef = doc(collection(db, 'expenses'));
      const cat = expenseCategories[Math.floor(Math.random() * (expenseCategories.length - 2))]; // skip Gelirler
      
      let amt = Math.floor(Math.random() * 300) + 50; // default minor expense
      let desc = 'Market Alışverişi';

      if (cat === 'Akaryakıt & Yol') {
        amt = Math.floor(Math.random() * 1200) + 800; // 800 - 2000 TL
        desc = 'Opet Akaryakıt Alımı';
      } else if (cat === 'Yeme İçme') {
        amt = Math.floor(Math.random() * 600) + 150; // 150 - 750 TL
        desc = 'Akşam Yemeği & Kahve';
      } else if (cat === 'Eğlence & Sosyal') {
        amt = Math.floor(Math.random() * 1500) + 400; // 400 - 1900 TL
        desc = 'Sinema & Konser Biletleri';
      } else if (cat === 'Teknoloji & Elektronik') {
        amt = Math.floor(Math.random() * 4000) + 1000; // 1000 - 5000 TL
        desc = 'Teknolojik Ekipman / Aksesuar';
      } else if (cat === 'Araç Giderleri') {
        amt = Math.floor(Math.random() * 1500) + 500;
        desc = 'Araç Yıkama & Otoyol Geçişleri';
      } else if (cat === 'Seyahat & Tatil') {
        amt = Math.floor(Math.random() * 6000) + 2000;
        desc = 'Otel Rezervasyonu / Uçak Bileti';
      } else if (cat === 'Giyim & Bakım') {
        amt = Math.floor(Math.random() * 2000) + 400;
        desc = 'Mevsimlik Kıyafet Alımı';
      }

      batch2.set(expRef, {
        amount: amt,
        category: cat,
        description: desc,
        date: getRandomDateForMonth(m),
        type: 'expense',
        userId,
        createdAt: serverTimestamp()
      });
      transactionCounter++;
    }
  }

  // 3. Seed Vehicles (Generic Premium Car)
  const vehicleRef = doc(collection(db, 'vehicles'));
  batch2.set(vehicleRef, {
    brand: 'Premium Car',
    model: 'GT Sport',
    year: 2024,
    engine: '2.0 Turbo',
    transmission: 'Otomatik',
    fuelType: 'Benzin',
    licensePlate: '34 DEMO 01',
    currentKm: 15450,
    purchaseDate: '2024-01-01',
    purchaseKm: 10000,
    lastMaintenanceDate: '2025-01-15',
    lastMaintenanceKm: 14500,
    nextMaintenanceKm: 25000,
    insuranceDate: '2026-09-01',
    inspectionDate: '2026-10-01',
    mtvDate: '2025-07-01',
    tireSummerBrand: 'Pirelli',
    tireSummerYear: 2024,
    tireSummerTotalKm: 10000,
    tireWinterTotalKm: 5450,
    imageUrl1: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    imageUrl2: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 4. Seed Planner Meetings (15 items)
  const plannerTypes: Array<'meeting' | 'todo' | 'jira' | 'match'> = ['meeting', 'todo', 'jira'];
  const priorities: Array<'urgent' | 'high' | 'medium' | 'low'> = ['urgent', 'high', 'medium', 'low'];

  for (let i = 0; i < 15; i++) {
    const newDocRef = doc(collection(db, 'meetings'));
    const itemType = plannerTypes[Math.floor(Math.random() * plannerTypes.length)];
    batch2.set(newDocRef, {
      title: `Demo ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${i + 1}`,
      description: `This is a demo ${itemType} for exploration.`,
      date: new Date(Date.now() + (Math.random() * 14 - 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      itemType,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: Math.random() > 0.5 ? 'done' : 'todo',
      isCompleted: Math.random() > 0.5,
      userId,
      createdAt: serverTimestamp()
    });
  }

  // Commit batch2
  await batch2.commit();

  console.log(`Demo data seeded successfully. Seeded exactly 50 media items, 15 categories, and ${transactionCounter} expenses across 5 months.`);
};
