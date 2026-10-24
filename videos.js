// Liste des vidéos du blind test.
// - youtubeId : l'identifiant dans l'URL YouTube (https://www.youtube.com/watch?v=XXXXXXXXXXX)
// - start     : seconde à laquelle l'extrait commence (optionnel, 0 par défaut)
// - title / artist : les réponses attendues
// - alternatives : autres réponses acceptées (optionnel)
window.VIDEOS = [
  { youtubeId: 'dQw4w9WgXcQ', start: 43, title: 'Never Gonna Give You Up', artist: 'Rick Astley' },
  { youtubeId: 'fJ9rUzIMcZQ', start: 0, title: 'Bohemian Rhapsody', artist: 'Queen' },
  { youtubeId: 'kJQP7kiw5Fk', start: 60, title: 'Despacito', artist: 'Luis Fonsi', alternatives: ['Daddy Yankee'] },
  { youtubeId: '9bZkp7q19f0', start: 70, title: 'Gangnam Style', artist: 'PSY' },
];
