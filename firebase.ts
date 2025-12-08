import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7AEXVlGH4rqlhNLYZ0BvF9hqJVrZtmN0",
  authDomain: "chelavukal.firebaseapp.com",
  projectId: "chelavukal",
  storageBucket: "chelavukal.firebasestorage.app",
  messagingSenderId: "615675801206",
  appId: "G-83FDMHYWZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);