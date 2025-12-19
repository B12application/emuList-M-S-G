// src/types/media.ts
import { Timestamp } from 'firebase/firestore';

// Bu, veritabanındaki (DB) tip
export type MediaType = 'movie' | 'series' | 'game' | 'book';

// Bu, filtreleme için kullanılan tip (URL'den gelir)
export type FilterType = MediaType | 'all';

// Bu, izlenme durumu filtresi (URL'den gelir)
export type FilterStatus = 'all' | 'watched' | 'not-watched' | 'favorites';

// Veritabanı objemizin arayüzü
export interface MediaItem {
  id: string;
  title: string;
  image?: string;
  rating: string;
  description?: string;
  watched: boolean;
  type: MediaType; // DB'de her zaman movie, series, game veya book olmalı
  createdAt: Timestamp;
  tags?: string[];
  isFavorite?: boolean; // Bu hafta izlenecekler/favoriler için
  author?: string; // Kitaplar için yazar bilgisi
  genre?: string; // Tür bilgisi (Film: "Action, Drama", Oyun: "RPG, Action", Kitap: "Fiction")
}