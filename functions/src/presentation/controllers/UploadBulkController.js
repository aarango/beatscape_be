const { onRequest } = require("firebase-functions/v2/https");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");
const {
  initFirebase,
} = require("@infrastructure/data/firebase/FirebaseConfig");

const { storage } = initFirebase();

const uploadBulk = onRequest(async (req, res) => {
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

  // Estructuras para almacenar los archivos y campos procesados
  const uploads = {};
  const fields = {};
  const fileWrites = [];

  // Procesar campos no archivo
  busboy.on("field", (fieldname, val) => {
    console.log(`Campo procesado: ${fieldname} = ${val}`);
    fields[fieldname] = val;
  });

  // Procesar archivos subidos
  busboy.on("file", (fieldname, file, { filename, mimetype }) => {
    console.log("🚀 ~ busboy.on ~ mimetype:", mimetype);
    // if (mimetype !== "audio/mpeg") {
    //   console.warn(`Archivo ignorado: ${filename} (tipo no permitido)`);
    //   file.resume();
    //   return;
    // }

    console.log(`Procesando archivo: ${filename}`);
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = filepath;

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    const promise = new Promise((resolve, reject) => {
      file.on("end", () => {
        writeStream.end();
      });
      writeStream.on("close", resolve);
      writeStream.on("error", reject);
    });

    fileWrites.push(promise);
  });

  // Finalizar procesamiento de archivos
  busboy.on("finish", async () => {
    try {
      await Promise.all(fileWrites);

      const bucket = storage.bucket();
      const uploadedFiles = [];

      // Subir cada archivo procesado a Firebase Storage
      for (const fieldname in uploads) {
        const filepath = uploads[fieldname];
        const filename = path.basename(filepath);
        const destination = `songs/${filename}`;

        console.log(`Subiendo archivo a Storage: ${filename}`);
        const fileRef = bucket.file(destination);

        await fileRef.save(fs.readFileSync(filepath), {
          metadata: { contentType: "audio/mpeg" },
        });

        const [url] = await fileRef.getSignedUrl({
          action: "read",
          expires: "03-01-2030",
        });

        uploadedFiles.push({ filename, url });
        fs.unlinkSync(filepath); // Eliminar archivo temporal
      }

      res.status(200).send({
        message: `Se subieron ${uploadedFiles.length} archivo(s) correctamente.`,
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("Error al procesar archivos:", error);
      res.status(500).send("Error interno al procesar la solicitud.");
    }
  });

  // Manejo de errores en Busboy
  busboy.on("error", (error) => {
    console.error("Error en Busboy:", error);
    res.status(500).send("Error procesando la solicitud.");
  });

  busboy.end(req.rawBody);
});

module.exports = { uploadBulk };
