const consoleDiv = document.getElementById("gameConsole");
const consoleInput = document.getElementById("consoleInput");

let devMode = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "F2" || e.key === "`") {
    consoleDiv.classList.toggle("hidden");
    if (!consoleDiv.classList.contains("hidden")) {
      consoleInput.focus();
    }
  }
});

consoleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const command = consoleInput.value.trim();
    if (command) {
      handleConsoleCommand(command);
      consoleInput.value = "";
      consoleDiv.classList.add("hidden");
    }
  }
});

const commands = {
  "808": () => {
    devMode = true;
    setDevVisualState(true);
    alert("✅ Включен тестовый режим");
  },
  "800": () => {
    devMode = false;
    setDevVisualState(false);
    alert("🚫 Отключен тестовый режим");
  },
  "admin": () => alert("Открыть админку (заглушка)"),
};

function handleConsoleCommand(command) {
  if (commands[command]) {
    commands[command]();
  } else {
    alert("Неизвестная команда: " + command);
  }
}

function setDevVisualState(state) {
  const footer = document.getElementById("footerStatus");
  const devLabel = document.getElementById("devLabel");

  if (state) {
    footer.classList.add("dev");
    devLabel.classList.remove("hidden");
  } else {
    footer.classList.remove("dev");
    devLabel.classList.add("hidden");
  }
}
