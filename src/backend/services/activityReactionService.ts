// src/backend/services/activityReactionService.ts
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { createNotification } from './notificationService';
import type { ActivityLike, ActivityComment } from '../types/activityReaction';

/**
 * Like an activity
 */
export async function likeActivity(
    activityId: string,
    userId: string,
    activityOwnerId: string,
    activityOwnerName: string,
    mediaTitle: string
): Promise<void> {
    try {
        // Check if already liked
        const existingLike = await hasUserLiked(activityId, userId);
        if (existingLike) {
            return; // Already liked
        }

        // Add like
        await addDoc(collection(db, 'activityLikes'), {
            activityId,
            userId,
            timestamp: Timestamp.now()
        });

        // Create notification for activity owner
        if (userId !== activityOwnerId) {
            await createNotification(
                activityOwnerId,
                userId,
                'like',
                {
                    senderName: activityOwnerName, // This should be current user's name
                    mediaTitle
                },
                activityId
            );
        }
    } catch (error) {
        console.error('Error liking activity:', error);
        throw error;
    }
}

/**
 * Unlike an activity
 */
export async function unlikeActivity(activityId: string, userId: string): Promise<void> {
    try {
        const q = query(
            collection(db, 'activityLikes'),
            where('activityId', '==', activityId),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(docSnapshot =>
            deleteDoc(docSnapshot.ref)
        );

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error unliking activity:', error);
        throw error;
    }
}

/**
 * Get all likes for an activity
 */
export async function getActivityLikes(activityId: string): Promise<ActivityLike[]> {
    try {
        const q = query(
            collection(db, 'activityLikes'),
            where('activityId', '==', activityId)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityLike));
    } catch (error) {
        console.error('Error fetching activity likes:', error);
        return [];
    }
}

/**
 * Check if user has liked an activity
 */
export async function hasUserLiked(activityId: string, userId: string): Promise<boolean> {
    try {
        const q = query(
            collection(db, 'activityLikes'),
            where('activityId', '==', activityId),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size > 0;
    } catch (error) {
        console.error('Error checking if user liked:', error);
        return false;
    }
}

/**
 * Add a comment to an activity
 */
export async function addComment(
    activityId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string,
    activityOwnerId: string,
    userGender?: 'male' | 'female'
): Promise<void> {
    try {
        await addDoc(collection(db, 'activityComments'), {
            activityId,
            userId,
            userName,
            userAvatar: userAvatar || null,
            userGender: userGender || 'male',
            text,
            timestamp: Timestamp.now()
        });

        // Create notification for activity owner
        if (userId !== activityOwnerId) {
            await createNotification(
                activityOwnerId,
                userId,
                'comment',
                {
                    senderName: userName,
                    senderAvatar: userAvatar,
                    commentText: text.length > 50 ? text.substring(0, 50) + '...' : text
                },
                activityId
            );
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}

/**
 * Get all comments for an activity
 */
export async function getActivityComments(activityId: string): Promise<ActivityComment[]> {
    try {
        const q = query(
            collection(db, 'activityComments'),
            where('activityId', '==', activityId)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ActivityComment));
    } catch (error) {
        console.error('Error fetching activity comments:', error);
        return [];
    }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'activityComments', commentId));
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}
