// scripts/ui.js

// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И DOM ======
let scoreEl, waveEl, livesEl, msgEl, startPauseBtn, restartBtn, devLabel;
let hideMsgTimeout = null;
let initialized = false;

// ====== ИНИЦИАЛИЗАЦИЯ UI ======
export function initUI({ onStartPause, onRestart } = {}) {
  if (initialized) {
    console.warn('[UI] initUI уже была вызвана, повторная инициализация предотвращена');
    return;
  }

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
    console.log('[UI] Создан элемент gameMessage');
  }

  if (startPauseBtn && typeof onStartPause === 'function') {
    startPauseBtn.onclick = onStartPause;
  }
  if (restartBtn && typeof onRestart === 'function') {
    restartBtn.onclick = onRestart;
  }

  console.log('[UI] Инициализация UI завершена', {
    scoreEl, waveEl, livesEl, msgEl, startPauseBtn, restartBtn, devLabel
  });

  initialized = true;
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

// ====== БЕЗОПАСНО УСТАНОВИТЬ ТЕКСТ ======
function setTextSafe(el, value) {
  if (el) el.textContent = String(value);
}

// ====== ОБНОВЛЕНИЕ UI В DOM ======
export function updateUI(gameState) {
  if (!gameState) return;

  setTextSafe(scoreEl, gameState.score ?? 0);
  setTextSafe(waveEl, gameState.wave ?? 1);
  setTextSafe(livesEl, gameState.lives ?? 5);

  if (devLabel) {
    devLabel.style.display = gameState.devMode ? '' : 'none';
    devLabel.textContent = gameState.devMode ? 'DEV MODE: ON' : '';
  }

  updateButtonStates(gameState.running);
}

// ====== УСТАНОВКА НАДПИСИ КНОПКИ СТАРТ/ПАУЗА ======
export function setStartPauseLabel(text) {
  if (startPauseBtn) {
    startPauseBtn.textContent = text;
  }
}

// ====== ОБНОВЛЕНИЕ СОСТОЯНИЯ КНОПОК ======
function updateButtonStates(isRunning) {
  if (startPauseBtn) {
    startPauseBtn.textContent = isRunning ? 'Пауза' : 'Старт';
  }
  if (restartBtn) {
    restartBtn.disabled = isRunning;
  }
}

// ====== ПОКАЗ СООБЩЕНИЯ НА ЭКРАН ======
export function showMessage(text, duration = 2000) {
  if (!msgEl) return;

  clearTimeout(hideMsgTimeout);

  msgEl.textContent = text;
  msgEl.style.opacity = '1';
  msgEl.style.pointerEvents = 'auto';
  msgEl.classList.add('active');

  hideMsgTimeout = setTimeout(() => {
    if (msgEl) {
      msgEl.style.opacity = '0';
      msgEl.classList.remove('active');
    }
  }, duration);

  console.log(`[UI] Показано сообщение: "${text}" (${duration}ms)`);
}

// ====== ОБРАБОТКА КЛИКОВ ПО UI ======
export function handleUIClick(x, y) {
  console.log(`[UI] Клик по UI: x=${x}, y=${y}`);
}

// ====== СБРОС UI К НАЧАЛЬНЫМ ЗНАЧЕНИЯМ ======
export function resetUI() {
  setTextSafe(scoreEl, '0');
  setTextSafe(waveEl, '1');
  setTextSafe(livesEl, '5');

  if (msgEl) {
    msgEl.style.opacity = '0';
    msgEl.classList.remove('active');
  }

  if (devLabel) {
    devLabel.style.display = 'none';
    devLabel.textContent = '';
  }

  updateButtonStates(false);
  console.log('[UI] UI сброшен к начальным значениям');
}
