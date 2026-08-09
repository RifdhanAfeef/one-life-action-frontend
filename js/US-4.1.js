const STORAGE_KEYS = {
  selectedMeals: "oneLifeAction.selectedMeals",
  dailyAnalysis: "oneLifeAction.dailyAnalysis",
  recommendation: "oneLifeAction.recommendation",
  healthRiskAnalysis: "oneLifeAction.healthRiskAnalysis",
  selectedSwap: "oneLifeAction.selectedSwap",
};

const NUTRIENT_META = {
  sugarG: { name: "Sugar", unit: "g" },
  saturatedFatG: { name: "Saturated fat", unit: "g" },
  sodiumMg: { name: "Sodium", unit: "mg" },
};

const MOCK_DAILY_ANALYSIS = {
  totals: {
    energyKcal: 2130,
    sugarG: 83,
    saturatedFatG: 21,
    sodiumMg: 2540,
  },
  priorityNutrient: {
    key: "sugarG",
    name: "Sugar",
    unit: "g",
    total: 83,
    guideline: 25,
    ratio: 3.32,
  },
};

const MOCK_SELECTED_MEALS = [
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

const swapPanel = document.querySelector("#swapPanel");
const loadingMessage = document.querySelector("#loadingMessage");
const swapContent = document.querySelector("#swapContent");
const swapOptions = document.querySelector("#swapOptions");
const projectedChange = document.querySelector("#projectedChange");
const projectedNutrient = document.querySelector("#projectedNutrient");
const projectedBefore = document.querySelector("#projectedBefore");
const projectedAfter = document.querySelector("#projectedAfter");
const projectedReduction = document.querySelector("#projectedReduction");
const noSwapState = document.querySelector("#noSwapState");
const swapError = document.querySelector("#swapError");
const swapErrorMessage = document.querySelector("#swapErrorMessage");
const whyDishText = document.querySelector("#whyDishText");
const applySwapButton = document.querySelector("#applySwapButton");
const navigationStatus = document.querySelector("#navigationStatus");

let currentRecommendation = null;
let selectedOptionId = null;

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

function readFlowState() {
  const analysis = readStoredJson(STORAGE_KEYS.dailyAnalysis, null);
  const meals = readStoredJson(STORAGE_KEYS.selectedMeals, []);
  const healthContext = readStoredJson(STORAGE_KEYS.healthRiskAnalysis, null);
  const recommendation = readStoredJson(STORAGE_KEYS.recommendation, null);

  return {
    analysis: analysis && typeof analysis === "object" ? analysis : null,
    meals: Array.isArray(meals) ? meals : [],
    healthContext:
      healthContext && typeof healthContext === "object" ? healthContext : null,
    recommendation:
      recommendation && typeof recommendation === "object" ? recommendation : null,
  };
}

function capitalise(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function formatAmount(value, unit) {
  return `${formatNumber(value)}${unit}`;
}

function getPriorityNutrient(analysis, healthContext) {
  return healthContext?.priorityNutrient ?? analysis?.priorityNutrient ?? null;
}

function normalisePriorityNutrient(priority) {
  if (!priority) return null;

  return {
    key: priority.key ?? priority.nutrientKey ?? priority.nutrient_key,
    name: priority.name ?? priority.nutrientName ?? priority.nutrient_name,
    unit: priority.unit,
    total: Number(priority.total ?? priority.totalAmount ?? priority.total_amount ?? 0),
    guideline: Number(priority.guideline ?? priority.guidelineValue ?? priority.guideline_value ?? 0),
    ratio: Number(priority.ratio ?? priority.exceededRatio ?? priority.exceeded_ratio ?? 0),
  };
}

function normaliseContributor(contributor) {
  if (!contributor) return null;

  return {
    dishId: contributor.dishId ?? contributor.dish_id,
    dishName: contributor.dishName ?? contributor.dish_name,
    mealSlot: contributor.mealSlot ?? contributor.meal_slot,
    amount: Number(
      contributor.amount ?? contributor.contribution ?? contributor.value ?? 0,
    ),
  };
}

function findHighestContributor(meals, nutrientKey) {
  if (!nutrientKey || meals.length === 0) return null;

  const meal = [...meals].sort(
    (first, second) =>
      Number(second[nutrientKey] || 0) - Number(first[nutrientKey] || 0),
  )[0];

  if (!meal || Number(meal[nutrientKey] || 0) <= 0) return null;

  return {
    dishId: meal.id,
    dishName: meal.name,
    mealSlot: meal.slot,
    amount: Number(meal[nutrientKey]),
  };
}

function totalAfterDelta(beforeTotals, delta = {}) {
  return Object.fromEntries(
    Object.entries(beforeTotals).map(([key, value]) => [
      key,
      Math.max(0, Number(value || 0) + Number(delta[key] || 0)),
    ]),
  );
}

function buildMockRecommendation(analysis, meals, healthContext) {
  const priorityNutrient = normalisePriorityNutrient(
    getPriorityNutrient(analysis, healthContext),
  );
  if (!priorityNutrient) {
    return {
      priorityNutrient: null,
      highestContributor: null,
      beforeTotals: analysis.totals,
      options: [],
      source: "No priority nutrient was available for a swap lookup.",
    };
  }

  const highestContributor = normaliseContributor(
    healthContext?.highestContributor ??
      findHighestContributor(meals, priorityNutrient.key),
  );

  const mockOptions = [
    {
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
    },
    {
      id: "swap-thosai",
      fromDishId: 1,
      fromDishName: "Roti Canai",
      toDishId: 102,
      toDishName: "Thosai",
      mealSlot: "breakfast",
      reason: "A familiar breakfast option prepared with less oil.",
      nutrientDelta: {
        energyKcal: -120,
        sugarG: -2,
        saturatedFatG: -4,
        sodiumMg: -120,
      },
    },
    {
      id: "swap-chicken-rice",
      fromDishId: 2,
      fromDishName: "Nasi Lemak",
      toDishId: 103,
      toDishName: "Chicken Rice",
      mealSlot: "lunch",
      reason: "A familiar meal with a lower prototype sodium estimate.",
      nutrientDelta: {
        energyKcal: -100,
        sugarG: -3,
        saturatedFatG: -3,
        sodiumMg: -250,
      },
    },
  ];

  const optionMatchingContributor = mockOptions.find(
    (option) => option.fromDishId === highestContributor?.dishId,
  );
  const orderedOptions = optionMatchingContributor
    ? [
        optionMatchingContributor,
        ...mockOptions.filter((option) => option !== optionMatchingContributor),
      ]
    : mockOptions;

  return {
    priorityNutrient,
    highestContributor,
    beforeTotals: analysis.totals,
    options: orderedOptions.map((option) => ({
      ...option,
      afterTotals: totalAfterDelta(analysis.totals, option.nutrientDelta),
    })),
    source:
      "Interface-only approved-swap examples; the backend will replace these with database records.",
  };
}

/*
 * The swap and its impact are not their own endpoint — both come back inside
 * the same POST /assessment/meal-assessment response that US-2.2 already
 * requested (recommendation.recommendation / .impact / .revisedTotals), so
 * this page reshapes what US-2.2 stored instead of calling the backend again.
 * The backend returns at most one approved swap, so it is rendered as a
 * single pre-selected option in the existing options list.
 */
function buildRecommendationFromApi(recommendation, analysis, meals) {
  const priorityNutrient = normalisePriorityNutrient(recommendation.priorityNutrient);
  const highestContributor = priorityNutrient
    ? findHighestContributor(meals, priorityNutrient.key)
    : null;

  if (!recommendation.recommendationRequired) {
    return {
      priorityNutrient: null,
      highestContributor: null,
      beforeTotals: analysis.totals,
      options: [],
      source: recommendation.message ?? "No assessed nutrient exceeds its guideline value.",
    };
  }

  if (!recommendation.swapAvailable || !recommendation.recommendation) {
    return {
      priorityNutrient,
      highestContributor,
      beforeTotals: analysis.totals,
      options: [],
      source: recommendation.message ?? "No validated swap is currently available for this dish.",
    };
  }

  const swap = recommendation.recommendation;
  const reduction = Math.abs(recommendation.impact?.absoluteReduction ?? 0);

  const option = {
    id: String(swap.swapId),
    fromDishId: swap.originalDish.dishId,
    fromDishName: swap.originalDish.name,
    toDishId: swap.replacementDish.dishId,
    toDishName: swap.replacementDish.name,
    mealSlot: swap.mealSlot,
    reason: swap.explanation ?? swap.reason,
    nutrientDelta: priorityNutrient ? { [priorityNutrient.key]: -reduction } : {},
    afterTotals: recommendation.revisedTotals ?? analysis.totals,
  };

  return {
    priorityNutrient,
    highestContributor,
    beforeTotals: analysis.totals,
    options: [option],
    source: "Approved swap recommendation from the backend's swap table.",
  };
}

async function getSwapRecommendation(analysis, meals, healthContext, recommendation) {
  if (recommendation) {
    return buildRecommendationFromApi(recommendation, analysis, meals);
  }

  return buildMockRecommendation(analysis, meals, healthContext);
}

function getImpactText(option, priorityNutrient) {
  const nutrientKey = priorityNutrient?.key;
  const meta = NUTRIENT_META[nutrientKey] ?? {
    name: priorityNutrient?.name ?? "Nutrient",
    unit: priorityNutrient?.unit ?? "",
  };
  const reduction = Math.abs(Number(option.nutrientDelta?.[nutrientKey] || 0));

  return reduction > 0
    ? `−${formatAmount(reduction, meta.unit)} ${meta.name.toLowerCase()}`
    : `Approved ${meta.name.toLowerCase()} swap`;
}

function createSwapOption(option, priorityNutrient, index) {
  const label = document.createElement("label");
  label.className = "swap-option";
  label.dataset.selected = String(index === 0);

  const input = document.createElement("input");
  input.type = "radio";
  input.name = "approvedSwap";
  input.value = String(option.id);
  input.checked = index === 0;

  const copy = document.createElement("span");
  copy.className = "swap-option__copy";

  const title = document.createElement("strong");
  title.textContent = `${option.toDishName} instead of ${option.fromDishName}`;

  const reason = document.createElement("p");
  reason.textContent = option.reason;
  copy.append(title, reason);

  const impact = document.createElement("span");
  impact.className = "swap-impact";
  impact.textContent = getImpactText(option, priorityNutrient);

  input.addEventListener("change", () => selectOption(option.id));
  label.append(input, copy, impact);
  return label;
}

function saveSelectedSwap(option) {
  const selectedSwap = {
    ...option,
    priorityNutrient: currentRecommendation.priorityNutrient,
    highestContributor: currentRecommendation.highestContributor,
    beforeTotals: currentRecommendation.beforeTotals,
    source: currentRecommendation.source,
  };

  sessionStorage.setItem(
    STORAGE_KEYS.selectedSwap,
    JSON.stringify(selectedSwap),
  );
}

function renderProjectedChange(option) {
  const priority = currentRecommendation.priorityNutrient;
  if (!priority?.key) {
    projectedChange.hidden = true;
    return;
  }

  const meta = NUTRIENT_META[priority.key] ?? {
    name: priority.name,
    unit: priority.unit,
  };
  const before = Number(currentRecommendation.beforeTotals[priority.key] || 0);
  const after = Number(option.afterTotals[priority.key] || 0);
  const reduction = Math.max(0, before - after);

  projectedNutrient.textContent = meta.name;
  projectedBefore.textContent = formatAmount(before, meta.unit);
  projectedAfter.textContent = formatAmount(after, meta.unit);
  projectedReduction.textContent = `${formatAmount(reduction, meta.unit)} lower with this swap`;
  projectedChange.hidden = false;
}

function selectOption(optionId) {
  const option = currentRecommendation?.options.find(
    (candidate) => String(candidate.id) === String(optionId),
  );
  if (!option) return;

  selectedOptionId = String(option.id);
  [...swapOptions.querySelectorAll(".swap-option")].forEach((label) => {
    const input = label.querySelector("input");
    const isSelected = input.value === selectedOptionId;
    label.dataset.selected = String(isSelected);
    input.checked = isSelected;
  });

  renderProjectedChange(option);
  saveSelectedSwap(option);
  applySwapButton.setAttribute("aria-disabled", "false");
}

function renderRecommendation(recommendation) {
  currentRecommendation = recommendation;
  const priority = recommendation.priorityNutrient;
  const contributor = recommendation.highestContributor;

  if (priority && contributor) {
    const meta = NUTRIENT_META[priority.key] ?? {
      name: priority.name,
      unit: priority.unit,
    };
    whyDishText.textContent = `${contributor.dishName} (${capitalise(
      contributor.mealSlot,
    )}) contributed the most ${meta.name.toLowerCase()} among the selected meals—${formatAmount(
      contributor.amount,
      meta.unit,
    )} on its own.`;
  } else {
    whyDishText.textContent =
      "No exceeded priority nutrient was available for a targeted recommendation.";
  }

  const hasOptions = recommendation.options.length > 0;
  swapOptions.replaceChildren(
    ...recommendation.options.map((option, index) =>
      createSwapOption(option, priority, index),
    ),
  );
  swapOptions.hidden = !hasOptions;
  noSwapState.hidden = hasOptions;
  projectedChange.hidden = true;

  if (hasOptions) {
    selectOption(recommendation.options[0].id);
  } else {
    selectedOptionId = null;
    sessionStorage.removeItem(STORAGE_KEYS.selectedSwap);
    applySwapButton.setAttribute("aria-disabled", "true");
  }

  loadingMessage.hidden = true;
  swapContent.hidden = false;
  swapError.hidden = true;
  swapPanel.setAttribute("aria-busy", "false");
}

function renderError(error) {
  loadingMessage.hidden = true;
  swapContent.hidden = true;
  swapError.hidden = false;
  swapErrorMessage.textContent = error.message;
  swapPanel.setAttribute("aria-busy", "false");
  applySwapButton.setAttribute("aria-disabled", "true");
}

async function initialisePage() {
  applySwapButton.setAttribute("aria-disabled", "true");
  const state = readFlowState();
  const isUsingStandaloneMock = !state.analysis;
  const analysis = state.analysis ?? MOCK_DAILY_ANALYSIS;
  const meals = state.meals.length > 0 ? state.meals : MOCK_SELECTED_MEALS;

  if (isUsingStandaloneMock) {
    navigationStatus.textContent =
      "Showing interface-only swap examples because no earlier assessment was found.";
  }

  try {
    renderRecommendation(
      await getSwapRecommendation(analysis, meals, state.healthContext, state.recommendation),
    );
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

applySwapButton.addEventListener("click", (event) => {
  if (
    applySwapButton.getAttribute("aria-disabled") === "true" ||
    !selectedOptionId
  ) {
    event.preventDefault();
  }
});

initialisePage();
