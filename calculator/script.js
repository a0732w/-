(function () {
  "use strict";

  const outputEl = document.getElementById("output");
  const historyEl = document.getElementById("history");
  const keysEl = document.getElementById("keys");

  const state = {
    displayValue: "0",
    firstOperand: null,
    operator: null,
    waitingForSecond: false,
    justEvaluated: false,
    error: false,
  };

  function resetState() {
    state.displayValue = "0";
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecond = false;
    state.justEvaluated = false;
    state.error = false;
    updateUI();
  }

  function formatNumber(valueStr) {
    // Handle very long numbers gracefully
    if (!isFinite(Number(valueStr))) return "Error";
    const [intPart, decPart = ""] = valueStr.split(".");
    const intFormatted = Number(intPart).toLocaleString(undefined, {
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    if (decPart.length === 0) return intFormatted;
    return `${intFormatted}.${decPart}`;
  }

  function updateUI() {
    outputEl.textContent = state.error ? "Error" : formatNumber(state.displayValue);
    const hist = [];
    if (state.firstOperand !== null) hist.push(String(state.firstOperand));
    if (state.operator) hist.push(state.operator);
    historyEl.textContent = hist.join(" ");
  }

  function inputDigit(digit) {
    if (state.error) return;
    if (state.waitingForSecond || state.justEvaluated) {
      state.displayValue = digit;
      state.waitingForSecond = false;
      state.justEvaluated = false;
      updateUI();
      return;
    }
    if (state.displayValue === "0") {
      state.displayValue = digit;
    } else if (state.displayValue.replace("-", "").length < 16) {
      state.displayValue += digit;
    }
    updateUI();
  }

  function inputDecimal() {
    if (state.error) return;
    if (state.waitingForSecond || state.justEvaluated) {
      state.displayValue = "0.";
      state.waitingForSecond = false;
      state.justEvaluated = false;
      updateUI();
      return;
    }
    if (!state.displayValue.includes(".")) {
      state.displayValue += ".";
      updateUI();
    }
  }

  function toggleSign() {
    if (state.error) return;
    if (state.displayValue === "0") return;
    state.displayValue = state.displayValue.startsWith("-")
      ? state.displayValue.slice(1)
      : "-" + state.displayValue;
    updateUI();
  }

  function percent() {
    if (state.error) return;
    const value = Number(state.displayValue);
    const result = value / 100;
    state.displayValue = String(trimNumber(result));
    updateUI();
  }

  function backspace() {
    if (state.error) return;
    if (state.waitingForSecond || state.justEvaluated) return;
    const v = state.displayValue;
    if (v.length <= 1 || (v.length === 2 && v.startsWith("-"))) {
      state.displayValue = "0";
    } else {
      state.displayValue = v.slice(0, -1);
    }
    updateUI();
  }

  function handleOperator(nextOperator) {
    if (state.error) return;
    const inputValue = Number(state.displayValue);

    if (state.operator && state.waitingForSecond) {
      // Replace operator before typing second operand
      state.operator = nextOperator;
      updateUI();
      return;
    }

    if (state.firstOperand === null) {
      state.firstOperand = inputValue;
    } else if (state.operator) {
      const result = performCalculation(state.firstOperand, inputValue, state.operator);
      if (result === undefined) {
        state.error = true;
        state.displayValue = "Error";
        updateUI();
        return;
      }
      state.firstOperand = result;
      state.displayValue = String(trimNumber(result));
    }

    state.operator = nextOperator;
    state.waitingForSecond = true;
    state.justEvaluated = false;
    updateUI();
  }

  function equals() {
    if (state.error) return;
    if (state.operator === null || state.waitingForSecond) return;
    const second = Number(state.displayValue);
    const result = performCalculation(state.firstOperand, second, state.operator);
    if (result === undefined) {
      state.error = true;
      state.displayValue = "Error";
      updateUI();
      return;
    }
    state.displayValue = String(trimNumber(result));
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecond = false;
    state.justEvaluated = true;
    updateUI();
  }

  function performCalculation(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        if (b === 0) return undefined;
        return a / b;
      default:
        return b;
    }
  }

  function trimNumber(n) {
    // Avoid floating point noise; keep up to 12 significant digits
    const asStr = Number(n).toPrecision(12);
    // Drop trailing zeros and possible dot
    return Number(asStr).toString();
  }

  // Click handling
  keysEl.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("key")) return;

    const digit = target.getAttribute("data-digit");
    const operator = target.getAttribute("data-operator");
    const action = target.getAttribute("data-action");

    if (digit !== null) {
      inputDigit(digit);
      return;
    }

    if (operator !== null) {
      handleOperator(operator);
      return;
    }

    switch (action) {
      case "decimal":
        inputDecimal();
        break;
      case "clear":
        resetState();
        break;
      case "delete":
        backspace();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      case "equals":
        equals();
        break;
      default:
        break;
    }
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    const { key } = e;
    if ((key >= "0" && key <= "9")) {
      inputDigit(key);
      return;
    }
    if (key === ".") { inputDecimal(); return; }

    if (["+", "-", "*", "/"].includes(key)) {
      handleOperator(key);
      e.preventDefault();
      return;
    }

    if (key === "Enter" || key === "=") { equals(); e.preventDefault(); return; }
    if (key === "Backspace") { backspace(); return; }
    if (key === "Escape") { resetState(); return; }
    if (key === "%") { percent(); return; }
  });

  // Initialize
  updateUI();
})();