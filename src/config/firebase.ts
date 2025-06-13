// src/config/firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Import Firestore functions
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace with YOUR ACTUAL Firebase config values
  apiKey: "AIzaSyBxcwgWLPApInrkSYJw6tu4Xq6ru4AHe8M", // <-- Use your actual API key
  authDomain: "pariyashworld.firebaseapp.com", // <-- Use your actual auth domain
  projectId: "pariyashworld", // <-- Use your actual project ID
  storageBucket: "pariyashworld.firebasestorage.app", // <-- Use your actual storage bucket
  messagingSenderId: "997417837063", // <-- Use your actual sender ID
  appId: "1:997417837063:web:9dc0174a4972fd187840a2" // <-- Use your actual app ID
  // You can remove databaseURL if you don't intend to use Realtime Database
  // databaseURL: "https://your-project-default-rtdb.firebaseio.com",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app); // Export as 'db' (common convention for Firestore)

// Initialize Storage and get a reference to the service
export const storage = getStorage(app);

export default app; // Export the app instance itself
