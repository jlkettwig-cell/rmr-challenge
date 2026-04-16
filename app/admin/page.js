"use client";

import { signInWithRedirect, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth, provider } from "../../utils/firebase";

export default function Admin() {

  // 👉 NEU: prüft ob bereits eingeloggt
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("ALREADY LOGGED IN:", user.email);
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    console.log("LOGIN START");
    await signInWithRedirect(auth, provider);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🔐 Admin Login</h2>
      <button onClick={login}>
        Mit Google anmelden
      </button>
    </div>
  );
}
