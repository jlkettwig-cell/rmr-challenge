"use client";

import { signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { useEffect } from "react";
import { auth, provider } from "../../utils/firebase";

const ADMIN_EMAIL = "jlkettwig@gmail.com";

export default function Admin() {

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result && result.user) {
          console.log("LOGIN EMAIL:", result.user.email);

          if (result.user.email === ADMIN_EMAIL) {
            // ✅ Erfolg → zurück zur Hauptseite
            window.location.href = "/";
          } else {
            alert("Kein Zugriff: " + result.user.email);
            await signOut(auth);
          }
        }
      } catch (e) {
        console.error("LOGIN ERROR:", e);
        alert("Fehler beim Login: " + e.message);
      }
    };

    checkLogin();
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
