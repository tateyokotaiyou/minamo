const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── Background image ──────────────────────────────────────────
const bgImg = new Image();
bgImg.src = 'IMG_3560.jpeg';

function drawBackground() {
  if (!bgImg.complete || bgImg.naturalWidth === 0) {
    ctx.fillStyle = '#1c2d40';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
  const cw = canvas.width, ch = canvas.height;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.drawImage(bgImg, dx, dy, dw, dh);

  // Subtle vignette
  const vign = ctx.createRadialGradient(
    cw * 0.5, ch * 0.5, ch * 0.2,
    cw * 0.5, ch * 0.5, ch * 0.85
  );
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, cw, ch);
}

// ─── Balls ─────────────────────────────────────────────────────
const COLORS = [
  '#e8f4fb',
  '#d0ecf8',
  '#f5f5e8',
  '#fdf5c8',
  '#e8f8e8',
  '#f0ece0',
];

const NUM_BALLS = 15;
const MIN_R = 4;
const MAX_R = 10;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function makeBall() {
  const r     = randomBetween(MIN_R, MAX_R);
  const speed = randomBetween(0.8, 2.2);
  const angle = Math.random() * Math.PI * 2;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: randomBetween(r, canvas.width  - r),
    y: randomBetween(r, canvas.height - r),
    r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color,
    alpha: randomBetween(0.55, 0.82),
    baseSpeed: speed,
  };
}

const balls = Array.from({ length: NUM_BALLS }, makeBall);

function update(b) {
  b.x += b.vx;
  b.y += b.vy;

  if (b.x - b.r < 0)             { b.x = b.r;                b.vx =  Math.abs(b.vx); }
  if (b.x + b.r > canvas.width)  { b.x = canvas.width  - b.r; b.vx = -Math.abs(b.vx); }
  if (b.y - b.r < 0)             { b.y = b.r;                b.vy =  Math.abs(b.vy); }
  if (b.y + b.r > canvas.height) { b.y = canvas.height - b.r; b.vy = -Math.abs(b.vy); }

  const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (spd > b.baseSpeed) { b.vx *= 0.988; b.vy *= 0.988; }
}

// ─── Ripples (double-tap water spread) ────────────────────────
const ripples = [];

function spawnRipple(cx, cy) {
  ripples.push({ x: cx, y: cy, r: 0, maxR: Math.max(canvas.width, canvas.height) * 0.9, alpha: 0.55, born: performance.now() });
}

function drawRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    const age = (performance.now() - rp.born) / 1000;
    rp.r = age * 420;
    rp.alpha = Math.max(0, 0.55 * (1 - rp.r / rp.maxR));

    if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }

    for (let k = 0; k < 3; k++) {
      const kr = rp.r - k * 28;
      if (kr <= 0) continue;
      const ka = rp.alpha * (1 - k * 0.3);
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, kr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${ka.toFixed(3)})`;
      ctx.lineWidth = 3 - k * 0.8;
      ctx.stroke();
    }

    // Central flash
    if (rp.r < 70) {
      const flashA = (1 - rp.r / 70) * 0.38;
      const flash = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 70);
      flash.addColorStop(0, `rgba(255,255,255,${flashA.toFixed(3)})`);
      flash.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 70, 0, Math.PI * 2);
      ctx.fillStyle = flash;
      ctx.fill();
    }
  }
}

// ─── Main loop ─────────────────────────────────────────────────
function loop() {
  drawBackground();

  balls.forEach(b => {
    update(b);

    // Soft glow
    const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.2);
    glow.addColorStop(0, b.color + '55');
    glow.addColorStop(1, b.color + '00');
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Glass ball
    const g2 = ctx.createRadialGradient(
      b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05,
      b.x, b.y, b.r
    );
    g2.addColorStop(0,    'rgba(255,255,255,0.9)');
    g2.addColorStop(0.28, b.color + 'cc');
    g2.addColorStop(1,    b.color + '66');
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  drawRipples();

  requestAnimationFrame(loop);
}

// ─── Tap / double-tap ─────────────────────────────────────────
let lastTapTime = 0;
let lastTapX = 0, lastTapY = 0;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DIST = 40;

function onTap(cx, cy) {
  const RADIUS = 128;
  const PUSH   = 4.0;
  balls.forEach(b => {
    const dx = b.x - cx, dy = b.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < RADIUS && dist > 0) {
      const force = (1 - dist / RADIUS) * PUSH;
      b.vx += (dx / dist) * force;
      b.vy += (dy / dist) * force;
      const s = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (s > 6) { b.vx = b.vx / s * 6; b.vy = b.vy / s * 6; }
    }
  });
}

function handleInteraction(cx, cy) {
  const now = Date.now();
  const dt = now - lastTapTime;
  const dd = Math.sqrt((cx - lastTapX) ** 2 + (cy - lastTapY) ** 2);

  if (dt < DOUBLE_TAP_MS && dd < DOUBLE_TAP_DIST) {
    // Double tap — spawn ripple
    spawnRipple(cx, cy);
    lastTapTime = 0;
  } else {
    onTap(cx, cy);
    lastTapTime = now;
    lastTapX = cx;
    lastTapY = cy;
  }
}

canvas.addEventListener('click', e => handleInteraction(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  handleInteraction(t.clientX, t.clientY);
}, { passive: false });

loop();
