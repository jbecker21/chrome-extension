import { getStorage, setStorage } from "./storageManager.js";
import { RULE_ID_START } from "../utils/constants.js";

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
      urlFilter: "*://*." + domain + "/*",
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

    // Optional: Überprüfen, ob die Domain erreichbar ist. Kann bei no-cors schwierig sein
    // try {
    //   await fetch("https://" + domain, { method: "HEAD", mode: "no-cors" });
    // } catch (fetchError) {
    //   // Dies fängt Netzwerkfehler ab, aber nicht unbedingt, wenn die Domain nicht existiert
    //   // Da declarativeNetRequest auch nicht-existierende Domains blockieren kann, ist dieser Fetch optional
    //   console.warn("Domain fetch failed, but still attempting to block:", domain, fetchError);
    // }

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
    // Dies sollte nur für storage-Fehler oder den optionalen fetch-Fehler auftreten
    console.error("Error adding website:", error);
    errorBox.textContent = "An unexpected error occurred.";
    errorBox.style.visibility = "visible";
  } finally {
    elements.websiteInput.value = "";
  }
}

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
