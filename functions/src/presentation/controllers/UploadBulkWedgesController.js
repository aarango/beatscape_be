// functions/src/presentation/controllers/uploadBulk.js

const { onRequest } = require("firebase-functions/v2/https");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");
const cors = require("cors")({ origin: true });

const { UploadSongsUseCase } = require("@useCases/UploadSongsUseCase");
const { storage, db } = require("@infrastructure/data/firebase/FirebaseConfig");

/**
 * Función Cloud Function para subir múltiples canciones en bloque.
 * Endpoint: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/uploadBulk
 */
const uploadWedges = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 300,
    maxBytes: 900 * 1024 * 1024, // 100MB
  },
  async (req, res) => {
    cors(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Método no permitido. Usa POST.");
      }

      if (!req.headers["content-type"]?.startsWith("multipart/form-data")) {
        return res
          .status(400)
          .send("El encabezado 'Content-Type' debe ser 'multipart/form-data'.");
      }

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Autenticación requerida." });
      }

      const tmpdir = os.tmpdir();
      const busboy = Busboy({ headers: req.headers });
      let clientId;

      busboy.on("field", (fieldname, val) => {
        if (fieldname === "clientId") {
          clientId = val;
        }
      });

      if (!clientId) {
        return res.status(400).json({ error: "clientId es requerido." });
      }

      const uploads = [];

      busboy.on("file", (fieldname, file, { filename }) => {
        const filepath = path.join(tmpdir, filename);

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        const uploadPromise = new Promise((resolve, reject) => {
          file.on("end", () => {
            writeStream.end();
          });

          writeStream.on("close", async () => {
            try {
              if (!clientId) {
                throw new Error('Campo "clientId" es requerido.');
              }

              const uploadedFile = await UploadSongsUseCase({
                db,
                storage,
                song: {
                  title: filename,
                  path: filepath,
                },
                clientId,
              });

              console.log(`Archivo subido: ${uploadedFile}`);

              resolve({ filename, uploadedFile });
            } catch (error) {
              console.error(`Error subiendo archivo ${filename}:`, error);
              reject(error);
            } finally {
              fs.unlinkSync(filepath); // Eliminar archivo temporal
            }
          });

          writeStream.on("error", (error) => {
            console.error(`Error procesando archivo ${filename}:`, error);
            reject(error);
          });
        });

        uploads.push(uploadPromise);
      });

      busboy.on("finish", async () => {
        try {
          const uploadedFiles = await Promise.all(uploads);

          const processedSongs = [];
          const rejectedSongs = [];

          uploadedFiles.forEach((file) => {
            const { uploadedFile } = file;

            if (
              uploadedFile.processed &&
              Array.isArray(uploadedFile.processed)
            ) {
              uploadedFile.processed.forEach((song) => {
                processedSongs.push({
                  ...song,
                });
              });
            }

            if (uploadedFile.repeats && Array.isArray(uploadedFile.repeats)) {
              uploadedFile.repeats.forEach((song) => {
                rejectedSongs.push({
                  ...song,
                });
              });
            }
          });

          res.status(200).send({
            message: `Se procesaron ${uploadedFiles.length} archivo(s) correctamente.`,
            processed: processedSongs,
            rejected: rejectedSongs,
          });
        } catch (error) {
          console.error("Error al procesar archivos:", error);
          res.status(500).send({
            message: "Error interno al procesar la solicitud.",
            error: error.message,
          });
        }
      });

      busboy.on("error", (error) => {
        console.error("Error en Busboy:", error);
        res.status(500).send("Error procesando la solicitud.");
      });

      busboy.end(req.rawBody);
    });
  },
);

module.exports = { uploadWedges };
