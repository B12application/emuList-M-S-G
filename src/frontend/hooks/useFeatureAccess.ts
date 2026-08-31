// src/frontend/hooks/useFeatureAccess.ts
// Kullanıcının özellik erişimlerini React Query ile cache'leyen hook

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAllFeatureAccess } from '../services/featureAccessService';
import type { FeatureKey } from '../services/featureAccessService';
import { isAdmin } from '../../backend/config/adminConfig';

/**
 * Kullanıcının tüm özellik erişimlerini getirir
 * Admin her zaman tüm özelliklere erişebilir
 */
export function useFeatureAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userIsAdmin = isAdmin(user?.uid);

  const { data, isLoading } = useQuery({
    queryKey: ['featureAccess', user?.uid],
    queryFn: () => getAllFeatureAccess(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 2, // 2 dakika cache
  });

  /**
   * Belirli bir özelliğe erişim var mı kontrol eder
   * Admin her zaman true döner
   */
  const hasAccess = (feature: FeatureKey): boolean => {
    if (userIsAdmin) return true; // Admin her şeye erişebilir
    if (!data) return feature !== 'calorieAi'; // Yüklenirken varsayılan
    return data[feature] ?? false;
  };

  /**
   * Erişim verilerini yeniden yükle (admin toggle sonrası)
   */
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['featureAccess'] });
  };

  return {
    featureAccess: data,
    loading: isLoading,
    hasAccess,
    refetch,
  };
}
