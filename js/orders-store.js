import { db } from "./firebase-init.js";
import {
  collection, addDoc, serverTimestamp, query, orderBy, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function ordersBackendAvailable() {
  return !!db;
}

// Anyone can call this (no sign-in needed) — matches the Firestore rule
// that allows public "create" on the orders collection but restricts
// "read" to signed-in admins. See README's Firestore rules block.
export async function submitOrder(order) {
  if (!db) throw new Error("Backend isn't set up yet.");
  await addDoc(collection(db, "orders"), { ...order, createdAt: serverTimestamp() });
}

// Admin-only in practice (Firestore rules block this read for anyone not
// signed in) — calls onChange(orders) once immediately and again on every
// new order.
export function subscribeOrders(onChange) {
  if (!db) {
    onChange([]);
    return () => {};
  }
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("Firestore orders listener failed:", err);
      onChange([]);
    }
  );
}
