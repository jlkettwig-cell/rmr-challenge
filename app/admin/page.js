"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../utils/firebase";

const ADMIN_EMAIL = "jlkettwig@gmail.com";

export default function Admin() {
  const login = async () => {
    const res = await signInWithPopup(auth, provider);

    if (res.user.email !== ADMIN_EMAIL) {
      alert("Kein Zugriff");
      await auth.signOut();
      return;
    }

    window.location.href = "/";
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🔐 Admin Login</h2>
      <button onClick={login}>Mit Google anmelden</button>
    </div>
  );
}
