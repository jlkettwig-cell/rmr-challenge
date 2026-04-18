"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../utils/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const states = [
  "Burgenland","Kärnten","Niederösterreich","Oberösterreich",
  "Salzburg","Steiermark","Tirol","Vorarlberg","Wien","Bayern"
];

const ADMIN_EMAILS = ["jlkettwig@gmail.com"];

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 🔐 Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 📱 Mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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

  useEffect(() => {
    setExpandedId(null);
  }, [players]);

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  const save = async (playersData) => {
    await setDoc(
      doc(db, "leaderboard", "data"),
      { players: playersData },
      { merge: true }
    );
  };

  // ➕ Add
  const addPlayer = async () => {
    if (!newName.trim()) {
      alert("Bitte Namen eingeben");
      return;
    }

    if (players.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      alert("Spieler existiert bereits");
      return;
    }

    const newPlayer = {
      id: crypto.randomUUID(),
      name: newName,
      progress: Array(states.length).fill(false)
    };

    await save([...players, newPlayer]);
    setNewName("");
  };

  // ✏️ Edit
  const startEdit = (p) => {
    if (!isAdmin) return;
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = async () => {
    if (isSaving) return;
    if (!editName.trim()) return;

    setIsSaving(true);

    if (players.some(p =>
      p.name.toLowerCase() === editName.toLowerCase() &&
      p.id !== editingId
    )) {
      alert("Name existiert bereits");
      setIsSaving(false);
      return;
    }

    const updated = players.map(p =>
      p.id === editingId ? { ...p, name: editName } : p
    );

    await save(updated);

    setEditingId(null);
    setEditName("");
    setIsSaving(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // 📱 Expand
  const toggleExpand = (id) => {
    if (!isMobile) return;
    setExpandedId(expandedId === id ? null : id);
  };

  // 🧹 Delete
  const confirmDelete = (id) => {
    if (!isAdmin) return;
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    const updated = players.filter(p => p.id !== deleteId);
    await save(updated);
    setDeleteId(null);
  };

  // ✅ Progress
  const toggle = (id, j) => {
    if (!isAdmin) return;

    const updated = players.map(p => {
      if (p.id !== id) return p;

      const copy = [...p.progress];
      copy[j] = !copy[j];

      return { ...p, progress: copy };
    });

    save(updated);
  };

  // 🔒 sicherer Score
  const getScore = (p) =>
    Array.isArray(p.progress)
      ? p.progress.filter(Boolean).length
      : 0;

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const diff = getScore(b) - getScore(a);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  const totalPlayers = players.length;
  const finishedPlayers = players.filter(
    p => getScore(p) === states.length
  ).length;

  return (
    <div style={{
      padding: 20,
      background: "#0f172a",
      minHeight: "100vh",
      color: "white"
    }}>
      <h1>🏆 Richimountain Runners Challenge</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: 30 }}>
        <div>👥 {totalPlayers}</div>
        <div>🏁 {finishedPlayers}</div>
      </div>

      {!user && <a href="/admin">Login</a>}

      {isAdmin && (
        <div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addPlayer();
                e.target.blur();
              }
            }}
            placeholder="Neuer Teilnehmer"
          />
          <button onClick={addPlayer}>➕</button>
        </div>
      )}

      {sorted.map((p) => {
        const score = getScore(p);
        const percent = Math.round((score / states.length) * 100);
        const isOpen = isMobile ? expandedId === p.id : true;

        return (
          <div key={p.id} style={{
            marginBottom: 12,
            position: "relative",
            padding: 10,
            background: "#1e293b",
            borderRadius: 10
          }}>

            {/* ❌ Delete oben rechts */}
            {isAdmin && (
              <button
                onClick={() => confirmDelete(p.id)}
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {editingId === p.id ? (
                <input
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={() => {
                    if (editingId === p.id && editName.trim() && !isSaving) {
                      saveEdit();
                    }
                  }}
                />
              ) : (
                <span onClick={(e) => {
                  e.stopPropagation();
                  startEdit(p);
                }}>
                  {p.name} • {score}/{states.length} ({percent}%)
                </span>
              )}

              {isMobile && (
                <span onClick={() => toggleExpand(p.id)}>
                  {isOpen ? "▲" : "▼"}
                </span>
              )}
            </div>

            {isOpen && (
              <div>
                {states.map((s, j) => (
                  <label key={j} style={{ marginRight: 8 }}>
                    <input
                      type="checkbox"
                      checked={p.progress[j]}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggle(p.id, j);
                      }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {deleteId !== null && (
        <div>
          <p>{players.find(p => p.id === deleteId)?.name}</p>
          <button onClick={() => setDeleteId(null)}>Abbrechen</button>
          <button onClick={handleDelete}>Löschen</button>
        </div>
      )}
    </div>
  );
}
