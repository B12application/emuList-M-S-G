import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { PlannerMeeting } from '../types/planner';

// Toplantı Ekleme
export const addMeeting = async (meeting: Omit<PlannerMeeting, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'meetings'), {
      ...meeting,
      createdAt: serverTimestamp(),
      isGoogleSheet: false, // Locally added
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding meeting:', error);
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
