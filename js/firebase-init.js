import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Initialized once here and imported everywhere else that needs Firebase
// (tags-store.js, orders-store.js, admin.js) — avoids the "Firebase app
// already initialized" error that happens if two files each call
// initializeApp() with the same config.

export let db = null;
export let auth = null;

if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}
