"use client";

import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useEffect } from "react";
import { auth, provider } from "../../utils/firebase";

const ADMIN_EMAIL = "DEINE_EMAIL@gmail.com";

export default function Admin() {

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result?.user) {
          console.log("LOGIN SUCCESS", result.user.email);

          if (result.user.email !== ADMIN_EMAIL) {
            alert("Kein Zugriff");
            await auth.signOut();
          } else {
            window.location.href = "/";
          }
        }
      } catch (e) {
        console.error("LOGIN ERROR", e);
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
