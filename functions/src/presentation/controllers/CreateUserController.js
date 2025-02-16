// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { normalizeString } = require("@utils/normaliceString");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
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
        cliendId,
        cliendInfo,
        username,
      } = req.body;
      if (!id) {
        return res.status(400).json({ error: "El campo 'id' es obligatorio." });
      }

      if (
        !email ||
        !password ||
        !displayName ||
        !canUseMultimedia ||
        !cliendId ||
        !cliendInfo
      ) {
        return res.status(400).send({
          error: "invalid-argument",
          message: "Email, password, and mainPath are required.",
          success: false,
        });
      }

      if (!email.endsWith("@beatscape.com")) {
        return res.status(400).send({
          error: "invalid-argument",
          message: "Email must end with @beatscape.com.",
          success: false,
        });
      }

      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || "",
      });

      const customClaims = {
        cliendId: cliendId,
        cliendInfo: cliendInfo,
      };

      await auth.setCustomUserClaims(userRecord.uid, customClaims);

      await db
        .collection(`enterprises/${cliendId}/headquarters`)
        .doc(userRecord.uid)
        .set({
          email: userRecord.email,
          uid: userRecord.uid,
          username: normalizeString(username),
          displayName: userRecord.displayName,
          canUseMultimedia: canUseMultimedia,
          createdAt: new Date(),
          status: true,
        });

      return res.status(200).json({
        message: "Usuario  creado.",
        data: updatedSong.data(),
        ok: true,
      });
    } catch (error) {
      console.error("Error al editar creat:", error);
      return res.status(500).json({ error: "Ocurrió un error al creat." });
    }
  });
});
