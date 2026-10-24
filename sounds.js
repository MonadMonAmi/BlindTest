// Bruitages rigolos générés par le navigateur (Web Audio API) : aucun fichier son nécessaire.
// Utilisation : Sounds.pop() joue un "pop" suivi d'un bruit drôle choisi au hasard.

const Sounds = {
  muted: false,
  volume: 0.35, // volume général (0 à 1), assez bas pour ne pas couvrir la musique

  ctx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  // Sortie avec enveloppe de volume : monte vite puis redescend jusqu'à 0 en `duration` secondes
  envelope(duration, peak = 1) {
    const ctx = this.ctx();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak * this.volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    gain.connect(ctx.destination);
    return gain;
  },

  // Oscillateur dont la fréquence suit la liste [[temps, fréquence], ...]
  tone(type, points, duration, peak) {
    const ctx = this.ctx();
    const osc = ctx.createOscillator();
    const t = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(points[0][1], t);
    for (const [time, freq] of points.slice(1)) {
      osc.frequency.exponentialRampToValueAtTime(freq, t + time);
    }
    osc.connect(this.envelope(duration, peak));
    osc.start(t);
    osc.stop(t + duration);
    return osc;
  },

  // Fait trembler la fréquence d'un oscillateur (vibrato) : `speed` fois par seconde, de ± `depth` Hz
  wobble(osc, speed, depth, duration) {
    const ctx = this.ctx();
    const lfo = ctx.createOscillator();
    const amount = ctx.createGain();
    lfo.frequency.value = speed;
    amount.gain.value = depth;
    lfo.connect(amount).connect(osc.frequency);
    lfo.start();
    lfo.stop(ctx.currentTime + duration);
  },

  // ----- Les bruitages -----

  // Le "pop" du ballon : un court souffle de bruit blanc
  burst() {
    const ctx = this.ctx();
    const length = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 900 + Math.random() * 1500;
    noise.connect(filter).connect(this.envelope(0.15, 1.5));
    noise.start();
  },

  // Ballon qui se dégonfle en partant dans tous les sens
  deflate() {
    const osc = this.tone('sawtooth', [[0, 500], [0.9, 120]], 0.9, 0.35);
    this.wobble(osc, 28, 60, 0.9);
  },

  // Boing de dessin animé
  boing() {
    const osc = this.tone('sine', [[0, 180], [0.08, 420], [0.6, 90]], 0.6, 0.9);
    this.wobble(osc, 14, 25, 0.6);
  },

  // Couinement de jouet en caoutchouc
  squeak() {
    this.tone('sine', [[0, 1100], [0.07, 1900], [0.14, 1300]], 0.18, 0.7);
    setTimeout(() => this.tone('sine', [[0, 1200], [0.08, 2100]], 0.15, 0.6), 160);
  },

  // Sifflet à coulisse qui monte puis redescend
  slideWhistle() {
    this.tone('sine', [[0, 400], [0.35, 1600], [0.7, 500]], 0.75, 0.6);
  },

  // Prout / bruit de bouche
  raspberry() {
    const osc = this.tone('square', [[0, 110], [0.5, 70]], 0.55, 0.3);
    this.wobble(osc, 35, 25, 0.55);
  },

  // Petit "tadaa" joyeux (trois notes)
  tada() {
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.tone('triangle', [[0, freq], [0.25, freq]], 0.3, 0.6), i * 90);
    });
  },

  pop() {
    if (this.muted) return;
    this.burst();
    const funny = [this.deflate, this.boing, this.squeak, this.slideWhistle, this.raspberry, this.tada];
    const sound = funny[Math.floor(Math.random() * funny.length)];
    setTimeout(() => sound.call(this), 80);
  },
};
