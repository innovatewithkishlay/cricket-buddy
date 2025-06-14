import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBompzqwc1eF4vlGiAmgQ0nsr1C4rlWQaM",
  authDomain: "cricket-buddy-d56be.firebaseapp.com",
  projectId: "cricket-buddy-d56be",
  storageBucket: "cricket-buddy-d56be.firebasestorage.app",
  messagingSenderId: "650052070673",
  appId: "1:650052070673:web:9a7cf441fb7c607435f0b0",
  measurementId: "G-P2Z9RF71QF",
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
