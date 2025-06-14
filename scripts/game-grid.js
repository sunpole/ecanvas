// scripts/tower-defence.js

import { GRID_SIZE, OUTLINE, GRID_TOTAL } from './game-grid.js';
import { SPAWN_CELLS, EXIT_CELLS } from './game-grid.js';

const TICK_RATE = 200;
const DEBUG = true;
const ENEMY_HP = 20;
const BULLET_SPEED = 1;
const TOWER_RANGE = 3;
const TOWER_FIRE_RATE = 1000;

let canvas, ctx, CELL_SIZE;
let enemies = [];
let bullets = [];
let towers = [];
let gameInterval = null;
let tick = 0;
let wave = 0;
let isRunning = false;

// ======= УТИЛИТЫ =======
function log(msg) {
  if (DEBUG) console.log(`[DEBUG] ${msg}`);
}

// ======= ИНИЦИАЛИЗАЦИЯ =======
window.addEventListener('load', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  CELL_SIZE = canvas.width / GRID_TOTAL;
  log("🎮 Tower Defence готов");
  setupUI();
  startGame();
});

function setupUI() {
  const startBtn = document.getElementById('btn-start');
  const restartBtn = document.getElementById('btn-restart');

  if (startBtn) startBtn.onclick = startGame;
  if (restartBtn) restartBtn.onclick = restartGame;

  document.addEventListener('keydown', (e) => {
    if (e.code === 'F4') restartGame();
    if (e.code === 'F5') startGame();
  });

  canvas.addEventListener('click', placeTower);
}

// ======= ИГРОВАЯ ЛОГИКА =======
function startGame() {
  if (isRunning) return;
  log("🚀 Игра началась");
  isRunning = true;
  wave = 1;
  tick = 0;
  enemies = [];
  towers = [];
  bullets = [];
  spawnWave();
  gameInterval = setInterval(gameLoop, TICK_RATE);
}

function restartGame() {
  log("🔁 Перезапуск игры");
  clearInterval(gameInterval);
  isRunning = false;
  startGame();
}

// ======= ВРАГ =======
class Enemy {
  constructor(spawn) {
    this.row = spawn.row;
    this.col = spawn.col;
    this.hp = ENEMY_HP;
    this.maxHp = ENEMY_HP;
    this.path = findPath(this.row, this.col, EXIT_CELLS[0].row, EXIT_CELLS[0].col);
  }

  move() {
    if (this.path.length > 0) {
      const next = this.path.shift();
      this.row = next.row;
      this.col = next.col;
    } else {
      log("😈 Враг добрался до выхода");
      this.hp = 0;
    }
  }

  draw() {
    const x = (this.col + OUTLINE) * CELL_SIZE;
    const y = (this.row + OUTLINE) * CELL_SIZE;
    ctx.fillStyle = 'red';
    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    ctx.fillStyle = 'green';
    ctx.fillRect(x + 4, y + 2, (CELL_SIZE - 8) * this.hp / this.maxHp, 4);
  }
}

// ======= БАШНЯ =======
class Tower {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.lastShot = 0;
  }

  update() {
    const now = Date.now();
    if (now - this.lastShot > TOWER_FIRE_RATE) {
      const target = enemies.find(e => distance(this.row, this.col, e.row, e.col) <= TOWER_RANGE);
      if (target) {
        bullets.push(new Bullet(this, target));
        this.lastShot = now;
        log(`🎯 Башня выстрелила в врага (${target.row}, ${target.col})`);
      }
    }
  }

  draw() {
    const x = (this.col + OUTLINE) * CELL_SIZE;
    const y = (this.row + OUTLINE) * CELL_SIZE;
    ctx.fillStyle = 'blue';
    ctx.fillRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);
  }
}

// ======= СНАРЯД =======
class Bullet {
  constructor(tower, target) {
    this.x = tower.col + 0.5;
    this.y = tower.row + 0.5;
    this.target = target;
  }

  update() {
    if (!this.target || this.target.hp <= 0) return false;
    const dx = this.target.col + 0.5 - this.x;
    const dy = this.target.row + 0.5 - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      this.target.hp -= 5;
      log(`💥 Попадание! HP врага: ${this.target.hp}`);
      return false;
    }

    this.x += (dx / dist) * BULLET_SPEED * 0.1;
    this.y += (dy / dist) * BULLET_SPEED * 0.1;
    return true;
  }

  draw() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc((this.x + OUTLINE) * CELL_SIZE, (this.y + OUTLINE) * CELL_SIZE, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// ======= ВОЛНЫ =======
function spawnWave() {
  log(`🌊 Волна ${wave}`);
  SPAWN_CELLS.forEach(spawn => {
    const enemy = new Enemy(spawn);
    enemies.push(enemy);
  });
  wave++;
}

// ======= ЛУП =======
function gameLoop() {
  tick++;

  if (tick % 20 === 0) spawnWave();

  enemies.forEach(e => e.move());
  towers.forEach(t => t.update());
  bullets = bullets.filter(b => b.update());
  enemies = enemies.filter(e => e.hp > 0);

  drawAll();
}

// ======= ОТРИСОВКА =======
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  enemies.forEach(e => e.draw());
  towers.forEach(t => t.draw());
  bullets.forEach(b => b.draw());
}

// ======= ПОСТАНОВКА БАШНИ =======
function placeTower(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE) - OUTLINE;
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE) - OUTLINE;
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;

  const pathExists = bfsCheck({ row: y, col: x });
  if (!pathExists) {
    log("🚫 Нельзя ставить башню — путь будет заблокирован");
    return;
  }

  towers.push(new Tower(y, x));
  log(`🏰 Башня установлена на (${y}, ${x})`);
}

// ======= ПОИСКИ =======
function bfsCheck(blocked) {
  const queue = [SPAWN_CELLS[0]];
  const visited = new Set();
  const key = (r, c) => `${r},${c}`;
  visited.add(key(blocked.row, blocked.col));

  while (queue.length) {
    const { row, col } = queue.shift();
    if (EXIT_CELLS.some(e => e.row === row && e.col === col)) return true;
    for (const [dr, dc] of [[0,1],[1,0],[-1,0],[0,-1]]) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nc >= 0 && nr < GRID_SIZE && nc < GRID_SIZE && !visited.has(key(nr, nc))) {
        visited.add(key(nr, nc));
        queue.push({ row: nr, col: nc });
      }
    }
  }
  return false;
}

function findPath(sr, sc, er, ec) {
  const open = [{ row: sr, col: sc, g: 0, f: 0, path: [] }];
  const visited = new Set();
  const key = (r, c) => `${r},${c}`;

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.row === er && current.col === ec) return current.path;

    visited.add(key(current.row, current.col));

    for (const [dr, dc] of [[0,1],[1,0],[-1,0],[0,-1]]) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nc < 0 || nr >= GRID_SIZE || nc >= GRID_SIZE) continue;
      if (visited.has(key(nr, nc))) continue;

      const g = current.g + 1;
      const h = Math.abs(er - nr) + Math.abs(ec - nc);
      const f = g + h;

      open.push({ row: nr, col: nc, g, f, path: [...current.path, { row: nr, col: nc }] });
    }
  }

  return [];
}

// ======= ПОМОЩНИКИ =======
function distance(r1, c1, r2, c2) {
  return Math.sqrt((r1 - r2) ** 2 + (c1 - c2) ** 2);
}
