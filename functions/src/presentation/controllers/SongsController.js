// functions/src/presentation/controllers/getSong.js

const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const { onRequest } = require("firebase-functions/v2/https");

const Joi = require("joi"); // Para validación de parámetros
const cors = require("cors")({ origin: true }); // Para manejar CORS

/**
 * Función Cloud Function para obtener canciones paginadas desde Firestore.
 * Endpoint: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/getSong
 */
const getSongs = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Manejar solicitudes OPTIONS para CORS preflight
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET");
        res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.status(204).send("");
        return;
      }

      // Permitir solo solicitudes GET
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido. Usa GET." });
      }

      // Extraer el encabezado de autorización
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Autenticación requerida." });
      }

      //   const idToken = authHeader.split("Bearer ")[1];

      // Verificar el token con Firebase Auth
      //   let decodedToken;
      //   try {
      //     decodedToken = await auth.verifyIdToken(idToken);
      //   } catch (error) {
      //     console.error("Error verificando el token de autenticación:", error);
      //     return res
      //       .status(401)
      //       .json({ error: "Token de autenticación inválido." });
      //   }

      //   const uid = decodedToken.uid;

      // Opcional: Verificar permisos específicos del usuario
      // const userRecord = await admin.auth().getUser(uid);
      // if (!userRecord.customClaims || !userRecord.customClaims.admin) {
      //   return res.status(403).json({ error: "Acceso denegado." });
      // }

      // Validar y sanitizar los parámetros de consulta usando Joi
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(15),
      });

      const { error, value } = schema.validate(req.query);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { page, pageSize } = value;

      // Consulta para obtener el total de canciones usando la agregación count
      const countSnapshot = await db.collection("songs").count().get();
      const totalItems = countSnapshot.data().count;
      const totalPages = Math.ceil(totalItems / pageSize);

      // Validar que la página solicitada no exceda el total de páginas
      if (page > totalPages && totalPages !== 0) {
        return res.status(400).json({
          error: "El número de página excede el total de páginas disponibles.",
        });
      }

      // Definir la consulta para obtener las canciones de la página actual
      let songsQuery = db
        .collection("songs")
        .orderBy("createdAt", "desc") // Asegúrate de que cada documento tenga el campo 'createdAt'
        .limit(pageSize);

      if (page > 1) {
        // Calcular el punto de inicio usando startAfter
        // Para ello, necesitamos obtener el último documento de la página anterior
        const previousPages = page - 1;
        const previousLimit = previousPages * pageSize;

        const cursorSnapshot = await db
          .collection("songs")
          .orderBy("createdAt", "desc")
          .limit(previousLimit)
          .get();

        if (!cursorSnapshot.empty) {
          const lastVisible =
            cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
          songsQuery = db
            .collection("songs")
            .orderBy("createdAt", "desc")
            .startAfter(lastVisible)
            .limit(pageSize);
        }
      }

      const songsSnapshot = await songsQuery.get();

      const songs = [];
      songsSnapshot.forEach((doc) => {
        songs.push({ id: doc.id, ...doc.data() });
      });

      // Construir la respuesta
      const response = {
        data: songs,
        meta_data: {
          total_pages: totalPages,
          current_page: page,
          page_size: pageSize,
          total_items: totalItems,
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error obteniendo canciones:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  });
});

module.exports = { getSongs };
