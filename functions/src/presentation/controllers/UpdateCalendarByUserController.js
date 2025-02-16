// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.updateCalendarByUser = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Método no permitido. Usa PUT." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const { calendar, clientId, userId } = req.body;

      if (!calendar || !clientId || !userId) {
        return res.status(400).json({
          error: "invalid-argument",
          message: "El calendario, clientId y userId son necesarios.",
        });
      }

      // Guardar el calendario para un usuario específico en su headquarters
      const userCalendarRef = db
        .collection(`enterprises/${clientId}/headquarters/${userId}/calendars`)
        .doc("default");

      await userCalendarRef.set({ calendar });

      return res.status(200).json({
        message: "Calendario del usuario actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar calendario para el usuario:", error);
      return res.status(500).json({
        error: "Ocurrió un error al actualizar calendario del usuario.",
      });
    }
  });
});
