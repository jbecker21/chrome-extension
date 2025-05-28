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

  const appState = {
    currentStudyTime: DEFAULT_STUDY_TIME,
    currentPauseTime: DEFAULT_PAUSE_TIME,
    currentCycleNumber: DEFAULT_CYCLES,
    currentCycle: 0,
    totalCycles: 0,
    durationFocusGlobal: 0,
    durationPauseGlobal: 0,
  };

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

  appState.currentStudyTime = storedData.studyTimeMinutes ?? DEFAULT_STUDY_TIME;
  appState.currentPauseTime = storedData.pauseTimeMinutes ?? DEFAULT_PAUSE_TIME;
  appState.currentCycleNumber = storedData.cycles ?? DEFAULT_CYCLES;
  appState.currentCycle = storedData.currentCycle ?? 1; // Initialisierung der aktuellen Zyklusnummer
  appState.totalCycles = appState.currentCycleNumber; // Initialisierung der Gesamtzahl der Zyklen

  initializeTimeDisplays(elements, appState);
  initializeBlockedWebsites(elements, getIsStudyMode, applyBlockingRules);

  const initialScreen = storedData.screen || SCREENS.WELCOME;
  showScreen(initialScreen, elements);

  appState.durationFocusGlobal =
    storedData.durationFocus ?? appState.currentStudyTime * 60;
  appState.durationPauseGlobal =
    storedData.durationPause ?? appState.currentPauseTime * 60;

  restoreCountdown(
    elements,
    appState,
    timerCallbacks,
    storedData,
    initialScreen
  );

  // --- Event Listeners ---

  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS, elements);
  });

  elements.startButton.addEventListener("click", async () => {
    appState.totalCycles = appState.currentCycleNumber; // Verwende appState
    appState.currentCycle = 1; // Verwende appState
    appState.durationFocusGlobal = appState.currentStudyTime * 60; // Verwende appState
    appState.durationPauseGlobal = appState.currentPauseTime * 60; // Verwende appState

    await setStorage({
      screen: SCREENS.FOCUS,
      studyTimeMinutes: appState.currentStudyTime,
      pauseTimeMinutes: appState.currentPauseTime,
      cycles: appState.currentCycleNumber,
      currentCycle: appState.currentCycle, // Verwende appState
      durationFocus: appState.durationFocusGlobal, // Verwende appState
      durationPause: appState.durationPauseGlobal, // Verwende appState
      startTime: Date.now(),
    });

    showScreen(SCREENS.FOCUS, elements);
    startCountdown(
      appState.durationFocusGlobal, // Verwende appState
      "focus",
      elements,
      appState,
      timerCallbacks
    );
  });

  elements.settingsLink.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  elements.blockingWebsitesLink.addEventListener("click", () => {
    showScreen(SCREENS.BLOCKING, elements);
  });

  elements.focusSettingsButton.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  elements.pauseSettingsButton.addEventListener("click", () => {
    stopCountdown(elements, timerCallbacks);
    showScreen(SCREENS.SETTINGS, elements);
  });

  elements.skipFocusButton.addEventListener("click", async () => {
    stopCountdown(elements, timerCallbacks);
    appState.currentCycle++; // Verwende appState
    await setStorage({
      screen: SCREENS.PAUSE,
      startTime: Date.now(),
      currentCycle: appState.currentCycle, // Verwende appState
    });
    showScreen(SCREENS.PAUSE, elements);
    startCountdown(
      appState.durationPauseGlobal, // Verwende appState
      "pause",
      elements,
      appState,
      timerCallbacks
    );
  });

  elements.skipPauseButton.addEventListener("click", async () => {
    stopCountdown(elements, timerCallbacks);
    if (appState.currentCycle < appState.totalCycles) {
      // Verwende appState
      appState.currentCycle++; // Verwende appState
      await setStorage({
        screen: SCREENS.FOCUS,
        startTime: Date.now(),
        currentCycle: appState.currentCycle, // Verwende appState
      });
      showScreen(SCREENS.FOCUS, elements);
      startCountdown(
        appState.durationFocusGlobal, // Verwende appState
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

  setupTimeControls(elements, appState);

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
