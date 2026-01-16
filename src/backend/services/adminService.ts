// src/backend/services/adminService.ts
// Admin işlemleri için servis

import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { isAdmin } from '../config/adminConfig';
import type { ActivityComment } from '../types/activityReaction';

export interface CommentWithActivity extends ActivityComment {
    activityId: string;
}

export interface AdminUser {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    gender?: 'male' | 'female' | '';
    createdAt?: Timestamp;
    bio?: string;
    location?: string;
    photoURL?: string;
}

/**
 * Tüm kullanıcıları getirir (Admin için)
 */
export async function getAllUsers(adminUserId: string): Promise<AdminUser[]> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        const q = query(
            collection(db, 'users'),
            orderBy('displayName'),
            limit(500)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            uid: docSnap.id,
            ...docSnap.data()
        } as AdminUser));
    } catch (error) {
        console.error('Kullanıcılar alınırken hata:', error);
        return [];
    }
}

/**
 * Admin olarak kullanıcı günceller
 */
export async function updateUserAsAdmin(
    adminUserId: string,
    userId: string,
    data: Partial<Pick<AdminUser, 'displayName' | 'gender' | 'bio' | 'location'>>
): Promise<boolean> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    try {
        await updateDoc(doc(db, 'users', userId), data);
        return true;
    } catch (error) {
        console.error('Kullanıcı güncellenirken hata:', error);
        return false;
    }
}

/**
 * Admin olarak kullanıcı siler (sadece Firestore verisini siler, Firebase Auth'u değil)
 */
export async function deleteUserAsAdmin(adminUserId: string, userId: string): Promise<boolean> {
    if (!isAdmin(adminUserId)) {
        throw new Error('Yetkisiz erişim');
    }

    // Admin kendini silemez
    if (adminUserId === userId) {
        throw new Error('Kendini silemezsin');
    }

    try {
        await deleteDoc(doc(db, 'users', userId));
        return true;
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        return false;
    }
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

