// src/backend/types/notification.ts
import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'follow' | 'like' | 'comment';

export interface NotificationMetadata {
    senderName: string;
    senderAvatar?: string;
    mediaTitle?: string;      // For like/comment
    commentText?: string;     // For comment
}

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    type: NotificationType;
    activityId?: string;      // Related activity (for like/comment)
    isRead: boolean;
    timestamp: Timestamp;
    metadata: NotificationMetadata;
}
