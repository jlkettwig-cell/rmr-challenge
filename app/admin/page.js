"use client";

import { signInWithRedirect } from "firebase/auth";
import { auth, provider } from "../../utils/firebase";

export default function Admin() {

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
