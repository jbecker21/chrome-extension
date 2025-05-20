document.addEventListener("DOMContentLoaded", () => {
  const SCREENS = {
    WELCOME: "welcome",
    SETTINGS: "settings",
    FOCUS: "focus",
    PAUSE: "pause",
  };

  const elements = {
    welcomeScreen: document.getElementById("screen-welcome"),
    settingsScreen: document.getElementById("screen-settings"),
    focusScreen: document.getElementById("screen-focus"),
    pauseScreen: document.getElementById("screen-pause"),
    welcomeButton: document.getElementById("begin-button"),
    startButton: document.getElementById("start-button"),
    focusSettingsButton: document.getElementById("settings-button-focus"),
    pauseSettingsButton: document.getElementById("settings-button-pause"),

    skipFocusButton: document.getElementById("skip-focus-button"),
    skipPauseButton: document.getElementById("skip-pause-button"),
    countdownTimerFocus: document.getElementById("countdown-timer-focus"),
    countdownTimerPause: document.getElementById("countdown-timer-pause"),
    formError: document.getElementById("form-error"),
    studyHours: document.getElementById("study-hours"),
    studyMinutes: document.getElementById("study-minutes"),
    pauseHours: document.getElementById("pause-hours"),
    pauseMinutes: document.getElementById("pause-minutes"),
    cycles: document.getElementById("cycles"),
  };
  // Global Variables
  let countdownInterval = null;
  let currentCycle = 0;
  let totalCycles = 0;
  let durationFocusGlobal = 0;
  let durationPauseGlobal = 0;

  // Event Handlers

  // Welcome -> Settings
  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
    chrome.storage.local.set({ screen: SCREENS.SETTINGS });
  });

  // Settings -> Starting Focus (if input is complete and correct)
  elements.startButton.addEventListener("click", (e) => {
    e.preventDefault();

    const inputs = validateInputs();
    if (!inputs) return;

    const startTime = Date.now();

    currentCycle = 1;
    totalCycles = inputs.cycles;
    durationFocusGlobal = inputs.totalSecondsFocus;
    durationPauseGlobal = inputs.totalSecondsPause;

    chrome.storage.local.set({
      screen: SCREENS.FOCUS,
      studyHours: inputs.studyHours,
      studyMinutes: inputs.studyMinutes,
      pauseHours: inputs.pauseHours,
      pauseMinutes: inputs.pauseMinutes,
      cycles: inputs.cycles,
      durationFocus: inputs.totalSecondsFocus,
      durationPause: inputs.totalSecondsPause,
      startTime: startTime,
    });

    showScreen(SCREENS.FOCUS);
    startCountdownFocus(inputs.totalSecondsFocus);
  });

  // Go Back to Settings Button
  elements.focusSettingsButton.addEventListener("click", () => {
    stopCountdown();
    chrome.storage.local.set({ screen: SCREENS.SETTINGS });
    showScreen(SCREENS.SETTINGS);
  });

  // Go Back to Settings Button
  elements.pauseSettingsButton.addEventListener("click", () => {
    stopCountdown();
    chrome.storage.local.set({ screen: SCREENS.SETTINGS });
    showScreen(SCREENS.SETTINGS);
  });
  // Skip Focus -> to Pause
  elements.skipFocusButton.addEventListener("click", () => {
    stopCountdown();
    chrome.storage.local.set({ screen: SCREENS.PAUSE, startTime: Date.now() });
    showScreen(SCREENS.PAUSE);
    startCountdownPause(durationPauseGlobal);
  });

  // Skip Pause -> to Focus
  elements.skipPauseButton.addEventListener("click", () => {
    stopCountdown();
    if (currentCycle < totalCycles) {
      currentCycle++;
      chrome.storage.local.set({
        screen: SCREENS.FOCUS,
        startTime: Date.now(),
      });
      showScreen(SCREENS.FOCUS);
      startCountdownFocus(durationFocusGlobal);
    } else {
      chrome.storage.local.set({ screen: SCREENS.WELCOME });
      showScreen(SCREENS.WELCOME);
    }
  });

  // Helper Functions

  // Display Screen / Hide other screens
  function showScreen(screenName) {
    elements.welcomeScreen.style.display =
      screenName === SCREENS.WELCOME ? "block" : "none";
    elements.settingsScreen.style.display =
      screenName === SCREENS.SETTINGS ? "block" : "none";
    elements.focusScreen.style.display =
      screenName === SCREENS.FOCUS ? "block" : "none";
    elements.pauseScreen.style.display =
      screenName === SCREENS.PAUSE ? "block" : "none";
  }

  // Restore Input Values
  function restoreInputValues(data) {
    if (data.studyHours !== undefined)
      elements.studyHours.value = data.studyHours;
    if (data.studyMinutes !== undefined)
      elements.studyMinutes.value = data.studyMinutes;
    if (data.pauseHours !== undefined)
      elements.pauseHours.value = data.pauseHours;
    if (data.pauseMinutes !== undefined)
      elements.pauseMinutes.value = data.pauseMinutes;
    if (data.cycles !== undefined) elements.cycles.value = data.cycles;
  }

  // Formats seconds as HH:MM:SS and updates the visible timer display accordingly
  function updateTimerDisplay(seconds) {
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

  // Starts the focus timer countdown, switches pause screen when done
  function startCountdownFocus(duration) {
    let remaining = duration;
    updateTimerDisplay(remaining);

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;

        chrome.storage.local.set({
          screen: SCREENS.PAUSE,
          startTime: Date.now(),
        });
        showScreen(SCREENS.PAUSE);
        startCountdownPause(durationPauseGlobal);
        return;
      }

      updateTimerDisplay(remaining);
    }, 1000);
  }

  // Starts the pause timer countdown, switches to focus screen or welcome when done
  function startCountdownPause(duration) {
    let remaining = duration;
    updateTimerDisplay(remaining);

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;

        if (currentCycle < totalCycles) {
          currentCycle++;
          chrome.storage.local.set({
            screen: SCREENS.FOCUS,
            startTime: Date.now(),
          });
          showScreen(SCREENS.FOCUS);
          startCountdownFocus(durationFocusGlobal);
        } else {
          chrome.storage.local.set({ screen: SCREENS.WELCOME });
          showScreen(SCREENS.WELCOME);
        }

        return;
      }

      updateTimerDisplay(remaining);
    }, 1000);
  }

  // Stops the current countdown timer if running
  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }
  // Shows or hides an error message in the form
  function setError(message) {
    if (!message) {
      elements.formError.style.display = "none";
      elements.formError.textContent = "";
    } else {
      elements.formError.textContent = message;
      elements.formError.style.display = "block";
    }
  }

  // Validates user input fields and returns parsed values or null if invalid
  function validateInputs() {
    const studyHours = parseInt(elements.studyHours.value.trim(), 10);
    const studyMinutes = parseInt(elements.studyMinutes.value.trim(), 10);
    const pauseHours = parseInt(elements.pauseHours.value.trim(), 10);
    const pauseMinutes = parseInt(elements.pauseMinutes.value.trim(), 10);
    const cycles = parseInt(elements.cycles.value.trim(), 10);

    if (
      isNaN(studyHours) &&
      isNaN(studyMinutes) &&
      isNaN(pauseHours) &&
      isNaN(pauseMinutes) &&
      isNaN(cycles)
    ) {
      setError("Please fill in the fields");
      return null;
    }

    if (isNaN(studyHours) && isNaN(studyMinutes)) {
      setError("Please enter study duration");
      return null;
    }

    if (isNaN(pauseHours) && isNaN(pauseMinutes)) {
      setError("Please enter pause duration");
      return null;
    }

    if (isNaN(cycles) || cycles < 1) {
      setError("Please enter the number of cycles");
      return null;
    }

    const totalSecondsFocus =
      ((studyHours || 0) * 60 + (studyMinutes || 0)) * 60;
    const totalSecondsPause =
      ((pauseHours || 0) * 60 + (pauseMinutes || 0)) * 60;

    if (totalSecondsFocus <= 0 || totalSecondsPause <= 0) {
      setError("Wrong time input");
      return null;
    }

    setError(null);
    return {
      studyHours,
      studyMinutes,
      pauseHours,
      pauseMinutes,
      cycles,
      totalSecondsFocus,
      totalSecondsPause,
    };
  }

  chrome.storage.local.get(
    [
      "screen",
      "studyHours",
      "studyMinutes",
      "pauseHours",
      "pauseMinutes",
      "cycles",
      "durationFocus",
      "durationPause",
      "startTime",
    ],
    (data) => {
      const screen = data.screen || SCREENS.WELCOME;

      showScreen(screen);

      if (screen === SCREENS.SETTINGS) {
        restoreInputValues(data);
      }

      if (screen === SCREENS.FOCUS && data.startTime && data.durationFocus) {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.durationFocus - elapsed;

        durationFocusGlobal = data.durationFocus;
        durationPauseGlobal = data.durationPause;
        totalCycles = data.cycles || 1;
        currentCycle = 1;

        if (remaining > 0) {
          startCountdownFocus(remaining);
        } else {
          elements.countdownTimerFocus.textContent = "Zeit abgelaufen!";
          chrome.storage.local.set({ screen: SCREENS.PAUSE });
          showScreen(SCREENS.PAUSE);
        }
      }

      if (screen === SCREENS.PAUSE && data.startTime && data.durationPause) {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.durationPause - elapsed;

        durationFocusGlobal = data.durationFocus;
        durationPauseGlobal = data.durationPause;
        totalCycles = data.cycles || 1;
        currentCycle = 1;

        if (remaining > 0) {
          startCountdownPause(remaining);
        } else {
          elements.countdownTimerPause.textContent = "Zeit abgelaufen!";
          chrome.storage.local.set({ screen: SCREENS.WELCOME });
          showScreen(SCREENS.WELCOME);
        }
      }
    }
  );
});
