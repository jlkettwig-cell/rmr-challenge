"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db, auth } from "../utils/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const states = [
  "Burgenland","Kärnten","Niederösterreich","Oberösterreich",
  "Salzburg","Steiermark","Tirol","Vorarlberg","Wien","Bayern"
];

// 👥 mehrere Admins
const ADMIN_EMAILS = [
  "jlkettwig@gmail.com"
];

export default function Home() {
  const [players, setPlayers] = useState([]);
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
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  const save = async (playersData) => {
    await setDoc(doc(db, "leaderboard", "data"), {
      players: playersData
    });
  };

  // ➕ Spieler hinzufügen
  const addPlayer = async () => {
    if (!newName.trim()) return;

    const newPlayer = {
      name: newName,
      progress: Array(states.length).fill(false)
    };

    await save([...players, newPlayer]);
    setNewName("");
  };

  // 🧹 Spieler löschen
  const deletePlayer = async (index) => {
    if (!isAdmin) return;

    const updated = players.filter((_, i) => i !== index);
    await save(updated);
  };

  // ✅ Checkbox toggle
  const toggle = (i, j) => {
    if (!isAdmin) return;

    const copy = [...players];
    copy[i].progress[j] = !copy[i].progress[j];

    save(copy);
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
        const percent = (score / states.length) * 100;

        return (
          <div key={i} style={{
            background: done ? "#facc15" : "#1e293b",
            padding: 15,
            marginBottom: 12,
            borderRadius: 16,
            position: "relative"
          }}>
            {/* 🧹 Löschen */}
            {isAdmin && (
              <button
                onClick={() => deletePlayer(i)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            )}

            <div style={{ fontSize: 18, marginBottom: 6 }}>
              {done && "👑 "} {p.name}
            </div>

            <div style={{ marginBottom: 8 }}>
              {score}/{states.length}
            </div>

            {/* 📊 Fortschrittsbalken */}
            <div style={{
              height: 8,
              background: "#334155",
              borderRadius: 10,
              marginBottom: 10
            }}>
              <div style={{
                width: `${percent}%`,
                height: "100%",
                background: "#22c55e",
                borderRadius: 10
              }} />
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
    </div>
  );
}
