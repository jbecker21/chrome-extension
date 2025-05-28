import { getStorage, setStorage } from "./storageManager.js";
import { SCREENS } from "../utils/constants.js";

let countdownInterval = null;
let isStudyMode = false;

function updateTimerDisplay(seconds, elements) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const timeString = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;

  if (elements.focusScreen.style.display === "block") {
    elements.countdownTimerFocus.textContent = timeString;
  } else if (elements.pauseScreen.style.display === "block") {
    elements.countdownTimerPause.textContent = timeString;
  }
}

export function startCountdown(
  initialDuration,
  mode, // 'focus' oder 'pause'
  elements,
  appState,
  callbacks
) {
  isStudyMode = mode === "focus";
  let remaining = initialDuration;
  updateTimerDisplay(remaining, elements);

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  if (isStudyMode) {
    getStorage(["blocked_websites"]).then((data) => {
      const blockedWebsites = data.blocked_websites || [];
      callbacks.applyBlockingRules(blockedWebsites, true);
    });
  }

  countdownInterval = setInterval(() => {
    remaining--;
    callbacks.onTick(remaining);

    if (remaining < 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;

      if (isStudyMode) {
        getStorage(["blocked_websites"]).then((data) => {
          const blockedWebsites = data.blocked_websites || [];
          callbacks.applyBlockingRules(blockedWebsites, false);
        });
      }

      callbacks.onEnd(mode);
      return;
    }

    updateTimerDisplay(remaining, elements);
  }, 1000);
}

export function stopCountdown(elements, callbacks) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  getStorage(["blocked_websites"]).then((data) => {
    const blockedWebsites = data.blocked_websites || [];
    callbacks.applyBlockingRules(blockedWebsites, false);
  });
  isStudyMode = false;
}

export function getIsStudyMode() {
  return isStudyMode;
}

export async function restoreCountdown(
  elements,
  appState,
  callbacks,
  storedData,
  currentScreen
) {
  const startTime = storedData.startTime;
  const durationFocus = storedData.durationFocus;
  const durationPause = storedData.durationPause;

  let remaining = 0;
  let mode = null;
  let initialDuration = 0;

  if (currentScreen === SCREENS.FOCUS && startTime && durationFocus) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = durationFocus - elapsed;
    mode = "focus";
    initialDuration = durationFocus;
  } else if (currentScreen === SCREENS.PAUSE && startTime && durationPause) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = durationPause - elapsed;
    mode = "pause";
    initialDuration = durationPause;
  }

  if (mode && remaining > 0) {
    startCountdown(remaining, mode, elements, appState, callbacks);
  } else if (mode) {
    elements.countdownTimerFocus.textContent = "00:00:00";
    elements.countdownTimerPause.textContent = "00:00:00";
    callbacks.onEnd(mode);
  }
}
