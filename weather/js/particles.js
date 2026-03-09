// ===== PARTICLE SYSTEM =====
// Renders rain and snow on the dedicated particle canvas
class ParticleSystem {
  constructor(_atmosphereCanvas, particleCanvas) {
    // atmosphere canvas is owned by AtmosphereRenderer — we only use the particle canvas
    this.canvas = particleCanvas;
    this.ctx    = particleCanvas.getContext('2d');
    this.particles = [];
    this.mode      = 'none';
    this.animFrame = null;
    this.running   = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setMode(mode) {
    this.mode = mode;
    this.particles = [];

    if (mode === 'none') {
      this.canvas.style.opacity = '0';
      this.stop();
      return;
    }

    this.canvas.style.opacity = '1';
    this._spawn();
    if (!this.running) this.start();
  }

  _spawn() {
    const count = this.mode === 'rain' ? 130 : 65;
    for (let i = 0; i < count; i++) {
      this.particles.push(this._create(true));
    }
  }

  _create(randomY = false) {
    if (this.mode === 'rain') {
      return {
        x:       Math.random() * this.canvas.width,
        y:       randomY ? Math.random() * this.canvas.height : -10,
        speed:   9 + Math.random() * 11,
        length:  13 + Math.random() * 16,
        opacity: 0.18 + Math.random() * 0.35,
        width:   0.7 + Math.random() * 0.9,
        angle:   Math.PI / 13,
      };
    }
    // snow
    return {
      x:         Math.random() * this.canvas.width,
      y:         randomY ? Math.random() * this.canvas.height : -10,
      speed:     0.45 + Math.random() * 1.4,
      radius:    1.8 + Math.random() * 3.8,
      opacity:   0.38 + Math.random() * 0.48,
      drift:     (Math.random() - 0.5) * 0.55,
      wobble:    Math.random() * Math.PI * 2,
      wobbleSpd: 0.01 + Math.random() * 0.02,
    };
  }

  start() {
    this.running = true;
    const loop = () => {
      if (!this.running) return;
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

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      if (this.mode === 'rain') {
        this._drawRaindrop(ctx, p);
        p.y += p.speed;
        p.x += p.speed * Math.tan(p.angle);
        if (p.y > this.canvas.height + 20) {
          this.particles[i] = this._create(false);
          this.particles[i].x = Math.random() * this.canvas.width;
        }
      } else if (this.mode === 'snow') {
        this._drawSnow(ctx, p);
        p.wobble += p.wobbleSpd;
        p.x += Math.sin(p.wobble) * p.drift;
        p.y += p.speed;
        if (p.y > this.canvas.height + 20) {
          this.particles[i] = this._create(false);
          this.particles[i].x = Math.random() * this.canvas.width;
        }
      }
    });
  }

  _drawRaindrop(ctx, p) {
    ctx.save();
    ctx.globalAlpha  = p.opacity;
    ctx.strokeStyle  = 'rgba(185, 215, 255, 1)';
    ctx.lineWidth    = p.width;
    ctx.lineCap      = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(
      p.x + p.length * Math.sin(p.angle),
      p.y + p.length * Math.cos(p.angle)
    );
    ctx.stroke();
    ctx.restore();
  }

  _drawSnow(ctx, p) {
    ctx.save();
    ctx.globalAlpha  = p.opacity;
    ctx.fillStyle    = 'rgba(225, 240, 255, 1)';
    ctx.shadowColor  = 'rgba(200, 228, 255, 0.7)';
    ctx.shadowBlur   = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
