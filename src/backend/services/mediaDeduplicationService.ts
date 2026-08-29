// src/backend/services/mediaDeduplicationService.ts
// İki ayrı API'den (OMDb ve TMDb) eklenen içerikleri IMDb ID ve başlık normalizasyonuyla eşitleyen servis

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MediaItem, MediaType } from '../types/media';

export interface DeduplicationCheckParams {
    title: string;
    originalTitle?: string;
    imdbId?: string;
    type?: MediaType;
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    existingItem?: MediaItem;
    matchReason?: 'imdb_id' | 'exact_title' | 'normalized_title' | 'original_title';
    message?: string;
}

/**
 * Başlığı karşılaştırma için temizler ve normalize eder (küçük harf, noktalama ve gereksiz boşluk temizliği)
 */
export function normalizeMediaTitle(title: string): string {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[\:\-\–\—\.\,\'\"\’\?\!\(\)\[\]\{\}]/g, ' ') // Noktalama işaretlerini boşluğa çevir
        .replace(/\s+/g, ' ')                                  // Fazla boşlukları teke indir
        .trim();
}

/**
 * Kullanıcının kütüphanesinde aynı içeriğin (IMDb ID, Türkçe/İngilizce başlık veya Orijinal başlık ile)
 * zaten var olup olmadığını kontrol eder.
 */
export async function checkDuplicateMediaItem(
    userId: string,
    params: DeduplicationCheckParams
): Promise<DuplicateCheckResult> {
    if (!userId || (!params.title && !params.imdbId)) {
        return { isDuplicate: false };
    }

    try {
        // 1. Kullanıcının medya kayıtlarını getir
        const q = query(
            collection(db, 'mediaItems'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return { isDuplicate: false };
        }

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MediaItem));

        const targetType = params.type;
        const normalizedTargetTitle = normalizeMediaTitle(params.title);
        const normalizedOriginalTitle = params.originalTitle ? normalizeMediaTitle(params.originalTitle) : '';
        const targetImdbId = params.imdbId ? params.imdbId.trim().toLowerCase() : '';

        for (const item of items) {
            // Tip filtresi varsa (örn: Film ve Dizi ayrımı)
            if (targetType && (targetType as string) !== 'all' && item.type && item.type !== targetType) {
                continue;
            }

            const itemImdbId = item.imdbId ? item.imdbId.trim().toLowerCase() : '';
            const itemTitle = item.title ? item.title.trim() : '';
            const normalizedItemTitle = normalizeMediaTitle(itemTitle);

            // A. IMDb ID Eşleşmesi (En Kesin Doğrulama: Türkçe ve İngilizce isimler farklı olsa dahi yakalar)
            if (targetImdbId && itemImdbId && targetImdbId === itemImdbId) {
                return {
                    isDuplicate: true,
                    existingItem: item,
                    matchReason: 'imdb_id',
                    message: `Bu içerik kütüphanenizde zaten "${itemTitle}" adıyla kayıtlı! (IMDb ID: ${item.imdbId})`
                };
            }

            // B. Tam Birebir Başlık Eşleşmesi
            if (itemTitle.toLowerCase() === params.title.trim().toLowerCase()) {
                return {
                    isDuplicate: true,
                    existingItem: item,
                    matchReason: 'exact_title',
                    message: `Bu içerik kütüphanenizde zaten "${itemTitle}" adıyla kayıtlı!`
                };
            }

            // C. Normalize Edilmiş Başlık Eşleşmesi
            if (normalizedItemTitle && normalizedItemTitle === normalizedTargetTitle) {
                return {
                    isDuplicate: true,
                    existingItem: item,
                    matchReason: 'normalized_title',
                    message: `Bu içerik kütüphanenizde zaten "${itemTitle}" adıyla kayıtlı!`
                };
            }

            // D. Orijinal İngilizce Başlık ile Eşleşme
            if (normalizedOriginalTitle && normalizedItemTitle === normalizedOriginalTitle) {
                return {
                    isDuplicate: true,
                    existingItem: item,
                    matchReason: 'original_title',
                    message: `Bu içerik kütüphanenizde zaten "${itemTitle}" adıyla kayıtlı!`
                };
            }
        }

        return { isDuplicate: false };
    } catch (error) {
        console.error('Duplicate kontrolü yapılırken hata:', error);
        return { isDuplicate: false };
    }
}
