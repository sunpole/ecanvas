// scripts/utils.js

/**
 * Система запускается как модуль! Все импорты работают как import {...} from './utils.js'
 */

/**
 * Дебаг-флаг: глобально включает/выключает вывод.
 * Можно переопределять из config.js при необходимости.
 */
export let DEBUG = true;

/**
 * Включает или выключает режим отладки логированием.
 * Используй из других модулей: import { setDebug } from './utils.js'
 */
export function setDebug(value) {
  DEBUG = Boolean(value);
}

/**
 * Логгирование важных этапов, если DEBUG=true.
 * Всегда прокидывай важные параметры для быстрых разборов.
 */
export function logDebug(...msg) {
  if (DEBUG) {
    // Красочный тег для лёгкой фильтрации в консоли
    console.log('%c[DEBUG]', 'color:#2e90ff;font-weight:bold', ...msg);
  }
}

/**
 * Возвращает случайное целое между min и max (включительно)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Проверяет, попадет ли точка (x, y) внутрь прямоугольника rect
 * rect: { x, y, width, height }
 */
export function pointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Расстояние между двумя точками (обычно для поиска ближайших или траекторий)
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Ограничитель (clamp) значения между min и max — для положений или HP
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Быстрый глубокий клон объекта (осторожно: не копирует функции, даты, Map/Set)
 * Используй только для простых игровых обьектов и состояния сетки
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Генерация уникального id для временных объектов (например, враг, модуль)
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

/**
 * Форматирует миллисекунды в строку mm:ss (например, для таймеров волн)
 */
export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Линейная интерполяция (lerp), бывает полезна для анимации/движений
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Быстрое перемешивание массива (например для случайного рендера волн)
 */
export function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---
// Можно добавлять новые утилиты по аналогии выше!
// ---

// Пример автотеста после импорта (удалить после интеграции)
// logDebug('utils.js загружен, DEBUG=' + DEBUG);
