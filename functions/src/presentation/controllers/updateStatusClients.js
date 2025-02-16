// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.updateStatusClients = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Método no permitido. Usa PUT." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const { clientId, status } = req.body;

      if (clientId === undefined || status === undefined) {
        return res.status(400).json({
          error: "invalid-argument",
          message: "clientId y status son requeridos.",
        });
      }

      // Actualizar el estado del cliente
      const clientRef = db.collection("enterprises").doc(clientId);
      await clientRef.update({ status });

      // Actualizar el estado de todos los headquarters
      const headquartersRef = db.collection(
        `enterprises/${clientId}/headquarters`,
      );
      const headquartersSnapshot = await headquartersRef.get();

      const updatePromises = headquartersSnapshot.docs.map((doc) =>
        doc.ref.update({ status }),
      );

      await Promise.all(updatePromises);

      return res.status(200).json({
        message: "Estado del cliente y headquarters actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error al actualizar estado del cliente:", error);
      return res
        .status(500)
        .json({ error: "Ocurrió un error al actualizar el estado." });
    }
  });
});
