# one-life-action-frontend

One Life Action is a web based health literacy experience developed for the FIT5120 project.

The application transforms Malaysian mortality and food nutrition data into an interactive experience that helps users explore population-level health patterns and identify one realistic food swap.

## Live Website Link

one-life-action-frontend.vercel.app

## Project Overview

The frontend guides the user through six stages:

1. Enter an age band, height and weight.
2. View BMI guidance and age-group mortality patterns.
3. Select meals for breakfast, lunch, tea and dinner.
4. Review estimated daily nutrient totals.
5. Understand associated nutrient and health-risk contexts.
6. Select a realistic food swap and generate a result card.

*The website does not calculate personal mortality risk or provide a medical diagnosis.

## Technology Stack

* HTML5
* CSS3
* JavaScript
* Fetch API
* Session Storage
* Git and GitHub
* Vercel for frontend hosting

## Current Features

* Three supported age bands:
  * `15-40`
  * `41-59`
  * `60+`
* BMI calculation and classification
* BMI screening disclaimer and normal range guidance
* Age-band mortality visualisation using a 100 figure grid
* Dynamic top recorded causes of death
* Searchable meal selection for four meal slots
* Daily nutrient aggregation
* Nutrient guideline comparison
* Priority nutrient identification
* Health risk explanation
* Multiple approved food swap recommendations
* Food swap nutrition comparison
* Downloadable One Life Action result card
* Responsive page layouts
* Front end error and loading states

## Project Structure

```text
one-life-action-frontend/
├── index.html
├── README.md
├── styles.css
├── assets/
│   ├── person.png
│   ├── breakfast.png
│   ├── lunch.png
│   ├── tea.png
│   └── dinner.png
├── css/
│   ├── US-1.1.css
│   ├── US-2.1.css
│   ├── US-2.2.css
│   ├── US-3.1.css
│   ├── US-4.1.css
│   └── US-4.2.css
├── js/
│   ├── US-1.1.js
│   ├── US-2.1.js
│   ├── US-2.2.js
│   ├── US-3.1.js
│   ├── US-4.1.js
│   └── US-4.2.js
└── pages/
    ├── US-1.1.html
    ├── US-2.1.html
    ├── US-2.2.html
    ├── US-3.1.html
    ├── US-4.1.html
    └── US-4.2.html
```



## Development Status

### Completed

* Shared frontend structure and styling
* Six-stage user flow
* Responsive layouts
* Backend API integration
* Mortality visualisation
* Meal selection
* Daily nutrient analysis
* Health-risk explanation
* Food-swap recommendations
* Downloadable result card
* Vercel deployment


