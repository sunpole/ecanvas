// scripts/game-grid.js

// ======= НАСТРОЙКИ =======
const GRID_SIZE = 10;      // Размер игрового поля (10x10), меняй по желанию
const OUTLINE = 1;         // Толщина рамки с координатами (1 клетка с каждой стороны)
const GRID_TOTAL = GRID_SIZE + 2 * OUTLINE;  // Всего клеток на канвасе

// ======= СТАРТ И ФИНИШ (автоматически по центру левого/правого края) =======
const SPAWN_CELLS = [
  { row: Math.floor(GRID_SIZE/2)-1, col: 0 },
  { row: Math.floor(GRID_SIZE/2),   col: 0 },
];
const EXIT_CELLS = [
  { row: Math.floor(GRID_SIZE/2)-1, col: GRID_SIZE + OUTLINE },
  { row: Math.floor(GRID_SIZE/2),   col: GRID_SIZE + OUTLINE },
];

// ======= ГЕНЕРАЦИЯ КООРДИНАТ ДЛЯ БУКВЕННЫХ СТОЛБЦОВ (Excel-подобное, верх/низ поля) =======
function generateColumnLabels(count) {
  let labels = [];
  for (let i = 0; i < count; i++) {
    let label = '', n = i;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label; // 65 = 'A'.charCodeAt(0)
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    labels.push(label);
  }
  return labels;
}

// ======= ГЕНЕРАЦИЯ КООРДИНАТ ДЛЯ ЦИФРОВЫХ СТРОК (слева/справа поля, сверху вниз) =======
function generateRowLabels(count) {
  return Array.from({ length: count }, (_, i) => (count - i).toString());
}

// ======= ПЕРЕМЕННЫЕ ДЛЯ КООРДИНАТ =======
const COORD_LETTERS = generateColumnLabels(GRID_SIZE); // по горизонтали, Excel-style
const COORD_NUMS = generateRowLabels(GRID_SIZE);       // по вертикали

// ======= КАНВАС ПОДГОТОВКА =======
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let selectedCell = null;

// ======= ВСПОМОГАТЕЛЬНЫЕ =======
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

function getPanelsSize() {
  const topPanel = document.querySelector('.top-panel');
  const bottomPanel = document.querySelector('.bottom-panel');
  if (!isLandscape()) {
    return {
      main: (topPanel ? topPanel.getBoundingClientRect().height : 0)
          + (bottomPanel ? bottomPanel.getBoundingClientRect().height : 0)
    }
  } else {
    return {
      main: (topPanel ? topPanel.getBoundingClientRect().width : 0)
          + (bottomPanel ? bottomPanel.getBoundingClientRect().width : 0)
    }
  }
}

function getColors() {
  const root = getComputedStyle(document.documentElement);
  return {
    FIELD_BG: root.getPropertyValue('--color-card').trim() || '#222',
    CELL_BG: root.getPropertyValue('--color-cell').trim() || '#343a40',
    CELL_BORDER: root.getPropertyValue('--color-border').trim() || '#283042',
    SELECT_BG: root.getPropertyValue('--color-accent').trim() || '#337ad9',
    COORD_BG: root.getPropertyValue('--coord-bg').trim() || '#2567e7',
    COORD_TEXT: root.getPropertyValue('--coord-text').trim() || '#ffe438',
    SPAWN_BG: '#ffe066',    // охра/жёлтый
    EXIT_BG: '#a31322'      // тёмно-красный
    
  }
}

// ======= АДАПТАЦИЯ ПОД РАЗМЕР ОКНА =======
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const panels = getPanelsSize();
  const isLand = isLandscape();

  let maxSize;
  if (!isLand) {
    maxSize = Math.min(
      Math.floor(h - panels.main),
      Math.floor(w * 0.92)
    );
  } else {
    maxSize = Math.min(
      Math.floor(h * 0.92),
      Math.floor(w - panels.main)
    );
  }
  maxSize = Math.max(maxSize, 200);
  canvas.style.width = maxSize + 'px';
  canvas.style.height = maxSize + 'px';

  const dpr = window.devicePixelRatio || 1;
  canvas.width = maxSize * dpr;
  canvas.height = maxSize * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  drawGrid();
}

// ======= ОТРИСОВКА СЕТКИ =======
function drawGrid() {
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  const C = getColors();

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = C.FIELD_BG;
  ctx.fillRect(0, 0, size, size);

  // ==== КООРДИНАТНАЯ РАМКА ====
  ctx.font = `bold ${Math.floor(cellSize * 0.55)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // --- Столбцы: буквы сверху и снизу ---
  for (let col = 1; col <= GRID_SIZE; col++) {
    let x = (col + OUTLINE - 1) * cellSize + cellSize / 2;

    // top
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect(col * cellSize, 0, cellSize, cellSize);
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_LETTERS[col - 1] || '', x, cellSize / 2);

    // bottom
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect(col * cellSize, (GRID_TOTAL - 1) * cellSize, cellSize, cellSize);
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_LETTERS[col - 1] || '', x, (GRID_TOTAL - 1) * cellSize + cellSize / 2);
  }

  // --- Строки: цифры слева и справа ---
  for (let row = 1; row <= GRID_SIZE; row++) {
    let y = (row + OUTLINE - 1) * cellSize + cellSize / 2;

    // left
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect(0, row * cellSize, cellSize, cellSize);
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_NUMS[row - 1] || '', cellSize / 2, y);

    // right
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect((GRID_TOTAL - 1) * cellSize, row * cellSize, cellSize, cellSize);
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_NUMS[row - 1] || '', (GRID_TOTAL - 1) * cellSize + cellSize / 2, y);
  }

    // ==== ВСЕ КЛЕТКИ ПОЛЯ (с учетом краёв) ====
  for (let row = 0; row < GRID_TOTAL; row++) {
    for (let col = 0; col < GRID_TOTAL; col++) {
      let x = col * cellSize;
      let y = row * cellSize;

      // Проверка: стартовая (жёлтая охра)
      const isSpawn = SPAWN_CELLS.some(cell => cell.row + OUTLINE === row && cell.col === col);

      // Проверка: финишная (тёмно-красная)
      const isExit = EXIT_CELLS.some(cell => cell.row + OUTLINE === row && cell.col === col);

      if (isSpawn) {
        ctx.fillStyle = C.SPAWN_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
      } else if (isExit) {
        ctx.fillStyle = C.EXIT_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Обычные игровые клетки (внутренняя зона)
      if (
        row >= OUTLINE && row < GRID_SIZE + OUTLINE &&
        col >= OUTLINE && col < GRID_SIZE + OUTLINE
      ) {
        ctx.fillStyle = selectedCell && selectedCell.row === (row - OUTLINE) && selectedCell.col === (col - OUTLINE)
          ? C.SELECT_BG
          : C.CELL_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = C.CELL_BORDER;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }
}

// ======= ВСПОМОГАТЕЛЬНО: Получение ячейки по координатам клика =======
function getCellByCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (evt.touches && evt.touches.length) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }
  let x = clientX - rect.left;
  let y = clientY - rect.top;
  const cellSize = rect.width / GRID_TOTAL;
  // Клик только по внутренним клеткам (игровая зона)
  const col = Math.floor(x / cellSize) - OUTLINE;
  const row = Math.floor(y / cellSize) - OUTLINE;
  if (col < 0 || row < 0 || col >= GRID_SIZE || row >= GRID_SIZE) {
    return null;
  }
  return { row, col };
}

// ======= ОБРАБОТКА КЛИКОВ =======
function handleClick(evt) {
  const cell = getCellByCoords(evt);
  selectedCell = cell;
  drawGrid();
}

// ======= СЛУШАТЕЛИ СОБЫТИЙ И ИНИЦИАЛИЗАЦИЯ =======
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (evt) => {
  evt.preventDefault();
  handleClick(evt);
});
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
const obs = new MutationObserver(() => drawGrid());
obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
setTimeout(resizeCanvas, 0);
setTimeout(resizeCanvas, 200);

// ======= ОПИСАНИЕ НАСТРОЕК =======
// GRID_SIZE    - размер внутреннего игрового поля (менять для увеличения/уменьшения размеров)
// OUTLINE      - всегда 1 (обрамляет координатной рамкой)
// COORD_LETTERS, COORD_NUMS — генерируются автоматически под GRID_SIZE

// Пример: если GRID_SIZE = 25, то координатная сетка будет от А до Y и от 25 вниз до 1.
