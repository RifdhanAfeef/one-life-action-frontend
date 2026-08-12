const mealGrid = document.querySelector("#mealGrid");
const selectionCount = document.querySelector("#selectionCount");
const daySummaryList = document.querySelector("#daySummaryList");
const selectionWarning = document.querySelector("#selectionWarning");
const warningTitle = document.querySelector("#warningTitle");
const warningMessage = document.querySelector("#warningMessage");
const totalsButton = document.querySelector("#totalsButton");
const backButton = document.querySelector("#backButton");
const navigationStatus = document.querySelector("#navigationStatus");

const mealSlots = [
  {
    id: "breakfast",
    label: "Breakfast",
    image: "../assets/breakfast.png",
  },
  {
    id: "lunch",
    label: "Lunch",
    image: "../assets/lunch.png",
  },
  {
    id: "tea",
    label: "Tea",
    image: "../assets/tea.png",
  },
  {
    id: "dinner",
    label: "Dinner",
    image: "../assets/dinner.png",
  },
];


const mockDishCatalogue = [
  {
    id: 1,
    name: "Roti Canai",
    serving: "1 fixed standard serving",
    energyKcal: 650,
    sugarG: 18,
    saturatedFatG: 7,
    sodiumMg: 680,
  },
  {
    id: 2,
    name: "Nasi Lemak",
    serving: "1 fixed standard serving",
    energyKcal: 680,
    sugarG: 12,
    saturatedFatG: 6,
    sodiumMg: 890,
  },
  {
    id: 3,
    name: "Teh Tarik",
    serving: "1 fixed standard serving",
    energyKcal: 180,
    sugarG: 48,
    saturatedFatG: 3,
    sodiumMg: 120,
  },
  {
    id: 4,
    name: "Chicken Rice",
    serving: "1 fixed standard serving",
    energyKcal: 620,
    sugarG: 5,
    saturatedFatG: 5,
    sodiumMg: 850,
  },
  {
    id: 5,
    name: "Char Kway Teow",
    serving: "1 fixed standard serving",
    energyKcal: 744,
    sugarG: 8,
    saturatedFatG: 8,
    sodiumMg: 1200,
  },
  {
    id: 6,
    name: "Mee Goreng",
    serving: "1 fixed standard serving",
    energyKcal: 700,
    sugarG: 10,
    saturatedFatG: 7,
    sodiumMg: 1100,
  },
  {
    id: 7,
    name: "Oatmeal",
    serving: "1 fixed standard serving",
    energyKcal: 250,
    sugarG: 7,
    saturatedFatG: 2,
    sodiumMg: 180,
  },
  {
    id: 8,
    name: "Yong Tau Foo",
    serving: "1 fixed standard serving",
    energyKcal: 450,
    sugarG: 6,
    saturatedFatG: 2,
    sodiumMg: 800,
  },
];

const selections = new Map();
let dishCatalogue = [];
let warningHasBeenRequested = false;
const SELECTIONS_STORAGE_KEY = "oneLifeAction.selectedMeals";

const DISHES_ENDPOINT = "https://one-life-action-backend.vercel.app/assessment/dishes";

async function getDishCatalogue() {
  try {
    const response = await fetch(DISHES_ENDPOINT);
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? `Could not load the dish catalogue (${response.status}).`);
    }

    return payload.dishes.map((dish) => ({
      id: dish.dishId,
      name: dish.name,
      serving: dish.servingDescription,
      mealSlot: dish.mealSlot,
      energyKcal: dish.energyKcal,
      sugarG: dish.sugarG,
      saturatedFatG: dish.saturatedFatG,
      sodiumMg: dish.sodiumMg,
    }));
  } catch (error) {
    console.error("Falling back to sample dishes; the live catalogue could not be loaded.", error);
    navigationStatus.textContent =
      "Showing a small sample dish list because the live catalogue could not be loaded.";
    return mockDishCatalogue;
  }
}


function getDishesForSlot(slotId) {
  return dishCatalogue.filter(
    (dish) => !dish.mealSlot || dish.mealSlot === slotId || dish.mealSlot === "any",
  );
}

function findDishByName(name, slotId) {
  const normalisedName = name.trim().toLowerCase();

  return getDishesForSlot(slotId).find(
    (dish) => dish.name.toLowerCase() === normalisedName,
  );
}

function createSearchView(slot) {
  const container = document.createElement("div");
  container.className = "meal-card__empty";

  const label = document.createElement("label");
  label.htmlFor = `${slot.id}MealSearch`;
  label.textContent = "Select a meal";

  const searchWrap = document.createElement("div");
  searchWrap.className = "meal-search-wrap";

  const input = document.createElement("input");
  input.className = "meal-search";
  input.id = `${slot.id}MealSearch`;
  input.type = "search";
  input.placeholder = "Search";
  input.autocomplete = "off";
  input.setAttribute("list", `${slot.id}DishOptions`);
  input.setAttribute("aria-describedby", `${slot.id}SearchHelp`);

  const icon = document.createElement("span");
  icon.className = "meal-search-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "⌕";

  const datalist = document.createElement("datalist");
  datalist.id = `${slot.id}DishOptions`;

  getDishesForSlot(slot.id).forEach((dish) => {
    const option = document.createElement("option");
    option.value = dish.name;
    datalist.appendChild(option);
  });

  const help = document.createElement("p");
  help.className = "meal-search-help";
  help.id = `${slot.id}SearchHelp`;
  help.textContent = "Start typing, then choose a suggestion.";

  function chooseExactMatch() {
    const matchedDish = findDishByName(input.value, slot.id);

    if (!matchedDish) return false;

    selections.set(slot.id, matchedDish);
    saveSelections();

    // Defer the card swap: replacing `input` synchronously while it's still
    // dispatching its own input/change event races Chrome's blur handling
    // and throws "replaceChildren ... moved in a blur event handler".
    queueMicrotask(() => {
      renderMealCard(slot);
      updateSummary();
      updateWarningIfVisible();
    });

    return true;
  }

  input.addEventListener("input", () => {
    help.classList.remove("is-error");
    help.textContent = "Start typing, then choose a suggestion.";
    chooseExactMatch();
  });

  input.addEventListener("change", () => {
    if (chooseExactMatch()) return;

    help.classList.add("is-error");
    help.textContent = "Please choose a dish from the suggestions.";
  });

  searchWrap.append(input, icon, datalist);
  container.append(label, searchWrap, help);
  return container;
}

function createSelectedView(slot, dish) {
  const container = document.createElement("div");
  container.className = "meal-card__selected";

  const main = document.createElement("div");
  main.className = "selected-meal-main";

  const image = document.createElement("img");
  image.className = "meal-slot-image";
  image.src = slot.image;
  image.alt = `${slot.label} meal illustration`;

  const copy = document.createElement("div");
  copy.className = "selected-meal-copy";

  const name = document.createElement("strong");
  name.textContent = dish.name;

  const serving = document.createElement("span");
  serving.textContent = dish.serving;

  const nutrients = document.createElement("ul");
  nutrients.className = "nutrient-list";

  [
    `${dish.energyKcal} Kcal`,
    `Sugar ${dish.sugarG}g`,
    `S. Fat ${dish.saturatedFatG}g`,
    `Sodium ${dish.sodiumMg}mg`,
  ].forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    nutrients.appendChild(item);
  });

  const changeButton = document.createElement("button");
  changeButton.className = "change-meal-button";
  changeButton.type = "button";
  changeButton.setAttribute(
    "aria-label",
    `Replace ${dish.name} for ${slot.label}`,
  );

  const hiddenText = document.createElement("span");
  hiddenText.textContent = "Change meal";
  changeButton.appendChild(hiddenText);

  changeButton.addEventListener("click", () => {
    selections.delete(slot.id);
    saveSelections();
    renderMealCard(slot);
    updateSummary();
    updateWarningIfVisible();

    requestAnimationFrame(() => {
      document.querySelector(`#${slot.id}MealSearch`)?.focus();
    });
  });

  copy.append(name, serving);
  main.append(image, copy);
  container.append(main, nutrients, changeButton);
  return container;
}

function renderMealCard(slot) {
  let card = mealGrid.querySelector(`[data-slot="${slot.id}"]`);

  if (!card) {
    card = document.createElement("article");
    card.className = "meal-card";
    card.dataset.slot = slot.id;
    mealGrid.appendChild(card);
  }

  const dish = selections.get(slot.id);
  card.dataset.selected = String(Boolean(dish));
  card.replaceChildren();

  const slotLabel = document.createElement("strong");
  slotLabel.className = "meal-card__slot";
  slotLabel.textContent = slot.label;

  card.append(slotLabel, dish ? createSelectedView(slot, dish) : createSearchView(slot));
}

function updateSummary() {
  selectionCount.textContent = `${selections.size} of ${mealSlots.length}`;
  daySummaryList.replaceChildren();

  mealSlots.forEach((slot) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = slot.label;
    description.textContent = selections.get(slot.id)?.name ?? "–";

    row.append(term, description);
    daySummaryList.appendChild(row);
  });
}

const MIN_REQUIRED_MEALS = 2;

function getMissingSlots() {
  return mealSlots.filter((slot) => !selections.has(slot.id));
}

function joinMealNames(labels) {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(" and ");

  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function showMissingMealWarning() {
  if (selections.size >= MIN_REQUIRED_MEALS) {
    selectionWarning.hidden = true;
    return;
  }

  const missingNames = getMissingSlots().map((slot) => slot.label);
  const joinedNames = joinMealNames(missingNames);

  warningTitle.textContent = "Select at least two meals";
  warningMessage.textContent = `Please select at least ${MIN_REQUIRED_MEALS} meals before continuing (still need: ${joinedNames}).`;
  selectionWarning.hidden = false;
}

function updateWarningIfVisible() {
  if (!warningHasBeenRequested) return;
  showMissingMealWarning();
}

function saveSelections() {
  const selectedMeals = mealSlots
    .filter((slot) => selections.has(slot.id))
    .map((slot) => ({
      slot: slot.id,
      ...selections.get(slot.id),
    }));

  sessionStorage.setItem(SELECTIONS_STORAGE_KEY, JSON.stringify(selectedMeals));
}

function restoreSelections() {
  const storedValue = sessionStorage.getItem(SELECTIONS_STORAGE_KEY);
  if (!storedValue) return;

  try {
    const storedMeals = JSON.parse(storedValue);
    if (!Array.isArray(storedMeals)) return;

    storedMeals.forEach((storedMeal) => {
      const slot = mealSlots.find((item) => item.id === storedMeal.slot);
      if (!slot || !storedMeal.name) return;

      const catalogueDish = getDishesForSlot(slot.id).find(
        (dish) =>
          String(dish.id) === String(storedMeal.id) ||
          dish.name.toLowerCase() === String(storedMeal.name).toLowerCase(),
      );

      selections.set(slot.id, catalogueDish ?? storedMeal);
    });
  } catch (error) {
    console.warn("Previously selected meals could not be restored.", error);
  }
}

function shouldRestoreSelections() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("restore") === "1";
}

function prepareMealSelectionSession() {
  if (shouldRestoreSelections()) {
    restoreSelections();
    return;
  }

  selections.clear();
  sessionStorage.removeItem(SELECTIONS_STORAGE_KEY);
}

function handleTotalsRequest() {
  warningHasBeenRequested = true;
  navigationStatus.textContent = "";

  if (selections.size < MIN_REQUIRED_MEALS) {
    showMissingMealWarning();
    const firstMissing = getMissingSlots()[0];
    document.querySelector(`#${firstMissing.id}MealSearch`)?.focus();
    return;
  }

  selectionWarning.hidden = true;
  saveSelections();

  // Mark this history entry as restorable so the browser Back button also
  // returns to the user's current meal choices.
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.set("restore", "1");
  window.history.replaceState(null, "", returnUrl);

  window.location.href = "./US-2.2.html";
}

async function initialisePage() {
  dishCatalogue = await getDishCatalogue();
  prepareMealSelectionSession();
  mealSlots.forEach(renderMealCard);
  updateSummary();
}

totalsButton.addEventListener("click", handleTotalsRequest);

backButton.addEventListener("click", () => {
  window.location.href = "./US-1.1.html?view=chart";
});

initialisePage();
