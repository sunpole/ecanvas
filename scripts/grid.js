// scripts/grid.js

// ======= НАСТРОЙКИ =======
import { GRID_SIZE, OUTLINE, GRID_TOTAL, SPAWN_CELLS, EXIT_CELLS } from './config.js';
import { logDebug } from './utils.js';
import { checkPathExists } from './pathfinding.js';

// ======= ГЛОБАЛЬНЫЕ ДАННЫЕ =======
export let grid = [];
let selectedCell = null; // Последняя выбранная пользователем клетка

// ======= ГЕНЕРАЦИЯ СЕТКИ С УЧЁТОМ РАМКИ (OUTLINE) =======
/**
 * Создает новую игровую сетку с учетом рамки (OUTLINE).
 * Клетки по краям - стены, SPAWN/EXIT - старт/выход, остальные - пустые.
 */
export function createGrid(rows = GRID_TOTAL, cols = GRID_TOTAL) {
  grid = [];
  for (let row = 0; row < rows; row++) {
    let rowArr = [];
    for (let col = 0; col < cols; col++) {
      let status = 'empty';

      // OUTLINE — крайние стены вокруг игрового поля
      if (
        row < OUTLINE || row >= GRID_TOTAL - OUTLINE ||
        col < OUTLINE || col >= GRID_TOTAL - OUTLINE
      ) {
        status = 'wall';
      }
      if (SPAWN_CELLS.some(cell => cell.row === row && cell.col === col)) status = 'spawn';
      if (EXIT_CELLS.some(cell => cell.row === row && cell.col === col)) status = 'exit';

      rowArr.push({ row, col, status, module: null });
    }
    grid.push(rowArr);
  }
  logDebug("✅ Сетка создана", grid);
}

// ======= ПРОВЕРКА ПРОХОДИМОСТИ ДЛЯ PATHFINDING =======
/**
 * Является ли клетка проходимой для поиска пути/врага
 */
export function isCellWalkable(row, col) {
  if (!isInBounds(row, col)) return false;
  const st = grid[row][col]?.status;
  return (st === 'empty' || st === 'exit' || st === 'spawn');
}

// ======= ПРОВЕРКА ВХОЖДЕНИЯ В ПОЛЕ =======
/**
 * Внутри ли координаты рабочей части сетки
 */
export function isInBounds(row, col) {
  return (
    row >= 0 && row < GRID_TOTAL &&
    col >= 0 && col < GRID_TOTAL
  );
}

// ======= ОБНОВЛЕНИЕ СТАТУСА КЛЕТКИ =======
/**
 * Смена статуса клетки (не разрешит менять spawn/exit)
 */
export function setCellStatus(row, col, status) {
  if (!isInBounds(row, col)) {
    logDebug('setCellStatus: вне поля', row, col, status);
    return false;
  }
  if (
    grid[row][col].status === 'spawn' ||
    grid[row][col].status === 'exit'
  ) {
    logDebug('setCellStatus: запрещено для spawn/exit', row, col);
    return false;
  }
  grid[row][col].status = status;
  return true;
}

// ======= МОЖНО ЛИ ПОСТАВИТЬ МОДУЛЬ? =======
/**
 * Проверяет, можно ли поставить модуль-блок в указанную клетку:
 * - только на пустую клетку
 * - не на SPAWN/EXIT
 * - не блокирует существование пути
 */
export function canPlaceModule(row, col) {
  if (!isInBounds(row, col)) return false;
  const st = grid[row][col].status;
  if (st !== 'empty') return false;

  // Временно ставим блок и проверяем проходимость
  const prev = st;
  grid[row][col].status = 'block';
  const path = checkPathExists();
  grid[row][col].status = prev;
  return path;
}

// ======= УСТАНОВКА/УДАЛЕНИЕ МОДУЛЯ-БЛОКА =======
/**
 * Ставит модуль (блок) в клетку, если это допустимо.
 */
export function placeModule(row, col) {
  if (!canPlaceModule(row, col)) return false;
  grid[row][col].status = 'block';
  return true;
}
/**
 * Убирает модуль, если он есть (только status === 'block')
 */
export function removeModule(row, col) {
  if (!isInBounds(row, col)) return false;
  if (grid[row][col].status === 'block') {
    grid[row][col].status = 'empty';
    return true;
  }
  return false;
}

// ======= УПРАВЛЕНИЕ ВЫБРАННОЙ КЛЕТКОЙ =======
/**
 * Получить или задать клетку, выбранную пользователем
 */
export function getSelectedCell() {
  return selectedCell;
}
export function setSelectedCell(cell) {
  if (
    cell &&
    typeof cell.row === 'number' &&
    typeof cell.col === 'number' &&
    isInBounds(cell.row, cell.col)
  ) {
    selectedCell = cell;
    return true;
  }
  return false;
}

// ======= ПОИСК СОСЕДЕЙ (для pathfinding) =======
/**
 * Возвращает массив соседних клеток (по 4 сторонам)
 */
export function getNeighbors(row, col) {
  const neighbors = [];
  const deltas = [
    [-1, 0], [1, 0],   // вверх, вниз
    [0, -1], [0, 1]    // влево, вправо
  ];
  for (let [dr, dc] of deltas) {
    const nr = row + dr, nc = col + dc;
    if (isInBounds(nr, nc)) {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

// ======= ПРЕОБРАЗОВАНИЕ КООРДИНАТ/ИНДЕКСОВ =======
/**
 * Переводит координаты (row, col) в одномерный индекс
 */
export function coordsToIndex(row, col) {
  return row * GRID_TOTAL + col;
}
/**
 * Переводит одномерный индекс обратно в {row, col}
 */
export function indexToCoords(index) {
  return {
    row: Math.floor(index / GRID_TOTAL),
    col: index % GRID_TOTAL,
  };
}
