document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("screen-welcome");
  const settingsScreen = document.getElementById("screen-settings");
  const focusScreen = document.getElementById("screen-focus");
  const beginButton = document.getElementById("begin-button");
  const startButton = document.getElementById("start-button");
  const countdownTimer = document.getElementById("countdown-timer");

  // Bildschirmstatus & Timer wiederherstellen
  chrome.storage.local.get(
    [
      "screen",
      "studyHours",
      "studyMinutes",
      "pauseHours",
      "pauseMinutes",
      "cycles",
      "duration",
      "startTime",
    ],
    (data) => {
      const screen = data.screen || "welcome";

      welcomeScreen.style.display = screen === "welcome" ? "block" : "none";
      settingsScreen.style.display = screen === "settings" ? "block" : "none";
      focusScreen.style.display = screen === "focus" ? "block" : "none";

      // Eingaben wiederherstellen
      if (screen === "settings") {
        if (data.studyHours)
          document.getElementById("study-hours").value = data.studyHours;
        if (data.studyMinutes)
          document.getElementById("study-minutes").value = data.studyMinutes;
        if (data.pauseHours)
          document.getElementById("pause-hours").value = data.pauseHours;
        if (data.pauseMinutes)
          document.getElementById("pause-minutes").value = data.pauseMinutes;
        if (data.cycles) document.getElementById("cycles").value = data.cycles;
      }

      // Timer weiterlaufen lassen
      if (screen === "focus" && data.startTime && data.duration) {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.duration - elapsed;

        if (remaining > 0) {
          startCountdown(remaining);
        } else {
          countdownTimer.textContent = "Zeit abgelaufen!";
          chrome.storage.local.set({ screen: "welcome" });
        }
      }
    }
  );

  beginButton.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    settingsScreen.style.display = "block";
    focusScreen.style.display = "none";
    chrome.storage.local.set({ screen: "settings" });
  });

  startButton.addEventListener("click", (e) => {
    e.preventDefault();

    const studyHours = parseInt(document.getElementById("study-hours").value);
    const studyMinutes = parseInt(
      document.getElementById("study-minutes").value
    );
    const pauseHours = parseInt(document.getElementById("pause-hours").value);
    const pauseMinutes = parseInt(
      document.getElementById("pause-minutes").value
    );
    const cycles = parseInt(document.getElementById("cycles").value);
    const errorMsg = document.getElementById("form-error");

    errorMsg.style.display = "none";
    errorMsg.textContent = "";

    if (
      isNaN(studyHours) &&
      isNaN(studyMinutes) &&
      isNaN(pauseHours) &&
      isNaN(pauseMinutes) &&
      isNaN(cycles)
    ) {
      errorMsg.textContent = "Please fill in the fields";
      errorMsg.style.display = "block";
      return;
    }

    if (isNaN(studyHours) && isNaN(studyMinutes)) {
      errorMsg.textContent = "Please enter study duration";
      errorMsg.style.display = "block";
      return;
    }

    if (isNaN(pauseHours) && isNaN(pauseMinutes)) {
      errorMsg.textContent = "Please enter pause duration";
      errorMsg.style.display = "block";
      return;
    }

    if (isNaN(cycles) || cycles < 1) {
      errorMsg.textContent = "Please enter the number of cycles";
      errorMsg.style.display = "block";
      return;
    }

    const totalSeconds = ((studyHours || 0) * 60 + (studyMinutes || 0)) * 60;
    if (totalSeconds <= 0) {
      errorMsg.textContent = "Studienzeit muss größer als 0 sein.";
      errorMsg.style.display = "block";
      return;
    }

    const startTime = Date.now();

    // Speichern
    chrome.storage.local.set({
      screen: "focus",
      studyHours,
      studyMinutes,
      pauseHours,
      pauseMinutes,
      cycles,
      duration: totalSeconds,
      startTime: startTime,
    });

    welcomeScreen.style.display = "none";
    settingsScreen.style.display = "none";
    focusScreen.style.display = "block";

    startCountdown(totalSeconds);
  });

  function startCountdown(duration) {
    let remaining = duration;
    updateTimerDisplay(remaining);

    const interval = setInterval(() => {
      remaining--;

      if (remaining < 0) {
        clearInterval(interval);
        countdownTimer.textContent = "Zeit abgelaufen!";
        return;
      }

      updateTimerDisplay(remaining);
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    countdownTimer.textContent = `${String(hrs).padStart(2, "0")}:${String(
      mins
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
});
