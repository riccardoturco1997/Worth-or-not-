const STORAGE_KEY = "worthit_profile_v1";
const HISTORY_KEY = "worthit_history_v1";
const HISTORY_LIMIT = 15;

// Rendimento medio annuo storico del FTSE All-World negli ultimi 10 anni (~10,97%, dati FTSE Russell), arrotondato.
const ANNUAL_RETURN = 11;
const INVEST_YEARS = 10;

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

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function addHistoryEntry(entry) {
  const list = loadHistory();
  list.unshift(entry);
  list.length = Math.min(list.length, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
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
const setupError = document.getElementById("setup-error");
const setupSaveBtn = document.getElementById("setup-save");

const productCostInput = document.getElementById("product-cost");
const calcBtn = document.getElementById("calc-btn");
const resetBtn = document.getElementById("reset-btn");
const settingsBtn = document.getElementById("settings-btn");
const historyBtn = document.getElementById("history-btn");
const guideBtn = document.getElementById("guide-btn");

const workTimeValue = document.getElementById("work-time-value");
const workTimeDetail = document.getElementById("work-time-detail");
const investedValue = document.getElementById("invested-value");
const investedGain = document.getElementById("invested-gain");
const investYearsLabel = document.getElementById("invest-years-label");
const actionRow = document.getElementById("action-row");

const growthChartSvg = document.getElementById("growth-chart");
const chartLabelStart = document.getElementById("chart-label-start");
const chartLabelEnd = document.getElementById("chart-label-end");
const chartReadout = document.getElementById("chart-readout");

const settingsOverlay = document.getElementById("settings-overlay");
const settingsSalary = document.getElementById("settings-salary");
const settingsHours = document.getElementById("settings-hours");
const settingsDays = document.getElementById("settings-days");
const settingsError = document.getElementById("settings-error");
const settingsSaveBtn = document.getElementById("settings-save");
const settingsCloseBtn = document.getElementById("settings-close");

const historyOverlay = document.getElementById("history-overlay");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const historyClearBtn = document.getElementById("history-clear");
const historyCloseBtn = document.getElementById("history-close");

const guideOverlay = document.getElementById("guide-overlay");
const guideCloseBtn = document.getElementById("guide-close");

let profile = loadProfile();

function showView(view) {
  [setupView, mainView].forEach((v) => v.classList.remove("active"));
  view.classList.add("active");
}

function init() {
  investYearsLabel.textContent = INVEST_YEARS;
  if (profile) {
    showView(mainView);
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
  };
  saveProfile(profile);
  showView(mainView);
});

function showResult(cost, options) {
  const record = !options || options.record !== false;
  const wage = hourlyWage(profile);
  const hoursNeeded = cost / wage;
  const fv = futureValue(cost, ANNUAL_RETURN, INVEST_YEARS);
  const gain = fv - cost;
  const roundedHours = Math.round(hoursNeeded * 10) / 10;
  const workTimeLabel = formatWorkTime(hoursNeeded, profile);

  workTimeValue.textContent = workTimeLabel;
  workTimeDetail.textContent = `${formatNum(roundedHours)} ore a ${formatCurrency(wage)}/ora`;
  investedValue.textContent = formatCurrency(fv);
  investedGain.textContent = `+${formatCurrency(gain)} stimati (${ANNUAL_RETURN}%/anno)`;
  renderGrowthChart(cost, ANNUAL_RETURN, INVEST_YEARS);

  emptyState.style.display = "none";
  resultCard.hidden = false;
  resultCard.classList.remove("is-visible");
  // force reflow so the reveal animation replays on every calculation
  void resultCard.offsetWidth;
  resultCard.classList.add("is-visible");
  actionRow.classList.remove("is-hidden");

  if (record) {
    addHistoryEntry({
      cost,
      workTimeLabel,
      investedValue: fv,
      date: new Date().toISOString(),
    });
  }
}

function formatNum(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

function buildGrowthPoints(cost, annualReturnPct, years) {
  const points = [];
  for (let year = 0; year <= years; year++) {
    points.push(futureValue(cost, annualReturnPct, year));
  }
  return points;
}

function renderGrowthChart(cost, annualReturnPct, years) {
  const points = buildGrowthPoints(cost, annualReturnPct, years);
  const width = 300;
  const height = 120;
  const padX = 6;
  const padY = 12;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (width - padX * 2) / years;

  const coords = points.map((value, i) => {
    const x = padX + i * stepX;
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return { x, y, value, year: i };
  });

  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${height} L${coords[0].x.toFixed(1)},${height} Z`;
  const dotsMarkup = coords
    .map((p) => `<circle class="chart-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"></circle>`)
    .join("");

  growthChartSvg.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop class="chart-stop-a" offset="0%"></stop>
        <stop class="chart-stop-b" offset="100%"></stop>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#chartFill)" stroke="none"></path>
    <path class="chart-line" d="${linePath}"></path>
    ${dotsMarkup}
  `;

  chartLabelStart.textContent = `Oggi · ${formatCurrency(points[0])}`;
  chartLabelEnd.textContent = `Tra ${years} anni · ${formatCurrency(points[points.length - 1])}`;
  chartReadout.textContent = "Tocca il grafico per vedere il valore anno per anno";
  chartReadout.classList.remove("is-active");
  growthChartSvg.querySelectorAll(".chart-dot").forEach((dot) => dot.classList.remove("is-active"));

  growthChartSvg.onpointerdown = (evt) => {
    const rect = growthChartSvg.getBoundingClientRect();
    const relX = Math.min(Math.max((evt.clientX - rect.left) / rect.width, 0), 1);
    const nearestIndex = Math.round(relX * years);
    const point = coords[nearestIndex];

    growthChartSvg.querySelectorAll(".chart-dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === nearestIndex);
    });
    const yearLabel = point.year === 0 ? "Oggi" : point.year === 1 ? "Tra 1 anno" : `Tra ${point.year} anni`;
    chartReadout.textContent = `${yearLabel}: ${formatCurrency(point.value)}`;
    chartReadout.classList.add("is-active");
  };
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

// ---- Modali (impostazioni, cronologia, guida) ----
const allOverlays = [settingsOverlay, historyOverlay, guideOverlay];

function openModal(overlay) {
  overlay.classList.add("active");
}

function closeModal(overlay) {
  overlay.classList.remove("active");
}

allOverlays.forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  allOverlays.forEach((overlay) => {
    if (overlay.classList.contains("active")) closeModal(overlay);
  });
});

function openSettings() {
  settingsSalary.value = profile.netSalary;
  settingsHours.value = profile.hoursPerWeek;
  settingsDays.value = profile.daysPerWeek;
  settingsError.classList.remove("active");
  openModal(settingsOverlay);
}

function closeSettings() {
  closeModal(settingsOverlay);
}

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);

// ---- Cronologia ----
function formatHistoryDate(iso) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function renderHistory() {
  const list = loadHistory();
  historyList.innerHTML = "";

  if (list.length === 0) {
    historyEmpty.classList.remove("is-hidden");
    historyList.classList.add("is-hidden");
    return;
  }

  historyEmpty.classList.add("is-hidden");
  historyList.classList.remove("is-hidden");

  list.forEach((entry) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <span class="history-main">
        <span class="history-cost">${formatCurrency(entry.cost)}</span>
        <span class="history-meta">${formatHistoryDate(entry.date)} · ${entry.workTimeLabel}</span>
      </span>
      <span class="history-result">${formatCurrency(entry.investedValue)}</span>
    `;
    button.addEventListener("click", () => {
      productCostInput.value = String(entry.cost).replace(".", ",");
      showResult(entry.cost, { record: false });
      closeModal(historyOverlay);
    });
    li.appendChild(button);
    historyList.appendChild(li);
  });
}

historyBtn.addEventListener("click", () => {
  renderHistory();
  openModal(historyOverlay);
});
historyCloseBtn.addEventListener("click", () => closeModal(historyOverlay));
historyClearBtn.addEventListener("click", () => {
  clearHistory();
  renderHistory();
});

// ---- Mini-guida investimenti ----
guideBtn.addEventListener("click", () => openModal(guideOverlay));
guideCloseBtn.addEventListener("click", () => closeModal(guideOverlay));

settingsSaveBtn.addEventListener("click", () => {
  const salary = parseFloat(settingsSalary.value.replace(",", "."));
  const hours = parseFloat(settingsHours.value.replace(",", "."));
  const days = parseFloat(settingsDays.value.replace(",", "."));

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
  };
  saveProfile(profile);
  closeSettings();

  if (!resultCard.hidden) {
    const cost = parseFloat(productCostInput.value.replace(",", "."));
    if (cost > 0) showResult(cost, { record: false });
  }
});

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
