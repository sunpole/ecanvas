// scripts/tower-defence.js

// 🎯 Подключаем game-grid: canvas, drawGrid(), getCellByCoords(), размеры и координаты
import { GRID_SIZE, OUTLINE, GRID_TOTAL, SPAWN_CELLS, EXIT_CELLS } from './game-grid.js';

const DEBUG = true;
const TICK_RATE = 200;
const ENEMY_HP = 30;
const BULLET_SPEED = 0.2;
const TOWER_FIRE_RATE = 1000;
const TOWER_RANGE = 3;
const TOWER_TYPES = [{ name: "Башня", price: 40, range: TOWER_RANGE, damage: 10, color: "#5575FF" }];

let canvas, ctx, CELL_SIZE;
let enemies = [], towers = [], bullets = [];
let money = 100, lives = 20, wave = 0, tick = 0;
let gameInterval = null, isRunning = false;
let shopVisible = false, lastShopMsg = "";

// 🛠 Логирование
function log(msg) { if (DEBUG) console.log(`[DEBUG] ${msg}`); }

// 🚀 Инициализация
window.addEventListener('load', () => {
  console.clear();
  canvas = window.GameGrid.canvas;
  ctx = window.GameGrid.ctx;
  CELL_SIZE = canvas.width / GRID_TOTAL;
  log("Инициализация завершена");

  setupUI();
  startGame();
});

function setupUI() {
  document.addEventListener('keydown', e => {
    if (e.code === 'F4') {
      log("Нажат F4 — рестарт");
      restartGame();
    } else if (e.code === 'F5') {
      log("Нажат F5 — старт");
      startGame();
    }
  });
  canvas.addEventListener('click', evt => {
    const cell = window.GameGrid.getCellByCoords(evt);
    if (!cell) return;
    showShop(cell, evt.clientX, evt.clientY, lastShopMsg);
  });
  document.addEventListener('click', evt => {
    if (shopVisible) {
      const shop = document.getElementById('shop');
      if (shop && !shop.contains(evt.target)) hideShop();
    }
  }, true);
}

// 🎮 Start / Restart
function startGame() {
  if (isRunning) return;
  log("Старт игры");
  isRunning = true;
  wave = 0; tick = 0; lives = 20; money = 100;
  enemies = []; towers = []; bullets = [];
  nextWave();
  gameInterval = setInterval(gameLoop, TICK_RATE);
}

function restartGame() {
  clearInterval(gameInterval);
  isRunning = false;
  startGame();
}

// 🧟‍♂️ Враг
class Enemy {
  constructor() {
    this.row = SPAWN_CELLS[0].row;
    this.col = SPAWN_CELLS[0].col;
    this.hp = ENEMY_HP;
    this.maxHp = ENEMY_HP;
    this.path = findPathAstar({ row: this.row, col: this.col }, EXIT_CELLS[0], towers);
    this.pathIdx = 0;
    log(`Создан враг # row=${this.row}, col=${this.col}, path len=${this.path?.length || 0}`);
  }

  update() {
    if (!this.path || this.pathIdx >= this.path.length) {
      lives--;
      this.hp = 0;
      log("Враг дошёл до выхода, lives=", lives);
      return;
    }
    const next = this.path[this.pathIdx++];
    this.row = next.row;
    this.col = next.col;
    if (this.hp <= 0) return;
  }

  draw() {
    if (this.hp <= 0) return;
    const pos = cellToPos(this);
    const cs = pos.cellSize;
    ctx.font = `${cs * 0.8}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText("😈", pos.x, pos.y);
    // HP bar
    ctx.fillStyle = '#e83438';
    const w = cs * 0.42 * this.hp / this.maxHp;
    ctx.fillRect(pos.x - cs * 0.21, pos.y - cs * 0.43, w, cs * 0.07);
  }
}

// 🏰 Башня
class Tower {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.range = this.col; // will pick right type price etc
    this.damage = TOWER_TYPES[0].damage;
    this.cooldown = 0;
  }

  update() {
    if (this.cooldown > 0) { this.cooldown--; return; }
    const pos = cellToPos(this);
    let nearest = null, minD = Infinity;
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dx = e.x - pos.x, dy = e.y - pos.y;
      const d = Math.hypot(dx, dy);
      if (d < this.range * pos.cellSize && d < minD) {
        nearest = e; minD = d;
      }
    });
    if (nearest) {
      this.cooldown = Math.floor(TOWER_FIRE_RATE / TICK_RATE);
      bullets.push(new Bullet(pos.x, pos.y, nearest, this.damage));
      log(`Башня стреляет по врагу #${nearest.row},${nearest.col}`);
    }
  }

  draw() {
    const pos = cellToPos(this);
    const cs = pos.cellSize;
    ctx.fillText("🛡️", pos.x, pos.y);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * cs, 0, 2 * Math.PI);
    ctx.strokeStyle = "#5092ff70"; ctx.lineWidth = 2;
    ctx.setLineDash([4,9]); ctx.stroke(); ctx.setLineDash([]);
  }
}

// 💥 Пуля
class Bullet {
  constructor(sx, sy, target, dmg) {
    this.x = sx; this.y = sy;
    this.target = target;
    this.damage = dmg;
  }

  update() {
    if (!this.target || this.target.hp <= 0) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) {
      this.target.hp -= this.damage;
      log(`Пуля попала! HP врага теперь ${this.target.hp}`);
      return false;
    }
    this.x += dx/dist * BULLET_SPEED;
    this.y += dy/dist * BULLET_SPEED;
    return true;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff"; ctx.fill();
  }
}

// 🎲 Волны
function nextWave() {
  wave++;
  log(`🌊 Волна ${wave} начинается`);
  spawnWaveEnemies(2 + wave * 2);
}

// 👾 Спавн
function spawnWaveEnemies(n) {
  isSpawningWave = true;
  let count = 0;
  const t = setInterval(() => {
    if (count >= n) { clearInterval(t); isSpawningWave = false; return; }
    enemies.push(new Enemy());
    count++;
  }, 600);
}

// 🔁 Цикл
function gameLoop() {
  tick++;
  enemies.forEach(e => e.update());
  towers.forEach(t => t.update());
  bullets = bullets.filter(b => b.update());
  enemies = enemies.filter(e => e.hp > 0);

  if (!enemies.length && !isSpawningWave) nextWave();

  render();
  if (lives <= 0) {
    log("Игра окончена");
    clearInterval(gameInterval);
  }
}

// 🎨 Отрисовка
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  window.GameGrid.drawGrid();
  towers.forEach(t => t.draw());
  bullets.forEach(b => b.draw());
  enemies.forEach(e => e.draw());
  renderStats();
}

// 📶 UI Stats
function renderStats() {
  let el = document.getElementById("td-stats");
  if (!el) {
    el = document.createElement("div");
    el.id = "td-stats";
    Object.assign(el.style, {
      position: "fixed", left: "20px", top: "20px",
      background: "#333", color: "#fff", padding: "8px", borderRadius: "4px"
    });
    document.body.append(el);
  }
  el.innerHTML = `💔 ${lives} | 💵 ${money} | 🌊 ${wave}`;
}

// ⚙ Магазин
function showShop(cell, x, y, msg="") {
  if (!canPlace(cell)) { lastShopMsg="Нельзя"; return; }
  shopVisible = true;
  let shop = document.getElementById("shop");
  if (!shop) {
    shop = document.createElement("div");
    shop.id = "shop";
    Object.assign(shop.style, {
      position: "fixed", background: "#222", color: "#fff",
      padding: "8px", borderRadius: "6px", zIndex: 999
    });
    document.body.append(shop);
  }
  shop.style.left = x + "px";
  shop.style.top = y + "px";
  shop.innerHTML = `<b>💰 ${money}</b> ${msg}<br>`;
  TOWER_TYPES.forEach((t,i) => {
    const btn = document.createElement("button");
    btn.textContent = `${t.name} (${t.price})`;
    btn.disabled = money < t.price;
    btn.onclick = () => {
      addTower(cell, i);
      hideShop();
    };
    shop.appendChild(btn);
  });
}

function hideShop() {
  shopVisible = false;
  const shop = document.getElementById("shop");
  if (shop) shop.style.display = "none";
}

function canPlace(cell) {
  if (towers.some(t => t.row === cell.row && t.col === cell.col)) return false;
  const blocks = [...towers, cell].map(c => `${c.row}_${c.col}`);
  const ok = isPathAvailable(blocks);
  if (!ok) log("BFS blocked");
  return ok;
}

function addTower(cell, idx) {
  const type = TOWER_TYPES[idx];
  if (money < type.price) return;
  towers.push(new Tower(cell.row, cell.col));
  money -= type.price;
  log(`Установлена башня на ${cell.row},${cell.col}, 💰=${money}`);
}

// 📍 Pathfinding
function neighbors(c) {
  return [
    { row: c.row+1, col: c.col }, { row: c.row-1, col: c.col },
    { row: c.row, col: c.col+1 }, { row: c.row, col: c.col-1 }
  ].filter(n => (
    n.row >= 0 && n.row < GRID_SIZE &&
    n.col >= 0 && n.col < GRID_SIZE
  ));
}

function isPathAvailable(blockedKeys) {
  const blocked = new Set(blockedKeys);
  const queue = [SPAWN_CELLS[0]];
  const visited = new Set([ `${SPAWN_CELLS[0].row}_${SPAWN_CELLS[0].col}` ]);
  while(queue.length) {
    const c = queue.shift();
    if (c.row === EXIT_CELLS[0].row && c.col === EXIT_CELLS[0].col) return true;
    for (const n of neighbors(c)) {
      const k = `${n.row}_${n.col}`;
      if (!blocked.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push(n);
      }
    }
  }
  return false;
}

function findPathAstar(start, end, towersList) {
  const blocks = new Set(towersList.map(t => `${t.row}_${t.col}`));
  const open = [];
  const scores = new Map();
  scores.set(`${start.row}_${start.col}`, { g: 0, f: heuristic(start, end) });
  open.push(start);

  const cameFrom = {};
  const key = c => `${c.row}_${c.col}`;

  while (open.length) {
    open.sort((a, b) => scores.get(key(a)).f - scores.get(key(b)).f);
    const curr = open.shift();
    if (curr.row === end.row && curr.col === end.col) {
      const path = [];
      let k = key(end);
      while (k in cameFrom) {
        const c = cameFrom[k];
        path.unshift(c);
        k = key(c);
      }
      return path;
    }
    for (const n of neighbors(curr)) {
      const k = key(n);
      if (blocks.has(k)) continue;
      const g = scores.get(key(curr)).g + 1;
      const f = g + heuristic(n, end);
      if (!scores.has(k) || g < scores.get(k).g) {
        scores.set(k, { g, f });
        cameFrom[k] = { row: n.row, col: n.col };
        if (!open.some(o => key(o) === k)) open.push(n);
      }
    }
  }
  return [];
}

function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ✅ Помощники
function cellToPos(c) {
  const cs = canvas.width / GRID_TOTAL;
  const x = (c.col + OUTLINE) * cs + cs / 2;
  const y = (c.row + OUTLINE) * cs + cs / 2;
  return { x, y, cellSize: cs };
}
