import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyHere_1234567890",
  authDomain: "fixit-377672828671.firebaseapp.com",
  projectId: "fixit-377672828671",
  storageBucket: "fixit-377672828671.appspot.com",
  messagingSenderId: "377672828671",
  appId: "1:377672828671:android:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
