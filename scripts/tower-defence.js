// --- ПОДКЛЮЧЕНИЯ И ДЕБАГ ---
console.log("[TD] Загружается файлы Tower Defence...");

let grid = window.GameGrid;
if (!grid) { console.error("[TD] Не найден window.GameGrid! Проверь подключение game-grid.js!"); }

// Проверяем зависимости
["canvas","ctx","GRID_SIZE","drawGrid","getCellByCoords","SPAWN_CELLS","EXIT_CELLS"].forEach(key => {
  if (!grid[key]) throw new Error("[TD] Нет ключа "+key+" в window.GameGrid!");
});
console.log("[TD] Компоненты сетки подключены, начинаем игру...");

// --- КОНСТАНТЫ ---
const TOWER_TYPES = [
  { name: "Башня", price: 40, range: 2.2, damage: 10, color: "#5575FF" }
];

// --- ГЛОБАЛЬНЫЕ ДАННЫЕ ---
let enemies = [];
let towers = [];
let bullets = [];
let money = 100;
let wave = 0;
let lives = 20;
let shopVisible = false;
let shopCell = null;
let isSpawningWave = false;
let enemyIdGen = 1;
let PATH = [];
let lastShopMsg = "";

// ========== ПОИСК ПУТИ BFS (для проверки: можно ли поставить башню) ==========
function neighbors(cell) {
  return [
    {row:cell.row+1, col:cell.col},
    {row:cell.row-1, col:cell.col},
    {row:cell.row, col:cell.col+1},
    {row:cell.row, col:cell.col-1}
  ].filter(n => n.row>=0 && n.row<grid.GRID_SIZE && n.col>=0 && n.col<grid.GRID_SIZE);
}

// Возвращает true если можно дойти из SPAWN к EXIT
function isPathAvailable(testTowers=[]) {
  let blocks = new Set(testTowers.map(t => `${t.row}_${t.col}`));
  let queue = [grid.SPAWN_CELLS[0]];
  let visited = new Set([`${queue[0].row}_${queue[0].col}`]);

  while(queue.length) {
    let curr = queue.shift();
    if (curr.row===grid.EXIT_CELLS[0].row && curr.col===grid.EXIT_CELLS[0].col) return true;
    for(let n of neighbors(curr)){
      let key = `${n.row}_${n.col}`;
      if (!visited.has(key) && !blocks.has(key)) {
        visited.add(key);
        queue.push(n);
      }
    }
  }
  return false;
}

// ================== A* ДЛЯ ВРАГА ====================
function heuristic(a, b) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col); }

function findPathAstar(start, end, testTowers=towers) {
  let blocks = new Set(testTowers.map(t => `${t.row}_${t.col}`));
  let openSet = [start];
  let cameFrom = {};
  let gScore = {};
  let fScore = {};
  let key = (c) => `${c.row}_${c.col}`;

  gScore[key(start)] = 0;
  fScore[key(start)] = heuristic(start, end);

  while(openSet.length) {
    openSet.sort((a,b) => (fScore[key(a)]||Infinity)-(fScore[key(b)]||Infinity));
    let curr = openSet.shift();
    if (curr.row===end.row && curr.col===end.col) {
      // Восстановление пути
      let path = [end];
      while(key(path[0]) !== key(start)) path.unshift(cameFrom[key(path[0])]);
      return path;
    }
    for(let n of neighbors(curr)){
      let nkey = key(n);
      if (blocks.has(nkey)) continue;
      let tentativeG = (gScore[key(curr)]||Infinity) + 1;
      if (tentativeG < (gScore[nkey]||Infinity)) {
        cameFrom[nkey] = curr;
        gScore[nkey] = tentativeG;
        fScore[nkey] = tentativeG + heuristic(n, end);
        if (!openSet.some(c=>key(c)===nkey)) openSet.push(n);
      }
    }
  }
  return null; // Нет пути
}

// ============== МАГАЗИН ===========
function showShop(cell, pageX = window.innerWidth/2, pageY = window.innerHeight/2, msg="") {
  if (!canPlaceTower(cell)) { 
    console.info("[TD] Магазин НЕ выводится: нельзя ставить башню на эту клетку!", cell);
    return; 
  }
  shopVisible = true; shopCell = cell;
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
  shop.style.color = "#fff";
  shop.style.padding = "12px";
  shop.style.borderRadius = "8px";
  shop.style.minWidth = "120px";
  shop.innerHTML = `<b>💰 ${money}</b> <small>Жизни: ${lives}</small><hr>`;
  if (msg) shop.innerHTML += `<div style="color:orange">${msg}</div>`;
  TOWER_TYPES.forEach((type, id) => {
    const btn = document.createElement('button');
    btn.textContent = `${type.name} (${type.price})`;
    btn.style.margin = "6px";
    btn.disabled = money < type.price;
    btn.onclick = () => {
      if (!canPlaceTower(cell, id, true)) {
        showShop(cell, pageX, pageY, "Эти координаты блокируют путь!");
        lastShopMsg = "Путь блокируется!";
        return;
      }
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

// ============== ПРОВЕРКА ВОЗМОЖНОСТИ СТАВИТЬ БАШНЮ ==========
function canPlaceTower(cell, id=0, checkBlock=true) {
  if (!cell) return false;
  if (cell.col === 0 || cell.col === grid.GRID_SIZE-1) return false; // вход/выход
  if (towers.some(t=>t.row===cell.row && t.col===cell.col)) return false;
  if (enemies.some(e => Math.floor(e.row) === cell.row && Math.floor(e.col) === cell.col)) return false;
  if (checkBlock) {
    let testTowers = [...towers, {...cell,...TOWER_TYPES[id]}];
    let ok = isPathAvailable(testTowers);
    if (!ok) { console.warn("[TD] Эта башня заблокирует путь! Запрет."); }
    return ok;
  }
  return true;
}

function addTower(cell, id) {
  if (canPlaceTower(cell, id)) {
    towers.push({ ...cell, ...TOWER_TYPES[id] });
    money -= TOWER_TYPES[id].price;
    console.info("[TD] Добавлена башня:",cell,"Текущий баланс:",money);
  } else {
    lastShopMsg = "Сюда нельзя поставить башню!";
    console.warn("[TD] Сюда нельзя поставить башню", cell);
  }
}

// ============== СОБЫТИЯ МАГАЗИНА ===============
grid.canvas.addEventListener("click", function(evt){
  const cell = grid.getCellByCoords(evt);
  if (!cell) return;
  if (canPlaceTower(cell, 0)) {
    showShop(cell, evt.clientX, evt.clientY, lastShopMsg);
  }
});
document.addEventListener("click", function(evt){
  let shop = document.getElementById('shop');
  if (shopVisible && shop && !shop.contains(evt.target)) {
    hideShop();
  }
}, true);

// ============== КЛАСС ВРАГА (движение по A*) ================
class Enemy {
  constructor() {
    this.id = enemyIdGen++;
    const spawn = grid.SPAWN_CELLS[0];
    this.row = spawn.row;
    this.col = spawn.col;
    this.path = this.calcPath();
    if (!this.path) {
      console.error(`[TD] Враг #${this.id} не может найти путь! Башнями заблокировано всё?`);
      this.dead = true;
      return;
    }
    this.pathIdx = 0;
    this.hp = 30 + Math.floor(wave*3+Math.random()*2); // рост HP одним выражением
    this.maxHP = this.hp;
    this.speed = 2 + Math.random(); // в пикселях за кадр
    this.x = null; this.y = null;
    this.dead = false;
    this.gone = false;
    this.updatePos();
    console.info(`[TD] Создан враг #${this.id} HP:${this.hp} путь длина: ${this.path.length}`);
  }

  calcPath() {
    // путь из текущей позиции (или SPAWN) до EXIT через A*
    let path = findPathAstar(
      {row:this.row, col:this.col},
      grid.EXIT_CELLS[0]
    );
    return path;
  }

  updatePos() {
    let {x,y,cellSize} = cellToPos(this.path[this.pathIdx] || this);
    this.x = x; this.y = y;
    this.cellSize = cellSize;
  }

  update() {
    if (this.dead || this.gone) return;
    if (!this.path || this.path.length<2) { this.gone = true; lives--; return; } // нет пути
    let tgt = this.path[this.pathIdx+1];
    if (!tgt) { this.gone = true; lives--; console.info(`[TD] Враг #${this.id} дошёл до финиша! -1 жизнь (${lives})`); return; }
    let currPix = cellToPos(this.path[this.pathIdx]);
    let tgtPix = cellToPos(tgt);
    let dx = tgtPix.x-currPix.x, dy=tgtPix.y-currPix.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    let step = this.speed;
    if (dist < step) {
      this.pathIdx++;
      this.updatePos();
    } else {
      this.x += dx/dist*step;
      this.y += dy/dist*step;
    }
  }
  draw() {
    if (this.dead || this.gone) return;
    let {cellSize} = cellToPos({row:this.row, col:this.col});
    let scale = Math.max(0.5, this.hp/this.maxHP);
    grid.ctx.save();
    grid.ctx.font = (cellSize*0.8*scale) + "px serif";
    grid.ctx.textAlign = "center"; grid.ctx.textBaseline = "middle";
    grid.ctx.fillText("😈", this.x, this.y);
    // HP bar
    grid.ctx.fillStyle = "#e83438";
    grid.ctx.fillRect(this.x-cellSize*0.21, this.y-cellSize*0.43, cellSize*0.42*Math.max(0,this.hp/this.maxHP), cellSize*0.07);
    grid.ctx.restore();
  }
}

function cellToPos(cell) {
  const size = grid.canvas.width;
  const cellSize = size / grid.GRID_TOTAL;
  return {
    x: (cell.col + grid.OUTLINE) * cellSize + cellSize / 2,
    y: (cell.row + grid.OUTLINE) * cellSize + cellSize / 2,
    cellSize
  };
}

function drawTowers() {
  towers.forEach(tower => {
    const {x, y, cellSize} = cellToPos(tower);
    grid.ctx.save();
    grid.ctx.font = (cellSize*0.9) + "px serif";
    grid.ctx.textAlign = "center";
    grid.ctx.textBaseline = "middle";
    grid.ctx.fillText("🛡️", x, y);
    grid.ctx.restore();
    // Радиус атаки
    grid.ctx.save();
    grid.ctx.beginPath();
    grid.ctx.arc(x, y, tower.range*cellSize, 0, Math.PI*2);
    grid.ctx.strokeStyle = "#5092ff70"; grid.ctx.lineWidth = 2;
    grid.ctx.setLineDash([4, 9]);
    grid.ctx.stroke();
    grid.ctx.setLineDash([]);
    grid.ctx.restore();
  });
}

// ========== ПУЛИ ==========
function drawBullets() {
  bullets.forEach(b=>{
    grid.ctx.beginPath();
    grid.ctx.arc(b.x, b.y, 7, 0, Math.PI*2);
    grid.ctx.fillStyle = "#fff";
    grid.ctx.fill();
  });
}
function updateBullets() {
  for (let i=bullets.length-1; i>=0; --i) {
    let b=bullets[i];
    b.x += b.dx; b.y += b.dy;
    // Проверка попадания в врага
    if(b.target && !b.target.dead && !b.target.gone){
      let dist = Math.hypot(b.x-b.target.x, b.y-b.target.y);
      if (dist<15) {
        b.target.hp -= b.damage;
        if (b.target.hp <= 0) {
          b.target.dead = true;
          money += 15;
          console.info(`[TD] Враг #${b.target.id} убит! Деньги +15 (${money})`);
        }
        bullets.splice(i,1);
        continue;
      }
    }
    // иначе если bullet долетел до точки (резерв)
    if (Math.abs(b.x-b.tx)<8 && Math.abs(b.y-b.ty)<8) bullets.splice(i,1);
  }
}

// ========== СТРЕЛЬБА БАШЕН ==========
function shoot() {
  towers.forEach(tower => {
    let nearest = null, minDist = Infinity;
    enemies.forEach(enemy => {
      if (enemy.dead || enemy.gone) return;
      let d = Math.sqrt( (enemy.x-cellToPos(tower).x)**2 + (enemy.y-cellToPos(tower).y)**2 );
      if (d < tower.range*cellToPos(tower).cellSize && d < minDist) {
        nearest = enemy; minDist = d;
      }
    });
    tower.cooldown = tower.cooldown || 0;
    if (nearest && tower.cooldown<=0) {
      // ПУШКА СТРЕЛЯЕТ!
      tower.cooldown = 22;
      let from = cellToPos(tower), to = {x:nearest.x, y:nearest.y};
      bullets.push({
        x:from.x, y:from.y, tx:to.x, ty:to.y, dx:(to.x-from.x)/15, dy:(to.y-from.y)/15, target:nearest, damage:tower.damage
      });
      console.debug(`[TD] Башня стреляет по врагу #${nearest.id}`);
    }
    if (tower.cooldown > 0) tower.cooldown--;
  });
}

// ------------- Волны врагов -------------
function spawnWaveEnemies(n) {
  isSpawningWave = true;
  let count = 0;
  let timer = setInterval(() => {
    if (count>=n) { isSpawningWave=false; clearInterval(timer); return;}
    let enemy = new Enemy();
    if(!enemy.dead) enemies.push(enemy);
    count++;
  }, 600);
}

function nextWave() {
  wave += 1;
  setTimeout(()=>{spawnWaveEnemies(2+wave*2);}, 700);
  console.log(`[TD] Начинается волна #${wave} (${2+wave*2} крипов)`);
}

function allEnemiesDead() {
  return !enemies.some(e => !e.dead && !e.gone) && !isSpawningWave;
}

// ------------- Игровой рендер и луп -------------
function renderStats() {
  let el = document.getElementById("td-stats");
  if (!el) {
    el = document.createElement("div");
    el.id = "td-stats";
    el.style.position = "fixed";
    el.style.left = "24px";
    el.style.top = "18px";
    el.style.background = "#282828EE";
    el.style.color = "#fff";
    el.style.fontSize = "16px";
    el.style.borderRadius = "10px";
    el.style.padding = "10px 16px";
    el.style.zIndex = 999999;
    document.body.appendChild(el);
  }
  el.innerHTML = `💔 Жизни: ${lives} | 💵: ${money} | 🌊 Волна: ${wave}`;
}

function gameRender() {
  grid.drawGrid();
  drawTowers();
  drawBullets();
  enemies.forEach(e => e.draw());
  renderStats();
}

function gameUpdate() {
  enemies = enemies.filter(e => !(e.gone && e.dead)); // чистим умерших и дошедших до финиша
  enemies.forEach(e => e.update());
  updateBullets();
  shoot();
  if (allEnemiesDead() && lives>0 && !isSpawningWave) {
    setTimeout(nextWave, 950);
  }
  if (lives <= 0) {
    console.warn("[TD] Игра окончена! Все жизни потеряны на волне", wave);
    let el = document.getElementById("td-stats");
    if (el) el.innerHTML += "<hr>💀 <b>Игра окончена!</b>";
    cancelAnimationFrame(_tdRAF);
  }
}

let _tdRAF = null;
function gameLoop() {
  gameUpdate();
  gameRender();
  _tdRAF = requestAnimationFrame(gameLoop);
}

// ==== СТАРТ ИГРЫ ====
console.log("[TD] Запуск автостарта!");
nextWave();
gameLoop();
