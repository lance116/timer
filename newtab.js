const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const DEFAULT_SETTINGS = {
  birthDate: "",
  lifespanYears: 85
};

const countdown = document.querySelector("#countdown");
const targetDate = document.querySelector("#target-date");
const form = document.querySelector("#settings-form");
const birthDateInput = document.querySelector("#birth-date");
const lifespanYearsInput = document.querySelector("#lifespan-years");
const status = document.querySelector("#settings-status");

const storage = createStorage();
let settings = { ...DEFAULT_SETTINGS };
let targetTime = null;
let animationFrame = null;

init();

async function init() {
  settings = normalizeSettings(await storage.get(DEFAULT_SETTINGS));
  applySettingsToForm(settings);
  updateTarget();
  bindEvents();
  tick();
}

function bindEvents() {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveSettingsFromForm();
  });

  birthDateInput.addEventListener("change", saveSettingsFromForm);
  lifespanYearsInput.addEventListener("change", saveSettingsFromForm);
}

async function saveSettingsFromForm() {
  const nextSettings = normalizeSettings({
    birthDate: birthDateInput.value,
    lifespanYears: lifespanYearsInput.value
  });

  settings = nextSettings;
  await storage.set(nextSettings);
  updateTarget();
  showStatus(nextSettings.birthDate ? "Saved." : "Add your birth date to start.");
}

function updateTarget() {
  const birthDate = parseBirthDate(settings.birthDate);

  if (!birthDate || !Number.isFinite(settings.lifespanYears)) {
    targetTime = null;
    countdown.textContent = "--.------- years";
    targetDate.textContent = "Enter your birthday and target lifespan.";
    return;
  }

  targetTime = birthDate.getTime() + settings.lifespanYears * MS_PER_YEAR;
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long"
  }).format(new Date(targetTime));
  targetDate.textContent = `Counting down to ${formattedDate}.`;
}

function tick() {
  if (targetTime !== null) {
    const remainingYears = Math.max(0, (targetTime - Date.now()) / MS_PER_YEAR);
    countdown.textContent = `${remainingYears.toFixed(7)} years`;
  }

  animationFrame = window.requestAnimationFrame(tick);
}

function applySettingsToForm(nextSettings) {
  birthDateInput.value = nextSettings.birthDate;
  lifespanYearsInput.value = nextSettings.lifespanYears;
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

function showStatus(message) {
  status.textContent = message;
  window.clearTimeout(showStatus.timeout);
  showStatus.timeout = window.setTimeout(() => {
    status.textContent = "";
  }, 2400);
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

window.addEventListener("pagehide", () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
});
