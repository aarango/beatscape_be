const { Song } = require("@entities/Songs");
const {
  uploadFile,
} = require("@infrastructure/adapters/FirebaseStorageAdapter");
const { loadMusicMetadata } = require("music-metadata");

/**
 * Sube una canción al Storage, extrae metadata y la guarda en Firestore.
 *
 * @param {Object} params
 * @param {Object} params.storage - Instancia de Firebase Storage.
 * @param {Object} params.song - Entidad Song con título, filePath, etc.
 * @returns {Promise<Object>} - La entidad Song actualizada con metadata.
 */
async function UploadSongsUseCase({ song, db, storage }) {
  try {
    const destinationPath = `songs/${song.filename}`;

    const mm = await loadMusicMetadata();
    const metadata = await mm.parseFile(song.path);

    const meta = {
      common: { ...metadata.common },
      format: { ...metadata.format },
    };

    const picture = meta.common.picture?.at(0);

    const publicUrl = await uploadFile(
      storage,
      song.path,
      destinationPath,
      meta.format.container || "audio/mpeg",
    );

    const modelSong = new Song({
      title: metadata.common.title || "",
      artist: metadata.common.artist || "",
      genre: metadata.common.genre?.[0] || "",
      year: metadata.common.year || 0,
      bpm: metadata.common.bpm || 0,
      album: metadata.common.album || "",
      duration: metadata.format.duration || 0,
      bitrate: metadata.format.bitrate || 0,
      sampleRate: metadata.format.sampleRate || 0,
      picture: { image: picture?.data.toString("base64") ?? "", ...picture },
      url: publicUrl,
      lossless: metadata.format.lossless || false,
      numberOfSamples: metadata.format.numberOfSamples || 0,
    });

    const docRef = db.collection("songs").doc();
    const documentId = docRef.id;

    modelSong.id = documentId;

    await docRef.set({
      ...modelSong,
      id: documentId, 
      createdAt: new Date(),
    });

    console.log(`Canción guardada con ID: ${documentId}`);
    return { ...modelSong, id: documentId };
  } catch (error) {
    console.error("Error en UploadSongsUseCase:", error);
    throw error;
  }
}

module.exports = { UploadSongsUseCase };
