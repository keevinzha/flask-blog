const DW_TICK_W = 20;
const DW_TICK_H = 40;

function dwColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    ink: s.getPropertyValue('--ink').trim() || '#1a1a18',
    red: s.getPropertyValue('--red').trim() || '#c0392b',
  };
}

/* ── 共用：生成手绘竖线SVG ── */
function dwDrawTickSvg(session, opts) {
  const { weekIdx, tickIdx, editable, onEdit } = opts || {};
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', DW_TICK_W);
  svg.setAttribute('height', DW_TICK_H);
  svg.setAttribute('overflow', 'visible');
  svg.className = 'tick-svg' + (editable ? ' editable' : '');
  const rc = rough.svg(svg);

  const { ink, red } = dwColors();
  svg.appendChild(rc.line(DW_TICK_W/2, 4, DW_TICK_W/2+1, DW_TICK_H-4, {
    roughness: 1.8, stroke: ink, strokeWidth: 1.6, seed: session.seed,
  }));

  if (session.bt) {
    svg.appendChild(rc.ellipse(DW_TICK_W/2, DW_TICK_H/2, 17, 22, {
      roughness: 2.2, stroke: red, strokeWidth: 1.7, fill: 'none',
      seed: session.seed + 1,
    }));
  }

  if (editable && onEdit) {
    svg.addEventListener('click', (e) => {
      e.stopPropagation();
      onEdit(weekIdx, tickIdx, session.bt);
    });
  }

  return svg;
}

/* ── 共用：渲染图例 ── */
function dwRenderLegend() {
  const elN = document.getElementById('legend-normal');
  const elB = document.getElementById('legend-bt');
  if (!elN || !elB) return;
  const { ink, red } = dwColors();
  const rcN = rough.svg(elN);
  elN.appendChild(rcN.line(8, 4, 9, 28, { roughness:1.8, stroke:ink, strokeWidth:1.6, seed:7 }));
  const rcB = rough.svg(elB);
  elB.appendChild(rcB.line(12, 4, 13, 28, { roughness:1.8, stroke:ink, strokeWidth:1.6, seed:7 }));
  elB.appendChild(rcB.ellipse(12, 16, 17, 22, { roughness:2.2, stroke:red, strokeWidth:1.7, fill:'none', seed:8 }));
}

/* ── 前台：渲染计分板（只读）── */
function dwRenderFront(weeks) {
  const sb = document.getElementById('scoreboard');
  if (!sb) return;
  sb.innerHTML = '';
  weeks.forEach(({ label, sessions, current }) => {
    const row = document.createElement('div');
    row.className = 'week-row' + (current ? ' current-week' : '');

    const lbl = document.createElement('span');
    lbl.className = 'week-label';
    lbl.textContent = label;

    const ticks = document.createElement('div');
    ticks.className = 'week-ticks';
    sessions.forEach((s) => ticks.appendChild(dwDrawTickSvg(s)));

    const cnt = document.createElement('span');
    cnt.className = 'week-count';
    cnt.textContent = sessions.length || '';

    row.appendChild(lbl); row.appendChild(ticks); row.appendChild(cnt);
    sb.appendChild(row);
  });
}

/* ── 前台：渲染统计 ── */
function dwRenderStats(weeks) {
  const allSessions = weeks.flatMap(w => w.sessions);

  const elTotal = document.getElementById('stat-total');
  const elMonth = document.getElementById('stat-month');
  const elWeek  = document.getElementById('stat-week');
  const elBt    = document.getElementById('stat-bt');

  if (elTotal) elTotal.textContent = allSessions.length;
  if (elMonth) elMonth.textContent = weeks.slice(-4).flatMap(w => w.sessions).length;
  if (elWeek)  elWeek.textContent  = weeks[weeks.length-1].sessions.length;

  if (elBt) {
    const intervals = [];
    let count = 0;
    for (const s of allSessions) {
      count++;
      if (s.bt) { intervals.push(count); count = 0; }
    }
    elBt.textContent = intervals.length
      ? Math.round(intervals.reduce((a,b) => a+b, 0) / intervals.length)
      : '—';
  }
}

/* ── 后台：渲染计分板（可编辑）── */
function dwRenderAdmin(weeks, editingIdx, onRowClick, onEditTick) {
  const sb = document.getElementById('scoreboard');
  if (!sb) return;
  sb.innerHTML = '';
  weeks.forEach(({ label, sessions, current }, wi) => {
    const isEditing = editingIdx === wi;
    const row = document.createElement('div');
    row.className = 'week-row editable-row' +
      (current ? ' current-week' : '') +
      (isEditing ? ' editing' : '');

    const lbl = document.createElement('span');
    lbl.className = 'week-label';
    lbl.textContent = label;

    const ticks = document.createElement('div');
    ticks.className = 'week-ticks';
    sessions.forEach((s, ti) => {
      ticks.appendChild(dwDrawTickSvg(s, {
        weekIdx: wi, tickIdx: ti, editable: isEditing,
        onEdit: onEditTick,
      }));
    });

    const cnt = document.createElement('span');
    cnt.className = 'week-count';
    cnt.textContent = sessions.length || '';

    const hint = document.createElement('span');
    hint.className = 'edit-hint';
    hint.textContent = '点击编辑';

    row.addEventListener('click', () => onRowClick(wi));
    row.appendChild(lbl); row.appendChild(ticks);
    row.appendChild(cnt); row.appendChild(hint);
    sb.appendChild(row);
  });
}

/* ── 后台：按钮交互 ── */
function dwInitButton(onAdd) {
  const btn = document.getElementById('main-btn');
  if (!btn) return;
  const HOLD = 3000;
  let holdTimer = null, progInterval = null, holdStart = null, holding = false;

  function startHold(e) {
    e.preventDefault();
    holding = true; holdStart = Date.now();
    btn.classList.add('holding', 'pressed');
    progInterval = setInterval(() => {
      const p = Math.min((Date.now()-holdStart)/HOLD, 1);
      if (p >= 0.6) btn.classList.add('breakthrough-mode');
    }, 30);
    holdTimer = setTimeout(() => endHold(true), HOLD);
  }

  function endHold(bt) {
    if (!holding && bt !== true) return;
    const elapsed = Date.now() - holdStart;
    holding = false;
    clearTimeout(holdTimer); clearInterval(progInterval);
    btn.classList.remove('holding','breakthrough-mode','pressed');
    onAdd(bt === true || elapsed >= HOLD);
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 150);
  }

  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('touchstart', startHold, { passive:false });
  btn.addEventListener('mouseup', () => { if (holding) endHold(false); });
  btn.addEventListener('touchend', () => { if (holding) endHold(false); });
  btn.addEventListener('mouseleave', () => { if (holding) endHold(false); });
}

/* ── 主题切换时重新渲染（MutationObserver 监听 data-theme）── */
let _dwThemeCallback = null;
function dwOnThemeChange(cb) { _dwThemeCallback = cb; }

new MutationObserver(() => {
  if (_dwThemeCallback) _dwThemeCallback();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });