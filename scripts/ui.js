// scripts/ui.js

// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И DOM ======
let scoreEl, waveEl, livesEl, msgEl, startPauseBtn, restartBtn, devLabel;

// ====== INIT UI: Инициализация и навешивание обработчиков ======
export function initUI({ onStartPause, onRestart } = {}) {
  scoreEl = document.getElementById('scoreCount');
  waveEl = document.getElementById('waveCount');
  livesEl = document.getElementById('livesCount');
  msgEl = document.getElementById('gameMessage');
  startPauseBtn = document.getElementById('startPauseBtn');
  restartBtn = document.getElementById('restartBtn');
  devLabel = document.getElementById('devLabel');

  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = 'gameMessage';
    msgEl.className = 'game-message';
    document.body.appendChild(msgEl);
  }

  if (startPauseBtn && typeof onStartPause === 'function') {
    startPauseBtn.onclick = onStartPause;
  }
  if (restartBtn && typeof onRestart === 'function') {
    restartBtn.onclick = onRestart;
  }

  console.log('[UI] Инициализация UI завершена');
}

// ====== ОТРИСОВКА UI НА КАНВАСЕ ======
export function renderUI(ctx, gameState) {
  if (!ctx || !gameState) return;
  ctx.save();
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#0008";
  ctx.shadowBlur = 1.5;
  ctx.fillText(`Счёт: ${gameState.score ?? 0}`, 15, 12);
  ctx.fillText(`Волна: ${gameState.wave ?? 1}`, 15, 34);
  ctx.fillText(`Жизни: ${gameState.lives ?? 5}`, 15, 56);
  ctx.restore();
}

// ====== ОБНОВЛЕНИЕ UI В DOM ======
export function updateUI(gameState) {
  if (!gameState) return;
  if (scoreEl) scoreEl.textContent = `${gameState.score ?? 0}`;
  if (waveEl) waveEl.textContent = `${gameState.wave ?? 1}`;
  if (livesEl) livesEl.textContent = `${gameState.lives ?? 5}`;
  if (devLabel) devLabel.style.display = gameState.devMode ? '' : 'none';
}

// ====== ПОКАЗАТЬ ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ ======
let hideMsgTimeout = null;
export function showMessage(text, duration = 2000) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.opacity = '1';
  msgEl.style.pointerEvents = 'auto';
  msgEl.classList.add('active');
  clearTimeout(hideMsgTimeout);
  hideMsgTimeout = setTimeout(() => {
    if (msgEl) {
      msgEl.style.opacity = '0';
      msgEl.classList.remove('active');
    }
  }, duration);
  console.log(`[UI] Показано сообщение: "${text}" (длительность: ${duration}ms)`);
}

// ====== ОБРАБОТКА КЛИКОВ ПО UI ======
export function handleUIClick(x, y) {
  // Заготовка под обработку кликов по canvas, если будет нужно
  // Логика зависит от проекта, здесь просто лог
  console.log(`[UI] Клик по UI в координатах: x=${x}, y=${y}`);
}

// ====== СБРОС UI ======
export function resetUI() {
  if (msgEl) {
    msgEl.style.opacity = '0';
    msgEl.classList.remove('active');
  }
  if (scoreEl) scoreEl.textContent = '0';
  if (waveEl) waveEl.textContent = '1';
  if (livesEl) livesEl.textContent = '5';
  console.log('[UI] UI сброшен к начальным значениям');
}
