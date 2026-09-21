// src/frontend/services/accessRequestService.ts
// B12 Kullanıcı Erişim & İletişim Talep Servisi
// Kullanıcıların AI ve diğer modüller için EMU'ya erişim talebi iletmesini sağlar

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import { isAdmin } from '../../backend/config/adminConfig';
import { setFeatureAccess } from './featureAccessService';
import type { FeatureKey } from './featureAccessService';

export interface AccessRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  featureKey: FeatureKey | 'general';
  featureLabel: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

const COLLECTION_NAME = 'accessRequests';

/**
 * Kullanıcı için yeni erişim talebi oluşturur veya var olan beklemedeki talebi günceller
 */
export async function createAccessRequest(params: {
  userId: string;
  userEmail: string;
  userName: string;
  featureKey: FeatureKey | 'general';
  featureLabel: string;
  message?: string;
}): Promise<{ id: string; isNew: boolean }> {
  const { userId, userEmail, userName, featureKey, featureLabel, message = '' } = params;

  try {
    // Aynı özellik için daha önce beklemede olan talep var mı kontrol et
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      limit(25)
    );

    const snapshot = await getDocs(q);
    const existingDoc = snapshot.docs.find(d => {
      const data = d.data();
      return data.featureKey === featureKey && data.status === 'pending';
    });

    if (existingDoc) {
      await updateDoc(doc(db, COLLECTION_NAME, existingDoc.id), {
        message: message || existingDoc.data().message || '',
        updatedAt: serverTimestamp(),
      });
      return { id: existingDoc.id, isNew: false };
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail,
      userName: userName || userEmail.split('@')[0],
      featureKey,
      featureLabel,
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, isNew: true };
  } catch (error) {
    console.error('Erişim talebi gönderilirken hata:', error);
    throw error;
  }
}

/**
 * Belirli bir kullanıcının belirli bir özellik için son talebini getirir
 */
export async function getUserRequestForFeature(
  userId: string,
  featureKey: FeatureKey | 'general'
): Promise<AccessRequest | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      limit(25)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const matches = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AccessRequest))
      .filter(req => req.featureKey === featureKey);

    if (matches.length === 0) return null;

    matches.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0);
      return timeB - timeA;
    });

    return matches[0] || null;
  } catch (error) {
    console.warn('Kullanıcı talebi sorgulanırken bildirim:', error);
    return null;
  }
}

/**
 * Tüm erişim taleplerini getirir (Admin Yetkisi Gerekir)
 */
export async function getAllAccessRequests(adminUserIdOrEmail: string): Promise<AccessRequest[]> {
  if (!isAdmin(adminUserIdOrEmail)) {
    throw new Error('Yetkisiz erişim');
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as AccessRequest));
  } catch (error) {
    console.error('Erişim talepleri alınırken hata:', error);
    return [];
  }
}

/**
 * Erişim talebinin durumunu günceller.
 * Eğer 'approved' ise ve featureKey geçerli bir özellik ise kullanıcıya otomatik yetki verir.
 */
export async function updateAccessRequestStatus(
  adminUserId: string,
  requestId: string,
  status: 'approved' | 'rejected' | 'pending',
  options?: {
    targetUserId?: string;
    featureKey?: FeatureKey | 'general';
    adminNotes?: string;
  }
): Promise<void> {
  if (!isAdmin(adminUserId)) {
    throw new Error('Yetkisiz erişim');
  }

  try {
    const requestRef = doc(db, COLLECTION_NAME, requestId);
    await updateDoc(requestRef, {
      status,
      adminNotes: options?.adminNotes || '',
      updatedAt: serverTimestamp(),
    });

    // Onaylandıysa ve featureKey varsa otomatik yetkilendir
    if (status === 'approved' && options?.targetUserId && options?.featureKey && options.featureKey !== 'general') {
      await setFeatureAccess(adminUserId, options.targetUserId, options.featureKey as FeatureKey, true);
    }
  } catch (error) {
    console.error('Talep durumu güncellenirken hata:', error);
    throw error;
  }
}

/**
 * Erişim talebini siler
 */
export async function deleteAccessRequest(adminUserId: string, requestId: string): Promise<void> {
  if (!isAdmin(adminUserId)) {
    throw new Error('Yetkisiz erişim');
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, requestId));
  } catch (error) {
    console.error('Talep silinirken hata:', error);
    throw error;
  }
}
