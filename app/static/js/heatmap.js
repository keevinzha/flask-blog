(function () {
  var data = window.HEATMAP_DATA || {};

  var CELL = 11, GAP = 2, STEP = CELL + GAP;
  var WEEKS = 53;
  var LEFT_PAD = 24, TOP_PAD = 20, BOTTOM_PAD = 4;
  var NS = 'http://www.w3.org/2000/svg';

  /* ── date range: last 364 days ending today, aligned to Sunday ── */
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); /* rewind to Sunday */

  /* build week grid (computed once) */
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

  /* ── GitHub color palettes ── */
  var PALETTE = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark:  ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
  };
  var BORDER = { light: '#d0d7de', dark: '#21262d' };

  function getTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function cellColor(count, colors) {
    if (!count)       return colors[0];
    if (count === 1)  return colors[1];
    if (count === 2)  return colors[2];
    if (count === 3)  return colors[3];
    return colors[4];
  }

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

  /* ── render (called on load and on theme change) ── */
  function render() {
    var theme   = getTheme();
    var colors  = PALETTE[theme];
    var border  = BORDER[theme];

    var svg = document.getElementById('heatmap-svg');
    var tooltip = document.getElementById('heatmap-tooltip');

    /* clear previous render */
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var svgW = LEFT_PAD + WEEKS * STEP + GAP;
    var svgH = TOP_PAD + 7 * STEP + BOTTOM_PAD + 20;
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', svgH);

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
          fill: cellColor(count, colors), stroke: border, 'stroke-width': '0.5'
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
        fill: colors[i], stroke: border, 'stroke-width': '0.5'
      }));
    });
    svg.appendChild(text('多', {
      x: legendX + 5 * STEP + 2, y: legendY + CELL * 0.8,
      fill: 'currentColor', opacity: '0.45', 'font-size': '9'
    }));
  }

  /* initial render */
  render();

  /* re-render whenever data-theme changes */
  new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'data-theme') render();
    });
  }).observe(document.documentElement, { attributes: true });

})();
