// ============================================
// DATA
// ============================================
const CATEGORIES = {
    physical: {
        title: 'Select Physical Energy (Body)',
        color: '#D83030',
        emotions: [
            'Fully Recharged', 'Strong', 'Balanced', 'Stable', 'Okay', 'Low Energy',
            'Drained', 'Tired', 'Exhausted', 'Burnt Out'
        ]
    },
    mental: {
        title: 'Select Mental Energy (Mind)',
        color: '#E78523',
        emotions: [
            'Focused', 'Sharp', 'Clear', 'Calm', 'Foggy', 'Scattered',
            'Overwhelmed', 'Numb', 'Racing', 'Stuck'
        ]
    },
    emotional: {
        title: 'Select Emotional Energy (Heart)',
        color: '#84AF40',
        emotions: [
            'Joyful', 'Grateful', 'Content', 'Hopeful', 'Neutral', 'Anxious',
            'Sad', 'Frustrated', 'Lonely', 'Angry'
        ]
    },
    environmental: {
        title: 'Select Environmental Energy (Space)',
        color: '#23A9E7',
        emotions: [
            'Inspired', 'Safe', 'Comfortable', 'Connected', 'Restless', 'Cluttered',
            'Isolated', 'Overstimulated', 'Trapped', 'Peaceful'
        ]
    }
};

// State
const state = {
    selections: {},       // { physical: 'Burnt Out', mental: null, ... }
    currentCategory: null,
    selectedEmotion: null, // temp selection on detail page
};

// ============================================
// DOM
// ============================================
const pageHome = document.getElementById('pageHome');
const pageDetail = document.getElementById('pageDetail');
const detailTitle = document.getElementById('detailTitle');
const canvasViewport = document.getElementById('canvasViewport');
const canvasWorld = document.getElementById('canvasWorld');
const detailFooter = document.getElementById('detailFooter');
const confirmBtn = document.getElementById('confirmBtn');
const confirmLabel = document.getElementById('confirmLabel');
const ctaBtn = document.getElementById('ctaBtn');
const btnBack = document.getElementById('btnBack');
const cardSlots = document.querySelectorAll('.card-slot');

// ============================================
// HOME PAGE LOGIC
// ============================================
cardSlots.forEach(slot => {
    slot.addEventListener('click', () => {
        const category = slot.dataset.category;
        openDetailPage(category);
    });
});

function updateHomeCards() {
    cardSlots.forEach(slot => {
        const category = slot.dataset.category;
        const selection = state.selections[category];
        const label = slot.querySelector('.sticker-label');

        if (selection) {
            slot.classList.add('selected');
            label.textContent = selection;
        } else {
            slot.classList.remove('selected');
            const names = {
                physical: '(Physical Energy)',
                mental: '(Mental Energy)',
                emotional: '(Emotional Energy)',
                environmental: '(Environmental Energy)'
            };
            label.textContent = names[category];
        }
    });

    // Update CTA
    const allSelected = Object.keys(CATEGORIES).every(k => state.selections[k]);
    ctaBtn.disabled = !allSelected;
}

// ============================================
// NAVIGATION
// ============================================
function openDetailPage(category) {
    state.currentCategory = category;
    state.selectedEmotion = state.selections[category] || null;
    const cat = CATEGORIES[category];

    detailTitle.textContent = cat.title;
    buildCanvas(cat);
    updateDetailFooter();

    pageHome.classList.remove('active');
    pageDetail.classList.add('active');
    startProximityLoop();
}

function closeDetailPage() {
    stopProximityLoop();
    pageDetail.classList.remove('active');
    pageHome.classList.add('active');
    state.currentCategory = null;
    state.selectedEmotion = null;
}

btnBack.addEventListener('click', closeDetailPage);

confirmBtn.addEventListener('click', () => {
    if (state.selectedEmotion && state.currentCategory) {
        state.selections[state.currentCategory] = state.selectedEmotion;
        updateHomeCards();
        closeDetailPage();
    }
});

ctaBtn.addEventListener('click', () => {
    // All emotions selected - could navigate to next step
    console.log('Journey complete!', state.selections);
});

// ============================================
// DETAIL FOOTER
// ============================================
function updateDetailFooter() {
    if (state.selectedEmotion) {
        confirmLabel.textContent = `Confirm: ${state.selectedEmotion}`;
        detailFooter.classList.remove('hidden');
    } else {
        detailFooter.classList.add('hidden');
    }
}

// ============================================
// CANVAS - INFINITE GRID SYSTEM
//
// Circles tile infinitely in all directions.
// Chunks are spawned/recycled as the user pans.
// Each chunk = CHUNK_COLS x CHUNK_ROWS circles.
// ============================================

const CIRCLE_SIZE = 100;
const GRID_GAP = 30;
const CELL_SIZE = CIRCLE_SIZE + GRID_GAP; // 130px
const CHUNK_COLS = 5;
const CHUNK_ROWS = 5;
const CHUNK_W = CHUNK_COLS * CELL_SIZE;   // 650px
const CHUNK_H = CHUNK_ROWS * CELL_SIZE;
const CHUNK_BUFFER = 1; // extra ring around viewport

let activeChunks = {};
let currentCat = null;

function buildCanvas(cat) {
    canvasWorld.innerHTML = '';
    activeChunks = {};
    currentCat = cat;
    resetCanvasPosition();
    updateChunks(true);
}

function createChunk(cx, cy, isInitial) {
    const key = cx + ',' + cy;
    if (activeChunks[key]) return;

    const emotions = currentCat.emotions;
    const baseColor = currentCat.color;
    const frag = document.createDocumentFragment();

    for (let r = 0; r < CHUNK_ROWS; r++) {
        for (let c = 0; c < CHUNK_COLS; c++) {
            const globalCol = cx * CHUNK_COLS + c;
            const globalRow = cy * CHUNK_ROWS + r;

            // Wrap emotion index (handles negatives)
            const idx = (((globalRow * 7 + globalCol) % emotions.length) + emotions.length) % emotions.length;
            const emotion = emotions[idx];

            const x = globalCol * CELL_SIZE;
            const y = globalRow * CELL_SIZE;

            const node = document.createElement('div');
            node.className = 'emotion-node size-sm';
            node.style.width = CIRCLE_SIZE + 'px';
            node.style.height = CIRCLE_SIZE + 'px';
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.style.background = baseColor;
            node.dataset.emotion = emotion;

            if (isInitial) {
                // Stagger entrance from viewport center
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const sx = x * canvasZoom + canvasX + CIRCLE_SIZE / 2;
                const sy = y * canvasZoom + canvasY + CIRCLE_SIZE / 2;
                const dist = Math.sqrt((sx - vw / 2) ** 2 + (sy - vh / 2) ** 2);
                const maxDist = Math.sqrt(vw * vw + vh * vh) / 2;
                const t = Math.min(dist / maxDist, 1);

                const delay = t * 0.35;
                const duration = 0.6 + t * 0.3;
                const scale = 2.6 + Math.random() * 0.4;

                node.style.setProperty('--enter-delay', delay.toFixed(2) + 's');
                node.style.setProperty('--enter-duration', duration.toFixed(2) + 's');
                node.style.setProperty('--enter-scale', scale.toFixed(2));
                node.style.setProperty('--label-delay', (delay + duration - 0.15).toFixed(2) + 's');
            } else {
                // Chunks spawned while panning — appear instantly
                node.style.setProperty('--enter-delay', '0s');
                node.style.setProperty('--enter-duration', '0.3s');
                node.style.setProperty('--enter-scale', '1.1');
                node.style.setProperty('--label-delay', '0.1s');
            }

            node.addEventListener('animationend', () => {
                node.classList.add('entered');
            }, { once: true });

            if (state.selectedEmotion === emotion) {
                node.classList.add('selected');
            }

            const label = document.createElement('span');
            label.className = 'emotion-node-label';
            label.textContent = emotion;
            node.appendChild(label);

            node._baseSize = CIRCLE_SIZE;
            node._currentScale = 1;
            node._targetScale = 1;

            frag.appendChild(node);
        }
    }

    const chunkEl = document.createElement('div');
    chunkEl.dataset.key = key;
    chunkEl.style.position = 'absolute';
    chunkEl.appendChild(frag);
    canvasWorld.appendChild(chunkEl);
    activeChunks[key] = chunkEl;
}

function updateChunks(isInitial) {
    if (!currentCat) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Viewport bounds in world coords
    const worldLeft   = -canvasX / canvasZoom;
    const worldTop    = -canvasY / canvasZoom;
    const worldRight  = worldLeft + vw / canvasZoom;
    const worldBottom = worldTop + vh / canvasZoom;

    const cxMin = Math.floor(worldLeft / CHUNK_W) - CHUNK_BUFFER;
    const cxMax = Math.floor(worldRight / CHUNK_W) + CHUNK_BUFFER;
    const cyMin = Math.floor(worldTop / CHUNK_H) - CHUNK_BUFFER;
    const cyMax = Math.floor(worldBottom / CHUNK_H) + CHUNK_BUFFER;

    const needed = new Set();
    for (let cy = cyMin; cy <= cyMax; cy++) {
        for (let cx = cxMin; cx <= cxMax; cx++) {
            needed.add(cx + ',' + cy);
        }
    }

    // Spawn missing
    needed.forEach(key => {
        if (!activeChunks[key]) {
            const [cx, cy] = key.split(',').map(Number);
            createChunk(cx, cy, isInitial);
        }
    });

    // Remove far-away chunks
    Object.keys(activeChunks).forEach(key => {
        if (!needed.has(key)) {
            activeChunks[key].remove();
            delete activeChunks[key];
        }
    });
}

function selectEmotion(emotion) {
    // If same emotion tapped again, deselect
    if (state.selectedEmotion === emotion) {
        state.selectedEmotion = null;
    } else {
        state.selectedEmotion = emotion;
    }

    // Update node states
    document.querySelectorAll('.emotion-node').forEach(node => {
        if (node.dataset.emotion === state.selectedEmotion) {
            node.classList.add('selected');
        } else {
            node.classList.remove('selected');
        }
    });

    updateDetailFooter();
}

// ============================================
// CURSOR PROXIMITY RIPPLE EFFECT
// ============================================
let cursorScreenX = -9999;
let cursorScreenY = -9999;
let proximityRAF = null;
let proximityActive = false;

// Track cursor position in screen coords (works during drag too)
canvasViewport.addEventListener('pointermove', (e) => {
    cursorScreenX = e.clientX;
    cursorScreenY = e.clientY;
});

// When cursor leaves the viewport, reset
canvasViewport.addEventListener('pointerleave', () => {
    cursorScreenX = -9999;
    cursorScreenY = -9999;
});

const PROXIMITY_RADIUS = 220;  // px — how far the effect reaches
const SCALE_MAX = 1.4;        // closest circle scale
const SCALE_MIN = 0.75;        // far-away circle scale (subtle shrink)
const SCALE_REST = 0.75;        // default when cursor is gone
const LERP_SPEED = 0.1;        // smoothing factor (0-1, lower = smoother)

function startProximityLoop() {
    if (proximityActive) return;
    proximityActive = true;
    proximityStep();
}

function stopProximityLoop() {
    proximityActive = false;
    if (proximityRAF) {
        cancelAnimationFrame(proximityRAF);
        proximityRAF = null;
    }
    // Reset all nodes to scale 1
    document.querySelectorAll('.emotion-node.entered').forEach(node => {
        node._targetScale = SCALE_REST;
        node._currentScale = SCALE_REST;
        node.style.transform = 'scale(1)';
    });
}

function proximityStep() {
    if (!proximityActive) return;

    const nodes = canvasWorld.querySelectorAll('.emotion-node.entered');
    const cursorGone = cursorScreenX < -999;

    nodes.forEach(node => {
        if (node.classList.contains('selected')) {
            node._targetScale = 1.12; // selected stays at its own scale
            node._currentScale = lerp(node._currentScale, node._targetScale, LERP_SPEED);
            node.style.transform = `scale(${node._currentScale.toFixed(3)})`;
            return;
        }

        if (cursorGone) {
            node._targetScale = SCALE_REST;
        } else {
            // Get node center in screen coords
            const rect = node.getBoundingClientRect();
            const nodeCX = rect.left + rect.width / 2;
            const nodeCY = rect.top + rect.height / 2;

            const dx = cursorScreenX - nodeCX;
            const dy = cursorScreenY - nodeCY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < PROXIMITY_RADIUS) {
                // Map distance to scale: 0 distance → SCALE_MAX, PROXIMITY_RADIUS → SCALE_REST
                const t = 1 - (dist / PROXIMITY_RADIUS);
                const eased = t * t * (3 - 2 * t); // smoothstep for organic feel
                node._targetScale = SCALE_REST + (SCALE_MAX - SCALE_REST) * eased;
            } else {
                // Subtle shrink for far circles (makes nearby ones pop more)
                const farT = Math.min((dist - PROXIMITY_RADIUS) / 300, 1);
                node._targetScale = SCALE_REST - (SCALE_REST - SCALE_MIN) * farT * 0.3;
            }
        }

        // Smooth lerp toward target
        node._currentScale = lerp(node._currentScale, node._targetScale, LERP_SPEED);
        node.style.transform = `scale(${node._currentScale.toFixed(3)})`;
    });

    proximityRAF = requestAnimationFrame(proximityStep);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ============================================
// CANVAS DRAG (Touch + Mouse)
// ============================================
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let canvasX = 0;
let canvasY = 0;
let velocityX = 0;
let velocityY = 0;
let lastMoveX = 0;
let lastMoveY = 0;
let momentumRAF = null;
let didDrag = false;

function resetCanvasPosition() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvasZoom = 1;
    // Center viewport on world origin (0,0)
    canvasX = vw / 2;
    canvasY = vh / 2;
    applyCanvasTransform();
}

let canvasZoom = 1;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.0;
const ZOOM_SPEED = 0.001;

function applyCanvasTransform() {
    canvasWorld.style.transform = `translate(${canvasX}px, ${canvasY}px) scale(${canvasZoom})`;
}

// Zoom with scroll wheel / trackpad pinch
canvasViewport.addEventListener('wheel', (e) => {
    e.preventDefault();

    const oldZoom = canvasZoom;

    // Pinch gesture (ctrlKey) or regular scroll
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * ZOOM_SPEED;
    canvasZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, canvasZoom + delta * canvasZoom));

    // Zoom toward cursor position
    const rect = canvasViewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const scaleChange = canvasZoom / oldZoom;
    canvasX = cursorX - (cursorX - canvasX) * scaleChange;
    canvasY = cursorY - (cursorY - canvasY) * scaleChange;

    applyCanvasTransform();
    updateChunks(false);
}, { passive: false });

let pointerStartTarget = null;

canvasViewport.addEventListener('pointerdown', (e) => {
    pointerStartTarget = e.target;
    isDragging = true;
    didDrag = false;
    dragStartX = e.clientX - canvasX;
    dragStartY = e.clientY - canvasY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    velocityX = 0;
    velocityY = 0;
    if (momentumRAF) cancelAnimationFrame(momentumRAF);
});

canvasViewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStartX;
    const newY = e.clientY - dragStartY;

    velocityX = e.clientX - lastMoveX;
    velocityY = e.clientY - lastMoveY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;

    if (Math.abs(canvasX - newX) > 4 || Math.abs(canvasY - newY) > 4) {
        didDrag = true;
    }

    canvasX = newX;
    canvasY = newY;
    applyCanvasTransform();
    updateChunks(false);
});

canvasViewport.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;

    // If user didn't drag, treat as a tap — find the emotion node
    if (!didDrag) {
        const node = pointerStartTarget && pointerStartTarget.closest('.emotion-node');
        if (node) {
            selectEmotion(node.dataset.emotion);
        }
    }

    pointerStartTarget = null;

    // Momentum
    if (didDrag && (Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1)) {
        applyMomentum();
    }
});

function applyMomentum() {
    const friction = 0.95;
    function step() {
        velocityX *= friction;
        velocityY *= friction;
        canvasX += velocityX;
        canvasY += velocityY;
        applyCanvasTransform();
        updateChunks(false);

        if (Math.abs(velocityX) > 0.3 || Math.abs(velocityY) > 0.3) {
            momentumRAF = requestAnimationFrame(step);
        }
    }
    momentumRAF = requestAnimationFrame(step);
}


// ============================================
// INIT
// ============================================
updateHomeCards();
