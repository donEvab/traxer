const STORAGE_KEY = "traxer.entries.v1";
const SETTINGS_KEY = "traxer.settings.v1";
const THEME_KEY = "traxer.theme.v1";
const DEFAULT_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzsOd1B7x9opDV97-S5sCsOjiMrgARvQBs6ThdUoj9_VzY-RorZUJL1RU7pKbTi9H77UA/exec";
const DEFAULT_SPREADSHEET_ID = "1JCDZSb6CHWDTd8Re4R_uULNWJG88ck0DwcLK1JFqYAg";

const els = {
  form: document.querySelector("#dailyForm"),
  entryDate: document.querySelector("#entryDate"),
  appViews: document.querySelectorAll("[data-view]"),
  viewButtons: document.querySelectorAll("[data-view-target]"),
  installApp: document.querySelector("#installApp"),
  resetDay: document.querySelector("#resetDay"),
  clearAll: document.querySelector("#clearAll"),
  copyWeekly: document.querySelector("#copyWeekly"),
  downloadCsv: document.querySelector("#downloadCsv"),
  syncSheet: document.querySelector("#syncSheet"),
  editSettings: document.querySelector("#editSettings"),
  saveSettings: document.querySelector("#saveSettings"),
  dailyTasks: document.querySelector("#dailyTasks"),
  weekPlan: document.querySelector("#weekPlan"),
  selectedDayName: document.querySelector("#selectedDayName"),
  selectedDayFocus: document.querySelector("#selectedDayFocus"),
  selectedDayProgress: document.querySelector("#selectedDayProgress"),
  startWeight: document.querySelector("#startWeight"),
  savings: document.querySelector("#savings"),
  savingsTarget: document.querySelector("#savingsTarget"),
  weeklyWorkoutTarget: document.querySelector("#weeklyWorkoutTarget"),
  weeklyProteinTarget: document.querySelector("#weeklyProteinTarget"),
  weeklyRoadmapTarget: document.querySelector("#weeklyRoadmapTarget"),
  spreadsheetId: document.querySelector("#spreadsheetId"),
  sheetWebhook: document.querySelector("#sheetWebhook"),
  saveDatabaseSettings: document.querySelector("#saveDatabaseSettings"),
  resetDatabaseSettings: document.querySelector("#resetDatabaseSettings"),
  openDatabase: document.querySelector("#openDatabase"),
  databaseLink: document.querySelector("#databaseLink"),
  databaseStatus: document.querySelector("#databaseStatus"),
  themeToggle: document.querySelector("#themeToggle"),
  edgeNav: document.querySelector(".edge-nav"),
  toast: document.querySelector("#toast"),
  weeklyRows: document.querySelector("#weeklyRows"),
  weekNumber: document.querySelector("#weekNumber"),
  weekRange: document.querySelector("#weekRange"),
  verdictBadge: document.querySelector("#verdictBadge"),
  currentWeight: document.querySelector("#currentWeight"),
  weightGain: document.querySelector("#weightGain"),
  workoutScore: document.querySelector("#workoutScore"),
  proteinScore: document.querySelector("#proteinScore"),
  roadmapScore: document.querySelector("#roadmapScore"),
  overallScore: document.querySelector("#overallScore"),
  weightChart: document.querySelector("#weightChart"),
  savingsChart: document.querySelector("#savingsChart"),
  habitChart: document.querySelector("#habitChart"),
  overallChart: document.querySelector("#overallChart"),
};

const cursorState = { x: window.innerWidth / 2, y: window.innerHeight * 0.3, frame: 0 };
let settingsEditable = false;
let revealObserver;
let deferredInstallPrompt = null;

const WEEKLY_PLAN = [
  {
    day: "Senin",
    focus: "Push day",
    tasks: [
      { id: "workout-push", label: "Workout Push", score: "workout" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "water", label: "3L air" },
      { id: "sleep", label: "Tidur 7.5 jam" },
      { id: "roadmap", label: "Data Engineer Roadmap", score: "roadmap" },
      { id: "walk", label: "15 mins walk" },
    ],
  },
  {
    day: "Selasa",
    focus: "Pull day",
    tasks: [
      { id: "workout-pull", label: "Workout Pull", score: "workout" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "roadmap", label: "Data engineer roadmap", score: "roadmap" },
      { id: "happy", label: "Happy" },
    ],
  },
  {
    day: "Rabu",
    focus: "Recovery",
    tasks: [
      { id: "recovery", label: "Recovery" },
      { id: "stretching", label: "Stretching" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "roadmap", label: "Data engineer roadmap", score: "roadmap" },
      { id: "no-socmed", label: "No socmed 1h" },
    ],
  },
  {
    day: "Kamis",
    focus: "Legs day",
    tasks: [
      { id: "workout-legs", label: "Workout Legs", score: "workout" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "roadmap", label: "Data engineer workout", score: "roadmap" },
      { id: "walk", label: "Walk 15 mins" },
    ],
  },
  {
    day: "Jumat",
    focus: "Full body",
    tasks: [
      { id: "workout-full-body", label: "Full Body", score: "workout" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "roadmap", label: "Data engineer roadmap", score: "roadmap" },
      { id: "watching", label: "Watching" },
    ],
  },
  {
    day: "Sabtu",
    focus: "Review day",
    tasks: [
      { id: "cardio", label: "Cardio 20mins" },
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "trading-review", label: "Trading review" },
      { id: "hangouts", label: "Hangouts" },
    ],
  },
  {
    day: "Minggu",
    focus: "Weekly review",
    tasks: [
      { id: "protein", label: "100g protein", score: "protein" },
      { id: "weekly-review", label: "Weekly review", score: "roadmap" },
    ],
  },
];

let entries = loadJson(STORAGE_KEY, {});
let settings = {
  spreadsheetId: DEFAULT_SPREADSHEET_ID,
  sheetWebhook: DEFAULT_SHEET_WEBHOOK,
  startWeight: "",
  savingsTarget: 10000000,
  weeklyWorkoutTarget: 4,
  weeklyProteinTarget: 7,
  weeklyRoadmapTarget: 7,
  ...loadJson(SETTINGS_KEY, {}),
};

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function numberSetting(key, fallback) {
  const value = Number(settings[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function databaseUrl() {
  const id = String(settings.spreadsheetId || DEFAULT_SPREADSHEET_ID).trim();
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

function persistSettings() {
  saveJson(SETTINGS_KEY, settings);
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
  if (els.themeToggle) {
    els.themeToggle.textContent = nextTheme === "dark" ? "Light" : "Dark";
    els.themeToggle.setAttribute("aria-pressed", String(nextTheme === "dark"));
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  setTheme(saved || systemTheme);
}

function todayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function parseDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

function toIso(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date) {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  return start;
}

function dayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function planForDate(iso) {
  return WEEKLY_PLAN[dayIndex(parseDate(iso))];
}

function weekDatesFor(iso) {
  const start = startOfWeek(parseDate(iso));
  return WEEKLY_PLAN.map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toIso(date);
  });
}

function getWeekIndex(date) {
  const allDates = Object.keys(entries).sort();
  const firstDate = allDates[0] ? parseDate(allDates[0]) : date;
  const firstWeek = startOfWeek(firstDate);
  const currentWeek = startOfWeek(date);
  const diffDays = Math.round((currentWeek - firstWeek) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

function formatKg(value, signed = false) {
  if (!Number.isFinite(value)) return "-";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1).replace(".", ",")} kg`;
}

function formatUsd(value) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toFixed(2).replace(".", ",")}`;
}

function formatIdr(value) {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

function percent(value) {
  return `${Math.round(value)}%`;
}

function getEntryForForm() {
  const data = new FormData(els.form);
  const plan = planForDate(els.entryDate.value);
  const doneTasks = plan.tasks
    .filter((task) => data.get(`task:${task.id}`) === "on")
    .map((task) => task.id);

  return {
    date: els.entryDate.value,
    weight: numberOrNull(data.get("weight")),
    doneTasks,
    workoutDone: hasScoredTask(plan, doneTasks, "workout"),
    proteinDone: hasScoredTask(plan, doneTasks, "protein"),
    roadmapDone: hasScoredTask(plan, doneTasks, "roadmap"),
    tradingPnl: Number(data.get("tradingPnl") || 0),
    savings: Number(data.get("savings") || 0),
    notes: String(data.get("notes") || "").trim(),
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? number : null;
}

function doneTasksForEntry(entry = {}) {
  if (Array.isArray(entry.doneTasks)) return entry.doneTasks;

  const plan = planForDate(entry.date || els.entryDate.value);
  return plan.tasks
    .filter((task) => {
      if (task.score === "workout") return Boolean(entry.workoutDone);
      if (task.score === "protein") return Boolean(entry.proteinDone);
      if (task.score === "roadmap") return Boolean(entry.roadmapDone);
      return false;
    })
    .map((task) => task.id);
}

function hasScoredTask(plan, doneTasks, score) {
  return plan.tasks.some((task) => task.score === score && doneTasks.includes(task.id));
}

function taskProgress(entry, plan) {
  const doneTasks = doneTasksForEntry(entry);
  return {
    doneTasks,
    doneCount: plan.tasks.filter((task) => doneTasks.includes(task.id)).length,
    total: plan.tasks.length,
  };
}

function fillForm(entry = {}) {
  const plan = planForDate(els.entryDate.value);
  const progress = taskProgress(entry, plan);

  els.selectedDayName.textContent = plan.day;
  els.selectedDayFocus.textContent = plan.focus;
  els.selectedDayProgress.textContent = `${progress.doneCount}/${progress.total} done`;
  els.dailyTasks.innerHTML = plan.tasks
    .map((task) => `
      <label class="check-item">
        <input type="checkbox" name="task:${task.id}" ${progress.doneTasks.includes(task.id) ? "checked" : ""} />
        <span>${task.label}</span>
      </label>
    `)
    .join("");

  els.form.weight.value = entry.weight ?? "";
  els.form.tradingPnl.value = entry.tradingPnl ?? "";
  els.form.savings.value = entry.savings ?? "";
  els.form.notes.value = entry.notes ?? "";
}

function fillSettings() {
  els.startWeight.value = settings.startWeight || "";
  els.savingsTarget.value = settings.savingsTarget || 10000000;
  els.weeklyWorkoutTarget.value = numberSetting("weeklyWorkoutTarget", 4);
  els.weeklyProteinTarget.value = numberSetting("weeklyProteinTarget", 7);
  els.weeklyRoadmapTarget.value = numberSetting("weeklyRoadmapTarget", 7);
  setSettingsEditable(false);
}

function setSettingsEditable(enabled) {
  settingsEditable = enabled;
  els.startWeight.disabled = !enabled;
  els.savingsTarget.disabled = !enabled;
  els.weeklyWorkoutTarget.disabled = !enabled;
  els.weeklyProteinTarget.disabled = !enabled;
  els.weeklyRoadmapTarget.disabled = !enabled;
  els.saveSettings.disabled = !enabled;
  els.editSettings.textContent = enabled ? "Cancel" : "Edit";
}

function saveCurrentEntry() {
  const entry = getEntryForForm();
  entries[entry.date] = entry;
  saveJson(STORAGE_KEY, entries);
  return entry;
}

function adjustSavings(amount) {
  const current = Number(els.savings.value || 0);
  const next = current + amount;
  els.savings.value = Number.isInteger(next) ? String(next) : next.toFixed(2);
  saveCurrentEntry();
  render();
}

function saveSettings() {
  settings = {
    ...settings,
    startWeight: els.startWeight.value,
    savingsTarget: Number(els.savingsTarget.value || 10000000),
    weeklyWorkoutTarget: Number(els.weeklyWorkoutTarget.value || 4),
    weeklyProteinTarget: Number(els.weeklyProteinTarget.value || 7),
    weeklyRoadmapTarget: Number(els.weeklyRoadmapTarget.value || 7),
  };
  persistSettings();
  setSettingsEditable(false);
  render();
  showToast("Targets tersimpan.");
}

function fillDatabaseSettings() {
  els.spreadsheetId.value = settings.spreadsheetId || DEFAULT_SPREADSHEET_ID;
  els.sheetWebhook.value = settings.sheetWebhook || DEFAULT_SHEET_WEBHOOK;
  updateDatabaseUi();
}

function saveDatabaseSettings() {
  settings = {
    ...settings,
    spreadsheetId: els.spreadsheetId.value.trim() || DEFAULT_SPREADSHEET_ID,
    sheetWebhook: els.sheetWebhook.value.trim() || DEFAULT_SHEET_WEBHOOK,
  };
  persistSettings();
  updateDatabaseUi();
  showToast("Database settings tersimpan.");
}

function resetDatabaseSettings() {
  settings = {
    ...settings,
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetWebhook: DEFAULT_SHEET_WEBHOOK,
  };
  persistSettings();
  fillDatabaseSettings();
  showToast("Database settings direset.");
}

function updateDatabaseUi() {
  const url = databaseUrl();
  if (els.databaseLink) els.databaseLink.href = url;
  if (els.databaseStatus) {
    els.databaseStatus.textContent = settings.sheetWebhook
      ? "Database connected. Sync manual aktif via Apps Script."
      : "Apps Script URL kosong. Data masih tersimpan lokal.";
  }
}

function weeklySummaries() {
  const grouped = new Map();
  Object.values(entries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((entry) => {
      const date = parseDate(entry.date);
      const key = toIso(startOfWeek(date));
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(entry);
    });

  let runningSavings = 0;
  let runningPnl = 0;
  let previousWeight = numberOrNull(settings.startWeight);
  const workoutTarget = numberSetting("weeklyWorkoutTarget", 4);
  const proteinTarget = numberSetting("weeklyProteinTarget", 7);
  const roadmapTarget = numberSetting("weeklyRoadmapTarget", 7);

  return Array.from(grouped.entries()).map(([weekStart, days]) => {
    const date = parseDate(weekStart);
    const week = getWeekIndex(date);
    const weights = days.map((day) => day.weight).filter((value) => Number.isFinite(value));
    const currentWeight = weights.length ? weights[weights.length - 1] : previousWeight;
    const deltaWeight = Number.isFinite(currentWeight) && Number.isFinite(previousWeight) ? currentWeight - previousWeight : 0;
    if (Number.isFinite(currentWeight)) previousWeight = currentWeight;

    const workout = days.filter((day) => hasScoredTask(planForDate(day.date), doneTasksForEntry(day), "workout")).length;
    const protein = days.filter((day) => hasScoredTask(planForDate(day.date), doneTasksForEntry(day), "protein")).length;
    const roadmap = days.filter((day) => hasScoredTask(planForDate(day.date), doneTasksForEntry(day), "roadmap")).length;
    const tradingPnl = days.reduce((sum, day) => sum + Number(day.tradingPnl || 0), 0);
    const savings = days.reduce((sum, day) => sum + Number(day.savings || 0), 0);

    runningSavings += savings;
    runningPnl += tradingPnl;

    const workoutPct = Math.min(workout / workoutTarget, 1) * 100;
    const proteinPct = Math.min(protein / proteinTarget, 1) * 100;
    const roadmapPct = Math.min(roadmap / roadmapTarget, 1) * 100;
    const target = Number(settings.savingsTarget || 10000000);
    const savingsPct = target > 0 ? Math.min((runningSavings / target) * 100, 100) : 0;
    const overall = Math.round((workoutPct + proteinPct + roadmapPct + savingsPct) / 4);

    return {
      week,
      weekStart,
      weekEnd: toIso(endOfWeek(date)),
      currentWeight,
      deltaWeight,
      workout,
      workoutTarget,
      workoutPct,
      protein,
      proteinTarget,
      proteinPct,
      roadmap,
      roadmapTarget,
      roadmapPct,
      tradingPnl,
      totalPnl: runningPnl,
      savings,
      totalSavings: runningSavings,
      equity: runningPnl,
      savingsPct,
      overall,
      verdict: overall >= 70 ? "GOOD" : overall >= 45 ? "OK" : "FIX",
    };
  });
}

function weeklyLogRow(summary) {
  return [
    summary.week,
    formatKg(summary.currentWeight),
    formatKg(summary.deltaWeight, true),
    `${summary.workout}/${summary.workoutTarget}`,
    `${summary.protein}/${summary.proteinTarget}`,
    `${summary.roadmap}/${summary.roadmapTarget}`,
    formatUsd(summary.tradingPnl),
    formatIdr(summary.savings),
    formatIdr(summary.totalSavings),
    formatUsd(summary.equity),
  ];
}

function dashboardRow(summary) {
  return [
    summary.week,
    formatKg(summary.currentWeight),
    formatKg(summary.deltaWeight, true),
    `${summary.workout}/${summary.workoutTarget}`,
    percent(summary.workoutPct),
    `${summary.protein}/${summary.proteinTarget}`,
    percent(summary.proteinPct),
    `${summary.roadmap}/${summary.roadmapTarget}`,
    percent(summary.roadmapPct),
    formatUsd(summary.tradingPnl),
    formatUsd(summary.totalPnl),
    formatIdr(summary.totalSavings),
    percent(summary.savingsPct),
    percent(summary.overall),
    summary.verdict,
  ];
}

function render() {
  const current = entries[els.entryDate.value];
  fillForm(current);
  renderWeekPlan();

  const summaries = weeklySummaries();
  const activeSummary = summaries.find((summary) => {
    const selected = els.entryDate.value;
    return selected >= summary.weekStart && selected <= summary.weekEnd;
  }) || summaries[summaries.length - 1];

  els.weeklyRows.innerHTML = summaries.length
    ? summaries.map((summary) => `<tr>${weeklyLogRow(summary).map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="10">Belum ada data.</td></tr>`;

  if (!activeSummary) {
    els.weekNumber.textContent = "1";
    els.weekRange.textContent = "-";
    els.verdictBadge.textContent = "-";
    els.currentWeight.textContent = "-";
    els.weightGain.textContent = "-";
    els.workoutScore.textContent = `0/${numberSetting("weeklyWorkoutTarget", 4)}`;
    els.proteinScore.textContent = `0/${numberSetting("weeklyProteinTarget", 7)}`;
    els.roadmapScore.textContent = `0/${numberSetting("weeklyRoadmapTarget", 7)}`;
    els.overallScore.textContent = "0%";
    renderVisuals(summaries);
    refreshRevealTargets();
    return;
  }

  els.weekNumber.textContent = activeSummary.week;
  els.weekRange.textContent = `${activeSummary.weekStart} - ${activeSummary.weekEnd}`;
  els.verdictBadge.textContent = activeSummary.verdict;
  els.verdictBadge.style.color = activeSummary.verdict === "GOOD" ? "var(--green)" : activeSummary.verdict === "OK" ? "var(--amber)" : "var(--red)";
  els.currentWeight.textContent = formatKg(activeSummary.currentWeight);
  els.weightGain.textContent = formatKg(activeSummary.deltaWeight, true);
  els.workoutScore.textContent = `${activeSummary.workout}/${activeSummary.workoutTarget}`;
  els.proteinScore.textContent = `${activeSummary.protein}/${activeSummary.proteinTarget}`;
  els.roadmapScore.textContent = `${activeSummary.roadmap}/${activeSummary.roadmapTarget}`;
  els.overallScore.textContent = percent(activeSummary.overall);
  renderVisuals(summaries);
  refreshRevealTargets();
}

function renderWeekPlan() {
  const selected = els.entryDate.value;
  const weekDates = weekDatesFor(selected);
  els.weekPlan.innerHTML = weekDates
    .map((date, index) => {
      const plan = WEEKLY_PLAN[index];
      const progress = taskProgress(entries[date] || { date }, plan);
      const preview = plan.tasks.slice(0, 3).map((task) => task.label).join(" / ");
      const classes = [
        "day-card",
        date === selected ? "is-active" : "",
        progress.doneCount === progress.total ? "is-complete" : "",
      ].filter(Boolean).join(" ");

      return `
        <button class="${classes}" type="button" data-date="${date}">
          <strong>${plan.day}</strong>
          <span>${date} · ${progress.doneCount}/${progress.total}</span>
          <small>${preview}</small>
        </button>
      `;
    })
    .join("")
    .replaceAll("\u00c2\u00b7", "-");
}

function csvEscape(value) {
  const string = String(value);
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

function downloadCsv() {
  const headers = ["Week", "Weight (Kg)", "Delta Weight (Kg)", "Workout Done", "Protein Days", "Roadmap Progress", "Trading P/L", "Savings +", "Total Savings", "Equity"];
  const rows = weeklySummaries().map(weeklyLogRow);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "traxer-weekly-log.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function updateCursorGrid(event) {
  const point = event.touches?.[0] || event;
  cursorState.x = point.clientX;
  cursorState.y = point.clientY;
  if (cursorState.frame) return;
  cursorState.frame = requestAnimationFrame(() => {
    document.body.style.setProperty("--cursor-x", `${cursorState.x}px`);
    document.body.style.setProperty("--cursor-y", `${cursorState.y}px`);
    cursorState.frame = 0;
  });
}

function scrollPage(target) {
  const top = target === "bottom" ? document.documentElement.scrollHeight : 0;
  window.scrollTo({ top, behavior: "smooth" });
}

function setActiveView(viewName) {
  const nextView = viewName || "home";
  els.appViews.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === nextView);
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === nextView);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  refreshRevealTargets();
}

function initNavigation() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-target]");
    if (!button) return;
    setActiveView(button.dataset.viewTarget);
  });
}

function initEdgeNav() {
  if (!els.edgeNav) return;

  els.edgeNav.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-target]");
    if (viewButton) {
      setActiveView(viewButton.dataset.viewTarget);
      return;
    }

    const themeButton = event.target.closest("#themeToggle");
    if (themeButton) {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
      return;
    }

    const scrollButton = event.target.closest("[data-scroll-target]");
    if (!scrollButton) return;
    scrollPage(scrollButton.dataset.scrollTarget);
  });
}

function initRevealMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  revealObserver = new IntersectionObserver((entriesToReveal) => {
    entriesToReveal.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  });

  refreshRevealTargets();
}

function refreshRevealTargets() {
  if (!revealObserver) return;

  document.querySelectorAll(".topbar, .panel, .day-card, tbody tr").forEach((target, index) => {
    if (target.dataset.revealObserved) return;
    target.dataset.revealObserved = "true";
    target.classList.add("reveal");
    target.style.transitionDelay = `${Math.min(index * 35, 280)}ms`;
    revealObserver.observe(target);
  });
}

function initPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (els.installApp) els.installApp.hidden = false;
  });

  els.installApp?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showToast("Install lewat menu browser: Add to Home Screen.");
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installApp.hidden = true;
  });
}

function renderVisuals(summaries) {
  renderLineChart(els.weightChart, summaries, "currentWeight", formatKg);
  renderLineChart(els.savingsChart, summaries, "totalSavings", formatIdr);
  renderBarChart(els.habitChart, summaries, [
    ["Workout", "workoutPct"],
    ["Protein", "proteinPct"],
    ["Roadmap", "roadmapPct"],
  ]);
  renderLineChart(els.overallChart, summaries, "overall", percent, 0, 100);
}

function chartEmpty(target) {
  if (!target) return;
  target.className = "chart-empty";
  target.textContent = "Belum ada data.";
}

function renderLineChart(target, rows, key, formatter, forcedMin, forcedMax) {
  if (!target || !rows.length) return chartEmpty(target);
  const points = rows
    .map((row) => ({ week: row.week, value: Number(row[key]) }))
    .filter((point) => Number.isFinite(point.value));

  if (!points.length) return chartEmpty(target);

  const values = points.map((point) => point.value);
  const min = Number.isFinite(forcedMin) ? forcedMin : Math.min(...values);
  const max = Number.isFinite(forcedMax) ? forcedMax : Math.max(...values);
  const range = max - min || 1;
  const width = 520;
  const height = 220;
  const pad = 28;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = points.length > 1 ? pad + index * step : width / 2;
    const y = height - pad - ((point.value - min) / range) * (height - pad * 2);
    return { ...point, x, y };
  });
  const path = coords.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  target.className = "chart";
  target.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${key} chart">
      <path class="chart-grid-line" d="M ${pad} ${height - pad} H ${width - pad}" />
      <path class="chart-grid-line" d="M ${pad} ${pad} H ${width - pad}" />
      <path class="chart-line" d="${path}" />
      ${coords.map((point) => `<circle class="chart-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" />`).join("")}
    </svg>
    <div class="chart-caption">Week ${last.week}: ${formatter(last.value)}</div>
  `;
}

function renderBarChart(target, rows, series) {
  if (!target || !rows.length) return chartEmpty(target);
  const latest = rows[rows.length - 1];
  target.className = "chart bar-chart";
  target.innerHTML = series.map(([label, key]) => {
    const value = Math.max(0, Math.min(Number(latest[key]) || 0, 100));
    return `
      <div class="bar-row">
        <span>${label}</span>
        <div class="bar-track"><i style="width:${value}%"></i></div>
        <strong>${percent(value)}</strong>
      </div>
    `;
  }).join("");
}

async function syncToSheet() {
  const sheetWebhook = settings.sheetWebhook || DEFAULT_SHEET_WEBHOOK;
  if (!sheetWebhook) {
    showToast("Isi Apps Script URL dulu.");
    return;
  }

  const summaries = weeklySummaries();
  const selectedSummary = summaries[summaries.length - 1];
  if (!selectedSummary) {
    showToast("Belum ada data buat dikirim.");
    return;
  }

  const payload = {
    daily: Object.values(entries).sort((a, b) => a.date.localeCompare(b.date)),
    weeklyLog: summaries.map(weeklyLogRow),
    dashboard: summaries.map(dashboardRow),
  };

  await fetch(sheetWebhook, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  showToast("Data dikirim ke Sheets.");
}

els.entryDate.value = todayIso();
initTheme();
fillSettings();
fillDatabaseSettings();
render();
initNavigation();
initEdgeNav();
initRevealMotion();
initPwa();

window.addEventListener("pointermove", updateCursorGrid, { passive: true });
window.addEventListener("touchmove", updateCursorGrid, { passive: true });
els.entryDate.addEventListener("change", render);
els.editSettings.addEventListener("click", () => {
  if (settingsEditable) {
    fillSettings();
    return;
  }
  setSettingsEditable(true);
  els.startWeight.focus();
});
els.saveSettings.addEventListener("click", saveSettings);
els.saveDatabaseSettings.addEventListener("click", saveDatabaseSettings);
els.resetDatabaseSettings.addEventListener("click", resetDatabaseSettings);
els.openDatabase.addEventListener("click", () => {
  window.open(databaseUrl(), "_blank", "noreferrer");
});
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentEntry();
  render();
  showToast("Check-in tersimpan.");
});

els.form.addEventListener("click", (event) => {
  const button = event.target.closest("[data-savings-adjust]");
  if (!button) return;
  adjustSavings(Number(button.dataset.savingsAdjust || 0));
});

els.dailyTasks.addEventListener("change", () => {
  saveCurrentEntry();
  render();
});

els.weekPlan.addEventListener("click", (event) => {
  const card = event.target.closest("[data-date]");
  if (!card) return;
  els.entryDate.value = card.dataset.date;
  render();
});

els.resetDay.addEventListener("click", () => {
  delete entries[els.entryDate.value];
  saveJson(STORAGE_KEY, entries);
  render();
  showToast("Data tanggal ini dikosongkan.");
});

els.clearAll.addEventListener("click", () => {
  if (!confirm("Hapus semua data lokal Traxer?")) return;
  entries = {};
  saveJson(STORAGE_KEY, entries);
  render();
  showToast("Semua data lokal terhapus.");
});

els.copyWeekly.addEventListener("click", async () => {
  const summaries = weeklySummaries();
  const row = summaries[summaries.length - 1];
  if (!row) return showToast("Belum ada data.");
  await navigator.clipboard.writeText(weeklyLogRow(row).join("\t"));
  showToast("Weekly row dicopy.");
});

els.downloadCsv.addEventListener("click", downloadCsv);
els.syncSheet.addEventListener("click", syncToSheet);
