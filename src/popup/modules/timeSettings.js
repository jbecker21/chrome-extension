import { setStorage } from "./storageManager.js";

/**
 * Sets up event listeners for all time and cycle adjustment buttons
 * (increase/decrease study time, pause time, and cycle number).
 * When a button is clicked, it updates the corresponding value in the application state,
 * refreshes the display, and saves the new setting to browser storage.
 *
 * @param {object} elements - An object containing references to all necessary DOM elements,
 * including the buttons and display elements for study time, pause time, and cycles.
 * @param {object} state - The global application state object, which holds `currentStudyTime`,
 * `currentPauseTime`, and `currentCycleNumber`.
 */
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

  // Iterate over each control definition to attach a click event listener
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

/**
 * Initializes the display of study time, pause time, and cycle number
 * in the user interface based on the current values in the application state.
 *
 * @param {object} elements - An object containing references to the DOM elements
 * (`studyTimeDisplay`, `pauseTimeDisplay`, `cycleNumberDisplay`) that show these values.
 * @param {object} state - The global application state object, containing the
 * `currentStudyTime`, `currentPauseTime`, and `currentCycleNumber` values to display.
 */
export function initializeTimeDisplays(elements, state) {
  elements.studyTimeDisplay.textContent = state.currentStudyTime;
  elements.pauseTimeDisplay.textContent = state.currentPauseTime;
  elements.cycleNumberDisplay.textContent = state.currentCycleNumber;
}
