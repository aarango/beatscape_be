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
}

module.exports = { Song };
