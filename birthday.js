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

    // Ballons qui flottent en arrière-plan
    const balloons = document.createElement('div');
    balloons.className = 'balloons';
    for (let i = 0; i < 10; i++) {
      const balloon = document.createElement('span');
      balloon.textContent = '🎈';
      balloon.style.left = `${i * 10 + Math.random() * 6}%`;
      balloon.style.animationDelay = `${-Math.random() * 20}s`;
      balloon.style.animationDuration = `${14 + Math.random() * 10}s`;
      balloon.style.fontSize = `${28 + Math.random() * 28}px`;
      balloon.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
      balloons.appendChild(balloon);
    }
    document.body.prepend(balloons);
  });
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
