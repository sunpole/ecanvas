// scripts/pathfinding.js

import { grid, getNeighbors, isCellWalkable } from './grid.js';
import { SPAWN_CELLS, EXIT_CELLS, GRID_SIZE } from './config.js';

// Простой манхэттен — в будущем для A*
export function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ====== BFS: Есть ли вообще путь =======
export function checkPathExists() {
  if (!SPAWN_CELLS.length || !EXIT_CELLS.length) return false;

  const start = SPAWN_CELLS[0];
  const end = EXIT_CELLS[0];
  const visited = Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(false));
  const queue = [[start.row, start.col]];
  visited[start.row][start.col] = true;

  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === end.row && c === end.col) return true;
    for (let n of getNeighbors(r, c)) {
      if ((isCellWalkable(n.row, n.col) || (n.row === end.row && n.col === end.col)) && !visited[n.row][n.col]) {
        visited[n.row][n.col] = true;
        queue.push([n.row, n.col]);
      }
    }
  }
  return false;
}

// ====== A* Поиск оптимального пути =======
export function findPath(start, end) {
  // Open/closed списки A*, поиск кратчайшего маршрута
  const open = [];
  const closed = new Set();
  const cameFrom = {};

  function nodeKey(row, col) { return row + ',' + col; }

  open.push({
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null
  });

  while (open.length > 0) {
    // Берём лучший по f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.row === end.row && current.col === end.col) {
      // Восстанавливаем путь
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
  return null;
}

export function isPathAvailable(start = SPAWN_CELLS[0], end = EXIT_CELLS[0]) {
  return !!findPath(start, end);
}

export function recalculatePath(enemy) {
  // enemy должен иметь .row/.col
  return findPath({row: enemy.row, col: enemy.col}, EXIT_CELLS[0]);
}
