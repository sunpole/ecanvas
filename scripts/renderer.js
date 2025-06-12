// scripts/renderer.js

// ======= ИМПОРТЫ =======
import { GRID_SIZE, OUTLINE, GRID_TOTAL } from './config.js';
import { grid, getSelectedCell } from './grid.js';
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

// ======= CANVAS/CTX PROVIDER (безопасно для SSR/hot reload) =======
function getCanvasAndCtx() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error("❌ Canvas с id='game-canvas' не найден в DOM!");
    return {};
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error("❌ Не удалось получить 2D контекст!");
    return {};
  }
  return { canvas, ctx };
}

// ======= КОНФИГИ, ЦВЕТА, ПАНЕЛИ =======
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
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}
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

// ======= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ КООРДИНАТ =======
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

// Клетка → пиксели (центр)
function cellToPixels(row, col, cellSize) {
  return {
    x: (col + OUTLINE) * cellSize + cellSize / 2,
    y: (row + OUTLINE) * cellSize + cellSize / 2
  };
}
// Клетка → пиксели (верхний левый угол)
function cellToTopLeft(row, col, cellSize) {
  return {
    x: (col + OUTLINE) * cellSize,
    y: (row + OUTLINE) * cellSize
  };
}

// ======= CANVAS CLEAR =======
function clearCanvas() {
  const { canvas, ctx } = getCanvasAndCtx();
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ======= DRAW GRID =======
function drawGrid() {
  const { canvas, ctx } = getCanvasAndCtx();
  if (!ctx || !canvas) return;
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  const C = getColors();
  const selectedCell = getSelectedCell();

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

// ======= RESIZE CANVAS =======
function resizeCanvas() {
  const { canvas, ctx } = getCanvasAndCtx();
  if (!canvas || !ctx) return;
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

// ======= PROGRESS BAR (АПГРЕЙД БАШНИ) =======
function drawUpgradeProgressBar(x, y, cellSize, totalSteps, doneSteps) {
  const { ctx } = getCanvasAndCtx();
  if (!ctx) return;
  const barWidth = cellSize * 0.8;
  const barHeight = cellSize * 0.18;
  const barX = x + (cellSize - barWidth) / 2;
  const barY = y - barHeight - 2;

  // Фон
  ctx.save();
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = "#181f22";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.restore();

  // Заполненная часть
  const progress = Math.max(0, Math.min(1, doneSteps / totalSteps));
  ctx.fillStyle = "#2db3fd";
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  // Остаток
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(barX + barWidth * progress, barY, barWidth * (1 - progress), barHeight);

  // Рамка
  ctx.strokeStyle = "#174fa6";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Цифра (сек.)
  const secondsLeft = Math.max(0, totalSteps - doneSteps);
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.floor(barHeight * 0.9)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 3;
  ctx.fillText(secondsLeft, barX + barWidth / 2, barY + barHeight / 2);
  ctx.shadowBlur = 0;
}

// ======= HP BAR ДЛЯ ВРАГА =======
function drawEnemyHPBar(x, y, width, hp, maxHp) {
  const { ctx } = getCanvasAndCtx();
  if (!ctx) return;
  const barWidth = width * 0.9;
  const barHeight = Math.max(6, Math.floor(width * 0.15));
  const barX = x - barWidth / 2;
  const barY = y - width / 2 - barHeight - 6; // Над врагом

  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "#181f25";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.restore();

  // HP-полоса
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  ctx.fillStyle = (ratio > 0.5) ? "#27f53c" : (ratio > 0.25) ? "#ffe066" : "#ff236e";
  ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

  ctx.strokeStyle = "#154c1b";
  ctx.lineWidth = 1.3;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Текст
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.floor(barHeight * 0.95)}px Arial`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 2;
  ctx.fillText(`${Math.ceil(hp)}/${maxHp}`, barX + barWidth - 3, barY + barHeight / 2);
  ctx.shadowBlur = 0;
}

// ======= DRAW ENEMIES =======
function drawEnemies(orders) {
  const { ctx, canvas } = getCanvasAndCtx();
  if (!ctx || !canvas) return;
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  for (const order of orders) {
    if (order.dead) continue;
    const { x, y } = cellToPixels(order.row, order.col, cellSize);
    // Кружок врага
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.34, 0, 2 * Math.PI, false);
    ctx.fillStyle = order.color || "#2e90ff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // HP (над головой)
    if (order.hp < order.maxHp) {
      drawEnemyHPBar(x, y, cellSize * 0.78, order.hp, order.maxHp);
    }
  }
}

// ======= DRAW TOWERS =======
function drawTowers(towers) {
  const { ctx, canvas } = getCanvasAndCtx();
  if (!ctx || !canvas || !Array.isArray(towers)) return;
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  for (const tower of towers) {
    const { x, y } = cellToTopLeft(tower.row, tower.col, cellSize);
    ctx.save();
    ctx.fillStyle = tower.color || '#337ad9';
    ctx.fillRect(x, y, cellSize, cellSize);
    ctx.strokeStyle = '#283042';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellSize, cellSize);
    ctx.restore();

    if (tower.upgTotal && tower.upgDone < tower.upgTotal) {
      drawUpgradeProgressBar(x, y, cellSize, tower.upgTotal, tower.upgDone);
    }
  }
}

// ======= МАСТЕР-РЕНДЕР СЦЕНЫ (для game-loop/renderAll) =======
/**
 * Рисует ВСЕ (сетку, башни, враги) — вызывать из game-loop/renderAll
 * @param {Object[]} orders - массив врагов (orders.js)
 * @param {Object[]} towers - массив башен (если есть)
 */
function renderScene(orders, towers = []) {
  clearCanvas();
  drawGrid();
  if (Array.isArray(towers)) drawTowers(towers);
  drawEnemies(orders);
}

// ======= ЭКСПОРТЫ (все в конце, без дублирования) =======
export {
  clearCanvas,
  drawGrid,
  resizeCanvas,
  drawUpgradeProgressBar,
  drawEnemyHPBar,
  drawEnemies,
  drawTowers,
  renderScene
};
