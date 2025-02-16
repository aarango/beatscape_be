// functions/src/presentation/controllers/getSong.js

const { Song } = require("@entities/Songs");
const { db } = require("@infrastructure/data/firebase/FirebaseConfig");
const { onRequest } = require("firebase-functions/v2/https");

const Joi = require("joi");
const cors = require("cors")({ origin: true });

/**
 * Función Cloud Function para obtener canciones paginadas desde Firestore.
 * Endpoint: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/getSong
 */
const getSongs = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido. Usa GET." });
      }

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Autenticación requerida." });
      }

      // Validación de datos
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
        const searchValueRaw = valueParts.join(":").trim();

        const allowedFields = Song.allowedSearchFields;

        if (!allowedFields.hasOwnProperty(field)) {
          return res
            .status(400)
            .json({ error: `Campo de búsqueda inválido: ${field}` });
        }

        if (!searchValueRaw) {
          console.log("Formato de búsqueda inválido. Esperado: 'campo:valor'");
          return res.status(400).json({
            error: "Formato de búsqueda inválido. Esperado: 'campo:valor'",
          });
        }

        const fieldType = allowedFields[field];
        let searchValue;

        switch (fieldType) {
          case "number":
            searchValue = Number(searchValueRaw);
            if (isNaN(searchValue)) {
              return res.status(400).json({
                error: `El valor para el campo ${field} debe ser un número.`,
              });
            }
            break;
          case "boolean":
            if (searchValueRaw.toLowerCase() === "true") {
              searchValue = true;
            } else if (searchValueRaw.toLowerCase() === "false") {
              searchValue = false;
            } else {
              return res.status(400).json({
                error: `El valor para el campo ${field} debe ser 'true' o 'false'.`,
              });
            }
            break;
          case "string":
            searchValue = searchValueRaw;
            break;
          default:
            console.log(`Tipo de campo no soportado: ${fieldType}`);
            return res
              .status(400)
              .json({ error: `Tipo de campo no soportado: ${fieldType}` });
        }

        // Aplicar filtros de búsqueda según el tipo de campo
        if (fieldType === "string") {
          ref = ref
            .where(field, ">=", searchValue)
            .where(field, "<=", searchValue + "\uf8ff");
          orderByField = field;
        } else {
          // Para campos numéricos o booleanos, usar igualdad
          ref = ref.where(field, "==", searchValue);
          orderByField = field;
        }
      }

      // Aplicar ordenamiento
      ref = ref.orderBy(orderByField, orderDirection);
      if (search) {
        if (orderByField !== "createdAt") {
          ref = ref.orderBy("createdAt", "desc");
        }
      }

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
        songs.push({ ...doc.data(), id: doc.id });
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
