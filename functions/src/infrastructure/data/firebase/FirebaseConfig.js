const {
  initializeApp,
  applicationDefault,
  getApps,
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

function initFirebase() {
  let adminApp;
  try {
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: applicationDefault(),
        storageBucket: "beatscape-ae003.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      adminApp = getApps()[0];
    }

    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);
    const storage = getStorage(adminApp);

    db.settings({
      ignoreUndefinedProperties: true,
    });

    if (process.env.NODE_ENV === "development") {
      db.useEmulator("localhost", 8080);
      auth.useEmulator("http://localhost:9099");
      storage.useEmulator("localhost", 9199);
    }

    return { db, auth, FieldValue, storage };
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw new Error("Failed to initialize Firebase Admin SDK.");
  }
}

module.exports = { initFirebase };
