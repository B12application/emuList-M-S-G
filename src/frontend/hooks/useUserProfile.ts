// src/hooks/useUserProfile.ts
// Refactored with React Query for caching
import { useQuery } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  gender: 'male' | 'female' | '';
  bio?: string;
  avatarUrl?: string;
  location?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

// Firebase'den profil çeken fonksiyon
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export default function useUserProfile() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: () => fetchUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 10, // 10 dakika - profil daha az değişir
  });

  return {
    profile: data || null,
    loading: isLoading
  };
}