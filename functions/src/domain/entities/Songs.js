// models/Song.js

class Song {
  constructor({
    title,
    artist,
    genre,
    sampleRate,
    duration,
    bitrate,
    picture,
    url,
    energy = 0,
    hit = 0,
    bpm = 0,
    album = "",
    lossless = false,
    numberOfSamples = 0,
    songHash = "",
  }) {
    this.title = title;
    this.bpm = bpm;
    this.artist = artist;
    this.genre = genre;
    this.sampleRate = sampleRate;
    this.duration = duration;
    this.bitrate = bitrate;
    this.picture = picture;
    this.url = url;
    this.energy = energy;
    this.hit = hit;
    this.bpm = bpm;
    this.album = album;
    this.lossless = lossless;
    this.numberOfSamples = numberOfSamples;
    this.songHash = songHash;
  }

  /**
   * Retorna los campos permitidos para búsqueda junto con sus tipos.
   * Excluye el campo 'picture'.
   */
  static get allowedSearchFields() {
    return {
      title: "string",
      artist: "string",
      genre: "string",
      sampleRate: "number",
      duration: "number",
      bitrate: "number",
      url: "string",
      energy: "number",
      hit: "number",
      bpm: "number",
      album: "string",
      lossless: "boolean",
      numberOfSamples: "number",
      songHash: "string",
    };
  }
}

module.exports = { Song };
