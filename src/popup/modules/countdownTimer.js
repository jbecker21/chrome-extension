import { getStorage, setStorage } from "./storageManager.js";
import { SCREENS } from "../utils/constants.js";

let countdownInterval = null;
let isStudyMode = false;

/**
 * Updates the displayed time on the appropriate countdown timer element.
 * It formats the given seconds into HH:MM:SS and updates either the focus or pause timer.
 *
 * @param {number} seconds - The total remaining seconds to display
 * @param {object} elements - An object containing references to various DOM elements,
 * including countdownTimerFocus, countdownTimerPause,
 * focusScreen, and pauseScreen.
 */
function updateTimerDisplay(seconds, elements) {
  // Calculate hours, mins, seconds from the total seconds
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Format the time components into a HH:MM:SS string
  const timeString = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;

  // Update the text content of the visible countdown timer depending on which screen is active
  if (elements.focusScreen.style.display === "block") {
    elements.countdownTimerFocus.textContent = timeString;
  } else if (elements.pauseScreen.style.display === "block") {
    elements.countdownTimerPause.textContent = timeString;
  }
}

/**
 * Starts a new countdown timer for either a 'focus' or 'pause' period.
 * Manages the interval, updates the display, and handles website blocking.
 *
 * @param {number} initialDuration - The starting duration of the countdown in seconds
 * @param {'focus' | 'pause'} mode - The current mode of the timer
 * @param {object} elements - DOM elements object from popup.js
 * @param {object} appState - The global application state object
 * @param {object} callbacks - An object containing callback functions (onTick, onEnd, applyBlockingRules)
 * to be executed at specific timer events
 */
export function startCountdown(
  initialDuration,
  mode,
  elements,
  appState,
  callbacks
) {
  isStudyMode = mode === "focus";
  let remaining = initialDuration;
  updateTimerDisplay(remaining, elements);

  // Clear any existing countdown interval to prevent multiple timers running simultaneously.
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // If entering focus mode, apply website blocking rules
  if (isStudyMode) {
    getStorage(["blocked_websites"]).then((data) => {
      const blockedWebsites = data.blocked_websites || [];
      callbacks.applyBlockingRules(blockedWebsites, true);
    });
  }

  // Set up the interval to decrement the timer every second
  countdownInterval = setInterval(() => {
    remaining--;
    callbacks.onTick(remaining);

    // Check if countdown is finished
    if (remaining < 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;

      // If the focus period just ended, disable website blocking
      if (isStudyMode) {
        getStorage(["blocked_websites"]).then((data) => {
          const blockedWebsites = data.blocked_websites || [];
          callbacks.applyBlockingRules(blockedWebsites, false);
        });
      }

      // Execute the onEnd callback to signal the end of the timer period
      callbacks.onEnd(mode);
      return;
    }
    // Update the timer display with the new remaining time.
    updateTimerDisplay(remaining, elements);
  }, 1000);
}

/**
 * Stops the currently active countdown timer.
 * Clears the interval and ensures website blocking is disabled.
 *
 * @param {object} elements - DOM elements object
 * @param {object} callbacks - Callbacks object containing applyBlockingRules
 */
export function stopCountdown(elements, callbacks) {
  // Clear the interval if one is active
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

/**
 * Returns the current status of whether the timer is in 'study' mode
 *
 * @returns {boolean} - True if currently in study mode, false otherwise
 */
export function getIsStudyMode() {
  return isStudyMode;
}

/**
 * Restores a countdown session that was previously active when the popup was closed.
 * It calculates the remaining time based on the stored start time and duration,
 * then restarts the countdown if applicable.
 *
 * @param {object} elements - DOM elements object
 * @param {object} appState - The global application state object
 * @param {object} callbacks - Callbacks object
 * @param {object} storedData - Data retrieved from browser storage (startTime, durationFocus, durationPause)
 * @param {string} currentScreen - The screen that was active when the popup closed (e.g., SCREENS.FOCUS, SCREENS.PAUSE)
 */
export async function restoreCountdown(
  elements,
  appState,
  callbacks,
  storedData,
  currentScreen
) {
  const startTime = storedData.startTime; // Timestamp when the countdown last started
  const durationFocus = storedData.durationFocus;
  const durationPause = storedData.durationPause;

  let remaining = 0;
  let mode = null;
  let initialDuration = 0;

  // Determine if a focus session needs to be restored
  if (currentScreen === SCREENS.FOCUS && startTime && durationFocus) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = durationFocus - elapsed;
    mode = "focus";
    initialDuration = durationFocus;
  }
  // Determine if a pause session needs to be restored
  else if (currentScreen === SCREENS.PAUSE && startTime && durationPause) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = durationPause - elapsed;
    mode = "pause";
    initialDuration = durationPause;
  }
  // If a valid mode is identified and time is remaining, restart the countdown
  if (mode && remaining > 0) {
    startCountdown(remaining, mode, elements, appState, callbacks);
  } else if (mode) {
    elements.countdownTimerFocus.textContent = "00:00:00";
    elements.countdownTimerPause.textContent = "00:00:00";
    callbacks.onEnd(mode);
  }
}
