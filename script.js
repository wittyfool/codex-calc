const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const keys = document.querySelector(".keys");

const state = {
  current: "0",
  previous: null,
  operator: null,
  waitingForNext: false,
  justCalculated: false,
  note: "",
};

const operations = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? NaN : a / b),
};

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
  }).format(rounded);
}

function updateDisplay() {
  const numericValue = Number(state.current);
  display.value = state.current === "Error" ? "Error" : formatNumber(numericValue);

  if (state.note) {
    expression.textContent = state.note;
    return;
  }

  if (state.operator && state.previous !== null) {
    expression.textContent = `${formatNumber(state.previous)} ${state.operator}`;
    return;
  }

  expression.innerHTML = "&nbsp;";
}

function clearNote() {
  state.note = "";
}

function reset() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.waitingForNext = false;
  state.justCalculated = false;
  state.note = "";
  updateDisplay();
}

function inputNumber(number) {
  if (state.current === "Error" || state.justCalculated) {
    state.current = number;
    state.previous = null;
    state.operator = null;
    state.justCalculated = false;
    state.waitingForNext = false;
    clearNote();
    updateDisplay();
    return;
  }

  clearNote();

  if (state.waitingForNext) {
    state.current = number;
    state.waitingForNext = false;
  } else {
    state.current = state.current === "0" ? number : `${state.current}${number}`;
  }

  updateDisplay();
}

function inputDecimal() {
  if (state.current === "Error" || state.justCalculated) {
    state.current = "0.";
    state.previous = null;
    state.operator = null;
    state.justCalculated = false;
    state.waitingForNext = false;
    clearNote();
  } else if (state.waitingForNext) {
    state.current = "0.";
    state.waitingForNext = false;
    clearNote();
  } else if (!state.current.includes(".")) {
    state.current += ".";
    clearNote();
  }

  display.value = state.current;
}

function calculate() {
  if (!state.operator || state.previous === null) {
    return;
  }

  const currentValue = Number(state.current);
  const result = operations[state.operator](state.previous, currentValue);

  state.current = Number.isFinite(result) ? String(Number.parseFloat(result.toPrecision(12))) : "Error";
  state.previous = null;
  state.operator = null;
  state.waitingForNext = true;
  state.justCalculated = true;
  clearNote();
  updateDisplay();
}

function chooseOperator(operator) {
  if (state.current === "Error") {
    reset();
    return;
  }

  if (state.operator && !state.waitingForNext) {
    calculate();
  }

  state.previous = Number(state.current);
  state.operator = operator;
  state.waitingForNext = true;
  state.justCalculated = false;
  clearNote();
  updateDisplay();
}

function toggleSign() {
  if (state.current === "Error" || state.current === "0") {
    return;
  }

  state.current = state.current.startsWith("-") ? state.current.slice(1) : `-${state.current}`;
  clearNote();
  updateDisplay();
}

function percent() {
  if (state.current === "Error") {
    return;
  }

  state.current = String(Number.parseFloat((Number(state.current) / 100).toPrecision(12)));
  clearNote();
  updateDisplay();
}

function squareRoot() {
  if (state.current === "Error") {
    return;
  }

  const input = Number(state.current);
  const result = input < 0 ? NaN : Math.sqrt(input);

  state.note = `sqrt(${formatNumber(input)})`;
  state.current = Number.isFinite(result) ? String(Number.parseFloat(result.toPrecision(12))) : "Error";
  state.previous = null;
  state.operator = null;
  state.waitingForNext = true;
  state.justCalculated = true;
  updateDisplay();
}

function handleAction(action) {
  if (action === "clear") reset();
  if (action === "decimal") inputDecimal();
  if (action === "equals") calculate();
  if (action === "toggle-sign") toggleSign();
  if (action === "percent") percent();
  if (action === "sqrt") squareRoot();
}

function flashKey(selector) {
  const key = document.querySelector(selector);
  if (!key) {
    return;
  }

  key.classList.add("is-pressed");
  window.setTimeout(() => key.classList.remove("is-pressed"), 120);
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.number) inputNumber(button.dataset.number);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) handleAction(button.dataset.action);
});

window.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    inputNumber(key);
    flashKey(`[data-number="${key}"]`);
    return;
  }

  const operatorMap = {
    "/": "/",
    "*": "*",
    "-": "-",
    "+": "+",
  };

  if (operatorMap[key]) {
    event.preventDefault();
    chooseOperator(operatorMap[key]);
    flashKey(`[data-operator="${operatorMap[key]}"]`);
    return;
  }

  if (key === "." || key === ",") {
    inputDecimal();
    flashKey('[data-action="decimal"]');
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
    flashKey('[data-action="equals"]');
    return;
  }

  if (key === "Escape") {
    reset();
    flashKey('[data-action="clear"]');
    return;
  }

  if (key === "%") {
    percent();
    flashKey('[data-action="percent"]');
    return;
  }

  if (key.toLowerCase() === "r") {
    squareRoot();
    flashKey('[data-action="sqrt"]');
    return;
  }

  if (key === "Backspace") {
    state.current = state.current.length > 1 ? state.current.slice(0, -1) : "0";
    clearNote();
    updateDisplay();
  }
});

updateDisplay();
