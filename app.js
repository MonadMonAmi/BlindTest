const { createApp } = Vue;

// Met en minuscules, enlève accents, ponctuation et espaces en trop
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Charge l'API YouTube une seule fois et renvoie une promesse résolue quand elle est prête
function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
}

createApp({
  data() {
    return {
      screen: 'setup', // 'setup' | 'playing' | 'end'
      videos: window.VIDEOS,
      clipDuration: 15,
      shuffleOrder: true,

      playlist: [],
      index: 0,
      score: 0,
      results: [], // { video, guess, titleOk, artistOk }

      guess: '',
      timeLeft: 0,
      revealed: false,
      lastResult: null,
    };
  },

  computed: {
    current() {
      return this.playlist[this.index];
    },
    isLast() {
      return this.index === this.playlist.length - 1;
    },
  },

  methods: {
    async startGame() {
      this.playlist = this.shuffleOrder ? shuffle(this.videos) : [...this.videos];
      this.index = 0;
      this.score = 0;
      this.results = [];
      this.screen = 'playing';

      await loadYouTubeApi();
      await this.$nextTick();
      if (!this.player) {
        await new Promise((resolve) => {
          this.player = new YT.Player('player', {
            width: 640,
            height: 360,
            playerVars: { controls: 0, disablekb: 1, rel: 0 },
            events: { onReady: resolve },
          });
        });
      }
      this.startRound();
    },

    startRound() {
      this.guess = '';
      this.revealed = false;
      this.lastResult = null;
      this.playClip();
    },

    playClip() {
      this.player.loadVideoById({ videoId: this.current.youtubeId, startSeconds: this.current.start || 0 });
      this.startTimer();
    },

    startTimer() {
      this.stopTimer();
      this.timeLeft = this.clipDuration;
      this.timer = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.stopTimer();
          if (!this.revealed) this.player.pauseVideo();
        }
      }, 1000);
    },

    stopTimer() {
      clearInterval(this.timer);
      this.timer = null;
    },

    checkGuess(guess, video) {
      const g = normalize(guess);
      const matches = (answer) => normalize(answer) !== '' && g.includes(normalize(answer));
      return {
        titleOk: matches(video.title),
        artistOk: matches(video.artist) || (video.alternatives || []).some(matches),
      };
    },

    submitGuess() {
      const { titleOk, artistOk } = this.checkGuess(this.guess, this.current);
      const points = (titleOk ? 1 : 0) + (artistOk ? 1 : 0);
      this.score += points;
      this.lastResult = { video: this.current, guess: this.guess, titleOk, artistOk, points };
      this.results.push(this.lastResult);
      this.reveal();
    },

    skip() {
      this.lastResult = { video: this.current, guess: '', titleOk: false, artistOk: false, points: 0 };
      this.results.push(this.lastResult);
      this.reveal();
    },

    reveal() {
      this.stopTimer();
      this.revealed = true;
      this.player.playVideo();
    },

    next() {
      if (this.isLast) {
        this.endGame();
      } else {
        this.index++;
        this.startRound();
      }
    },

    endGame() {
      this.stopTimer();
      if (this.player) this.player.stopVideo();
      this.screen = 'end';
    },
  },
}).mount('#app');
