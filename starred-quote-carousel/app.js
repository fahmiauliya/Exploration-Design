// ===== QUOTE DATA =====
const quotes = [
  {
    text: 'Out of difficulties grow miracles.',
    author: 'Jean de La Bruyère'
  },
  {
    text: 'The greater the difficulty, the more glory in surmounting it.',
    author: 'Epictetus'
  },
  {
    text: 'You may encounter many defeats, but you must not be defeated.',
    author: 'Maya Angelou'
  },
  {
    text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.',
    author: 'Bruce Lee'
  }
];

// ===== STATE =====
let currentIndex = 0;
const totalCards = quotes.length;
const starred = new Set();

// ===== ELEMENTS =====
const cardsTrack = document.getElementById('cardsTrack');
const actionBar = document.getElementById('actionBar');
const pageNumber = document.getElementById('pageNumber');

// ===== SVG ICONS =====
const quoteIconSVG = `<svg width="30" height="24" viewBox="0 0 30 24" fill="none">
  <path d="M12.9629 2.59259L7.22221 13.6111L4.35185 14.3518C4.66049 13.6728 5.03086 13.1173 5.46296 12.6852C5.95678 12.2531 6.51234 12.037 7.12962 12.037C8.42592 12.037 9.59875 12.5617 10.6481 13.6111C11.7592 14.6605 12.3148 16.0185 12.3148 17.6852C12.3148 19.3518 11.6975 20.8333 10.463 22.1296C9.29011 23.3642 7.87036 23.9815 6.2037 23.9815C4.53703 23.9815 3.08642 23.3642 1.85185 22.1296C0.617283 20.895 0 19.4136 0 17.6852C0 16.9444 0.154321 16.1111 0.462962 15.1852C0.771604 14.1975 1.2963 12.9629 2.03704 11.4815L8.24073 0L12.9629 2.59259ZM30 2.59259L24.2592 13.6111L21.3889 14.3518C21.6975 13.6728 22.0679 13.1173 22.5 12.6852C22.9938 12.2531 23.5494 12.037 24.1666 12.037C25.4629 12.037 26.6358 12.5617 27.6852 13.6111C28.7963 14.6605 29.3518 16.0185 29.3518 17.6852C29.3518 19.3518 28.7345 20.8333 27.5 22.1296C26.3271 23.3642 24.9074 23.9815 23.2407 23.9815C21.5741 23.9815 20.1234 23.3642 18.8889 22.1296C17.6543 20.895 17.037 19.4136 17.037 17.6852C17.037 16.9444 17.1913 16.1111 17.5 15.1852C17.8086 14.1975 18.3333 12.9629 19.0741 11.4815L25.2777 0L30 2.59259Z" fill="black"/>
</svg>`;

const starBadgeSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M6.86922 6.1167L1.55255 6.88754L1.45838 6.9067C1.31583 6.94455 1.18588 7.01954 1.08179 7.12404C0.977707 7.22853 0.903219 7.35878 0.865934 7.50147C0.82865 7.64417 0.829905 7.79421 0.869572 7.93626C0.909239 8.07832 0.985896 8.2073 1.09172 8.31004L4.94338 12.0592L4.03505 17.355L4.02422 17.4467C4.01549 17.5941 4.0461 17.7412 4.11292 17.873C4.17974 18.0047 4.28037 18.1163 4.4045 18.1963C4.52862 18.2763 4.67179 18.3219 4.81934 18.3285C4.96689 18.335 5.11352 18.3022 5.24422 18.2334L9.99922 15.7334L14.7434 18.2334L14.8267 18.2717C14.9643 18.3259 15.1138 18.3425 15.2598 18.3198C15.4059 18.2972 15.5434 18.2361 15.658 18.1428C15.7727 18.0495 15.8605 17.9273 15.9124 17.7889C15.9643 17.6505 15.9784 17.5007 15.9534 17.355L15.0442 12.0592L18.8975 8.3092L18.9625 8.23837C19.0554 8.12401 19.1163 7.98708 19.139 7.84153C19.1617 7.69598 19.1454 7.54702 19.0918 7.40981C19.0382 7.2726 18.9492 7.15206 18.8338 7.06046C18.7184 6.96886 18.5808 6.90948 18.435 6.88837L13.1184 6.1167L10.7417 1.30003C10.6729 1.16048 10.5665 1.04296 10.4344 0.960788C10.3023 0.878613 10.1498 0.83506 9.99422 0.83506C9.83864 0.83506 9.68616 0.878613 9.55406 0.960788C9.42195 1.04296 9.31549 1.16048 9.24671 1.30003L6.86922 6.1167Z" fill="white"/>
</svg>`;

const starOverlaySVG = `<svg width="64" height="64" viewBox="0 0 20 20" fill="none">
  <path d="M6.86922 6.1167L1.55255 6.88754L1.45838 6.9067C1.31583 6.94455 1.18588 7.01954 1.08179 7.12404C0.977707 7.22853 0.903219 7.35878 0.865934 7.50147C0.82865 7.64417 0.829905 7.79421 0.869572 7.93626C0.909239 8.07832 0.985896 8.2073 1.09172 8.31004L4.94338 12.0592L4.03505 17.355L4.02422 17.4467C4.01549 17.5941 4.0461 17.7412 4.11292 17.873C4.17974 18.0047 4.28037 18.1163 4.4045 18.1963C4.52862 18.2763 4.67179 18.3219 4.81934 18.3285C4.96689 18.335 5.11352 18.3022 5.24422 18.2334L9.99922 15.7334L14.7434 18.2334L14.8267 18.2717C14.9643 18.3259 15.1138 18.3425 15.2598 18.3198C15.4059 18.2972 15.5434 18.2361 15.658 18.1428C15.7727 18.0495 15.8605 17.9273 15.9124 17.7889C15.9643 17.6505 15.9784 17.5007 15.9534 17.355L15.0442 12.0592L18.8975 8.3092L18.9625 8.23837C19.0554 8.12401 19.1163 7.98708 19.139 7.84153C19.1617 7.69598 19.1454 7.54702 19.0918 7.40981C19.0382 7.2726 18.9492 7.15206 18.8338 7.06046C18.7184 6.96886 18.5808 6.90948 18.435 6.88837L13.1184 6.1167L10.7417 1.30003C10.6729 1.16048 10.5665 1.04296 10.4344 0.960788C10.3023 0.878613 10.1498 0.83506 9.99422 0.83506C9.83864 0.83506 9.68616 0.878613 9.55406 0.960788C9.42195 1.04296 9.31549 1.16048 9.24671 1.30003L6.86922 6.1167Z" fill="#DBD94F"/>
</svg>`;

// ===== RENDER CARDS =====
function renderCards() {
  cardsTrack.innerHTML = '';
  quotes.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'quote-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="card-quote-icon">${quoteIconSVG}</div>
      <span class="card-quote">${q.text}</span>
      <span class="card-author">${q.author}</span>
      <div class="star-badge">${starBadgeSVG}</div>
      <div class="star-overlay">${starOverlaySVG}</div>
    `;
    if (starred.has(i)) card.classList.add('starred');
    cardsTrack.appendChild(card);
  });
  updatePositions(false);
}

function renderActionBar() {
  actionBar.innerHTML = '';

  const pill = document.createElement('button');
  pill.className = 'action-pill';
  pill.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
    <span class="action-pill-label">dg.blog</span>
  `;

  const rightGroup = document.createElement('div');
  rightGroup.className = 'action-right';

  const thumbsUp = document.createElement('button');
  thumbsUp.className = 'action-btn';
  thumbsUp.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  `;

  const thumbsDown = document.createElement('button');
  thumbsDown.className = 'action-btn';
  thumbsDown.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  `;

  rightGroup.appendChild(thumbsUp);
  rightGroup.appendChild(thumbsDown);

  actionBar.appendChild(pill);
  actionBar.appendChild(rightGroup);
}

// ===== CARD POSITIONING =====
const GAP = 12;

function getCardStep() {
  const card = cardsTrack.querySelector('.quote-card');
  return card ? card.offsetWidth + GAP : 0;
}

function updatePositions(animate) {
  const cards = cardsTrack.querySelectorAll('.quote-card');
  const step = getCardStep();
  if (animate) {
    cardsTrack.classList.add('transitioning');
  } else {
    cardsTrack.classList.remove('transitioning');
  }
  cards.forEach((card, i) => {
    const offset = (i - currentIndex) * step;
    card.style.transform = `translateX(${offset}px)`;
  });
  if (animate) {
    setTimeout(() => cardsTrack.classList.remove('transitioning'), 500);
  }
}

function updateUI() {
  pageNumber.textContent = `${currentIndex + 1}/${totalCards}`;
  renderActionBar();
}

// ===== NAVIGATION =====
function goTo(index) {
  if (index < 0 || index >= totalCards) return;
  currentIndex = index;
  updatePositions(true);
  updateUI();
}

function goNext() {
  if (currentIndex < totalCards - 1) goTo(currentIndex + 1);
}

function goPrev() {
  if (currentIndex > 0) goTo(currentIndex - 1);
}

// ===== STAR =====
function triggerStar(cardIndex) {
  const cards = cardsTrack.querySelectorAll('.quote-card');
  const card = cards[cardIndex];
  if (!card) return;

  if (starred.has(cardIndex)) {
    starred.delete(cardIndex);
    card.classList.remove('starred');
  } else {
    starred.add(cardIndex);
    // Show overlay animation
    const overlay = card.querySelector('.star-overlay');
    overlay.classList.add('visible');
    setTimeout(() => {
      overlay.classList.remove('visible');
      card.classList.add('starred');
    }, 300);
  }
}

// ===== SWIPE HANDLING =====
let isDragging = false;
let startX = 0;
let startY = 0;
let dragDeltaX = 0;
let dragDeltaY = 0;
let dragDirection = null; // 'horizontal' | 'vertical' | null

function onDragStart(e) {
  isDragging = true;
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;
  dragDeltaX = 0;
  dragDeltaY = 0;
  dragDirection = null;
  cardsTrack.classList.remove('transitioning');
}

function onDragMove(e) {
  if (!isDragging) return;
  const touch = e.touches ? e.touches[0] : e;
  dragDeltaX = touch.clientX - startX;
  dragDeltaY = touch.clientY - startY;

  // Lock direction after 10px movement
  if (!dragDirection && (Math.abs(dragDeltaX) > 10 || Math.abs(dragDeltaY) > 10)) {
    dragDirection = Math.abs(dragDeltaX) > Math.abs(dragDeltaY) ? 'horizontal' : 'vertical';
  }

  if (dragDirection === 'horizontal') {
    const cards = cardsTrack.querySelectorAll('.quote-card');
    const step = getCardStep();
    cards.forEach((card, i) => {
      const offset = (i - currentIndex) * step + dragDeltaX;
      card.style.transform = `translateX(${offset}px)`;
    });
  } else if (dragDirection === 'vertical' && dragDeltaY > 5) {
    // Drag down on card — show star overlay with yellow border + slight pull down
    const cards = cardsTrack.querySelectorAll('.quote-card');
    const card = cards[currentIndex];
    if (card) {
      card.classList.add('dragging-star');
      const pullDown = Math.min(dragDeltaY * 0.15, 5);
      card.style.transform = `translateY(${pullDown}px)`;
    }
  }
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  if (dragDirection === 'horizontal') {
    const trackWidth = cardsTrack.offsetWidth;
    const threshold = trackWidth * 0.2;
    if (dragDeltaX < -threshold && currentIndex < totalCards - 1) {
      goNext();
    } else if (dragDeltaX > threshold && currentIndex > 0) {
      goPrev();
    } else {
      updatePositions(true);
    }
  } else if (dragDirection === 'vertical' && dragDeltaY > 30) {
    // Trigger star on pull-down
    const cards = cardsTrack.querySelectorAll('.quote-card');
    const card = cards[currentIndex];
    if (card) {
      card.classList.remove('dragging-star');
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 300);
    }
    triggerStar(currentIndex);
  } else {
    // Snap back — remove dragging state
    const cards = cardsTrack.querySelectorAll('.quote-card');
    const card = cards[currentIndex];
    if (card) {
      card.classList.remove('dragging-star');
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 300);
    }
    updatePositions(true);
  }

  dragDirection = null;
}

// ===== EVENT LISTENERS =====
cardsTrack.addEventListener('touchstart', onDragStart, { passive: true });
cardsTrack.addEventListener('touchmove', onDragMove, { passive: true });
cardsTrack.addEventListener('touchend', onDragEnd);
cardsTrack.addEventListener('mousedown', onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup', onDragEnd);

// ===== INIT =====
renderCards();
updateUI();
