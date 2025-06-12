// scripts/spawner.js

/**
 * Запуск новой волны заказов
 */
export function startWave(waveData) {
  console.log('[SPAWNER] startWave:', waveData);
  // TODO: инициализировать очередь заказов, сбросить состояние спавнера
}

/**
 * Формирование очереди заказов на волну
 */
export function queueOrders(waveData) {
  console.log('[SPAWNER] queueOrders:', waveData);
  // TODO: подготовить массив order'ов для данной волны
  return [];
}

/**
 * Таймер — регулярный спаун заказов по очереди
 */
export function tickSpawner() {
  console.log('[SPAWNER] tickSpawner');
  // TODO: раз в N миллисекунд создавать новый заказ из очереди, пока не закончится волна
}

/**
 * Проверка окончания волны
 */
export function isWaveFinished() {
  console.log('[SPAWNER] isWaveFinished');
  // TODO: если заказов не осталось — вернуть true, иначе false
  return true;
}
