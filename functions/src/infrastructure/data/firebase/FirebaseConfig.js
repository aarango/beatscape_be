// functions/src/infrastructure/data/firebase/FirebaseConfig.js

const {
  initializeApp,
  applicationDefault,
  getApps,
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

let db;
let storage;
let auth;

/**
 * Inicializa Firebase Admin SDK solo una vez y exporta las instancias.
 */
function initFirebase() {
  if (!getApps().length) {
    try {
      initializeApp({
        credential: applicationDefault(),
        storageBucket: "beatscape-ae003.firebasestorage.app", // Reemplaza con tu bucket de Storage
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      throw new Error("Failed to initialize Firebase Admin SDK.");
    }
  } else {
    console.log("Firebase Admin SDK already initialized.");
  }

  auth = getAuth();
  db = getFirestore();
  storage = getStorage();

  db.settings({
    ignoreUndefinedProperties: true,
  });

  if (process.env.NODE_ENV === "development") {
    db.useEmulator("localhost", 8080);
    auth.useEmulator("http://localhost:9099");
    storage.useEmulator("localhost", 9199);
    console.log("Firebase emulators are active.");
  }

  return { db, auth, FieldValue, storage };
}

initFirebase();

module.exports = { db, auth, FieldValue, storage };
