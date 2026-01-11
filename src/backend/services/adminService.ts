// src/backend/services/adminService.ts
// Admin işlemleri için servis

import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { isAdmin } from '../config/adminConfig';
import type { ActivityComment } from '../types/activityReaction';

export interface CommentWithActivity extends ActivityComment {
    activityId: string;
}

/**
 * Tüm yorumları getirir (Admin için)
 */
export async function getAllComments(adminUserId: string): Promise<CommentWithActivity[]> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        const q = query(
            collection(db, 'activityComments'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        } as CommentWithActivity));
    } catch (error) {
        console.error('Yorumlar alınırken hata:', error);
        return [];
    }
}

/**
 * Admin olarak yorum siler
 */
export async function deleteCommentAsAdmin(adminUserId: string, commentId: string): Promise<boolean> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        await deleteDoc(doc(db, 'activityComments', commentId));
        return true;
    } catch (error) {
        console.error('Yorum silinirken hata:', error);
        return false;
    }
}

/**
 * Tüm aktiviteleri getirir (Admin için)
 */
export async function getAllActivities(adminUserId: string): Promise<any[]> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        const q = query(
            collection(db, 'activities'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    } catch (error) {
        console.error('Aktiviteler alınırken hata:', error);
        return [];
    }
}

/**
 * Admin olarak aktivite siler
 */
export async function deleteActivityAsAdmin(adminUserId: string, activityId: string): Promise<boolean> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        await deleteDoc(doc(db, 'activities', activityId));
        return true;
    } catch (error) {
        console.error('Aktivite silinirken hata:', error);
        return false;
    }
}
