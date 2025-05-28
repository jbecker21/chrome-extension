import { setStorage } from "./storageManager.js";

export function setupTimeControls(elements, state) {
  const controls = [
    { button: elements.decreaseStudyTimeButton, type: "study", operation: "-" },
    { button: elements.increaseStudyTimeButton, type: "study", operation: "+" },
    { button: elements.decreasePauseTimeButton, type: "pause", operation: "-" },
    { button: elements.increasePauseTimeButton, type: "pause", operation: "+" },
    {
      button: elements.decreaseCycleNumberButton,
      type: "cycle",
      operation: "-",
    },
    {
      button: elements.increaseCycleNumberButton,
      type: "cycle",
      operation: "+",
    },
  ];

  controls.forEach(({ button, type, operation }) => {
    button.addEventListener("click", async () => {
      let valueChanged = false;
      if (type === "study") {
        if (operation === "-" && state.currentStudyTime > 1) {
          state.currentStudyTime--;
          valueChanged = true;
        } else if (operation === "+") {
          state.currentStudyTime++;
          valueChanged = true;
        }
        if (valueChanged) {
          elements.studyTimeDisplay.textContent = state.currentStudyTime;
          await setStorage({ studyTimeMinutes: state.currentStudyTime });
        }
      } else if (type === "pause") {
        if (operation === "-" && state.currentPauseTime > 1) {
          state.currentPauseTime--;
          valueChanged = true;
        } else if (operation === "+") {
          state.currentPauseTime++;
          valueChanged = true;
        }
        if (valueChanged) {
          elements.pauseTimeDisplay.textContent = state.currentPauseTime;
          await setStorage({ pauseTimeMinutes: state.currentPauseTime });
        }
      } else if (type === "cycle") {
        if (operation === "-" && state.currentCycleNumber > 1) {
          state.currentCycleNumber--;
          valueChanged = true;
        } else if (operation === "+") {
          state.currentCycleNumber++;
          valueChanged = true;
        }
        if (valueChanged) {
          elements.cycleNumberDisplay.textContent = state.currentCycleNumber;
          await setStorage({ cycles: state.currentCycleNumber });
        }
      }
    });
  });
}

export function initializeTimeDisplays(elements, state) {
  elements.studyTimeDisplay.textContent = state.currentStudyTime;
  elements.pauseTimeDisplay.textContent = state.currentPauseTime;
  elements.cycleNumberDisplay.textContent = state.currentCycleNumber;
}
