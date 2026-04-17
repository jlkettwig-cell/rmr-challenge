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

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 🔐 Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 📱 Mobile erkennen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
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

  // 📱 Expand / Collapse
  const toggleExpand = (i) => {
    if (!isMobile) return;
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  // 🧹 Modal öffnen
  const confirmDelete = (index) => {
    if (!isAdmin) return;
    setDeleteIndex(index);
  };

  // 🧹 Löschen ausführen
  const handleDelete = async () => {
    if (deleteIndex === null) return;

    const updated = players.filter((_, i) => i !== deleteIndex);
    await save(updated);

    setDeleteIndex(null);
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
      <h1 style={{ marginBottom: 10 }}>🏆 Richimountain Runners Challenge</h1>

      {!user && <a href="/admin" style={{ color: "#f97316" }}>Login</a>}

      {/* ➕ Spieler hinzufügen */}
      {isAdmin && (
        <div style={{ marginBottom: 20 }}>
          
<input
  value={newName}
  onChange={(e) => setNewName(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      addPlayer();
    }
  }}
  placeholder="Neuer Teilnehmer"
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
        const isOpen = isMobile ? expandedIndex === i : true;

        return (
          <div key={i} style={{
            background: done ? "#facc15" : "#1e293b",
            padding: 15,
            marginBottom: 12,
            borderRadius: 16,
            position: "relative"
          }}>
            {/* Klickbereich */}
            <div
              onClick={() => toggleExpand(i)}
              style={{ cursor: isMobile ? "pointer" : "default" }}
            >
              <div style={{ fontSize: 18 }}>
                {done && "👑 "} {p.name}

                {/* 🔽 Pfeil */}
                {isMobile && (
  <span style={{
    float: "right",
    marginRight: isAdmin ? 30 : 0, // 🔥 Platz für ❌
    fontSize: 14
  }}>
    {isOpen ? "▲" : "▼"}
  </span>
)}
              </div>

              <div style={{ marginBottom: 8 }}>
                {score}/{states.length}
              </div>

              {/* Fortschrittsbalken */}
              <div style={{
                height: 8,
                background: "#334155",
                borderRadius: 10
              }}>
                <div style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "#22c55e",
                  borderRadius: 10,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            {/* Details */}
            <div style={{
              maxHeight: isOpen ? 500 : 0,
              overflow: "hidden",
              transition: "all 0.3s ease"
            }}>
              <div style={{ marginTop: 10 }}>

                {/* 🧹 Löschen */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(i);
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 5,
                      top: 8,
                      background: "transparent",
                      border: "none",
                      color: "#f87171",
                      cursor: "pointer",
                      fontSize: 18
                    }}
                  >
                    ✕
                  </button>
                )}

                {/* Checkboxen */}
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
                        onChange={(e) => {
                          e.stopPropagation();
                          toggle(i, j);
                        }}
                        style={{ marginRight: 5 }}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 🪟 MODAL */}
      {deleteIndex !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#1e293b",
            padding: 20,
            borderRadius: 16,
            width: "90%",
            maxWidth: 400,
            textAlign: "center"
          }}>
            <h3 style={{ marginBottom: 10 }}>
              Spieler löschen?
            </h3>

            <p style={{ marginBottom: 20, color: "#94a3b8" }}>
              {players[deleteIndex]?.name}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteIndex(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  background: "#334155",
                  color: "white",
                  border: "none"
                }}
              >
                Abbrechen
              </button>

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  background: "#ef4444",
                  color: "white",
                  border: "none"
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
