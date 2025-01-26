/**
 * Sube un archivo al bucket y lo hace público.
 *
 * @param {object} storage - Instancia de Firebase Storage.
 * @param {string} localPath - Ruta del archivo local.
 * @param {string} destinationPath - Ruta destino en el bucket.
 * @param {string} contentType - Tipo MIME del archivo.
 * @returns {Promise<string>} URL pública del archivo subido.
 */
async function uploadFile(
  storage,
  localPath,
  destinationPath,
  contentType = "audio/mpeg",
) {
  try {
    const bucket = storage.bucket();
    const [uploadedFile] = await bucket.upload(localPath, {
      destination: destinationPath,
      contentType,
      public: true,
    });

    await uploadedFile.makePublic();

    await uploadedFile.makePublic();
    const publicUrl = uploadedFile.publicUrl();
    return publicUrl;
  } catch (error) {
    console.error("Error en uploadFile:", error);
    throw error;
  }
}

module.exports = { uploadFile };
