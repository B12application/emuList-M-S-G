// src/frontend/hooks/useActivityReactions.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    likeActivity,
    unlikeActivity,
    hasUserLiked,
    getActivityLikes,
    addComment,
    subscribeToComments
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

        let unsubscribeComments: (() => void) | null = null;

        const loadReactions = async () => {
            setLoading(true);
            try {
                const [fetchedLikes, userLiked] = await Promise.all([
                    getActivityLikes(activityId),
                    user ? hasUserLiked(activityId, user.uid) : Promise.resolve(false)
                ]);

                setLikes(fetchedLikes);
                setIsLiked(userLiked);

                // Subscribe to real-time comments
                unsubscribeComments = subscribeToComments(activityId, (newComments) => {
                    setComments(newComments);
                });
            } catch (error) {
                console.error('Error loading reactions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadReactions();

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribeComments) {
                unsubscribeComments();
            }
        };
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
        userGender?: 'male' | 'female',
        userAvatar?: string
    ) => {
        if (!user || !text.trim()) return;

        try {
            await addComment(
                activityId,
                user.uid,
                user.displayName || 'User',
                userAvatar || user.photoURL || undefined,
                text.trim(),
                activityOwnerId,
                userGender
            );
            // Real-time subscription will automatically update the comments list
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
