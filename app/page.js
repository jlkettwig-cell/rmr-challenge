"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const states = [
  "Burgenland","Kärnten","Niederösterreich","Oberösterreich",
  "Salzburg","Steiermark","Tirol","Vorarlberg","Wien","Bayern"
];

const ADMIN_EMAIL = "jlkettwig@gmail.com";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [newName, setNewName] = useState("");

  // 🔐 Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔄 Firestore
  useEffect(() => {
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

  // ➕ Spieler hinzufügen
  const addPlayer = async () => {
    if (!newName.trim()) return;

    const newPlayer = {
      name: newName,
      progress: Array(states.length).fill(false)
    };

    await save([...players, newPlayer], history);
    setNewName("");
  };

  // ✅ Checkbox toggle
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
          state: states[j]
        },
        ...history
      ];
    }

    save(copy, newHistory);
  };

  const getScore = (p) => p.progress.filter(Boolean).length;
  const sorted = [...players].sort((a, b) => getScore(b) - getScore(a));

  return (
    <div style={{
      padding: 20,
      background: "#0f172a",
      minHeight: "100vh",
      color: "white",
      fontFamily: "Arial"
    }}>
      <h1 style={{ marginBottom: 10 }}>🏆 Leaderboard</h1>

      {!user && <a href="/admin" style={{ color: "#f97316" }}>Login</a>}
      {user && <p style={{ color: "#94a3b8" }}>{user.email}</p>}

      {/* ➕ Spieler hinzufügen */}
      {isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Neuer Spieler"
            style={{
              padding: 12,
              marginRight: 10,
              borderRadius: 10,
              border: "none"
            }}
          />
          <button
            onClick={addPlayer}
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#f97316",
              color: "white",
              border: "none"
            }}
          >
            ➕
          </button>
        </div>
      )}

      {/* 🏆 Leaderboard */}
      {sorted.map((p, i) => {
        const score = getScore(p);
        const done = score === states.length;

        return (
          <div key={i} style={{
            background: done ? "#facc15" : "#1e293b",
            padding: 15,
            marginBottom: 12,
            borderRadius: 16
          }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              {done && "👑 "} {p.name}
            </div>

            <div style={{ marginBottom: 8 }}>
              {score}/{states.length}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {states.map((s, j) => (
                <label key={j} style={{
                  background: p.progress[j] ? "#22c55e" : "#334155",
                  padding: "6px 10px",
                  borderRadius: 8,
                  fontSize: 12
                }}>
                  <input
                    type="checkbox"
                    checked={p.progress[j]}
                    disabled={!isAdmin}
                    onChange={() => toggle(i, j)}
                    style={{ marginRight: 5 }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {/* 📜 Verlauf */}
      <h2 style={{ marginTop: 30 }}>📜 Verlauf</h2>
      {history.map((h, i) => (
        <div key={i} style={{ color: "#94a3b8" }}>
          {h.name} → {h.state}
        </div>
      ))}
    </div>
  );
}
