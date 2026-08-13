/**
 * Shared "Start Over" behaviour used by the header logo and final-page link.
 *
 * Journey data is kept in sessionStorage so it can be passed between the
 * separate HTML pages. Starting over removes only One Life Action data and
 * leaves any unrelated sessionStorage values untouched.
 */
(function initialiseStartOverLinks() {
  const APP_KEY_PREFIX = "oneLifeAction.";
  const LEGACY_APP_KEY = "oneLifeActionState";

  function clearJourneyData() {
    const keysToRemove = [];

    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);

      if (
        key &&
        (key.startsWith(APP_KEY_PREFIX) || key === LEGACY_APP_KEY)
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }

  document.querySelectorAll("[data-start-over]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const destination = link.href;

      try {
        clearJourneyData();
      } catch (error) {
        // Navigation should still work if browser storage is unavailable.
        console.warn("The saved journey data could not be cleared.", error);
      }

      window.location.assign(destination);
    });
  });
})();
