(function () {
  var data = window.HEATMAP_DATA || {};

  var CELL = 11, GAP = 2, STEP = CELL + GAP;
  var WEEKS = 53;
  var LEFT_PAD = 24, TOP_PAD = 20, BOTTOM_PAD = 4;

  /* ── date range: last 364 days ending today, aligned to Sunday ── */
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); /* rewind to Sunday */

  /* build week grid */
  var weeks = [];
  var cur = new Date(start);
  while (weeks.length < WEEKS) {
    var week = [];
    for (var d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  /* ── read CSS accent color at runtime ── */
  var style = getComputedStyle(document.documentElement);
  var accentRaw = style.getPropertyValue('--color-accent-default').trim();
  var bgColor   = style.getPropertyValue('--gray-100').trim() || '#f8f9fa';
  var gray200   = style.getPropertyValue('--gray-200').trim() || '#e9ecef';

  var r = 100, g = 116, b = 139; /* slate fallback */
  var hex = accentRaw.match(/^#([0-9a-f]{3,6})$/i);
  var rgb = accentRaw.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (hex) {
    var h = hex[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
  } else if (rgb) {
    r = +rgb[1]; g = +rgb[2]; b = +rgb[3];
  }

  function cellColor(count) {
    if (!count) return bgColor;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.min(0.2 + count * 0.2, 1) + ')';
  }

  /* max count for legend scale */
  var maxCount = 0;
  Object.keys(data).forEach(function(k) { if (data[k] > maxCount) maxCount = data[k]; });

  /* ── build SVG ── */
  var svgW = LEFT_PAD + WEEKS * STEP + GAP;
  var svgH = TOP_PAD + 7 * STEP + BOTTOM_PAD + 20;
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.getElementById('heatmap-svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);

  function el(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function(k) { node.setAttribute(k, attrs[k]); });
    return node;
  }
  function text(content, attrs) {
    var t = el('text', attrs);
    t.textContent = content;
    return t;
  }

  /* day labels: Mon / Wed / Fri */
  ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(function(label, i) {
    if (!label) return;
    svg.appendChild(text(label, {
      x: LEFT_PAD - 4, y: TOP_PAD + i * STEP + CELL * 0.8,
      'text-anchor': 'end', fill: 'currentColor', opacity: '0.45', 'font-size': '9'
    }));
  });

  /* month labels */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var lastMonth = -1;
  weeks.forEach(function(week, wi) {
    var mo = week[0].getMonth();
    if (mo !== lastMonth) {
      lastMonth = mo;
      svg.appendChild(text(MONTHS[mo], {
        x: LEFT_PAD + wi * STEP, y: TOP_PAD - 5,
        fill: 'currentColor', opacity: '0.45', 'font-size': '9'
      }));
    }
  });

  /* cells */
  var tooltip = document.getElementById('heatmap-tooltip');
  weeks.forEach(function(week, wi) {
    week.forEach(function(date, di) {
      if (date > today) return;
      var key = date.getFullYear() + '-'
        + ('0'+(date.getMonth()+1)).slice(-2) + '-'
        + ('0'+date.getDate()).slice(-2);
      var count = data[key] || 0;

      var rect = el('rect', {
        x: LEFT_PAD + wi * STEP, y: TOP_PAD + di * STEP,
        width: CELL, height: CELL, rx: '2',
        fill: cellColor(count), stroke: gray200, 'stroke-width': '0.5'
      });
      rect.style.cursor = 'default';

      rect.addEventListener('mouseenter', function() {
        tooltip.textContent = key + (count ? ' · ' + count + ' 篇' : ' · 无文章');
        tooltip.style.display = 'block';
      });
      rect.addEventListener('mousemove', function(e) {
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top  = (e.clientY - 28) + 'px';
      });
      rect.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
      });
      svg.appendChild(rect);
    });
  });

  /* legend */
  var legendX = svgW - 6 * STEP - 50;
  var legendY = svgH - 14;
  svg.appendChild(text('少', {
    x: legendX - 4, y: legendY + CELL * 0.8,
    'text-anchor': 'end', fill: 'currentColor', opacity: '0.45', 'font-size': '9'
  }));
  [0, 1, 2, 3, 4].forEach(function(i) {
    svg.appendChild(el('rect', {
      x: legendX + i * STEP, y: legendY, width: CELL, height: CELL, rx: '2',
      fill: cellColor(i === 0 ? 0 : Math.ceil(maxCount * i / 4) || i),
      stroke: gray200, 'stroke-width': '0.5'
    }));
  });
  svg.appendChild(text('多', {
    x: legendX + 5 * STEP + 2, y: legendY + CELL * 0.8,
    fill: 'currentColor', opacity: '0.45', 'font-size': '9'
  }));
})();
