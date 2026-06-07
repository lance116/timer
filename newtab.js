const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const COUNTDOWN_DECIMALS = 12;
const DEFAULT_SETTINGS = {
  birthDate: "",
  lifespanYears: 85
};

const countdown = document.querySelector("#countdown");

const storage = createStorage();
let settings = { ...DEFAULT_SETTINGS };
let targetTime = null;
let animationFrame = null;

init();

async function init() {
  settings = normalizeSettings(await storage.get(DEFAULT_SETTINGS));
  updateTarget();
  bindStorageUpdates();
  tick();
}

function bindStorageUpdates() {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.onChanged) {
    return;
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.birthDate || changes.lifespanYears) {
      settings = normalizeSettings({
        birthDate: changes.birthDate ? changes.birthDate.newValue : settings.birthDate,
        lifespanYears: changes.lifespanYears
          ? changes.lifespanYears.newValue
          : settings.lifespanYears
      });
      updateTarget();
    }
  });
}

function updateTarget() {
  const birthDate = parseBirthDate(settings.birthDate);

  if (!birthDate || !Number.isFinite(settings.lifespanYears)) {
    targetTime = null;
    countdown.textContent = placeholderCountdown();
    countdown.dataset.state = "empty";
    return;
  }

  targetTime = birthDate.getTime() + settings.lifespanYears * MS_PER_YEAR;
  countdown.dataset.state = "active";
}

function tick() {
  if (targetTime !== null) {
    const remainingYears = Math.max(0, (targetTime - Date.now()) / MS_PER_YEAR);
    countdown.textContent = `${remainingYears.toFixed(COUNTDOWN_DECIMALS)} years`;
  }

  animationFrame = window.requestAnimationFrame(tick);
}

function normalizeSettings(value) {
  const lifespanYears = Number.parseFloat(value.lifespanYears);

  return {
    birthDate: typeof value.birthDate === "string" ? value.birthDate : "",
    lifespanYears: Number.isFinite(lifespanYears) ? lifespanYears : 85
  };
}

function parseBirthDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function placeholderCountdown() {
  return `--.${"-".repeat(COUNTDOWN_DECIMALS)} years`;
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
    }
  };
}

window.addEventListener("pagehide", () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
});
