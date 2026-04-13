import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { PlannerMeeting } from '../types/planner';

// Toplantı Ekleme
export const addMeeting = async (
  meeting: Omit<PlannerMeeting, 'id' | 'createdAt'>,
  isRecurring: boolean = false
): Promise<string> => {
  try {
    const recurringGroupId = isRecurring ? crypto.randomUUID() : undefined;
    
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
      // We'll generate instances during sync or immediately for first 3 weeks
    }

    const docRef = await addDoc(collection(db, 'meetings'), docData);
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
      
      // 2. Bu master için önümüzdeki 3 haftayı kontrol et
      for (let i = 1; i <= 3; i++) {
        const d = new Date(master.date);
        d.setDate(d.getDate() + (i * 7));
        const targetDate = d.toISOString().split('T')[0];
        
        // Bu tarihte bu grup için kayıt var mı check?
        const checkQ = query(
          collection(db, 'meetings'),
          where('recurringGroupId', '==', master.recurringGroupId),
          where('date', '==', targetDate)
        );
        const checkSnap = await getDocs(checkQ);
        
        if (checkSnap.empty) {
          // Eksik haftayı oluştur (Master DEĞİL, normal instance olarak)
          await addDoc(collection(db, 'meetings'), {
            ...master,
            id: undefined, // ensure new id
            date: targetDate,
            isRecurringMaster: false, // Instances are not masters
            createdAt: serverTimestamp(),
            // Don't copy notes if they were meeting-specific (optional)
            notes: master.itemType === 'meeting' ? '' : master.notes 
          });
        }
      }

      // 3. Geçmiş temizliği (Opsiyonel: Veritabanında yığılma olmaması için 2 haftadan eski kayıtları sil)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

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
