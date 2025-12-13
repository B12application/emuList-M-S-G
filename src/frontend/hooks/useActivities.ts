// src/frontend/hooks/useActivities.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToAllActivities } from '../../backend/services/activityService';
import type { Activity } from '../../backend/types/activity';

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
