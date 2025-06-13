// scripts/utils.js

/**
 * Утилиты и глобальный логгер для проекта
 * Работает как ES-модуль: import { ... } from './utils.js'
 */

// ========== ГЛОБАЛЬНЫЕ НАСТРОЙКИ ==========

/**
 * Глобальный флаг отладки — можно переопределить из config.js
 */
export let DEBUG = true;

// ========== НАСТРОЙКА И ЛОГГИРОВАНИЕ ==========

/**
 * Установить debug-режим (true/false)
 */
export function setDebug(value) {
  DEBUG = Boolean(value);
  logInfo(`DEBUG режим ${DEBUG ? 'включён' : 'отключён'}`);
}

/**
 * Отладочный лог (работает только если DEBUG=true)
 */
export function logDebug(...msg) {
  if (DEBUG) {
    console.log('%c[DEBUG]', 'color:#2e90ff;font-weight:bold', ...msg);
  }
}

/**
 * Информационный лог
 */
export function logInfo(...msg) {
  console.log('%c[INFO]', 'color:#00bfa6;font-weight:bold', ...msg);
}

/**
 * Предупреждение
 */
export function logWarn(...msg) {
  console.warn('%c[WARN]', 'color:orange;font-weight:bold', ...msg);
}

/**
 * Ошибка
 */
export function logError(...msg) {
  console.error('%c[ERROR]', 'color:red;font-weight:bold', ...msg);
}

// ========== МАТЕМАТИКА ==========

/**
 * Случайное целое число от min до max (включительно)
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
 * Линейная интерполяция
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ========== МАССИВЫ ==========

/**
 * Перемешивание массива (возвращает копию)
 */
export function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== ОБЪЕКТЫ ==========

/**
 * Глубокое клонирование простого объекта (без методов, дат и т.д.)
 */
export function deepClone(obj) {
  try {
    return structuredClone(obj);
  } catch (e) {
    logWarn('structuredClone недоступен, fallback на JSON', e);
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * Генерация уникального ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36)}`;
}

// ========== КООРДИНАТЫ / ГЕОМЕТРИЯ ==========

/**
 * Проверка попадания точки в прямоугольник
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
 * Сравнение координат клеток {row, col}
 */
export function coordsEqual(a, b) {
  return a?.row === b?.row && a?.col === b?.col;
}

// ========== ПРОЧЕЕ ==========

/**
 * Форматирование времени в mm:ss
 */
export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Пауза (await sleep)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== АВТОПРОВЕРКА ПРИ ИМПОРТЕ ==========
logDebug('✅ utils.js загружен. DEBUG =', DEBUG);
