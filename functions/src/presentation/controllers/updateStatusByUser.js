const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.updateStatusByUser = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Método no permitido. Usa PUT." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const { clientId, userId, status } = req.body;

      if (
        clientId === undefined ||
        userId === undefined ||
        status === undefined
      ) {
        return res.status(400).json({
          error: "invalid-argument",
          message: "clientId, userId, y status son requeridos.",
        });
      }

      // Actualizar el estado de un usuario en headquarters
      const userRef = db
        .collection(`enterprises/${clientId}/headquarters`)
        .doc(userId);
      await userRef.update({ status });

      return res.status(200).json({
        message: "Estado del usuario actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar estado del usuario:", error);
      return res
        .status(500)
        .json({
          error: "Ocurrió un error al actualizar el estado del usuario.",
        });
    }
  });
});
