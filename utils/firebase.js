import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCB7PbK-zs30eFLmcrHUNXqAmBy5yBYpHY",
  authDomain: "rmrc-9bd98.firebaseapp.com",
  projectId: "rmrc-9bd98"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// 🔥 WICHTIG: Auth + Persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export { auth };

// Provider bleibt gleich
export const provider = new GoogleAuthProvider();
