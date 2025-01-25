export class Song {
  constructor({
    title,
    bpm,
    artist,
    genre,
    sampleRate,
    duration,
    bitrate,
    imageBase64,
    filePath,
    energy = 0,
    hit = 0,
  }) {
    this.title = title;
    this.bpm = bpm;
    this.artist = artist;
    this.genre = genre;
    this.sampleRate = sampleRate;
    this.duration = duration;
    this.bitrate = bitrate;
    this.imageBase64 = imageBase64;
    this.filePath = filePath;
    this.energy = energy;
    this.hit = hit;
  }
}
