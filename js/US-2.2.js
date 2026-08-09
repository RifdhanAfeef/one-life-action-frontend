const APP_CONFIG = {
  // Live backend is deployed; "mock" now only powers offline UI development.
  dataMode: "api",
  apiBaseUrl: "https://one-life-action-backend.vercel.app",
  mealAssessmentEndpoint: "/assessment/meal-assessment",
};

const STORAGE_KEYS = {
  selectedMeals: "oneLifeAction.selectedMeals",
  dailyAnalysis: "oneLifeAction.dailyAnalysis",
  recommendation: "oneLifeAction.recommendation",
};

const DEFAULT_GUIDELINES = {
  sugarG: 25,
  saturatedFatG: 20,
  sodiumMg: 2000,
};

const NUTRIENT_DEFINITIONS = [
  { key: "sugarG", name: "Sugar", unit: "g" },
  { key: "sodiumMg", name: "Sodium", unit: "mg" },
  { key: "saturatedFatG", name: "Saturated fat", unit: "g" },
];

/*
 * Used only when US-2.2 is opened directly, with no US-2.1 selection in
 * session storage. These are real dish IDs from the live catalogue
 * (GET /assessment/dishes) so the page still exercises the real API.
 */
const STANDALONE_MOCK_MEALS = [
  { slot: "breakfast", id: 1191, name: "Roti canai (2 pc, with curry)", energyKcal: 1241, sugarG: 11.02, saturatedFatG: 20.17, sodiumMg: 3381 },
  { slot: "lunch", id: 843, name: "Mala xiang guo (soup)", energyKcal: 1445, sugarG: 10.94, saturatedFatG: 32.4, sodiumMg: 5954 },
  { slot: "tea", id: 777, name: "Korean spicy rice cake soup", energyKcal: 222, sugarG: 9.84, saturatedFatG: 4.48, sodiumMg: 2365 },
  { slot: "dinner", id: 1227, name: "Sambal pomfret fish", energyKcal: 1345, sugarG: 23.05, saturatedFatG: 42.3, sodiumMg: 4230 },
];

const resultsPanel = document.querySelector("#resultsPanel");
const loadingMessage = document.querySelector("#loadingMessage");
const analysisContent = document.querySelector("#analysisContent");
const analysisError = document.querySelector("#analysisError");
const analysisErrorMessage = document.querySelector("#analysisErrorMessage");
const nutrientList = document.querySelector("#nutrientList");
const energyValue = document.querySelector("#energyValue");
const flaggedCount = document.querySelector("#flaggedCount");
const guidelineSource = document.querySelector("#guidelineSource");
const priorityCard = document.querySelector("#priorityCard");
const priorityNutrient = document.querySelector("#priorityNutrient");
const priorityExplanation = document.querySelector("#priorityExplanation");
const disclaimerCard = document.querySelector("#disclaimerCard");
const healthLinkButton = document.querySelector("#healthLinkButton");
const navigationStatus = document.querySelector("#navigationStatus");

function readSelectedMeals() {
  const storedValue = sessionStorage.getItem(STORAGE_KEYS.selectedMeals);

  if (!storedValue) return [];

  try {
    const meals = JSON.parse(storedValue);
    return Array.isArray(meals) ? meals : [];
  } catch (error) {
    console.warn("Stored meal selections could not be read.", error);
    return [];
  }
}

function calculateTotals(meals) {
  return meals.reduce(
    (totals, meal) => ({
      energyKcal: totals.energyKcal + Number(meal.energyKcal || 0),
      sugarG: totals.sugarG + Number(meal.sugarG || 0),
      saturatedFatG:
        totals.saturatedFatG + Number(meal.saturatedFatG || 0),
      sodiumMg: totals.sodiumMg + Number(meal.sodiumMg || 0),
    }),
    {
      energyKcal: 0,
      sugarG: 0,
      saturatedFatG: 0,
      sodiumMg: 0,
    },
  );
}

function createAnalysis(totals, guidelines, metadata = {}) {
  const nutrients = NUTRIENT_DEFINITIONS.map((definition) => {
    const total = Number(totals[definition.key] || 0);
    const guideline = Number(guidelines[definition.key]);
    const ratio = guideline > 0 ? total / guideline : 0;

    return {
      ...definition,
      total,
      guideline,
      ratio,
      exceeded: ratio > 1,
    };
  });

  const exceededNutrients = nutrients.filter((nutrient) => nutrient.exceeded);
  const priority = [...exceededNutrients].sort((a, b) => b.ratio - a.ratio)[0] ?? null;

  return {
    totals,
    nutrients,
    priorityNutrient: priority,
    flaggedCount: exceededNutrients.length,
    guidelineSource:
      metadata.guidelineSource ??
      "Prototype guideline references for interface testing; the backend will return the final cited source.",
    disclaimer:
      metadata.disclaimer ??
      "These guideline values are general references and are not personalised medical advice.",
  };
}

function analyseMealsLocally(meals) {
  return createAnalysis(calculateTotals(meals), DEFAULT_GUIDELINES);
}

/*
 * The real backend already returns each nutrient fully compared against its
 * guideline (name, total, guideline, unit, exceeded, ratio) instead of raw
 * totals, so there is no local recalculation here — just reshape the keyed
 * object into the array NUTRIENT_DEFINITIONS/createNutrientRow expect.
 */
function normaliseApiAssessment(dailyAnalysis) {
  const nutrients = NUTRIENT_DEFINITIONS.map((definition) => ({
    ...definition,
    ...dailyAnalysis.nutrients[definition.key],
  }));

  const uniqueSources = [
    ...new Set(nutrients.map((nutrient) => nutrient.source).filter(Boolean)),
  ];

  return {
    totals: dailyAnalysis.totals,
    nutrients,
    priorityNutrient: dailyAnalysis.priorityNutrient,
    flaggedCount: nutrients.filter((nutrient) => nutrient.exceeded).length,
    guidelineSource: uniqueSources.join("; ") || "WHO / MOH daily guideline references.",
    disclaimer: dailyAnalysis.disclaimer,
  };
}

async function requestMealAssessment(meals) {
  const requestBody = {
    meals: Object.fromEntries(meals.map((meal) => [meal.slot, meal.id])),
  };

  const response = await fetch(
    `${APP_CONFIG.apiBaseUrl}${APP_CONFIG.mealAssessmentEndpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? `The meal assessment request failed (${response.status}).`);
  }

  return {
    analysis: normaliseApiAssessment(payload.dailyAnalysis),
    recommendation: payload.recommendation,
  };
}

async function getDailyAnalysis(meals) {
  if (APP_CONFIG.dataMode === "api") {
    return requestMealAssessment(meals);
  }

  return { analysis: analyseMealsLocally(meals), recommendation: null };
}

function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits });
}

function formatAmount(value, unit) {
  return `${formatNumber(value)}${unit}`;
}

function getSeverityColor(ratio) {
  if (ratio <= 1) return "#6c9f8f";
  if (ratio <= 1.5) return "#f4b842";
  if (ratio <= 2) return "#ee9b5b";
  return "#e45d52";
}

function createNutrientRow(nutrient, priorityKey) {
  const row = document.createElement("article");
  row.className = "nutrient-row";
  row.dataset.exceeded = String(nutrient.exceeded);
  row.dataset.priority = String(nutrient.key === priorityKey);
  row.style.setProperty("--row-color", getSeverityColor(nutrient.ratio));

  const top = document.createElement("div");
  top.className = "nutrient-row__top";

  const identity = document.createElement("div");
  identity.className = "nutrient-row__identity";

  const name = document.createElement("strong");
  name.textContent = nutrient.name;

  const amounts = document.createElement("div");
  amounts.className = "nutrient-row__amounts";

  const total = document.createElement("span");
  total.className = "nutrient-total";
  total.textContent = formatAmount(nutrient.total, nutrient.unit);

  const guideline = document.createElement("span");
  guideline.className = "nutrient-guideline";
  guideline.textContent = `Guideline: ${formatAmount(nutrient.guideline, nutrient.unit)}/day`;

  amounts.append(total, guideline);
  identity.append(name, amounts);

  const status = document.createElement("div");
  status.className = "nutrient-ratio";

  const ratio = document.createElement("span");
  ratio.textContent = nutrient.exceeded
    ? `${formatNumber(nutrient.ratio)}× guideline`
    : "Within guideline";

  const badge = document.createElement("span");
  badge.className = nutrient.exceeded
    ? "nutrient-badge"
    : "nutrient-badge nutrient-badge--ok";
  badge.textContent =
    nutrient.key === priorityKey
      ? "Highest ratio"
      : nutrient.exceeded
        ? "Above reference"
        : "Within reference";

  status.append(ratio, badge);
  top.append(identity, status);

  const track = document.createElement("div");
  track.className = "progress-track";
  track.setAttribute(
    "aria-label",
    `${nutrient.name}: ${formatAmount(nutrient.total, nutrient.unit)}; guideline ${formatAmount(nutrient.guideline, nutrient.unit)}`,
  );

  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = `${Math.min(nutrient.ratio, 2) * 50}%`;

  const marker = document.createElement("span");
  marker.className = "guideline-marker";
  marker.setAttribute("aria-hidden", "true");

  track.append(fill, marker);
  row.append(top, track);
  return row;
}

function saveAnalysisForNextPage(analysis, recommendation) {
  sessionStorage.setItem(STORAGE_KEYS.dailyAnalysis, JSON.stringify(analysis));

  if (recommendation) {
    sessionStorage.setItem(STORAGE_KEYS.recommendation, JSON.stringify(recommendation));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.recommendation);
  }
}

function renderAnalysis(analysis, recommendation) {
  const priorityKey = analysis.priorityNutrient?.key ?? null;

  energyValue.textContent = formatNumber(Math.round(analysis.totals.energyKcal), 0);
  flaggedCount.textContent = `${analysis.flaggedCount} ${
    analysis.flaggedCount === 1 ? "nutrient" : "nutrients"
  }`;

  nutrientList.replaceChildren(
    ...analysis.nutrients.map((nutrient) =>
      createNutrientRow(nutrient, priorityKey),
    ),
  );

  guidelineSource.textContent = `* ${analysis.guidelineSource}`;
  disclaimerCard.textContent = analysis.disclaimer;

  if (analysis.priorityNutrient) {
    priorityNutrient.textContent = analysis.priorityNutrient.name;
    priorityExplanation.textContent = `${formatNumber(
      analysis.priorityNutrient.ratio,
    )}× the daily guideline—the highest exceeded ratio in this selection.`;
    priorityCard.hidden = false;
  } else {
    priorityCard.hidden = true;
  }

  saveAnalysisForNextPage(analysis, recommendation);
  loadingMessage.hidden = true;
  analysisContent.hidden = false;
  analysisError.hidden = true;
  resultsPanel.setAttribute("aria-busy", "false");
  healthLinkButton.setAttribute("aria-disabled", "false");
}

function renderError(error) {
  loadingMessage.hidden = true;
  analysisContent.hidden = true;
  analysisError.hidden = false;
  analysisErrorMessage.textContent = error.message;
  resultsPanel.setAttribute("aria-busy", "false");
  healthLinkButton.setAttribute("aria-disabled", "true");
}

async function initialisePage() {
  healthLinkButton.setAttribute("aria-disabled", "true");

  const storedMeals = readSelectedMeals();
  const isUsingStandaloneMock = storedMeals.length === 0;
  const meals = isUsingStandaloneMock ? STANDALONE_MOCK_MEALS : storedMeals;

  if (isUsingStandaloneMock) {
    navigationStatus.textContent =
      "Showing interface-only sample totals because no US 2.1 selections were found.";
  }

  try {
    const { analysis, recommendation } = await getDailyAnalysis(meals);
    renderAnalysis(analysis, recommendation);
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

healthLinkButton.addEventListener("click", (event) => {
  if (healthLinkButton.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
  }
});

initialisePage();
