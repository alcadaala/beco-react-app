// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXHAEw6F3I5DDb9BslFtryd-v5gIveeOk",
    authDomain: "beco-app-2ea09.firebaseapp.com",
    projectId: "beco-app-2ea09",
    storageBucket: "beco-app-2ea09.firebasestorage.app",
    messagingSenderId: "1002593186116",
    appId: "1:1002593186116:web:ec25c471c2860346272711",
    measurementId: "G-C8WZWPR0H5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
