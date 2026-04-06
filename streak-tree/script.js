/* ═══════════════════════════════════════════════════
   STREAK TREE — Script
   SVG mask growth + modal + streak flip animation
   ═══════════════════════════════════════════════════ */

// ── DOM References ────────────────────────────────
const modalOverlay   = document.getElementById('modalOverlay');
const modalCard      = document.getElementById('modalCard');
const modalCloseBtn  = document.getElementById('modalCloseBtn');
const modalCta       = document.getElementById('modalCta');
const streakPillBtn  = document.getElementById('streakPillBtn');
const streakPillText = document.getElementById('streakPillText');
const streakDays     = document.getElementById('streakDays');
const modalTitle     = document.getElementById('modalTitle');
const treeContainer  = document.getElementById('treeContainer');

// SVG mask rects — these control the reveal
const maskRect       = document.getElementById('maskRect');
const leavesMaskRect = document.getElementById('leavesMaskRect');

// SVG element groups
const treeLeavesEl   = document.querySelector('.tree-leaves');
const treeFoliageEl  = document.querySelector('.tree-foliage');


// ── Config ────────────────────────────────────────
const FLIP_STAGGER        = 120;
const MODAL_ANIM_DURATION = 350;


// ═══════════════════════════════════════════════════
// SVG MASK ANIMATION
//
// The tree trunk lives inside <mask id="trunkMask">.
// A white <rect> in that mask controls what's visible.
// By animating the rect's Y attribute upward, the tree
// "grows" from the base with a soft blurred edge
// (feGaussianBlur on the mask filter).
//
// Mask rect positions:
//   Hidden:  Y = 270 (below tree, nothing visible)
//   Lvl 0:  Y = 245 (only seed/base dome visible)
//   Lvl 1:  Y = 50  (full tree revealed)
//
// Leaves mask works the same way for Lvl 2.
// ═══════════════════════════════════════════════════

// Y positions for each level
const TRUNK_MASK_Y = {
    hidden: 275,    // nothing visible
    0: 248,         // just the seed/base
    1: 50,          // full trunk
};

const LEAVES_MASK_Y = {
    hidden: 275,
    2: 50,          // all leaves revealed
};

// Current animation frame IDs (for cancellation)
let trunkAnimId = null;
let leavesAnimId = null;


/**
 * Smoothly animate an SVG rect's Y attribute.
 * Uses requestAnimationFrame for buttery motion.
 */
function animateMaskY(rectEl, fromY, toY, duration, easing, onDone) {
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easing(progress);
        const currentY = fromY + (toY - fromY) * eased;

        rectEl.setAttribute('y', currentY);

        if (progress < 1) {
            return requestAnimationFrame(tick);
        } else {
            if (onDone) onDone();
            return null;
        }
    }

    return requestAnimationFrame(tick);
}

// Easing: ease-out cubic (smooth deceleration)
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Easing: ease-in-out for the initial seed appear
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}


/**
 * Set mask to a specific Y instantly (no animation).
 */
function setMaskY(rectEl, y) {
    rectEl.setAttribute('y', y);
}


// ═══════════════════════════════════════════════════
// TREE LEVEL SYSTEM
//
// Lvl 0: seed (mask reveals only base)
// Lvl 1: full bare trunk (mask opens fully)
// Lvl 2: trunk + leaves (leaf mask opens, leaves scale in)
// Lvl 3: trunk + leaves + foliage blobs (scale in)
// ═══════════════════════════════════════════════════

let currentLevel = 0;

const LEVEL_DAYS = { 0: 0, 1: 2, 2: 3, 3: 5 };
const LEVEL_TITLES = {
    0: 'Start Your Streak',
    1: '2-Days Streak',
    2: '3-Days Streak',
    3: '5-Days Streak',
};


function applyLevel(level, animate) {
    currentLevel = level;

    const days = LEVEL_DAYS[level] || 0;
    streakPillText.textContent = `${days}/7`;
    modalTitle.textContent = LEVEL_TITLES[level] || `${days}-Days Streak`;

    // Update day checked states
    streakDays.querySelectorAll('.streak-day').forEach((day, i) => {
        day.classList.toggle('streak-day--checked', i < days);
    });

    // Update button text
    modalCta.textContent = level >= 3 ? 'Done' : 'Continue';
}


/**
 * Transition the tree visuals to a given level.
 * @param {number} level — 0, 1, 2, or 3
 * @param {boolean} instant — skip animation if true
 */
function setTreeVisual(level, instant) {
    // Cancel any running animations
    if (trunkAnimId) cancelAnimationFrame(trunkAnimId);
    if (leavesAnimId) cancelAnimationFrame(leavesAnimId);

    if (instant) {
        // Set masks instantly
        if (level === 0) {
            setMaskY(maskRect, TRUNK_MASK_Y[0]);
            setMaskY(leavesMaskRect, LEAVES_MASK_Y.hidden);
        } else {
            setMaskY(maskRect, TRUNK_MASK_Y[1]);
            setMaskY(leavesMaskRect, level >= 2 ? LEAVES_MASK_Y[2] : LEAVES_MASK_Y.hidden);
        }
        treeLeavesEl.classList.toggle('is-visible', level >= 2);
        treeLeavesEl.style.opacity = level >= 2 ? '1' : '0';
        treeFoliageEl.classList.toggle('is-visible', level >= 3);
        treeFoliageEl.style.opacity = level >= 3 ? '1' : '0';
        return;
    }

    // ── Animated transitions ──

    // Get current Y of trunk mask
    const currentTrunkY = parseFloat(maskRect.getAttribute('y'));
    const currentLeavesY = parseFloat(leavesMaskRect.getAttribute('y'));

    if (level === 0) {
        // Animate: hidden → seed position
        trunkAnimId = animateMaskY(maskRect, currentTrunkY, TRUNK_MASK_Y[0], 800, easeInOutQuad);
        treeLeavesEl.classList.remove('is-visible');
        treeLeavesEl.style.opacity = '0';
        treeFoliageEl.classList.remove('is-visible');
        treeFoliageEl.style.opacity = '0';

    } else if (level === 1) {
        // Animate: seed → full trunk (natural growth upward)
        trunkAnimId = animateMaskY(maskRect, currentTrunkY, TRUNK_MASK_Y[1], 1400, easeOutCubic);
        treeLeavesEl.classList.remove('is-visible');
        treeLeavesEl.style.opacity = '0';
        treeFoliageEl.classList.remove('is-visible');
        treeFoliageEl.style.opacity = '0';

    } else if (level === 2) {
        // Ensure trunk is fully revealed
        setMaskY(maskRect, TRUNK_MASK_Y[1]);
        // Animate leaves mask upward
        leavesAnimId = animateMaskY(leavesMaskRect, currentLeavesY, LEAVES_MASK_Y[2], 1000, easeOutCubic, () => {
            // After mask reveals, trigger CSS scale-in on leaves
            treeLeavesEl.classList.add('is-visible');
            treeLeavesEl.style.opacity = '1';
        });
        treeFoliageEl.classList.remove('is-visible');
        treeFoliageEl.style.opacity = '0';

    } else if (level === 3) {
        // Ensure trunk + leaves are fully revealed
        setMaskY(maskRect, TRUNK_MASK_Y[1]);
        setMaskY(leavesMaskRect, LEAVES_MASK_Y[2]);
        treeLeavesEl.classList.add('is-visible');
        treeLeavesEl.style.opacity = '1';
        // Foliage blobs scale in via CSS
        treeFoliageEl.classList.add('is-visible');
        treeFoliageEl.style.opacity = '1';
    }
}


// ── Modal: Open ───────────────────────────────────
function openModal() {
    document.body.classList.add('modal-open');
    modalOverlay.classList.add('is-open');

    // Reset everything to hidden state instantly
    setMaskY(maskRect, TRUNK_MASK_Y.hidden);
    setMaskY(leavesMaskRect, LEAVES_MASK_Y.hidden);
    treeLeavesEl.classList.remove('is-visible');
    treeLeavesEl.style.opacity = '0';
    treeFoliageEl.classList.remove('is-visible');
    treeFoliageEl.style.opacity = '0';
    resetDayFlips();
    applyLevel(0, false);

    // Step 1: After modal opens → show seed (Lvl 0)
    setTimeout(() => {
        setTreeVisual(0, false);
    }, 100);

    // Step 2: Seed → full trunk (Lvl 0 → Lvl 1)
    setTimeout(() => {
        setTreeVisual(1, false);
        applyLevel(1, false);

        // Flip the completed days after trunk finishes growing
        setTimeout(() => {
            animateCompletedDays();
        }, 1000);
    }, 1000);
}


// ── Modal: Close ──────────────────────────────────
function closeModal() {
    modalOverlay.classList.remove('is-open');
    setTimeout(() => {
        document.body.classList.remove('modal-open');
        resetDayFlips();
        currentLevel = 0;
    }, MODAL_ANIM_DURATION);
}


// ── Continue: advance to next level ───────────────
modalCta.addEventListener('click', () => {
    if (currentLevel >= 3) {
        closeModal();
        return;
    }

    const nextLevel = currentLevel + 1;
    const prevDays = LEVEL_DAYS[currentLevel] || 0;
    const nextDays = LEVEL_DAYS[nextLevel] || 0;

    // Update UI state
    applyLevel(nextLevel, false);

    // Animate tree growth
    setTreeVisual(nextLevel, false);

    // Flip newly checked days
    setTimeout(() => {
        const allDayEls = streakDays.querySelectorAll('.streak-day');
        for (let i = prevDays; i < nextDays; i++) {
            const circle = allDayEls[i].querySelector('.streak-day__circle');
            setTimeout(() => {
                circle.classList.add('is-flipped');
            }, (i - prevDays) * FLIP_STAGGER);
        }
    }, 400);
});


// ── Event Listeners ───────────────────────────────
streakPillBtn.addEventListener('click', openModal);
modalCloseBtn.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
        closeModal();
    }
});

modalCard.addEventListener('click', (e) => {
    e.stopPropagation();
});


// ═══════════════════════════════════════════════════
// STREAK FLIP ANIMATION
// ═══════════════════════════════════════════════════

function resetDayFlips() {
    streakDays.querySelectorAll('.streak-day__circle').forEach(c => {
        c.classList.remove('is-flipped');
    });
    modalCta.textContent = 'Continue';
}

function animateCompletedDays() {
    streakDays.querySelectorAll('.streak-day--checked').forEach((day, i) => {
        const circle = day.querySelector('.streak-day__circle');
        setTimeout(() => circle.classList.add('is-flipped'), i * FLIP_STAGGER);
    });
}


// ── Init ──────────────────────────────────────────
applyLevel(1, false);
setTreeVisual(1, true);

// Video is pre-rendered at 60fps with 0.5x baked in — no playback rate needed
