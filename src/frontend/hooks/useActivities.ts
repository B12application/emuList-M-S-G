// src/frontend/hooks/useActivities.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToAllActivities, cleanupOldActivities } from '../../backend/services/activityService';
import type { Activity } from '../../backend/types/activity';

// Flag to ensure cleanup runs only once per app session
let cleanupDone = false;

export default function useActivities() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Run cleanup once per session (10 days old activities)
        if (!cleanupDone) {
            cleanupDone = true;
            cleanupOldActivities(10).then((count) => {
                if (count > 0) {
                    console.log(`Auto-cleaned ${count} activities older than 10 days`);
                }
            });
        }

        // Subscribe to real-time updates for ALL users (public feed)
        const unsubscribe = subscribeToAllActivities(
            (newActivities) => {
                setActivities(newActivities);
                setLoading(false);
            },
            50 // Limit to last 50 activities
        );

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [user]);

    return { activities, loading };
}

