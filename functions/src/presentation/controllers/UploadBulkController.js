const { onRequest } = require("firebase-functions/v2/https");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");
const cors = require("cors")({ origin: true });
const {
  initFirebase,
} = require("@infrastructure/data/firebase/FirebaseConfig");
const {
  uploadFile,
} = require("@infrastructure/adapters/FirebaseStorageAdapter");
const { UploadSongsUseCase } = require("@useCases/UploadSongsUseCase");

const { storage, db } = initFirebase();

const uploadBulk = onRequest(async (req, res) => {
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

    const tmpdir = os.tmpdir();
    const busboy = Busboy({ headers: req.headers });

    const uploads = []; // Lista para almacenar promesas de subida

    busboy.on("file", (fieldname, file, { filename, mimetype }) => {
      const filepath = path.join(tmpdir, filename);

      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      const uploadPromise = new Promise((resolve, reject) => {
        file.on("end", () => {
          writeStream.end();
        });

        writeStream.on("close", async () => {
          try {
            const destinationPath = `songs/${filename}`;

            const publicUrl = await uploadFile(
              storage,
              filepath,
              destinationPath,
              mimetype || "audio/mpeg",
            );

            const uploadedFile = await UploadSongsUseCase({
              db,
              song: {
                title: filename,
                filePath: publicUrl,
                mimeType: mimetype,
                path: filepath,
              },
            });

            console.log(`Archivo uploadedFile : ${uploadedFile}`);

            resolve({ filename, url: publicUrl });
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

        res.status(200).send({
          message: `Se subieron ${uploadedFiles.length} archivo(s) correctamente.`,
          files: uploadedFiles,
        });
      } catch (error) {
        console.error("Error al procesar archivos:", error);
        res.status(500).send("Error interno al procesar la solicitud.");
      }
    });

    busboy.on("error", (error) => {
      console.error("Error en Busboy:", error);
      res.status(500).send("Error procesando la solicitud.");
    });

    busboy.end(req.rawBody);
  });
});

module.exports = { uploadBulk };
