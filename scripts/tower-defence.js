// script.js — Tower Defence игра (полностью готовая)

(function waitForGrid(){
  if (!window.GameGrid) return setTimeout(waitForGrid, 30);
  initTD(window.GameGrid);
})();

function initTD(grid) {
  console.clear();
  console.log("[TD] 🚀 Инициализация Tower Defence...");

  if (!grid) throw new Error("[TD] window.GameGrid НЕ определён — проверь подключение game-grid.js");

  ["canvas","ctx","GRID_SIZE","GRID_TOTAL","OUTLINE","drawGrid","getCellByCoords","SPAWN_CELLS","EXIT_CELLS"]
    .forEach(key => {
      if (!(key in grid)) throw new Error(`[TD] grid.${key} отсутствует!`);
    });
  console.log("[TD] ✅ GameGrid найден, начинаем игру.");

  // --- Настройки + состояния игры ---
  const TOWER_TYPES = [{ name:"Башня", price:40, range:2.2, damage:10, color:"#5575FF" }];
  let enemies = [], towers = [], bullets = [];
  let money = 100, wave=0, lives=20;
  let shopVisible=false, shopCell=null, isSpawningWave=false, enemyIdGen=1, lastShopMsg="";

  // --- Алгоритмы поиска Pathfinding ---
  function neighbors(c) {
    return [
      {row:c.row+1,col:c.col},{row:c.row-1,col:c.col},
      {row:c.row,col:c.col+1},{row:c.row,col:c.col-1}
    ].filter(n=>
      n.row>=0 && n.row<grid.GRID_SIZE &&
      n.col>=0 && n.col<grid.GRID_SIZE
    );
  }

  function isPathAvailable(testTowers=[]) {
    const blocks = new Set(testTowers.map(t=>`${t.row}_${t.col}`));
    const queue=[grid.SPAWN_CELLS[0]];
    const visited=new Set([queue[0].row+"_"+queue[0].col]);
    while(queue.length){
      const c=queue.shift();
      if (c.row===grid.EXIT_CELLS[0].row && c.col===grid.EXIT_CELLS[0].col) return true;
      neighbors(c).forEach(n=>{
        const key=`${n.row}_${n.col}`;
        if (!blocks.has(key) && !visited.has(key)){
          visited.add(key);
          queue.push(n);
        }
      });
    }
    return false;
  }

  function heuristic(a,b){
    return Math.abs(a.row-b.row)+Math.abs(a.col-b.col);
  }

  function findPathAstar(start,end,testTowers=towers){
    const blocks=new Set(testTowers.map(t=>`${t.row}_${t.col}`));
    let open=[start], came={}, gS={}, fS={};
    const key=c=>`${c.row}_${c.col}`;
    gS[key(start)]=0;
    fS[key(start)]=heuristic(start,end);
    while(open.length){
      open.sort((a,b)=>(fS[key(a)]||1e9)-(fS[key(b)]||1e9));
      const current=open.shift();
      if (current.row===end.row && current.col===end.col){
        const path=[current];
        while(key(path[0])!==key(start)){
          path.unshift(came[key(path[0])]);
        }
        return path;
      }
      neighbors(current).forEach(n=>{
        const nk=key(n);
        if(blocks.has(nk))return;
        const tentative=gS[key(current)]+1;
        if (tentative < (gS[nk]||1e9)){
          came[nk]=current;
          gS[nk]=tentative;
          fS[nk]=tentative+heuristic(n,end);
          if(!open.some(o=>key(o)===nk)) open.push(n);
        }
      });
    }
    return null;
  }

  // --- Привязка клика для магазина + скрытие ---
  grid.canvas.addEventListener("click", evt=>{
    const cell=grid.getCellByCoords(evt);
    if (!cell) return;
    showShop(cell,evt.clientX,evt.clientY,lastShopMsg);
  });

  document.addEventListener("click", evt=>{
    const shop=document.getElementById("shop");
    if (shopVisible && shop && !shop.contains(evt.target)){
      hideShop();
    }
  }, true);

  // --- Функции магазина и башен ---
  function canPlaceTower(cell,id=0,checkBlock=true){
    if(!cell) return false;
    if(cell.col===0 || cell.col===grid.GRID_SIZE-1) return false;
    if(towers.some(t=>t.row===cell.row&&t.col===cell.col)) return false;
    if(enemies.some(e=>Math.floor(e.row)===cell.row&&Math.floor(e.col)===cell.col)) return false;
    if(checkBlock){
      const test=[...towers,{...cell,...TOWER_TYPES[id]}];
      if(!isPathAvailable(test)){
        console.warn("[TD] 🛑 Башня заблокирует путь!");
        return false;
      }
    }
    return true;
  }

  function addTower(cell,id){
    if(canPlaceTower(cell,id)){
      towers.push({...cell,...TOWER_TYPES[id]});
      money-=TOWER_TYPES[id].price;
      console.log(`[TD] Добавлена башня (${cell.row},${cell.col}), 💰=${money}`);
      lastShopMsg="";
    } else {
      lastShopMsg="Сюда нельзя поставить башню!";
      console.warn("[TD]",lastShopMsg,cell);
    }
  }

  function showShop(cell,x,y,msg=""){
    if(!canPlaceTower(cell,0)) {
      console.info("[TD] Магазин НЕ выводится — нельзя ставить Башню:",cell);
      lastShopMsg="";
      return;
    }
    shopVisible=true; shopCell=cell;
    let shop=document.getElementById("shop");
    if(!shop){
      shop=document.createElement("div");
      shop.id="shop";
      document.body.appendChild(shop);
    }
    shop.style.cssText="position:fixed;background:#222;color:#fff;padding:12px;border-radius:8px;z-index:2000";
    shop.style.left=x+"px"; shop.style.top=y+"px";
    shop.innerHTML=`<b>💰 ${money}</b> <small>💔 ${lives}</small><hr>`;
    if(msg) shop.innerHTML+=`<div style="color:orange">${msg}</div>`;
    TOWER_TYPES.forEach((t,i)=>{
      const btn=document.createElement("button");
      btn.textContent=`${t.name} (${t.price})`;
      btn.disabled=money<t.price;
      btn.onclick=()=>{ addTower(cell,i); hideShop(); };
      shop.appendChild(btn);
    });
  }

  function hideShop(){
    shopVisible=false; shopCell=null;
    const shop=document.getElementById("shop");
    if(shop) shop.style.display="none";
  }

  // --- Класс Враг и обработка ---
  class Enemy {
    constructor(){
      this.id=enemyIdGen++;
      const sp=grid.SPAWN_CELLS[0];
      this.row=sp.row; this.col=sp.col;
      this.path=this.calcPath();
      if(!this.path){ this.dead=true; return; }
      this.hp=30+Math.floor(wave*3+Math.random()*2);
      this.maxHP=this.hp;
      this.speed=2+Math.random();
      this.pathIdx=0; this.dead=false; this.gone=false;
      this.updatePos();
      console.log(`[TD] Враг #${this.id} HP=${this.hp} путь=${this.path.length}`);
    }

    calcPath(){
      return findPathAstar({row:this.row,col:this.col},grid.EXIT_CELLS[0]);
    }

    updatePos(){
      const {x,y,cellSize}=cellToPos(this.path?.[this.pathIdx]||this);
      this.x=x; this.y=y; this.cellSize=cellSize;
    }

    update(){
      if(this.dead||this.gone) return;
      if(!this.path||this.path.length<2){ this.gone=true; lives--; return; }
      const next=this.path[this.pathIdx+1];
      if(!next){ this.gone=true; lives--; return; }
      const curPix=cellToPos(this.path[this.pathIdx]);
      const tgtPix=cellToPos(next);
      const dx=tgtPix.x-curPix.x, dy=tgtPix.y-curPix.y;
      const dist=Math.hypot(dx,dy);
      if(dist<this.speed){ this.pathIdx++; this.updatePos(); }
      else { this.x+=dx/dist*this.speed; this.y+=dy/dist*this.speed; }
    }

    draw(){
      if(this.dead||this.gone) return;
      const {cellSize}=cellToPos(this);
      const scale=Math.max(0.5,this.hp/this.maxHP);
      grid.ctx.save();
      grid.ctx.font=(cellSize*0.8*scale)+"px serif";
      grid.ctx.textAlign="center"; grid.ctx.textBaseline="middle";
      grid.ctx.fillText("😈",this.x,this.y);
      grid.ctx.fillStyle="#e83438";
      grid.ctx.fillRect(this.x-cellSize*0.21,this.y-cellSize*0.43,cellSize*0.42*(this.hp/this.maxHP),cellSize*0.07);
      grid.ctx.restore();
    }
  }

  // --- Пули и стрельба ---
  function cellToPos(cell){
    const W=grid.canvas.width;
    const size=W/grid.GRID_TOTAL;
    return {
      x:(cell.col+grid.OUTLINE)*size+size/2,
      y:(cell.row+grid.OUTLINE)*size+size/2,
      cellSize:size
    };
  }

  function drawTowers(){
    towers.forEach(t=>{
      const {x,y,cellSize}=cellToPos(t);
      grid.ctx.save();
      grid.ctx.font=(cellSize*0.9)+"px serif";
      grid.ctx.textAlign="center"; grid.ctx.textBaseline="middle";
      grid.ctx.fillText("🛡️",x,y);
      grid.ctx.restore();

      grid.ctx.save();
      grid.ctx.beginPath();
      grid.ctx.arc(x,y,t.range*cellSize,0,2*Math.PI);
      grid.ctx.strokeStyle="#5092ff70"; grid.ctx.lineWidth=2;
      grid.ctx.setLineDash([4,9]);
      grid.ctx.stroke();
      grid.ctx.restore();
    });
  }

  function drawBullets(){
    bullets.forEach(b=>{
      grid.ctx.beginPath();
      grid.ctx.arc(b.x,b.y,7,0,2*Math.PI);
      grid.ctx.fillStyle="#fff";
      grid.ctx.fill();
    });
  }

  function updateBullets(){
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.x+=b.dx; b.y+=b.dy;
      if(b.target && !b.target.dead && !b.target.gone){
        const d=Math.hypot(b.x-b.target.x,b.y-b.target.y);
        if(d<15){
          b.target.hp-=b.damage;
          if(b.target.hp<=0){
            b.target.dead=true; money+=15;
            console.log(`[TD] Убит враг #${b.target.id}, +15💰=${money}`);
          }
          bullets.splice(i,1);
          continue;
        }
      }
      if(Math.abs(b.x-b.tx)<8 && Math.abs(b.y-b.ty)<8){
        bullets.splice(i,1);
      }
    }
  }

  function shoot(){
    towers.forEach(t=>{
      let nearest=null, minD=Infinity;
      enemies.forEach(e=>{
        if(e.dead||e.gone) return;
        const d=Math.hypot(e.x-cellToPos(t).x, e.y-cellToPos(t).y);
        if(d<t.range*cellToPos(t).cellSize && d<minD){
          nearest=e; minD=d;
        }
      });
      t.cooldown=t.cooldown||0;
      if(nearest&&t.cooldown<=0){
        t.cooldown=22;
        const from=cellToPos(t), to={x:nearest.x,y:nearest.y};
        bullets.push({
          x:from.x, y:from.y, tx:to.x, ty:to.y,
          dx:(to.x-from.x)/15, dy:(to.y-from.y)/15,
          target:nearest, damage:t.damage
        });
        console.log(`[TD] Башня стреляет по врагу #${nearest.id}`);
      }
      if(t.cooldown>0) t.cooldown--;
    });
  }

  // --- Волны врагов ---
  function spawnWaveEnemies(n){
    isSpawningWave=true;
    let count=0;
    const timer=setInterval(()=>{
      if(count>=n){ isSpawningWave=false; clearInterval(timer); return; }
      const e=new Enemy();
      if(!e.dead) enemies.push(e);
      count++;
    },600);
  }

  function nextWave(){
    wave++;
    console.log(`[TD] 🌊 Волна ${wave} — ${2+wave*2} врагов`);
    setTimeout(()=>spawnWaveEnemies(2+wave*2),700);
  }

  function allEnemiesDead(){
    return !enemies.some(e=>!e.dead&&!e.gone)&&!isSpawningWave;
  }

  // --- UI статистики ---
  function renderStats(){
    let el=document.getElementById("td-stats");
    if(!el){
      el=document.createElement("div");
      el.id="td-stats";
      Object.assign(el.style,{
        position:"fixed",left:"24px",top:"18px",
        background:"#282828EE",color:"#fff",
        padding:"10px 16px",borderRadius:"10px",zIndex:999999
      });
      document.body.append(el);
    }
    el.innerHTML=`💔 ${lives} | 💵 ${money} | 🌊 ${wave}`;
  }

  // --- Основной цикл ---
  let _raf=null;
  function gameUpdate(){
    enemies=enemies.filter(e=>!e.dead&&!e.gone);
    enemies.forEach(e=>e.update());
    updateBullets(); shoot();

    if(allEnemiesDead()&&lives>0&&!isSpawningWave){
      setTimeout(nextWave,950);
    }
    if(lives<=0){
      console.warn("[TD] Игра окончена!");
      document.getElementById("td-stats").innerHTML+= "<hr>💀 <b>GAME OVER</b>";
      cancelAnimationFrame(_raf);
    }
  }

  function gameRender(){
    grid.ctx.clearRect(0,0,grid.canvas.width,grid.canvas.height);
    grid.drawGrid();
    drawTowers();
    drawBullets();
    enemies.forEach(e=>e.draw());
    renderStats();
  }

  function gameLoop(){
    gameUpdate(); gameRender();
    _raf=requestAnimationFrame(gameLoop);
  }

  // --- Клавиша F3 — рестарт ---
  document.addEventListener("keydown", e=>{
    if(e.code==="F3"){
      e.preventDefault();
      alert("🔁 Рестарт игры (F3)");
      location.reload();
    }
  });

  // Старт игры
  console.log("[TD] 🔥 Автостарт!");
  nextWave();
  gameLoop();
}
