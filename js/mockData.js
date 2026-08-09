/**
 * Placeholder data shaped exactly like the real backend responses
 * (see one-life-action-backend: repositories/dishRepository.js,
 * guidelineRepository.js, nutrientConditionRepository.js) and seeded
 * from the same values as Oboarding_populated.sql.
 *
 * Pages read through js/nutrientAnalysis.js rather than this file
 * directly, so swapping these arrays for live `getJson()` calls later
 * will not require any page-level changes.
 */

export const DISHES = [
  { dishId: 1, name: "Roti canai", category: "Flatbread", mealSlot: "breakfast", servingDescription: "1 piece (141g)", energyKcal: 496, sugarG: 5.50, saturatedFatG: 7.22, sodiumMg: 805 },
  { dishId: 2, name: "Roti telur", category: "Flatbread", mealSlot: "breakfast", servingDescription: "1 piece (119g)", energyKcal: 331, sugarG: 3.93, saturatedFatG: 4.62, sodiumMg: 500 },
  { dishId: 3, name: "Chapati", category: "Flatbread", mealSlot: "breakfast", servingDescription: "1 piece (133g)", energyKcal: 447, sugarG: 6.18, saturatedFatG: 5.61, sodiumMg: 370 },
  { dishId: 4, name: "Roti john", category: "Sandwich", mealSlot: "breakfast", servingDescription: "1 whole (253g)", energyKcal: 724, sugarG: 0.00, saturatedFatG: 18.22, sodiumMg: 2019 },
  { dishId: 5, name: "Kaya bun", category: "Bread", mealSlot: "breakfast", servingDescription: "1 whole (57g)", energyKcal: 184, sugarG: 11.17, saturatedFatG: 3.25, sodiumMg: 118 },
  { dishId: 6, name: "French toast with kaya", category: "Bread", mealSlot: "breakfast", servingDescription: "1 slice (101g)", energyKcal: 289, sugarG: 6.78, saturatedFatG: 4.89, sodiumMg: 382 },
  { dishId: 7, name: "Nasi lemak (fish)", category: "Rice dish", mealSlot: "lunch", servingDescription: "1 plate (349g)", energyKcal: 707, sugarG: 7.84, saturatedFatG: 11.02, sodiumMg: 1541 },
  { dishId: 8, name: "Nasi kunyit", category: "Rice dish", mealSlot: "lunch", servingDescription: "1 scoop (100g)", energyKcal: 151, sugarG: 0.29, saturatedFatG: 0.69, sodiumMg: 235 },
  { dishId: 9, name: "Steamed chicken rice", category: "Rice dish", mealSlot: "lunch", servingDescription: "1 plate (346g)", energyKcal: 488, sugarG: 0.00, saturatedFatG: 4.33, sodiumMg: 1227 },
  { dishId: 10, name: "Penang laksa", category: "Noodle dish", mealSlot: "lunch", servingDescription: "1 bowl (734g)", energyKcal: 433, sugarG: 4.84, saturatedFatG: 2.28, sodiumMg: 2789 },
  { dishId: 11, name: "Beef rendang", category: "Meat dish", mealSlot: "lunch", servingDescription: "1 scoop (100g)", energyKcal: 223, sugarG: 0.80, saturatedFatG: 6.20, sodiumMg: 501 },
  { dishId: 12, name: "Chicken masala", category: "Meat dish", mealSlot: "dinner", servingDescription: "1 plate (455g)", energyKcal: 860, sugarG: 0.00, saturatedFatG: 18.65, sodiumMg: 2330 },
  { dishId: 13, name: "Butter chicken", category: "Meat dish", mealSlot: "dinner", servingDescription: "1 scoop (100g)", energyKcal: 148, sugarG: 3.68, saturatedFatG: 4.08, sodiumMg: 483 },
  { dishId: 14, name: "Fried chicken (1 pc)", category: "Meat dish", mealSlot: "dinner", servingDescription: "1 piece (102g)", energyKcal: 219, sugarG: 0.37, saturatedFatG: 4.96, sodiumMg: 564 },
  { dishId: 15, name: "Ayam percik / grilled chicken", category: "Meat dish", mealSlot: "dinner", servingDescription: "1 piece (153g)", energyKcal: 295, sugarG: 0.00, saturatedFatG: 4.74, sodiumMg: 540 },
  { dishId: 16, name: "Gado gado", category: "Vegetable dish", mealSlot: "lunch", servingDescription: "1 plate (421g)", energyKcal: 661, sugarG: 0.00, saturatedFatG: 14.31, sodiumMg: 1082 },
  { dishId: 17, name: "Chicken satay", category: "Snack", mealSlot: "tea", servingDescription: "1 stick (10g)", energyKcal: 23, sugarG: 1.63, saturatedFatG: 0.19, sodiumMg: 54 },
  { dishId: 18, name: "Chicken pau", category: "Snack", mealSlot: "tea", servingDescription: "1 whole (115g)", energyKcal: 247, sugarG: 9.95, saturatedFatG: 2.14, sodiumMg: 385 },
  { dishId: 19, name: "Chicken pie", category: "Snack", mealSlot: "tea", servingDescription: "1 piece (160g)", energyKcal: 469, sugarG: 5.36, saturatedFatG: 12.91, sodiumMg: 670 },
  { dishId: 20, name: "Sugar cracker", category: "Snack", mealSlot: "tea", servingDescription: "1 packet (26g)", energyKcal: 122, sugarG: 4.08, saturatedFatG: 2.03, sodiumMg: 153 },
  { dishId: 21, name: "Chendol", category: "Dessert", mealSlot: "tea", servingDescription: "1 bowl (423g)", energyKcal: 372, sugarG: 19.67, saturatedFatG: 10.79, sodiumMg: 216 },
  { dishId: 22, name: "Plain yoghurt", category: "Snack", mealSlot: "tea", servingDescription: "1 small cup (150g)", energyKcal: 110, sugarG: 0.00, saturatedFatG: 3.30, sodiumMg: 83 },
  { dishId: 23, name: "Teh tarik", category: "Drink", mealSlot: "any", servingDescription: "1 small cup (150ml)", energyKcal: 72, sugarG: 9.87, saturatedFatG: 0.99, sodiumMg: 32 },
  { dishId: 24, name: "Teh", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 150, sugarG: 23.42, saturatedFatG: 2.43, sodiumMg: 0 },
  { dishId: 25, name: "Teh O", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 48, sugarG: 10.05, saturatedFatG: 0.00, sodiumMg: 0 },
  { dishId: 26, name: "Teh O kosong", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 5, sugarG: 0.60, saturatedFatG: 0.00, sodiumMg: 0 },
  { dishId: 27, name: "Teh C kosong", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 55, sugarG: 3.28, saturatedFatG: 1.48, sodiumMg: 0 },
  { dishId: 28, name: "Kopi", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 193, sugarG: 19.05, saturatedFatG: 2.70, sodiumMg: 0 },
  { dishId: 29, name: "Kopi O kosong", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 33, sugarG: 0.00, saturatedFatG: 0.00, sodiumMg: 0 },
  { dishId: 30, name: "Kopi C kosong", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (250ml)", energyKcal: 93, sugarG: 4.25, saturatedFatG: 2.03, sodiumMg: 0 },
  { dishId: 31, name: "Sirap bandung", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (400ml)", energyKcal: 140, sugarG: 25.92, saturatedFatG: 1.88, sodiumMg: 0 },
  { dishId: 32, name: "Iced Milo", category: "Drink", mealSlot: "any", servingDescription: "1 regular cup (400ml)", energyKcal: 288, sugarG: 34.64, saturatedFatG: 3.92, sodiumMg: 0 },
  { dishId: 33, name: "Milo dinosaur", category: "Drink", mealSlot: "any", servingDescription: "1 medium cup (550ml)", energyKcal: 501, sugarG: 62.04, saturatedFatG: 6.82, sodiumMg: 0 },
  { dishId: 34, name: "Cola drink", category: "Drink", mealSlot: "any", servingDescription: "1 can (320ml)", energyKcal: 134, sugarG: 0.00, saturatedFatG: 0.00, sodiumMg: 19 },
  { dishId: 35, name: "Cola drink (less sugar)", category: "Drink", mealSlot: "any", servingDescription: "1 can (320ml)", energyKcal: 99, sugarG: 24.70, saturatedFatG: 0.00, sodiumMg: 10 },
];

export const GUIDELINES = [
  { nutrient: "sugar", daily_limit: 25.00, unit: "g", basis: "Based on a 2,000 kcal adult diet (<5% of energy)", source: "WHO free-sugars guideline" },
  { nutrient: "sat_fat", daily_limit: 20.00, unit: "g", basis: "Approx. 10% of energy on a 2,000 kcal adult diet", source: "WHO saturated fat guideline" },
  { nutrient: "sodium", daily_limit: 2000.00, unit: "mg", basis: "Absolute daily limit (approx. 1 teaspoon of salt)", source: "WHO sodium reduction" },
];

export const NUTRIENT_CONDITIONS = [
  { nc_id: 1, nutrient: "sugar", condition_name: "Type-2 diabetes", mechanism: "Linked to raised blood glucose and insulin resistance over time", source: "NHMS 2023 / WHO", cause_of_death: "Diabetes mellitus" },
  { nc_id: 2, nutrient: "sugar", condition_name: "Obesity", mechanism: "Can contribute to excess energy intake and weight gain", source: "NHMS 2023 / WHO", cause_of_death: null },
  { nc_id: 3, nutrient: "sat_fat", condition_name: "High blood cholesterol", mechanism: "Linked to raised LDL cholesterol levels", source: "NHMS 2023 / WHO", cause_of_death: null },
  { nc_id: 4, nutrient: "sat_fat", condition_name: "Ischaemic heart disease", mechanism: "Raised LDL cholesterol is associated with arterial plaque build-up", source: "NHMS 2023 / WHO", cause_of_death: "Ischaemic heart disease" },
  { nc_id: 5, nutrient: "sat_fat", condition_name: "Obesity", mechanism: "Energy-dense fat intake can contribute to weight gain", source: "NHMS 2023 / WHO", cause_of_death: null },
  { nc_id: 6, nutrient: "sodium", condition_name: "Hypertension (high blood pressure)", mechanism: "Linked to raised blood pressure", source: "NHMS 2023 / WHO", cause_of_death: null },
  { nc_id: 7, nutrient: "sodium", condition_name: "Cerebrovascular disease", mechanism: "Sustained high blood pressure is associated with stroke", source: "NHMS 2023 / WHO", cause_of_death: "Cerebrovascular disease" },
  { nc_id: 8, nutrient: "sodium", condition_name: "Ischaemic heart disease", mechanism: "High blood pressure is associated with increased cardiovascular strain", source: "NHMS 2023 / WHO", cause_of_death: "Ischaemic heart disease" },
];

/** A representative day used when a page is opened on its own, without a Step 2 selection in session state. */
export const DEFAULT_MEALS = {
  breakfast: 1,  // Roti canai
  lunch: 7,      // Nasi lemak (fish)
  tea: 21,       // Chendol
  dinner: 12,    // Chicken masala
};
