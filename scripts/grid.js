// scripts/grid.js

// ======= НАСТРОЙКИ =======
import { GRID_SIZE, OUTLINE, GRID_TOTAL } from './config.js';

// ======= СТАРТ И ФИНИШ =======
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

// ======= ГЛОБАЛЬНЫЕ ДАННЫЕ =======
export let grid = [];
let selectedCell = null; // Последняя выбранная пользователем клетка

// ======= ГЕНЕРАЦИЯ КООРДИНАТ =======
function generateColumnLabels(count) {
  let labels = [];
  for (let i = 0; i < count; i++) {
    let label = '', n = i;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    labels.push(label);
  }
  return labels;
}
function generateRowLabels(count) {
  return Array.from({ length: count }, (_, i) => (count - i).toString());
}
const COORD_LETTERS = generateColumnLabels(GRID_SIZE);
const COORD_NUMS = generateRowLabels(GRID_SIZE);

// ======= КАНВАС И КОНТЕКСТ =======
const canvas = document.getElementById('game-canvas');
if (!canvas) {
  console.error("❌ Canvas с id='game-canvas' не найден!");
}
const ctx = canvas?.getContext('2d');
if (canvas && !ctx) {
  console.error("❌ Контекст 2D не получен!");
}

// ======= ГЕНЕРАЦИЯ СЕТКИ =======
export function createGrid(rows = GRID_SIZE, cols = GRID_SIZE) {
  grid = [];
  for (let row = 0; row < rows; row++) {
    let rowArr = [];
    for (let col = 0; col < cols; col++) {
      let status = 'empty';
      if (SPAWN_CELLS.some(cell => cell.row === row && cell.col === col)) status = 'spawn';
      if (EXIT_CELLS.some(cell => cell.row === row && cell.col === col)) status = 'exit';
      rowArr.push({ row, col, status });
    }
    grid.push(rowArr);
  }
  // Не сбрасываем selectedCell, чтобы не терять выбор при перегенерации
  console.log("✅ Сетка создана", grid);
}

// ======= ПРОВЕРКА ПРОХОДИМОСТИ =======
export function isCellWalkable(row, col) {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  const st = grid[row][col]?.status;
  // Можно разрешить 'spawn' как walkable — смотри специфику игры
  return (st === 'empty' || st === 'exit' || st === 'spawn');
}

// ======= ОБНОВЛЕНИЕ СТАТУСА =======
export function setCellStatus(row, col, status) {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  grid[row][col].status = status;
  return true;
}

// ======= ДОСТУП К ВЫБРАННОЙ КЛЕТКЕ =======
export function getSelectedCell() {
  return selectedCell;
}
export function setSelectedCell(cell) {
  if (
    cell &&
    typeof cell.row === 'number' &&
    typeof cell.col === 'number' &&
    cell.row >= 0 &&
    cell.row < GRID_SIZE &&
    cell.col >= 0 &&
    cell.col < GRID_SIZE
  ) {
    selectedCell = cell;
    drawGrid();
    return true;
  }
  return false;
}

// ======= ПОИСК СОСЕДЕЙ (для pathfinding) =======
export function getNeighbors(row, col) {
  const neighbors = [];
  const deltas = [
    [-1, 0], [1, 0],   // вверх, вниз
    [0, -1], [0, 1]    // влево, вправо
  ];
  for (let [dr, dc] of deltas) {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE)
      neighbors.push(grid[nr][nc]);
  }
  return neighbors;
}

// ======= ОПРЕДЕЛЕНИЕ ОРИЕНТАЦИИ =======
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

// ======= ВЫЧИСЛЕНИЕ РАЗМЕРОВ ПАНЕЛЕЙ =======
function getPanelsSize() {
  const topPanel = document.querySelector('.top-panel');
  const bottomPanel = document.querySelector('.bottom-panel');
  if (!topPanel) console.warn("⚠️ top-panel не найдена");
  if (!bottomPanel) console.warn("⚠️ bottom-panel не найдена");

  if (!isLandscape()) {
    return {
      main: (topPanel?.getBoundingClientRect().height || 0) +
            (bottomPanel?.getBoundingClientRect().height || 0)
    };
  } else {
    return {
      main: (topPanel?.getBoundingClientRect().width || 0) +
            (bottomPanel?.getBoundingClientRect().width || 0)
    };
  }
}

// ======= ПОЛУЧЕНИЕ ЦВЕТОВ ИЗ CSS-ПЕРЕМЕННЫХ =======
function getColors() {
  const root = getComputedStyle(document.documentElement);
  return {
    FIELD_BG: root.getPropertyValue('--color-card').trim() || '#222',
    CELL_BG: root.getPropertyValue('--color-cell').trim() || '#343a40',
    CELL_BORDER: root.getPropertyValue('--color-border').trim() || '#283042',
    SELECT_BG: root.getPropertyValue('--color-accent').trim() || '#337ad9',
    COORD_BG: root.getPropertyValue('--coord-bg').trim() || '#2567e7',
    COORD_TEXT: root.getPropertyValue('--coord-text').trim() || '#ffe438',
    SPAWN_BG: '#ffe066',
    EXIT_BG: '#a31322'
  };
}

// ======= МАСШТАБИРОВАНИЕ, КАНВАС И ОТРИСОВКА =======
function resizeCanvas() {
  if (!canvas || !ctx) {
    console.warn("⚠️ Пропущен resizeCanvas — canvas или контекст не готовы");
    return;
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const panels = getPanelsSize();
  const isLand = isLandscape();
  let maxSize;
  if (!isLand) {
    maxSize = Math.min(Math.floor(h - panels.main), Math.floor(w * 0.92));
  } else {
    maxSize = Math.min(Math.floor(h * 0.92), Math.floor(w - panels.main));
  }
  maxSize = Math.max(maxSize, 200);

  canvas.style.width = maxSize + 'px';
  canvas.style.height = maxSize + 'px';
  canvas.style.aspectRatio = '1 / 1';

  const dpr = window.devicePixelRatio || 1;
  canvas.width = maxSize * dpr;
  canvas.height = maxSize * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  drawGrid();
}

function drawGrid() {
  if (!ctx) {
    console.error("❌ drawGrid: контекст не готов");
    return;
  }
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  const C = getColors();

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = C.FIELD_BG;
  ctx.fillRect(0, 0, size, size);

  ctx.font = `bold ${Math.floor(cellSize * 0.55)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // --- Координаты по краям ---
  for (let col = 1; col <= GRID_SIZE; col++) {
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect(col * cellSize, 0, cellSize, cellSize);
    ctx.fillRect(col * cellSize, (GRID_TOTAL - 1) * cellSize, cellSize, cellSize);
  }
  for (let row = 1; row <= GRID_SIZE; row++) {
    ctx.fillStyle = C.COORD_BG;
    ctx.fillRect(0, row * cellSize, cellSize, cellSize);
    ctx.fillRect((GRID_TOTAL - 1) * cellSize, row * cellSize, cellSize, cellSize);
  }

  // --- Основная сетка/клетки ---
  for (let row = 0; row < GRID_TOTAL; row++) {
    for (let col = 0; col < GRID_TOTAL; col++) {
      let x = col * cellSize, y = row * cellSize;
      const isSpawn = SPAWN_CELLS.some(cell => cell.row + OUTLINE === row && cell.col === col);
      const isExit = EXIT_CELLS.some(cell => cell.row + OUTLINE === row && cell.col === col);

      if (isSpawn) {
        ctx.fillStyle = C.SPAWN_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
      } else if (isExit) {
        ctx.fillStyle = C.EXIT_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      if (row >= OUTLINE && row < GRID_SIZE + OUTLINE && col >= OUTLINE && col < GRID_SIZE + OUTLINE) {
        ctx.fillStyle =
          selectedCell && selectedCell.row === (row - OUTLINE) && selectedCell.col === (col - OUTLINE)
            ? C.SELECT_BG
            : C.CELL_BG;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = C.CELL_BORDER;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }
  // --- Подписи координат (буквы и цифры) ---
  for (let col = 1; col <= GRID_SIZE; col++) {
    let x = (col + OUTLINE - 1) * cellSize + cellSize / 2;
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_LETTERS[col - 1] || '', x, cellSize / 2);
    ctx.fillText(COORD_LETTERS[col - 1] || '', x, (GRID_TOTAL - 1) * cellSize + cellSize / 2);
  }
  for (let row = 1; row <= GRID_SIZE; row++) {
    let y = (row + OUTLINE - 1) * cellSize + cellSize / 2;
    ctx.fillStyle = C.COORD_TEXT;
    ctx.fillText(COORD_NUMS[row - 1] || '', cellSize / 2, y);
    ctx.fillText(COORD_NUMS[row - 1] || '', (GRID_TOTAL - 1) * cellSize + cellSize / 2, y);
  }
}

// ======= ОБРАБОТКА КЛИКОВ =======
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
  const col = Math.floor(x / cellSize) - OUTLINE;
  const row = Math.floor(y / cellSize) - OUTLINE;

  if (col < 0 || row < 0 || col >= GRID_SIZE || row >= GRID_SIZE) {
    return null;
  }
  return { row, col };
}

function handleClick(evt) {
  const cell = getCellByCoords(evt);
  if (!cell) return;

  // Пример смены статуса по клику: поставить башню/снять башню
  const currentStatus = grid[cell.row][cell.col].status;
  const newStatus = currentStatus === 'empty' ? 'tower' : 'empty';

  // >>> ВАЛИДАЦИЯ. Например, нельзя ставить на старт/финиш
  if (currentStatus === 'spawn' || currentStatus === 'exit') return;

  // (Здесь можно добавить проверку Block Path, если есть checkPathExists)
  // if (newStatus === 'tower') {
  //   setCellStatus(cell.row, cell.col, newStatus);
  //   const pathExists = checkPathExists(); // реализовать по нужде
  //   if (!pathExists) {
  //     setCellStatus(cell.row, cell.col, currentStatus);
  //     alert('Нельзя блокировать путь полностью!');
  //     return;
  //   }
  // } else {
      setCellStatus(cell.row, cell.col, newStatus);
  // }

  selectedCell = cell;
  drawGrid();
}

// ======= ИНИЦИАЛИЗАЦИЯ =======
if (canvas) {
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchstart', (evt) => {
    evt.preventDefault();
    handleClick(evt);
  });

  const obs = new MutationObserver(() => drawGrid());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  requestAnimationFrame(resizeCanvas);
  setTimeout(resizeCanvas, 200);
}

// Перерисовать при ресайзе/ориентации
window.addEventListener('resize', () => requestAnimationFrame(resizeCanvas));
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

// ======= СТАРТОВАЯ ИНИЦИАЛИЗАЦИЯ =======
createGrid();
resizeCanvas();
