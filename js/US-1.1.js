const app = document.querySelector("#us11App");
const form = document.querySelector("#profileForm");
const ageBandInput = document.querySelector("#ageBand");
const heightInput = document.querySelector("#heightCm");
const weightInput = document.querySelector("#weightKg");
const formErrors = document.querySelector("#formErrors");
const eyebrow = document.querySelector("#eyebrow");
const stepPill = document.querySelector("#stepPill");
const disclaimer = document.querySelector("#prototypeDisclaimer");
const beginButton = document.querySelector("#beginButton");
const bmiResult = document.querySelector("#bmiResult");
const bmiValue = document.querySelector("#bmiValue");
const bmiCategory = document.querySelector("#bmiCategory");
const bmiRange = document.querySelector("#bmiRange");
const NORMAL_BMI_RANGE = "18.5–22.9";

const figuresView = document.querySelector("#figuresView");
const chartView = document.querySelector("#chartView");
const peopleGrid = document.querySelector("#peopleGrid");
const mortalitySummary = document.querySelector("#mortalitySummary");
const summaryAgeBand = document.querySelector("#summaryAgeBand");
const summaryCause = document.querySelector("#summaryCause");
const summaryPercentage = document.querySelector("#summaryPercentage");
const patternButton = document.querySelector("#patternButton");
const foodButton = document.querySelector("#foodButton");
const chartAgeBand = document.querySelector("#chartAgeBand");
const mortalityBars = document.querySelector("#mortalityBars");
const figuresSource = document.querySelector("#figuresSource");
const chartSource = document.querySelector("#chartSource");
const chartBackButton = document.querySelector("#chartBackButton");
const navigationStatus = document.querySelector("#navigationStatus");

const HEALTH_CONTEXT_ENDPOINT =
  "https://one-life-action-backend.vercel.app/assessment/health-context";

const categoryRanges = {
  Underweight: "0.0-18.4",
  Normal: "18.5-22.9",
  Overweight: "23.0-27.4",
  Obese: "27.5 or above",
};

const rankLabels = ["Highest recorded", "Second", "Third", "Fourth"];

let currentProfile = null;
let currentHealthContext = null;

function createPeopleGrid() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 100; index += 1) {
    const figure = document.createElement("span");
    figure.className = "person-figure";
    figure.setAttribute("aria-hidden", "true");
    fragment.appendChild(figure);
  }

  peopleGrid.appendChild(fragment);
}

function enableUploadedPersonImage() {
  const personImage = new Image();

  personImage.addEventListener("load", () => {
    document.documentElement.classList.add("person-png-ready");
  });

  personImage.src = "../assets/person.png";
}

function readProfile() {
  return {
    ageBand: ageBandInput.value,
    heightCm: Number(heightInput.value),
    weightKg: Number(weightInput.value),
  };
}

function validateProfile(profile) {
  const errors = [];

  [ageBandInput, heightInput, weightInput].forEach((field) => {
    field.removeAttribute("aria-invalid");
  });

  if (!profile.ageBand) {
    errors.push({ field: ageBandInput, message: "Select an age group." });
  }

  if (!Number.isFinite(profile.heightCm) || profile.heightCm < 100 || profile.heightCm > 250) {
    errors.push({
      field: heightInput,
      message: "Enter a height between 100 cm and 250 cm.",
    });
  }

  if (!Number.isFinite(profile.weightKg) || profile.weightKg < 25 || profile.weightKg > 350) {
    errors.push({
      field: weightInput,
      message: "Enter a weight between 25 kg and 350 kg.",
    });
  }

  errors.forEach(({ field }) => field.setAttribute("aria-invalid", "true"));
  return errors;
}

function showValidationErrors(errors) {
  if (errors.length === 0) {
    formErrors.hidden = true;
    formErrors.textContent = "";
    return;
  }

  formErrors.innerHTML = errors.map(({ message }) => `<div>${message}</div>`).join("");
  formErrors.hidden = false;
  errors[0].field.focus();
}

function calculateBmi(heightCm, weightKg) {
  const heightMetres = heightCm / 100;
  return weightKg / heightMetres ** 2;
}

function classifyBmi(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23.0) return "Normal";
  if (bmi < 27.5) return "Overweight";
  return "Obese";
}

async function getHealthContext(profile) {
  const response = await fetch(HEALTH_CONTEXT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? `Could not calculate your health context (${response.status}).`);
  }

  return {
    bmi: payload.healthContext.bmi,
    bmiCategory: payload.healthContext.category,
    mortalitySource: payload.mortalityContext.source ?? "DOSM mortality data",
    mortality: payload.mortalityContext.leadingCauses.map((item) => ({
      cause: item.name,
      percentage: item.percentage,
    })),
  };
}

function paintPeopleGrid(highlightCount = 0) {
  const figures = [...peopleGrid.querySelectorAll(".person-figure")];

  figures.forEach((figure, index) => {
    figure.classList.toggle("is-highlighted", index < highlightCount);
  });

  peopleGrid.setAttribute(
    "aria-label",
    highlightCount > 0
      ? `${highlightCount} highlighted figures out of 100 recorded lives`
      : "100 grey figures representing 100 recorded lives",
  );
}

function renderBmi(context) {
  bmiValue.textContent = context.bmi.toFixed(1);
  bmiCategory.textContent = context.bmiCategory;

  bmiRange.textContent =
    `MOH Recommended BMI range: ${NORMAL_BMI_RANGE}`;

  // Used by CSS to select the appropriate colour scheme.
  bmiResult.dataset.category = context.bmiCategory
    .toLowerCase()
    .replaceAll(" ", "-");
}

function renderFigures(profile, context) {
  const topCause = context.mortality[0];
  const highlightedFigures = Math.round(topCause.percentage);

  summaryAgeBand.textContent = profile.ageBand;
  summaryCause.textContent = topCause.cause;
  summaryPercentage.textContent = `${topCause.percentage.toFixed(1)}%`;
  figuresSource.textContent = `Data source: ${context.mortalitySource}`;
  paintPeopleGrid(highlightedFigures);
}

function renderBars(profile, context) {
  chartAgeBand.textContent = profile.ageBand;
  chartSource.textContent = `Data source: ${context.mortalitySource}`;
  mortalityBars.replaceChildren();

  context.mortality.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const labels = document.createElement("div");
    labels.className = "bar-labels";

    const cause = document.createElement("span");
    cause.textContent = item.cause;

    const rank = document.createElement("span");
    rank.className = "bar-rank";
    rank.textContent = rankLabels[index];

    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("aria-label", `${item.cause}: ${item.percentage.toFixed(1)}%`);

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.min((item.percentage / 35) * 100, 100)}%`;

    labels.append(cause, rank);
    track.appendChild(fill);
    row.append(labels, track);
    mortalityBars.appendChild(row);
  });
}

function setInterfaceState(nextState) {
  app.dataset.state = nextState;
  navigationStatus.textContent = "";

  const isInitial = nextState === "initial";
  const isFigures = nextState === "figures";
  const isChart = nextState === "chart";

  eyebrow.textContent = isInitial ? "100 lives · one human pattern" : "1 · Your Numbers";
  stepPill.hidden = isInitial;
  disclaimer.hidden = !isInitial;
  beginButton.hidden = !isInitial;
  bmiResult.hidden = isInitial;
  mortalitySummary.hidden = !isFigures;
  figuresView.hidden = isChart;
  chartView.hidden = !isChart;
  patternButton.hidden = !isFigures;
  foodButton.hidden = !isChart;
  chartBackButton.hidden = !isChart;
  document.querySelector(".visual-actions").dataset.state = nextState;

  if (isInitial) {
    paintPeopleGrid(0);
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const profile = readProfile();
  const errors = validateProfile(profile);
  showValidationErrors(errors);

  if (errors.length > 0) return;

  try {
    currentProfile = profile;
    currentHealthContext = await getHealthContext(profile);

    renderBmi(currentHealthContext);
    renderFigures(currentProfile, currentHealthContext);
    setInterfaceState("figures");
  } catch (error) {
    console.error(error);
    currentProfile = null;
    currentHealthContext = null;
    showValidationErrors([{ field: ageBandInput, message: error.message }]);
  }
}

function resetResultsAfterInputChange(event) {
  event.target.removeAttribute("aria-invalid");
  formErrors.hidden = true;
  formErrors.textContent = "";

  if (app.dataset.state !== "initial") {
    currentProfile = null;
    currentHealthContext = null;
    setInterfaceState("initial");
  }
}

form.addEventListener("submit", handleFormSubmit);
form.addEventListener("input", resetResultsAfterInputChange);

patternButton.addEventListener("click", () => {
  if (!currentProfile || !currentHealthContext) return;

  renderBars(currentProfile, currentHealthContext);
  setInterfaceState("chart");
});

chartBackButton.addEventListener("click", () => {
  if (!currentProfile || !currentHealthContext) return;
  setInterfaceState("figures");
});

foodButton.addEventListener("click", () => {
      window.location.href = "./US-2.1.html";
});

createPeopleGrid();
enableUploadedPersonImage();
setInterfaceState("initial");
