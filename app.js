const STORAGE_KEY = "worthit_profile_v1";

const DEFAULT_PROFILE = {
  netSalary: null,
  hoursPerWeek: 40,
  daysPerWeek: 5,
  annualReturn: 7,
  investYears: 5,
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.netSalary || !parsed.hoursPerWeek || !parsed.daysPerWeek) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function hourlyWage(profile) {
  const monthlyHours = profile.hoursPerWeek * (52 / 12);
  return profile.netSalary / monthlyHours;
}

function hoursPerDay(profile) {
  return profile.hoursPerWeek / profile.daysPerWeek;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatWorkTime(totalHours, profile) {
  const perDay = hoursPerDay(profile);
  let days = Math.floor(totalHours / perDay);
  let remainingHours = Math.round(totalHours - days * perDay);

  if (remainingHours >= perDay) {
    days += 1;
    remainingHours = 0;
  }

  if (days === 0 && remainingHours === 0) {
    return "Meno di un'ora";
  }

  const dayLabel = days === 1 ? "giorno" : "giorni";
  const hourLabel = remainingHours === 1 ? "ora" : "ore";

  if (days === 0) {
    return `${remainingHours} ${hourLabel}`;
  }
  if (remainingHours === 0) {
    return `${days} ${dayLabel}`;
  }
  return `${days} ${dayLabel} e ${remainingHours} ${hourLabel}`;
}

function futureValue(cost, annualReturnPct, years) {
  const r = annualReturnPct / 100;
  return cost * Math.pow(1 + r, years);
}

// ---- DOM ----
const setupView = document.getElementById("setup-view");
const mainView = document.getElementById("main-view");
const resultCard = document.getElementById("result-card");
const emptyState = document.getElementById("empty-state");

const setupSalary = document.getElementById("setup-salary");
const setupHours = document.getElementById("setup-hours");
const setupDays = document.getElementById("setup-days");
const setupReturn = document.getElementById("setup-return");
const setupError = document.getElementById("setup-error");
const setupSaveBtn = document.getElementById("setup-save");

const productCostInput = document.getElementById("product-cost");
const calcBtn = document.getElementById("calc-btn");
const resetBtn = document.getElementById("reset-btn");
const settingsBtn = document.getElementById("settings-btn");

const workTimeValue = document.getElementById("work-time-value");
const workTimeDetail = document.getElementById("work-time-detail");
const investedValue = document.getElementById("invested-value");
const investedGain = document.getElementById("invested-gain");
const investYearsLabel = document.getElementById("invest-years-label");
const actionRow = document.getElementById("action-row");

const settingsOverlay = document.getElementById("settings-overlay");
const settingsSalary = document.getElementById("settings-salary");
const settingsHours = document.getElementById("settings-hours");
const settingsDays = document.getElementById("settings-days");
const settingsReturn = document.getElementById("settings-return");
const settingsError = document.getElementById("settings-error");
const settingsSaveBtn = document.getElementById("settings-save");
const settingsCloseBtn = document.getElementById("settings-close");

let profile = loadProfile();

function showView(view) {
  [setupView, mainView].forEach((v) => v.classList.remove("active"));
  view.classList.add("active");
}

function init() {
  if (profile) {
    showView(mainView);
    investYearsLabel.textContent = profile.investYears;
  } else {
    showView(setupView);
  }
}

function validateInputs(salary, hours, days) {
  if (!salary || salary <= 0) return "Inserisci una retribuzione valida.";
  if (!hours || hours <= 0 || hours > 168) return "Inserisci ore settimanali valide.";
  if (!days || days <= 0 || days > 7) return "Inserisci giorni lavorativi validi (1-7).";
  return null;
}

setupSaveBtn.addEventListener("click", () => {
  const salary = parseFloat(setupSalary.value.replace(",", "."));
  const hours = parseFloat(setupHours.value.replace(",", "."));
  const days = parseFloat(setupDays.value.replace(",", "."));
  const ret = parseFloat((setupReturn.value || "7").replace(",", "."));

  const err = validateInputs(salary, hours, days);
  if (err) {
    setupError.textContent = err;
    setupError.classList.add("active");
    return;
  }
  setupError.classList.remove("active");

  profile = {
    netSalary: salary,
    hoursPerWeek: hours,
    daysPerWeek: days,
    annualReturn: isNaN(ret) ? 7 : ret,
    investYears: 5,
  };
  saveProfile(profile);
  investYearsLabel.textContent = profile.investYears;
  showView(mainView);
});

function showResult(cost) {
  const wage = hourlyWage(profile);
  const hoursNeeded = cost / wage;
  const fv = futureValue(cost, profile.annualReturn, profile.investYears);
  const gain = fv - cost;
  const roundedHours = Math.round(hoursNeeded * 10) / 10;

  workTimeValue.textContent = formatWorkTime(hoursNeeded, profile);
  workTimeDetail.textContent = `${formatNum(roundedHours)} ore a ${formatCurrency(wage)}/ora`;
  investedValue.textContent = formatCurrency(fv);
  investedGain.textContent = `+${formatCurrency(gain)} stimati (${profile.annualReturn}%/anno)`;

  emptyState.style.display = "none";
  resultCard.hidden = false;
  resultCard.classList.remove("is-visible");
  // force reflow so the reveal animation replays on every calculation
  void resultCard.offsetWidth;
  resultCard.classList.add("is-visible");
  actionRow.classList.remove("is-hidden");
}

function formatNum(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

calcBtn.addEventListener("click", () => {
  const cost = parseFloat(productCostInput.value.replace(",", "."));
  if (!cost || cost <= 0) {
    productCostInput.focus();
    productCostInput.classList.add("input-error");
    productCostInput.classList.remove("shake");
    void productCostInput.offsetWidth;
    productCostInput.classList.add("shake");
    setTimeout(() => productCostInput.classList.remove("shake"), 400);
    return;
  }
  productCostInput.classList.remove("input-error");
  showResult(cost);
});

resetBtn.addEventListener("click", () => {
  productCostInput.value = "";
  resultCard.hidden = true;
  resultCard.classList.remove("is-visible");
  emptyState.style.display = "flex";
  actionRow.classList.add("is-hidden");
  productCostInput.focus();
});

function openSettings() {
  settingsSalary.value = profile.netSalary;
  settingsHours.value = profile.hoursPerWeek;
  settingsDays.value = profile.daysPerWeek;
  settingsReturn.value = profile.annualReturn;
  settingsError.classList.remove("active");
  settingsOverlay.classList.add("active");
}

function closeSettings() {
  settingsOverlay.classList.remove("active");
}

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) closeSettings();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && settingsOverlay.classList.contains("active")) {
    closeSettings();
  }
});

settingsSaveBtn.addEventListener("click", () => {
  const salary = parseFloat(settingsSalary.value.replace(",", "."));
  const hours = parseFloat(settingsHours.value.replace(",", "."));
  const days = parseFloat(settingsDays.value.replace(",", "."));
  const ret = parseFloat((settingsReturn.value || "7").replace(",", "."));

  const err = validateInputs(salary, hours, days);
  if (err) {
    settingsError.textContent = err;
    settingsError.classList.add("active");
    return;
  }

  profile = {
    ...profile,
    netSalary: salary,
    hoursPerWeek: hours,
    daysPerWeek: days,
    annualReturn: isNaN(ret) ? 7 : ret,
  };
  saveProfile(profile);
  investYearsLabel.textContent = profile.investYears;
  closeSettings();

  if (!resultCard.hidden) {
    const cost = parseFloat(productCostInput.value.replace(",", "."));
    if (cost > 0) showResult(cost);
  }
});

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
