import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { PlannerMeeting } from '../types/planner';

// Dahili yardımcı: Gelecek Instances'ları oluşturma
const generateFutureInstances = async (master: PlannerMeeting, weeks: number = 3) => {
  if (!master.date || !master.recurringGroupId) return;

  const [y, m, d] = master.date.split('-').map(Number);

  for (let i = 1; i <= weeks; i++) {
    // Yerel tarih üzerinden hesaplama yaparak timezone kaymalarını önle
    const targetDateObj = new Date(y, m - 1, d + (i * 7));
    const targetDate = `${targetDateObj.getFullYear()}-${String(targetDateObj.getMonth() + 1).padStart(2, '0')}-${String(targetDateObj.getDate()).padStart(2, '0')}`;

    // Bu tarihte bu grup için kayıt var mı check?
    const checkQ = query(
      collection(db, 'meetings'),
      where('recurringGroupId', '==', master.recurringGroupId),
      where('date', '==', targetDate)
    );
    const checkSnap = await getDocs(checkQ);

    if (checkSnap.empty) {
      // Eksik haftayı oluştur (Master DEĞİL, normal instance olarak)
      const { id, ...masterData } = master;
      const newInstance = {
        ...masterData,
        date: targetDate,
        isRecurringMaster: false,
        createdAt: serverTimestamp(),
        // Toplantılar için notları kopyalamıyoruz (seri içindeki her toplantı özeldir)
        notes: master.itemType === 'meeting' ? '' : (master.notes || '')
      };

      await addDoc(collection(db, 'meetings'), newInstance);
    }
  }
};

// Toplantı Ekleme
export const addMeeting = async (
  meeting: Omit<PlannerMeeting, 'id' | 'createdAt'>,
  isRecurring: boolean = false
): Promise<string> => {
  try {
    const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

    const docData: any = {
      ...meeting,
      createdAt: serverTimestamp(),
      isGoogleSheet: false,
      isRecurring,
      recurringGroupId,
    };

    if (isRecurring) {
      docData.isRecurringMaster = true;
      docData.recurrenceFrequency = 'weekly';
    }

    const docRef = await addDoc(collection(db, 'meetings'), docData);

    // EĞER TEKRARLAYAN ise: Hemen ilk 3 haftayı oluştur ki kullanıcı beklediğini görsün
    if (isRecurring) {
      const fullMaster = { ...docData, id: docRef.id } as PlannerMeeting;
      await generateFutureInstances(fullMaster, 3);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding meeting:', error);
    throw error;
  }
};

// Toplantı / Görev Güncelleme
export const updateMeeting = async (meetingId: string, updates: Partial<PlannerMeeting>): Promise<void> => {
  try {
    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
};

// Tekrarlayan Öğeleri Senkronize Etme (Gelecek haftaları oluşturma)
export const syncRecurringItems = async (userId: string): Promise<void> => {
  try {
    // 1. Master kayıtları bul
    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', userId),
      where('isRecurringMaster', '==', true)
    );
    const snapshot = await getDocs(q);
    
    for (const masterDoc of snapshot.docs) {
      const master = { id: masterDoc.id, ...masterDoc.data() } as PlannerMeeting;
      await generateFutureInstances(master, 3);

      // 3. Geçmiş temizliği (Opsiyonel: Veritabanında yığılma olmaması için 2 haftadan eski kayıtları sil)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = `${twoWeeksAgo.getFullYear()}-${String(twoWeeksAgo.getMonth() + 1).padStart(2, '0')}-${String(twoWeeksAgo.getDate()).padStart(2, '0')}`;

      const cleanupQ = query(
        collection(db, 'meetings'),
        where('recurringGroupId', '==', master.recurringGroupId),
        where('date', '<', twoWeeksAgoStr),
        where('isRecurringMaster', '==', false)
      );
      const cleanupSnap = await getDocs(cleanupQ);
      cleanupSnap.forEach(async (d) => {
        await deleteDoc(doc(db, 'meetings', d.id));
      });
    }
  } catch (error) {
    console.error('Error syncing recurring items:', error);
  }
};

// Tekrarlayan Serileri Listele (Dashboard için)
export const getRecurringMasters = async (userId: string): Promise<PlannerMeeting[]> => {
  try {
    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', userId),
      where('isRecurringMaster', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannerMeeting));
  } catch (error) {
    console.error('Error getting masters:', error);
    return [];
  }
};

// Komple Seriyi Sil
export const deleteRecurringSeries = async (masterId: string, groupId: string): Promise<void> => {
  try {
    // 1. Tüm instances'ları bul ve sil
    const q = query(
      collection(db, 'meetings'),
      where('recurringGroupId', '==', groupId)
    );
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'meetings', d.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting series:', error);
    throw error;
  }
};

// Kullanıcının Toplantılarını Getirme
export const getUserMeetings = async (userId: string): Promise<PlannerMeeting[]> => {
  try {
    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const meetings: PlannerMeeting[] = [];
    
    querySnapshot.forEach((doc) => {
      meetings.push({ id: doc.id, ...doc.data() } as PlannerMeeting);
    });
    
    return meetings;
  } catch (error) {
    console.error('Error getting meetings:', error);
    throw error;
  }
};

// Toplantı Silme
export const deleteMeeting = async (meetingId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'meetings', meetingId));
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

// Görev Durumunu Değiştirme (Tamamlandı / Yapılmadı)
export const toggleTodoStatus = async (meetingId: string, isCompleted: boolean): Promise<void> => {
  try {
    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, {
      isCompleted
    });
  } catch (error) {
    console.error('Error toggling todo status:', error);
    throw error;
  }
};
