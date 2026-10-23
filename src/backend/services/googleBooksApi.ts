// src/backend/services/googleBooksApi.ts
// Universal Resilient Book Search Service for B12 (by EMU)
// Supports Open Library (Unlimited / Primary) & Google Books API with Multi-Tier Redis Caching

import { getOrFetchWithRedisCache } from './apiQuotaService';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const GOOGLE_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';

// Google Books & Universal Book Types
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
            small?: string;
            medium?: string;
            large?: string;
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
            smallThumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
        };
        language?: string;
        previewLink?: string;
        infoLink?: string;
    };
}

// In-Memory Fast Cache for Open Library Documents (preserves full metadata across search & select)
interface OpenLibraryDocMeta {
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
    isbn?: string[];
    ratings_average?: number;
    ratings_count?: number;
    number_of_pages_median?: number;
    subject?: string[];
    subtitle?: string;
    first_sentence?: string | string[];
}

const openLibraryDocCache = new Map<string, OpenLibraryDocMeta>();

/**
 * Searches books on Open Library (Fast, reliable, free, zero API key required)
 */
async function searchOpenLibrary(query: string): Promise<GoogleBooksSearchResult[]> {
    const url = `${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(query.trim())}&limit=15`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Open Library returned status ${res.status}`);
    }
    const data = await res.json();
    if (!data.docs || data.docs.length === 0) {
        return [];
    }

    return data.docs.map((doc: any) => {
        const rawKey = doc.key || '';
        const cleanKey = rawKey.replace(/^\/(works|books)\//, '');
        const id = `ol_${cleanKey}`;

        // Save in in-memory doc cache
        openLibraryDocCache.set(id, {
            title: doc.title,
            author_name: doc.author_name,
            first_publish_year: doc.first_publish_year,
            cover_i: doc.cover_i,
            isbn: doc.isbn,
            ratings_average: doc.ratings_average,
            ratings_count: doc.ratings_count,
            number_of_pages_median: doc.number_of_pages_median,
            subject: doc.subject,
            subtitle: doc.subtitle,
            first_sentence: doc.first_sentence,
        });

        const coverId = doc.cover_i;
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : undefined;

        let imageLinks: GoogleBooksSearchResult['volumeInfo']['imageLinks'] = undefined;
        if (coverId && coverId > 0) {
            imageLinks = {
                thumbnail: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
                smallThumbnail: `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`,
                small: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
                medium: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
                large: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
            };
        } else if (isbn) {
            imageLinks = {
                thumbnail: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                smallThumbnail: `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`,
                small: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                medium: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                large: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
            };
        }

        const desc = typeof doc.first_sentence === 'string'
            ? doc.first_sentence
            : (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : (doc.subtitle || ''));

        return {
            id,
            volumeInfo: {
                title: doc.title || 'Untitled',
                authors: doc.author_name || [],
                publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
                description: desc,
                imageLinks,
                averageRating: doc.ratings_average,
                ratingsCount: doc.ratings_count,
                pageCount: doc.number_of_pages_median,
                categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
                language: Array.isArray(doc.language) ? doc.language[0] : undefined,
            }
        };
    });
}

/**
 * Searches books on Google Books API
 */
async function searchGoogleBooks(query: string): Promise<GoogleBooksSearchResult[]> {
    const params = new URLSearchParams({
        q: query.trim(),
        maxResults: '12',
        printType: 'books',
    });

    if (GOOGLE_API_KEY) {
        params.append('key', GOOGLE_API_KEY);
    }

    const response = await fetch(`${GOOGLE_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Google Books API error (${response.status})`);
    }

    const data: GoogleBooksSearchResponse = await response.json();
    return data.items || [];
}

/**
 * Kitap arama yapar (Open Library + Google Books Hibrit & Çok Katmanlı Redis Cache)
 * @param query Arama terimi (kitap adı veya yazar)
 * @param provider Tercih edilen arama motoru ('openlibrary' | 'googlebooks' | 'auto')
 * @returns Arama sonuçları
 */
export async function searchBooks(
    query: string,
    provider: 'openlibrary' | 'googlebooks' | 'auto' = 'openlibrary'
): Promise<GoogleBooksSearchResult[]> {
    if (!query.trim()) {
        return [];
    }

    const cacheKey = `b12_book_search_${provider}_${query.trim().toLowerCase()}`;

    return getOrFetchWithRedisCache(cacheKey, async () => {
        if (provider === 'googlebooks') {
            try {
                const results = await searchGoogleBooks(query);
                if (results.length > 0) return results;
            } catch (err) {
                console.warn('Google Books failed or quota exceeded, falling back to Open Library:', err);
            }
            // Fallback to Open Library
            return searchOpenLibrary(query);
        }

        // Open Library Primary (or 'auto')
        try {
            const olResults = await searchOpenLibrary(query);
            if (olResults.length > 0) return olResults;
        } catch (olErr) {
            console.warn('Open Library search failed, trying Google Books fallback:', olErr);
        }

        // Fallback to Google Books
        try {
            return await searchGoogleBooks(query);
        } catch {
            return [];
        }
    }, 7 * 24 * 60 * 60 * 1000); // 7-day multi-tier cache
}

/**
 * Open Library work / edition detaylarını çeker
 */
async function getOpenLibraryBookById(rawId: string): Promise<GoogleBooksVolume> {
    const cleanId = rawId.replace(/^ol_/, '').replace(/^\/(works|books)\//, '');
    const isEdition = cleanId.endsWith('M');
    const path = isEdition ? `/books/${cleanId}` : `/works/${cleanId}`;

    const cachedDoc = openLibraryDocCache.get(rawId) || openLibraryDocCache.get(`ol_${cleanId}`);

    // Fetch work/edition details and ratings in parallel
    const [detailRes, ratingsRes] = await Promise.all([
        fetch(`${OPEN_LIBRARY_BASE_URL}${path}.json`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${OPEN_LIBRARY_BASE_URL}${path}/ratings.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const title = detailRes?.title || cachedDoc?.title || 'Untitled Book';

    // Description resolution (Open Library can return string or { type: '/type/text', value: '...' })
    let description = '';
    if (typeof detailRes?.description === 'string') {
        description = detailRes.description;
    } else if (detailRes?.description?.value) {
        description = detailRes.description.value;
    } else if (cachedDoc?.first_sentence) {
        description = typeof cachedDoc.first_sentence === 'string'
            ? cachedDoc.first_sentence
            : cachedDoc.first_sentence[0];
    } else if (cachedDoc?.subtitle) {
        description = cachedDoc.subtitle;
    }

    // Cover resolution
    const detailCover = Array.isArray(detailRes?.covers)
        ? detailRes.covers.find((c: number) => c > 0)
        : undefined;
    const coverId = detailCover || cachedDoc?.cover_i;
    const isbn = Array.isArray(cachedDoc?.isbn) && cachedDoc.isbn.length > 0 ? cachedDoc.isbn[0] : undefined;

    let imageLinks: GoogleBooksVolume['volumeInfo']['imageLinks'] = undefined;
    if (coverId && coverId > 0) {
        imageLinks = {
            thumbnail: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
            smallThumbnail: `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`,
            small: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
            medium: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
            large: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
        };
    } else if (isbn) {
        imageLinks = {
            thumbnail: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            smallThumbnail: `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`,
            small: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            medium: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            large: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        };
    }

    // Authors resolution
    let authors = cachedDoc?.author_name || [];
    if (authors.length === 0 && Array.isArray(detailRes?.authors) && detailRes.authors.length > 0) {
        try {
            const firstAuthorRef = detailRes.authors[0]?.author?.key;
            if (firstAuthorRef) {
                const authorData = await fetch(`${OPEN_LIBRARY_BASE_URL}${firstAuthorRef}.json`).then(r => r.ok ? r.json() : null);
                if (authorData?.name) {
                    authors = [authorData.name];
                }
            }
        } catch {
            // Non-blocking fallback
        }
    }

    // Rating
    const averageRating = ratingsRes?.summary?.average || cachedDoc?.ratings_average;
    const ratingsCount = ratingsRes?.summary?.count || cachedDoc?.ratings_count;

    // Categories
    const categories = Array.isArray(detailRes?.subjects)
        ? detailRes.subjects.filter((s: string) => typeof s === 'string' && !s.startsWith('series:') && !s.includes('reviewed')).slice(0, 6)
        : (cachedDoc?.subject || []).slice(0, 6);

    const publishedDate = detailRes?.first_publish_date || (cachedDoc?.first_publish_year ? String(cachedDoc.first_publish_year) : undefined);

    return {
        id: rawId,
        volumeInfo: {
            title,
            authors: authors.length > 0 ? authors : undefined,
            publishedDate,
            description,
            pageCount: detailRes?.number_of_pages || cachedDoc?.number_of_pages_median,
            categories,
            averageRating,
            ratingsCount,
            imageLinks,
            infoLink: `https://openlibrary.org${path}`,
        }
    };
}

/**
 * Volume ID'ye göre kitap detaylarını getirir (Çok Katmanlı Redis Cache ile)
 * @param volumeId Open Library ID ('ol_...') veya Google Books Volume ID
 * @returns Kitap detayları
 */
export async function getBookById(volumeId: string): Promise<GoogleBooksVolume> {
    const cacheKey = `b12_book_vol_${volumeId}`;

    return getOrFetchWithRedisCache(cacheKey, async () => {
        if (
            volumeId.startsWith('ol_') ||
            volumeId.startsWith('OL') ||
            volumeId.startsWith('/works/') ||
            volumeId.startsWith('/books/')
        ) {
            return getOpenLibraryBookById(volumeId);
        }

        // Try Google Books API
        const params = new URLSearchParams();
        if (GOOGLE_API_KEY) {
            params.append('key', GOOGLE_API_KEY);
        }

        try {
            const url = params.toString()
                ? `${GOOGLE_BASE_URL}/${volumeId}?${params.toString()}`
                : `${GOOGLE_BASE_URL}/${volumeId}`;

            const response = await fetch(url);
            if (response.ok) {
                const data: GoogleBooksVolume = await response.json();
                return data;
            }
        } catch (error) {
            console.warn('Google Books getBookById failed, checking Open Library fallback:', error);
        }

        // Fallback to Open Library
        return getOpenLibraryBookById(volumeId);
    }, 30 * 24 * 60 * 60 * 1000); // 30-day multi-tier cache
}

/**
 * Google Books / Open Library rating'ini (0-5) 0-9.9 arasına normalize eder
 * @param rating 0-5 arası rating
 * @returns 0-9.9 arası rating
 */
export function normalizeBookRating(rating?: number): string {
    if (!rating || rating <= 0) return '0';

    // 0-5 arası puanı 10 üzerinden puana çevir
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
            // HTTP'yi HTTPS'e çevir
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
