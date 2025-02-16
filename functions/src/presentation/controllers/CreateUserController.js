// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { normalizeString } = require("@utils/normaliceString");
const { db, auth } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.createUser = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Método no permitido. Usa PUT." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const {
        email,
        password,
        displayName,
        canUseMultimedia,
        clientId,
        clientInfo,
        username,
      } = req.body;

      if (
        !email ||
        !password ||
        !displayName ||
        canUseMultimedia === undefined ||
        !clientId ||
        !clientInfo
      ) {
        return res.status(400).json({
          error: "invalid-argument",
          message:
            "Email, password, displayName, clientId, and clientInfo are required.",
        });
      }

      if (!email.endsWith("@beatscape.com")) {
        return res.status(400).json({
          error: "invalid-argument",
          message: "Email must end with @beatscape.com.",
        });
      }

      // Validar que el email no exista
      const existingUserByEmail = await auth
        .getUserByEmail(email)
        .catch(() => null);
      if (existingUserByEmail) {
        return res.status(400).json({
          error: "email-already-in-use",
          message: "El email ya está registrado.",
        });
      }

      // Validar que el username no exista en la colección de headquarters
      const usernameSnapshot = await db
        .collection(`enterprises/${clientId}/headquarters`)
        .doc(username)
        .get();
      if (usernameSnapshot.exists) {
        return res.status(400).json({
          error: "username-already-in-use",
          message: "El nombre de usuario ya está registrado.",
        });
      }

      // Crear el usuario en Firebase Authentication
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      const customClaims = {
        clientId,
        clientInfo,
      };

      // Establecer custom claims para el usuario
      await auth.setCustomUserClaims(userRecord.uid, customClaims);

      // Crear documento del usuario en Firestore
      await db
        .collection(`enterprises/${clientId}/headquarters`)
        .doc(username)
        .set({
          email: userRecord.email,
          uid: userRecord.uid,
          username: normalizeString(username),
          displayName: userRecord.displayName,
          canUseMultimedia,
          createdAt: new Date(),
          status: true,
        });

      return res.status(200).json({
        message: "Usuario creado exitosamente.",
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return res
        .status(500)
        .json({ error: "Ocurrió un error al crear usuario." });
    }
  });
});
