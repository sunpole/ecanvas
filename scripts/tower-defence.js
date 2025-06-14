// /scripts/tower-defence.js

// Получаем доступ к функции и объектам поля из game-grid.js
const {
  canvas, ctx, getColors, GRID_SIZE, GRID_TOTAL, OUTLINE,
  drawGrid, getCellByCoords, SPAWN_CELLS, EXIT_CELLS
} = window.GameGrid || {};

// --- переменные игры
let enemies = [];
let towers = [];
let money = 100;
let selectedTowerType = 0;
let bullets = [];
const TOWER_TYPES = [
  { name: "Башня", price: 40, range: 2.2, damage: 10, color: "#5575FF" }
];

// == Магазин башен ==
let shopVisible = false;
let shopCell = null;

function showShop(cell, pageX, pageY) {
  shopVisible = true;
  shopCell = cell;
  let shop = document.getElementById('shop');
  if (!shop) {
    shop = document.createElement('div');
    shop.id = "shop";
    document.body.appendChild(shop);
  }
  shop.style.display = "block";
  shop.style.position = "fixed";
  shop.style.left = (pageX || window.innerWidth/2) + "px";
  shop.style.top = (pageY || window.innerHeight/2) + "px";
  shop.style.zIndex = 2000;
  shop.style.background = "#222";
  shop.style.padding = "12px";
  shop.style.borderRadius = "8px";
  shop.innerHTML = `<b>💰 ${money}</b><br>`;
  TOWER_TYPES.forEach((type, id) => {
    const btn = document.createElement('button');
    btn.textContent = `${type.name} (${type.price})`;
    btn.style.margin = "6px";
    btn.disabled = money < type.price;
    btn.onclick = () => {
      addTower(cell, id);
      shop.style.display = "none";
      shopVisible = false;
    };
    shop.appendChild(btn);
  });
}
function hideShop() {
  let shop = document.getElementById('shop');
  if (shop) shop.style.display = "none";
  shopVisible = false;
  shopCell = null;
}

// Запрет на блокировку пути врагам
function canPlaceTower(cell) {
  if (!cell) return false;
  // Запрещаем ставить на крайние колонки (пути входа/выхода)
  if (cell.col === 0 || cell.col === GRID_SIZE-1) return false;
  // Запрещаем ставить на клетку где уже стоит башня
  if (towers.find(t=>t.row===cell.row && t.col===cell.col)) return false;
  // Запрещаем ставить на клетку если там сейчас враг
  if (enemies.some(e => Math.floor(e.row)===cell.row && Math.floor(e.col)===cell.col)) return false;
  return true;
}

function addTower(cell, id) {
  if (canPlaceTower(cell) && money >= TOWER_TYPES[id].price) {
    towers.push({ ...cell, ...TOWER_TYPES[id] });
    money -= TOWER_TYPES[id].price;
  }
}

// Событие клика по полю
canvas.addEventListener("click", function(evt){
  const cell = getCellByCoords(evt);
  if (!cell) return;
  // Открываем магазин по клику на пустую клетку
  if (canPlaceTower(cell)) {
    showShop(cell, evt.clientX, evt.clientY);
  }
});

// Прячем магазин если клик вне него
document.addEventListener("click", function(evt){
  let shop = document.getElementById('shop');
  if (shopVisible && shop && !shop.contains(evt.target)) {
    hideShop();
  }
}, true);

// == Враг ==
class Enemy {
  constructor() {
    const spawn = SPAWN_CELLS[0];
    this.row = spawn.row;
    this.col = spawn.col;
    this.hp = 35;
    this.speed = 0.03;
    this.progress = 0;
  }
  update() {
    // Двигается вправо к выходу (по прямой)
    this.progress += this.speed;
    this.col = SPAWN_CELLS[0].col + this.progress;
  }
  isOut() {
    return this.col >= GRID_SIZE;
  }
  draw() {
    const {x, y, cellSize} = cellToPos({row: this.row, col: this.col});
    ctx.save();
    ctx.font = (cellSize*0.9) + "px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("😈", x, y);
    ctx.restore();
    // HP бар
    ctx.fillStyle = "#e83438";
    ctx.fillRect(x-cellSize*0.21, y-cellSize*0.43, cellSize*0.42*Math.max(0,this.hp/35), cellSize*0.07);
  }
}

// == Расчёт центра клетки для отрисовки ==
function cellToPos(cell) {
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_TOTAL;
  return {
    x: (cell.col + OUTLINE) * cellSize + cellSize / 2,
    y: (cell.row + OUTLINE) * cellSize + cellSize / 2,
    cellSize
  };
}

// == Башня ==
function drawTowers() {
  towers.forEach(tower => {
    const {x, y, cellSize} = cellToPos(tower);
    ctx.save();
    ctx.font = (cellSize*0.9) + "px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🛡️", x, y);
    ctx.restore();
    // Радиус атаки
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, tower.range*cellSize, 0, Math.PI*2);
    ctx.strokeStyle = "#5092ff80"; ctx.lineWidth = 2;
    ctx.setLineDash([5, 9]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });
}

// == Пульки ==
function drawBullets() {
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI*2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  });
}

function updateBullets() {
  bullets.forEach((b,i)=>{
    b.x += b.dx; b.y += b.dy;
    // Если долетела до цели - удаляем
    if (Math.abs(b.x-b.tx)<8 && Math.abs(b.y-b.ty)<8) bullets.splice(i,1);
  });
}

// == Атака башен ==
function shoot() {
  towers.forEach(tower => {
    // Найти ближайшего врага
    let nearest = null, nearestDist = 999;
    enemies.forEach(enemy => {
      let dr = enemy.row - tower.row, dc = enemy.col - tower.col;
      let dist = Math.sqrt(dr*dr + dc*dc);
      if (dist <= tower.range && dist < nearestDist && enemy.hp > 0) {
        nearest = enemy; nearestDist = dist;
      }
    });
    tower.cooldown = tower.cooldown || 0;
    if (nearest && tower.cooldown <= 0) {
      nearest.hp -= tower.damage;
      tower.cooldown = 35;
      // Пулька визуально летит
      const from = cellToPos(tower), to = cellToPos(nearest);
      bullets.push({
        x: from.x, y: from.y, tx: to.x, ty: to.y,
        dx: (to.x - from.x)/20, dy: (to.y - from.y)/20
      });
    }
    if (tower.cooldown > 0) tower.cooldown--;
  });
}

// == Генерация врагов каждую секунду ==
function spawnEnemy() {
  enemies.push(new Enemy());
}
setInterval(spawnEnemy, 2500); // раз в 2.5 сек.

function gameRender() {
  drawGrid();
  drawTowers();
  drawBullets();
  enemies.forEach(e => e.draw());
}

function gameUpdate() {
  enemies = enemies.filter(e => e.hp > 0 && !e.isOut());
  enemies.forEach(e => e.update());
  updateBullets();
  shoot();
}

function gameLoop() {
  gameUpdate();
  gameRender();
  requestAnimationFrame(gameLoop);
}
gameLoop();
