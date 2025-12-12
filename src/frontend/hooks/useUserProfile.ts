// src/hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  gender: 'male' | 'female' | '';
  bio?: string;
  avatarUrl?: string;
}

export default function useUserProfile() {
  const { user } = useAuth(); // Mevcut giriş yapan kullanıcıyı al
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (e) {
        console.error("Kullanıcı profili çekilemedi:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}