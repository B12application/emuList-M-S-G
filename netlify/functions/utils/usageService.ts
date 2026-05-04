import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID
};

// Initialize Firebase for serverless
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class UsageService {
  private static LIMIT = 20;

  static async getUsage() {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'ai_usage', today);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { count: docSnap.data().count, limit: this.LIMIT };
    } else {
      return { count: 0, limit: this.LIMIT };
    }
  }

  static async isLimitReached() {
    const { count } = await this.getUsage();
    return count >= this.LIMIT;
  }

  static async incrementUsage() {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'ai_usage', today);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        count: increment(1)
      });
    } else {
      await setDoc(docRef, {
        count: 1
      });
    }
  }
}
