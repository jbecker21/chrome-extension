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
    countdownTimerFocus: document.getElementById("countdown-timer-focus"),
    countdownTimerPause: document.getElementById("countdown-timer-pause"),
    formError: document.getElementById("form-error"),
    studyHours: document.getElementById("study-hours"),
    studyMinutes: document.getElementById("study-minutes"),
    pauseHours: document.getElementById("pause-hours"),
    pauseMinutes: document.getElementById("pause-minutes"),
    cycles: document.getElementById("cycles"),
  };

  let countdownInterval = null;

  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
    chrome.storage.local.set({ screen: SCREENS.SETTINGS });
  });

  elements.startButton.addEventListener("click", (e) => {
    e.preventDefault();

    const inputs = validateInputs();
    if (!inputs) return;

    const startTime = Date.now();

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
    startCountdownPause(inputs.totalSecondsPause);
  });

  // Hilfsfunktion: Zeigt nur den angegebenen Screen, blendet andere aus
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

  // Hilfsfunktion: Eingabewerte aus dem Storage in die Form laden
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

  // Timer Anzeige aktualisieren
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

  // Countdown starten, gibt clearInterval zurück um ihn stoppen zu können
  function startCountdownFocus(durationFocus, durationPause) {
    let remaining = durationFocus;
    updateTimerDisplay(remaining);

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        elements.countdownTimerFocus.textContent = "Zeit abgelaufen!";
        chrome.storage.local.set({ screen: SCREENS.PAUSE });
        showScreen(SCREENS.PAUSE);
        startCountdownPause(durationPause); // Hier korrekt übergeben
        return;
      }

      updateTimerDisplay(remaining);
    }, 1000);
  }

  function startCountdownPause(duration) {
    let remaining = duration;
    updateTimerDisplay(remaining);

    // Falls bereits ein Timer läuft, stoppen
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        elements.countdownTimerFocus.textContent = "Zeit abgelaufen!";
        // Nach Ablauf zurück zum Willkommensscreen wechseln
        chrome.storage.local.set({ screen: SCREENS.SETTINGS });
        showScreen(SCREENS.SETTINGS);
        return;
      }

      updateTimerDisplay(remaining);
    }, 1000);
  }

  // Fehleranzeige setzen oder verbergen
  function setError(message) {
    if (!message) {
      elements.formError.style.display = "none";
      elements.formError.textContent = "";
    } else {
      elements.formError.textContent = message;
      elements.formError.style.display = "block";
    }
  }

  // Eingaben validieren und als Objekt zurückgeben oder Fehler auslösen
  function validateInputs() {
    const studyHours = parseInt(elements.studyHours.value.trim(), 10);
    const studyMinutes = parseInt(elements.studyMinutes.value.trim(), 10);
    const pauseHours = parseInt(elements.pauseHours.value.trim(), 10);
    const pauseMinutes = parseInt(elements.pauseMinutes.value.trim(), 10);
    const cycles = parseInt(elements.cycles.value.trim(), 10);

    // Mindestens eine Eingabe muss gesetzt sein
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

    setError(null); // Keine Fehler
    return {
      studyHours,
      studyMinutes,
      pauseHours,
      pauseMinutes,
      cycles,
      totalSecondsFocus: totalSecondsFocus,
      totalSecondsPause: totalSecondsPause,
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

        if (remaining > 0) {
          startCountdownFocus(remaining, data.durationPause);
        } else {
          elements.countdownTimerFocus.textContent = "Zeit abgelaufen!";
          chrome.storage.local.set({ screen: SCREENS.WELCOME });

          showScreen(SCREENS.PAUSE);
        }
      }
      if (screen === SCREENS.PAUSE && data.startTime && data.durationPause) {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.durationPause - elapsed;

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
