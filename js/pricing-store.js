import { db } from "./firebase-init.js";
import { doc, setDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function pricingBackendAvailable() {
  return !!db;
}

// Calls onChange(colorwaysWithLivePrices) once immediately and again on
// every price change. Starts from the local js/data.js COLORWAYS as the
// base (name, description, colors, material — none of that is
// admin-editable) and overlays just the `price` field from Firestore
// wherever a document exists for that colorway's id.
export function subscribeColorwayPrices(onChange) {
  const base = window.COLORWAYS;
  if (!db) {
    onChange(base);
    return () => {};
  }
  return onSnapshot(
    collection(db, "colorways"),
    (snap) => {
      const overrides = {};
      snap.forEach((d) => { overrides[d.id] = d.data().price; });
      onChange(base.map((c) => (overrides[c.id] != null ? { ...c, price: overrides[c.id] } : c)));
    },
    (err) => {
      console.error("Firestore colorway-price listener failed, using local prices:", err);
      onChange(base);
    }
  );
}

export function subscribeTierPrices(onChange) {
  const base = window.TIERS;
  if (!db) {
    onChange(base);
    return () => {};
  }
  return onSnapshot(
    collection(db, "tiers"),
    (snap) => {
      const overrides = {};
      snap.forEach((d) => { overrides[d.id] = d.data().price; });
      onChange(base.map((t) => (overrides[t.id] != null ? { ...t, price: overrides[t.id] } : t)));
    },
    (err) => {
      console.error("Firestore tier-price listener failed, using local prices:", err);
      onChange(base);
    }
  );
}

// Admin-only in practice (Firestore rules require sign-in for writes).
export async function updateColorwayPrice(id, price) {
  if (!db) throw new Error("Backend isn't set up yet.");
  await setDoc(doc(db, "colorways", id), { price: Number(price) }, { merge: true });
}

export async function updateTierPrice(id, price) {
  if (!db) throw new Error("Backend isn't set up yet.");
  await setDoc(doc(db, "tiers", id), { price: Number(price) }, { merge: true });
}
