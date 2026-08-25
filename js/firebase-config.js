// ============================================================
// Paste your Firebase project's config here (Firebase console ->
// Project settings (gear icon) -> General -> "Your apps" -> the web
// app's config object). See README.md for the full setup walkthrough.
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyDFnX4VZCNztUlGkQlAV4xZmDs2WMVX0lc",
  authDomain: "nexaura-tags.firebaseapp.com",
  projectId: "nexaura-tags",
  storageBucket: "nexaura-tags.firebasestorage.app",
  messagingSenderId: "125255888190",
  appId: "1:125255888190:web:dff5a397d15c45a46a906f",
};

export function isFirebaseConfigured() {
  return typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.startsWith("AIza");
}
