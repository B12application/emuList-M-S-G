// src/backend/services/notificationService.ts
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    writeBatch,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { Notification, NotificationType, NotificationMetadata } from '../types/notification';

/**
 * Create a new notification
 */
export async function createNotification(
    recipientId: string,
    senderId: string,
    type: NotificationType,
    metadata: NotificationMetadata,
    activityId?: string
): Promise<void> {
    try {
        // Don't create notification if sender and recipient are the same
        if (recipientId === senderId) {
            return;
        }

        await addDoc(collection(db, 'notifications'), {
            recipientId,
            senderId,
            type,
            activityId: activityId || null,
            isRead: false,
            timestamp: Timestamp.now(),
            metadata
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
    userId: string,
    limitCount: number = 50
): Promise<Notification[]> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            isRead: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', userId),
            where('isRead', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);

        querySnapshot.docs.forEach((docSnapshot) => {
            batch.update(docSnapshot.ref, { isRead: true });
        });

        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', userId),
            where('isRead', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 50
): () => void {
    const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification));

        callback(notifications);
    }, (error) => {
        console.error('Error in notification subscription:', error);
    });

    return unsubscribe;
}
