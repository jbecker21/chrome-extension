document.addEventListener("DOMContentLoaded", () => {
  const SCREENS = {
    WELCOME: "welcome",
    SETTINGS: "settings",
    FOCUS: "focus",
    PAUSE: "pause",
    BLOCKING: "blocking",
  };

  const elements = {
    welcomeScreen: document.getElementById("screen-welcome"),
    settingsScreen: document.getElementById("screen-settings"),
    focusScreen: document.getElementById("screen-focus"),
    pauseScreen: document.getElementById("screen-pause"),
    blockingWebsitesScreen: document.getElementById("screen-blocking-websites"),

    welcomeButton: document.getElementById("begin-button"),
    startButton: document.getElementById("start-button"),

    settingsLink: document.getElementById("link-settings"),
    blockingWebsitesLink: document.getElementById("link-blocking-websites"),

    decreaseStudyTimeButton: document.getElementById("decrease-study-time"),
    increaseStudyTimeButton: document.getElementById("increase-study-time"),
    decreasePauseTimeButton: document.getElementById("decrease-pause-time"),
    increasePauseTimeButton: document.getElementById("increase-pause-time"),
    decreaseCycleNumberButton: document.getElementById("decrease-cycle-number"),
    increaseCycleNumberButton: document.getElementById("increase-cycle-number"),

    studyTimeDisplay: document.getElementById("study-time-display"),
    pauseTimeDisplay: document.getElementById("pause-time-display"),
    cycleNumberDisplay: document.getElementById("cycle-number-display"),

    websiteForm: document.getElementById("url-form"),
    websiteInput: document.getElementById("url-input"),
    websitesList: document.getElementById("url-list"),
    errorBox: document.getElementById("url-error"),

    focusSettingsButton: document.getElementById("settings-button-focus"),
    pauseSettingsButton: document.getElementById("settings-button-pause"),
    skipFocusButton: document.getElementById("skip-focus-button"),
    skipPauseButton: document.getElementById("skip-pause-button"),
    countdownTimerFocus: document.getElementById("countdown-timer-focus"),
    countdownTimerPause: document.getElementById("countdown-timer-pause"),
  };

  // Constants
  const DEFAULT_STUDY_TIME = 25;
  const DEFAULT_PAUSE_TIME = 10;
  const DEFAULT_CYCLES = 2;

  // Global Variables
  let countdownInterval = null;
  let currentCycle = 0;
  let totalCycles = 0;
  let durationFocusGlobal = 0;
  let durationPauseGlobal = 0;
  let isStudyMode = false;

  let currentStudyTime = DEFAULT_STUDY_TIME;
  let currentPauseTime = DEFAULT_PAUSE_TIME;
  let currentCycleNumber = DEFAULT_CYCLES;

  // Event Handlers

  // Welcome -> Settings
  elements.welcomeButton.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
    document.getElementById("navbar").style.display = "flex";
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

  // Navigation
  elements.settingsLink.addEventListener("click", () => {
    showScreen(SCREENS.SETTINGS);
  });

  elements.blockingWebsitesLink.addEventListener("click", () => {
    showScreen(SCREENS.BLOCKING);
  });

  // Go Back to Settings Button
  elements.focusSettingsButton.addEventListener("click", () => {
    stopCountdown();
    showScreen(SCREENS.SETTINGS);
  });

  // Go Back to Settings Button
  elements.pauseSettingsButton.addEventListener("click", () => {
    stopCountdown();
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
    if (currentCycleNumber > 1) {
      updateCycleNumberDisplay("-");
    }
  });

  elements.increaseCycleNumberButton.addEventListener("click", () => {
    updateCycleNumberDisplay("+");
  });

  elements.websiteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let input = elements.websiteInput.value.trim();
    const errorBox = elements.errorBox;
    errorBox.style.visibility = "hidden";
    errorBox.textContent = "";

    if (!input) return;

    input = input.replace(/^https?:\/\//, "").replace(/^www\./, "");

    const domain = input.split(/[/?#]/)[0];

    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(domain)) {
      errorBox.textContent = "Please enter a valid domain, like youtube.com.";
      errorBox.style.visibility = "visible";
      return;
    }

    chrome.storage.local.get(["blocked_websites"], (data) => {
      const currentList = data.blocked_websites || [];

      if (currentList.includes(domain)) {
        errorBox.textContent = "This domain is already blocked.";
        errorBox.style.visibility = "visible";
        return;
      }

      fetch("https://" + domain, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          const updatedList = [...currentList, domain];
          chrome.storage.local.set({ blocked_websites: updatedList }, () => {
            renderBlockedWebsites(updatedList);
            applyBlockingRules(updatedList, isStudyMode);
            errorBox.style.visibility = "hidden";
            errorBox.textContent = "";
          });
        })
        .catch(() => {
          errorBox.textContent = "This domain is not reachable.";
          errorBox.style.visibility = "visible";
        });
    });

    elements.websiteInput.value = "";
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
    elements.blockingWebsitesScreen.style.display =
      screenName === SCREENS.BLOCKING ? "block" : "none";
    chrome.storage.local.set({ screen: screenName });
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
    isStudyMode = true;
    let remaining = duration;
    updateTimerDisplay(remaining);

    if (countdownInterval) clearInterval(countdownInterval);

    // Websites blockieren zu Beginn der Study Time
    chrome.storage.local.get(["blocked_websites"], (data) => {
      const blockedWebsites = data.blocked_websites || [];
      applyBlockingRules(blockedWebsites, true);
    });

    countdownInterval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;

        // Webseiten-Blockierung deaktivieren
        chrome.storage.local.get(["blocked_websites"], (data) => {
          const blockedWebsites = data.blocked_websites || [];
          applyBlockingRules(blockedWebsites, false);
        });

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
    isStudyMode = false;
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
    isStudyMode = false;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    // Webseiten-Blockierung deaktivieren
    chrome.storage.local.get(["blocked_websites"], (data) => {
      const blockedWebsites = data.blocked_websites || [];
      applyBlockingRules(blockedWebsites, false);
    });
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

  function renderBlockedWebsites(urls) {
    elements.websitesList.innerHTML = "";

    urls.forEach((url, index) => {
      const box = document.createElement("div");
      box.className = "url-box";
      box.style.position = "relative";

      const text = document.createElement("span");
      text.textContent = url;
      box.appendChild(text);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "×";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "5px";
      closeBtn.style.right = "5px";
      closeBtn.style.border = "none";
      closeBtn.style.background = "transparent";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.fontSize = "16px";
      closeBtn.style.lineHeight = "16px";
      closeBtn.style.padding = "0";
      closeBtn.style.color = "#900";

      closeBtn.addEventListener("click", () => {
        const updatedList = urls.filter((_, i) => i !== index);
        chrome.storage.local.set({ blocked_websites: updatedList }, () => {
          applyBlockingRules(updatedList, isStudyMode);
          renderBlockedWebsites(updatedList);
        });
      });

      box.appendChild(closeBtn);
      elements.websitesList.appendChild(box);
    });
  }

  function applyBlockingRules(domains, isStudyTime) {
    const ruleIds = domains.map((_, index) => 1000 + index);

    if (!isStudyTime) {
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          removeRuleIds: ruleIds,
        },
        () => {
          console.log("Blocking rules removed:", ruleIds);
        }
      );
      return;
    }

    const rules = domains.map((domain, index) => ({
      id: 1000 + index,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: domain,
        resourceTypes: ["main_frame"],
      },
    }));

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: ruleIds,
        addRules: rules,
      },
      () => {
        console.log("Blocking rules applied:", rules);
      }
    );
  }

  chrome.storage.local.get(
    [
      "screen",
      "studyTimeMinutes",
      "pauseTimePauseMinutes",
      "cycles",
      "durationFocus",
      "durationPause",
      "blocked_websites",
      "startTime",
    ],
    (data) => {
      const screen = data.screen || SCREENS.WELCOME;

      showScreen(screen);

      if (screen === SCREENS.SETTINGS) {
        currentStudyTime = data.studyTimeMinutes ?? DEFAULT_STUDY_TIME;
        currentPauseTime = data.pauseTimePauseMinutes ?? DEFAULT_PAUSE_TIME;
        currentCycleNumber = data.cycles ?? DEFAULT_CYCLES;

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
      if (Array.isArray(data.blocked_websites)) {
        renderBlockedWebsites(data.blocked_websites);
      }
    }
  );
});
