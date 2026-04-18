// boot.js — Boot sequence + animated canvas wallpaper

function startBoot() {
  const bootBar = document.getElementById('boot-bar');
  const bootSignal = document.getElementById('boot-signal');
  const bootScreen = document.getElementById('boot-screen');

  let progress = 0;
  const messages = [
    'Initializing kernel...',
    'Loading modules...',
    'Mounting filesystem...',
    'Starting services...',
    'Loading desktop...',
    'Searching for signal...',
  ];
  let msgIdx = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress > 100) progress = 100;
    bootBar.style.width = progress + '%';
    if (msgIdx < messages.length && progress > msgIdx * 18) {
      bootSignal.textContent = messages[msgIdx];
      msgIdx++;
    }
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        bootScreen.classList.add('fade-out');
        setTimeout(() => {
          bootScreen.style.display = 'none';
          const desktop = document.getElementById('desktop');
          desktop.classList.remove('hidden');
          initWallpaperCanvas();
          App.init();
        }, 600);
      }, 400);
    }
  }, 80);
}

function initWallpaperCanvas() {
  const canvas = document.getElementById('wallpaper-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  const resize = () => {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * w;
      this.y  = Math.random() * h;
      this.r  = Math.random() * 1.4 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.18;
      this.vy = (Math.random() - 0.5) * 0.18;
      this.a  = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.6
        ? `rgba(124,111,255,${this.a})`
        : `rgba(167,139,250,${this.a * 0.5})`;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  // Nebula blobs
  const blobs = [
    { x: 0.2, y: 0.3, r: 0.28, c: 'rgba(50,30,120,0.18)' },
    { x: 0.75, y: 0.6, r: 0.22, c: 'rgba(30,15,80,0.14)' },
    { x: 0.5,  y: 0.9, r: 0.18, c: 'rgba(80,50,180,0.10)' },
  ];

  let frame = 0;
  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, w, h);

    // bg gradient
    const grd = ctx.createRadialGradient(w*0.3, h*0.35, 0, w*0.3, h*0.35, w*0.7);
    grd.addColorStop(0, '#110d2a');
    grd.addColorStop(0.5, '#09091a');
    grd.addColorStop(1, '#050509');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // nebula blobs
    blobs.forEach(b => {
      const bg = ctx.createRadialGradient(b.x*w, b.y*h, 0, b.x*w, b.y*h, b.r*w);
      bg.addColorStop(0, b.c);
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    });

    // particles
    particles.forEach(p => { p.update(); p.draw(); });

    // subtle grid lines
    ctx.strokeStyle = 'rgba(124,111,255,0.025)';
    ctx.lineWidth = 0.5;
    const step = 60;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    frame++;
  }
  draw();
}

window.addEventListener('load', startBoot);
