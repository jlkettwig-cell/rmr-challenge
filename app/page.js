"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
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

  // 🔄 Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "players"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(list);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setExpandedId(null);
  }, [players]);

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  // ➕ Add
  const addPlayer = async () => {
    if (!isAdmin) return;

    if (!newName.trim()) {
      alert("Bitte Namen eingeben");
      return;
    }

    if (players.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      alert("Teilnehmer existiert bereits");
      return;
    }

    const newId = crypto.randomUUID();

    await setDoc(doc(db, "players", newId), {
      name: newName,
      progress: Array(states.length).fill(false)
    });

    setNewName("");
  };

  // ✏️ Edit
  const startEdit = (p) => {
    if (!isAdmin) return;
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = async () => {
    if (!isAdmin || isSaving || !editName.trim()) return;

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
      doc(db, "players", editingId),
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
    if (!isAdmin || !deleteId) return;

    await deleteDoc(doc(db, "players", deleteId));
    setDeleteId(null);
  };

  // ✅ Progress
  const toggle = async (id, j) => {
    if (!isAdmin) return;

    const player = players.find(p => p.id === id);
    if (!player) return;

    const newProgress = [...player.progress];
    newProgress[j] = !newProgress[j];

    await setDoc(
      doc(db, "players", id),
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

      {/* Status */}
      {user && (
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          {user.email}
          {isAdmin && <span style={{ color: "#facc15" }}> 👑 Admin</span>}
        </div>
      )}

      {/* Logout */}
      {user && (
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          <button
            onClick={async () => {
              await signOut(auth);
              window.location.href = "/";
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#ef4444",
              color: "white",
              cursor: "pointer"
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 30 }}>
        <div>👥 {totalPlayers}</div>
        <div>🏁 {finishedPlayers}</div>
      </div>

      {!user && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <a href="/admin" style={{ color: "#f97316" }}>
            🔐 Login
          </a>
        </div>
      )}

      {/* Add */}
      {isAdmin && (
        <div style={{ marginTop: 10 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPlayer();
            }}
            placeholder="Neuer Teilnehmer"
          />
          <button onClick={addPlayer}>➕</button>
        </div>
      )}

      {/* Liste */}
      {sorted.map((p) => {
        const score = getScore(p);
        const percent = Math.round((score / states.length) * 100);
        const done = score === states.length;
        const isOpen = isMobile ? expandedId === p.id : true;

        return (
          <div key={p.id} style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 10,
            background: done ? "#facc15" : "#1e293b",
            color: done ? "#000" : "white",
            position: "relative"
          }}>

            {/* Delete */}
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

            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
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
                    style={{
                      padding: "4px 6px",
                      borderRadius: 6,
                      border: "none"
                    }}
                  />
                ) : (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(p);
                    }}
                    style={{ cursor: isAdmin ? "pointer" : "default" }}
                  >
                    {done && "👑 "}
                    {p.name} • {score}/{states.length}
                  </span>
                )}
              </div>

              {isMobile && (
                <span
                  onClick={() => toggleExpand(p.id)}
                  style={{
                    marginRight: isAdmin ? 30 : 0,
                    cursor: "pointer"
                  }}
                >
                  {isOpen ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* Progress */}
            <div style={{
              height: 8,
              background: "#334155",
              borderRadius: 10,
              marginTop: 6
            }}>
              <div style={{
                width: `${percent}%`,
                height: "100%",
                background: done ? "#eab308" : "#22c55e",
                borderRadius: 10
              }} />
            </div>

            {/* States */}
            {isOpen && (
              <div style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 8
              }}>
                {states.map((s, j) => (
                  <label
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      whiteSpace: "nowrap",
                      background: p.progress[j] ? "#22c55e" : "#334155",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      color: p.progress[j] ? "black" : "white",
                      gap: 6
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={p.progress[j]}
                      disabled={!isAdmin}
                      style={{ accentColor: "#22c55e", flexShrink: 0 }}
                      onChange={() => toggle(p.id, j)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* DELETE MODAL */}
      {deleteId && (
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
            <h3>Spieler löschen?</h3>

            <p style={{ margin: "10px 0", color: "#94a3b8" }}>
              {players.find(p => p.id === deleteId)?.name}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: 8
                }}
              >
                Abbrechen
              </button>

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 8
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
