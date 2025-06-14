// Получаем всё нужное из game-grid.js через window.GameGrid!
const {
  canvas, ctx, getColors, GRID_SIZE, GRID_TOTAL, OUTLINE,
  drawGrid, getCellByCoords, SPAWN_CELLS, EXIT_CELLS
} = window.GameGrid;

// --- Игровые переменные
let enemies = [];
let towers = [];
let bullets = [];
let money = 100;
const TOWER_TYPES = [
  { name: "Башня", price: 40, range: 2.2, damage: 10, color: "#5575FF" }
];

// == МАГАЗИН ==
let shopVisible = false;
let shopCell = null;

function showShop(cell, pageX = window.innerWidth/2, pageY = window.innerHeight/2) {
  if (!canPlaceTower(cell)) return;
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
  shop.style.left = pageX + "px";
  shop.style.top = pageY + "px";
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

function canPlaceTower(cell) {
  if (!cell) return false;
  // нельзя на крайние колонки (где враг входит/выходит)
  if (cell.col === 0 || cell.col === GRID_SIZE-1) return false;
  // нельзя туда, где уже башня
  if (towers.find(t=>t.row===cell.row && t.col===cell.col)) return false;
  // нельзя туда, где враг
  if (enemies.some(e => Math.floor(e.row) === cell.row && Math.floor(e.col) === cell.col)) return false;
  return true;
}

function addTower(cell, id) {
  if (canPlaceTower(cell) && money >= TOWER_TYPES[id].price) {
    towers.push({ ...cell, ...TOWER_TYPES[id] });
    money -= TOWER_TYPES[id].price;
  }
}

// == ОБРАБОТКА КЛИКОВ ======
canvas.addEventListener("click", function(evt){
  const cell = getCellByCoords(evt);
  if (!cell) return;
  if (canPlaceTower(cell)) {
    showShop(cell, evt.clientX, evt.clientY);
  }
});
document.addEventListener("click", function(evt){
  let shop = document.getElementById('shop');
  if (shopVisible && shop && !shop.contains(evt.target)) {
    hideShop();
  }
}, true);

// == Класс врага ==
class Enemy {
  constructor() {
    const spawn = SPAWN_CELLS[0];
    this.row = spawn.row;
    this.col = spawn.col;
    this.hp = 35;
    this.speed = 0.03;
    this.progress = 0;
    this.targetCol = EXIT_CELLS[0].col;
  }
  update() {
    // Идёт по прямой "вправо" — если путь другой, доработай по логике!
    this.progress += this.speed;
    this.col = SPAWN_CELLS[0].col + this.progress;
  }
  isOut() {
    // Ушел за край
    return this.col >= GRID_SIZE;
  }
  draw() {
    const {x, y, cellSize} = cellToPos({row: this.row, col: this.col});
    ctx.save();
    ctx.font = (cellSize*0.85) + "px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("😈", x, y);
    ctx.restore();
    // HP бар
    ctx.fillStyle = "#e83438";
    ctx.fillRect(x-cellSize*0.21, y-cellSize*0.43, cellSize*0.42*Math.max(0,this.hp/35), cellSize*0.07);
  }
}

// == Перевод клетки в центр пикселей ==
function cellToPos(cell) {
  const size = canvas.width;
  const cellSize = size / GRID_TOTAL;
  return {
    x: (cell.col + OUTLINE) * cellSize + cellSize / 2,
    y: (cell.row + OUTLINE) * cellSize + cellSize / 2,
    cellSize
  };
}

function drawTowers() {
  towers.forEach(tower => {
    const {x, y, cellSize} = cellToPos(tower);
    ctx.save();
    ctx.font = (cellSize*0.8) + "px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🛡️", x, y);
    ctx.restore();
    // Радиус атаки
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, tower.range*cellSize, 0, Math.PI*2);
    ctx.strokeStyle = "#5092ff60"; ctx.lineWidth = 2;
    ctx.setLineDash([4, 9]);
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
  for (let i=bullets.length-1; i>=0; --i) {
    let b=bullets[i];
    b.x += b.dx; b.y += b.dy;
    if (Math.abs(b.x-b.tx)<8 && Math.abs(b.y-b.ty)<8) bullets.splice(i,1);
  }
}

// == Стрельба башен ==
function shoot() {
  towers.forEach(tower => {
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
      const from = cellToPos(tower), to = cellToPos(nearest);
      bullets.push({
        x: from.x, y: from.y, tx: to.x, ty: to.y,
        dx: (to.x-from.x)/18, dy: (to.y-from.y)/18
      });
    }
    if (tower.cooldown > 0) tower.cooldown--;
  });
}

// == Спавн врагов ==
function spawnEnemy() { enemies.push(new Enemy()); }
setInterval(spawnEnemy, 2500);

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
