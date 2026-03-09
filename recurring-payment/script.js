/* ============================================================
   RECURRING PAYMENTS — Card Swipe Interaction
   Swipe RIGHT → remind me  |  Swipe LEFT → skip
   ============================================================ */

const TOTAL = 4;
const SWIPE_THRESHOLD = 90;   // px to trigger a swipe
const MAX_ROTATION   = 18;    // degrees max card tilt

let remaining = TOTAL;        // cards left in stack
let isDragging = false;
let startX = 0, startY = 0;
let currentDx = 0;

// The top card's slot is always slot[0]. We reassign slots as cards are removed.
// `slots` holds the DOM elements in visual order (index 0 = top/front).
const stackArea   = document.getElementById('stackArea');
const emptyState  = document.getElementById('emptyState');
const counterText = document.getElementById('counterText');
const counterPills= document.getElementById('counterPills');
const skipBtn     = document.getElementById('skipBtn');
const remindBtn   = document.getElementById('remindBtn');

// Build ordered slot list: slot[0] is front (highest z-index)
const slots = Array.from(document.querySelectorAll('.card-slot'))
  .sort((a, b) => parseInt(a.dataset.slot) - parseInt(b.dataset.slot));

// ── Helpers ───────────────────────────────────────────────
function topCard() {
  return slots[0]?.querySelector('.payment-card') || null;
}

function getClientX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
function getClientY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

function applyDrag(card, dx) {
  const rotate = (dx / 400) * MAX_ROTATION;
  card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
}

// ── Stack promotion ───────────────────────────────────────
// After the top card flies off, shift remaining cards up one slot position.
function promoteStack() {
  slots.shift();          // remove the (now empty) front slot from our list
  slots.forEach((slot, i) => {
    slot.dataset.slot = i;
    // Clear promote classes then set new one
    slot.classList.remove('promote-0','promote-1','promote-2','promote-3');
    slot.classList.add(`promote-${i}`);
    // Reset inline style so CSS transition takes over
    slot.style.transition = '';
  });
}

// ── Swipe action ──────────────────────────────────────────
function swipe(direction) {
  const card = topCard();
  if (!card) return;

  card.classList.remove('is-dragging', 'snap-back');
  card.style.transform = '';

  // Fly off
  card.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');

  remaining--;
  updateCounter();

  // After animation, remove slot and promote
  setTimeout(() => {
    const slot = card.closest('.card-slot');
    slot.remove();
    promoteStack();

    if (remaining === 0) {
      emptyState.classList.add('visible');
      skipBtn.disabled   = true;
      remindBtn.disabled = true;
    }
  }, 450);
}

// ── Counter / pills ───────────────────────────────────────
function updateCounter() {
  counterText.textContent = remaining > 0
    ? `${remaining} subscription${remaining !== 1 ? 's' : ''} to review`
    : 'all reviewed';

  const pills = counterPills.querySelectorAll('.pill');
  pills.forEach((p, i) => {
    // Pills that have been acted on → dim
    p.classList.toggle('active', i < remaining);
  });
}

// ── Drag (Mouse) ──────────────────────────────────────────
function onMouseDown(e) {
  const card = topCard();
  if (!card || !card.contains(e.target)) return;

  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  currentDx = 0;
  card.classList.add('is-dragging');
  card.style.transition = 'none';
}

function onMouseMove(e) {
  if (!isDragging) return;
  const card = topCard();
  if (!card) return;

  currentDx = e.clientX - startX;
  applyDrag(card, currentDx);
}

function onMouseUp() {
  if (!isDragging) return;
  isDragging = false;

  const card = topCard();
  if (!card) return;
  card.classList.remove('is-dragging');

  if (currentDx > SWIPE_THRESHOLD) {
    swipe('right');
  } else if (currentDx < -SWIPE_THRESHOLD) {
    swipe('left');
  } else {
    // Snap back
    card.classList.add('snap-back');
    card.style.transform = '';
    setTimeout(() => card.classList.remove('snap-back'), 420);
  }
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup',   onMouseUp);

// ── Drag (Touch) ──────────────────────────────────────────
stackArea.addEventListener('touchstart', (e) => {
  const card = topCard();
  if (!card) return;

  isDragging = true;
  startX  = getClientX(e);
  startY  = getClientY(e);
  currentDx = 0;
  card.classList.add('is-dragging');
  card.style.transition = 'none';
}, { passive: true });

stackArea.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const card = topCard();
  if (!card) return;

  currentDx = getClientX(e) - startX;
  const dy  = getClientY(e) - startY;

  // Prefer horizontal swipe
  if (Math.abs(currentDx) > Math.abs(dy)) {
    e.preventDefault();
  }

  applyDrag(card, currentDx);
}, { passive: false });

stackArea.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;

  const card = topCard();
  if (!card) return;
  card.classList.remove('is-dragging');

  if (currentDx > SWIPE_THRESHOLD) {
    swipe('right');
  } else if (currentDx < -SWIPE_THRESHOLD) {
    swipe('left');
  } else {
    card.classList.add('snap-back');
    card.style.transform = '';
    setTimeout(() => card.classList.remove('snap-back'), 420);
  }
});

// ── Button controls ───────────────────────────────────────
skipBtn.addEventListener('click', () => {
  if (remaining > 0) swipe('left');
});

remindBtn.addEventListener('click', () => {
  if (remaining > 0) swipe('right');
});

// ── Keyboard ──────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') swipe('right');
  if (e.key === 'ArrowLeft')  swipe('left');
});