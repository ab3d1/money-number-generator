import { initializeApp } from "firebase/app";
import { getFirestore, collection } from 'firebase/firestore';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANCCNWAk21PYMhg4ioQnonX73zMJfAkDk",
  authDomain: "ab3d1-cl3m.firebaseapp.com",
  projectId: "ab3d1-cl3m",
  storageBucket: "ab3d1-cl3m.firebasestorage.app",
  messagingSenderId: "382420415276",
  appId: "1:382420415276:web:0d840f92c428214d793289"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const assignmentsCollection = collection(db, 'assignments');

