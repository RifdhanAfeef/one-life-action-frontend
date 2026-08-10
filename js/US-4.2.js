const STORAGE_KEYS = {
  selectedMeals: "oneLifeAction.selectedMeals",
  dailyAnalysis: "oneLifeAction.dailyAnalysis",
  selectedSwap: "oneLifeAction.selectedSwap",
  finalResult: "oneLifeAction.finalResult",
};

const TOTAL_DEFINITIONS = [
  { key: "energyKcal", label: "Energy", unit: " kcal" },
  { key: "sugarG", label: "Sugar", unit: "g" },
  { key: "saturatedFatG", label: "Saturated fat", unit: "g" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

const MOCK_SELECTED_SWAP = {
  id: "swap-teh-o-kosong",
  fromDishId: 3,
  fromDishName: "Teh Tarik",
  toDishId: 101,
  toDishName: "Teh O Kosong",
  mealSlot: "tea",
  reason: "The same tea occasion without added sugar.",
  nutrientDelta: {
    energyKcal: -120,
    sugarG: -48,
    saturatedFatG: 0,
    sodiumMg: 0,
  },
  beforeTotals: {
    energyKcal: 2130,
    sugarG: 83,
    saturatedFatG: 21,
    sodiumMg: 2540,
  },
  afterTotals: {
    energyKcal: 2010,
    sugarG: 35,
    saturatedFatG: 21,
    sodiumMg: 2540,
  },
  priorityNutrient: {
    key: "sugarG",
    name: "Sugar",
    unit: "g",
    guideline: 25,
  },
  source: "Interface-only approved-swap example.",
};

const resultPanel = document.querySelector("#resultPanel");
const loadingMessage = document.querySelector("#loadingMessage");
const resultContent = document.querySelector("#resultContent");
const resultError = document.querySelector("#resultError");
const resultErrorMessage = document.querySelector("#resultErrorMessage");
const resultSummary = document.querySelector("#resultSummary");
const summaryLabel = document.querySelector("#summaryLabel");
const summaryAfter = document.querySelector("#summaryAfter");
const summaryBefore = document.querySelector("#summaryBefore");
const summaryReduction = document.querySelector("#summaryReduction");
const guidelineStatus = document.querySelector("#guidelineStatus");
const actionText = document.querySelector("#actionText");
const actionMetricLabel = document.querySelector("#actionMetricLabel");
const actionMetricAfter = document.querySelector("#actionMetricAfter");
const actionMetricBefore = document.querySelector("#actionMetricBefore");
const totalsList = document.querySelector("#totalsList");
const totalsReduction = document.querySelector("#totalsReduction");
const resultDisclaimer = document.querySelector("#resultDisclaimer");
const sourceNote = document.querySelector("#sourceNote");
const downloadButton = document.querySelector("#downloadButton");
const copyButton = document.querySelector("#copyButton");
const navigationStatus = document.querySelector("#navigationStatus");

let currentResult = null;

function readStoredJson(key, fallbackValue) {
  const storedValue = sessionStorage.getItem(key);
  if (!storedValue) return fallbackValue;

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(`Stored value for ${key} could not be read.`, error);
    return fallbackValue;
  }
}

function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function formatAmount(value, unit) {
  return `${formatNumber(value)}${unit}`;
}

function totalAfterDelta(beforeTotals, delta = {}) {
  return Object.fromEntries(
    Object.entries(beforeTotals).map(([key, value]) => [
      key,
      Math.max(0, Number(value || 0) + Number(delta[key] || 0)),
    ]),
  );
}

function normalisePriorityNutrient(priority) {
  if (!priority) return null;

  return {
    key: priority.key ?? priority.nutrientKey ?? priority.nutrient_key,
    name: priority.name ?? priority.nutrientName ?? priority.nutrient_name,
    unit: priority.unit,
    guideline: Number(
      priority.guideline ?? priority.guidelineValue ?? priority.guideline_value ?? 0,
    ),
  };
}

function createResult(selectedSwap, dailyAnalysis = null) {
  const beforeTotals =
    selectedSwap.beforeTotals ?? dailyAnalysis?.totals ?? {};
  const afterTotals =
    selectedSwap.afterTotals ??
    totalAfterDelta(beforeTotals, selectedSwap.nutrientDelta);
  const priority = normalisePriorityNutrient(
    selectedSwap.priorityNutrient ?? dailyAnalysis?.priorityNutrient,
  );

  if (!priority?.key || beforeTotals[priority.key] === undefined) {
    throw new Error("The selected swap did not include a priority nutrient total.");
  }

  const before = Number(beforeTotals[priority.key]);
  const after = Number(afterTotals[priority.key]);
  const absoluteReduction = Math.max(0, before - after);
  const percentReduction = before > 0 ? (absoluteReduction / before) * 100 : 0;
  const guideline = Number(priority.guideline || 0);

  return {
    selectedSwap,
    priorityNutrient: {
      ...priority,
      before,
      after,
      guideline,
    },
    beforeTotals,
    afterTotals,
    absoluteReduction,
    percentReduction,
    stillAboveGuideline: guideline > 0 ? after > guideline : false,
    actionText: `During my next working day, I'll choose ${selectedSwap.toDishName} instead of ${selectedSwap.fromDishName}.`,
    source:
      selectedSwap.source ??
      "Interface-only result calculated from the selected mock swap.",
    disclaimer:
      "This is a recalculated daily estimate, not a diagnosis or a promise of a health outcome.",
  };
}


async function getSwapEffect(selectedSwap, meals, dailyAnalysis) {
  return createResult(selectedSwap, dailyAnalysis);
}

function createTotalEntries(result) {
  const fragment = document.createDocumentFragment();

  TOTAL_DEFINITIONS.forEach((definition) => {
    if (result.beforeTotals[definition.key] === undefined) return;

    const before = Number(result.beforeTotals[definition.key]);
    const after = Number(result.afterTotals[definition.key]);
    const changed = before !== after;

    const term = document.createElement("dt");
    term.textContent = definition.label;

    const description = document.createElement("dd");
    description.dataset.changed = String(changed);
    description.textContent = changed
      ? `${formatAmount(before, definition.unit)} → ${formatAmount(after, definition.unit)}`
      : formatAmount(after, definition.unit);

    fragment.append(term, description);
  });

  return fragment;
}

function saveFinalResult(result) {
  sessionStorage.setItem(STORAGE_KEYS.finalResult, JSON.stringify(result));
}

function renderResult(result) {
  currentResult = result;
  const priority = result.priorityNutrient;
  const unit = priority.unit ?? "";
  const name = priority.name ?? "Priority nutrient";
  const afterAmount = formatAmount(priority.after, unit);
  const beforeAmount = formatAmount(priority.before, unit);
  const reductionAmount = formatAmount(result.absoluteReduction, unit);

  summaryLabel.textContent = `Your new daily ${name.toLowerCase()}`;
  summaryAfter.textContent = afterAmount;
  summaryBefore.textContent = `was ${beforeAmount}`;
  summaryReduction.textContent = `${reductionAmount} lower · ${formatNumber(
    result.percentReduction,
  )}% reduction`;
  guidelineStatus.textContent = priority.guideline
    ? result.stillAboveGuideline
      ? `Still above the ~${formatAmount(priority.guideline, unit)} guideline`
      : `Now within the ~${formatAmount(priority.guideline, unit)} guideline`
    : "No guideline comparison was supplied.";
  resultSummary.dataset.within = String(!result.stillAboveGuideline);
  resultSummary.hidden = false;

  actionText.textContent = result.actionText;
  actionMetricLabel.textContent = `My new daily ${name.toLowerCase()}`;
  actionMetricAfter.textContent = afterAmount;
  actionMetricBefore.textContent = `↓ from ${beforeAmount}`;

  totalsList.replaceChildren(createTotalEntries(result));
  totalsReduction.textContent = `${name} reduction: ${reductionAmount} · ${formatNumber(
    result.percentReduction,
  )}%`;
  resultDisclaimer.textContent = result.disclaimer;
  sourceNote.textContent = `Source: ${result.source}`;

  saveFinalResult(result);
  loadingMessage.hidden = true;
  resultContent.hidden = false;
  resultError.hidden = true;
  resultPanel.setAttribute("aria-busy", "false");
  downloadButton.disabled = false;
  copyButton.disabled = false;
}

function renderError(error) {
  loadingMessage.hidden = true;
  resultContent.hidden = true;
  resultError.hidden = false;
  resultErrorMessage.textContent = error.message;
  resultPanel.setAttribute("aria-busy", "false");
  downloadButton.disabled = true;
  copyButton.disabled = true;
}

function wrapText(value, maximumCharacters = 29) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maximumCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawRoundedRectangle(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function createResultCardCanvas(result, scale = 2) {
  const width = 540;
  const height = 760;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The browser could not create the image canvas.");
  }

  context.scale(scale, scale);

  context.fillStyle = "#fffdf8";
  context.fillRect(0, 0, width, height);
  drawRoundedRectangle(context, 0, 0, width, height, 36);
  context.fillStyle = "#173a5b";
  context.fill();

  context.beginPath();
  context.arc(76, 72, 22, 0, Math.PI * 2);
  context.fillStyle = "#e45d52";
  context.fill();

  context.fillStyle = "#f3e6e3";
  context.font = "700 14px Arial, sans-serif";
  context.fillText("MY ONE LIFE ACTION", 112, 79);

  const actionLines = wrapText(result.actionText);
  context.fillStyle = "#ffffff";
  context.font = "700 34px Arial, sans-serif";
  actionLines.forEach((line, index) => {
    context.fillText(line, 64, 170 + index * 42);
  });

  const metricY = 310 + Math.max(0, actionLines.length - 1) * 42;
  context.beginPath();
  context.moveTo(64, metricY);
  context.lineTo(476, metricY);
  context.strokeStyle = "rgba(255, 255, 255, 0.24)";
  context.lineWidth = 1;
  context.stroke();

  const priority = result.priorityNutrient;
  context.fillStyle = "#f4b842";
  context.font = "700 13px Arial, sans-serif";
  context.fillText(
    `MY NEW DAILY ${String(priority.name).toUpperCase()}`,
    64,
    metricY + 54,
  );

  const afterText = formatAmount(priority.after, priority.unit);
  context.fillStyle = "#ffffff";
  context.font = "700 48px Arial, sans-serif";
  context.fillText(afterText, 64, metricY + 112);

  const afterWidth = context.measureText(afterText).width;
  context.fillStyle = "#d7e1e8";
  context.font = "700 17px Arial, sans-serif";
  context.fillText(
    `↓ from ${formatAmount(priority.before, priority.unit)}`,
    64 + afterWidth + 18,
    metricY + 106,
  );

  context.fillStyle = "#ffffff";
  context.font = "700 15px Arial, sans-serif";
  context.fillText(
    "One familiar swap. One realistic first step.",
    64,
    700,
  );

  return canvas;
}

async function downloadResultCard() {
  if (!currentResult) return;

  downloadButton.disabled = true;
  navigationStatus.textContent = "Preparing your image result card…";

  try {
    const canvas = createResultCardCanvas(currentResult);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    if (!imageDataUrl.startsWith("data:image/jpeg") || imageDataUrl.length < 1000) {
      throw new Error("The browser returned an empty card image.");
    }

    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "one-life-action-result-v2.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();

    navigationStatus.textContent = "JPEG result card downloaded.";
  } catch (error) {
    console.error("The image result card could not be generated.", error);
    navigationStatus.textContent =
      "The image could not be generated. Please try again.";
  } finally {
    downloadButton.disabled = false;
  }
}

async function copyActionText() {
  if (!currentResult) return;

  try {
    await navigator.clipboard.writeText(currentResult.actionText);
    navigationStatus.textContent = "Action text copied.";
  } catch (error) {
    console.warn("Clipboard access was unavailable.", error);
    navigationStatus.textContent =
      "Copy was blocked by the browser. Select the action text manually.";
  }
}

async function initialisePage() {
  downloadButton.disabled = true;
  copyButton.disabled = true;

  const storedSwap = readStoredJson(STORAGE_KEYS.selectedSwap, null);
  const dailyAnalysis = readStoredJson(STORAGE_KEYS.dailyAnalysis, null);
  const selectedMeals = readStoredJson(STORAGE_KEYS.selectedMeals, []);
  const isUsingStandaloneMock = !storedSwap;
  const selectedSwap = storedSwap ?? MOCK_SELECTED_SWAP;
  const meals = Array.isArray(selectedMeals) ? selectedMeals : [];

  if (isUsingStandaloneMock) {
    navigationStatus.textContent =
      "Showing an interface-only result because no US 4.1 selection was found.";
  }

  try {
    renderResult(await getSwapEffect(selectedSwap, meals, dailyAnalysis));
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

downloadButton.addEventListener("click", downloadResultCard);
copyButton.addEventListener("click", copyActionText);

initialisePage();
