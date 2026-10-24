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

// Texte affiché sur un bouton de réponse
function answerLabel(video) {
  return video.artist ? `${video.artist} — ${video.title}` : video.title;
}

// La bonne réponse + (count - 1) mauvaises réponses prises dans les autres vidéos de la liste
function buildChoices(video, pool, count) {
  const correct = answerLabel(video);
  const others = [...new Set(pool.map(answerLabel))].filter((label) => label && label !== correct);
  return shuffle([correct, ...shuffle(others).slice(0, count - 1)]);
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

const DEFAULT_LIST = { id: 'default', name: 'Liste par défaut (videos.js)', videos: window.VIDEOS };

createApp({
  components: { ListEditor },

  data() {
    return {
      screen: 'setup', // 'setup' | 'editor' | 'playing' | 'end'

      // Listes de vidéos
      savedLists: loadLists(),
      selectedListId: 'default',
      editingList: null,

      // Réglages
      clipDuration: 15,
      shuffleOrder: true,
      answerMode: 4, // 0 = texte libre, 4 ou 6 = nombre de boutons

      // Partie
      playlist: [],
      index: 0,
      score: 0,
      results: [], // { video, guess, titleOk, artistOk, points }

      guess: '',
      choices: [],
      timeLeft: 0,
      revealed: false,
      lastResult: null,
    };
  },

  computed: {
    lists() {
      return [DEFAULT_LIST, ...this.savedLists];
    },
    selectedList() {
      return this.lists.find((l) => l.id === this.selectedListId) || DEFAULT_LIST;
    },
    current() {
      return this.playlist[this.index];
    },
    isLast() {
      return this.index === this.playlist.length - 1;
    },
    correctLabel() {
      return this.current ? answerLabel(this.current) : '';
    },
    pointsPerVideo() {
      return this.answerMode === 0 ? 2 : 1;
    },
  },

  methods: {
    // ----- Gestion des listes -----

    newList() {
      this.editingList = { id: null, name: '', videos: [] };
      this.screen = 'editor';
    },

    editList() {
      const list = this.selectedList;
      // La liste par défaut (videos.js) n'est pas modifiable : on en édite une copie
      this.editingList = list.id === 'default'
        ? { id: null, name: list.name + ' (copie)', videos: list.videos }
        : list;
      this.screen = 'editor';
    },

    saveList(list) {
      if (list.id) {
        this.savedLists = this.savedLists.map((l) => (l.id === list.id ? list : l));
      } else {
        list.id = String(Date.now());
        this.savedLists.push(list);
      }
      saveLists(this.savedLists);
      this.selectedListId = list.id;
      this.screen = 'setup';
    },

    deleteList() {
      if (!confirm(`Supprimer la liste « ${this.selectedList.name} » ?`)) return;
      this.savedLists = this.savedLists.filter((l) => l.id !== this.selectedListId);
      saveLists(this.savedLists);
      this.selectedListId = 'default';
    },

    async importList(event) {
      const file = event.target.files[0];
      event.target.value = '';
      if (!file) return;
      try {
        const list = JSON.parse(await file.text());
        if (!Array.isArray(list.videos)) throw new Error('champ "videos" manquant');
        this.saveList({ id: null, name: list.name || file.name, videos: list.videos });
      } catch (e) {
        alert('Fichier invalide : ' + e.message);
      }
    },

    // ----- Partie -----

    async startGame() {
      const videos = this.selectedList.videos;
      if (videos.length === 0) return alert('Cette liste est vide.');
      this.playlist = this.shuffleOrder ? shuffle(videos) : [...videos];
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
      this.choices = this.answerMode ? buildChoices(this.current, this.playlist, this.answerMode) : [];
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

    // Mode texte libre : 1 point pour le titre, 1 point pour l'artiste
    submitGuess() {
      const { titleOk, artistOk } = this.checkGuess(this.guess, this.current);
      this.addResult(this.guess, titleOk, artistOk, (titleOk ? 1 : 0) + (artistOk ? 1 : 0));
    },

    // Mode boutons : 1 point si la bonne réponse est choisie
    choose(choice) {
      const ok = choice === this.correctLabel;
      this.addResult(choice, ok, ok, ok ? 1 : 0);
    },

    skip() {
      this.addResult('', false, false, 0);
    },

    addResult(guess, titleOk, artistOk, points) {
      this.score += points;
      this.lastResult = { video: this.current, guess, titleOk, artistOk, points };
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
