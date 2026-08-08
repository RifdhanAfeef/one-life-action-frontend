/**
 * Temporary journey state shared between separate HTML pages.
 * sessionStorage keeps the data while the browser tab is open.
 */
const STORAGE_KEY = "oneLifeActionState";

export function getState() {
  const savedState = sessionStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return {};
  }

  try {
    return JSON.parse(savedState);
  } catch (error) {
    console.warn("Saved application state could not be read.", error);
    return {};
  }
}

/** Replaces all currently stored journey data. */
export function setState(newState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
}

/** Merges new values into the existing journey data. */
export function updateState(updatedValues) {
  const currentState = getState();
  const nextState = { ...currentState, ...updatedValues };

  setState(nextState);
  return nextState;
}

/** Clears the journey when the user chooses "Start again". */
export function clearState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

