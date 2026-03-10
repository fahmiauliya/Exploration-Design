/* ─── CONSTANTS ───────────────────────────────────────────── */

const CX          = 186.5;         // SVG center X
const CY          = 186.5;         // SVG center Y
const R           = 149;           // ring radius
const CIRCUMF     = 2 * Math.PI * R;
const TOTAL_TICKS = 60;            // tick marks around ring
const MAX_POINTS  = 1000;          // max slider value
const STEP        = 10;            // snap step
const SNAP_SPEED  = 0.06;         // spring stiffness (lower = smoother)
const SNAP_DAMP   = 0.82;          // damping (higher = less bounce)

/* ─── DOM ─────────────────────────────────────────────────── */

const dialContainer = document.getElementById('dialContainer');
const dialSvg       = document.getElementById('dialSvg');
const progressArc   = document.getElementById('progressArc');
const progressGlow  = document.getElementById('progressGlow');
const handleGroup   = document.getElementById('handleGroup');
const ticksGroup    = document.getElementById('ticks');
const dialValue     = document.getElementById('dialValue');
const rewardTitle   = document.getElementById('rewardTitle');
const rewardSub     = document.getElementById('rewardSub');
const btnRedeem     = document.getElementById('btnRedeem');

/* ─── STATE ───────────────────────────────────────────────── */

let currentAngle  = 0;             // 0 = top (12 o'clock), goes 0..2PI clockwise
let currentValue  = 0;
let targetAngle   = 0;
let dragging      = false;
let animating     = false;
let velocity      = 0;
let prevAngle     = 0;
let prevTime      = 0;
let animId        = null;

/* ─── BUILD TICKS ─────────────────────────────────────────── */

function buildTicks() {
  for (let i = 0; i < TOTAL_TICKS; i++) {
    const a = (i / TOTAL_TICKS) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const innerR = isMajor ? R - 20 : R - 13;
    const outerR = R - 5;

    const x1 = CX + innerR * Math.cos(a);
    const y1 = CY + innerR * Math.sin(a);
    const x2 = CX + outerR * Math.cos(a);
    const y2 = CY + outerR * Math.sin(a);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.dataset.index = i;
    if (isMajor) line.setAttribute('stroke-width', '2');
    ticksGroup.appendChild(line);
  }
}

/* ─── ANGLE / VALUE CONVERSION ────────────────────────────── */

function angleToValue(a) {
  // 0..2PI → 0..MAX_POINTS
  return Math.round((a / (2 * Math.PI)) * MAX_POINTS / STEP) * STEP;
}

function valueToAngle(v) {
  return (v / MAX_POINTS) * 2 * Math.PI;
}

/* ─── RENDER ──────────────────────────────────────────────── */

function render(angle) {
  const fraction = angle / (2 * Math.PI);
  const arcLen = fraction * CIRCUMF;
  const gap = CIRCUMF - arcLen;

  // Progress arc
  progressArc.setAttribute('stroke-dasharray', `${arcLen} ${gap}`);
  progressGlow.setAttribute('stroke-dasharray', `${arcLen} ${gap}`);

  // Handle position
  const ha = angle - Math.PI / 2; // offset because SVG 0° is right, we want top
  const hx = CX + R * Math.cos(ha);
  const hy = CY + R * Math.sin(ha);
  handleGroup.setAttribute('transform', `translate(${hx}, ${hy})`);

  // Update ticks
  const activeTicks = Math.floor(fraction * TOTAL_TICKS);
  const ticks = ticksGroup.querySelectorAll('line');
  ticks.forEach((t, i) => {
    if (i < activeTicks) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Center value
  const value = angleToValue(angle);
  if (value !== currentValue) {
    currentValue = value;
    dialValue.textContent = currentValue.toLocaleString();
    updateRewardInfo(currentValue);

    // Bump animation
    dialValue.classList.add('bump');
    clearTimeout(dialValue._bumpTimer);
    dialValue._bumpTimer = setTimeout(() => dialValue.classList.remove('bump'), 100);
  }

  // Update tier button active states
  document.querySelectorAll('.tier-btn').forEach(btn => {
    const pts = parseInt(btn.dataset.pts);
    btn.classList.toggle('active', pts === currentValue);
  });

  // Redeem button state
  btnRedeem.disabled = currentValue === 0;
}

/* ─── REWARD INFO ─────────────────────────────────────────── */

function updateRewardInfo(pts) {
  if (pts === 0) {
    rewardTitle.textContent = 'Select points to redeem';
    rewardSub.textContent = 'Drag the dial to choose amount';
  } else if (pts <= 100) {
    rewardTitle.textContent = `$${(pts * 0.008).toFixed(2)} discount`;
    rewardSub.textContent = `Redeem ${pts} points at checkout`;
  } else if (pts <= 300) {
    rewardTitle.textContent = `$${(pts * 0.009).toFixed(2)} discount`;
    rewardSub.textContent = `${pts} points → shopping & experiences`;
  } else if (pts <= 500) {
    rewardTitle.textContent = `$${(pts * 0.005).toFixed(2)} value`;
    rewardSub.textContent = `Convert to dollar rewards`;
  } else {
    rewardTitle.textContent = `$${(pts * 0.01).toFixed(2)} value`;
    rewardSub.textContent = `Premium reward: gift cards & more`;
  }
}

/* ─── POINTER → ANGLE ─────────────────────────────────────── */

function pointerToAngle(e) {
  const rect = dialSvg.getBoundingClientRect();
  const scaleX = 373 / rect.width;
  const scaleY = 373 / rect.height;

  const px = e.touches ? e.touches[0].clientX : e.clientX;
  const py = e.touches ? e.touches[0].clientY : e.clientY;

  const x = (px - rect.left) * scaleX - CX;
  const y = (py - rect.top) * scaleY - CY;

  // atan2 gives angle from positive X axis, counter-clockwise
  // We want angle from top (negative Y), clockwise
  let a = Math.atan2(x, -y);  // swapped args: x, -y gives CW from top
  if (a < 0) a += 2 * Math.PI;

  return a;
}

/* ─── DRAG HANDLERS ───────────────────────────────────────── */

function onDown(e) {
  e.preventDefault();
  dragging = true;
  animating = false;
  cancelAnimationFrame(animId);

  const a = pointerToAngle(e);
  prevAngle = a;
  prevTime = performance.now();
  velocity = 0;

  handleGroup.classList.add('active');
  dialContainer.classList.add('dragging');

  // If clicking far from handle, jump to that angle
  const diff = Math.abs(normalizeAngle(a - currentAngle));
  if (diff > 0.3) {
    currentAngle = a;
  }

  render(currentAngle);
}

function onMove(e) {
  if (!dragging) return;
  e.preventDefault();

  const a = pointerToAngle(e);
  const now = performance.now();
  const dt = now - prevTime || 16;

  // Calculate delta (handle wrapping around 0/2PI)
  let delta = a - prevAngle;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  // Update angle with clamping
  currentAngle += delta;
  if (currentAngle < 0) currentAngle = 0;
  if (currentAngle > 2 * Math.PI) currentAngle = 2 * Math.PI;

  // Track velocity
  velocity = delta / dt * 16;

  prevAngle = a;
  prevTime = now;

  render(currentAngle);
}

function onUp() {
  if (!dragging) return;
  dragging = false;

  handleGroup.classList.remove('active');
  dialContainer.classList.remove('dragging');

  // Snap to nearest step
  snapToStep();
}

/* ─── SNAP ANIMATION ──────────────────────────────────────── */

function snapToStep() {
  const snappedValue = angleToValue(currentAngle);
  targetAngle = valueToAngle(snappedValue);
  animating = true;
  velocity = 0;

  function tick() {
    if (!animating) return;

    let diff = targetAngle - currentAngle;

    // Spring physics
    velocity += diff * SNAP_SPEED;
    velocity *= SNAP_DAMP;
    currentAngle += velocity;

    render(currentAngle);

    if (Math.abs(diff) < 0.001 && Math.abs(velocity) < 0.0001) {
      currentAngle = targetAngle;
      animating = false;
      render(currentAngle);
      return;
    }

    animId = requestAnimationFrame(tick);
  }

  animId = requestAnimationFrame(tick);
}

/* ─── ANIMATE TO VALUE ────────────────────────────────────── */

function animateToValue(val) {
  cancelAnimationFrame(animId);
  dragging = false;
  animating = true;

  targetAngle = valueToAngle(val);
  const startAngle = currentAngle;
  const diff = targetAngle - startAngle;
  const startTime = performance.now();
  const duration = 700;

  function tick() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Smooth ease-out cubic — no overshoot
    const ease = 1 - Math.pow(1 - t, 4);

    currentAngle = startAngle + diff * ease;
    render(currentAngle);

    if (t < 1) {
      animId = requestAnimationFrame(tick);
    } else {
      currentAngle = targetAngle;
      animating = false;
      render(currentAngle);
    }
  }

  animId = requestAnimationFrame(tick);
}

/* ─── NORMALIZE ANGLE ─────────────────────────────────────── */

function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/* ─── TIER BUTTONS ────────────────────────────────────────── */

document.querySelectorAll('.tier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pts = parseInt(btn.dataset.pts);
    animateToValue(pts);
  });
});

/* ─── KEYBOARD ────────────────────────────────────────────── */

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault();
    const next = Math.min(currentValue + STEP, MAX_POINTS);
    animateToValue(next);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault();
    const prev = Math.max(currentValue - STEP, 0);
    animateToValue(prev);
  }
});

/* ─── MOUSE WHEEL ─────────────────────────────────────────── */

dialContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -STEP : STEP;
  const next = Math.max(0, Math.min(MAX_POINTS, currentValue + delta));
  animateToValue(next);
}, { passive: false });

/* ─── EVENT LISTENERS ─────────────────────────────────────── */

dialContainer.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);

dialContainer.addEventListener('touchstart', onDown, { passive: false });
window.addEventListener('touchmove', onMove, { passive: false });
window.addEventListener('touchend', onUp);

/* ─── INIT ────────────────────────────────────────────────── */

buildTicks();
render(0);
btnRedeem.disabled = true;
