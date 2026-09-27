// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "synora-ai-1e3a6.firebaseapp.com",
  projectId: "synora-ai-1e3a6",
  storageBucket: "synora-ai-1e3a6.firebasestorage.app",
  messagingSenderId: "946345003534",
  appId: "1:946345003534:web:8c88c043365a237c09ca5f",
  measurementId: "G-YM6S5EK2RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth =getAuth(app);
export const googleprovider= new GoogleAuthProvider()