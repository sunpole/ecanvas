// scripts/tower-defence.js

import { GRID_SIZE, OUTLINE, GRID_TOTAL, SPAWN_CELLS, EXIT_CELLS } from './game-grid.js';

const DEBUG = true;
const TICK_RATE = 200;              // интервал игрового цикла, мс
const ENEMY_HP = 30;
const BULLET_SPEED = 4;             // скорость пули в пикселях за тик
const TOWER_FIRE_RATE = 1000;       // время перезарядки башни, мс
const TOWER_RANGE = 3;
const TOWER_TYPES = [
  { name: "Башня", price: 40, range: TOWER_RANGE, damage: 10, color: "#5575FF" }
];

let canvas, ctx, CELL_SIZE;
let enemies = [], towers = [], bullets = [];
let money = 100, lives = 20, wave = 0, tick = 0;
let gameInterval = null, isRunning = false;
let shopVisible = false, lastShopMsg = "";
let isSpawningWave = false;         // объявлена глобально для спавна

// Логирование
function log(msg) { if (DEBUG) console.log(`[DEBUG] ${msg}`); }

// Инициализация
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

// Старт игры
function startGame() {
  if (isRunning) return;
  log("Старт игры");
  isRunning = true;
  wave = 0; tick = 0; lives = 20; money = 100;
  enemies = []; towers = []; bullets = [];
  nextWave();
  gameInterval = setInterval(gameLoop, TICK_RATE);
}

// Рестарт игры
function restartGame() {
  clearInterval(gameInterval);
  isRunning = false;
  startGame();
}

// Враг
class Enemy {
  constructor() {
    this.row = SPAWN_CELLS[0].row;
    this.col = SPAWN_CELLS[0].col;
    this.x = (this.col + OUTLINE) * CELL_SIZE + CELL_SIZE / 2;
    this.y = (this.row + OUTLINE) * CELL_SIZE + CELL_SIZE / 2;
    this.hp = ENEMY_HP;
    this.maxHp = ENEMY_HP;
    this.path = findPathAstar({ row: this.row, col: this.col }, EXIT_CELLS[0], towers);
    this.pathIdx = 0;
    this.speed = 1.5; // скорость врага в пикселях за тик
    this.targetPos = null; // следующая точка движения в пикселях
    if (this.path && this.path.length > 0) {
      this.setNextTarget();
    }
    log(`Создан враг # row=${this.row}, col=${this.col}, path len=${this.path?.length || 0}`);
  }

  setNextTarget() {
    if (this.pathIdx >= this.path.length) {
      this.targetPos = null;
      return;
    }
    const c = this.path[this.pathIdx];
    this.targetPos = {
      x: (c.col + OUTLINE) * CELL_SIZE + CELL_SIZE / 2,
      y: (c.row + OUTLINE) * CELL_SIZE + CELL_SIZE / 2,
      row: c.row,
      col: c.col
    };
  }

  update() {
    if (this.hp <= 0) return;

    if (!this.targetPos) {
      // Враг дошел до конца пути
      lives--;
      this.hp = 0;
      log(`Враг дошёл до выхода, lives=${lives}`);
      return;
    }

    // Движение к targetPos
    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed) {
      // Достигли текущей точки пути — переход к следующей
      this.x = this.targetPos.x;
      this.y = this.targetPos.y;
      this.row = this.targetPos.row;
      this.col = this.targetPos.col;
      this.pathIdx++;
      this.setNextTarget();
    } else {
      // Двигаемся по направлению
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    if (this.hp <= 0) return;
    ctx.font = `${CELL_SIZE * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("😈", this.x, this.y);
    // HP bar
    ctx.fillStyle = '#e83438';
    const w = CELL_SIZE * 0.42 * this.hp / this.maxHp;
    ctx.fillRect(this.x - CELL_SIZE * 0.21, this.y - CELL_SIZE * 0.43, w, CELL_SIZE * 0.07);
  }
}

// Башня
class Tower {
  constructor(row, col, typeIdx = 0) {
    this.row = row;
    this.col = col;
    this.type = TOWER_TYPES[typeIdx];
    this.range = this.type.range;
    this.damage = this.type.damage;
    this.cooldown = 0;
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    const pos = cellToPos(this);
    let nearest = null, minD = Infinity;
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dx = e.x - pos.x;
      const dy = e.y - pos.y;
      const d = Math.hypot(dx, dy);
      if (d <= this.range * CELL_SIZE && d < minD) {
        nearest = e;
        minD = d;
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
    ctx.fillStyle = this.type.color;
    ctx.font = `${CELL_SIZE * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("🛡️", pos.x, pos.y);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * CELL_SIZE, 0, 2 * Math.PI);
    ctx.strokeStyle = "#5092ff70";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 9]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Пуля
class Bullet {
  constructor(sx, sy, target, dmg) {
    this.x = sx;
    this.y = sy;
    this.target = target;
    this.damage = dmg;
    this.speed = BULLET_SPEED;
  }

  update() {
    if (!this.target || this.target.hp <= 0) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.speed) {
      this.target.hp -= this.damage;
      log(`Пуля попала! HP врага теперь ${this.target.hp}`);
      return false;
    }
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
    return true;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }
}

// Волны
function nextWave() {
  wave++;
  log(`🌊 Волна ${wave} начинается`);
  spawnWaveEnemies(2 + wave * 2);
}

// Спавн врагов
function spawnWaveEnemies(n) {
  isSpawningWave = true;
  let count = 0;
  const t = setInterval(() => {
    if (count >= n) {
      clearInterval(t);
      isSpawningWave = false;
      return;
    }
    enemies.push(new Enemy());
    count++;
  }, 600);
}

// Игровой цикл
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
    isRunning = false;
    alert("Игра окончена! Нажмите F5 для новой игры.");
  }
}

// Отрисовка
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  window.GameGrid.drawGrid();
  towers.forEach(t => t.draw());
  bullets.forEach(b => b.draw());
  enemies.forEach(e => e.draw());
  renderStats();
}

// Отображение статистики
function renderStats() {
  let el = document.getElementById("td-stats");
  if (!el) {
    el = document.createElement("div");
    el.id = "td-stats";
    Object.assign(el.style, {
      position: "fixed", left: "20px", top: "20px",
      background: "#333", color: "#fff", padding: "8px", borderRadius: "4px",
      fontFamily: "Arial, sans-serif", fontSize: "16px", zIndex: 999
    });
    document.body.append(el);
  }
  el.innerHTML = `💔 ${lives} | 💵 ${money} | 🌊 ${wave}`;
}

// Магазин башен
function showShop(cell, x, y, msg = "") {
  if (!canPlace(cell)) {
    lastShopMsg = "Нельзя";
    return;
  }
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
  shop.style.display = "block";
  shop.innerHTML = `<b>💰 ${money}</b> ${msg}<br>`;
  TOWER_TYPES.forEach((t, i) => {
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

// Проверка, можно ли поставить башню
function canPlace(cell) {
  if (towers.some(t => t.row === cell.row && t.col === cell.col)) return false;
  const blocks = [...towers, cell].map(c => `${c.row}_${c.col}`);
  const ok = isPathAvailable(blocks);
  if (!ok) log("BFS blocked — путь заблокирован");
  return ok;
}

// Добавление башни
function addTower(cell, idx) {
  const type = TOWER_TYPES[idx];
  if (money < type.price) return;
  towers.push(new Tower(cell.row, cell.col, idx));
  money -= type.price;
  log(`Установлена башня на ${cell.row},${cell.col}, 💰=${money}`);
}

// Поиск соседей клетки (для поиска пути)
function neighbors(c) {
  return [
    { row: c.row + 1, col: c.col },
    { row: c.row - 1, col: c.col },
    { row: c.row, col: c.col + 1 },
    { row: c.row, col: c.col - 1 }
  ].filter(n =>
    n.row >= 0 && n.row < GRID_SIZE &&
    n.col >= 0 && n.col < GRID_SIZE
  );
}

// Проверка доступности пути (BFS)
function isPathAvailable(blockedKeys) {
  const blocked = new Set(blockedKeys);
  const queue = [SPAWN_CELLS[0]];
  const visited = new Set([`${SPAWN_CELLS[0].row}_${SPAWN_CELLS[0].col}`]);
  while (queue.length) {
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

// Поиск пути A* (используется для врагов)
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
        path.unshift(cameFrom[k]);
        k = key(cameFrom[k]);
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
        cameFrom[k] = curr;
        if (!open.some(o => key(o) === k)) open.push(n);
      }
    }
  }
  return [];
}

// Эвристика Манхэттен для A*
function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// Помощь: функция для получения соседних клеток, учитывая границы и проходимость
function getNeighbors(node, grid) {
  const neighbors = [];
  const directions = [
    { dr: -1, dc: 0 }, // вверх
    { dr: 1, dc: 0 },  // вниз
    { dr: 0, dc: -1 }, // влево
    { dr: 0, dc: 1 },  // вправо
  ];

  for (const dir of directions) {
    const newRow = node.row + dir.dr;
    const newCol = node.col + dir.dc;

    if (
      newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length &&
      !grid[newRow][newCol].blocked // например, blocked - признак занятости клетки
    ) {
      neighbors.push(grid[newRow][newCol]);
    }
  }

  return neighbors;
}

// Основная функция поиска пути A* (возвращает массив клеток пути или пустой массив, если путь не найден)
function aStar(start, goal, grid) {
  // Открытый список (клетки для проверки)
  const openSet = [];
  openSet.push(start);

  // Карта для отслеживания откуда мы пришли
  const cameFrom = new Map();

  // gScore — стоимость пути от start до текущей клетки
  const gScore = new Map();
  gScore.set(start, 0);

  // fScore — предполагаемая общая стоимость от start через текущую клетку до goal
  const fScore = new Map();
  fScore.set(start, heuristic(start, goal));

  // Вспомогательная функция для получения ключа из клетки (если объекты не поддерживают сравнение)
  function nodeKey(node) {
    return `${node.row},${node.col}`;
  }

  while (openSet.length > 0) {
    // Клетка с минимальным fScore
    let current = openSet.reduce((a, b) => {
      return (fScore.get(a) || Infinity) < (fScore.get(b) || Infinity) ? a : b;
    });

    if (current === goal) {
      // Собираем путь
      const path = [];
      let temp = current;
      while (temp) {
        path.push(temp);
        temp = cameFrom.get(temp);
      }
      path.reverse();
      return path;
    }

    // Удаляем current из openSet
    openSet.splice(openSet.indexOf(current), 1);

    // Получаем соседей
    const neighbors = getNeighbors(current, grid);
    for (const neighbor of neighbors) {
      const tentativeG = (gScore.get(current) || Infinity) + 1; // +1 — стоимость перехода между соседними клетками

      if (tentativeG < (gScore.get(neighbor) || Infinity)) {
        // Запомнить этот лучший путь
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor, goal));

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // Путь не найден
  return [];
}
