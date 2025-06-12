// scripts/pathfinding.js

import { grid, getNeighbors, isCellWalkable } from './grid.js';
import { SPAWN_CELLS, EXIT_CELLS, GRID_TOTAL } from './config.js';
import { logDebug } from './utils.js';

/**
 * Манхэттенское расстояние для A*
 */
export function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/**
 * Проверяет: есть ли хотя бы один путь от любого SPAWN к любому EXIT
 * (использует BFS)
 */
export function checkPathExists() {
  if (!SPAWN_CELLS.length || !EXIT_CELLS.length) return false;

  // Перебираем все пары SPAWN-EXIT, если для хотя бы одной есть путь — возвращаем true
  for (const start of SPAWN_CELLS) {
    for (const end of EXIT_CELLS) {
      const visited = Array.from({ length: GRID_TOTAL }, () => Array(GRID_TOTAL).fill(false));
      const queue = [[start.row, start.col]];
      visited[start.row][start.col] = true;
      while (queue.length) {
        const [r, c] = queue.shift();
        if (r === end.row && c === end.col) {
          // logDebug('Путь найден BFS', start, end);
          return true;
        }
        for (let n of getNeighbors(r, c)) {
          if (
            (isCellWalkable(n.row, n.col) || (n.row === end.row && n.col === end.col)) &&
            !visited[n.row][n.col]
          ) {
            visited[n.row][n.col] = true;
            queue.push([n.row, n.col]);
          }
        }
      }
    }
  }
  logDebug('ПУТЬ НЕ НАЙДЕН (все SPAWN→EXIT разорваны)');
  return false;
}

/**
 * Поиск кратчайшего пути (A*) между start и end
 * Возвращает массив {row, col} или null если путь не существует
 */
export function findPath(start, end) {
  const open = [];
  const closed = new Set();
  const nodeKey = (row, col) => `${row},${col}`;

  open.push({
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null
  });

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.row === end.row && current.col === end.col) {
      // Восстановление пути:
      const path = [];
      let curr = current;
      while (curr) {
        path.unshift({ row: curr.row, col: curr.col });
        curr = curr.parent;
      }
      return path;
    }
    closed.add(nodeKey(current.row, current.col));
    for (const n of getNeighbors(current.row, current.col)) {
      if (!isCellWalkable(n.row, n.col) && !(n.row === end.row && n.col === end.col)) continue;
      if (closed.has(nodeKey(n.row, n.col))) continue;
      const g = current.g + 1;
      let foundOpen = open.find(o => o.row === n.row && o.col === n.col);
      if (!foundOpen) {
        open.push({
          row: n.row, col: n.col,
          g, h: heuristic(n, end),
          f: g + heuristic(n, end),
          parent: current
        });
      } else if (g < foundOpen.g) {
        foundOpen.g = g;
        foundOpen.f = g + foundOpen.h;
        foundOpen.parent = current;
      }
    }
  }
  // logDebug('A*: путь не найден', start, end);
  return null;
}

/**
 * Быстрый способ узнать, есть ли путь между двумя точками (через A*)
 */
export function isPathAvailable(start = SPAWN_CELLS[0], end = EXIT_CELLS[0]) {
  return !!findPath(start, end);
}

/**
 * Пересчитать путь для врага (по текущей сетке, обычно после перестановок модулей)
 */
export function recalculatePath(enemy) {
  // enemy должен иметь .row, .col
  return findPath({ row: enemy.row, col: enemy.col }, EXIT_CELLS[0]);
}
