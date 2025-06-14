//tower-defence.js

// Получаем доступ к API сетки
const {
  canvas,
  ctx,
  getColors,
  GRID_SIZE,
  GRID_TOTAL,
  OUTLINE,
  drawGrid,
  onCellClick,
  SPAWN_CELLS,
  EXIT_CELLS
} = window.GameGrid;

// Игровые сущности
let enemies = [];
let towers = [];
let money = 100;
let selectedTowerType = 0;

// Башни
const TOWER_TYPES = [
    { name: "Пушка", price: 50, range: 2.5, damage: 8, color: "#6ecbf8" },
    { name: "Огонь", price: 75, range: 3, damage: 5, color: "#f8663f" }
];

// Рыночная логика
function renderShop() {
    let shop = document.getElementById('shop');
    if (!shop) {
        shop = document.createElement('div');
        shop.id = "shop";
        document.body.insertBefore(shop, canvas);
    }
    shop.innerHTML = `<b>Деньги:</b> ${money}&nbsp;`;
    TOWER_TYPES.forEach((type, id) => {
        const btn = document.createElement('button');
        btn.textContent = `${type.name} (${type.price})`;
        btn.style.margin = "5px";
        btn.disabled = money < type.price;
        btn.onclick = () => selectedTowerType = id;
        shop.appendChild(btn);
    });
}
renderShop();

// Перевод клетки в координаты центра в px
function cellToPos(cell) {
    const size = parseFloat(canvas.style.width) || 300;
    const cellSize = size / GRID_TOTAL;
    return {
        x: (cell.col + OUTLINE) * cellSize + cellSize / 2,
        y: (cell.row + OUTLINE) * cellSize + cellSize / 2,
        cellSize
    };
}

// Враг
class Enemy {
    constructor() {
        const spawn = SPAWN_CELLS[Math.floor(Math.random() * SPAWN_CELLS.length)];
        this.row = spawn.row;
        this.col = spawn.col;
        this.hp = 30;
        this.speed = 0.012 + Math.random()*0.008;
        this.progress = 0;
    }
    update() {
        this.progress += this.speed;
        this.col = SPAWN_CELLS[0].col + this.progress;
    }
    isOut() {
        return this.col >= GRID_SIZE;
    }
    draw() {
        const { x, y, cellSize } = cellToPos({row: this.row, col: this.col});
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, cellSize*0.28, 0, Math.PI*2);
        ctx.fillStyle = this.hp > 0 ? "#43e140" : "#999";
        ctx.shadowBlur = 10; ctx.shadowColor = "#111";
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#e83438";
        ctx.fillRect(x-cellSize*0.2, y-cellSize*0.38, cellSize*0.4 * (this.hp/30), cellSize*0.09);
    }
}

// Враги появляются волнами
function spawnEnemy() {
    enemies.push(new Enemy());
}
setInterval(spawnEnemy, 2500);

// Башни
function drawTowers() {
    towers.forEach(tower => {
        const {x, y, cellSize} = cellToPos(tower);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, cellSize*0.33, 0, Math.PI*2);
        ctx.fillStyle = tower.color;
        ctx.shadowBlur = 8; ctx.shadowColor = "#111";
        ctx.fill();
        ctx.restore();
        // Радиус атаки (полупрозрачный круг)
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, tower.range*cellSize, 0, Math.PI*2);
        ctx.strokeStyle = "#888a"; ctx.lineWidth = 2;
        ctx.setLineDash([4, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    });
}

// Атака
function shoot() {
    for (let tower of towers) {
        let best = null, bestDist = 1000;
        for (let enemy of enemies) {
            let dr = enemy.row - tower.row, dc = enemy.col - tower.col;
            let dist = Math.sqrt(dr*dr + dc*dc);
            if (dist < tower.range && dist < bestDist && enemy.hp > 0) {
                best = enemy; bestDist = dist;
            }
        }
        tower.cooldown = tower.cooldown || 0;
        if (best && tower.cooldown <= 0) {
            best.hp -= tower.damage;
            tower.cooldown = 30; // кадров
            // выстрел
            const from = cellToPos(tower);
            const to = cellToPos(best);
            ctx.save();
            ctx.strokeStyle = tower.color;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
            ctx.restore();
        }
        if (tower.cooldown > 0) tower.cooldown--;
    }
}

// Основной рендер
function gameRender() {
    drawGrid();
    drawTowers();
    enemies.forEach(e => e.draw());
}

function gameUpdate() {
    enemies = enemies.filter(e => e.hp > 0 && !e.isOut());
    enemies.forEach(e => e.update());
    shoot();
}

function gameLoop() {
    gameUpdate();
    gameRender();
    requestAnimationFrame(gameLoop);
}
gameLoop();

// Установка башен мышкой
onCellClick(cell => {
    if (selectedTowerType!==null && money >= TOWER_TYPES[selectedTowerType].price) {
        if (towers.find(t => t.row === cell.row && t.col === cell.col)) return;
        towers.push({ ...cell, ...TOWER_TYPES[selectedTowerType] });
        money -= TOWER_TYPES[selectedTowerType].price;
        selectedTowerType = null;
        renderShop();
    }
});
