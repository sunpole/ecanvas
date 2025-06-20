# 📘 Документация по структуре игровых скриптов Tower Defense

## 🔧 Общая цель

Каждый файл представляет собой **модуль**, отвечающий за чётко определённую часть логики игры. Это упрощает понимание, тестирование и модификацию кода. Все модули пишутся на **чистом JavaScript** и подключаются через `<script>` в `index.html` в нужной последовательности.

---

## 🧩 Основные игровые скрипты (10 файлов)

### 1. `grid.js` — Работа с сеткой поля

**Объём**: \~200–300 строк
**Назначение**: логика игрового поля (10x10 или другое)

**Функции:**

* `createGrid(rows, cols)` — создание двумерного массива клеток
* `isCellWalkable(x, y)` — проверка проходимости
* `setCellStatus(x, y, status)` — установка статуса (проходима, занята, блокирована)
* `getNeighbors(x, y)` — возвращает соседние клетки
* `coordsToIndex(x, y)` / `indexToCoords(index)` — преобразования координат

---

### 2. `pathfinding.js` — Поиск пути

**Объём**: \~300–400 строк (предполагается сложность и логгинг)

**Функции:**

* `findPath(start, end, grid)` — реализация A\* алгоритма
* `recalculatePath(enemy)` — пересчёт пути при изменении карты
* `isPathAvailable(grid)` — проверка доступности пути
* `heuristic(a, b)` — расстояние между клетками

---

### 3. `enemy.js` — Поведение и движение врагов (orders.js)

**Объём**: \~300–500 строк

**Функции:**

* `spawnEnemy(enemyData)` — создание врага по данным
* `updateEnemyPosition(enemy)` — движение врага по пути
* `renderEnemy(enemy, ctx)` — отрисовка спрайта врага
* `enemyReachedEnd(enemy)` — реакция на достижение финиша
* `enemyTakeDamage(enemy, amount)` — получение урона

> ⚠ Возможное превышение 700 строк — при наличии анимаций, AI или сложных эффектов.
> Разделение на `enemy-move.js`, `enemy-stats.js`, `enemy-render.js` — при необходимости.

---

### 4. `spawner.js` — Спавн волн

**Объём**: \~200–300 строк

**Функции:**

* `startWave(waveData)` — запуск волны врагов
* `queueEnemies(waveData)` — формирование очереди
* `tickSpawner()` — таймер между врагами
* `isWaveFinished()` — проверка окончания волны

---

### 5. `towers.js` — Башни и постройки (modules.js)

**Объём**: \~300–400 строк

**Функции:**

* `placeTower(x, y, type)` — установка башни
* `upgradeTower(tower)` — улучшение башни
* `isPlaceValid(x, y)` — можно ли ставить на клетку
* `getTowersInRange(enemy)` — поиск ближайших
* `towerAttack(tower, enemies)` — логика атаки

> При вводе множества типов башен возможно разделение на `tower-types.js`, `tower-logic.js`

---

### 6. `renderer.js` — Отрисовка на Canvas

**Объём**: \~300–500 строк

**Функции:**

* `drawGrid()` — отрисовка сетки
* `drawEnemies()` — отрисовка врагов
* `drawTowers()` — отрисовка башен
* `drawHealthBars()` — отображение HP
* `clearCanvas()` — очистка

---

### 7. `ui.js` — Пользовательский интерфейс

**Объём**: \~300–400 строк

**Функции:**

* `updateWaveUI()` — отображение волны
* `updateScore()` — отображение очков/репутации
* `showModal(message)` — модальные окна
* `bindUIEvents()` — слушатели кнопок

---

### 8. `game-loop.js` — Главный игровой цикл

**Объём**: \~200–300 строк

**Функции:**

* `gameLoop(timestamp)` — основной цикл игры
* `updateAll()` — логика на кадр
* `renderAll()` — отрисовка на кадр
* `startGame()` / `pauseGame()` — управление игрой

---

### 9. `config.js` — Настройки и константы

**Объём**: \~100–200 строк

**Содержит:**

* Размеры карты, интервал волн, скорости
* Конфигурации врагов и башен
* Цвета, лимиты, режимы (debug, dev)

---

### 10. `utils.js` — Утилиты и помощники

**Объём**: \~200 строк

**Функции:**

* `randInt(min, max)` — случайные числа
* `formatTime(ms)` — формат времени
* `clone(obj)` — глубокое копирование
* `logDebug(msg)` — логгирование с флагом

---

## 🧪 Вспомогательные и дев-скрипты

### 🔹 `debug-tools.js`

* Консольные команды
* Отладочные выводы
* Измерение FPS и логов

### 🔹 `ui-theme.js`

* Тёмная/светлая тема
* Пользовательская цветовая схема

### 🔹 `dev-temp.js`

* Временный код для тестов, макетных функций, прототипов

---

## 📌 Последовательность подключения

1. `config.js`
2. `utils.js`
3. `grid.js`
4. `pathfinding.js`
5. `enemy.js`
6. `towers.js`
7. `spawner.js`
8. `renderer.js`
9. `ui.js`
10. `game-loop.js`
11. `debug-tools.js` (опционально)
12. `ui-theme.js` (опционально)
13. `dev-temp.js` (временно)

---

## 🔄 Возможность масштабирования

Если код в одном из файлов приближается к **700+ строк**, разбиваем по логическим частям:

* `enemy.js` → `enemy-move.js`, `enemy-stats.js`, `enemy-render.js`
* `towers.js` → `tower-types.js`, `tower-behavior.js`
* `renderer.js` → `render-grid.js`, `render-entities.js`

---

## ✅ Правила написания

* Всегда с логированием (`logDebug`) для ключевых действий
* Комментарии на русском: `// Что делает функция`, `// Проверка условия`, `// Отрисовка HP`
* Максимум 300–500 строк на файл, кроме очевидных исключений
* Все переменные и функции на английском, комментарии — на русском

---
