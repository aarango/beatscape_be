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

      // Validar y sanitizar los parámetros de consulta usando Joi
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(15),
        search: Joi.string().optional(),
      });

      const { error, value } = schema.validate(req.query);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { page, pageSize, search } = value;

      let ref = db.collection("songs");

      let orderByField = "createdAt";
      let orderDirection = "desc";

      if (search) {
        const [field, ...valueParts] = search.split(":");
        const searchValue = valueParts.join(":").trim();

        if (!searchValue) {
          return res.status(400).json({
            error: "Formato de búsqueda inválido. Esperado: 'campo:valor'",
          });
        }

        // Aplicar filtros de búsqueda
        ref = ref
          .where(field, ">=", searchValue)
          .where(field, "<=", searchValue + "\uf8ff");

        orderByField = field;
      }

      // Aplicar ordenamiento
      ref = ref.orderBy(orderByField, orderDirection);

      if (search) {
        ref = ref.orderBy("createdAt", "desc");
      }

      // Contar el total de elementos filtrados
      const countSnapshot = await ref.count().get();
      const totalItems = countSnapshot.data().count;
      const totalPages = Math.ceil(totalItems / pageSize);

      if (page > totalPages && totalPages !== 0) {
        return res.status(400).json({
          error: "El número de página excede el total de páginas disponibles.",
        });
      }

      let songsQuery = ref.limit(pageSize);

      if (page > 1) {
        // Calcular el punto de inicio usando startAfter
        const previousPages = page - 1;
        const previousLimit = previousPages * pageSize;

        const cursorSnapshot = await ref.limit(previousLimit).get();

        if (!cursorSnapshot.empty) {
          const lastVisible =
            cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
          songsQuery = ref.startAfter(lastVisible).limit(pageSize);
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
