/* ============================================================
   FLUID CHART — script.js
   Chart logic, data, and interactions
   ============================================================ */

'use strict';

/* ─── CHART DATA ─────────────────────────────────────────────
   Each time filter holds an array of normalized price points (0–1).
   "base" is the reference USD price at the start of the period.
   "current" is the current displayed price.
   Prices are scaled from the normalized curve for display.
──────────────────────────────────────────────────────────────*/

const BASE_PRICE = 4218.36;

const TIME_DATASETS = {
  '1H': {
    points: [
      0.48, 0.50, 0.52, 0.49, 0.51, 0.54, 0.57, 0.55, 0.58,
      0.60, 0.58, 0.61, 0.63, 0.65, 0.62, 0.64, 0.67, 0.70,
      0.68, 0.72, 0.74, 0.71, 0.73, 0.76, 0.79, 0.77, 0.80, 0.82,
    ],
    labels: ['9:00','9:02','9:04','9:06','9:08','9:10','9:12','9:14','9:16',
             '9:18','9:20','9:22','9:24','9:26','9:28','9:30','9:32','9:34',
             '9:36','9:38','9:40','9:42','9:44','9:46','9:48','9:50','9:52','9:54'],
    changeAmt:  '+$24.18',
    changePct:  '+0.58%',
    positive:   true,
    high:       '$4,240.10',
    low:        '$4,194.20',
    vol:        '$2.1B',
  },
  '1D': {
    points: [
      0.60, 0.55, 0.50, 0.48, 0.52, 0.58, 0.62, 0.55, 0.50,
      0.45, 0.48, 0.52, 0.58, 0.65, 0.70, 0.72, 0.68, 0.71,
      0.74, 0.78, 0.75, 0.72, 0.69, 0.72, 0.76, 0.80, 0.82, 0.84,
    ],
    labels: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00',
             '09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00',
             '18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00'],
    changeAmt:  '+$101.44',
    changePct:  '+2.46%',
    positive:   true,
    high:       '$4,240.10',
    low:        '$4,101.55',
    vol:        '$18.4B',
  },
  '1W': {
    points: [
      0.82, 0.78, 0.74, 0.70, 0.68, 0.65, 0.62, 0.58, 0.55,
      0.52, 0.48, 0.50, 0.53, 0.57, 0.61, 0.64, 0.68, 0.72,
      0.74, 0.71, 0.75, 0.78, 0.74, 0.77, 0.80, 0.76, 0.79, 0.82,
    ],
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue',
             'Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu',
             'Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    changeAmt:  '-$198.22',
    changePct:  '-4.49%',
    positive:   false,
    high:       '$4,420.55',
    low:        '$3,980.14',
    vol:        '$98.6B',
  },
  '1M': {
    points: [
      0.40, 0.38, 0.42, 0.45, 0.43, 0.40, 0.38, 0.42, 0.46,
      0.50, 0.54, 0.52, 0.55, 0.58, 0.60, 0.57, 0.62, 0.66,
      0.64, 0.68, 0.72, 0.70, 0.74, 0.78, 0.75, 0.79, 0.82, 0.80,
    ],
    labels: Array.from({length: 28}, (_, i) => `Day ${i + 1}`),
    changeAmt:  '+$622.14',
    changePct:  '+17.27%',
    positive:   true,
    high:       '$4,350.88',
    low:        '$3,540.22',
    vol:        '$412B',
  },
  '1Y': {
    points: [
      0.20, 0.18, 0.22, 0.28, 0.32, 0.30, 0.26, 0.30, 0.36,
      0.42, 0.48, 0.52, 0.58, 0.64, 0.60, 0.55, 0.62, 0.68,
      0.74, 0.70, 0.66, 0.72, 0.76, 0.80, 0.77, 0.82, 0.85, 0.82,
    ],
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep',
             'Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun',
             'Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
    changeAmt:  '+$2,841.50',
    changePct:  '+206.8%',
    positive:   true,
    high:       '$4,780.40',
    low:        '$1,204.86',
    vol:        '$5.2T',
  },
};

/* ─── STATE ──────────────────────────────────────────────── */

let activeFilter = '1W';
let isHovering   = false;

/* ─── DOM REFS ───────────────────────────────────────────── */

const chartSvg    = document.getElementById('chartSvg');
const chartArea   = document.getElementById('chartArea');
const chartLine   = document.getElementById('chartLine');
const hoverLine   = document.getElementById('hoverLine');
const hoverDot    = document.getElementById('hoverDot');
const hoverTip    = document.getElementById('hoverTooltip');
const tipPrice    = document.getElementById('tooltipPrice');
const tipTime     = document.getElementById('tooltipTime');
const priceMain   = document.getElementById('priceMain');
const priceChangeBadge = document.getElementById('priceChangeBadge');
const priceChangePct   = document.getElementById('priceChangePct');
const navChange        = document.getElementById('navChange');
const statHigh    = document.getElementById('statHigh');
const statLow     = document.getElementById('statLow');
const statVol     = document.getElementById('statVol');
const balanceUsdChange = document.getElementById('balanceChange');
const tfBtns      = document.querySelectorAll('.tf-btn');
const chartWrap   = document.querySelector('.chart-wrap');
const deviceFrame = document.querySelector('.device-frame');

/* ─── SVG DIMENSIONS ─────────────────────────────────────── */

const VW = 360;
const VH = 180;

/* ─── PRICE SCALING ──────────────────────────────────────── */

/**
 * Map a normalized 0–1 value to a price in the chart's range.
 * The chart's y range is roughly ±30% of BASE_PRICE.
 */
function normToPrice(n) {
  const min = BASE_PRICE * 0.7;
  const max = BASE_PRICE * 1.1;
  return min + n * (max - min);
}

/* ─── PATH BUILDER ───────────────────────────────────────── */

/**
 * Build smooth cubic bezier paths from normalized points array.
 * Returns { linePath, areaPath, points (SVG coordinates) }
 */
function buildPaths(pts) {
  const n    = pts.length;
  const step = VW / (n - 1);

  // SVG points: y = VH - (val * VH) — higher value = higher on screen
  const svgPts = pts.map((v, i) => ({
    x: i * step,
    y: VH - v * (VH * 0.85) - VH * 0.05, // 5% padding top/bottom
  }));

  // Build smooth cubic bezier line
  let d = `M ${svgPts[0].x.toFixed(2)} ${svgPts[0].y.toFixed(2)}`;
  for (let i = 0; i < svgPts.length - 1; i++) {
    const p0 = svgPts[i];
    const p1 = svgPts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(2)} ${p0.y.toFixed(2)}, ${cx.toFixed(2)} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  const linePath = d;
  const last     = svgPts[n - 1];
  const first    = svgPts[0];
  const areaPath = `${d} L ${last.x.toFixed(2)} ${VH} L ${first.x.toFixed(2)} ${VH} Z`;

  return { linePath, areaPath, svgPts };
}

/* ─── CHART COLOR ────────────────────────────────────────── */

const GREEN = '#10d080';
const RED   = '#f04d4d';

const GRAD_STOPS_GREEN = [
  { offset: '0%',   color: '#10d080', opacity: '0.25' },
  { offset: '80%',  color: '#10d080', opacity: '0.04' },
  { offset: '100%', color: '#10d080', opacity: '0'    },
];
const GRAD_STOPS_BLUE = [
  { offset: '0%',   color: '#3B82F6', opacity: '0.28' },
  { offset: '80%',  color: '#3B82F6', opacity: '0.04' },
  { offset: '100%', color: '#3B82F6', opacity: '0'    },
];
const GRAD_STOPS_RED = [
  { offset: '0%',   color: '#f04d4d', opacity: '0.22' },
  { offset: '80%',  color: '#f04d4d', opacity: '0.03' },
  { offset: '100%', color: '#f04d4d', opacity: '0'    },
];

function setGradient(stops) {
  const grad = chartSvg.getElementById('chartGrad') ||
               document.getElementById('chartGrad');
  if (!grad) return;
  const existingStops = grad.querySelectorAll('stop');
  stops.forEach((s, i) => {
    if (existingStops[i]) {
      existingStops[i].setAttribute('stop-color', s.color);
      existingStops[i].setAttribute('stop-opacity', s.opacity);
      existingStops[i].setAttribute('offset', s.offset);
    }
  });
}

/* ─── RENDER CHART ───────────────────────────────────────── */

function renderChart(filter) {
  const data = TIME_DATASETS[filter];
  if (!data) return;

  const { linePath, areaPath, svgPts } = buildPaths(data.points);

  // Update SVG paths (CSS transition animates the d attribute)
  chartLine.setAttribute('d', linePath);
  chartArea.setAttribute('d', areaPath);

  // Update colors based on positive/negative
  const color = data.positive ? GREEN : RED;
  const stops = data.positive ? GRAD_STOPS_GREEN : GRAD_STOPS_RED;

  chartLine.setAttribute('stroke', color);
  hoverDot.setAttribute('fill', color);
  setGradient(stops);

  // Cache svg points for hover
  chartSvg._pts    = svgPts;
  chartSvg._data   = data;
  chartSvg._filter = filter;

  // Update price change UI
  const posClass = data.positive ? 'positive' : 'negative';

  priceChangeBadge.textContent = '';
  // Rebuild badge with arrow icon
  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowSvg.setAttribute('width', '10');
  arrowSvg.setAttribute('height', '10');
  arrowSvg.setAttribute('viewBox', '0 0 10 10');
  arrowSvg.setAttribute('fill', 'none');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', data.positive ? 'M5 2L8 6H2L5 2Z' : 'M5 8L8 4H2L5 8Z');
  arrowPath.setAttribute('fill', 'currentColor');
  arrowSvg.appendChild(arrowPath);
  priceChangeBadge.appendChild(arrowSvg);
  priceChangeBadge.appendChild(document.createTextNode(' ' + data.changeAmt));

  priceChangeBadge.className = 'price-change-badge ' + posClass;
  priceChangePct.textContent = data.changePct + ' ';
  priceChangePct.appendChild(document.createTextNode(filter === '1H' ? '1h' : filter === '1D' ? '24h' : filter === '1W' ? '7d' : filter === '1M' ? '30d' : '1y'));
  priceChangePct.className   = 'price-change-pct ' + posClass;

  navChange.textContent  = data.changePct;
  navChange.className    = 'meta-change ' + posClass;

  balanceUsdChange.textContent = data.changeAmt + ' today';
  balanceUsdChange.className   = 'balance-usd-change ' + posClass;

  // Stats
  statHigh.textContent = data.high;
  statLow.textContent  = data.low;
  statVol.textContent  = data.vol;
}

/* ─── HOVER INTERACTION ──────────────────────────────────── */

function getRelativePos(e) {
  const rect = chartWrap.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    w: rect.width,
    h: rect.height,
  };
}

function onChartEnter(e) {
  isHovering = true;
  hoverLine.setAttribute('opacity', '1');
  hoverDot.setAttribute('opacity', '1');
  hoverTip.classList.add('visible');
  onChartMove(e);
}

function onChartMove(e) {
  if (!isHovering || !chartSvg._pts) return;

  const { x, w } = getRelativePos(e);
  const pts  = chartSvg._pts;
  const data = chartSvg._data;
  const n    = pts.length;

  // Map pixel x → SVG x
  const svgX = (x / w) * VW;
  const step = VW / (n - 1);
  let idx    = Math.round(svgX / step);
  idx        = Math.max(0, Math.min(n - 1, idx));

  const pt = pts[idx];

  // Position elements in SVG coordinates (attributes)
  hoverLine.setAttribute('x1', pt.x);
  hoverLine.setAttribute('x2', pt.x);
  hoverDot.setAttribute('cx', pt.x);
  hoverDot.setAttribute('cy', pt.y);

  // Tooltip: position in pixel space relative to chart-wrap
  const tipX = (pt.x / VW) * w;
  const tipY = (pt.y / VH) * chartWrap.getBoundingClientRect().height;

  hoverTip.style.left      = `${tipX}px`;
  hoverTip.style.top       = `${Math.max(tipY - 54, 6)}px`;
  hoverTip.style.transform = 'translateX(-50%)';

  // Price at this point
  const priceAtPoint = normToPrice(data.points[idx]);
  tipPrice.textContent = '$' + priceAtPoint.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  tipTime.textContent  = data.labels[idx] || '';

  // Update big price display while hovering
  priceMain.textContent = tipPrice.textContent;
}

function onChartLeave() {
  isHovering = false;
  hoverLine.setAttribute('opacity', '0');
  hoverDot.setAttribute('opacity', '0');
  hoverTip.classList.remove('visible');

  // Restore current price
  priceMain.textContent = '$' + BASE_PRICE.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── TIME FILTER SWITCHING ──────────────────────────────── */

function switchFilter(filter) {
  if (filter === activeFilter) return;
  activeFilter = filter;

  // Update tab styles
  tfBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tf === filter);
  });

  renderChart(filter);
}

/* ─── EVENT BINDINGS ─────────────────────────────────────── */

// Time filter buttons
tfBtns.forEach(btn => {
  btn.addEventListener('click', () => switchFilter(btn.dataset.tf));
});

// Chart hover (mouse)
chartWrap.addEventListener('mouseenter', onChartEnter);
chartWrap.addEventListener('mousemove',  onChartMove);
chartWrap.addEventListener('mouseleave', onChartLeave);

// Chart hover (touch)
chartWrap.addEventListener('touchstart', e => {
  e.preventDefault();
  onChartEnter(e);
}, { passive: false });

chartWrap.addEventListener('touchmove', e => {
  e.preventDefault();
  onChartMove(e);
}, { passive: false });

chartWrap.addEventListener('touchend', onChartLeave);

// Action button ripple feedback
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 180);
  });
});

/* ─── AUTO CYCLE DEMO ────────────────────────────────────── */
// Cycles through time filters to showcase the fluid animation

const filterOrder = ['1H', '1D', '1W', '1M', '1Y'];
let cycleIndex    = filterOrder.indexOf('1W');
let cycleTimer    = null;
let userTouched   = false;

function startCycle() {
  cycleTimer = setInterval(() => {
    if (userTouched) {
      clearInterval(cycleTimer);
      return;
    }
    cycleIndex = (cycleIndex + 1) % filterOrder.length;
    const next = filterOrder[cycleIndex];

    // Update active tab UI
    tfBtns.forEach(b => b.classList.toggle('active', b.dataset.tf === next));
    activeFilter = next;
    renderChart(next);
  }, 2600);
}

// Stop auto-cycle on user interaction
tfBtns.forEach(btn => {
  btn.addEventListener('click', () => { userTouched = true; });
});
chartWrap.addEventListener('mouseenter', () => { userTouched = true; });
chartWrap.addEventListener('touchstart',  () => { userTouched = true; }, { passive: true });

/* ─── INIT ───────────────────────────────────────────────── */

function init() {
  // Initial render
  renderChart(activeFilter);

  // Start auto-cycle after 2s delay
  setTimeout(startCycle, 2000);
}

init();