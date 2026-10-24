// Thème anniversaire : s'active en ouvrant index.html?anniversaire
// Sans ce paramètre, le site reste la version simple sans CSS.

const BIRTHDAY = new URLSearchParams(location.search).has('anniversaire')
  ? { name: 'Marius', age: 10 }
  : null;

if (BIRTHDAY) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'birthday.css';
  document.head.appendChild(link);
  document.title = `Blind test — Les ${BIRTHDAY.age} ans de ${BIRTHDAY.name}`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('birthday');

    // Ballons qui flottent en arrière-plan ; un clic les fait éclater
    const balloons = document.createElement('div');
    balloons.className = 'balloons';
    for (let i = 0; i < 12; i++) {
      const balloon = document.createElement('span');
      balloon.textContent = '🎈';
      launchBalloon(balloon, i * (100 / 12), -Math.random() * 20);
      balloon.addEventListener('pointerdown', () => popBalloon(balloon));
      balloons.appendChild(balloon);
    }
    document.body.prepend(balloons);

    // Bouton pour couper / remettre les bruitages
    const mute = document.createElement('button');
    mute.className = 'mute';
    mute.textContent = '🔊';
    mute.title = 'Couper les bruitages des ballons';
    mute.addEventListener('click', () => {
      Sounds.muted = !Sounds.muted;
      mute.textContent = Sounds.muted ? '🔇' : '🔊';
    });
    document.body.appendChild(mute);
  });
}

// (Re)lance un ballon depuis le bas de l'écran avec une taille, une couleur et une vitesse au hasard.
// `delay` négatif = le ballon démarre déjà en plein vol.
function launchBalloon(balloon, left, delay = 0) {
  balloon.classList.remove('popped');
  balloon.style.left = `${left + Math.random() * 6}%`;
  balloon.style.fontSize = `${32 + Math.random() * 30}px`;
  balloon.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
  balloon.style.animationDuration = `${14 + Math.random() * 10}s`;
  balloon.style.animationDelay = `${delay}s`;
  // Redémarre l'animation CSS depuis le début
  balloon.style.animationName = 'none';
  void balloon.offsetWidth;
  balloon.style.animationName = '';
}

function popBalloon(balloon) {
  if (balloon.classList.contains('popped')) return;
  const rect = balloon.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 3;

  balloon.classList.add('popped');
  Sounds.pop();

  // "💥" + éclats de caoutchouc qui partent dans toutes les directions
  const boom = document.createElement('span');
  boom.className = 'boom';
  boom.textContent = '💥';
  boom.style.left = `${x}px`;
  boom.style.top = `${y}px`;
  boom.addEventListener('animationend', () => boom.remove());
  document.body.appendChild(boom);

  const colors = ['#ff4d6d', '#ffb703', '#3a86ff', '#06d6a0', '#8338ec', '#fb5607'];
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * 2 * Math.PI;
    const distance = 50 + Math.random() * 60;
    const piece = document.createElement('span');
    piece.className = 'shard';
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    piece.addEventListener('animationend', () => piece.remove());
    document.body.appendChild(piece);
  }

  // Un nouveau ballon repart du bas un peu plus tard
  setTimeout(() => launchBalloon(balloon, Math.random() * 94), 1500 + Math.random() * 2500);
}

// Pluie de confettis (ne fait rien hors thème anniversaire)
function confetti(amount) {
  if (!BIRTHDAY) return;
  const colors = ['#ff4d6d', '#ffb703', '#3a86ff', '#06d6a0', '#8338ec', '#fb5607'];
  for (let i = 0; i < amount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 200}px`);
    piece.style.setProperty('--spin', `${Math.random() * 1080}deg`);
    piece.addEventListener('animationend', () => piece.remove());
    document.body.appendChild(piece);
  }
}
