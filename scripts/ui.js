// scripts/ui.js

// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И DOM ======
let scoreEl, waveEl, livesEl, msgEl, startPauseBtn, restartBtn, devLabel;

// ====== INIT UI: Инициализация и навешивание обработчиков ======
export function initUI({ onStartPause, onRestart } = {}) {
  // Главные элементы
  scoreEl = document.getElementById('scoreCount');
  waveEl = document.getElementById('waveCount');
  livesEl = document.getElementById('livesCount');
  msgEl = document.getElementById('gameMessage');
  startPauseBtn = document.getElementById('startPauseBtn');
  restartBtn = document.getElementById('restartBtn');
  devLabel = document.getElementById('devLabel');

  // Если нет в index.html, создаём динамически сверху/по центру
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = 'gameMessage';
    msgEl.className = 'game-message';
    document.body.appendChild(msgEl);
  }

  // Обработчики старт/пауза/рестарт (если передано в опциях)
  if (startPauseBtn && onStartPause) {
    startPauseBtn.onclick = onStartPause;
  }
  if (restartBtn && onRestart) {
    restartBtn.onclick = onRestart;
  }
}

// ====== ОТРИСОВКА UI НА КАНВАСЕ (опционально) ======
export function renderUI(ctx, gameState) {
  if (!ctx || !gameState) return;
  ctx.save();
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#0008";
  ctx.shadowBlur = 1.5;
  // Пример: счет, волна, жизни в левом верхнем углу
  ctx.fillText(`Счёт: ${gameState.score ?? 0}`, 15, 12);
  ctx.fillText(`Волна: ${gameState.wave ?? 1}`, 15, 34);
  ctx.fillText(`Жизни: ${gameState.lives ?? 5}`, 15, 56);
  ctx.restore();
}

// ====== ОБНОВИТЬ ДАННЫЕ UI В DOM (быстро) ======
export function updateUI(gameState) {
  // Счет
  if (scoreEl) scoreEl.textContent = `${gameState.score ?? 0}`;
  // Волна
  if (waveEl) waveEl.textContent = `${gameState.wave ?? 1}`;
  // Жизни
  if (livesEl) livesEl.textContent = `${gameState.lives ?? 5}`;
  // DEV-мод и прочее по gameState
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
    msgEl.style.opacity = '0';
    msgEl.classList.remove('active');
  }, duration);
}

// ====== КОНТРОЛЛЕР КЛИКОВ ПО UI ======
export function handleUIClick(x, y) {
  // Пример: обработка клика по кнопкам (или координат canvas)
  // Можно интегрировать с логикой выбора клетки или действия по canvas
  // Либо через DOM addEventListener (предпочтительнее)
  // Тут можно реализовать что делать по координатам клика на canvas,
  // например, выбирать модуль или запускать установку
}

// ====== ВСПОМОГАТЕЛЬНОЕ: ОЧИСТКА UI ======
export function resetUI() {
  // Сброс сообщений и счетчиков
  if (msgEl) msgEl.style.opacity = '0';
  if (scoreEl) scoreEl.textContent = '0';
  if (waveEl) waveEl.textContent = '1';
  if (livesEl) livesEl.textContent = '5';
}

// ====== ЭКСПОРТЫ ======
export {
  // initUI, renderUI, updateUI, showMessage, handleUIClick, resetUI -- уже экспортированы выше
};
