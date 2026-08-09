/**
 * Client-side mirror of one-life-action-backend's
 * services/nutrientService.js and services/recommendationService.js
 * (the getNutrientCondition / findHighestContributingMeal parts),
 * running against the mock tables in js/mockData.js.
 *
 * Field names and the returned shapes match the real API responses
 * from POST /assessment/meal-assessment, so pages built against this
 * module can switch to js/api.js's postJson() later without changing
 * how they read the result.
 */

import { DISHES, GUIDELINES, NUTRIENT_CONDITIONS } from "./mockData.js";

export const MEAL_ORDER = ["breakfast", "lunch", "tea", "dinner"];

const NUTRIENT_PRIORITY = ["sodiumMg", "sugarG", "saturatedFatG"];

const DB_NUTRIENT_MAP = {
  sugarG: "sugar",
  sodiumMg: "sodium",
  saturatedFatG: "sat_fat",
};

export function getDishById(dishId) {
  const dish = DISHES.find((d) => d.dishId === Number(dishId));

  if (!dish) {
    throw new Error(`Dish not found: ${dishId}`);
  }

  return dish;
}

function calculateTotals(selectedMeals) {
  return selectedMeals.reduce(
    (totals, meal) => {
      const dish = meal.dish;

      totals.energyKcal += Number(dish.energyKcal) || 0;
      totals.sugarG += Number(dish.sugarG) || 0;
      totals.saturatedFatG += Number(dish.saturatedFatG) || 0;
      totals.sodiumMg += Number(dish.sodiumMg) || 0;

      return totals;
    },
    { energyKcal: 0, sugarG: 0, saturatedFatG: 0, sodiumMg: 0 }
  );
}

function mapGuidelines() {
  const guidelines = {};

  for (const row of GUIDELINES) {
    if (row.nutrient === "sugar") {
      guidelines.sugarG = { name: "Sugar", limit: Number(row.daily_limit), unit: row.unit, basis: row.basis, source: row.source };
    }
    if (row.nutrient === "sodium") {
      guidelines.sodiumMg = { name: "Sodium", limit: Number(row.daily_limit), unit: row.unit, basis: row.basis, source: row.source };
    }
    if (row.nutrient === "sat_fat") {
      guidelines.saturatedFatG = { name: "Saturated Fat", limit: Number(row.daily_limit), unit: row.unit, basis: row.basis, source: row.source };
    }
  }

  return guidelines;
}

function compareWithGuidelines(totals, guidelines) {
  const nutrientAnalysis = {};

  for (const nutrientKey of Object.keys(guidelines)) {
    const guideline = guidelines[nutrientKey];
    const total = totals[nutrientKey];
    const ratio = total / guideline.limit;

    nutrientAnalysis[nutrientKey] = {
      name: guideline.name,
      total,
      guideline: guideline.limit,
      unit: guideline.unit,
      basis: guideline.basis,
      source: guideline.source,
      exceeded: total > guideline.limit,
      ratio: Number(ratio.toFixed(2)),
    };
  }

  return nutrientAnalysis;
}

function findPriorityNutrient(nutrientAnalysis) {
  const exceeded = NUTRIENT_PRIORITY.filter((key) => nutrientAnalysis[key].exceeded);

  if (exceeded.length === 0) {
    return null;
  }

  let priorityKey = exceeded[0];

  for (const key of exceeded) {
    if (nutrientAnalysis[key].ratio > nutrientAnalysis[priorityKey].ratio) {
      priorityKey = key;
    }
  }

  return { key: priorityKey, ...nutrientAnalysis[priorityKey] };
}

/** Mirrors nutrientService.analyseMeals(). `meals` is { breakfast, lunch, tea, dinner } of dish IDs. */
export function analyseMeals(meals) {
  const selectedMeals = MEAL_ORDER.map((slot) => ({
    slot,
    dish: getDishById(meals[slot]),
  }));

  const totals = calculateTotals(selectedMeals);
  const guidelines = mapGuidelines();
  const nutrients = compareWithGuidelines(totals, guidelines);
  const priorityNutrient = findPriorityNutrient(nutrients);

  return {
    selectedMeals,
    totals,
    nutrients,
    priorityNutrient,
    guidelines,
    disclaimer: "These guideline values are general reference values and are not personalised medical advice.",
  };
}

/** Mirrors recommendationService.findHighestContributingMeal(). */
export function findHighestContributingMeal(selectedMeals, nutrientKey) {
  let highestMeal = selectedMeals[0];

  for (const meal of selectedMeals) {
    if (Number(meal.dish[nutrientKey]) > Number(highestMeal.dish[nutrientKey])) {
      highestMeal = meal;
    }
  }

  return highestMeal;
}

/** Mirrors recommendationService.getNutrientCondition(). */
export function getNutrientCondition(nutrientKey) {
  const dbNutrient = DB_NUTRIENT_MAP[nutrientKey];

  if (!dbNutrient) {
    throw new Error(`Unsupported nutrient: ${nutrientKey}`);
  }

  return NUTRIENT_CONDITIONS.filter((row) => row.nutrient === dbNutrient);
}
