// src/services/googleBooksApi.ts

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Google Books API Response Types
export interface GoogleBooksSearchResult {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        publishedDate?: string;
        description?: string;
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };
        averageRating?: number;
        ratingsCount?: number;
        pageCount?: number;
        categories?: string[];
        language?: string;
    };
}

export interface GoogleBooksSearchResponse {
    kind: string;
    totalItems: number;
    items?: GoogleBooksSearchResult[];
}

export interface GoogleBooksVolume {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        pageCount?: number;
        categories?: string[];
        averageRating?: number;
        ratingsCount?: number;
        imageLinks?: {
            thumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
        };
        language?: string;
        previewLink?: string;
        infoLink?: string;
    };
}

/**
 * Kitap arama yapar
 * @param query Arama terimi (kitap adı veya yazar)
 * @returns Arama sonuçları
 */
export async function searchBooks(query: string): Promise<GoogleBooksSearchResult[]> {
    if (!query.trim()) {
        return [];
    }

    const params = new URLSearchParams({
        q: query.trim(),
        maxResults: '10',
        printType: 'books',
        langRestrict: 'tr,en', // Türkçe ve İngilizce kitaplar
    });

    // API key varsa ekle (opsiyonel)
    if (API_KEY) {
        params.append('key', API_KEY);
    }

    try {
        const response = await fetch(`${BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Kitap arama sırasında bir hata oluştu');
        }

        const data: GoogleBooksSearchResponse = await response.json();

        if (!data.items || data.items.length === 0) {
            return [];
        }

        return data.items;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Kitap araması yapılırken bir hata oluştu');
    }
}

/**
 * Volume ID'ye göre kitap detaylarını getirir
 * @param volumeId Google Books Volume ID
 * @returns Kitap detayları
 */
export async function getBookById(volumeId: string): Promise<GoogleBooksVolume> {
    const params = new URLSearchParams();

    // API key varsa ekle (opsiyonel)
    if (API_KEY) {
        params.append('key', API_KEY);
    }

    try {
        const url = params.toString()
            ? `${BASE_URL}/${volumeId}?${params.toString()}`
            : `${BASE_URL}/${volumeId}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Kitap bulunamadı');
        }

        const data: GoogleBooksVolume = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Kitap detayları getirilirken bir hata oluştu');
    }
}

/**
 * Google Books rating'ini (0-5) 0-9.9 arasına normalize eder
 * @param rating Google Books rating (0-5 arası)
 * @returns 0-9.9 arası rating
 */
export function normalizeBookRating(rating?: number): string {
    if (!rating || rating <= 0) return '0';

    // Google Books 0-5 arası puan kullanır, biz 0-10 arası kullanıyoruz
    // 5 üzerinden puanı 10 üzerinden puana çevir
    const normalizedRating = (rating / 5) * 10;

    // 9.9'a sınırla
    if (normalizedRating > 9.9) return '9.9';
    if (normalizedRating < 0) return '0';

    return normalizedRating.toFixed(1);
}

/**
 * Kitap kapak resmini getirir (yüksek kaliteli)
 * @param imageLinks Kitap resim linkleri
 * @returns En yüksek kaliteli resim URL'i
 */
export function getBookCoverUrl(imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
}): string {
    if (!imageLinks) return '';

    // Büyükten küçüğe sırala ve ilk bulduğunu döndür
    const priority = ['large', 'medium', 'small', 'thumbnail', 'smallThumbnail'] as const;

    for (const size of priority) {
        if (imageLinks[size]) {
            // HTTP'yi HTTPS'e çevir (Google Books bazen HTTP döndürüyor)
            return imageLinks[size]!.replace('http://', 'https://');
        }
    }

    return '';
}

/**
 * Yazar isimlerini birleştirir
 * @param authors Yazar dizisi
 * @returns Birleştirilmiş yazar isimleri
 */
export function formatAuthors(authors?: string[]): string {
    if (!authors || authors.length === 0) return '';

    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' & ');

    // 3 veya daha fazla yazar varsa ilk ikisini göster ve "ve diğerleri" ekle
    return `${authors.slice(0, 2).join(', ')} ve diğerleri`;
}
