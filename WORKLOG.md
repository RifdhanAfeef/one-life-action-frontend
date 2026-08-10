# Work Log

## 2026-08-10 — Optional meal selection (US-2.1)

- Meal selection now requires at least two meals instead of all four, matching
  the backend's updated validation (`validateMeals` in
  `services/nutrientService.js`). Users who only log two meals in a day (e.g.
  lunch + dinner) can now continue past US-2.1 instead of being blocked.
- Warning copy and the missing-meal check were reworked around the new
  2-meal minimum instead of demanding all four slots be filled.
- Only the meals actually selected are now saved to session storage for the
  later pages, instead of all four slots with empty placeholders for
  anything left blank.
- Fixed the intermittent `NotFoundError: replaceChildren` bug listed below
  under "Known issues": choosing a dish was swapping the search card's DOM
  synchronously inside the input's own `input`/`change` handler, racing the
  browser's blur handling. Deferred the swap with `queueMicrotask` so it runs
  after the event finishes dispatching.

### Verified

Selected exactly two meals (lunch + dinner) on US-2.1 and confirmed
"Show my daily totals" proceeds to US-2.2 instead of being blocked; confirmed
selecting only one meal still shows the warning and blocks navigation.
Repeated the search-then-tab interaction that used to throw `NotFoundError`
— console stayed clean across several tries.

### Known issues / not yet done

- Frontend is not deployed anywhere yet — only verified against a local
  static server.
- No cross-browser or mobile testing done.

## 2026-08-09 — Backend integration (US-1.1 to US-4.2)

- Connected all six pages to the deployed backend at
  `https://one-life-action-backend.vercel.app` (previously mock data /
  placeholder endpoints).
- US-2.1: dish search now pulls the real 1,583-dish catalogue from
  `GET /assessment/dishes`, filtered per meal slot. Falls back to a small
  sample list if the request fails.
- US-2.2: posts the selected dish IDs to `POST /assessment/meal-assessment`
  and renders the returned nutrient/guideline comparison directly.
- US-3.1 and US-4.1/4.2: no separate endpoints exist for these — the health
  relationship, swap recommendation, and revised totals all come back in the
  same meal-assessment response, so these pages now read that stored result
  instead of calling endpoints that were never built.
- US-1.1: posts age band/height/weight to `POST /assessment/health-context`
  for BMI and mortality context, replacing the local BMI calculation and
  hardcoded mortality table.
- Merged the age-band relabelling (18-29/30-44/45-59 → 15-40/41-59, keeping
  60+) and re-verified the full flow against the live API afterwards.
- Fixed a stylesheet path bug on the four other pages left over from the
  shared template.

### Verified

Full journey US-1.1 → 2.1 → 2.2 → 3.1 → 4.1 → 4.2 walked end-to-end against
the live backend; results cross-checked against direct API calls at each
step.

### Known issues / not yet done

- ~~US-2.1: intermittent `NotFoundError` from rapid typing in the meal search
  field (DOM re-render races with the browser's own focus handling). Not
  related to the API change; needs a fix in the search input's render
  logic.~~ Fixed 2026-08-10, see above.
- Frontend is not deployed anywhere yet — only verified against a local
  static server.
- No cross-browser or mobile testing done.
- The "nutrient exceeded but no approved swap available" backend scenario
  has been code-reviewed but not exercised end-to-end.
