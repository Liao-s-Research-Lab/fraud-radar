// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Make sure to import setDoc here
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6_JoKy3UXOZDKlCPWMXPleX_Vlqwb05M",
  authDomain: "dayofftest1.firebaseapp.com",
  databaseURL: "https://dayofftest1-default-rtdb.firebaseio.com",
  projectId: "dayofftest1",
  storageBucket: "dayofftest1.appspot.com",
  messagingSenderId: "827520348559",
  appId: "1:827520348559:web:e6f0d2de638db932a19bfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, doc, setDoc, auth }; // 導出 setDoc 和 doc
