const APP_CONFIG = {
  // Keep "mock" while the backend is unavailable. Change to "api" to connect.
  dataMode: "mock",
  apiBaseUrl: "http://localhost:3000",
  swapEffectEndpoint: "/assessment/swap-effect",
};

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

function normaliseApiResult(payload, selectedSwap, dailyAnalysis) {
  const responseData = payload.data ?? payload;
  const beforeTotals =
    responseData.beforeTotals ??
    responseData.before_totals ??
    selectedSwap.beforeTotals ??
    dailyAnalysis?.totals;
  const afterTotals = responseData.afterTotals ?? responseData.after_totals;

  if (!beforeTotals || !afterTotals) {
    throw new Error("The backend response did not include before-and-after totals.");
  }

  return createResult(
    {
      ...selectedSwap,
      beforeTotals,
      afterTotals,
      priorityNutrient:
        responseData.priorityNutrient ??
        responseData.priority_nutrient ??
        selectedSwap.priorityNutrient,
      source:
        responseData.source ??
        "Swap effect returned by the backend.",
    },
    dailyAnalysis,
  );
}

async function requestSwapEffect(selectedSwap, meals, dailyAnalysis) {
  /*
   * Backend integration point. The backend should validate the approved swap,
   * retrieve both dishes, recalculate every nutrient and return the totals.
   */
  const requestBody = {
    swapId: selectedSwap.id,
    dishes: meals.map((meal) => ({
      dishId: meal.id,
      mealSlot: meal.slot,
      quantity: Number(meal.quantity ?? 1),
    })),
  };

  const response = await fetch(
    `${APP_CONFIG.apiBaseUrl}${APP_CONFIG.swapEffectEndpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    throw new Error(`The swap-effect request failed (${response.status}).`);
  }

  return normaliseApiResult(
    await response.json(),
    selectedSwap,
    dailyAnalysis,
  );
}

async function getSwapEffect(selectedSwap, meals, dailyAnalysis) {
  if (APP_CONFIG.dataMode === "api") {
    return requestSwapEffect(selectedSwap, meals, dailyAnalysis);
  }

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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

function downloadResultCard() {
  if (!currentResult) return;

  const priority = currentResult.priorityNutrient;
  const lines = wrapText(currentResult.actionText);
  const textLines = lines
    .map(
      (line, index) =>
        `<tspan x="64" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const metricY = 310 + Math.max(0, lines.length - 1) * 42;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="760" viewBox="0 0 540 760">
      <rect width="540" height="760" rx="36" fill="#173a5b"/>
      <circle cx="76" cy="72" r="22" fill="#e45d52"/>
      <text x="112" y="79" fill="#f3e6e3" font-family="Arial, sans-serif" font-size="14" font-weight="700">MY ONE LIFE ACTION</text>
      <text x="64" y="170" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">${textLines}</text>
      <line x1="64" y1="${metricY}" x2="476" y2="${metricY}" stroke="#ffffff" stroke-opacity="0.24"/>
      <text x="64" y="${metricY + 54}" fill="#f4b842" font-family="Arial, sans-serif" font-size="13" font-weight="700">MY NEW DAILY ${escapeXml(priority.name.toUpperCase())}</text>
      <text x="64" y="${metricY + 112}" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="700">${escapeXml(formatAmount(priority.after, priority.unit))}</text>
      <text x="64" y="700" fill="#d7e1e8" font-family="Arial, sans-serif" font-size="15">One familiar swap. One realistic first step.</text>
    </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "one-life-action-result.svg";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  navigationStatus.textContent = "Result card downloaded.";
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
