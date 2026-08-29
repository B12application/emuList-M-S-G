// src/backend/services/loginLogService.ts
// Kullanıcı giriş kayıtlarını tutma ve Admin paneline sunma servisi

import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { isAdmin } from '../config/adminConfig';

export interface LoginLog {
    id?: string;
    userId: string;
    email: string;
    displayName: string;
    photoURL?: string;
    timestamp: any;
    userAgent: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
}

/**
 * UserAgent string'inden cihaz tipi, tarayıcı ve işletim sistemi çıkarır
 */
export function parseUserAgent(ua: string): { deviceType: 'mobile' | 'desktop' | 'tablet'; browser: string; os: string } {
    if (!ua) {
        return { deviceType: 'desktop', browser: 'Bilinmiyor', os: 'Bilinmiyor' };
    }

    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
    
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    let browser = 'Tarayıcı';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let os = 'Bilinmiyor';
    if (ua.includes('iPhone')) os = 'iPhone (iOS)';
    else if (ua.includes('iPad')) os = 'iPad (iPadOS)';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return { deviceType, browser, os };
}

/**
 * Kullanıcı giriş yaptığında veya oturum yenilendiğinde çağrılır
 */
export async function logUserLogin(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
    if (!user || !user.uid) return;

    try {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const { deviceType, browser, os } = parseUserAgent(ua);

        const email = user.email || '';
        const displayName = user.displayName || user.email?.split('@')[0] || 'Kullanıcı';
        const photoURL = user.photoURL || '';

        // 1. users tablosundaki son giriş bilgilerini güncelle
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            lastDevice: `${os} • ${browser} (${deviceType})`,
            email,
            displayName,
            photoURL
        }, { merge: true });

        // 2. Her oturumda en fazla 1 kez loginLogs koleksiyonuna giriş hareketi yaz
        const sessionKey = `login_log_${user.uid}_${new Date().toISOString().slice(0, 13)}`; // Saatte 1 kez
        const alreadyLogged = sessionStorage.getItem(sessionKey);
        
        if (!alreadyLogged) {
            await addDoc(collection(db, 'loginLogs'), {
                userId: user.uid,
                email,
                displayName,
                photoURL,
                timestamp: serverTimestamp(),
                userAgent: ua,
                deviceType,
                browser,
                os
            });
            sessionStorage.setItem(sessionKey, 'true');
        }
    } catch (error) {
        console.warn('Giriş kaydı kaydedilemedi:', error);
    }
}

/**
 * Admin için son giriş kayıtlarını getirir
 */
export async function getLoginLogs(adminUserId: string): Promise<LoginLog[]> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        const q = query(
            collection(db, 'loginLogs'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        } as LoginLog));
    } catch (error) {
        console.error('Giriş kayıtları alınamadı:', error);
        return [];
    }
}
