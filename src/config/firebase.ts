// src/config/firebase.ts

import { initializeApp, FirebaseApp } from "firebase/app"; // Import FirebaseApp type
import { getFirestore, Firestore } from "firebase/firestore"; // Import getFirestore and Firestore type
import { getStorage, FirebaseStorage } from "firebase/storage"; // Import getStorage and FirebaseStorage type

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxcwgWLPApInrkSYJw6tu4Xq6ru4AHe8M",
  authDomain: "pariyashworld.firebaseapp.com",
  projectId: "pariyashworld",
  storageBucket: "pariyashworld.firebasestorage.app",
  messagingSenderId: "997417837063",
  appId: "1:997417837063:web:9dc0174a4972fd187840a2"
};

// Initialize Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db: Firestore = getFirestore(app); // <-- ADDED: Initialize and export db

// Initialize Storage and get a reference to the service
export const storage: FirebaseStorage = getStorage(app); // <-- ADDED: Initialize and export storage

export default app; // Export the app instance itself
