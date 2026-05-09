// ===== Custom cursor =====
const cursorDot  = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function loop() {
  cursorDot.style.left  = mx + 'px';
  cursorDot.style.top   = my + 'px';
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(loop);
})();

// ===== Price rain canvas =====
(function initPriceRain() {
  const canvas = document.getElementById('price-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Price-like data pool
  const pricePatterns = [
    () => (Math.random() * 200 + 5).toFixed(2),
    () => (Math.random() * 50 + 1).toFixed(2),
    () => ((Math.random() > 0.5 ? '+' : '-') + (Math.random() * 9.9 + 0.1).toFixed(2) + '%'),
    () => (Math.random() * 5000 + 100).toFixed(0),
    () => (Math.random() * 30 + 5).toFixed(1),   // P/E ratio
    () => (Math.random() * 2 + 0.1).toFixed(3),  // yield
    () => ['DOW', 'SPX', 'NDQ', 'BRK', 'GLD', 'TLT', 'VIX'][Math.floor(Math.random() * 7)],
  ];

  function randomToken() {
    return pricePatterns[Math.floor(Math.random() * pricePatterns.length)]();
  }

  // Column settings
  const FONT_SIZE = 13;
  let columns, drops, dropTokens, dropSpeeds;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    columns   = Math.floor(canvas.width / (FONT_SIZE * 5.5));
    drops     = new Array(columns).fill(0).map(() => Math.random() * -canvas.height / FONT_SIZE);
    dropTokens = drops.map(() => randomToken());
    dropSpeeds = drops.map(() => 0.25 + Math.random() * 0.55);
  }

  window.addEventListener('resize', resize);
  resize();

  // Color palette: gold on brown
  const colors = [
    'rgba(201,168,76,0.9)',
    'rgba(201,168,76,0.5)',
    'rgba(201,168,76,0.25)',
    'rgba(232,198,106,0.95)',
    'rgba(139,90,43,0.6)',
    'rgba(245,230,200,0.4)',
    'rgba(106,191,105,0.6)',   // up: green
    'rgba(229,115,115,0.6)',   // down: red
  ];

  function draw() {
    // Fade trail
    ctx.fillStyle = 'rgba(26,14,5,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px "JetBrains Mono", "Courier New", monospace`;

    for (let i = 0; i < columns; i++) {
      const token = dropTokens[i];
      const x = i * (canvas.width / columns);
      const y = drops[i] * FONT_SIZE;

      // Choose color based on content
      let color;
      if (typeof token === 'string' && token.startsWith('+')) color = colors[6];
      else if (typeof token === 'string' && token.startsWith('-')) color = colors[7];
      else color = colors[Math.floor(Math.random() * 5)];

      ctx.fillStyle = color;
      ctx.fillText(token, x, y);

      drops[i] += dropSpeeds[i];

      // Reset when off screen
      if (y > canvas.height + 20) {
        drops[i] = Math.random() * -20;
        dropTokens[i] = randomToken();
        dropSpeeds[i] = 0.25 + Math.random() * 0.55;
      }

      // Occasionally refresh token mid-stream
      if (Math.random() < 0.004) {
        dropTokens[i] = randomToken();
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ===== Scroll reveal =====
document.querySelectorAll('.reveal').forEach(el => {
  new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) el.classList.add('visible'); },
    { threshold: 0.1 }
  ).observe(el);
});

// ===== Hero entrance =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('hero').classList.add('ready');
  }, 200);
});

// ===== Rating stars =====
const starLabels = ['', '弃读', '尚可', '不错', '很好', '神作'];
let currentRating = 0;
const starsContainer = document.getElementById('stars');
const ratingText     = document.getElementById('ratingText');

if (starsContainer) {
  for (let i = 1; i <= 5; i++) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.classList.add('star');
    svg.dataset.val = i;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);

    svg.addEventListener('click', () => {
      currentRating = i;
      updateStars();
      if (ratingText) {
        ratingText.textContent = starLabels[i];
        ratingText.style.color = 'rgba(201,168,76,0.85)';
      }
    });
    svg.addEventListener('mouseenter', () => hoverStars(i));
    svg.addEventListener('mouseleave', () => updateStars());
    starsContainer.appendChild(svg);
  }
}

function hoverStars(n) {
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < n));
}
function updateStars() {
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < currentRating));
}

// ===== Ticker strip duplication (seamless loop) =====
const inner = document.querySelector('.ticker-inner');
if (inner) {
  inner.innerHTML += inner.innerHTML; // duplicate for seamless scroll
}
