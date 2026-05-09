// ============================================================
// ii_theme.js — 自动下滑 + 股票报价板背景（含闪动特效 + 深/浅色适配）

// ── 自动下滑到正文 ──
(function () {
  const target = document.getElementById('ii-article-start');
  const hint   = document.getElementById('ii-scroll-hint');
  if (!target) return;

  function scrollToArticle() {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (hint) {
    hint.addEventListener('click', scrollToArticle);
    hint.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') scrollToArticle();
    });
  }

  const autoTimer = setTimeout(scrollToArticle, 4000);
  window.addEventListener('scroll', () => clearTimeout(autoTimer), { once: true });
})();

// ── 股票报价板背景 ──
(function () {
  const canvas = document.getElementById('ii-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // 判断当前是否深色模式
  function isDark() {
    const t = document.documentElement.dataset.theme;
    if (t === 'dark')  return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // 按主题返回颜色前缀（rgba 不含最后的透明度）
  function palette() {
    return isDark()
      ? { label: 'rgba(180,140,80,',  price: 'rgba(201,168,76,',  up: 'rgba(106,185,100,', down: 'rgba(210,90,80,' }
      : { label: 'rgba(100,60,20,',   price: 'rgba(120,78,25,',   up: 'rgba(40,140,55,',   down: 'rgba(180,50,40,' };
  }

  // 基础透明度（很低，不抢眼）
  const BASE = { label: 0.13, price: 0.17, change: 0.13 };
  // 闪动峰值透明度（高出基础的额外量）
  const FLASH_BOOST = 0.55;
  // 每帧衰减系数
  const DECAY = 0.88;

  const SYMBOLS = [
    'BRK','SPX','NDQ','DOW','GLD','OIL','TLT','VIX',
    'AAPL','MSFT','BRK.B','JPM','GS','BAC','XOM',
    'GOOG','AMZN','TSLA','NVDA','META','V','MA',
    'PG','JNJ','WMT','HD','KO','PEP','DIS','IBM',
  ];

  const FONT  = '11px "JetBrains Mono","Courier New",monospace';
  const ROW_H = 18;
  const COL_W = 130;

  let grid = [], cols, rows;

  function randPrice() { return (Math.random() * 989 + 10).toFixed(2); }
  function randChange() {
    const v = (Math.random() * 4.9 + 0.1).toFixed(2);
    return (Math.random() > 0.5 ? '+' : '-') + v;
  }

  function buildGrid() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.max(1, Math.floor(canvas.width  / COL_W));
    rows = Math.max(1, Math.floor(canvas.height / ROW_H));
    grid = [];
    for (let i = 0; i < cols * rows; i++) {
      const chg = randChange();
      grid.push({
        sym:    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        price:  randPrice(),
        change: chg,
        dir:    chg.startsWith('+') ? 1 : -1,
        flash:  0,   // 0 = 正常，1 = 刚更新
      });
    }
  }

  let lastTick = 0;
  const TICK_MS    = 600;  // 每次触发更新的间隔
  const TICK_COUNT = 6;    // 每次更新几个格子

  function tick(now) {
    if (now - lastTick < TICK_MS) return;
    lastTick = now;
    for (let i = 0; i < TICK_COUNT; i++) {
      const cell = grid[Math.floor(Math.random() * grid.length)];
      const chg  = randChange();
      cell.price  = randPrice();
      cell.change = chg;
      cell.dir    = chg.startsWith('+') ? 1 : -1;
      cell.flash  = 1.0;   // 触发闪动
    }
  }

  function draw(now) {
    tick(now);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT;
    ctx.textBaseline = 'middle';

    const pal = palette();
    let idx = 0;

    for (let r = 0; r < rows; r++) {
      const y = r * ROW_H + ROW_H / 2;
      for (let c = 0; c < cols; c++) {
        if (idx >= grid.length) break;
        const cell = grid[idx++];
        const x    = c * COL_W + 4;
        const f    = cell.flash;  // 当前闪动强度 0~1

        // 符号
        ctx.fillStyle = pal.label + (BASE.label  + f * FLASH_BOOST).toFixed(3) + ')';
        ctx.fillText(cell.sym.padEnd(5), x, y);

        // 价格（闪动时稍微更亮）
        ctx.fillStyle = pal.price + (BASE.price  + f * FLASH_BOOST).toFixed(3) + ')';
        ctx.fillText(cell.price.padStart(7), x + 46, y);

        // 涨跌
        const cc = cell.dir > 0 ? pal.up : pal.down;
        ctx.fillStyle = cc + (BASE.change + f * FLASH_BOOST).toFixed(3) + ')';
        ctx.fillText((cell.change + '%').padStart(8), x + 96, y);

        // 衰减 flash
        if (f > 0.004) { cell.flash = f * DECAY; } else { cell.flash = 0; }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', buildGrid);
  buildGrid();
  requestAnimationFrame(draw);
})();
