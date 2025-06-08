import {
  SCREENS,
  DEFAULT_STUDY_TIME,
  DEFAULT_PAUSE_TIME,
  DEFAULT_CYCLES,
} from "./utils/constants.js";
import { getDOMElements } from "./utils/domElements.js";
import { getStorage, setStorage } from "./modules/storageManager.js";
import {
  setupTimeControls,
  initializeTimeDisplays,
} from "./modules/timeSettings.js";
import { showScreen } from "./modules/screenManager.js";
import {
  startCountdown,
  stopCountdown,
  getIsStudyMode,
  restoreCountdown,
} from "./modules/countDownTimer.js";
import {
  handleWebsiteFormSubmit,
  renderBlockedWebsites,
  applyBlockingRules,
  initializeBlockedWebsites,
} from "./modules/websiteBlocker.js";

document.addEventListener("DOMContentLoaded", async () => {
  const elements = getDOMElements();

  /**
   * @typedef {object} AppState
   * @property {number} currentStudyTime - The user-configured study time in minutes
   * @property {number} currentPauseTime - The user-configured pause time in minutes
   * @property {number} currentCycleNumber - The user-configured total number of cycles
   * @property {number} currentCycle - The current cycle number
   * @property {number} totalCycles - The total number of cycles for the current session
   * @property {number} durationFocusGlobal - The total duration for the current focus period in seconds
   * @property {number} durationPauseGlobal - The total duration for the current pause period in seconds
   */
  /**
   * @type {AppState}
   * @description Manages the global state of the FocusUp application.
   * This object holds all dynamic data related to the current session,
   * such as time settings, current cycle, and timer durations.
   */
  const appState = {
    currentStudyTime: DEFAULT_STUDY_TIME,
    currentPauseTime: DEFAULT_PAUSE_TIME,
    currentCycleNumber: DEFAULT_CYCLES,
    currentCycle: 0,
    totalCycles: 0,
    durationFocusGlobal: 0,
    durationPauseGlobal: 0,
  };

  /**
   * @typedef {object} TimerCallbacks
   * @property {function(): void} applyBlockingRules - Callback to apply/remove website blocking rules
   * @property {function(number): void} onTick - Callback executed on each timer tick, currently a placeholder
   * @property {function(string): Promise<void>} onEnd - Callback executed when a timer (focus/pause) ends
   */
  /**
   * @type {TimerCallbacks}
   * @description Callbacks provided to the countdown timer module to handle various timer events.
   * These functions define what happens when a timer period (focus or pause) ends,
   * including transitioning between modes or ending the session.
   */
  const timerCallbacks = {
    applyBlockingRules: applyBlockingRules,
    onTick: (remainingTime) => {},
    onEnd: async (mode) => {
      if (mode === "focus") {
        appState.currentCycle++;
        if (appState.currentCycle <= appState.totalCycles) {
          await setStorage({
            screen: SCREENS.PAUSE,
            startTime: Date.now(),
            currentCycle: appState.currentCycle,
          });
          showScreen(SCREENS.PAUSE, elements);
          startCountdown(
            appState.durationPauseGlobal,
            "pause",
            elements,
            appState,
            timerCallbacks
          );
        } else {
          await setStorage({ screen: SCREENS.WELCOME });
          showScreen(SCREENS.WELCOME, elements);
        }
      } else if (mode === "pause") {
        if (appState.currentCycle <= appState.totalCycles) {
          await setStorage({
            screen: SCREENS.FOCUS,
            startTime: Date.now(),
            currentCycle: appState.currentCycle,
          });
          showScreen(SCREENS.FOCUS, elements);
          startCountdown(
            appState.durationFocusGlobal,
            "focus",
            elements,
            appState,
            timerCallbacks
          );
        } else {
          await setStorage({ screen: SCREENS.WELCOME });
          showScreen(SCREENS.WELCOME, elements);
        }
      }
    },
  };

  // --- Initial Setup & State Recovery ---

  // Retrieve stored application state from browser's local storage
  // This ensures the extension restores to its previous state upon reopening
  const storedData = await getStorage([
    "screen",
    "studyTimeMinutes",
    "pauseTimeMinutes",
    "cycles",
    "durationFocus",
    "durationPause",
    "blocked_websites",
    "startTime",
    "currentCycle",
  ]);

  // Populate `appState` with retrieved data or default values if no data exists
  appState.currentStudyTime = storedData.studyTimeMinutes ?? DEFAULT_STUDY_TIME;
  appState.currentPauseTime = storedData.pauseTimeMinutes ?? DEFAULT_PAUSE_TIME;
  appState.currentCycleNumber = storedData.cycles ?? DEFAULT_CYCLES;
  appState.currentCycle = storedData.currentCycle ?? 1;
  appState.totalCycles = appState.currentCycleNumber;

  // Initialize and update UI for the time display, blocked websites and screen
  initializeTimeDisplays(elements, appState);
  initializeBlockedWebsites(elements, getIsStudyMode, applyBlockingRules);
  const initialScreen = storedData.screen || SCREENS.WELCOME;
  showScreen(initialScreen, elements);

  // Set global focus and pause durations (in seconds)
  appState.durationFocusGlobal =
    storedData.durationFocus ?? appState.currentStudyTime * 60;
  appState.durationPauseGlobal =
    storedData.durationPause ?? appState.currentPauseTime * 60;

  // Restore the countdown timer if a session was active when the popup closed
  restoreCountdown(
    elements,
    appState,
    timerCallbacks,
    storedData,
    initialScreen
  );

  // Set up event listeners for time adjustment buttons
  setupTimeControls(elements, appState);

  // --- Event-Handler ---

  // (Button) Listener for the "Begin" button on the welcome screen
  // Transitions the user to the settings screen
  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS, elements);
  });

  // (Button) Listener for the "Start" button on the settings screen
  // Initiates a new focus session with the configured settings
  elements.startButton.addEventListener("click", async () => {
    appState.totalCycles = appState.currentCycleNumber;
    appState.currentCycle = 1;
    appState.durationFocusGlobal = appState.currentStudyTime * 60;
    appState.durationPauseGlobal = appState.currentPauseTime * 60;

    await setStorage({
      screen: SCREENS.FOCUS,
      studyTimeMinutes: appState.currentStudyTime,
      pauseTimeMinutes: appState.currentPauseTime,
      cycles: appState.currentCycleNumber,
      currentCycle: appState.currentCycle,
      durationFocus: appState.durationFocusGlobal,
      durationPause: appState.durationPauseGlobal,
      startTime: Date.now(),
    });

    showScreen(SCREENS.FOCUS, elements);
    startCountdown(
      appState.durationFocusGlobal,
      "focus",
      elements,
      appState,
      timerCallbacks
    );
  });

  // (Navbar) Listener for the "Settings" link in the navigation bar
  // Stops any active countdown and returns to the settings screen
  elements.settingsLink.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  // (Navbar) Listener for the "Blocking websites" link in the navigation bar
  // Displays the website blocking configuration screen
  elements.blockingWebsitesLink.addEventListener("click", () => {
    showScreen(SCREENS.BLOCKING, elements);
  });

  // (Button) Listener for the "Back" button on the Focus screen
  // Stops the focus countdown and returns to the settings screen
  elements.focusSettingsButton.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  // (Button) Listener for the "Back" button on the Pause screen
  // Stops the pause countdown and returns to the settings screen
  elements.pauseSettingsButton.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  // (Button) Listener for the "Skip" button on the Focus screen
  // Immediately ends the current focus period and transitions to the pause period
  elements.skipFocusButton.addEventListener("click", async () => {
    stopCountdown(elements, timerCallbacks);
    appState.currentCycle++;
    await setStorage({
      screen: SCREENS.PAUSE,
      startTime: Date.now(),
      currentCycle: appState.currentCycle,
    });
    showScreen(SCREENS.PAUSE, elements);
    startCountdown(
      appState.durationPauseGlobal,
      "pause",
      elements,
      appState,
      timerCallbacks
    );
  });

  // (Button) Listener for the "Skip" button on the Pause screen
  // Immediately ends the current pause period and transitions to the next focus period
  // or ends the session if all cycles are complete
  elements.skipPauseButton.addEventListener("click", async () => {
    stopCountdown(elements, timerCallbacks);
    if (appState.currentCycle < appState.totalCycles) {
      appState.currentCycle++;
      await setStorage({
        screen: SCREENS.FOCUS,
        startTime: Date.now(),
        currentCycle: appState.currentCycle,
      });
      showScreen(SCREENS.FOCUS, elements);
      startCountdown(
        appState.durationFocusGlobal,
        "focus",
        elements,
        appState,
        timerCallbacks
      );
    } else {
      await setStorage({ screen: SCREENS.WELCOME });
      showScreen(SCREENS.WELCOME, elements);
    }
  });

  // Listener for the submission of the website blocking form (when Enter is pressed)
  // Handles adding new URLs to the blocked list
  elements.websiteForm.addEventListener("submit", (e) => {
    handleWebsiteFormSubmit(
      e,
      elements,
      getIsStudyMode,
      renderBlockedWebsites,
      applyBlockingRules
    );
  });
});
