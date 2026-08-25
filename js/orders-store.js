import { db } from "./firebase-init.js";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, orderBy, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// The stages an order moves through, in order. Shown identically in the
// customer-facing tracker and the admin panel so both always agree.
export const ORDER_STAGES = [
  { id: "placed", label: "Order Placed", customerNote: "We've received your order and it's in the queue." },
  { id: "payment_confirmed", label: "Payment Confirmed", customerNote: "Payment received — your order is confirmed." },
  { id: "processing", label: "Card Being Made", customerNote: "Your tag is being produced right now." },
  { id: "shipped", label: "Shipped", customerNote: "Your tag is on its way to you." },
  { id: "delivered", label: "Delivered", customerNote: "Delivered! Enjoy your new tag." },
];

export function stageIndex(statusId) {
  const i = ORDER_STAGES.findIndex((s) => s.id === statusId);
  return i === -1 ? 0 : i;
}

export function ordersBackendAvailable() {
  return !!db;
}

function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `NX-${code}`;
}

// Anyone can call this (no sign-in needed) — matches the Firestore rule
// that allows public "create" on the orders collection. Returns the
// generated order ID so the caller can show/email it to the customer.
export async function submitOrder(order) {
  if (!db) throw new Error("Backend isn't set up yet.");
  const orderId = generateOrderId();
  await setDoc(doc(db, "orders", orderId), {
    ...order,
    orderId,
    status: "placed",
    createdAt: serverTimestamp(),
    statusUpdatedAt: serverTimestamp(),
  });
  return orderId;
}

// Public lookup by exact order ID — matches the Firestore rule that
// allows "get" (single document) for anyone, while still blocking "list"
// (browsing/querying every order) to non-admins. Returns null if not found.
export async function getOrderById(orderId) {
  if (!db) return null;
  const snap = await getDoc(doc(db, "orders", orderId.trim().toUpperCase()));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Admin-only in practice (Firestore rules require sign-in for updates).
export async function updateOrderStatus(orderId, status) {
  if (!db) throw new Error("Backend isn't set up yet.");
  await updateDoc(doc(db, "orders", orderId), { status, statusUpdatedAt: serverTimestamp() });
}

// Admin-only in practice (Firestore rules block listing for anyone not
// signed in) — calls onChange(orders) once immediately and again on every
// new order or status change.
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
