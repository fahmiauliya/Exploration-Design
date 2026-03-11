/* ================================================================
   Canopi Date Picker — script.js
   ================================================================ */

// ── Constants ──────────────────────────────────────────────────
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ITEM_H  = 44;   // drum item height px — matches CSS
const PAD     = 2;    // invisible padding rows each side for centering
const ANIM_MS = 220;  // calendar slide duration — matches CSS keyframe

// ── State ───────────────────────────────────────────────────────
const today = new Date();

const S = {
  activeTab:    'one-day',
  oneDay:       null,
  multiStart:   null,
  multiEnd:     null,
  repeatDay:    'Monday',
  startTime:    null,   // { h, m } | null
  endTime:      null,   // { h, m } | null
  calYear:      today.getFullYear(),
  calMonth:     today.getMonth(),
  calTarget:    null,
  calAnimating: false,
  timeTarget:   null,   // 'start' | 'end' | null
};

// ── DOM refs ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const appScreen         = $('appScreen');
const backdrop          = $('backdrop');
const calBackdrop       = $('calBackdrop');

// Picker sheet
const pickerSheet       = $('pickerSheet');
const segControl        = $('segControl');
const tabOneDay         = $('tab-one-day');
const tabMultiDay       = $('tab-multi-day');
const tabRepeating      = $('tab-repeating');
const oneDayField       = $('oneDayField');
const multiStartField   = $('multiStartField');
const multiEndField     = $('multiEndField');
const repeatingDayBtn   = $('repeatingDayBtn');
const repeatingDayLabel = $('repeatingDayLabel');
const eventTitleInput   = $('eventTitleInput');
const doneBtn           = $('doneBtn');

// Time rows
const startTimeRow      = $('startTimeRow');
const startTimeDisplay  = $('startTimeDisplay');
const endTimeRow        = $('endTimeRow');
const endTimeDisplay    = $('endTimeDisplay');

// Time overlay
const timeOverlay       = $('timeOverlay');
const timeOvBackdrop    = $('timeOvBackdrop');
const tpCancelBtn       = $('tpCancelBtn');
const tpDoneBtn         = $('tpDoneBtn');
const ovHourDrum        = $('ovHourDrum');
const ovMinDrum         = $('ovMinDrum');

// Calendar sheet
const calSheet          = $('calSheet');
const calMonthText      = $('calMonthText');
const calGrid           = $('calGrid');
const calPrevBtn        = $('calPrevBtn');
const calNextBtn        = $('calNextBtn');

// Day sheet
const daySheet          = $('daySheet');
const dayList           = $('dayList');
const dayBackdrop       = $('dayBackdrop');
const openDatePickerBtn = $('openDatePickerBtn');

// ── Helpers ─────────────────────────────────────────────────────
const pad     = n => String(n).padStart(2, '0');
const fmtTime = t => `${pad(t.h)}:${pad(t.m)}`;

function isSameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y, m)    { return new Date(y, m, 1).getDay(); }

// ── Sheet control ───────────────────────────────────────────────
function openPickerSheet() {
  renderAllDateFields();
  renderTimeDisplays();
  refreshDoneBtn();
  appScreen.classList.add('dimmed');
  backdrop.classList.add('visible');
  pickerSheet.classList.add('open');
}

function closeCalendar() {
  calSheet.classList.remove('open');
  calBackdrop.classList.remove('visible');
}

function closeAllSheets() {
  pickerSheet.classList.remove('open');
  closeCalendar();
  timeOverlay.classList.remove('open');
  daySheet.classList.remove('open');
  dayBackdrop.classList.remove('visible');
  appScreen.classList.remove('dimmed');
  backdrop.classList.remove('visible');
}

// ── Tab switching ────────────────────────────────────────────────
function setTab(tab) {
  S.activeTab = tab;
  segControl.querySelectorAll('.seg').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  tabOneDay.classList.toggle('active',    tab === 'one-day');
  tabMultiDay.classList.toggle('active',  tab === 'multi-day');
  tabRepeating.classList.toggle('active', tab === 'repeating');
  refreshDoneBtn();
}

// ── Date field rendering ─────────────────────────────────────────
function renderDateField(el, date, rightAlign = false) {
  const cls = rightAlign ? ' right-align' : '';
  if (!date) {
    el.innerHTML = `
      <div class="plus-state${cls}">
        <span class="ghost-day">00</span>
        <div class="plus-circle">+</div>
        <span class="ghost-month">MON</span>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="selected-state${cls}">
        <div class="big-day">${pad(date.getDate())}</div>
        <div class="big-month">${MONTHS_SHORT[date.getMonth()]}</div>
      </div>`;
  }
}

function renderAllDateFields() {
  renderDateField(oneDayField,     S.oneDay,      false);
  renderDateField(multiStartField, S.multiStart,  false);
  renderDateField(multiEndField,   S.multiEnd,    true);
}

// ── Time display rendering ───────────────────────────────────────
function renderTimeDisplays() {
  if (S.startTime) {
    startTimeDisplay.textContent = fmtTime(S.startTime);
    startTimeDisplay.classList.add('has-time');
  } else {
    startTimeDisplay.textContent = 'Add time';
    startTimeDisplay.classList.remove('has-time');
  }
  if (S.endTime) {
    endTimeDisplay.textContent = fmtTime(S.endTime);
    endTimeDisplay.classList.add('has-time');
  } else {
    endTimeDisplay.textContent = 'Add time';
    endTimeDisplay.classList.remove('has-time');
  }
}

// ── Done button ──────────────────────────────────────────────────
function refreshDoneBtn() {
  const enabled =
    (S.activeTab === 'one-day'   && !!S.oneDay) ||
    (S.activeTab === 'multi-day' && !!(S.multiStart && S.multiEnd)) ||
    (S.activeTab === 'repeating');
  doneBtn.classList.toggle('active', enabled);
}

// ── Drum picker ──────────────────────────────────────────────────
function buildDrum(el, count, fmt, selectedIdx) {
  el.innerHTML = '';
  for (let i = 0; i < PAD; i++) {
    const p = document.createElement('div');
    p.className = 'drum-item drum-pad';
    el.appendChild(p);
  }
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'drum-item' + (i === selectedIdx ? ' drum-selected' : '');
    item.textContent = fmt(i);
    el.appendChild(item);
  }
  for (let i = 0; i < PAD; i++) {
    const p = document.createElement('div');
    p.className = 'drum-item drum-pad';
    el.appendChild(p);
  }
  el.scrollTop = selectedIdx * ITEM_H;
}

function readDrumValue(el, count) {
  return Math.max(0, Math.min(count - 1, Math.round(el.scrollTop / ITEM_H)));
}

// Track which item is centered and apply drum-selected class
function attachSelectionTracking(el, count) {
  let raf;
  const update = () => {
    const idx = readDrumValue(el, count);
    let i = 0;
    el.querySelectorAll('.drum-item:not(.drum-pad)').forEach(item => {
      item.classList.toggle('drum-selected', i === idx);
      i++;
    });
  };
  el.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

// Enable click-drag scrolling (mouse + touch) on drum column
function makeDraggable(el) {
  let startY = 0;
  let startScroll = 0;
  let dragging = false;
  let lastY = 0;
  let velocity = 0;
  let lastTime = 0;
  let momentumRAF;

  function onStart(y) {
    dragging = true;
    startY = y;
    lastY = y;
    startScroll = el.scrollTop;
    velocity = 0;
    lastTime = Date.now();
    cancelAnimationFrame(momentumRAF);
    el.style.scrollSnapType = 'none'; // disable snap during drag
  }

  function onMove(y) {
    if (!dragging) return;
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) velocity = (lastY - y) / dt;
    lastY = y;
    lastTime = now;
    el.scrollTop = startScroll + (startY - y);
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;

    // Momentum flick
    let v = velocity * 1000; // px/s
    let lastT = Date.now();

    function applyMomentum() {
      const now = Date.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      v *= Math.pow(0.92, dt * 60); // friction
      el.scrollTop += v * dt;
      if (Math.abs(v) > 20) {
        momentumRAF = requestAnimationFrame(applyMomentum);
      } else {
        // Snap to nearest item
        el.style.scrollSnapType = '';
        const snapped = Math.round(el.scrollTop / ITEM_H) * ITEM_H;
        el.scrollTo({ top: snapped, behavior: 'smooth' });
      }
    }

    if (Math.abs(v) > 50) {
      momentumRAF = requestAnimationFrame(applyMomentum);
    } else {
      el.style.scrollSnapType = '';
      const snapped = Math.round(el.scrollTop / ITEM_H) * ITEM_H;
      el.scrollTo({ top: snapped, behavior: 'smooth' });
    }
  }

  // Mouse
  el.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientY); });
  window.addEventListener('mousemove', e => onMove(e.clientY));
  window.addEventListener('mouseup', () => onEnd());

  // Touch
  el.addEventListener('touchstart', e => { onStart(e.touches[0].clientY); }, { passive: true });
  el.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e.touches[0].clientY); }, { passive: false });
  el.addEventListener('touchend',   () => onEnd());
}

// ── Time Overlay ─────────────────────────────────────────────────
function openTimePicker(target) {
  S.timeTarget = target;
  const time = target === 'start' ? S.startTime : S.endTime;
  const h = time?.h ?? 8;
  const m = time?.m ?? 0;

  buildDrum(ovHourDrum, 24, pad, h);
  buildDrum(ovMinDrum,  60, pad, m);
  attachSelectionTracking(ovHourDrum, 24);
  attachSelectionTracking(ovMinDrum,  60);
  makeDraggable(ovHourDrum);
  makeDraggable(ovMinDrum);

  timeOverlay.classList.add('open');
}

function closeTimePicker(save) {
  if (save) {
    const h = readDrumValue(ovHourDrum, 24);
    const m = readDrumValue(ovMinDrum,  60);
    if (S.timeTarget === 'start') S.startTime = { h, m };
    else                          S.endTime   = { h, m };
  }
  timeOverlay.classList.remove('open');
  S.timeTarget = null;
  renderTimeDisplays();
  refreshDoneBtn();
}

// ── Calendar ─────────────────────────────────────────────────────
function openCalendar(target) {
  S.calTarget = target;
  const preselect = { 'one-day': S.oneDay, 'multi-start': S.multiStart, 'multi-end': S.multiEnd }[target];
  if (preselect) {
    S.calYear  = preselect.getFullYear();
    S.calMonth = preselect.getMonth();
  }
  buildCalendar();
  calSheet.classList.add('open');
  calBackdrop.classList.add('visible');
}

function buildCalendar() {
  const { calYear, calMonth, calTarget } = S;
  calMonthText.textContent = `${MONTHS_LONG[calMonth]} ${calYear}`;

  let selA = null, selB = null;
  if (calTarget === 'one-day')     { selA = S.oneDay; }
  if (calTarget === 'multi-start') { selA = S.multiStart; selB = S.multiEnd; }
  if (calTarget === 'multi-end')   { selA = S.multiStart; selB = S.multiEnd; }

  const totalDays = daysInMonth(calYear, calMonth);
  const start     = firstDay(calYear, calMonth);
  const prevTotal = daysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);

  calGrid.innerHTML = '';

  for (let i = start - 1; i >= 0; i--)
    calGrid.appendChild(makeCalCell(prevTotal - i, true));

  for (let d = 1; d <= totalDays; d++) {
    const date    = new Date(calYear, calMonth, d);
    const isToday = isSameDay(date, today);
    const isSel   = isSameDay(date, selA) || isSameDay(date, selB);
    const isRange = selA && selB && date > selA && date < selB;
    const isStart = isSameDay(date, selA) && selB;
    const isEnd   = isSameDay(date, selB);
    const cell    = makeCalCell(d, false, isToday, isSel, isRange, isStart, isEnd);
    cell.addEventListener('click', () => onCalDateSelect(d));
    calGrid.appendChild(cell);
  }

  // Fill to 42 cells
  const filled = calGrid.children.length;
  const rem = filled % 7 === 0 ? 0 : 7 - (filled % 7);
  for (let i = 1; calGrid.children.length < filled + rem || calGrid.children.length < 42; i++)
    calGrid.appendChild(makeCalCell(i, true));
}

function makeCalCell(num, inactive, isToday, isSelected, isRange, isStart, isEnd) {
  const cell = document.createElement('div');
  cell.className = 'cal-cell';
  cell.textContent = num;
  if (inactive)   cell.classList.add('cal-inactive');
  if (isToday)    cell.classList.add('cal-today');
  if (isSelected) cell.classList.add('cal-selected');
  if (isRange)    cell.classList.add('cal-range');
  if (isStart)    cell.classList.add('cal-range-start');
  if (isEnd)      cell.classList.add('cal-range-end');
  return cell;
}

function onCalDateSelect(day) {
  const picked = new Date(S.calYear, S.calMonth, day);
  if (S.calTarget === 'one-day') {
    S.oneDay = picked;
  } else if (S.calTarget === 'multi-start') {
    S.multiStart = picked;
    if (S.multiEnd && S.multiEnd <= picked) S.multiEnd = null;
  } else if (S.calTarget === 'multi-end') {
    if (S.multiStart && picked < S.multiStart) {
      [S.multiStart, S.multiEnd] = [picked, S.multiStart];
    } else {
      S.multiEnd = picked;
    }
  }
  buildCalendar();
  setTimeout(() => {
    closeCalendar();
    renderAllDateFields();
    refreshDoneBtn();
  }, 180);
}

function navigateCalendar(dir) {
  if (S.calAnimating) return;
  S.calAnimating = true;
  const exitCls  = dir === 1 ? 'slide-exit-left'  : 'slide-exit-right';
  const enterCls = dir === 1 ? 'slide-in-left'     : 'slide-in-right';
  calGrid.classList.add(exitCls);
  setTimeout(() => {
    S.calMonth += dir;
    if (S.calMonth < 0)  { S.calMonth = 11; S.calYear--; }
    if (S.calMonth > 11) { S.calMonth = 0;  S.calYear++; }
    calGrid.classList.remove(exitCls);
    buildCalendar();
    calGrid.classList.add(enterCls);
    setTimeout(() => {
      calGrid.classList.remove(enterCls);
      S.calAnimating = false;
    }, ANIM_MS);
  }, ANIM_MS);
}

// ── Day Picker ───────────────────────────────────────────────────
function buildDayList() {
  dayList.innerHTML = '';
  DAYS_OF_WEEK.forEach(day => {
    const item = document.createElement('div');
    item.className = 'day-item' + (day === S.repeatDay ? ' selected' : '');
    item.innerHTML = `<span class="day-item-name">${day}</span><div class="day-item-check"></div>`;
    item.addEventListener('click', () => {
      S.repeatDay = day;
      repeatingDayLabel.textContent = day;
      daySheet.classList.remove('open');
      dayBackdrop.classList.remove('visible');
    });
    dayList.appendChild(item);
  });
}

// ── Event listeners ──────────────────────────────────────────────

openDatePickerBtn.addEventListener('click', openPickerSheet);
backdrop.addEventListener('click', closeAllSheets);
calBackdrop.addEventListener('click', closeCalendar);

segControl.addEventListener('click', e => {
  const btn = e.target.closest('.seg');
  if (btn) setTab(btn.dataset.tab);
});

oneDayField.addEventListener('click',     () => openCalendar('one-day'));
multiStartField.addEventListener('click', () => openCalendar('multi-start'));
multiEndField.addEventListener('click',   () => openCalendar('multi-end'));

calPrevBtn.addEventListener('click', () => navigateCalendar(-1));
calNextBtn.addEventListener('click', () => navigateCalendar(+1));

// Time rows → open overlay
startTimeRow.addEventListener('click', () => openTimePicker('start'));
endTimeRow.addEventListener('click',   () => openTimePicker('end'));

// Time overlay controls
timeOvBackdrop.addEventListener('click', () => closeTimePicker(false));
tpCancelBtn.addEventListener('click',    () => closeTimePicker(false));
tpDoneBtn.addEventListener('click',      () => closeTimePicker(true));

// Repeating day picker
repeatingDayBtn.addEventListener('click', () => {
  buildDayList();
  daySheet.classList.add('open');
  dayBackdrop.classList.add('visible');
});

dayBackdrop.addEventListener('click', () => {
  daySheet.classList.remove('open');
  dayBackdrop.classList.remove('visible');
});

// Done button
doneBtn.addEventListener('click', () => {
  if (!doneBtn.classList.contains('active')) return;
  doneBtn.textContent = '✓ Saved';
  doneBtn.style.background = '#2ecc71';
  setTimeout(() => {
    doneBtn.textContent = 'Done';
    doneBtn.style.background = '';
    closeAllSheets();
    S.oneDay = S.multiStart = S.multiEnd = null;
    S.startTime = S.endTime = null;
    renderAllDateFields();
    renderTimeDisplays();
    refreshDoneBtn();
  }, 1200);
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (timeOverlay.classList.contains('open')) { closeTimePicker(false); return; }
    if (daySheet.classList.contains('open'))    { daySheet.classList.remove('open'); return; }
    if (calSheet.classList.contains('open'))    { closeCalendar(); return; }
    if (pickerSheet.classList.contains('open')) { closeAllSheets(); return; }
  }
  if (calSheet.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  navigateCalendar(-1);
    if (e.key === 'ArrowRight') navigateCalendar(+1);
  }
});

// ── Init ─────────────────────────────────────────────────────────
renderAllDateFields();
renderTimeDisplays();
refreshDoneBtn();
setTab('one-day');
