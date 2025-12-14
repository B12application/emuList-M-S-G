// src/frontend/hooks/useActivityReactions.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    likeActivity,
    unlikeActivity,
    hasUserLiked,
    getActivityLikes,
    addComment,
    getActivityComments
} from '../../backend/services/activityReactionService';
import type { ActivityLike, ActivityComment } from '../../backend/types/activityReaction';

export default function useActivityReactions(activityId: string) {
    const { user } = useAuth();
    const [likes, setLikes] = useState<ActivityLike[]>([]);
    const [comments, setComments] = useState<ActivityComment[]>([]);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activityId) return;

        const loadReactions = async () => {
            setLoading(true);
            try {
                const [fetchedLikes, fetchedComments, userLiked] = await Promise.all([
                    getActivityLikes(activityId),
                    getActivityComments(activityId),
                    user ? hasUserLiked(activityId, user.uid) : Promise.resolve(false)
                ]);

                setLikes(fetchedLikes);
                setComments(fetchedComments);
                setIsLiked(userLiked);
            } catch (error) {
                console.error('Error loading reactions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadReactions();
    }, [activityId, user]);

    const handleLike = async (
        activityOwnerId: string,
        activityOwnerName: string,
        mediaTitle: string
    ) => {
        if (!user) return;

        try {
            if (isLiked) {
                await unlikeActivity(activityId, user.uid);
                setLikes(prev => prev.filter(like => like.userId !== user.uid));
                setIsLiked(false);
            } else {
                await likeActivity(activityId, user.uid, activityOwnerId, activityOwnerName, mediaTitle);
                setIsLiked(true);
                // Optimistic update
                const newLike: ActivityLike = {
                    id: `${activityId}-${user.uid}`,
                    activityId,
                    userId: user.uid,
                    timestamp: { toDate: () => new Date() } as any
                };
                setLikes(prev => [...prev, newLike]);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleComment = async (
        text: string,
        activityOwnerId: string,
        userGender?: 'male' | 'female'
    ) => {
        if (!user || !text.trim()) return;

        try {
            await addComment(
                activityId,
                user.uid,
                user.displayName || 'User',
                user.photoURL || undefined,
                text.trim(),
                activityOwnerId,
                userGender
            );

            // Optimistic update
            const newComment: ActivityComment = {
                id: `temp-${Date.now()}`,
                activityId,
                userId: user.uid,
                userName: user.displayName || 'User',
                userAvatar: user.photoURL || undefined,
                userGender,
                text: text.trim(),
                timestamp: { toDate: () => new Date() } as any
            };
            setComments(prev => [...prev, newComment]);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    return {
        likes,
        comments,
        isLiked,
        loading,
        handleLike,
        handleComment,
        likeCount: likes.length,
        commentCount: comments.length
    };
}
