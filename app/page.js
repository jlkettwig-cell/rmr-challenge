"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const states = ["Burgenland","Kärnten","Niederösterreich","Oberösterreich","Salzburg","Steiermark","Tirol","Vorarlberg","Wien","Bayern"];

const ADMIN_EMAIL = "jlkettwig@gmail.com";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      console.log("USER LOGGED IN:", currentUser.email);
      setUser(currentUser);
    } else {
      setUser(null);
    }
  });

  return () => unsubscribe();
}, []);

    const unsub = onSnapshot(doc(db, "leaderboard", "data"), (snap) => {
      if (snap.exists()) {
        setPlayers(snap.data().players || []);
        setHistory(snap.data().history || []);
      }
    });

    return () => unsub();
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const save = async (playersData, historyData) => {
    await setDoc(doc(db, "leaderboard", "data"), {
      players: playersData,
      history: historyData
    });
  };

  const toggle = (i, j) => {
    if (!isAdmin) return;

    const copy = [...players];
    const wasChecked = copy[i].progress[j];
    copy[i].progress[j] = !wasChecked;

    let newHistory = history;

    if (!wasChecked) {
      newHistory = [
        {
          name: copy[i].name || "Unbekannt",
          state: states[j],
          time: Date.now()
        },
        ...history
      ];
    }

    save(copy, newHistory);
  };

  const getScore = (p) => p.progress.filter(Boolean).length;

  const sorted = [...players].sort((a,b)=>getScore(b)-getScore(a));

  return (
    <div style={{ padding: 20 }}>
      <h1>🏆 Leaderboard</h1>

      {!user && <a href="/admin">Login</a>}
      {user && <p>{user.email}</p>}

      {sorted.map((p, i) => {
        const score = getScore(p);
        const done = score === states.length;

        return (
          <div key={i} style={{
            background: done ? "#ffe680" : "#fff",
            padding: 10,
            marginBottom: 10,
            borderRadius: 10
          }}>
            <b>{done && "👑 "}{p.name}</b> ({score}/10)

            <div>
              {states.map((s, j) => (
                <label key={j} style={{ marginRight: 10 }}>
                  <input
                    type="checkbox"
                    checked={p.progress[j]}
                    disabled={!isAdmin}
                    onChange={() => toggle(i, j)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <h2>📜 Verlauf</h2>
      {history.map((h, i) => (
        <div key={i}>
          {h.name} → {h.state} ({new Date(h.time).toLocaleString()})
        </div>
      ))}
    </div>
  );
}
