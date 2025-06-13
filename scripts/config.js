// scripts/config.js

export const GRID_SIZE = 10;
export const OUTLINE = 1;
export const GRID_TOTAL = GRID_SIZE + 2 * OUTLINE;

export const SPAWN_CELLS = [
  { row: Math.floor(GRID_SIZE / 2) - 1 + OUTLINE, col: 0 },
  { row: Math.floor(GRID_SIZE / 2) + OUTLINE, col: 0 },
];

export const EXIT_CELLS = [
  { row: Math.floor(GRID_SIZE / 2) - 1 + OUTLINE, col: GRID_SIZE + OUTLINE },
  { row: Math.floor(GRID_SIZE / 2) + OUTLINE, col: GRID_SIZE + OUTLINE },
];
