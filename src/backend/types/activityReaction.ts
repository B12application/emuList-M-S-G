// src/backend/types/activityReaction.ts
import { Timestamp } from 'firebase/firestore';

export interface ActivityLike {
    id: string;
    activityId: string;
    userId: string;
    timestamp: Timestamp;
}

export interface ActivityComment {
    id: string;
    activityId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userGender?: 'male' | 'female';
    text: string;
    timestamp: Timestamp;
}
