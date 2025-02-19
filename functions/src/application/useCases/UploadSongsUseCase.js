const { Song } = require("@entities/Songs");
const crypto = require("crypto");
const {
  uploadFile,
} = require("@infrastructure/adapters/FirebaseStorageAdapter");
const { normalizeString } = require("@utils/normaliceString");
const { loadMusicMetadata } = require("music-metadata");
// const { FieldValue } = require("@infrastructure/data/firebase/FirebaseConfig");
/**
 * Sube una canción al Storage, extrae metadata y la guarda en Firestore.
 *
 * @param {Object} params
 * @param {Object} params.storage - Instancia de Firebase Storage.
 * @param {Object} params.song - Entidad Song con título, filePath, etc.
 * @param {Object} params.db - Instancia de Firestore.
 * @returns {Promise<Object>} - Resultado con canciones procesadas y repeticiones.
 */
async function UploadSongsUseCase({ song, db, storage, clientId = null }) {
  const repeats = []; // Lista para canciones repetidas

  try {
    let destinationPath = `songs/${song.title}`;

    if (clientId) {
      destinationPath = `wedges/${clientId}/${song.title}`;
    }

    // Cargar metadata del archivo
    const mm = await loadMusicMetadata();
    const metadata = await mm.parseFile(song.path);

    const meta = {
      common: { ...metadata.common },
      format: { ...metadata.format },
    };

    const picture = meta.common.picture?.[0];
    const pictureData = picture
      ? Buffer.from(picture.data).toString("base64")
      : "";

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
      title: title,
      artist: artist,
      genre: normalizeString(metadata.common.genre?.[0] || ""),
      year: year,
      bpm: metadata.common.bpm || 0,
      album: normalizeString(metadata.common.album || ""),
      duration: metadata.format.duration || 0,
      bitrate: metadata.format.bitrate || 0,
      sampleRate: metadata.format.sampleRate || 0,
      picture: picture
        ? {
            image: pictureData, // Base64 string
            format: picture.format || "",
          }
        : { image: "" },
      filePath: song.filePath,
      lossless: metadata.format.lossless || false,
      numberOfSamples: metadata.format.numberOfSamples || 0,
      songHash: songHash,
      hit: metadata.common?.bpm ? metadata.common?.bpm : 0,
      energy: metadata.common?.disk?.no ? metadata.common?.disk?.no : 0,
    });

    const path = clientId ? "wedges" : "songs";

    const existingSongsSnapshot = await db
      .collection(path)
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

    const docRef = db.collection(path).doc();
    const documentId = docRef.id;

    await docRef.set({
      ...modelSong,
      id: documentId,
      createdAt: new Date(),
      clientId: clientId || "",
    });

    console.log(`Canción guardada con ID: ${documentId}`);

    return { processed: [modelSong], repeats };
  } catch (error) {
    console.error("Error en UploadSongsUseCase:", error);
    throw error;
  }
}

module.exports = { UploadSongsUseCase };
