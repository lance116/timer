const DEFAULT_SETTINGS = {
  birthDate: "",
  lifespanYears: 85
};

const form = document.querySelector("#settings-form");
const birthDateInput = document.querySelector("#birth-date");
const lifespanYearsInput = document.querySelector("#lifespan-years");
const status = document.querySelector("#settings-status");

const storage = createStorage();

init();

async function init() {
  const settings = normalizeSettings(await storage.get(DEFAULT_SETTINGS));
  birthDateInput.value = settings.birthDate;
  lifespanYearsInput.value = settings.lifespanYears;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveSettings();
  });

  birthDateInput.addEventListener("change", saveSettings);
  lifespanYearsInput.addEventListener("change", saveSettings);
}

async function saveSettings() {
  const settings = normalizeSettings({
    birthDate: birthDateInput.value,
    lifespanYears: lifespanYearsInput.value
  });

  await storage.set(settings);
  showStatus(settings.birthDate ? "Saved." : "Birth date needed.");
}

function normalizeSettings(value) {
  const lifespanYears = Number.parseFloat(value.lifespanYears);

  return {
    birthDate: typeof value.birthDate === "string" ? value.birthDate : "",
    lifespanYears: Number.isFinite(lifespanYears) ? lifespanYears : 85
  };
}

function showStatus(message) {
  status.textContent = message;
  window.clearTimeout(showStatus.timeout);
  showStatus.timeout = window.setTimeout(() => {
    status.textContent = "";
  }, 1600);
}

function createStorage() {
  const key = "lifeCountdownSettings";
  const chromeStorage =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  if (chromeStorage) {
    return {
      get(defaults) {
        return new Promise((resolve) => {
          chromeStorage.get(defaults, resolve);
        });
      },
      set(value) {
        return new Promise((resolve) => {
          chromeStorage.set(value, resolve);
        });
      }
    };
  }

  return {
    get(defaults) {
      const saved = window.localStorage.getItem(key);
      try {
        return Promise.resolve(saved ? JSON.parse(saved) : defaults);
      } catch {
        return Promise.resolve(defaults);
      }
    },
    set(value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    }
  };
}
