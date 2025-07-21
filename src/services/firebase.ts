// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJZ2PnMgrOtzIBcJ669vOnMjmUPayY_wY",
  authDomain: "sistema-empresa-7d560.firebaseapp.com",
  projectId: "sistema-empresa-7d560",
  storageBucket: "sistema-empresa-7d560.firebasestorage.app",
  messagingSenderId: "1035189274403",
  appId: "1:1035189274403:web:fa8929ab2f6d34b0862e96",
  measurementId: "G-0JT71JXYZY",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);