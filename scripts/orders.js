// scripts/orders.js

export const modules = [];

const CELL_SIZE = 32;
const UPGRADE_TIME = 2;

const MODULE_TYPES = {
  basic: {
    name: 'Стандарт',
    color: '#39c792',
    attack: 18,
    range: 2,
    cooldown: 1.2,
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
};

function getModuleParams(type) {
  return MODULE_TYPES[type] || MODULE_TYPES['basic'];
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

function isPlaceValid(row, col) {
  if (modules.some(m => m.row === row && m.col === col)) {
    console.debug(`[MODULES] Место занято: (${row},${col})`);
    return false;
  }
  // TODO: Проверить проходимость по сетке (grid.js)
  return true;
}

function placeModule(row, col, type = 'basic') {
  if (!isPlaceValid(row, col)) {
    console.warn(`[MODULES] Нельзя разместить модуль "${type}" на (${row},${col}) — занято или недоступно`);
    return false;
  }
  const params = getModuleParams(type);
  const module = {
    id: generateId(),
    row, col,
    type,
    level: 1,
    attack: params.attack,
    range: params.range,
    cooldown: params.cooldown,
    color: params.color,
    lastAct: -Infinity,
    upgTotal: 0,
    upgDone: 0,
    upgrading: false
  };
  modules.push(module);
  console.log(`[MODULES] Установлен модуль: ID=${module.id}, Тип="${type}", Позиция=(${row},${col})`);
  return true;
}

function upgradeModule(module) {
  if (!modules.includes(module)) {
    console.error('[MODULES] Попытка апгрейда неизвестного модуля:', module);
    return false;
  }
  if (module.upgrading) {
    console.warn(`[MODULES] Модуль ${module.id} уже в процессе апгрейда`);
    return false;
  }
  const params = getModuleParams(module.type);
  if (module.level >= params.maxLevel) {
    console.warn(`[MODULES] Модуль ${module.id} достиг максимального уровня (${module.level})`);
    return false;
  }

  module.upgTotal = UPGRADE_TIME;
  module.upgDone = 0;
  module.upgrading = true;
  console.log(`[MODULES] Запущен апгрейд модуля ID=${module.id}, Тип=${module.type}, Позиция=(${module.row},${module.col}), уровень ${module.level} -> ${module.level + 1}`);
  return true;
}

function updateModules(delta, orders) {
  for (const module of modules) {
    if (module.upgrading) {
      module.upgDone += delta;
      if (module.upgDone >= module.upgTotal) {
        const params = getModuleParams(module.type);
        module.level++;
        module.attack += params.upgradeAttack;
        module.upgrading = false;
        module.upgTotal = 0;
        module.upgDone = 0;
        console.log(`[MODULES] Модуль ID=${module.id} прокачан до уровня ${module.level}`);
      }
      continue;
    }

    module.lastAct += delta;
    if (module.lastAct >= module.cooldown) {
      const targets = getModulesTargets(module, orders);
      if (targets.length) {
        dealDamage(module, targets[0]);
        module.lastAct = 0;
      } else {
        console.debug(`[MODULES] Модуль ID=${module.id} не нашёл целей в радиусе`);
      }
    }
  }
}

function getModulesTargets(module, orders) {
  return orders.filter(order =>
    !order.dead &&
    distanceSquared(module.row, module.col, order.row, order.col) <= module.range * module.range
  );
}

function distanceSquared(r1, c1, r2, c2) {
  return (r1 - r2) ** 2 + (c1 - c2) ** 2;
}

function dealDamage(module, order) {
  order.hp -= module.attack;
  if (order.hp < 0) order.hp = 0;
  console.log(`[MODULES] Модуль (ID=${module.id}, ${module.type}/${module.level}) атакует заказ (${order.row},${order.col}), урон: ${module.attack}, HP осталось: ${order.hp.toFixed(1)}`);
  if (order.hp === 0) {
    console.log(`[MODULES] Заказ (${order.row},${order.col}) уничтожен модулем ID=${module.id}`);
  }
}

function getModulesInRange(order, radius = 2) {
  return modules.filter(module =>
    distanceSquared(module.row, module.col, order.row, order.col) <= radius * radius
  );
}

function getModuleAt(row, col) {
  return modules.find(m => m.row === row && m.col === col) || null;
}

function renderModule(module, ctx) {
  ctx.fillStyle = module.color;
  ctx.fillRect(module.col * CELL_SIZE, module.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(module.level, module.col * CELL_SIZE + CELL_SIZE / 2, module.row * CELL_SIZE + CELL_SIZE / 2);
}

function removeModule(row, col) {
  const idx = modules.findIndex(m => m.row === row && m.col === col);
  if (idx !== -1) {
    console.log(`[MODULES] Модуль ID=${modules[idx].id} удалён с позиции: (${row},${col})`);
    modules.splice(idx, 1);
    return true;
  }
  console.warn(`[MODULES] Модуль на позиции (${row},${col}) не найден для удаления`);
  return false;
}

function resetModules() {
  modules.length = 0;
  console.log('[MODULES] Все модули очищены');
}

export {
  placeModule,
  upgradeModule,
  isPlaceValid,
  updateModules,
  getModulesInRange,
  getModuleAt,
  removeModule,
  resetModules,
  renderModule
};
