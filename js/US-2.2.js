const APP_CONFIG = {
  // Keep "mock" while the backend is unavailable. Change to "api" to connect.
  dataMode: "mock",
  apiBaseUrl: "http://localhost:3000",
  mealAssessmentEndpoint: "/assessment/meal-assessment",
};

const STORAGE_KEYS = {
  selectedMeals: "oneLifeAction.selectedMeals",
  dailyAnalysis: "oneLifeAction.dailyAnalysis",
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

/* Used only when US-2.2 is opened directly during interface development. */
const STANDALONE_MOCK_MEALS = [
  {
    slot: "breakfast",
    id: 1,
    name: "Roti Canai",
    energyKcal: 650,
    sugarG: 18,
    saturatedFatG: 7,
    sodiumMg: 680,
  },
  {
    slot: "lunch",
    id: 2,
    name: "Nasi Lemak",
    energyKcal: 680,
    sugarG: 12,
    saturatedFatG: 6,
    sodiumMg: 890,
  },
  {
    slot: "tea",
    id: 3,
    name: "Teh Tarik",
    energyKcal: 180,
    sugarG: 48,
    saturatedFatG: 3,
    sodiumMg: 120,
  },
  {
    slot: "dinner",
    id: 4,
    name: "Chicken Rice",
    energyKcal: 620,
    sugarG: 5,
    saturatedFatG: 5,
    sodiumMg: 850,
  },
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

function normaliseApiAssessment(payload) {
  const responseData = payload.data ?? payload;
  const totals = responseData.totals ?? responseData.dailyTotals;
  const guidelines = responseData.guidelines ?? DEFAULT_GUIDELINES;

  if (!totals) {
    throw new Error("The backend response did not include daily nutrient totals.");
  }

  return createAnalysis(totals, guidelines, {
    guidelineSource: responseData.guidelineSource,
    disclaimer: responseData.disclaimer,
  });
}

async function requestMealAssessment(meals) {
  /*
   * Backend integration point.
   * Confirm the final request field names with the backend teammate. Keeping
   * the mapping here prevents API naming changes from affecting the UI.
   */
  const requestBody = {
    dishes: meals.map((meal) => ({
      dishId: meal.id,
      quantity: Number(meal.quantity ?? 1),
      mealSlot: meal.slot,
    })),
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

  if (!response.ok) {
    throw new Error(`The meal assessment request failed (${response.status}).`);
  }

  return normaliseApiAssessment(await response.json());
}

async function getDailyAnalysis(meals) {
  if (APP_CONFIG.dataMode === "api") {
    return requestMealAssessment(meals);
  }

  return analyseMealsLocally(meals);
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

function saveAnalysisForNextPage(analysis) {
  sessionStorage.setItem(STORAGE_KEYS.dailyAnalysis, JSON.stringify(analysis));
}

function renderAnalysis(analysis) {
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

  saveAnalysisForNextPage(analysis);
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
    renderAnalysis(await getDailyAnalysis(meals));
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
