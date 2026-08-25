// ============================================================
// Paste your Firebase project's config here (Firebase console ->
// Project settings (gear icon) -> General -> "Your apps" -> the web
// app's config object). See README.md for the full setup walkthrough.
// ============================================================

export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

export function isFirebaseConfigured() {
  return typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.startsWith("AIza");
}
