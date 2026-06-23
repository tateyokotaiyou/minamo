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

  const vign = ctx.createRadialGradient(cw*0.5, ch*0.5, ch*0.2, cw*0.5, ch*0.5, ch*0.85);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, cw, ch);
}

// ─── Balls ─────────────────────────────────────────────────────
const COLORS = ['#e8f4fb','#d0ecf8','#f5f5e8','#fdf5c8','#e8f8e8','#f0ece0'];
const NUM_BALLS = 15;

function rnd(a, b) { return a + Math.random() * (b - a); }

function makeBall() {
  const r = rnd(4, 10);
  const speed = rnd(0.8, 2.2);
  const angle = Math.random() * Math.PI * 2;
  return {
    x: rnd(r, canvas.width - r), y: rnd(r, canvas.height - r),
    r, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: rnd(0.55, 0.82), baseSpeed: speed,
  };
}
const balls = Array.from({ length: NUM_BALLS }, makeBall);

function updateBall(b) {
  b.x += b.vx; b.y += b.vy;
  if (b.x - b.r < 0)             { b.x = b.r;                b.vx =  Math.abs(b.vx); }
  if (b.x + b.r > canvas.width)  { b.x = canvas.width  - b.r; b.vx = -Math.abs(b.vx); }
  if (b.y - b.r < 0)             { b.y = b.r;                b.vy =  Math.abs(b.vy); }
  if (b.y + b.r > canvas.height) { b.y = canvas.height - b.r; b.vy = -Math.abs(b.vy); }
  const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
  if (spd > b.baseSpeed) { b.vx *= 0.988; b.vy *= 0.988; }
}

function drawBall(b) {
  const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.2);
  glow.addColorStop(0, b.color + '55');
  glow.addColorStop(1, b.color + '00');
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  const g2 = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.35, b.r*0.05, b.x, b.y, b.r);
  g2.addColorStop(0,    'rgba(255,255,255,0.9)');
  g2.addColorStop(0.28, b.color + 'cc');
  g2.addColorStop(1,    b.color + '66');
  ctx.globalAlpha = b.alpha;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = g2;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ─── Ripples ───────────────────────────────────────────────────
const ripples = [];

function spawnRipple(cx, cy) {
  ripples.push({ x: cx, y: cy, born: performance.now(),
    maxR: Math.max(canvas.width, canvas.height) * 0.9 });
}

function drawRipples() {
  const now = performance.now();
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    const age = (now - rp.born) / 1000;
    const prog = age * 380;
    const fade = Math.max(0, 1 - prog / rp.maxR);

    if (fade <= 0) { ripples.splice(i, 1); continue; }

    // soft rings — thick faint + thin bright strokes
    for (let k = 0; k < 3; k++) {
      const kr = prog - k * 34;
      if (kr < 2) continue;
      const a = fade * (1 - k * 0.28);

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, kr, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 16;
      ctx.globalAlpha = a * 0.18;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, kr, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.globalAlpha = a * 0.45;
      ctx.stroke();
    }

    // bloom
    if (age < 1.4) {
      const t = age / 1.4;
      const env = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65;
      const bA = env * 0.16;
      const bR = Math.max(2, 40 + t * 120);
      const g = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, bR);
      g.addColorStop(0,   'rgba(255,255,255,' + bA.toFixed(3) + ')');
      g.addColorStop(0.5, 'rgba(220,240,255,' + (bA*0.5).toFixed(3) + ')');
      g.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, bR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // always reset
    ctx.globalAlpha = 1;
  }
}

// ─── Main loop ─────────────────────────────────────────────────
function loop() {
  ctx.globalAlpha = 1;
  drawBackground();
  balls.forEach(b => { updateBall(b); drawBall(b); });
  drawRipples();
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}

// ─── Tap / double-tap ─────────────────────────────────────────
let lastTapTime = 0, lastTapX = 0, lastTapY = 0;

function onSingleTap(cx, cy) {
  balls.forEach(b => {
    const dx = b.x - cx, dy = b.y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 128 && dist > 0) {
      const force = (1 - dist / 128) * 4.0;
      b.vx += (dx/dist) * force;
      b.vy += (dy/dist) * force;
      const s = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
      if (s > 6) { b.vx = b.vx/s*6; b.vy = b.vy/s*6; }
    }
  });
}

function handleInteraction(cx, cy) {
  const now = Date.now();
  const dt = now - lastTapTime;
  const dd = Math.sqrt((cx-lastTapX)**2 + (cy-lastTapY)**2);
  if (dt < 300 && dd < 40) {
    spawnRipple(cx, cy);
    lastTapTime = 0;
  } else {
    onSingleTap(cx, cy);
    lastTapTime = now;
    lastTapX = cx;
    lastTapY = cy;
  }
}

canvas.addEventListener('click', e => handleInteraction(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

loop();
