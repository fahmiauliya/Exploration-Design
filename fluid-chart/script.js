/* ============================================================
   FLUID CHART — script.js
   ============================================================ */

'use strict';

/* ─── DATA ───────────────────────────────────────────────── */

const PLANS = {
  individual: {
    color:        '#6366f1',
    gradId:       'gradIndividual',
    monthly: {
      prices:     [9, 9, 9, 12, 12, 12, 9, 9, 12, 15, 12, 9],
      avg:        '$10',
      total:      '$119',
      peak:       '$15',
    },
    yearly: {
      prices:     [7, 7, 7, 10, 10, 10, 7, 7, 10, 12, 10, 7],
      avg:        '$9',
      total:      '$104',
      peak:       '$12',
    },
    priceMonthly: '$9',
    priceYearly:  '$7',
  },
  family: {
    color:        '#ec4899',
    gradId:       'gradFamily',
    monthly: {
      prices:     [15, 15, 18, 18, 20, 20, 15, 18, 25, 28, 22, 15],
      avg:        '$19',
      total:      '$229',
      peak:       '$28',
    },
    yearly: {
      prices:     [12, 12, 14, 14, 16, 16, 12, 14, 20, 22, 18, 12],
      avg:        '$15',
      total:      '$182',
      peak:       '$22',
    },
    priceMonthly: '$15',
    priceYearly:  '$12',
  },
  enterprise: {
    color:        '#10b981',
    gradId:       'gradEnterprise',
    monthly: {
      prices:     [49, 49, 59, 79, 99, 99, 79, 89, 120, 149, 120, 89],
      avg:        '$90',
      total:      '$1,080',
      peak:       '$149',
    },
    yearly: {
      prices:     [39, 39, 49, 63, 79, 79, 63, 71, 96, 119, 96, 71],
      avg:        '$72',
      total:      '$864',
      peak:       '$119',
    },
    priceMonthly: '$49',
    priceYearly:  '$39',
  },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── STATE ──────────────────────────────────────────────── */

let currentPlan    = 'individual';
let currentBilling = 'monthly'; // 'monthly' | 'yearly'
let hoverIndex     = null;

/* ─── DOM REFS ───────────────────────────────────────────── */

const chartArea    = document.getElementById('chartArea');
const chartLine    = document.getElementById('chartLine');
const chartDot     = document.getElementById('chartDot');
const chartSvg     = document.getElementById('chartSvg');
const chartTooltip = document.getElementById('chartTooltip');
const tooltipValue = document.getElementById('tooltipValue');
const tooltipLabel = document.getElementById('tooltipLabel');

const metaAvg      = document.getElementById('metaAvg');
const metaTotal    = document.getElementById('metaTotal');
const metaPeak     = document.getElementById('metaPeak');

const planTabs     = document.querySelectorAll('.plan-tab');
const priceCards   = document.querySelectorAll('.price-card');

const toggleMonthly = document.getElementById('toggleMonthly');
const toggleYearly  = document.getElementById('toggleYearly');

const priceIndividual  = document.getElementById('priceIndividual');
const priceFamily      = document.getElementById('priceFamily');
const priceEnterprise  = document.getElementById('priceEnterprise');

/* ─── CHART GEOMETRY ─────────────────────────────────────── */

const VW      = 1000;   // viewBox width
const VH      = 320;    // viewBox height
const PAD_TOP = 16;
const PAD_R   = 16;
const MAX_VAL = 200;    // y-axis max ($200)

/**
 * Convert a data value to SVG Y coordinate.
 * 0 → bottom (VH), MAX_VAL → PAD_TOP
 */
function valToY(v) {
  const usable = VH - PAD_TOP;
  return VH - (v / MAX_VAL) * usable;
}

/**
 * Build a smooth cubic bezier SVG path from an array of values.
 * Returns { linePath, areaPath }.
 */
function buildPaths(values) {
  const n     = values.length;
  const step  = (VW - PAD_R) / (n - 1);
  const pts   = values.map((v, i) => ({ x: i * step, y: valToY(v) }));

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cpx = (p0.x + p1.x) / 2;
    d += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const linePath = d;
  const areaPath = `${d} L ${pts[n - 1].x} ${VH} L ${pts[0].x} ${VH} Z`;

  return { linePath, areaPath, pts };
}

/* ─── RENDER CHART ───────────────────────────────────────── */

function renderChart(plan, billing, animate = true) {
  const data   = PLANS[plan][billing];
  const config = PLANS[plan];
  const { linePath, areaPath, pts } = buildPaths(data.prices);

  // Update paths — CSS transitions handle the animation
  chartLine.setAttribute('d', linePath);
  chartLine.setAttribute('stroke', config.color);
  chartArea.setAttribute('d', areaPath);
  chartArea.setAttribute('fill', `url(#${config.gradId})`);
  chartDot.setAttribute('fill', config.color);

  // Meta stats
  metaAvg.textContent   = data.avg;
  metaTotal.textContent = data.total;
  metaPeak.textContent  = data.peak;
  metaPeak.style.color  = config.color;

  // Store pts for hover calculation
  chartSvg._pts = pts;
}

/* ─── HOVER INTERACTION ──────────────────────────────────── */

function onChartMouseMove(e) {
  if (!chartSvg._pts) return;

  const rect  = chartSvg.getBoundingClientRect();
  const relX  = (e.clientX - rect.left) / rect.width;   // 0-1
  const svgX  = relX * VW;

  const pts = chartSvg._pts;
  const n   = pts.length;
  const step = (VW - PAD_R) / (n - 1);

  // Find closest point
  let idx = Math.round(svgX / step);
  idx = Math.max(0, Math.min(n - 1, idx));

  if (idx === hoverIndex) return;
  hoverIndex = idx;

  const pt    = pts[idx];
  const svgW  = chartSvg.clientWidth;
  const svgH  = chartSvg.clientHeight;
  const dotX  = (pt.x / VW) * svgW;
  const dotY  = (pt.y / VH) * svgH;

  // Update dot
  chartDot.setAttribute('cx', pt.x);
  chartDot.setAttribute('cy', pt.y);
  chartDot.setAttribute('opacity', '1');

  // Update tooltip position (absolute pixels relative to canvas wrap)
  const data   = PLANS[currentPlan][currentBilling];
  const tipX   = dotX;
  const tipY   = dotY;

  chartTooltip.style.opacity = '1';
  chartTooltip.style.left    = `${tipX}px`;
  chartTooltip.style.top     = `${Math.max(tipY - 52, 8)}px`;
  chartTooltip.style.transform = 'translateX(-50%)';

  tooltipValue.textContent = `$${data.prices[idx]}`;
  tooltipLabel.textContent = MONTHS[idx];
}

function onChartMouseLeave() {
  hoverIndex = null;
  chartDot.setAttribute('opacity', '0');
  chartTooltip.style.opacity = '0';
}

/* ─── PLAN SWITCHING ─────────────────────────────────────── */

function switchPlan(plan) {
  if (plan === currentPlan) return;
  currentPlan = plan;

  // Update tab UI
  planTabs.forEach(t => t.classList.toggle('active', t.dataset.plan === plan));

  // Highlight active card
  priceCards.forEach(c => c.classList.toggle('is-active-plan', c.dataset.plan === plan));

  renderChart(plan, currentBilling);
}

/* ─── BILLING SWITCHING ──────────────────────────────────── */

function switchBilling(billing) {
  if (billing === currentBilling) return;
  currentBilling = billing;

  toggleMonthly.classList.toggle('active', billing === 'monthly');
  toggleYearly.classList.toggle('active',  billing === 'yearly');

  // Flip prices on cards
  animatePrice(priceIndividual,  PLANS.individual[`price${capitalize(billing)}`]);
  animatePrice(priceFamily,      PLANS.family[`price${capitalize(billing)}`]);
  animatePrice(priceEnterprise,  PLANS.enterprise[`price${capitalize(billing)}`]);

  renderChart(currentPlan, billing);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ─── PRICE FLIP ANIMATION ───────────────────────────────── */

function animatePrice(el, newValue) {
  el.classList.add('flip-out');

  setTimeout(() => {
    el.textContent = newValue;
    el.classList.remove('flip-out');
    el.classList.add('flip-in');

    // Force reflow
    el.getBoundingClientRect();

    el.classList.remove('flip-in');
  }, 150);
}

/* ─── AUTO-CYCLE DEMO ────────────────────────────────────── */
// Automatically cycle through plans to showcase the fluid animation

const planOrder = ['individual', 'family', 'enterprise'];
let autoCycleTimer = null;
let autoCycleIndex = 0;
let userInteracted = false;

function startAutoCycle() {
  autoCycleTimer = setInterval(() => {
    if (userInteracted) {
      clearInterval(autoCycleTimer);
      return;
    }
    autoCycleIndex = (autoCycleIndex + 1) % planOrder.length;
    switchPlan(planOrder[autoCycleIndex]);
  }, 2800);
}

/* ─── CARD CLICK → SWITCH PLAN ──────────────────────────── */

priceCards.forEach(card => {
  card.addEventListener('click', () => {
    userInteracted = true;
    switchPlan(card.dataset.plan);
  });
});

/* ─── EVENT LISTENERS ────────────────────────────────────── */

// Plan tabs
planTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    userInteracted = true;
    switchPlan(tab.dataset.plan);
  });
});

// Billing toggle
toggleMonthly.addEventListener('click', () => switchBilling('monthly'));
toggleYearly.addEventListener('click',  () => switchBilling('yearly'));

// Chart hover
const canvasWrap = document.querySelector('.chart-canvas-wrap');
canvasWrap.addEventListener('mousemove',  onChartMouseMove);
canvasWrap.addEventListener('mouseleave', onChartMouseLeave);

// Touch hover (simplified — use first touch point)
canvasWrap.addEventListener('touchmove', e => {
  e.preventDefault();
  onChartMouseMove(e.touches[0]);
}, { passive: false });
canvasWrap.addEventListener('touchend', onChartMouseLeave);

/* ─── INIT ───────────────────────────────────────────────── */

function init() {
  // Initial chart render (no animation on first load)
  renderChart(currentPlan, currentBilling, false);

  // Highlight default active card
  priceCards.forEach(c => c.classList.toggle('is-active-plan', c.dataset.plan === currentPlan));

  // Start auto-cycle after 1.5s
  setTimeout(startAutoCycle, 1500);
}

init();