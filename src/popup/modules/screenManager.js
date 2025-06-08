import { setStorage } from "./storageManager.js";
import { SCREENS } from "../utils/constants.js";

/**
 * Manages the visibility of different screens within the popup UI.
 * It ensures that only the specified screen is visible ('block' display style),
 * while all other screens are hidden ('none' display style).
 * It also controls the visibility of the navigation bar and persists the current screen state.
 *
 * @param {string} screenName - The name of the screen to display (e.g., SCREENS.WELCOME, SCREENS.SETTINGS).
 * @param {object} elements - An object containing references to various DOM elements for all screens and the navbar.
 */
export function showScreen(screenName, elements) {
  elements.welcomeScreen.style.display =
    screenName === SCREENS.WELCOME ? "block" : "none";
  elements.settingsScreen.style.display =
    screenName === SCREENS.SETTINGS ? "block" : "none";
  elements.focusScreen.style.display =
    screenName === SCREENS.FOCUS ? "block" : "none";
  elements.pauseScreen.style.display =
    screenName === SCREENS.PAUSE ? "block" : "none";
  elements.blockingWebsitesScreen.style.display =
    screenName === SCREENS.BLOCKING ? "block" : "none";

  elements.navbar.style.display =
    screenName === SCREENS.WELCOME ? "none" : "flex";

  setStorage({ screen: screenName });
}
