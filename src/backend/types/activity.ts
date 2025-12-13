// src/backend/types/activity.ts
import { Timestamp } from 'firebase/firestore';
import type { MediaItem } from './media';

export type ActivityType =
    | 'media_added'
    | 'media_watched'
    | 'favorite_added'
    | 'favorite_removed';

export interface Activity {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    type: ActivityType;
    mediaItem: {
        id: string;
        title: string;
        image?: string;
        type: MediaItem['type'];
        rating?: string;
    };
    timestamp: Timestamp;
}
