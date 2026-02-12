// src/services/omdbApi.ts

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = 'https://www.omdbapi.com';
const POSTER_URL = 'https://img.omdbapi.com';

// OMDb API Response Types
export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDbSearchResponse {
  Search?: OMDbSearchResult[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export interface OMDbMovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: 'True' | 'False';
  Error?: string;
  totalSeasons?: string; // Diziler için toplam sezon sayısı
}

/**
 * Film/Dizi arama yapar
 * @param query Arama terimi
 * @param type 'movie' veya 'series' (opsiyonel)
 * @returns Arama sonuçları
 */
export async function searchMovies(
  query: string,
  type?: 'movie' | 'series'
): Promise<OMDbSearchResult[]> {
  if (!API_KEY) {
    throw new Error('OMDb API key bulunamadı. Lütfen .env.local dosyasını kontrol edin.');
  }

  if (!query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    s: query.trim(),
    r: 'json',
  });

  if (type) {
    params.append('type', type);
  }

  try {
    const response = await fetch(`${BASE_URL}/?${params.toString()}`);
    const data: OMDbSearchResponse = await response.json();

    if (data.Response === 'False') {
      if (data.Error?.toLowerCase().includes('not found')) {
        return [];
      }
      throw new Error(data.Error || 'Arama sırasında bir hata oluştu');
    }

    return data.Search || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Arama yapılırken bir hata oluştu');
  }
}

/**
 * IMDb ID'ye göre film/dizi detaylarını getirir
 * @param imdbId IMDb ID (örn: tt1285016)
 * @returns Film/Dizi detayları
 */
export async function getMovieById(imdbId: string): Promise<OMDbMovieDetails> {
  if (!API_KEY) {
    throw new Error('OMDb API key bulunamadı. Lütfen .env.local dosyasını kontrol edin.');
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    i: imdbId,
    plot: 'full',
    r: 'json',
  });

  try {
    const response = await fetch(`${BASE_URL}/?${params.toString()}`);
    const data: OMDbMovieDetails = await response.json();

    if (data.Response === 'False') {
      throw new Error(data.Error || 'Film bulunamadı');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Film detayları getirilirken bir hata oluştu');
  }
}

/**
 * Başlığa göre film/dizi detaylarını getirir
 * @param title Film/Dizi başlığı
 * @param type 'movie' veya 'series' (opsiyonel)
 * @param year Yıl (opsiyonel)
 * @returns Film/Dizi detayları
 */
export async function getMovieByTitle(
  title: string,
  type?: 'movie' | 'series',
  year?: string
): Promise<OMDbMovieDetails> {
  if (!API_KEY) {
    throw new Error('OMDb API key bulunamadı. Lütfen .env.local dosyasını kontrol edin.');
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    t: title.trim(),
    plot: 'full',
    r: 'json',
  });

  if (type) {
    params.append('type', type);
  }

  if (year) {
    params.append('y', year);
  }

  try {
    const response = await fetch(`${BASE_URL}/?${params.toString()}`);
    const data: OMDbMovieDetails = await response.json();

    if (data.Response === 'False') {
      throw new Error(data.Error || 'Film bulunamadı');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Film detayları getirilirken bir hata oluştu');
  }
}

// OMDb Episode Types
export interface OMDbEpisode {
  Title: string;
  Released: string;
  Episode: string;
  imdbRating: string;
  imdbID: string;
}

export interface OMDbSeasonResponse {
  Title: string;
  Season: string;
  totalSeasons: string;
  Episodes: OMDbEpisode[];
  Response: 'True' | 'False';
  Error?: string;
}

/**
 * Bir sezonun tüm bölümlerini getirir
 * @param imdbId Dizinin IMDb ID'si
 * @param season Sezon numarası
 * @returns Bölüm listesi
 */
export async function getSeasonEpisodes(
  imdbId: string,
  season: number
): Promise<OMDbEpisode[]> {
  if (!API_KEY) {
    throw new Error('OMDb API key bulunamadı.');
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    i: imdbId,
    Season: season.toString(),
    r: 'json',
  });

  try {
    const response = await fetch(`${BASE_URL}/?${params.toString()}`);
    const data: OMDbSeasonResponse = await response.json();

    if (data.Response === 'False') {
      console.warn(`Sezon ${season} bölümleri bulunamadı:`, data.Error);
      return [];
    }

    return data.Episodes || [];
  } catch (error) {
    console.error(`Sezon ${season} bölümleri çekilemedi:`, error);
    return [];
  }
}

/**
 * Tüm sezonların bölüm sayısını getirir
 * @param imdbId Dizinin IMDb ID'si
 * @param totalSeasons Toplam sezon sayısı
 * @returns Her sezon için bölüm sayısı
 */
export async function getAllSeriesEpisodeCounts(
  imdbId: string,
  totalSeasons: number
): Promise<Record<number, number>> {
  const episodesPerSeason: Record<number, number> = {};

  for (let season = 1; season <= totalSeasons; season++) {
    const episodes = await getSeasonEpisodes(imdbId, season);
    episodesPerSeason[season] = episodes.length;
    // API rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return episodesPerSeason;
}

/**
 * IMDb rating'ini 0-9.9 arasına normalize eder
 * @param imdbRating IMDb rating (örn: "8.5/10" veya "8.5")
 * @returns 0-9.9 arası rating
 */
export function normalizeRating(imdbRating: string): string {
  if (!imdbRating) return '0';

  // "8.5/10" formatından sadece sayıyı al
  const match = imdbRating.match(/^(\d+\.?\d*)/);
  if (!match) return '0';

  const rating = parseFloat(match[1]);

  // 0-10 arası olmalı, 9.9'a sınırla
  if (rating > 9.9) return '9.9';
  if (rating < 0) return '0';

  return rating.toFixed(1);
}

/**
 * Poster URL'ini oluşturur (Poster API kullanarak)
 * @param imdbId IMDb ID
 * @returns Poster URL'i
 */
export function getPosterUrl(imdbId: string): string {
  if (!API_KEY) {
    return '';
  }
  return `${POSTER_URL}/?apikey=${API_KEY}&i=${imdbId}`;
}

