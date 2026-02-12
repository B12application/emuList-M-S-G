// src/types/media.ts
import { Timestamp } from 'firebase/firestore';

// Bu, veritabanındaki (DB) tip
export type MediaType = 'movie' | 'series' | 'game' | 'book';

// Bu, filtreleme için kullanılan tip (URL'den gelir)
export type FilterType = MediaType | 'all';

// Bu, izlenme durumu filtresi (URL'den gelir)
export type FilterStatus = 'all' | 'watched' | 'not-watched' | 'in-progress' | 'favorites';

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
  totalSeasons?: number; // Diziler için toplam sezon sayısı
  watchedSeasons?: number[]; // Kullanıcının izlediği sezon numaraları [1, 2, 3]
  releaseDate?: string; // Çıkış tarihi (Film/Dizi: "15 Jul 2022", Oyun: "2022-07-15")
  runtime?: string; // Süre (Film: "120 min", Dizi bölüm süresi: "45 min")
  imdbId?: string; // IMDb ID (Film/Dizi için: "tt1234567")
  watchedEpisodes?: Record<number, number[]>; // { sezon: [izlenen bölüm numaraları] } örn: { 1: [1,2,3], 2: [1,2] }
  episodesPerSeason?: Record<number, number>; // { sezon: toplam bölüm sayısı } örn: { 1: 10, 2: 12 }
  currentSeason?: number; // Kullanıcının şu an izlediği sezon
  currentEpisode?: number; // Kullanıcının kaldığı son bölüm
}