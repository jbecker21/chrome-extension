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

    decreaseStudyTimeButton: document.getElementById("decrease-study-time"),
    increaseStudyTimeButton: document.getElementById("increase-study-time"),
    decreasePauseTimeButton: document.getElementById("decrease-pause-time"),
    increasePauseTimeButton: document.getElementById("increase-pause-time"),
    decreaseCycleNumberButton: document.getElementById("decrease-cycle-number"),
    increaseCycleNumberButton: document.getElementById("increase-cycle-number"),

    studyTimeDisplay: document.getElementById("study-time-display"),
    pauseTimeDisplay: document.getElementById("pause-time-display"),
    cycleNumberDisplay: document.getElementById("cycle-number-display"),

    focusSettingsButton: document.getElementById("settings-button-focus"),
    pauseSettingsButton: document.getElementById("settings-button-pause"),
    skipFocusButton: document.getElementById("skip-focus-button"),
    skipPauseButton: document.getElementById("skip-pause-button"),
    countdownTimerFocus: document.getElementById("countdown-timer-focus"),
    countdownTimerPause: document.getElementById("countdown-timer-pause"),
  };

  // Global Variables
  let countdownInterval = null;
  let currentCycle = 0;
  let totalCycles = 0;
  let durationFocusGlobal = 0;
  let durationPauseGlobal = 0;

  let currentStudyTime = 25;
  let currentPauseTime = 10;
  let currentCycleNumber = 2;

  // Event Handlers

  // Welcome -> Settings
  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
    chrome.storage.local.set({ screen: SCREENS.SETTINGS });
  });

  // Settings -> Starting Focus
  elements.startButton.addEventListener("click", (e) => {
    const startTime = Date.now();

    currentCycle = 1;
    totalCycles = currentCycleNumber;
    durationFocusGlobal = currentStudyTime * 60;
    durationPauseGlobal = currentPauseTime * 60;

    chrome.storage.local.set({
      screen: SCREENS.FOCUS,
      studyTimeMinutes: currentStudyTime,
      pauseTimePauseMinutes: currentPauseTime,
      cycles: currentCycle,
      durationFocus: durationFocusGlobal,
      durationPause: durationPauseGlobal,
      startTime: startTime,
    });

    showScreen(SCREENS.FOCUS);
    startCountdownFocus(durationFocusGlobal);
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

  elements.decreaseStudyTimeButton.addEventListener("click", () => {
    if (currentStudyTime > 1) {
      updateStudyTimeDisplay("-");
    }
  });

  elements.increaseStudyTimeButton.addEventListener("click", () => {
    updateStudyTimeDisplay("+");
  });

  elements.decreasePauseTimeButton.addEventListener("click", () => {
    if (currentPauseTime > 1) {
      updatePauseTimeDisplay("-");
    }
  });

  elements.increasePauseTimeButton.addEventListener("click", () => {
    updatePauseTimeDisplay("+");
  });

  elements.decreaseCycleNumberButton.addEventListener("click", () => {
    console.log(currentCycleNumber);
    if (currentCycleNumber > 1) {
      updateCycleNumberDisplay("-");
    }
  });

  elements.increaseCycleNumberButton.addEventListener("click", () => {
    updateCycleNumberDisplay("+");
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

  // Update Study Time Display
  function updateStudyTimeDisplay(mathOperation) {
    if (mathOperation === "-") {
      currentStudyTime--;
    }
    if (mathOperation === "+") {
      currentStudyTime++;
    }
    elements.studyTimeDisplay.textContent = currentStudyTime;
    chrome.storage.local.set({ studyTimeMinutes: currentStudyTime });
  }

  // Update Pause Time Display
  function updatePauseTimeDisplay(mathOperation) {
    if (mathOperation === "-") {
      currentPauseTime--;
    }
    if (mathOperation === "+") {
      currentPauseTime++;
    }
    elements.pauseTimeDisplay.textContent = currentPauseTime;
    chrome.storage.local.set({ pauseTimePauseMinutes: currentPauseTime });
  }

  function updateCycleNumberDisplay(mathOperation) {
    if (mathOperation === "-") {
      currentCycleNumber--;
    }
    if (mathOperation === "+") {
      currentCycleNumber++;
    }
    elements.cycleNumberDisplay.textContent = currentCycleNumber;
    chrome.storage.local.set({ cycles: currentCycleNumber });
  }

  chrome.storage.local.get(
    [
      "screen",
      "studyTimeMinutes",
      "pauseTimePauseMinutes",
      "cycles",
      "durationFocus",
      "durationPause",
      "startTime",
    ],
    (data) => {
      const screen = data.screen || SCREENS.WELCOME;

      showScreen(screen);

      if (screen === SCREENS.SETTINGS) {
        currentStudyTime = data.studyTimeMinutes || currentStudyTime;
        currentPauseTime = data.pauseTimePauseMinutes || currentPauseTime;
        currentCycleNumber = data.cycles || currentCycleNumber;

        elements.studyTimeDisplay.textContent = currentStudyTime;
        elements.pauseTimeDisplay.textContent = currentPauseTime;
        elements.cycleNumberDisplay.textContent = currentCycleNumber;
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
