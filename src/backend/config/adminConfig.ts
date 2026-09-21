// src/backend/config/adminConfig.ts
// Admin kullanıcı yapılandırması

// Admin kullanıcının Firebase UID'si
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

// Yetkili Admin e-posta adresleri
export const ADMIN_EMAILS: string[] = [
    'emuwhilist@gmail.com',
    'mustafaulusoy0707@gmail.com'
];

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @param userIdOrEmail Firebase kullanıcı UID'si veya e-posta adresi
 * @param userEmail Opsiyonel olarak kullanıcının e-posta adresi
 * @returns Admin ise true
 */
export function isAdmin(userIdOrEmail: string | undefined, userEmail?: string | null): boolean {
    if (!userIdOrEmail) return false;
    if (ADMIN_UID && userIdOrEmail === ADMIN_UID) return true;
    if (ADMIN_EMAILS.includes(userIdOrEmail.toLowerCase())) return true;
    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) return true;
    return false;
}

