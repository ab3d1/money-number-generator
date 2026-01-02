import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcpr6pCVBBauYeQeGllPypgojJ7v4E_f8",
  authDomain: "ab3d1money.firebaseapp.com",
  projectId: "ab3d1money",
  storageBucket: "ab3d1money.firebasestorage.app",
  messagingSenderId: "727576483918",
  appId: "1:727576483918:web:af50e060e5b8315358cb1f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
