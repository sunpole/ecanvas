// scripts/grid.js

// ======= НАСТРОЙКИ =======
import { GRID_SIZE, OUTLINE, GRID_TOTAL } from './config.js';

// ======= СТАРТ И ФИНИШ =======
import { SPAWN_CELLS, EXIT_CELLS } from './config.js';

// ======= PATHFINDING =======
import { checkPathExists } from './pathfinding.js';

// ======= ГЛОБАЛЬНЫЕ ДАННЫЕ =======
export let grid = [];
let selectedCell = null; // Последняя выбранная пользователем клетка


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


// Преобразование координат в индекс одномерного массива
export function coordsToIndex(row, col) {
  return row * GRID_SIZE + col;
}

// Преобразование индекса в координаты
export function indexToCoords(index) {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}
