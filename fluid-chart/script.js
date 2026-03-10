/* ============================================================
   FLUID CHART — script.js
   ============================================================ */

'use strict';

/* ─── DATA ───────────────────────────────────────────────────
   Each filter: normalized points (0–1), labels, change info, stats.
──────────────────────────────────────────────────────────────*/

const DATA = {
  '1H': {
    pts:  [0.46,0.49,0.51,0.50,0.53,0.56,0.54,0.58,0.60,
           0.58,0.62,0.64,0.61,0.65,0.68,0.66,0.70,0.72,
           0.70,0.74,0.76,0.73,0.77,0.80,0.78,0.82,0.84,0.86],
    labs: ['9:00','9:02','9:04','9:06','9:08','9:10','9:12','9:14','9:16',
           '9:18','9:20','9:22','9:24','9:26','9:28','9:30','9:32','9:34',
           '9:36','9:38','9:40','9:42','9:44','9:46','9:48','9:50','9:52','9:54'],
    change: '+$24.18', pct: '+0.58%', period: '1h', pos: true,
    high: '$4,240.10', low: '$4,194.20', vol: '$2.1B',
    balance: '4,218.36 USDC', balUsd: '$4,218.36', balChange: '+$24.18 today',
  },
  '1D': {
    pts:  [0.60,0.56,0.50,0.46,0.50,0.56,0.60,0.54,0.48,
           0.44,0.48,0.52,0.58,0.65,0.70,0.72,0.68,0.72,
           0.76,0.80,0.76,0.72,0.68,0.72,0.76,0.80,0.84,0.86],
    labs: Array.from({length:28},(_,i)=>String(i).padStart(2,'0')+':00'),
    change: '+$101.44', pct: '+2.46%', period: '24h', pos: true,
    high: '$4,240.10', low: '$4,101.55', vol: '$18.4B',
    balance: '4,218.36 USDC', balUsd: '$4,218.36', balChange: '+$101.44 today',
  },
  '1W': {
    pts:  [0.84,0.80,0.76,0.70,0.66,0.62,0.58,0.54,0.50,
           0.46,0.50,0.54,0.58,0.62,0.66,0.68,0.72,0.74,
           0.70,0.74,0.78,0.74,0.78,0.80,0.76,0.80,0.82,0.80],
    labs: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue',
           'Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu',
           'Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    change: '-$198.22', pct: '-4.49%', period: '7d', pos: false,
    high: '$4,420.55', low: '$3,980.14', vol: '$98.6B',
    balance: '4,218.36 USDC', balUsd: '$4,218.36', balChange: '-$198.22 today',
  },
  '1M': {
    pts:  [0.38,0.40,0.44,0.42,0.38,0.36,0.40,0.44,0.48,
           0.52,0.56,0.54,0.58,0.62,0.64,0.60,0.64,0.68,
           0.66,0.70,0.74,0.72,0.76,0.80,0.77,0.80,0.83,0.82],
    labs: Array.from({length:28},(_,i)=>`Day ${i+1}`),
    change: '+$622.14', pct: '+17.27%', period: '30d', pos: true,
    high: '$4,350.88', low: '$3,540.22', vol: '$412B',
    balance: '4,218.36 USDC', balUsd: '$4,218.36', balChange: '+$622.14 this month',
  },
  '1Y': {
    pts:  [0.18,0.20,0.24,0.28,0.32,0.28,0.24,0.30,0.36,
           0.42,0.48,0.54,0.60,0.66,0.62,0.56,0.62,0.70,
           0.76,0.72,0.66,0.72,0.78,0.82,0.78,0.82,0.85,0.84],
    labs: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep',
           'Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun',
           'Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
    change: '+$2,841.50', pct: '+206.8%', period: '1y', pos: true,
    high: '$4,780.40', low: '$1,204.86', vol: '$5.2T',
    balance: '4,218.36 USDC', balUsd: '$4,218.36', balChange: '+$2,841.50 this year',
  },
};

/* Price range for hover display */
const BASE  = 4218.36;
const PMIN  = BASE * 0.70;
const PMAX  = BASE * 1.10;

function normToPrice(n) {
  return PMIN + n * (PMAX - PMIN);
}

/* ─── STATE ──────────────────────────────────────────────── */

let active    = '1D';
let hovering  = false;

/* ─── DOM ────────────────────────────────────────────────── */

const chartSvg    = document.getElementById('chartSvg');
const chartArea   = document.getElementById('chartArea');
const chartLine   = document.getElementById('chartLine');
const hoverLine   = document.getElementById('hoverLine');
const hoverDot    = document.getElementById('hoverDot');
const chartTooltip= document.getElementById('chartTooltip');
const ttPrice     = document.getElementById('ttPrice');
const ttTime      = document.getElementById('ttTime');
const chartWrap   = document.getElementById('chartWrap');
const deviceFrame = document.querySelector('.device-frame');

const priceMain   = document.getElementById('priceMain');
const changeBadge = document.getElementById('changeBadge');
const changePct   = document.getElementById('changePct');

const nowLine     = document.getElementById('nowLine');
const nowDot      = document.getElementById('nowDot');
const nowLabel    = document.getElementById('nowLabel');

const statHigh    = document.getElementById('statHigh');
const statLow     = document.getElementById('statLow');
const statVol     = document.getElementById('statVol');

const balanceAmount = document.getElementById('balanceAmount');
const balanceUsd    = document.getElementById('balanceUsd');
const balanceChange = document.getElementById('balanceChange');

const tfBtns = document.querySelectorAll('.tf-btn');

/* SVG viewBox dimensions */
const VW = 375;
const VH = 300;

/* ─── PATH BUILDER ───────────────────────────────────────── */

/* "Today" index — 80% through the data */
const NOW_RATIO = 0.8;

function buildPaths(pts) {
  const n    = pts.length;
  const step = VW / (n - 1);

  const coords = pts.map((v, i) => ({
    x: i * step,
    y: VH - v * (VH * 0.88) - VH * 0.04,
  }));

  /* Only draw up to the "now" point */
  const nowIdx  = Math.round((n - 1) * NOW_RATIO);
  const visible = coords.slice(0, nowIdx + 1);

  let d = `M ${visible[0].x.toFixed(1)} ${visible[0].y.toFixed(1)}`;
  for (let i = 0; i < visible.length - 1; i++) {
    const a = visible[i], b = visible[i + 1];
    const cx = (a.x + b.x) / 2;
    d += ` C ${cx.toFixed(1)} ${a.y.toFixed(1)}, ${cx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }

  const last  = visible[visible.length - 1];
  const first = visible[0];
  const area  = `${d} L ${last.x.toFixed(1)} ${VH} L ${first.x.toFixed(1)} ${VH} Z`;

  return { line: d, area, coords, nowIdx };
}

/* ─── GRADIENT COLORS ────────────────────────────────────── */

const GRAD = {
  pos: { stroke: '#22c55e', stops: ['rgba(34,197,94,0.22)','rgba(34,197,94,0.06)','rgba(34,197,94,0)'] },
  neg: { stroke: '#ef4444', stops: ['rgba(239,68,68,0.18)','rgba(239,68,68,0.05)','rgba(239,68,68,0)'] },
};

function applyGradient(pos) {
  const g    = pos ? GRAD.pos : GRAD.neg;
  const s0   = document.getElementById('gradStop0');
  const s1   = document.getElementById('gradStop1');
  const s2   = document.getElementById('gradStop2');
  if (s0) s0.setAttribute('stop-color', g.stops[0]);
  if (s1) s1.setAttribute('stop-color', g.stops[1]);
  if (s2) s2.setAttribute('stop-color', g.stops[2]);
  chartLine.setAttribute('stroke', g.stroke);
  hoverDot.setAttribute('fill', g.stroke);
}

/* ─── RENDER ─────────────────────────────────────────────── */

function renderChart(filter) {
  const d = DATA[filter];
  if (!d) return;

  const { line, area, coords, nowIdx } = buildPaths(d.pts);

  chartLine.setAttribute('d', line);
  chartArea.setAttribute('d', area);
  applyGradient(d.pos);

  /* Cache for hover (only up to "now") */
  chartSvg._coords = coords.slice(0, nowIdx + 1);
  chartSvg._data   = d;

  /* Now marker */
  const nowPt = coords[nowIdx];

  nowLine.setAttribute('x1', nowPt.x);
  nowLine.setAttribute('x2', nowPt.x);
  nowLine.setAttribute('opacity', '1');
  nowDot.setAttribute('cx', nowPt.x);
  nowDot.setAttribute('cy', nowPt.y);
  nowDot.setAttribute('opacity', '1');

  /* Position "Today" label but keep hidden until hover */
  const wrapRect = chartWrap.getBoundingClientRect();
  const nowPixX  = (nowPt.x / VW) * wrapRect.width;
  nowLabel.style.left = `${nowPixX}px`;
  nowLabel.classList.remove('visible');

  /* Cache nowIdx for hover detection */
  chartSvg._nowIdx = nowIdx;

  /* Change badge */
  const posClass = d.pos ? 'positive' : 'negative';
  const icon = d.pos
    ? `<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1.5L7.5 6H1.5L4.5 1.5Z" fill="currentColor"/></svg>`
    : `<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 7.5L1.5 3H7.5L4.5 7.5Z" fill="currentColor"/></svg>`;

  changeBadge.innerHTML = icon + ' ';
  changeBadge.className = `change-badge ${posClass}`;
  const changeSpan = document.createElement('span');
  changeBadge.appendChild(changeSpan);
  animateScrollNumber(changeSpan, d.change, 400);

  changePct.className = `change-pct ${posClass}`;
  animateScrollNumber(changePct, `${d.pct} ${d.period}`, 400);

  /* Stats — scroll animation */
  animateScrollNumber(statHigh, d.high, 400);
  animateScrollNumber(statLow, d.low, 400);
  animateScrollNumber(statVol, d.vol, 400);

  /* Balance — scroll animation */
  animateScrollNumber(balanceAmount, d.balance, 400);
  animateScrollNumber(balanceUsd, d.balUsd, 400);
  animateScrollNumber(balanceChange, d.balChange, 400);
  balanceChange.className = `balance-change ${posClass}`;
}

/* ─── HOVER ──────────────────────────────────────────────── */

function getXY(e) {
  const rect = chartWrap.getBoundingClientRect();
  const cx   = e.touches ? e.touches[0].clientX : e.clientX;
  return { x: cx - rect.left, w: rect.width, h: rect.height };
}

function onEnter(e) {
  hovering = true;
  hoverLine.setAttribute('opacity', '1');
  hoverDot.setAttribute('opacity', '1');
  chartTooltip.classList.add('visible');
  onMove(e);
}

function onMove(e) {
  if (!hovering || !chartSvg._coords) return;

  const { x, w, h } = getXY(e);
  const coords = chartSvg._coords;
  const d      = chartSvg._data;
  const n      = coords.length;
  if (n < 2) return;
  const svgX   = (x / w) * VW;
  const step   = coords[1].x - coords[0].x;

  let idx = Math.max(0, Math.min(n - 1, Math.round(svgX / step)));
  const pt = coords[idx];

  hoverLine.setAttribute('x1', pt.x);
  hoverLine.setAttribute('x2', pt.x);
  hoverDot.setAttribute('cx', pt.x);
  hoverDot.setAttribute('cy', pt.y);

  /* Tooltip position */
  const pixX = (pt.x / VW) * w;
  const pixY = (pt.y / VH) * h;

  chartTooltip.style.left      = `${pixX}px`;
  chartTooltip.style.top       = `${Math.max(pixY - 54, 6)}px`;
  chartTooltip.style.transform = 'translateX(-50%)';

  const price = normToPrice(d.pts[idx]);
  ttPrice.textContent = '$' + price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});

  /* Show "Today" when hovering at the now index */
  const isAtNow = idx === chartSvg._nowIdx;
  ttTime.textContent = isAtNow ? 'Today' : (d.labs[idx] || '');
  nowLabel.classList.toggle('visible', isAtNow);

  /* Live price update while hovering */
  setPriceText(ttPrice.textContent);
}

function onLeave() {
  hovering = false;
  hoverLine.setAttribute('opacity', '0');
  hoverDot.setAttribute('opacity', '0');
  chartTooltip.classList.remove('visible');
  nowLabel.classList.remove('visible');
  const priceText = '$' + BASE.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  animateScrollNumber(priceMain, priceText, 350);
}

/* ─── TIME FILTER SWITCH ─────────────────────────────────── */

function switchFilter(f) {
  if (f === active) return;
  active = f;
  tfBtns.forEach(b => b.classList.toggle('active', b.dataset.tf === f));
  renderChart(f);
}

/* ─── AUTO CYCLE ─────────────────────────────────────────── */

const ORDER = ['1H','1D','1W','1M','1Y'];
let   cycleIdx = ORDER.indexOf('1D');
let   cycleTimer;
let   userActive = false;

function startCycle() {
  cycleTimer = setInterval(() => {
    if (userActive) { clearInterval(cycleTimer); return; }
    cycleIdx = (cycleIdx + 1) % ORDER.length;
    const f  = ORDER[cycleIdx];
    tfBtns.forEach(b => b.classList.toggle('active', b.dataset.tf === f));
    active = f;
    renderChart(f);
  }, 2600);
}

/* ─── EVENTS ─────────────────────────────────────────────── */

tfBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    userActive = true;
    switchFilter(btn.dataset.tf);
  });
});

chartWrap.addEventListener('mouseenter', onEnter);
chartWrap.addEventListener('mousemove',  onMove);
chartWrap.addEventListener('mouseleave', onLeave);

chartWrap.addEventListener('touchstart', e => { e.preventDefault(); userActive = true; onEnter(e); }, { passive: false });
chartWrap.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e); },  { passive: false });
chartWrap.addEventListener('touchend',   onLeave);

/* ─── SCROLL NUMBER ANIMATION ────────────────────────────── */

function animateScrollNumber(el, targetText, duration) {
  const chars = targetText.split('');
  el.innerHTML = '';

  chars.forEach((ch, i) => {
    if (/\d/.test(ch)) {
      const digit   = parseInt(ch, 10);
      const wrapper = document.createElement('span');
      wrapper.className = 'scroll-digit';

      const inner = document.createElement('span');
      inner.className = 'scroll-digit-inner';

      /* Build column: 0–9 then target digit on top */
      for (let n = 0; n <= 9; n++) {
        const s = document.createElement('span');
        s.textContent = String(n);
        inner.appendChild(s);
      }

      /* Start at random offset for stagger effect */
      const startDigit = Math.floor(Math.random() * 10);
      inner.style.transform = `translateY(-${startDigit}em)`;
      wrapper.appendChild(inner);
      el.appendChild(wrapper);

      /* Animate to target digit */
      const delay = 80 + i * 50;
      setTimeout(() => {
        inner.style.transitionDuration = `${duration + i * 60}ms`;
        inner.style.transform = `translateY(-${digit}em)`;
      }, delay);
    } else {
      const span = document.createElement('span');
      span.className = 'scroll-static';
      span.textContent = ch;
      el.appendChild(span);
    }
  });
}

function setPriceText(text) {
  priceMain.textContent = text;
}

/* ─── INIT ───────────────────────────────────────────────── */

function init() {
  renderChart(active);

  /* Scroll-in animation for the price on load */
  const priceText = '$' + BASE.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  setTimeout(() => animateScrollNumber(priceMain, priceText, 500), 200);

  setTimeout(startCycle, 2600);
}

init();