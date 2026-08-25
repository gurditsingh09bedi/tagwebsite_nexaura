import { db, auth } from "./firebase-init.js";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function backendAvailable() {
  return !!db;
}

// Calls onChange(tags, isLive) once immediately and again every time the
// tags collection changes. isLive tells the caller whether this came from
// Firestore (true) or the local js/data.js fallback (false).
export function subscribeTags(onChange) {
  if (!db) {
    onChange(window.TAGS, false);
    return () => {};
  }
  const q = query(collection(db, "tags"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onChange(window.TAGS, false);
        return;
      }
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })), true);
    },
    (err) => {
      console.error("Firestore tags listener failed, using local data instead:", err);
      onChange(window.TAGS, false);
    }
  );
}

export async function addTagRemote(tag) {
  if (!db) throw new Error("Backend isn't set up yet — see README.md.");
  await addDoc(collection(db, "tags"), { ...tag, createdAt: serverTimestamp() });
}

export async function deleteTagRemote(id) {
  if (!db) throw new Error("Backend isn't set up yet — see README.md.");
  await deleteDoc(doc(db, "tags", id));
}

export function signInAdmin(email, password) {
  if (!auth) return Promise.reject(new Error("Backend isn't set up yet — see README.md."));
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutAdmin() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
