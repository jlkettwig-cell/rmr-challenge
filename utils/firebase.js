import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkR8luE9c4lNwwORXLMJEsVYFN8iy5Tec",
  authDomain: "rmr-challenge.firebaseapp.com",
  projectId: "rmr-challenge"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
