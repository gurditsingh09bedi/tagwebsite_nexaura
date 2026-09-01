import { db } from "./firebase-init.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function offersBackendAvailable() {
  return !!db;
}

// Calls onChange(offers, isLive) once immediately and again on every
// change — same fallback-then-live pattern as tags/colorways/tiers.
export function subscribeOffers(onChange) {
  if (!db) {
    onChange(window.OFFERS, false);
    return () => {};
  }
  return onSnapshot(
    collection(db, "offers"),
    (snap) => {
      if (snap.empty) {
        onChange(window.OFFERS, false);
        return;
      }
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })), true);
    },
    (err) => {
      console.error("Firestore offers listener failed, using local defaults:", err);
      onChange(window.OFFERS, false);
    }
  );
}

export async function addOffer(offer) {
  if (!db) throw new Error("Backend isn't set up yet — see README.md.");
  await addDoc(collection(db, "offers"), { ...offer, createdAt: serverTimestamp() });
}

export async function updateOffer(id, data) {
  if (!db) throw new Error("Backend isn't set up yet — see README.md.");
  await updateDoc(doc(db, "offers", id), data);
}

export async function deleteOffer(id) {
  if (!db) throw new Error("Backend isn't set up yet — see README.md.");
  await deleteDoc(doc(db, "offers", id));
}

// Pure helper: picks the single best (highest %) active offer that this
// quantity qualifies for. A plain "25% off everyone" offer has
// minQuantity 1, so it always qualifies unless a better bulk offer (higher
// minQuantity, higher %) also qualifies at this quantity — in which case
// the bulk one wins since it's strictly better for the customer.
export function bestOfferFor(offers, quantity) {
  const applicable = (offers || []).filter(
    (o) => o.active !== false && quantity >= (o.minQuantity || 1)
  );
  if (!applicable.length) return null;
  return applicable.reduce((best, o) => (!best || o.percent > best.percent ? o : best), null);
}
