const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COUNTDOWN_DECIMALS = 12;
const MEALS_PER_DAY = 2.5;
const MONTHS_PER_HAIRCUT = 3;
const WORLD_CUP_CYCLE_START_YEAR = 2026;
const DEFAULT_SETTINGS = {
  birthDate: "",
  targetAge: 85
};

const countdown = document.querySelector("#countdown");
const metrics = {
  days: document.querySelector("#metric-days"),
  meals: document.querySelector("#metric-meals"),
  haircuts: document.querySelector("#metric-haircuts"),
  worldCups: document.querySelector("#metric-world-cups"),
  summers: document.querySelector("#metric-summers")
};
const integerFormatter = new Intl.NumberFormat();
const decimalFormatters = {
  days: new Intl.NumberFormat(undefined, {
    minimumFractionDigits: COUNTDOWN_DECIMALS,
    maximumFractionDigits: COUNTDOWN_DECIMALS
  })
};

const storage = createStorage();
let settings = { ...DEFAULT_SETTINGS };
let targetTime = null;
let animationFrame = null;
let lastMetricSecond = null;

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

    if (changes.birthDate || changes.targetAge || changes.lifespanYears) {
      settings = normalizeSettings({
        birthDate: changes.birthDate ? changes.birthDate.newValue : settings.birthDate,
        targetAge: getChangedValue(changes, "targetAge", "lifespanYears", settings.targetAge)
      });
      updateTarget();
    }
  });
}

function updateTarget() {
  const birthDate = parseBirthDate(settings.birthDate);

  if (!birthDate || !Number.isFinite(settings.targetAge)) {
    targetTime = null;
    countdown.textContent = placeholderCountdown();
    countdown.dataset.state = "empty";
    lastMetricSecond = null;
    updateMetrics(null);
    return;
  }

  targetTime = birthDate.getTime() + settings.targetAge * MS_PER_YEAR;
  countdown.dataset.state = "active";
  lastMetricSecond = null;
  updateMetrics(Date.now());
}

function tick() {
  if (targetTime !== null) {
    const now = Date.now();
    const remainingMs = Math.max(0, targetTime - now);
    const remainingYears = remainingMs / MS_PER_YEAR;
    countdown.textContent = remainingYears.toFixed(COUNTDOWN_DECIMALS);
    metrics.days.textContent = decimalFormatters.days.format(remainingMs / MS_PER_DAY);

    const metricSecond = Math.floor(now / 1000);
    if (metricSecond !== lastMetricSecond) {
      lastMetricSecond = metricSecond;
      updateMetrics(now);
    }
  }

  animationFrame = window.requestAnimationFrame(tick);
}

function updateMetrics(now) {
  if (now === null || targetTime === null) {
    setMetricValues({
      days: null,
      meals: null,
      haircuts: null,
      worldCups: null,
      summers: null
    });
    return;
  }

  const remainingMs = Math.max(0, targetTime - now);
  const days = remainingMs / MS_PER_DAY;
  const nowDate = new Date(now);
  const targetDate = new Date(targetTime);

  setMetricValues({
    meals: Math.ceil(days * MEALS_PER_DAY),
    haircuts: Math.ceil(days / averageDaysPerHaircut()),
    worldCups: countWorldCupsBetween(nowDate, targetDate),
    summers: Math.ceil(remainingMs / MS_PER_YEAR)
  });
}

function setMetricValues(values) {
  for (const [key, value] of Object.entries(values)) {
    metrics[key].textContent =
      typeof value === "number" ? integerFormatter.format(value) : value || "--";
  }
}

function countWorldCupsBetween(startDate, endDate) {
  if (endDate.getTime() <= startDate.getTime()) {
    return 0;
  }

  let year = firstWorldCupYearOnOrAfter(startDate.getFullYear());
  let count = 0;

  while (new Date(year, 0, 1).getTime() <= endDate.getTime()) {
    if (new Date(year, 11, 31, 23, 59, 59, 999).getTime() >= startDate.getTime()) {
      count += 1;
    }
    year += 4;
  }

  return count;
}

function firstWorldCupYearOnOrAfter(year) {
  const offset =
    ((year - WORLD_CUP_CYCLE_START_YEAR) % 4 + 4) % 4;
  return offset === 0 ? year : year + (4 - offset);
}

function averageDaysPerHaircut() {
  return MS_PER_YEAR / MS_PER_DAY / (12 / MONTHS_PER_HAIRCUT);
}

function normalizeSettings(value) {
  const targetAge = parseTargetAge(value);

  return {
    birthDate: typeof value.birthDate === "string" ? value.birthDate : "",
    targetAge: Number.isFinite(targetAge) ? targetAge : 85
  };
}

function parseTargetAge(value) {
  const targetAge = Number.parseFloat(value.targetAge);
  const legacyAge = Number.parseFloat(value.lifespanYears);

  if (
    Number.isFinite(legacyAge) &&
    (!Number.isFinite(targetAge) || targetAge === DEFAULT_SETTINGS.targetAge)
  ) {
    return legacyAge;
  }

  return targetAge;
}

function getChangedValue(changes, primaryKey, legacyKey, fallback) {
  if (changes[primaryKey]) {
    return changes[primaryKey].newValue;
  }

  if (changes[legacyKey]) {
    return changes[legacyKey].newValue;
  }

  return fallback;
}

function parseBirthDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function placeholderCountdown() {
  return `--.${"-".repeat(COUNTDOWN_DECIMALS)}`;
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
