// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { normalizeString } = require("@utils/normaliceString");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.editsongs = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Método no permitido. Usa PUT." });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    try {
      const { id, genre, hit, energy } = req.body;
      if (!id) {
        return res.status(400).json({ error: "El campo 'id' es obligatorio." });
      }

      if (genre === undefined && hit === undefined && energy === undefined) {
        return res.status(400).json({
          error:
            "Debes proporcionar al menos uno de los campos: 'genre', 'hit', 'energy' para actualizar.",
        });
      }

      const songRef = db.collection("songs").doc(id);

      const songDoc = await songRef.get();
      if (!songDoc.exists) {
        return res.status(404).json({ error: "Canción no encontrada." });
      }

      const updateData = {};

      if (genre !== undefined) {
        if (typeof genre === "string") {
          updateData.genre = normalizeString(genre);
        } else {
          return res.status(400).json({
            error: "El campo 'genre' debe ser una cadena de texto.",
            ok: false,
          });
        }
      }

      if (hit !== undefined) {
        if (typeof hit === "number") {
          updateData.hit = hit;
        } else {
          return res
            .status(400)
            .json({ error: "El campo 'hit' debe ser un número.", ok: false });
        }
      }

      if (energy !== undefined) {
        if (typeof energy === "number") {
          updateData.energy = energy;
        } else {
          return res.status(400).json({
            error: "El campo 'energy' debe ser un número.",
            ok: false,
          });
        }
      }

      await songRef.update(updateData);
      const updatedSong = await songRef.get();

      return res.status(200).json({
        message: "Canción actualizada exitosamente.",
        data: updatedSong.data(),
        ok: true,
      });
    } catch (error) {
      console.error("Error al editar la canción:", error);
      return res
        .status(500)
        .json({ error: "Ocurrió un error al editar la canción." });
    }
  });
});
