// scripts/modules.js

// ==== ХРАНЕНИЕ МОДУЛЕЙ ====
export const modules = []; // массив всех размещённых модулей на поле

// ==== ПАРАМЕТРЫ ТИПОВ МОДУЛЕЙ ====
const MODULE_TYPES = {
  // Можешь расширять любые типы: basic, splash, etc.
  basic: {
    name: 'Стандарт',
    color: '#39c792',
    attack: 18,
    range: 2,
    cooldown: 1.2, // сек
    upgradeCost: 30,
    upgradeAttack: 7,
    maxLevel: 4
  },
  fast: {
    name: 'Быстрая',
    color: '#2db3fd',
    attack: 12,
    range: 2,
    cooldown: 0.7,
    upgradeCost: 40,
    upgradeAttack: 5,
    maxLevel: 4
  }
  // Добавь другие варианты, если нужно
};

// ==== ХЕЛПЕР: Получение параметров типа модуля ====
function getModuleParams(type) {
  return MODULE_TYPES[type] || MODULE_TYPES['basic'];
}

// ==== ДОБАВЛЕНИЕ МОДУЛЯ НА ПОЛЕ ====
export function placeModule(row, col, type = 'basic') {
  if (!isPlaceValid(row, col)) return false;
  const params = getModuleParams(type);
  const module = {
    id: Math.random().toString(36).slice(2) + Date.now(), // уникальный id
    row, col,
    type,
    level: 1,
    attack: params.attack,
    range: params.range,
    cooldown: params.cooldown,
    color: params.color,
    lastAct: -Infinity,        // таймер для выстрела
    upgTotal: 0,               // длительность апгрейда (сек)
    upgDone: 0,                // прогресс апгрейда (сек)
    upgrading: false           // идет ли апгрейд
  };
  modules.push(module);
  console.log('[MODULES] Установлен модуль:', module);
  return true;
}

// ==== ПРОВЕРКА ДОПУСТИМОСТИ РАЗМЕЩЕНИЯ ====
export function isPlaceValid(row, col) {
  // 1. Уже есть модуль?
  if (modules.some(m => m.row === row && m.col === col)) return false;
  // 2. Можно добавить свою проверку: запрещённые клетки, враги по пути, и т.д.
  // TODO: интегрируй с grid.js/terrain если нужно исключать "стены"
  return true;
}

// ==== АПГРЕЙД МОДУЛЯ ====
export function upgradeModule(module) {
  const params = getModuleParams(module.type);
  if (module.upgrading || module.level >= params.maxLevel) return false;
  // Запуск апгрейда (например, занимает 2 сек)
  module.upgTotal = 2;
  module.upgDone = 0;
  module.upgrading = true;
  console.log(`[MODULES] Улучшение модуля (${module.type}) -> уровень ${module.level + 1}`);
  return true;
}

// ==== МАССОВОЕ ОБНОВЛЕНИЕ (для game-loop) ====
/**
 * delta — время между тиками (сек)
 * orders — массив врагов из orders.js
 */
export function updateModules(delta, orders) {
  for (const module of modules) {
    // Улучшение прогресс
    if (module.upgrading) {
      module.upgDone += delta;
      if (module.upgDone >= module.upgTotal) {
        const params = getModuleParams(module.type);
        module.level++;
        module.attack += params.upgradeAttack;
        module.upgrading = false;
        module.upgTotal = 0;
        module.upgDone = 0;
        console.log(`[MODULES] Модуль прокачан. уровень =`, module.level);
      }
      continue; // не стреляет во время апгрейда
    }

    // КД и атака по врагам
    module.lastAct += delta;
    if (module.lastAct >= module.cooldown) {
      const targets = getModulesTargets(module, orders);
      if (targets.length) {
        // Атакуем одного — можно изменить, если splash
        dealDamage(module, targets[0]);
        module.lastAct = 0;
      }
    }
  }
}

// ==== ПОИСК ВРАГОВ В РАДИУСЕ для данного модуля ====
function getModulesTargets(module, orders) {
  return orders.filter(order =>
    !order.dead &&
    distance(module.row, module.col, order.row, order.col) <= module.range
  );
}
function distance(r1, c1, r2, c2) {
  // Округляем до ближайшей клетки. Можно заменить на манхэттен
  return Math.sqrt((r1 - r2) ** 2 + (c1 - c2) ** 2);
}

// ==== АТАКА ====
function dealDamage(module, order) {
  order.hp -= module.attack;
  // Можно добавить: визуал эффекты, журнал действий, ...
  if (order.hp < 0) order.hp = 0;
  console.log(`[MODULES] Модуль (${module.type}/${module.level}) атакует заказ: ${order.row},${order.col}: -${module.attack}`);
}

// ==== МОДУЛИ В РАДИУСЕ вокруг врага (например для аурового действия или поддержки) ====
export function getModulesInRange(order, radius = 2) {
  return modules.filter(module =>
    distance(module.row, module.col, order.row, order.col) <= radius
  );
}

// ==== ВСПОМОГАТЕЛЬНОЕ: НАЙТИ МОДУЛЬ ПО КООРДИНАТАМ (для UI) ====
export function getModuleAt(row, col) {
  return modules.find(m => m.row === row && m.col === col) || null;
}

// ==== УДАЛЕНИЕ МОДУЛЯ (например, для продажи или замены) ====
export function removeModule(row, col) {
  const idx = modules.findIndex(m => m.row === row && m.col === col);
  if (idx !== -1) {
    modules.splice(idx, 1);
    console.log(`[MODULES] Модуль удалён с позиции: ${row},${col}`);
    return true;
  }
  return false;
}

// ==== ОЧИСТКА ВСЕХ МОДУЛЕЙ (для новой партии) ====
export function resetModules() {
  modules.length = 0;
}

// ==== FULL EXPORT ====
export {
  // modules — exported above
  placeModule,
  upgradeModule,
  isPlaceValid,
  updateModules,
  getModulesInRange,
  getModuleAt,
  removeModule,
  resetModules
};
