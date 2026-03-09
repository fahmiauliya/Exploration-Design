// ===== MAIN APP =====
(function () {
  'use strict';

  // ---- Elements ----
  const bgGradient       = document.getElementById('bgGradient');
  const bgOverlay        = document.getElementById('bgOverlay');
  const bgVideos = {
    sunny:  document.getElementById('bgVideoSunny'),
    cloudy: document.getElementById('bgVideoCloudy'),
    rainy:  document.getElementById('bgVideoRainy'),
    stormy: document.getElementById('bgVideoStormy'),
    snowy:  document.getElementById('bgVideoSnowy'),
  };
  const particleCanvas   = document.getElementById('particleCanvas');
  const atmosphereCanvas = document.getElementById('atmosphereCanvas');
  const weatherIcon      = document.getElementById('weatherIcon');
  const iconGlow         = document.getElementById('iconGlow');
  const temperature      = document.getElementById('temperature');
  const weatherDesc      = document.getElementById('weatherDesc');
  const humidity         = document.getElementById('humidity');
  const wind             = document.getElementById('wind');
  const visibility       = document.getElementById('visibility');
  const toggleTrack      = document.getElementById('toggleTrack');
  const togglePill       = document.getElementById('togglePill');
  const buttons          = document.querySelectorAll('.toggle-btn');
  const dateEl           = document.getElementById('currentDate');
  const statusTimeEl     = document.getElementById('statusTime');
  const frame            = document.querySelector('.device-frame');

  // ---- Renderers ----
  const particles  = new ParticleSystem(atmosphereCanvas, particleCanvas);
  const atmosphere = new AtmosphereRenderer(atmosphereCanvas);

  // ---- State ----
  let currentState = 'sunny';

  // ---- Init ----
  updateDate();
  updateClock();
  setInterval(updateClock, 10000);
  applyState('sunny', false);
  // Delay pill init until layout is ready
  requestAnimationFrame(() => {
    positionPill(document.querySelector('[data-state="sunny"]'), false);
  });

  // ---- Live clock ----
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    statusTimeEl.textContent = `${h}:${m}`;
  }

  // ---- Date ----
  function updateDate() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  // ---- Toggle buttons ----
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const state = btn.dataset.state;
      if (state === currentState) return;
      currentState = state;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      positionPill(btn, true);
      applyState(state, true);
    });
  });

  // ---- Pill position ----
  function positionPill(btn, animate) {
    const trackRect = toggleTrack.getBoundingClientRect();
    const btnRect   = btn.getBoundingClientRect();
    togglePill.style.transition = animate
      ? 'left 0.42s cubic-bezier(0.34,1.2,0.64,1), top 0.42s cubic-bezier(0.34,1.2,0.64,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)'
      : 'none';
    togglePill.style.left   = `${btnRect.left - trackRect.left}px`;
    togglePill.style.top    = `${btnRect.top  - trackRect.top}px`;
    togglePill.style.width  = `${btnRect.width}px`;
    togglePill.style.height = `${btnRect.height}px`;
  }

  // ---- Apply state ----
  function applyState(state, animate) {
    const cfg = WEATHER_STATES[state];

    // Base sky gradient
    bgGradient.style.background = cfg.gradient;

    // Video backgrounds
    const hasVideo = state in bgVideos;
    Object.entries(bgVideos).forEach(([key, el]) => {
      el.classList.toggle('visible', key === state);
    });
    bgOverlay.classList.toggle('video-scrim', hasVideo);
    bgOverlay.classList.toggle('snowy-scrim', state === 'snowy');
    atmosphere.setMode(hasVideo ? 'none' : cfg.atmosphere);

    // Snowy light-background text treatment
    frame.classList.toggle('state-snowy', state === 'snowy');

    // Particles
    particles.setMode(cfg.particles);

    // Icon
    if (animate) {
      weatherIcon.classList.remove('icon-entering');
      void weatherIcon.offsetWidth;
      weatherIcon.classList.add('icon-entering');
      setTimeout(() => weatherIcon.classList.remove('icon-entering'), 600);
    }
    weatherIcon.textContent = cfg.icon;
    weatherIcon.className   = `weather-icon icon-${state}`;

    // Glow
    iconGlow.style.background = cfg.glowColor;
    iconGlow.className        = `icon-glow glow-${state}`;

    // Stats with staggered fade
    const upd = (el, val, delay = 0) => {
      if (!animate) { el.textContent = val; return; }
      el.style.transition = 'none';
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(5px)';
      setTimeout(() => {
        el.textContent      = val;
        el.style.transition = `opacity 0.32s ease ${delay}ms, transform 0.32s ease ${delay}ms`;
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0)';
      }, 120 + delay);
    };

    upd(temperature,  cfg.temp,  0);
    upd(weatherDesc,  cfg.desc, 30);
    upd(humidity,     cfg.humidity,   70);
    upd(wind,         cfg.wind,       90);
    upd(visibility,   cfg.visibility, 110);
  }

  // ---- Pill on resize ----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeBtn = document.querySelector('.toggle-btn.active');
      if (activeBtn) positionPill(activeBtn, false);
    }, 100);
  });

})();
