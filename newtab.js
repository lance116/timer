const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COUNTDOWN_DECIMALS = 12;
const DEFAULT_SETTINGS = {
  birthDate: "",
  lifespanYears: 85
};

const countdown = document.querySelector("#countdown");
const metrics = {
  days: document.querySelector("#metric-days"),
  weeks: document.querySelector("#metric-weeks"),
  mondays: document.querySelector("#metric-mondays"),
  weekends: document.querySelector("#metric-weekends"),
  summers: document.querySelector("#metric-summers")
};
const integerFormatter = new Intl.NumberFormat();

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
    lastMetricSecond = null;
    updateMetrics(null);
    return;
  }

  targetTime = birthDate.getTime() + settings.lifespanYears * MS_PER_YEAR;
  countdown.dataset.state = "active";
  lastMetricSecond = null;
  updateMetrics(Date.now());
}

function tick() {
  if (targetTime !== null) {
    const now = Date.now();
    const remainingYears = Math.max(0, (targetTime - now) / MS_PER_YEAR);
    countdown.textContent = `${remainingYears.toFixed(COUNTDOWN_DECIMALS)} years`;

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
      weeks: null,
      mondays: null,
      weekends: null,
      summers: null
    });
    return;
  }

  const remainingMs = Math.max(0, targetTime - now);
  const days = Math.ceil(remainingMs / MS_PER_DAY);
  const nowDate = new Date(now);
  const targetDate = new Date(targetTime);

  setMetricValues({
    days,
    weeks: Math.ceil(days / 7),
    mondays: countWeekdayBetween(nowDate, targetDate, 1),
    weekends: countWeekdayBetween(nowDate, targetDate, 6),
    summers: countSummersBetween(nowDate, targetDate)
  });
}

function setMetricValues(values) {
  for (const [key, value] of Object.entries(values)) {
    metrics[key].textContent =
      typeof value === "number" ? integerFormatter.format(value) : "--";
  }
}

function countWeekdayBetween(startDate, endDate, weekday) {
  const start = startOfLocalDay(startDate);
  const end = startOfLocalDay(endDate);
  const offset = (weekday - start.getDay() + 7) % 7;
  const first = addDays(start, offset);

  if (first.getTime() > end.getTime()) {
    return 0;
  }

  return Math.floor((end.getTime() - first.getTime()) / (7 * MS_PER_DAY)) + 1;
}

function countSummersBetween(startDate, endDate) {
  if (endDate.getTime() <= startDate.getTime()) {
    return 0;
  }

  let year = startDate.getFullYear();
  let count = 0;

  if (isDuringNorthernSummer(startDate)) {
    count = 1;
    year += 1;
  } else if (startDate.getTime() > new Date(year, 7, 31, 23, 59, 59, 999).getTime()) {
    year += 1;
  }

  while (new Date(year, 5, 1).getTime() <= endDate.getTime()) {
    count += 1;
    year += 1;
  }

  return count;
}

function isDuringNorthernSummer(date) {
  const year = date.getFullYear();
  const summerStart = new Date(year, 5, 1);
  const summerEnd = new Date(year, 7, 31, 23, 59, 59, 999);
  return date.getTime() >= summerStart.getTime() && date.getTime() <= summerEnd.getTime();
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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
