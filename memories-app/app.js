const imageSources = [
  'https://s3-alpha-sig.figma.com/img/c608/a55b/b64cea633cf76f3cd1a039ce05868e0b?Expires=1773619200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=TrbbNQm1ke2QyLeOOkIZmhCIoqXWVhzLUaZaoqLYlYbSHac9WuxBFF~J9dw-5EhlxUqP2dgGXtz6mykKeYPXCw7zCBP2SvtKBjZZG16mwEvZfi6xUTyOqbrsYPJaZqhfhutFgYAzEhGRFDRwZORlrqmToh1yOsp6Y0lJb2-sEuEG4OjNT7sB9IRgTJZ8dfLkx9~Yy6o9IBh1omVv14gN0HCVW6~99auXcLo3gMAqV7gBJ235sFe6vKviVinhluV22WowJDrop5JsAIXRgp88U~fzTvvDD6nyg1BIFDHL5jmgtzcNdJTt9wVwrY2rNegZ51Si7c-K0PJRJB8N1cZhoA__',
  'https://s3-alpha-sig.figma.com/img/20cb/4160/eec979c23739f34ae7cd3d6e84fa45de?Expires=1773619200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=devEIcudP8Z0K-LuU2nm9~4ZSuVkZoteEd58X1xlgt3~MLG3PHBfhpfoSOqQOIDVCwxsEU9GTDsnMAiDhDrhw2xSEoPl9iMRBPPt1I2oy2ykFmO38Xeakx8L12nYWDadXQUVAsphsva31MmHvIaH72tQmdbsjy-jQUS5UpUqDJCsWDw5F1p1MjCwUbZOYA7wK~vbsCezs2v8c4z6pm9mOSIwbr8GNIjdMmxiQcalCi-5fxraLr99Dp0tZaqVW7Ov~BlLGVlcMr2DMosrfwIRVHA3cf6Xgz2QvfM5RfJhJOr8cboK0KsguwEI4KsGxx0QHWTw-Wl8VodFrTO2A9I64w__',
  'https://s3-alpha-sig.figma.com/img/ee19/af9b/51fdb7db486c74599af725c97ad6f1d8?Expires=1773619200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=g1HC2re2509NZDCAwN95GEJH1n2tQgk7~WpIKxNRfH-EMQm3GHib9BbqY3pyXWZQKK2MdiguEbQ-ik5kWIVszshIfGPRisyIrSS79GRa6SCHemZS6gnePkuxePVkvbFlRbgugntedFWRIw4VHeV9JMoZTUo0W4XoogHfICVI7zC1EHi~hobzRTZv-FdQqmUsqxlns14Ergo5ZWdAwAs8QNgol5fwl6Y5zwtuIrTh4mENHE7kda8nfh-WmVuNTMtsLaufsOPJ0UdKyHQ8EGbve6HmLja5PFRqAhZxAvjoQ6OXdgOqW8C7R1C20rilJkWVAoJT5maT0zoWkM0YD~KHOQ__'
];

// ===== STATE =====
let currentScreen = 'filled';
let detailOpen = false;
let isTearing = false;
let activeCardIndex = -1;

// ===== ELEMENTS =====
const deviceFrame = document.getElementById('deviceFrame');
const screenFilled = document.getElementById('screen-filled');
const darkOverlay = document.getElementById('darkOverlay');
const polaroidSlider = document.getElementById('polaroidSlider');
const mainPolaroid = document.getElementById('mainPolaroid');
const polaroidImg = document.getElementById('polaroidImg');
const swipeHint = document.getElementById('swipeHint');
const swipeIcon = document.getElementById('swipeIcon');
const tearContainer = document.getElementById('tearContainer');
const photoCards = document.querySelectorAll('.photo-card');

// ===== DIRECTIONAL TEAR SYSTEM =====
function getPerimeterPos(x, y, w, h) {
  const eps = 0.5;
  if (y <= eps) return x / w;
  if (x >= w - eps) return 1 + y / h;
  if (y >= h - eps) return 2 + (w - x) / w;
  return 3 + (h - y) / h;
}

function collectCornersClockwise(corners, fromPos, toPos) {
  let result;
  if (fromPos < toPos) {
    result = corners.filter(c => c.pos > fromPos && c.pos < toPos);
  } else if (fromPos > toPos) {
    result = corners.filter(c => c.pos > fromPos || c.pos < toPos);
  } else {
    return [];
  }
  return result.sort((a, b) => {
    const ap = a.pos < fromPos ? a.pos + 4 : a.pos;
    const bp = b.pos < fromPos ? b.pos + 4 : b.pos;
    return ap - bp;
  });
}

function generateDirectionalTear(w, h, swipeDx, swipeDy) {
  const cx = w / 2, cy = h / 2;
  const segments = 24;

  const sLen = Math.sqrt(swipeDx * swipeDx + swipeDy * swipeDy) || 1;
  const sdx = swipeDx / sLen, sdy = swipeDy / sLen;
  // Tear line direction (perpendicular to swipe)
  const tdx = -sdy, tdy = sdx;

  // Find intersections of tear line with rectangle edges
  const hits = [];
  if (Math.abs(tdy) > 0.001) {
    let t = -cy / tdy, x = cx + t * tdx;
    if (x >= -0.5 && x <= w + 0.5) hits.push({ t, x: Math.max(0, Math.min(w, x)), y: 0 });
    t = (h - cy) / tdy; x = cx + t * tdx;
    if (x >= -0.5 && x <= w + 0.5) hits.push({ t, x: Math.max(0, Math.min(w, x)), y: h });
  }
  if (Math.abs(tdx) > 0.001) {
    let t = -cx / tdx, y = cy + t * tdy;
    if (y >= -0.5 && y <= h + 0.5) hits.push({ t, x: 0, y: Math.max(0, Math.min(h, y)) });
    t = (w - cx) / tdx; y = cy + t * tdy;
    if (y >= -0.5 && y <= h + 0.5) hits.push({ t, x: w, y: Math.max(0, Math.min(h, y)) });
  }

  hits.sort((a, b) => a.t - b.t);
  const uniqueHits = [hits[0]];
  for (let i = 1; i < hits.length; i++) {
    if (Math.abs(hits[i].t - uniqueHits[uniqueHits.length - 1].t) > 0.001) uniqueHits.push(hits[i]);
  }

  const entry = uniqueHits[0];
  const exit = uniqueHits[uniqueHits.length - 1];

  // Generate jagged tear points along the line
  const tearPts = [];
  for (let i = 0; i <= segments; i++) {
    const frac = i / segments;
    const bx = entry.x + (exit.x - entry.x) * frac;
    const by = entry.y + (exit.y - entry.y) * frac;
    const midFactor = 1 - Math.abs(frac - 0.5) * 1.2;
    const amp = 6 + midFactor * 8;
    const jag = (Math.random() - 0.5) * amp;
    tearPts.push({ x: bx + sdx * jag, y: by + sdy * jag });
  }

  // Classify rectangle corners by which side of the tear line they're on
  const corners = [
    { x: 0, y: 0, pos: 0 }, { x: w, y: 0, pos: 1 },
    { x: w, y: h, pos: 2 }, { x: 0, y: h, pos: 3 }
  ];
  corners.forEach(c => { c.side = (c.x - cx) * sdx + (c.y - cy) * sdy; });

  const entryPos = getPerimeterPos(entry.x, entry.y, w, h);
  const exitPos = getPerimeterPos(exit.x, exit.y, w, h);
  const arcA = collectCornersClockwise(corners, exitPos, entryPos);
  const arcB = collectCornersClockwise(corners, entryPos, exitPos);

  const arcAisForward = arcA.length > 0
    ? arcA[0].side > 0
    : (arcB.length > 0 ? arcB[0].side <= 0 : true);

  let forwardPoly, backwardPoly;
  if (arcAisForward) {
    forwardPoly = [...tearPts, ...arcA];
    backwardPoly = [...tearPts.slice().reverse(), ...arcB];
  } else {
    forwardPoly = [...tearPts.slice().reverse(), ...arcB];
    backwardPoly = [...tearPts, ...arcA];
  }

  const toClip = (pts) =>
    `polygon(${pts.map(p => `${(p.x / w) * 100}% ${(p.y / h) * 100}%`).join(', ')})`;

  return { forwardClip: toClip(forwardPoly), backwardClip: toClip(backwardPoly), tearPts, sdx, sdy };
}

// ===== SCREEN TRANSITIONS =====
photoCards.forEach(card => {
  card.addEventListener('click', () => {
    if (currentScreen !== 'filled' || detailOpen) return;
    const index = parseInt(card.dataset.index);
    activeCardIndex = index;
    polaroidImg.src = imageSources[index];
    detailOpen = true;
    currentScreen = 'detail';
    darkOverlay.classList.add('visible');
    requestAnimationFrame(() => {
      polaroidSlider.classList.add('visible');
      swipeHint.classList.add('visible');
      swipeIcon.classList.add('visible');
    });
  });
});

// ===== DISMISS (no tear) =====
function dismissSlideDown() {
  if (!detailOpen) return;
  detailOpen = false;
  polaroidSlider.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
  polaroidSlider.style.transform = 'translate(-50%, 150%)';
  darkOverlay.classList.remove('visible');
  swipeHint.classList.remove('visible');
  swipeIcon.classList.remove('visible');
  setTimeout(() => {
    currentScreen = 'filled';
    polaroidSlider.classList.remove('visible');
    polaroidSlider.style.cssText = '';
    darkOverlay.style.cssText = '';
  }, 400);
}

darkOverlay.addEventListener('click', dismissSlideDown);

// ===== TEAR INTERACTION =====
let isDragging = false;
let startX = 0;
let startY = 0;
let dragDeltaX = 0;
let dragDeltaY = 0;
const TEAR_THRESHOLD = 60;
const TEAR_COMPLETE = 200;

function initTear() {
  if (isTearing) return;
  isTearing = true;

  const rect = mainPolaroid.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const tear = generateDirectionalTear(w, h, dragDeltaX, dragDeltaY);

  // Create forward half (piece being torn away)
  const fwdHalf = document.createElement('div');
  fwdHalf.className = 'tear-half';
  fwdHalf.style.width = w + 'px';
  fwdHalf.style.height = h + 'px';
  fwdHalf.style.left = '0px';
  fwdHalf.style.top = '0px';
  fwdHalf.style.clipPath = tear.forwardClip;
  const fwdPolaroid = mainPolaroid.cloneNode(true);
  fwdPolaroid.style.width = w + 'px';
  fwdHalf.appendChild(fwdPolaroid);

  // Create backward half (stays in place)
  const bwdHalf = document.createElement('div');
  bwdHalf.className = 'tear-half';
  bwdHalf.style.width = w + 'px';
  bwdHalf.style.height = h + 'px';
  bwdHalf.style.left = '0px';
  bwdHalf.style.top = '0px';
  bwdHalf.style.clipPath = tear.backwardClip;
  const bwdPolaroid = mainPolaroid.cloneNode(true);
  bwdPolaroid.style.width = w + 'px';
  bwdHalf.appendChild(bwdPolaroid);

  // Position tear container centered like the polaroid slider
  tearContainer.style.left = '50%';
  tearContainer.style.top = '50%';
  tearContainer.style.width = w + 'px';
  tearContainer.style.height = h + 'px';
  tearContainer.style.transform = `translate(-50%, -50%) translate(${dragDeltaX}px, ${dragDeltaY}px)`;
  tearContainer.innerHTML = '';
  tearContainer.appendChild(fwdHalf);
  tearContainer.appendChild(bwdHalf);

  // Store refs
  tearContainer._fwdHalf = fwdHalf;
  tearContainer._bwdHalf = bwdHalf;
  tearContainer._tearData = tear;
  tearContainer._width = w;

  // Hide original polaroid, show tear halves
  polaroidSlider.style.opacity = '0';
  tearContainer.classList.add('active');
}

function updateTear(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const fwd = tearContainer._fwdHalf;
  const bwd = tearContainer._bwdHalf;
  const tear = tearContainer._tearData;

  if (!fwd || !bwd || !tear) return;

  // Forward half moves in swipe direction
  const fwdDist = p * 80;
  fwd.style.transform = `translate(${tear.sdx * fwdDist}px, ${tear.sdy * fwdDist}px) rotate(${p * 2}deg)`;
  fwd.style.filter = `drop-shadow(0 ${4 + p * 8}px ${6 + p * 12}px rgba(0,0,0,${0.1 + p * 0.15}))`;

  // Backward half slightly moves opposite
  const bwdDist = p * 30;
  bwd.style.transform = `translate(${-tear.sdx * bwdDist}px, ${-tear.sdy * bwdDist}px) rotate(${p * -1.5}deg)`;
  bwd.style.filter = `drop-shadow(0 ${2 + p * 4}px ${4 + p * 6}px rgba(0,0,0,${0.08 + p * 0.1}))`;
}

function spawnParticles() {
  const tear = tearContainer._tearData;
  if (!tear) return;

  const containerRect = tearContainer.getBoundingClientRect();
  const frameRect = deviceFrame.getBoundingClientRect();
  const offsetX = containerRect.left - frameRect.left;
  const offsetY = containerRect.top - frameRect.top;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'tear-particle';
    const size = 2 + Math.random() * 4;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    // Pick random point along the tear line
    const pt = tear.tearPts[Math.floor(Math.random() * tear.tearPts.length)];
    particle.style.left = (offsetX + pt.x) + 'px';
    particle.style.top = (offsetY + pt.y) + 'px';
    particle.style.setProperty('--px', (Math.random() - 0.5) * 80 + 'px');
    particle.style.setProperty('--py', (Math.random() - 0.5) * 80 + 'px');
    particle.style.setProperty('--pr', (Math.random() - 0.5) * 180 + 'deg');
    particle.style.animation = `particleFall ${0.8 + Math.random() * 0.6}s ease-out forwards`;
    particle.style.animationDelay = (Math.random() * 0.15) + 's';
    deviceFrame.appendChild(particle);
    setTimeout(() => particle.remove(), 1800);
  }
}

function completeTear() {
  const fwd = tearContainer._fwdHalf;
  const bwd = tearContainer._bwdHalf;

  if (!fwd || !bwd) return;

  spawnParticles();

  // Instantly hide torn halves and polaroid
  tearContainer.classList.remove('active');
  tearContainer.innerHTML = '';
  polaroidSlider.style.transition = 'none';
  polaroidSlider.classList.remove('visible');
  polaroidSlider.style.cssText = '';

  swipeHint.classList.remove('visible');
  swipeIcon.classList.remove('visible');

  // Fade out the source photo card and disable it
  if (activeCardIndex >= 0 && photoCards[activeCardIndex]) {
    const card = photoCards[activeCardIndex];
    card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.85)';
    card.style.pointerEvents = 'none';
  }

  detailOpen = false;
  isTearing = false;
  currentScreen = 'filled';
  activeCardIndex = -1;

  // Delay overlay fade so particles show against dark background
  darkOverlay.style.transition = 'opacity 0.8s ease-out';
  darkOverlay.classList.remove('visible');
  setTimeout(() => {
    darkOverlay.style.cssText = '';
  }, 900);
}

function cancelTear() {
  const fwd = tearContainer._fwdHalf;
  const bwd = tearContainer._bwdHalf;

  if (!fwd || !bwd) return;

  fwd.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), filter 0.35s ease-out';
  fwd.style.transform = 'translate(0, 0) rotate(0deg)';
  fwd.style.filter = '';

  bwd.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), filter 0.35s ease-out';
  bwd.style.transform = 'translate(0, 0) rotate(0deg)';
  bwd.style.filter = '';

  setTimeout(() => {
    isTearing = false;
    tearContainer.classList.remove('active');
    tearContainer.innerHTML = '';
    polaroidSlider.style.opacity = '1';
  }, 350);
}

// ===== DRAG HANDLERS =====
function onDragStart(e) {
  if (!detailOpen) return;
  isDragging = true;
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;
  dragDeltaX = 0;
  dragDeltaY = 0;
  polaroidSlider.style.transition = 'none';
  e.preventDefault();
}

function onDragMove(e) {
  if (!isDragging) return;
  const touch = e.touches ? e.touches[0] : e;
  dragDeltaX = touch.clientX - startX;
  dragDeltaY = touch.clientY - startY;

  const absDrag = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);

  // Once tearing has started, stay in tear mode
  if (isTearing) {
    const tearProgress = Math.max(0, (absDrag - TEAR_THRESHOLD) / (TEAR_COMPLETE - TEAR_THRESHOLD));
    updateTear(tearProgress);
    const overlayFade = Math.min(1, tearProgress);
    darkOverlay.style.opacity = 0.6 * (1 - overlayFade * 0.7);
  } else if (absDrag < TEAR_THRESHOLD) {
    // Phase 1: Move the whole polaroid in drag direction
    polaroidSlider.style.transform = `translate(calc(-50% + ${dragDeltaX}px), calc(-50% + ${dragDeltaY}px))`;
    const preTearProgress = absDrag / TEAR_THRESHOLD;
    darkOverlay.style.opacity = 0.6 * (1 - preTearProgress * 0.15);
    swipeHint.style.opacity = 0.5 * (1 - preTearProgress);
    swipeIcon.style.opacity = 0.3 * (1 - preTearProgress);
  } else {
    // Phase 2: Start TEAR
    initTear();
    const tearProgress = (absDrag - TEAR_THRESHOLD) / (TEAR_COMPLETE - TEAR_THRESHOLD);
    updateTear(tearProgress);
    const overlayFade = Math.min(1, tearProgress);
    darkOverlay.style.opacity = 0.6 * (1 - overlayFade * 0.7);
  }

  e.preventDefault();
}

function snapBack() {
  polaroidSlider.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease-out';
  polaroidSlider.style.opacity = '1';
  polaroidSlider.style.transform = 'translate(-50%, -50%)';
  darkOverlay.style.transition = 'opacity 0.35s ease-out';
  darkOverlay.style.opacity = '';
  swipeHint.style.opacity = '';
  swipeIcon.style.opacity = '';
  setTimeout(() => {
    polaroidSlider.style.transition = '';
    darkOverlay.style.transition = '';
  }, 350);
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  const absDrag = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);

  if (isTearing && absDrag > (TEAR_THRESHOLD + (TEAR_COMPLETE - TEAR_THRESHOLD) * 0.35)) {
    completeTear();
  } else if (isTearing) {
    cancelTear();
    setTimeout(snapBack, 360);
  } else {
    snapBack();
  }
}

// Touch events
polaroidSlider.addEventListener('touchstart', onDragStart, { passive: false });
document.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('touchend', onDragEnd);

// Mouse events
polaroidSlider.addEventListener('mousedown', onDragStart);
document.addEventListener('mousemove', onDragMove);
document.addEventListener('mouseup', onDragEnd);