import { setStorage } from "./storageManager.js";
import { SCREENS } from "../utils/constants.js";

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
