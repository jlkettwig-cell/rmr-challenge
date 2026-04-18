"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc
} from "firebase/firestore";

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

  // 🔄 Firestore (NEU!)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "leaderboard", "players"),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(list);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    setExpandedId(null);
  }, [players]);

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  // ➕ Teilnehmer hinzufügen
  const addPlayer = async () => {
    if (!newName.trim()) {
      alert("Bitte Namen eingeben");
      return;
    }

    if (players.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      alert("Teilnehmer existiert bereits");
      return;
    }

    const newId = crypto.randomUUID();

    await setDoc(
      doc(db, "leaderboard", "players", newId),
      {
        name: newName,
        progress: Array(states.length).fill(false)
      }
    );

    setNewName("");
  };

  // ✏️ Edit starten
  const startEdit = (p) => {
    if (!isAdmin) return;
    setEditingId(p.id);
    setEditName(p.name);
  };

  // 💾 Edit speichern
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

    await setDoc(
      doc(db, "leaderboard", "players", editingId),
      { name: editName },
      { merge: true }
    );

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
    if (!deleteId) return;

    await deleteDoc(
      doc(db, "leaderboard", "players", deleteId)
    );

    setDeleteId(null);
  };

  // ✅ Fortschritt
  const toggle = async (id, j) => {
    if (!isAdmin) return;

    const player = players.find(p => p.id === id);
    if (!player) return;

    const newProgress = [...player.progress];
    newProgress[j] = !newProgress[j];

    await setDoc(
      doc(db, "leaderboard", "players", id),
      { progress: newProgress },
      { merge: true }
    );
  };

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
            {isAdmin && (
              <button
                onClick={() => confirmDelete(p.id)}
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  background: "transparent",
                  border: "none",
                  color: "#f87171"
                }}
              >
                ✕
              </button>
            )}

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

      {deleteId && (
        <div>
          <p>{players.find(p => p.id === deleteId)?.name}</p>
          <button onClick={() => setDeleteId(null)}>Abbrechen</button>
          <button onClick={handleDelete}>Löschen</button>
        </div>
      )}
    </div>
  );
}
