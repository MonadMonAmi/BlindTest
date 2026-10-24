// Sauvegarde des listes créées dans le navigateur (localStorage).
// Une liste = { id, name, videos: [{ youtubeId, start, title, artist, alternatives }] }

const STORAGE_KEY = 'blindtest-lists';

function loadLists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLists(lists) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    alert("Impossible d'enregistrer les listes : " + e.message);
  }
}

// Télécharge une liste en fichier .json (pour la sauvegarder ou la partager)
function downloadList(list) {
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (list.name || 'liste') + '.json';
  link.click();
  URL.revokeObjectURL(link.href);
}
