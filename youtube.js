// Outils YouTube : extraire l'identifiant d'un lien et récupérer titre / artiste

// Accepte un lien (watch?v=, youtu.be/, shorts/, embed/) ou directement un identifiant
function extractYoutubeId(text) {
  text = text.trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  const match = text.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return match ? match[1] : null;
}

// Lit le paramètre t= ou start= d'un lien (ex. ?t=43 ou ?t=1m30s) pour le début de l'extrait
function extractStart(text) {
  const match = text.match(/[?&](?:t|start)=(?:(\d+)m)?(\d+)s?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 60 + Number(match[2]);
}

// Enlève les mentions du type "(Official Video)", "[Lyrics]", "HD"…
function cleanTitle(title) {
  return title
    .replace(/\s*[([][^)\]]*(official|video|clip|lyric|audio|remaster|hd|4k|visuali[sz]er)[^)\]]*[)\]]/gi, '')
    .replace(/\s+(official\s+)?(music\s+)?video$/i, '')
    .replace(/\s+M\/?V$/i, '')
    .trim();
}

// "Titre ft. X" → { title: "Titre", featuring: ["X"] }
function splitFeaturing(text) {
  const [main, feat] = text.split(/\s+[([]?(?:ft\.?|feat\.?|featuring)\s+/i);
  const featuring = feat ? feat.replace(/[)\]]/g, '').split(/\s*(?:,|&|\bx\b|\bet\b|\band\b)\s*/i).filter(Boolean) : [];
  return { main: main.trim(), featuring };
}

// "Artiste - Titre" → { artist, title, alternatives }. Sinon on prend le nom de la chaîne comme artiste.
// Les artistes en featuring deviennent des réponses alternatives.
function parseVideoTitle(rawTitle, channel) {
  const cleaned = cleanTitle(rawTitle);
  const parts = cleaned.split(/\s+[-–—|]\s+/);
  let artist, title;
  if (parts.length >= 2) {
    artist = parts[0];
    title = parts.slice(1).join(' - ');
  } else {
    artist = (channel || '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\s*Official$/i, '');
    title = cleaned;
  }
  const a = splitFeaturing(artist);
  const t = splitFeaturing(title);
  return { artist: a.main, title: t.main, alternatives: [...a.featuring, ...t.featuring] };
}

// Interroge YouTube (oEmbed, sans clé d'API) pour obtenir le titre de la vidéo
async function fetchVideoInfo(youtubeId) {
  const url = 'https://www.youtube.com/oembed?format=json&url=' +
    encodeURIComponent('https://www.youtube.com/watch?v=' + youtubeId);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Vidéo introuvable ou privée (' + response.status + ')');
  const data = await response.json();
  return parseVideoTitle(data.title, data.author_name);
}
