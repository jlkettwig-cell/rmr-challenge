import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCB7PbK-zs30eFLmcrHUNXqAmBy5yBYpHY",

  authDomain: "rmrc-9bd98.firebaseapp.com",

  projectId: "rmrc-9bd98"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
