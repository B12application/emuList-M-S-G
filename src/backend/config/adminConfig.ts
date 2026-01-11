// src/backend/config/adminConfig.ts
// Admin kullanıcı yapılandırması

// Admin kullanıcının Firebase UID'si
// .env dosyasından alınır veya burada tanımlanır
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @param userId Firebase kullanıcı UID'si
 * @returns Admin ise true
 */
export function isAdmin(userId: string | undefined): boolean {
    if (!userId || !ADMIN_UID) return false;
    return userId === ADMIN_UID;
}
