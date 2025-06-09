const consoleDiv = document.getElementById("gameConsole");
const consoleInput = document.getElementById("consoleInput");

let devMode = false;

// Показывать/скрывать консоль (например, по F2)
window.addEventListener("keydown", (e) => {
  if (e.key === "F2" || e.key === "`") {
    consoleDiv.classList.toggle("hidden");
    if (!consoleDiv.classList.contains("hidden")) {
      consoleInput.focus();
    }
  }
});

// Обработка ввода команды
consoleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const command = consoleInput.value.trim();
    handleConsoleCommand(command);
    consoleInput.value = "";
    consoleDiv.classList.add("hidden");
  }
});

function handleConsoleCommand(command) {
  switch (command) {
    case "808":
      devMode = true;
      alert("✅ Включен тестовый режим");
      break;
    case "800":
      devMode = false;
      alert("🚫 Отключен тестовый режим");
      break;
    case "admin":
      alert("Открыть админку (заглушка)");
      break;
    default:
      alert("Неизвестная команда: " + command);
  }
}
