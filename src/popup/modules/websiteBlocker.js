import { getStorage, setStorage } from "./storageManager.js";
import { RULE_ID_START } from "../utils/constants.js";

/**
 * Renders the list of blocked websites in the UI, creating interactive elements
 * for each URL that allow it to be removed.
 *
 * @param {string[]} urls - An array of domain strings (e.g., "youtube.com") to be displayed.
 * @param {object} elements - An object containing references to necessary DOM elements,
 * specifically `elements.websitesList` where the URLs will be rendered.
 * @param {function(): boolean} isStudyModeCallback - A callback function that returns
 * `true` if the app is currently in study (focus) mode, `false` otherwise.
 * @param {function(string[], boolean): void} applyBlockingRulesCallback - A callback function
 * to apply or remove the actual website blocking rules based on the provided URLs and study mode status.
 */
export function renderBlockedWebsites(
  urls,
  elements,
  isStudyModeCallback,
  applyBlockingRulesCallback
) {
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

    closeBtn.addEventListener("click", async () => {
      const updatedList = urls.filter((_, i) => i !== index);
      await setStorage({ blocked_websites: updatedList });
      applyBlockingRulesCallback(updatedList, isStudyModeCallback());
      renderBlockedWebsites(
        updatedList,
        elements,
        isStudyModeCallback,
        applyBlockingRulesCallback
      );
    });

    box.appendChild(closeBtn);
    elements.websitesList.appendChild(box);
  });
}

/**
 * Applies or removes dynamic website blocking rules using the Chrome declarativeNetRequest API.
 * Rules are only applied when in 'study time' mode.
 *
 * @param {string[]} domains - An array of domain strings (e.g., "youtube.com") to block or unblock.
 * @param {boolean} isStudyTime - A boolean indicating whether the app is currently in study (focus) mode.
 * If `false`, all existing blocking rules will be removed.
 */
export function applyBlockingRules(domains, isStudyTime) {
  const ruleIds = domains.map((_, index) => RULE_ID_START + index);

  if (!chrome.declarativeNetRequest) {
    console.warn(
      "declarativeNetRequest API not available. Cannot block websites."
    );
    return;
  }

  if (!isStudyTime) {
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: ruleIds,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error removing blocking rules:",
            chrome.runtime.lastError
          );
        } else {
          console.log("Blocking rules removed:", ruleIds);
          console.log();
        }
      }
    );
    return;
  }

  console.log("Study Mode activated, Websites blocked: ", ruleIds);
  const rules = domains.map((domain, index) => ({
    id: RULE_ID_START + index,
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
      if (chrome.runtime.lastError) {
        console.error(
          "Error applying blocking rules:",
          chrome.runtime.lastError
        );
      } else {
        console.log("Blocking rules applied:", rules);
      }
    }
  );
}

/**
 * Handles the submission of the website blocking form (e.g., when a user types a URL and presses Enter).
 * It validates the input, cleans the domain, checks for duplicates, adds the new domain to storage,
 * updates the UI, and applies/reapplies blocking rules.
 *
 * @param {Event} e - The submit event object from the form.
 * @param {object} elements - An object containing references to necessary DOM elements,
 * including `websiteInput` and `errorBox`.
 * @param {function(): boolean} isStudyModeCallback - Callback to check if the app is in study mode.
 * @param {function(string[], object, function, function): void} renderBlockedWebsitesCallback -
 * Callback to re-render the list of blocked websites in the UI.
 * @param {function(string[], boolean): void} applyBlockingRulesCallback - Callback to apply/remove blocking rules.
 */
export async function handleWebsiteFormSubmit(
  e,
  elements,
  isStudyModeCallback,
  renderBlockedWebsitesCallback,
  applyBlockingRulesCallback
) {
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
    errorBox.textContent = "Please enter a valid domain, like example.com.";
    errorBox.style.visibility = "visible";
    return;
  }

  try {
    const data = await getStorage(["blocked_websites"]);
    const currentList = data.blocked_websites || [];

    if (currentList.includes(domain)) {
      errorBox.textContent = "This domain is already blocked.";
      errorBox.style.visibility = "visible";
      return;
    }

    const updatedList = [...currentList, domain];
    await setStorage({ blocked_websites: updatedList });
    renderBlockedWebsitesCallback(
      updatedList,
      elements,
      isStudyModeCallback,
      applyBlockingRulesCallback
    );
    applyBlockingRulesCallback(updatedList, isStudyModeCallback());
    errorBox.style.visibility = "hidden";
    errorBox.textContent = "";
  } catch (error) {
    console.error("Error adding website:", error);
    errorBox.textContent = "An unexpected error occurred.";
    errorBox.style.visibility = "visible";
  } finally {
    elements.websiteInput.value = "";
  }
}

/**
 * Initializes the blocked websites feature when the popup loads.
 * It retrieves the stored list of blocked websites and renders them in the UI.
 * If the app is currently in study mode, it also applies the blocking rules.
 *
 * @param {object} elements - DOM elements object.
 * @param {function(): boolean} isStudyModeCallback - Callback to check if the app is in study mode.
 * @param {function(string[], boolean): void} applyBlockingRulesCallback - Callback to apply/remove blocking rules.
 */
export async function initializeBlockedWebsites(
  elements,
  isStudyModeCallback,
  applyBlockingRulesCallback
) {
  const storedData = await getStorage(["blocked_websites"]);
  if (Array.isArray(storedData.blocked_websites)) {
    renderBlockedWebsites(
      storedData.blocked_websites,
      elements,
      isStudyModeCallback,
      applyBlockingRulesCallback
    );
  }
}
