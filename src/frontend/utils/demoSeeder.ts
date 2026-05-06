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

export const seedDemoData = async (userId: string) => {
  const batch = writeBatch(db);
  
  // Check if data already exists to avoid duplication
  const mediaRef = collection(db, 'mediaItems');
  const q = query(mediaRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    console.log('Demo data already exists for this user.');
    return;
  }

  console.log('Seeding demo data for user:', userId);

  // 1. Seed Media Items (10 items)
  const mediaItems = [
    { title: 'Inception', type: 'movie', watched: true, rating: '8.8', genre: 'Sci-Fi, Action', image: 'https://image.tmdb.org/t/p/w500/edv5CZvR0rEk49vMNwYKABhwYVa.jpg', myRating: 9, myNote: 'Mind-bending masterpiece.' },
    { title: 'The Dark Knight', type: 'movie', watched: true, rating: '9.0', genre: 'Action, Crime', image: 'https://image.tmdb.org/t/p/w500/qJ2tW6qR7qZ1c9UnreNExdn38n.jpg', myRating: 10, myNote: 'Best Batman movie ever.' },
    { title: 'Breaking Bad', type: 'series', watched: true, rating: '9.5', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/ggfJA9InInS8M6mc9Y691B6AsyW.jpg', myRating: 10, totalSeasons: 5, watchedSeasons: [1,2,3,4,5] },
    { title: 'The Last of Us Part II', type: 'game', watched: true, rating: '9.3', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vcf.png', myRating: 9.5 },
    { title: '1984', type: 'book', watched: true, rating: '8.5', genre: 'Dystopian, Political', author: 'George Orwell', image: 'https://images-na.ssl-images-amazon.com/images/I/71k0s6mE%2BL._AC_UL600_SR600,600_.jpg', myRating: 9 },
    { title: 'Interstellar', type: 'movie', watched: true, rating: '8.7', genre: 'Sci-Fi, Drama', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6EwfVDxCzs25a2pY6vB.jpg', myRating: 9.5 },
    { title: 'God of War Ragnarök', type: 'game', watched: true, rating: '9.4', genre: 'Action, Adventure', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.png', myRating: 10 },
    { title: 'Better Call Saul', type: 'series', watched: false, rating: '9.0', genre: 'Crime, Drama', image: 'https://image.tmdb.org/t/p/w500/fC2SzyUBhMB79Pna98pZzn96pZl.jpg', totalSeasons: 6, currentSeason: 1 },
    { title: 'The Witcher 3', type: 'game', watched: true, rating: '9.7', genre: 'RPG, Action', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1w99.png', myRating: 10 },
    { title: 'Dune', type: 'book', watched: false, rating: '8.3', genre: 'Sci-Fi, Adventure', author: 'Frank Herbert', image: 'https://images-na.ssl-images-amazon.com/images/I/817E7S7uCXL._AC_UL600_SR600,600_.jpg' }
  ];

  mediaItems.forEach(item => {
    const newDocRef = doc(collection(db, 'mediaItems'));
    batch.set(newDocRef, {
      ...item,
      userId,
      description: 'Demo content description for ' + item.title,
      createdAt: serverTimestamp(),
      isFavorite: Math.random() > 0.7
    });
  });

  // 2. Seed Categories
  const expenseCategories = ['Yeme İçme', 'Alışveriş', 'Akaryakıt', 'Araba Harcamaları', 'Ulaşım', 'Fatura', 'Sağlık', 'Eğlence', 'Diğer'];
  expenseCategories.forEach(catName => {
    const catRef = doc(collection(db, 'categories'));
    batch.set(catRef, {
      name: catName,
      userId,
      createdAt: serverTimestamp()
    });
  });

  // 3. Seed Expenses (10 items)
  for (let i = 0; i < 10; i++) {
    const newDocRef = doc(collection(db, 'expenses'));
    batch.set(newDocRef, {
      amount: Math.floor(Math.random() * 1000) + 50,
      category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
      description: 'Demo harcama ' + (i + 1),
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      userId,
      createdAt: serverTimestamp()
    });
  }

  // 4. Seed Vehicles (Hyundai Getz)
  const vehicleRef = doc(collection(db, 'vehicles'));
  batch.set(vehicleRef, {
    brand: 'Hyundai',
    model: 'Getz',
    year: 2007,
    licensePlate: '38ANY590',
    currentKm: 185000,
    purchaseDate: '2023-01-01',
    purchaseKm: 170000,
    lastMaintenanceDate: '2024-02-15',
    lastMaintenanceKm: 182000,
    nextMaintenanceKm: 192000,
    insuranceDate: '2025-01-01',
    inspectionDate: '2025-06-01',
    mtvDate: '2024-07-01',
    tireSummerBrand: 'Michelin',
    tireSummerYear: 2023,
    tireSummerTotalKm: 15000,
    tireWinterTotalKm: 12000,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 5. Seed Planner Meetings (10 items)
  const plannerTypes: Array<'meeting' | 'todo' | 'jira' | 'match'> = ['meeting', 'todo', 'jira'];
  const priorities: Array<'urgent' | 'high' | 'medium' | 'low'> = ['urgent', 'high', 'medium', 'low'];

  for (let i = 0; i < 10; i++) {
    const newDocRef = doc(collection(db, 'meetings'));
    const itemType = plannerTypes[Math.floor(Math.random() * plannerTypes.length)];
    batch.set(newDocRef, {
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

  await batch.commit();
  console.log('Demo data seeded successfully!');
};
