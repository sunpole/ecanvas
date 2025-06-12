// scripts/debug-tools.js

// Глобально включать/выключать режим отладки
export const DEBUG_MODE = true;

// Простой вывод в консоль для отладки
export function logDebug(message, ...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', message, ...args);
  }
}

// Пример отладочной функции
export function showDebugInfo() {
  logDebug('Called showDebugInfo()');
}

// Быстрая команда для измерения FPS (заглушка)
export function measureFPS() {
  logDebug('Called measureFPS()');
  // Для реальной реализации добавить логику измерения кадров в секунду
}

// Заглушка — любые консольные команды
export function runDebugCommand(command) {
  logDebug('Run debug command:', command);
  // Здесь добавлять кастомные команды в будущем
}
