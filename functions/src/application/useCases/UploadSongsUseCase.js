const { Song } = require("@entities/Songs");
const crypto = require("crypto");
const {
  uploadFile,
} = require("@infrastructure/adapters/FirebaseStorageAdapter");
const { normalizeString } = require("@utils/normaliceString");
const { loadMusicMetadata } = require("music-metadata");

/**
 * Sube una canción al Storage, extrae metadata y la guarda en Firestore.
 *
 * @param {Object} params
 * @param {Object} params.storage - Instancia de Firebase Storage.
 * @param {Object} params.song - Entidad Song con título, filePath, etc.
 * @param {Object} params.db - Instancia de Firestore.
 * @returns {Promise<Object>} - Resultado con canciones procesadas y repeticiones.
 */
async function UploadSongsUseCase({ song, db, storage }) {
  const repeats = []; // Lista para canciones repetidas

  try {
    const destinationPath = `songs/${song.title}`;

    // Cargar metadata del archivo
    const mm = await loadMusicMetadata();
    const metadata = await mm.parseFile(song.path);

    const meta = {
      common: { ...metadata.common },
      format: { ...metadata.format },
    };

    const picture = meta.common.picture?.at(0);
    const pictureData = picture ? picture.data.toString("base64") : "";

    const generateSongHash = (title, artist, year) => {
      return crypto
        .createHash("sha256")
        .update(`${title}-${artist}-${year}`)
        .digest("hex");
    };

    const title = normalizeString(metadata.common.title || "");
    const artist = normalizeString(metadata.common.artist || "");
    const year = metadata.common.year || 0;

    const songHash = generateSongHash(title, artist, year);

    const modelSong = new Song({
      title: normalizeString(metadata.common.title || ""),
      artist: normalizeString(metadata.common.artist || ""),
      genre: normalizeString(metadata.common.genre?.[0] || ""),
      year: metadata.common.year || 0,
      bpm: metadata.common.bpm || 0,
      album: normalizeString(metadata.common.album || ""),
      duration: metadata.format.duration || 0,
      bitrate: metadata.format.bitrate || 0,
      sampleRate: metadata.format.sampleRate || 0,
      picture: picture ? { image: pictureData, ...picture } : { image: "" },
      filePath: song.filePath,
      lossless: metadata.format.lossless || false,
      numberOfSamples: metadata.format.numberOfSamples || 0,
      songHash: songHash,
    });

    const existingSongsSnapshot = await db
      .collection("songs")
      .where("songHash", "==", songHash)
      .limit(1)
      .get();

    if (!existingSongsSnapshot.empty) {
      console.warn(
        `Canción duplicada detectada: ${modelSong.title} por ${modelSong.artist}`,
      );
      repeats.push({
        ...modelSong,
        reason: "Duplicate song detected.",
      });
      return { repeats };
    }

    const publicUrl = await uploadFile(
      storage,
      song.path,
      destinationPath,
      meta.format.container || "audio/mpeg",
    );

    modelSong.url = publicUrl;

    const docRef = db.collection("songs").doc();
    const documentId = docRef.id;

    modelSong.id = documentId;

    await docRef.set({
      ...modelSong,
      id: documentId,
      createdAt: new Date(),
    });

    console.log(`Canción guardada con ID: ${documentId}`);

    return { processed: [modelSong], repeats };
  } catch (error) {
    console.error("Error en UploadSongsUseCase:", error);
    throw error;
  }
}

module.exports = { UploadSongsUseCase };
