// src/backend/services/activityService.ts
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { Activity, ActivityType } from '../types/activity';
import type { MediaItem } from '../types/media';

/**
 * Creates a new activity in Firestore
 */
export async function createActivity(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    type: ActivityType,
    mediaItem: MediaItem
): Promise<void> {
    try {
        await addDoc(collection(db, 'activities'), {
            userId,
            userName,
            userAvatar: userAvatar || null,
            type,
            mediaItem: {
                id: mediaItem.id,
                title: mediaItem.title,
                image: mediaItem.image || null,
                type: mediaItem.type,
                rating: mediaItem.rating || null,
            },
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
    }
}

/**
 * Gets user's activities with pagination
 */
export async function getUserActivities(
    userId: string,
    limitCount: number = 50
): Promise<Activity[]> {
    try {
        const q = query(
            collection(db, 'activities'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Activity));
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

/**
 * Subscribes to real-time activity updates (all users - public feed)
 */
export function subscribeToAllActivities(
    callback: (activities: Activity[]) => void,
    limitCount: number = 50
): () => void {
    const q = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const activities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Activity));

        callback(activities);
    }, (error) => {
        console.error('Error in activity subscription:', error);
    });

    return unsubscribe;
}

/**
 * Subscribes to real-time activity updates
 */
export function subscribeToActivities(
    userId: string,
    callback: (activities: Activity[]) => void,
    limitCount: number = 50
): () => void {
    const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const activities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Activity));

        callback(activities);
    }, (error) => {
        console.error('Error in activity subscription:', error);
    });

    return unsubscribe;
}

/**
 * Deletes all activities related to a specific media item
 */
export async function deleteActivitiesForMedia(
    userId: string,
    mediaId: string
): Promise<void> {
    try {
        const q = query(
            collection(db, 'activities'),
            where('userId', '==', userId),
            where('mediaItem.id', '==', mediaId)
        );

        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc =>
            deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error deleting activities for media:', error);
        throw error;
    }
}

/**
 * Deletes a specific activity by ID
 */
export async function deleteActivity(activityId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'activities', activityId));
    } catch (error) {
        console.error('Error deleting activity:', error);
        throw error;
    }
}

/**
 * Deletes activities older than specified days (default: 10 days)
 * Also deletes related likes and comments
 */
export async function cleanupOldActivities(daysOld: number = 10): Promise<number> {
    try {
        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        // Query activities older than cutoff date
        const q = query(
            collection(db, 'activities'),
            where('timestamp', '<', cutoffTimestamp),
            limit(100) // Process in batches to avoid timeout
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return 0;
        }

        const deletePromises: Promise<void>[] = [];

        for (const activityDoc of querySnapshot.docs) {
            const activityId = activityDoc.id;

            // Delete the activity
            deletePromises.push(deleteDoc(activityDoc.ref));

            // Delete related likes
            const likesQuery = query(
                collection(db, 'activityLikes'),
                where('activityId', '==', activityId)
            );
            const likesSnapshot = await getDocs(likesQuery);
            likesSnapshot.docs.forEach(likeDoc => {
                deletePromises.push(deleteDoc(likeDoc.ref));
            });

            // Delete related comments
            const commentsQuery = query(
                collection(db, 'activityComments'),
                where('activityId', '==', activityId)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            commentsSnapshot.docs.forEach(commentDoc => {
                deletePromises.push(deleteDoc(commentDoc.ref));
            });
        }

        await Promise.all(deletePromises);

        console.log(`Cleaned up ${querySnapshot.size} old activities`);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error cleaning up old activities:', error);
        return 0;
    }
}
