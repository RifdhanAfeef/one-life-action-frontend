# Work Log

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

- US-2.1: intermittent `NotFoundError` from rapid typing in the meal search
  field (DOM re-render races with the browser's own focus handling). Not
  related to the API change; needs a fix in the search input's render logic.
- Frontend is not deployed anywhere yet — only verified against a local
  static server.
- No cross-browser or mobile testing done.
- The "nutrient exceeded but no approved swap available" backend scenario
  has been code-reviewed but not exercised end-to-end.
