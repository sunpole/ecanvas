// scripts/utils.js

/**
 * Система запускается как модуль!
 * Все импорты работают как import {...} from './utils.js'
 */

// ====== ГЛОБАЛЬНЫЙ ДЕБАГ-ФЛАГ ======
export let DEBUG = true;

// ====== НАСТРОЙКА ДЕБАГ-РЕЖИМА ======
export function setDebug(value) {
  DEBUG = Boolean(value);
  logInfo(`DEBUG режим ${DEBUG ? 'включен' : 'отключен'}`);
}

// ====== ДЕБАГ-ЛОГИРОВАНИЕ ======
export function logDebug(...msg) {
  if (DEBUG) {
    console.log('%c[DEBUG]', 'color:#2e90ff;font-weight:bold', ...msg);
  }
}

export function logInfo(...msg) {
  console.log('%c[INFO]', 'color:#00bfa6;font-weight:bold', ...msg);
}

export function logWarn(...msg) {
  console.warn('%c[WARN]', 'color:orange;font-weight:bold', ...msg);
}

export function logError(...msg) {
  console.error('%c[ERROR]', 'color:red;font-weight:bold', ...msg);
}

// ====== МАТЕМАТИЧЕСКИЕ УТИЛИТЫ ======

/**
 * Случайное целое от min до max (включительно)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Ограничение значения между min и max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Расстояние между двумя точками
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Линейная интерполяция (lerp)
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ====== УТИЛИТЫ ДЛЯ РАБОТЫ С МАССИВАМИ ======

/**
 * Перемешивание массива (копия)
 */
export function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ====== УТИЛИТЫ ДЛЯ ОБЪЕКТОВ И ИДЕНТИФИКАТОРОВ ======

/**
 * Глубокое клонирование объекта (без функций и нестандартных типов)
 */
export function deepClone(obj) {
  try {
    return structuredClone(obj); // Современный метод, если доступен
  } catch {
    logWarn('structuredClone недоступен, используется JSON fallback');
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * Генерация уникального ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36)}`;
}

// ====== УТИЛИТЫ ДЛЯ КООРДИНАТ И ПРЯМОУГОЛЬНИКОВ ======

/**
 * Попадает ли точка внутрь прямоугольника
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
 * Сравнение координат клеток (row/col)
 */
export function coordsEqual(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

// ====== ДРУГИЕ ПОЛЕЗНЫЕ УТИЛИТЫ ======

/**
 * Формат времени (мм:сс) из миллисекунд
 */
export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Задержка (await sleep)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ====== АВТОЗАПУСК ДЕБАГ-ЛОГА ПРИ ИМПОРТЕ ======
logDebug('utils.js загружен. DEBUG =', DEBUG);
