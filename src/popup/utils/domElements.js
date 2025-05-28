export function getDOMElements() {
  return {
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
}
