import { grid, getNeighbors, isCellWalkable } from './grid.js';
import { SPAWN_CELLS, EXIT_CELLS, GRID_TOTAL } from './config.js';
import { logDebug } from './utils.js';

/**
 * Манхэттенское расстояние для A*
 */
export function heuristic(a, b) {
  const dist = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  logDebug(`[PATHFINDING] Heuristic from (${a.row},${a.col}) to (${b.row},${b.col}) = ${dist}`);
  return dist;
}

/**
 * Проверяет: есть ли хотя бы один путь от любого SPAWN к любому EXIT
 * (использует BFS)
 */
export function checkPathExists() {
  if (!SPAWN_CELLS.length || !EXIT_CELLS.length) {
    logDebug('[PATHFINDING] Нет SPAWN или EXIT точек, путь невозможен');
    return false;
  }

  // Предполагается, что GRID_TOTAL — это размер по одной стороне (например, 10 для 10x10)
  const gridSize = GRID_TOTAL;

  for (const start of SPAWN_CELLS) {
    for (const end of EXIT_CELLS) {
      logDebug(`[PATHFINDING] Проверяем путь BFS от (${start.row},${start.col}) до (${end.row},${end.col})`);
      const visited = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
      const queue = [[start.row, start.col]];
      visited[start.row][start.col] = true;

      while (queue.length) {
        const [r, c] = queue.shift();
        if (r === end.row && c === end.col) {
          logDebug(`[PATHFINDING] Путь найден BFS от (${start.row},${start.col}) до (${end.row},${end.col})`);
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
      logDebug(`[PATHFINDING] Путь BFS не найден для пары (${start.row},${start.col}) -> (${end.row},${end.col})`);
    }
  }

  logDebug('[PATHFINDING] ПУТЬ НЕ НАЙДЕН (все SPAWN→EXIT разорваны)');
  return false;
}

/**
 * Поиск кратчайшего пути (A*) между start и end
 * Возвращает массив {row, col} или null если путь не существует
 */
export function findPath(start, end) {
  if (!start || !end) {
    logDebug('[PATHFINDING] findPath: некорректные входные данные');
    return null;
  }

  logDebug(`[PATHFINDING] Запуск A* поиска пути от (${start.row},${start.col}) до (${end.row},${end.col})`);

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
    open.sort((a, b) => a.f - b.f); // При необходимости заменить на кучу
    const current = open.shift();

    if (current.row === end.row && current.col === end.col) {
      const path = [];
      let curr = current;
      while (curr) {
        path.unshift({ row: curr.row, col: curr.col });
        curr = curr.parent;
      }
      logDebug(`[PATHFINDING] A*: путь найден длиной ${path.length}`);
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
          row: n.row,
          col: n.col,
          g,
          h: heuristic(n, end),
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

  logDebug(`[PATHFINDING] A*: путь не найден от (${start.row},${start.col}) до (${end.row},${end.col})`);
  return null;
}

/**
 * Быстрый способ узнать, есть ли путь между двумя точками (через A*)
 */
export function isPathAvailable(start = SPAWN_CELLS[0], end = EXIT_CELLS[0]) {
  if (!start || !end) {
    logDebug('[PATHFINDING] isPathAvailable: нет начальной или конечной точки');
    return false;
  }
  const result = !!findPath(start, end);
  logDebug(`[PATHFINDING] isPathAvailable: путь ${result ? 'есть' : 'отсутствует'} от (${start.row},${start.col}) до (${end.row},${end.col})`);
  return result;
}

/**
 * Пересчитать путь для врага (по текущей сетке, обычно после перестановок модулей)
 */
export function recalculatePath(enemy) {
  if (!enemy || !EXIT_CELLS.length) {
    logDebug('[PATHFINDING] recalculatePath: нет врага или EXIT точек');
    return null;
  }
  const path = findPath({ row: enemy.row, col: enemy.col }, EXIT_CELLS[0]);
  logDebug(`[PATHFINDING] recalculatePath: пересчитан путь для врага на (${enemy.row},${enemy.col}), длина пути: ${path ? path.length : 'null'}`);
  return path;
}
