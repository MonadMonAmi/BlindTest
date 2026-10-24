// Composant d'édition d'une liste de vidéos (template : #editor-template dans index.html)
const ListEditor = {
  template: '#editor-template',
  props: ['list'],
  emits: ['save', 'cancel'],

  data() {
    return {
      // Copie de travail ; les autres réponses sont éditées comme texte "a, b, c"
      name: this.list.name || '',
      rows: (this.list.videos || []).map((v) => ({
        youtubeId: v.youtubeId,
        start: v.start || 0,
        artist: v.artist || '',
        title: v.title || '',
        alternativesText: (v.alternatives || []).join(', '),
      })),
      urls: '',
      loading: false,
      status: '',
    };
  },

  methods: {
    // Ajoute chaque lien collé et remplit automatiquement artiste / titre depuis YouTube
    async addFromUrls() {
      const lines = this.urls.split('\n').map((l) => l.trim()).filter(Boolean);
      const errors = [];
      this.loading = true;

      for (const [i, line] of lines.entries()) {
        this.status = `Génération des réponses… ${i + 1} / ${lines.length}`;
        const youtubeId = extractYoutubeId(line);
        if (!youtubeId) { errors.push(`Lien invalide : ${line}`); continue; }
        if (this.rows.some((r) => r.youtubeId === youtubeId)) { errors.push(`Déjà dans la liste : ${line}`); continue; }

        const row = { youtubeId, start: extractStart(line), artist: '', title: '', alternativesText: '' };
        try {
          this.fillRow(row, await fetchVideoInfo(youtubeId));
          this.rows.push(row);
        } catch (e) {
          errors.push(`${line} : ${e.message}`);
        }
      }

      this.loading = false;
      this.urls = '';
      this.status = errors.length ? errors.join(' / ') : `${lines.length} vidéo(s) ajoutée(s).`;
    },

    async regenerate(row) {
      try {
        this.fillRow(row, await fetchVideoInfo(row.youtubeId));
      } catch (e) {
        alert(e.message);
      }
    },

    fillRow(row, info) {
      row.artist = info.artist;
      row.title = info.title;
      row.alternativesText = info.alternatives.join(', ');
    },

    move(index, delta) {
      const target = index + delta;
      if (target < 0 || target >= this.rows.length) return;
      const [row] = this.rows.splice(index, 1);
      this.rows.splice(target, 0, row);
    },

    remove(index) {
      this.rows.splice(index, 1);
    },

    toList() {
      return {
        id: this.list.id,
        name: this.name.trim() || 'Sans nom',
        videos: this.rows.map((r) => ({
          youtubeId: r.youtubeId,
          start: Number(r.start) || 0,
          artist: r.artist.trim(),
          title: r.title.trim(),
          alternatives: r.alternativesText.split(',').map((a) => a.trim()).filter(Boolean),
        })),
      };
    },

    save() {
      if (this.rows.length === 0) return alert('La liste est vide.');
      const missing = this.rows.findIndex((r) => !r.title.trim());
      if (missing !== -1) return alert(`La vidéo n°${missing + 1} n'a pas de titre.`);
      this.$emit('save', this.toList());
    },

    exportJson() {
      downloadList(this.toList());
    },
  },
};
