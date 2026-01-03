// src/backend/types/customList.ts
import { Timestamp } from 'firebase/firestore';

export interface CustomList {
    id: string;
    userId: string;
    name: string;
    description?: string;
    color?: string;       // Hex color for list accent
    icon?: string;        // Icon name (e.g., 'FaHeart', 'FaStar')
    isPublic: boolean;
    itemIds: string[];    // Array of media item IDs
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type CustomListInput = Omit<CustomList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
