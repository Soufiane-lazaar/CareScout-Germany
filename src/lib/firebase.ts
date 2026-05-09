import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

// Validate connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // Expected if non-root, just verifying the SDK works
      console.log("Firebase initialized successfully.");
    }
  }
}
testConnection();
