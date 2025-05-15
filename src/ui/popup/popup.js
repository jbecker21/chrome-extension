document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("screen-welcome");
  const settingsScreen = document.getElementById("screen-settings");
  const focusScreen = document.getElementById("screen-focus");

  const beginButton = document.getElementById("begin-button");
  const startButton = document.getElementById("start-button");

  beginButton.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    settingsScreen.style.display = "block";
    focusScreen.style.display = "none";
  });

  startButton.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    settingsScreen.style.display = "none";
    focusScreen.style.display = "block";
  });
});
