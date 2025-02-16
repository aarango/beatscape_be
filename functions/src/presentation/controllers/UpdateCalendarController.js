// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.updateCalendar = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const { calendar, clientId } = req.body;

      if (!calendar || !clientId) {
        return res.status(400).json({
          error: "invalid-argument",
          message: "El calendario y el clientId son necesarios.",
        });
      }

      const enterpriseCalendarRef = db
        .collection(`enterprises/${clientId}/calendars`)
        .doc("default"); // Usa "default" o el id que prefieras para el documento
      await enterpriseCalendarRef.set({ calendar });

      // Actualizar el calendario en cada headquarters
      const headquartersRef = db.collection(
        `enterprises/${clientId}/headquarters`,
      );
      const headquartersSnapshot = await headquartersRef.get();

      const updatePromises = headquartersSnapshot.docs.map((doc) =>
        doc.ref.collection("calendars").doc("default").set({ calendar }),
      );

      await Promise.all(updatePromises);

      return res.status(200).json({
        message: "Calendario actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar calendario:", error);
      return res
        .status(500)
        .json({ error: "Ocurrió un error al actualizar calendario." });
    }
  });
});
