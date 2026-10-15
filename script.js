/* ============================================================
   DEMO EXAM · 09.02.07-2-2027 · Разбор примерного задания 2027
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initSideNav();
  initTopLink();
  initDbDiagram();
});

/* ============================================================
   1. ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (светлая / тёмная)
   ============================================================ */
function initTheme(){
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const iconEl = btn.querySelector('.theme-icon');
  const labelEl = btn.querySelector('.theme-label');

  // Загружаем сохранённую тему
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light'){
    html.setAttribute('data-theme', saved);
  } else {
    // По системным настройкам
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  updateButton();

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateButton();
    // Перерисовать связи схемы (цвет стрелок может поменяться)
    if (window.__drawLinks) setTimeout(window.__drawLinks, 50);
  });

  function updateButton(){
    const theme = html.getAttribute('data-theme');
    if (theme === 'dark'){
      iconEl.textContent = '☀️';
      labelEl.textContent = 'Светлая';
    } else {
      iconEl.textContent = '🌙';
      labelEl.textContent = 'Тёмная';
    }
  }
}

/* ============================================================
   2. АКТИВНЫЙ ПУНКТ БОКОВОГО МЕНЮ (на task1.html)
   ============================================================ */
function initSideNav(){
  const links = document.querySelectorAll('nav.side a');
  if (!links.length) return;

  const sections = Array.from(links).map(a => {
    const href = a.getAttribute('href');
    return href && href.startsWith('#') ? document.querySelector(href) : null;
  });

  function onScroll(){
    const y = window.scrollY + 110;
    let activeIdx = 0;
    sections.forEach((sec, i) => {
      if (sec && sec.offsetTop <= y) activeIdx = i;
    });
    links.forEach(l => l.classList.remove('active'));
    if (links[activeIdx]) links[activeIdx].classList.add('active');
  }

  window.addEventListener('scroll', onScroll);
  onScroll();
}

/* ============================================================
   3. КНОПКА "НАВЕРХ"
   ============================================================ */
function initTopLink(){
  const link = document.querySelector('.top-link');
  if (!link) return;
  link.addEventListener('click', function(e){
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  });
}

/* ============================================================
   4. ИНТЕРАКТИВНАЯ СХЕМА БД
   ============================================================ */
function initDbDiagram(){
  const wrap = document.getElementById('dbWrap');
  const canvas = document.getElementById('dbCanvas');
  const diagram = document.getElementById('dbDiagram');
  const svg = document.getElementById('dbLinks');
  const zoomVal = document.getElementById('zoomVal');

  if (!wrap || !canvas || !diagram || !svg) return;

  let scale = 1;
  let panX = 0, panY = 0;
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 2.0;

  const tables = diagram.querySelectorAll('.db-table');
  const originalPositions = new Map();
  tables.forEach(t => {
    const x = parseFloat(t.dataset.x || '0');
    const y = parseFloat(t.dataset.y || '0');
    t.style.left = x + 'px';
    t.style.top  = y + 'px';
    originalPositions.set(t.id, {x, y});
  });

  function applyTransform(){
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    if (zoomVal) zoomVal.textContent = Math.round(scale * 100) + '%';
  }

  function drawLinks(){
    Array.from(svg.querySelectorAll('path.link')).forEach(p => p.remove());

    const dRect = diagram.getBoundingClientRect();
    const zoom = scale;

    const linksDef = [
      {from:'t-Пользователи',     fromRow:1, to:'t-Роли',              toRow:0},
      {from:'t-Подкатегории',     fromRow:1, to:'t-Категории',         toRow:0},
      {from:'t-Товары',           fromRow:1, to:'t-Подкатегории',      toRow:0},
      {from:'t-Товары',           fromRow:2, to:'t-Производства',      toRow:0},
      {from:'t-Товарные_позиции', fromRow:1, to:'t-Товары',            toRow:0},
      {from:'t-Товарные_позиции', fromRow:2, to:'t-Размеры',           toRow:0},
      {from:'t-Заказы',           fromRow:3, to:'t-Пользователи',      toRow:0},
      {from:'t-Строки_заказов',   fromRow:1, to:'t-Заказы',            toRow:0},
      {from:'t-Строки_заказов',   fromRow:2, to:'t-Товарные_позиции',  toRow:0}
    ];

    // Цвет стрелок подстраиваем под тему
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const arrowColor = isDark ? '#c78ac7' : '#8b3a8b';

    linksDef.forEach(link => {
      const fromEl = document.getElementById(link.from);
      const toEl   = document.getElementById(link.to);
      if (!fromEl || !toEl) return;

      const fromRow = fromEl.querySelectorAll('.t-row')[link.fromRow];
      const toRow   = toEl.querySelectorAll('.t-row')[link.toRow];
      if (!fromRow || !toRow) return;

      const fr = fromRow.getBoundingClientRect();
      const tr = toRow.getBoundingClientRect();

      const fx = (fr.left - dRect.left) / zoom;
      const fy = (fr.top  - dRect.top ) / zoom + fr.height / (2 * zoom);
      const tx = (tr.left - dRect.left) / zoom;
      const ty = (tr.top  - dRect.top ) / zoom + tr.height / (2 * zoom);

      let startX, startY, endX, endY;
      if (fx > tx) {
        startX = fx;
        startY = fy;
        endX   = tx + (tr.width / zoom);
        endY   = ty;
      } else {
        startX = fx + (fr.width / zoom);
        startY = fy;
        endX   = tx;
        endY   = ty;
      }

      const midX = (startX + endX) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'link');
      path.setAttribute('d', `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
      path.setAttribute('stroke', arrowColor);
      path.setAttribute('stroke-width', '1.6');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrow)');
      path.setAttribute('opacity', '0.75');
      svg.appendChild(path);
    });

    // Перекрашиваем маркер-стрелку под тему
    const markerPath = svg.querySelector('#arrow path');
    if (markerPath) markerPath.setAttribute('fill', arrowColor);
  }

  // Публикуем для вызова из переключателя темы
  window.__drawLinks = drawLinks;

  /* --- Перетаскивание таблиц --- */
  let dragTable = null;
  let dragTableOffset = {x:0, y:0};

  tables.forEach(t => {
    t.addEventListener('mousedown', (e) => {
      dragTable = t;
      t.classList.add('dragging');
      const rect = t.getBoundingClientRect();
      dragTableOffset.x = (e.clientX - rect.left) / scale;
      dragTableOffset.y = (e.clientY - rect.top)  / scale;
      e.preventDefault();
      e.stopPropagation();
    });
  });

  /* --- Панорамирование фона --- */
  let panning = false;
  let panStart = {x:0, y:0, panX:0, panY:0};

  wrap.addEventListener('mousedown', (e) => {
    if (e.target.closest('.db-table')) return;
    panning = true;
    wrap.classList.add('dragging');
    panStart.x = e.clientX;
    panStart.y = e.clientY;
    panStart.panX = panX;
    panStart.panY = panY;
    e.preventDefault();
  });

  /* --- Движение мыши --- */
  document.addEventListener('mousemove', (e) => {
    if (dragTable) {
      const wrapRect = wrap.getBoundingClientRect();
      const mouseX = e.clientX - wrapRect.left;
      const mouseY = e.clientY - wrapRect.top;
      const canvasX = (mouseX - panX) / scale;
      const canvasY = (mouseY - panY) / scale;
      const newX = canvasX - dragTableOffset.x;
      const newY = canvasY - dragTableOffset.y;
      dragTable.style.left = newX + 'px';
      dragTable.style.top  = newY + 'px';
      drawLinks();
      return;
    }
    if (panning) {
      panX = panStart.panX + (e.clientX - panStart.x);
      panY = panStart.panY + (e.clientY - panStart.y);
      applyTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    if (dragTable) {
      dragTable.classList.remove('dragging');
      dragTable = null;
      drawLinks();
    }
    if (panning) {
      panning = false;
      wrap.classList.remove('dragging');
    }
  });

  /* --- Зум колесом --- */
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = scale;
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    let newScale = scale * factor;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    panX = mouseX - (mouseX - panX) * (newScale / oldScale);
    panY = mouseY - (mouseY - panY) * (newScale / oldScale);

    scale = newScale;
    applyTransform();
    drawLinks();
  }, {passive:false});

  /* --- Кнопки зума --- */
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomResetBtn = document.getElementById('zoomReset');

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
    scale = Math.min(MAX_SCALE, scale * 1.2);
    applyTransform(); drawLinks();
  });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
    scale = Math.max(MIN_SCALE, scale / 1.2);
    applyTransform(); drawLinks();
  });
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
    scale = 1; panX = 0; panY = 0;
    applyTransform();
    originalPositions.forEach((pos, id) => {
      const t = document.getElementById(id);
      if (t) { t.style.left = pos.x + 'px'; t.style.top = pos.y + 'px'; }
    });
    drawLinks();
  });

  /* --- Инициализация --- */
  applyTransform();
  drawLinks();

  window.addEventListener('resize', () => { setTimeout(drawLinks, 120); });
}