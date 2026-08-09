const STORAGE_KEYS = {
  selectedMeals: "oneLifeAction.selectedMeals",
  dailyAnalysis: "oneLifeAction.dailyAnalysis",
  recommendation: "oneLifeAction.recommendation",
  healthRiskAnalysis: "oneLifeAction.healthRiskAnalysis",
};

const MOCK_DAILY_ANALYSIS = {
  totals: {
    energyKcal: 2130,
    sugarG: 83,
    saturatedFatG: 21,
    sodiumMg: 2540,
  },
  nutrients: [
    {
      key: "sugarG",
      name: "Sugar",
      unit: "g",
      total: 83,
      guideline: 25,
      ratio: 3.32,
      exceeded: true,
    },
    {
      key: "sodiumMg",
      name: "Sodium",
      unit: "mg",
      total: 2540,
      guideline: 2000,
      ratio: 1.27,
      exceeded: true,
    },
    {
      key: "saturatedFatG",
      name: "Saturated fat",
      unit: "g",
      total: 21,
      guideline: 20,
      ratio: 1.05,
      exceeded: true,
    },
  ],
  priorityNutrient: {
    key: "sugarG",
    name: "Sugar",
    unit: "g",
    total: 83,
    guideline: 25,
    ratio: 3.32,
    exceeded: true,
  },
  flaggedCount: 3,
};

const MOCK_SELECTED_MEALS = [
  {
    slot: "breakfast",
    id: 1,
    name: "Roti Canai",
    sugarG: 18,
    saturatedFatG: 7,
    sodiumMg: 680,
  },
  {
    slot: "lunch",
    id: 2,
    name: "Nasi Lemak",
    sugarG: 12,
    saturatedFatG: 6,
    sodiumMg: 890,
  },
  {
    slot: "tea",
    id: 3,
    name: "Teh Tarik",
    sugarG: 48,
    saturatedFatG: 3,
    sodiumMg: 120,
  },
  {
    slot: "dinner",
    id: 4,
    name: "Chicken Rice",
    sugarG: 5,
    saturatedFatG: 5,
    sodiumMg: 850,
  },
];

const MOCK_RELATIONSHIPS = {
  sugarG: {
    nutrientKey: "sugarG",
    nutrientName: "Sugar",
    riskFactor: "Blood glucose / insulin resistance",
    condition: "Type 2 diabetes and obesity",
    mortalityContext: "Diabetes in age-group data",
  },
  sodiumMg: {
    nutrientKey: "sodiumMg",
    nutrientName: "Sodium",
    riskFactor: "Raised blood pressure",
    condition: "Hypertension",
    mortalityContext: "Heart disease and stroke",
  },
  saturatedFatG: {
    nutrientKey: "saturatedFatG",
    nutrientName: "Saturated fat",
    riskFactor: "Raised LDL cholesterol",
    condition: "High cholesterol",
    mortalityContext: "Ischaemic heart disease",
  },
};

const healthPanel = document.querySelector("#healthPanel");
const loadingMessage = document.querySelector("#loadingMessage");
const healthContent = document.querySelector("#healthContent");
const healthError = document.querySelector("#healthError");
const healthErrorMessage = document.querySelector("#healthErrorMessage");
const relationshipList = document.querySelector("#relationshipList");
const emptyRelationships = document.querySelector("#emptyRelationships");
const relationshipNote = document.querySelector("#relationshipNote");
const sourceNote = document.querySelector("#sourceNote");
const strongestLink = document.querySelector("#strongestLink");
const noPriorityCard = document.querySelector("#noPriorityCard");
const priorityName = document.querySelector("#priorityName");
const prioritySummary = document.querySelector("#prioritySummary");
const contributorSummary = document.querySelector("#contributorSummary");
const swapButton = document.querySelector("#swapButton");
const navigationStatus = document.querySelector("#navigationStatus");

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

function readDailyAnalysis() {
  const analysis = readStoredJson(STORAGE_KEYS.dailyAnalysis, null);
  return analysis && typeof analysis === "object" ? analysis : null;
}

function readSelectedMeals() {
  const meals = readStoredJson(STORAGE_KEYS.selectedMeals, []);
  return Array.isArray(meals) ? meals : [];
}

function readRecommendation() {
  const recommendation = readStoredJson(STORAGE_KEYS.recommendation, null);
  return recommendation && typeof recommendation === "object" ? recommendation : null;
}

function getFlaggedNutrients(analysis) {
  const nutrients = Array.isArray(analysis.nutrients) ? analysis.nutrients : [];
  const flagged = nutrients.filter(
    (nutrient) => nutrient.exceeded === true || Number(nutrient.ratio) > 1,
  );

  if (flagged.length > 0) return flagged;
  return analysis.priorityNutrient ? [analysis.priorityNutrient] : [];
}

function getPriorityNutrient(analysis, flaggedNutrients) {
  if (analysis.priorityNutrient) return analysis.priorityNutrient;

  return [...flaggedNutrients].sort(
    (first, second) => Number(second.ratio || 0) - Number(first.ratio || 0),
  )[0] ?? null;
}

function capitalise(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function findHighestContributor(meals, nutrientKey) {
  if (!nutrientKey || meals.length === 0) return null;

  const sortedMeals = [...meals].sort(
    (first, second) =>
      Number(second[nutrientKey] || 0) - Number(first[nutrientKey] || 0),
  );
  const meal = sortedMeals[0];

  if (!meal || Number(meal[nutrientKey] || 0) <= 0) return null;

  return {
    mealSlot: meal.slot,
    dishId: meal.id,
    dishName: meal.name,
    amount: Number(meal[nutrientKey]),
  };
}

function createMockHealthContext(analysis, meals) {
  const flaggedNutrients = getFlaggedNutrients(analysis);
  const priorityNutrient = getPriorityNutrient(analysis, flaggedNutrients);
  const relationships = flaggedNutrients
    .map((nutrient) => MOCK_RELATIONSHIPS[nutrient.key])
    .filter(Boolean);

  return {
    priorityNutrient,
    highestContributor: findHighestContributor(meals, priorityNutrient?.key),
    relationships,
    source:
      "Interface-only health associations for testing; the backend will return the final cited source.",
    disclaimer:
      "These links describe relevant nutrients and associated risk factors. They are not a diagnosis, a guarantee, or proof that one meal causes a disease.",
  };
}

/*
 * The health-relationship data is not its own endpoint — it comes back
 * inside the same POST /assessment/meal-assessment response that US-2.2
 * already requested (recommendation.healthRelationship), so this page just
 * reshapes what US-2.2 stored rather than calling the backend again.
 */
function getContributorFromRecommendation(recommendation) {
  if (recommendation.recommendation) {
    return {
      mealSlot: recommendation.recommendation.mealSlot,
      dishId: recommendation.recommendation.originalDish.dishId,
      dishName: recommendation.recommendation.originalDish.name,
    };
  }

  if (recommendation.highestContributingMeal) {
    return {
      mealSlot: recommendation.highestContributingMeal.slot,
      dishId: recommendation.highestContributingMeal.dish.dishId,
      dishName: recommendation.highestContributingMeal.dish.name,
    };
  }

  return null;
}

function buildContextFromRecommendation(recommendation) {
  if (!recommendation.recommendationRequired) {
    return {
      priorityNutrient: null,
      highestContributor: null,
      relationships: [],
      source: "NHMS 2023 / WHO",
      disclaimer: recommendation.message ?? "No assessed nutrient exceeds its guideline value.",
    };
  }

  const priorityNutrient = recommendation.priorityNutrient;
  const relationships = (recommendation.healthRelationship ?? []).map((row) => ({
    nutrientKey: priorityNutrient.key,
    nutrientName: priorityNutrient.name,
    riskFactor: row.mechanism,
    condition: row.condition_name,
    mortalityContext: row.cause_of_death ?? "Not separately recorded as a leading cause of death",
  }));

  return {
    priorityNutrient,
    highestContributor: getContributorFromRecommendation(recommendation),
    relationships,
    source: recommendation.healthRelationship?.[0]?.source ?? "NHMS 2023 / WHO",
    disclaimer:
      "These links describe associations and do not calculate personal risk.",
  };
}

async function getHealthRiskContext(analysis, meals, recommendation) {
  if (recommendation) {
    return buildContextFromRecommendation(recommendation);
  }

  return createMockHealthContext(analysis, meals);
}

function getRelationshipColor(nutrientKey) {
  if (nutrientKey === "sugarG") return "#e45d52";
  if (nutrientKey === "sodiumMg") return "#ee9b5b";
  return "#f4b842";
}

function createRelationshipNode(modifier, label, value) {
  const node = document.createElement("div");
  node.className = `relationship-node relationship-node--${modifier}`;

  const text = document.createElement("strong");
  text.textContent = value || "Context unavailable";

  const caption = document.createElement("small");
  caption.textContent = label;

  node.append(text, caption);
  return node;
}

function createArrow() {
  const arrow = document.createElement("span");
  arrow.className = "relationship-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  return arrow;
}

function createRelationshipRow(relationship, priorityKey) {
  const row = document.createElement("article");
  row.className = "relationship-row";
  row.dataset.priority = String(relationship.nutrientKey === priorityKey);
  row.style.setProperty(
    "--row-color",
    getRelationshipColor(relationship.nutrientKey),
  );
  row.setAttribute("role", "listitem");

  row.append(
    createRelationshipNode(
      "nutrient",
      "Flagged nutrient",
      relationship.nutrientName,
    ),
    createArrow(),
    createRelationshipNode(
      "factor",
      "Associated risk factor",
      relationship.riskFactor,
    ),
    createArrow(),
    createRelationshipNode(
      "condition",
      "Associated condition",
      relationship.condition,
    ),
    createArrow(),
    createRelationshipNode(
      "mortality",
      "Mortality context",
      relationship.mortalityContext,
    ),
  );

  return row;
}

function saveHealthContextForNextPage(context) {
  sessionStorage.setItem(
    STORAGE_KEYS.healthRiskAnalysis,
    JSON.stringify(context),
  );
}

function renderPriority(context) {
  const priority = context.priorityNutrient;

  if (!priority) {
    strongestLink.hidden = true;
    noPriorityCard.hidden = false;
    return;
  }

  priorityName.textContent = priority.name ?? priority.nutrientName ?? "Priority nutrient";
  prioritySummary.textContent = `${formatNumber(
    priority.ratio,
  )}× the daily guideline—the highest exceeded ratio.`;

  if (context.highestContributor?.dishName) {
    contributorSummary.textContent = `${capitalise(
      context.highestContributor.mealSlot,
    )} — ${context.highestContributor.dishName} contributed the most to this nutrient among the selected meals.`;
    contributorSummary.hidden = false;
  } else {
    contributorSummary.hidden = true;
  }

  noPriorityCard.hidden = true;
  strongestLink.hidden = false;
}

function renderHealthContext(context) {
  const priorityKey =
    context.priorityNutrient?.key ?? context.priorityNutrient?.nutrientKey ?? null;

  renderPriority(context);
  relationshipList.replaceChildren(
    ...context.relationships.map((relationship) =>
      createRelationshipRow(relationship, priorityKey),
    ),
  );

  const hasRelationships = context.relationships.length > 0;
  relationshipList.hidden = !hasRelationships;
  emptyRelationships.hidden = hasRelationships;
  relationshipNote.textContent = context.disclaimer;
  sourceNote.textContent = `Source: ${context.source}`;

  saveHealthContextForNextPage(context);
  loadingMessage.hidden = true;
  healthContent.hidden = false;
  healthError.hidden = true;
  healthPanel.setAttribute("aria-busy", "false");
  swapButton.setAttribute("aria-disabled", "false");
}

function renderError(error) {
  loadingMessage.hidden = true;
  healthContent.hidden = true;
  healthError.hidden = false;
  healthErrorMessage.textContent = error.message;
  healthPanel.setAttribute("aria-busy", "false");
  swapButton.setAttribute("aria-disabled", "true");
}

async function initialisePage() {
  swapButton.setAttribute("aria-disabled", "true");

  const storedAnalysis = readDailyAnalysis();
  const storedMeals = readSelectedMeals();
  const storedRecommendation = readRecommendation();
  const isUsingStandaloneMock = !storedAnalysis;
  const analysis = storedAnalysis ?? MOCK_DAILY_ANALYSIS;
  const meals = storedMeals.length > 0 ? storedMeals : MOCK_SELECTED_MEALS;

  if (isUsingStandaloneMock) {
    navigationStatus.textContent =
      "Showing interface-only sample links because no US 2.2 analysis was found.";
  }

  try {
    renderHealthContext(await getHealthRiskContext(analysis, meals, storedRecommendation));
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

swapButton.addEventListener("click", (event) => {
  if (swapButton.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
  }
});

initialisePage();
