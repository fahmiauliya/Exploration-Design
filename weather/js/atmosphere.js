// ===== ATMOSPHERIC CANVAS RENDERER =====
// Draws: sun disc + rays, volumetric clouds, fog, atmospheric lighting

class AtmosphereRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.mode   = 'none';
    this.time   = 0;
    this.running = false;
    this.animFrame = null;

    // Cloud bank instances per mode
    this.cloudBanks = [];

    // Lightning state
    this.flashOpacity  = 0;
    this.boltPoints    = [];
    this.boltOpacity   = 0;
    this.nextLightning = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._buildClouds();
  }

  // ---- PUBLIC API ----
  setMode(mode) {
    this.mode = mode;
    this._buildClouds();
    if (mode === 'none') { this.stop(); return; }
    if (!this.running) this.start();
  }

  start() {
    this.running = true;
    const loop = (ts) => {
      if (!this.running) return;
      this.time = ts * 0.001;
      this._draw();
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ---- CLOUD DATA ----
  _buildClouds() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    const rng = (a, b) => a + Math.random() * (b - a);

    const make = (n, opts) => Array.from({ length: n }, (_, i) => ({
      x:      rng(-W * 0.3, W * 1.3),
      y:      opts.y    !== undefined ? opts.y    : rng(-H * 0.1, H * 0.4),
      scale:  opts.scale !== undefined ? rng(opts.scale[0], opts.scale[1]) : rng(0.7, 1.4),
      speed:  opts.speed !== undefined ? rng(opts.speed[0], opts.speed[1]) : rng(4, 12),
      alpha:  opts.alpha !== undefined ? rng(opts.alpha[0], opts.alpha[1]) : rng(0.25, 0.55),
      color:  opts.color,
      phase:  rng(0, Math.PI * 2),
    }));

    const banks = {
      sunny:  [],
      cloudy: [
        ...make(3, { y: H * -0.02, scale: [1.0, 1.5], speed: [6, 10],  alpha: [0.28, 0.42], color: [205, 218, 232] }),
        ...make(3, { y: H * 0.12,  scale: [0.7, 1.1], speed: [10, 16], alpha: [0.18, 0.32], color: [215, 225, 238] }),
        ...make(2, { y: H * -0.08, scale: [1.4, 2.0], speed: [3, 6],   alpha: [0.14, 0.22], color: [195, 210, 228] }),
      ],
      rainy: [
        ...make(4, { y: H * -0.06, scale: [1.3, 1.9], speed: [5, 9],   alpha: [0.55, 0.75], color: [38, 52, 72] }),
        ...make(3, { y: H * 0.08,  scale: [1.0, 1.4], speed: [9, 14],  alpha: [0.40, 0.60], color: [30, 44, 64] }),
      ],
      stormy: [
        ...make(4, { y: H * -0.10, scale: [1.8, 2.6], speed: [8, 14],  alpha: [0.75, 0.92], color: [14, 10, 28] }),
        ...make(3, { y: H * 0.05,  scale: [1.3, 1.8], speed: [12, 18], alpha: [0.60, 0.80], color: [20, 15, 40] }),
        ...make(2, { y: H * -0.02, scale: [2.0, 2.8], speed: [4, 7],   alpha: [0.50, 0.68], color: [25, 20, 48] }),
      ],
      snowy: [
        ...make(3, { y: H * -0.04, scale: [1.0, 1.6], speed: [3, 6],   alpha: [0.30, 0.48], color: [235, 244, 255] }),
        ...make(2, { y: H * 0.10,  scale: [0.8, 1.2], speed: [5, 9],   alpha: [0.18, 0.28], color: [245, 250, 255] }),
      ],
    };
    this.cloudBanks = banks;
  }

  // ---- MAIN DRAW ----
  _draw() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    switch (this.mode) {
      case 'sunny':  this._drawSunny(ctx, W, H);  break;
      case 'cloudy': this._drawCloudy(ctx, W, H); break;
      case 'rainy':  this._drawRainy(ctx, W, H);  break;
      case 'stormy': this._drawStormy(ctx, W, H); break;
      case 'snowy':  this._drawSnowy(ctx, W, H);  break;
    }
  }

  // ---- SUNNY ----
  _drawSunny(ctx, W, H) {
    const t    = this.time;
    const sunX = W * 0.74;
    const sunY = H * 0.14;

    // Outermost aura (very large, very soft)
    const aura = ctx.createRadialGradient(sunX, sunY, 60, sunX, sunY, 340);
    aura.addColorStop(0,   'rgba(255, 230, 100, 0.14)');
    aura.addColorStop(0.4, 'rgba(255, 210, 60,  0.06)');
    aura.addColorStop(1,   'rgba(255, 170, 0,   0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(sunX, sunY, 340, 0, Math.PI * 2); ctx.fill();

    // Animated rays
    const rayCount = 14;
    const rot      = t * 0.045;
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(rot);
    for (let i = 0; i < rayCount; i++) {
      const angle  = (i / rayCount) * Math.PI * 2;
      const pulse  = 1 + Math.sin(t * 1.1 + i * 0.7) * 0.12;
      const inner  = 52;
      const outer  = (95 + (i % 4) * 28) * pulse;
      const width  = i % 2 === 0 ? 5 : 3;
      const g = ctx.createLinearGradient(
        Math.cos(angle) * inner, Math.sin(angle) * inner,
        Math.cos(angle) * outer, Math.sin(angle) * outer
      );
      g.addColorStop(0, `rgba(255, 245, 130, ${0.2 + (i % 3) * 0.05})`);
      g.addColorStop(1, 'rgba(255, 200, 50, 0)');
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(inner, -width / 2);
      ctx.lineTo(outer, -width * 0.12);
      ctx.lineTo(outer, width * 0.12);
      ctx.lineTo(inner, width / 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Inner corona
    const corona = ctx.createRadialGradient(sunX - 6, sunY - 8, 0, sunX, sunY, 110);
    corona.addColorStop(0,   'rgba(255, 252, 200, 0.55)');
    corona.addColorStop(0.5, 'rgba(255, 228, 90,  0.22)');
    corona.addColorStop(1,   'rgba(255, 180, 0,   0)');
    ctx.fillStyle = corona;
    ctx.beginPath(); ctx.arc(sunX, sunY, 110, 0, Math.PI * 2); ctx.fill();

    // Sun disc
    const disc = ctx.createRadialGradient(sunX - 9, sunY - 10, 0, sunX, sunY, 36);
    disc.addColorStop(0,   'rgba(255, 255, 235, 1)');
    disc.addColorStop(0.55,'rgba(255, 244, 130, 0.97)');
    disc.addColorStop(1,   'rgba(255, 210, 50,  0.88)');
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(sunX, sunY, 36, 0, Math.PI * 2); ctx.fill();

    // Atmospheric scatter — bluish haze thins near horizon
    const scatter = ctx.createRadialGradient(sunX, H * 0.2, 0, sunX, H * 0.2, W * 0.7);
    scatter.addColorStop(0,   'rgba(200, 230, 255, 0.07)');
    scatter.addColorStop(0.6, 'rgba(160, 210, 255, 0.03)');
    scatter.addColorStop(1,   'rgba(120, 180, 255, 0)');
    ctx.fillStyle = scatter;
    ctx.fillRect(0, 0, W, H);

    // Warm horizon haze
    const haze = ctx.createLinearGradient(0, H * 0.55, 0, H);
    haze.addColorStop(0,   'rgba(255, 175, 40,  0)');
    haze.addColorStop(0.45,'rgba(255, 155, 25,  0.10)');
    haze.addColorStop(1,   'rgba(240, 100, 0,   0.22)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    // Light shimmer lens flare (small)
    const flareX = sunX + 60;
    const flareY = sunY + 30;
    const flare  = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 18);
    const flareA = 0.12 + Math.sin(t * 1.6) * 0.04;
    flare.addColorStop(0,   `rgba(255, 255, 255, ${flareA})`);
    flare.addColorStop(1,   'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flare;
    ctx.beginPath(); ctx.arc(flareX, flareY, 18, 0, Math.PI * 2); ctx.fill();
  }

  // ---- CLOUD SHAPE HELPER ----
  // Draws a realistic volumetric cloud using layered radial gradients
  _drawCloud(ctx, x, y, scale, r, g, b, alpha) {
    const puffs = [
      { dx: 0,    dy: 0,    r: 72 },
      { dx: 58,   dy: -24,  r: 60 },
      { dx: 116,  dy: -6,   r: 68 },
      { dx: 170,  dy: -20,  r: 54 },
      { dx: 218,  dy: 6,    r: 62 },
      { dx: 266,  dy: -10,  r: 52 },
      { dx: 32,   dy: 22,   r: 58 },
      { dx: 134,  dy: 24,   r: 52 },
      { dx: 232,  dy: 20,   r: 50 },
    ];

    puffs.forEach(p => {
      const px = x + p.dx * scale;
      const py = y + p.dy * scale;
      const pr = p.r  * scale;

      // Each puff has a lit top and darker base — gives volume
      const litX  = px - pr * 0.25;
      const litY  = py - pr * 0.35;
      const grad = ctx.createRadialGradient(litX, litY, 0, px, py, pr);
      grad.addColorStop(0,    `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(0.55, `rgba(${r - 12}, ${g - 12}, ${b - 8}, ${alpha * 0.55})`);
      grad.addColorStop(1,    `rgba(${r - 20}, ${g - 20}, ${b - 12}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---- CLOUDY ----
  _drawCloudy(ctx, W, H) {
    const t = this.time;
    const banks = this.cloudBanks.cloudy || [];

    // Diffused ambient sky light (no direct sun)
    const ambient = ctx.createRadialGradient(W * 0.38, 0, 0, W * 0.38, 0, H * 0.8);
    ambient.addColorStop(0,   'rgba(220, 232, 248, 0.13)');
    ambient.addColorStop(0.5, 'rgba(190, 210, 232, 0.05)');
    ambient.addColorStop(1,   'rgba(160, 185, 215, 0)');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);

    // Draw cloud banks (back to front)
    banks.forEach(c => {
      const x = ((c.x + t * c.speed) % (W + 380)) - 30;
      const [r, g, b] = c.color;
      this._drawCloud(ctx, x, c.y, c.scale, r, g, b, c.alpha);
    });

    // Bottom haze — overcast ceiling feel
    const ceil = ctx.createLinearGradient(0, H * 0.6, 0, H);
    ceil.addColorStop(0,   'rgba(130, 155, 180, 0)');
    ceil.addColorStop(1,   'rgba(100, 125, 155, 0.12)');
    ctx.fillStyle = ceil;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
  }

  // ---- RAINY ----
  _drawRainy(ctx, W, H) {
    const t     = this.time;
    const banks = this.cloudBanks.rainy || [];

    // Deep atmospheric gradient
    const atmo = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    atmo.addColorStop(0,   'rgba(12, 22, 45, 0.55)');
    atmo.addColorStop(1,   'rgba(15, 30, 60, 0)');
    ctx.fillStyle = atmo;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Storm cloud bank
    banks.forEach(c => {
      const x = ((c.x + t * c.speed) % (W + 420)) - 40;
      const [r, g, b] = c.color;
      this._drawCloud(ctx, x, c.y, c.scale, r, g, b, c.alpha);
    });

    // Moody dark veil across mid-sky
    const veil = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.65);
    veil.addColorStop(0,   'rgba(10, 22, 50, 0.18)');
    veil.addColorStop(1,   'rgba(10, 22, 50, 0)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, H * 0.2, W, H * 0.45);

    // Ground wet sheen / puddle reflection
    const sheen = ctx.createLinearGradient(0, H * 0.72, 0, H);
    sheen.addColorStop(0,   'rgba(30, 60, 100, 0)');
    sheen.addColorStop(0.5, 'rgba(25, 55, 95,  0.08)');
    sheen.addColorStop(1,   'rgba(18, 45, 80,  0.18)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
  }

  // ---- STORMY ----
  _drawStormy(ctx, W, H) {
    const t     = this.time;
    const banks = this.cloudBanks.stormy || [];

    // Heavy overcast ceiling
    const ceil = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    ceil.addColorStop(0,   'rgba(8, 5, 20, 0.7)');
    ceil.addColorStop(1,   'rgba(8, 5, 20, 0)');
    ctx.fillStyle = ceil;
    ctx.fillRect(0, 0, W, H * 0.5);

    // Massive cloud formations
    banks.forEach(c => {
      const x = ((c.x + t * c.speed) % (W + 480)) - 50;
      const [r, g, b] = c.color;
      this._drawCloud(ctx, x, c.y, c.scale, r, g, b, c.alpha);
    });

    // Purple-violet underlighting (light bouncing under clouds)
    const underlight = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.65);
    underlight.addColorStop(0,   'rgba(70, 50, 160, 0.07)');
    underlight.addColorStop(0.6, 'rgba(40, 28, 100, 0.03)');
    underlight.addColorStop(1,   'rgba(20, 10, 60,  0)');
    ctx.fillStyle = underlight;
    ctx.fillRect(0, 0, W, H);

    // Lightning flash screen
    if (this.flashOpacity > 0) {
      ctx.fillStyle = `rgba(190, 210, 255, ${this.flashOpacity})`;
      ctx.fillRect(0, 0, W, H);
      this.flashOpacity = Math.max(0, this.flashOpacity - 0.035);
    }

    // Lightning bolt
    if (this.boltOpacity > 0 && this.boltPoints.length > 1) {
      ctx.save();
      ctx.globalAlpha = this.boltOpacity;
      // Outer glow pass
      ctx.strokeStyle = 'rgba(160, 190, 255, 0.6)';
      ctx.lineWidth   = 6;
      ctx.lineJoin    = 'round';
      ctx.shadowColor = 'rgba(140, 170, 255, 0.8)';
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      this.boltPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Core bright stroke
      ctx.strokeStyle = 'rgba(230, 240, 255, 0.95)';
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 8;
      ctx.stroke();
      ctx.restore();
      this.boltOpacity = Math.max(0, this.boltOpacity - 0.028);
    }

    // Schedule next lightning
    if (t > this.nextLightning) {
      this._triggerLightning(W, H);
      this.nextLightning = t + 2.5 + Math.random() * 4;
    }
  }

  _triggerLightning(W, H) {
    const startX = W * (0.2 + Math.random() * 0.6);
    const startY = H * 0.04;
    const pts    = [{ x: startX, y: startY }];
    let cx = startX, cy = startY;
    const segments = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < segments; i++) {
      cx += (Math.random() - 0.5) * 80;
      cy += H * 0.06 + Math.random() * H * 0.04;
      pts.push({ x: cx, y: cy });
    }
    this.boltPoints  = pts;
    this.boltOpacity = 0.9;
    // Double-flash
    this.flashOpacity = 0.45;
    setTimeout(() => { this.flashOpacity = 0.25; }, 70);
  }

  // ---- SNOWY ----
  _drawSnowy(ctx, W, H) {
    const t     = this.time;
    const banks = this.cloudBanks.snowy || [];

    // Overhead diffused white light
    const topLight = ctx.createRadialGradient(W * 0.45, 0, 0, W * 0.45, 0, H * 0.75);
    topLight.addColorStop(0,   'rgba(255, 255, 255, 0.12)');
    topLight.addColorStop(0.4, 'rgba(230, 242, 255, 0.05)');
    topLight.addColorStop(1,   'rgba(200, 225, 255, 0)');
    ctx.fillStyle = topLight;
    ctx.fillRect(0, 0, W, H);

    // Soft cloud layer
    banks.forEach(c => {
      const x = ((c.x + t * c.speed) % (W + 360)) - 30;
      const [r, g, b] = c.color;
      this._drawCloud(ctx, x, c.y, c.scale, r, g, b, c.alpha);
    });

    // Ground fog / snow accumulation mist
    const fog1 = ctx.createLinearGradient(0, H * 0.62, 0, H);
    fog1.addColorStop(0,   'rgba(220, 236, 252, 0)');
    fog1.addColorStop(0.5, 'rgba(228, 240, 255, 0.18)');
    fog1.addColorStop(1,   'rgba(240, 248, 255, 0.38)');
    ctx.fillStyle = fog1;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    // Subtle cold blue vignette at sides
    const leftVig = ctx.createLinearGradient(0, 0, W * 0.3, 0);
    leftVig.addColorStop(0,   'rgba(190, 215, 245, 0.1)');
    leftVig.addColorStop(1,   'rgba(190, 215, 245, 0)');
    ctx.fillStyle = leftVig;
    ctx.fillRect(0, 0, W * 0.3, H);

    const rightVig = ctx.createLinearGradient(W, 0, W * 0.7, 0);
    rightVig.addColorStop(0,   'rgba(190, 215, 245, 0.1)');
    rightVig.addColorStop(1,   'rgba(190, 215, 245, 0)');
    ctx.fillStyle = rightVig;
    ctx.fillRect(W * 0.7, 0, W * 0.3, H);
  }
}
