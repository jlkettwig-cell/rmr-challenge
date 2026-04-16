"use client";

import { signInWithRedirect } from "firebase/auth";
import { auth, provider } from "../../utils/firebase";
import { getRedirectResult } from "firebase/auth";
import { useEffect } from "react";

const ADMIN_EMAIL = "jlkettwig@gmail.com";

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

    window.location.href = "/";
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🔐 Admin Login</h2>
      <button onClick={() => {
  console.log("CLICK");
  login();
}}>
  Mit Google anmelden
</button>
    </div>
  );
}
