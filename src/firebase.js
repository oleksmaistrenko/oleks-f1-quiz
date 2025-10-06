// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication helper functions
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email, password, username) => {
  // First create the user account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  // Check if this is the first user - make them admin
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const isFirstUser = snapshot.empty;
  
  // Then store the additional username in Firestore
  const userRef = doc(db, "users", userCredential.user.uid);
  await setDoc(userRef, {
    email: email,
    username: username,
    createdAt: new Date(),
    role: isFirstUser ? "admin" : "user" // First user gets admin role
  });

  return userCredential;
};

// Get user profile data
export const getUserProfile = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  return null;
};

// Get all users for admin page
export const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);

  return usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { role: newRole }, { merge: true });
  return true;
};

export const logout = () => {
  return signOut(auth);
};

export { db, auth };
