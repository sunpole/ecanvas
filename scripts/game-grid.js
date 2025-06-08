// scripts/game-grid.js
const GRID_SIZE = 10;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let selectedCell = null;

function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}
function getPanelsSize() {
  const topPanel = document.querySelector('.top-panel');
  const bottomPanel = document.querySelector('.bottom-panel');
  if (!isLandscape()) {
    return {
      main: (topPanel ? topPanel.getBoundingClientRect().height : 0)
          + (bottomPanel ? bottomPanel.getBoundingClientRect().height : 0)
    }
  } else {
    return {
      main: (topPanel ? topPanel.getBoundingClientRect().width : 0)
          + (bottomPanel ? bottomPanel.getBoundingClientRect().width : 0)
    }
  }
}
function getColors() {
  const root = getComputedStyle(document.documentElement);
  return {
    FIELD_BG: root.getPropertyValue('--color-card').trim(),
    CELL_BG: root.getPropertyValue('--color-cell').trim(),
    CELL_BORDER: root.getPropertyValue('--color-border').trim(),
    SELECT_BG: root.getPropertyValue('--color-accent').trim()
  }
}
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const panels = getPanelsSize();
  const isLand = isLandscape();
  let maxSize;
  if (!isLand) {
    maxSize = Math.min(
      Math.floor(h - panels.main),
      Math.floor(w * 0.92)
    );
  } else {
    maxSize = Math.min(
      Math.floor(h * 0.92),
      Math.floor(w - panels.main)
    );
  }
  maxSize = Math.max(maxSize, 200);
  canvas.style.width = maxSize + 'px';
  canvas.style.height = maxSize + 'px';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = maxSize * dpr;
  canvas.height = maxSize * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  drawGrid();
}
function drawGrid() {
  const size = parseFloat(canvas.style.width) || 300;
  const cellSize = size / GRID_SIZE;
  const C = getColors();
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = C.FIELD_BG;
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      let x = col * cellSize;
      let y = row * cellSize;
      ctx.fillStyle = selectedCell && selectedCell.row === row && selectedCell.col === col ? C.SELECT_BG : C.CELL_BG;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = C.CELL_BORDER;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
}
function getCellByCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (evt.touches && evt.touches.length) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }
  let x = clientX - rect.left;
  let y = clientY - rect.top;
  const cellSize = rect.width / GRID_SIZE;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (col < 0 || row < 0 || col >= GRID_SIZE || row >= GRID_SIZE) {
    return null;
  }
  return { row, col };
}
function handleClick(evt) {
  const cell = getCellByCoords(evt);
  selectedCell = cell;
  drawGrid();
}
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (evt) => {
  evt.preventDefault();
  handleClick(evt);
});
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
const obs = new MutationObserver(() => drawGrid());
obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
setTimeout(resizeCanvas, 0);
setTimeout(resizeCanvas, 200);
