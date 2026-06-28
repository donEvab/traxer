const STORAGE_KEY = "traxer.entries.v1";
const SETTINGS_KEY = "traxer.settings.v1";
const DEFAULT_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzsOd1B7x9opDV97-S5sCsOjiMrgARvQBs6ThdUoj9_VzY-RorZUJL1RU7pKbTi9H77UA/exec";

const els = {
  form: document.querySelector("#dailyForm"),
  entryDate: document.querySelector("#entryDate"),
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
};

const cursorState = { x: window.innerWidth / 2, y: window.innerHeight * 0.3, frame: 0 };
let settingsEditable = false;

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
let settings = loadJson(SETTINGS_KEY, {
  sheetWebhook: DEFAULT_SHEET_WEBHOOK,
  startWeight: "",
  savingsTarget: 10000000,
});

if (!settings.sheetWebhook || settings.sheetWebhook !== DEFAULT_SHEET_WEBHOOK) {
  settings.sheetWebhook = DEFAULT_SHEET_WEBHOOK;
  saveJson(SETTINGS_KEY, settings);
}

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
  setSettingsEditable(false);
}

function setSettingsEditable(enabled) {
  settingsEditable = enabled;
  els.startWeight.disabled = !enabled;
  els.savingsTarget.disabled = !enabled;
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
    sheetWebhook: DEFAULT_SHEET_WEBHOOK,
    startWeight: els.startWeight.value,
    savingsTarget: Number(els.savingsTarget.value || 10000000),
  };
  saveJson(SETTINGS_KEY, settings);
  setSettingsEditable(false);
  render();
  showToast("Targets tersimpan.");
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

    const workoutPct = Math.min(workout / 4, 1) * 100;
    const proteinPct = Math.min(protein / 7, 1) * 100;
    const roadmapPct = Math.min(roadmap / 7, 1) * 100;
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
      workoutPct,
      protein,
      proteinPct,
      roadmap,
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
    `${summary.workout}/4`,
    `${summary.protein}/7`,
    `${summary.roadmap}/7`,
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
    `${summary.workout}/4`,
    percent(summary.workoutPct),
    `${summary.protein}/7`,
    percent(summary.proteinPct),
    `${summary.roadmap}/7`,
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
    els.workoutScore.textContent = "0/4";
    els.proteinScore.textContent = "0/7";
    els.roadmapScore.textContent = "0/7";
    els.overallScore.textContent = "0%";
    return;
  }

  els.weekNumber.textContent = activeSummary.week;
  els.weekRange.textContent = `${activeSummary.weekStart} - ${activeSummary.weekEnd}`;
  els.verdictBadge.textContent = activeSummary.verdict;
  els.verdictBadge.style.color = activeSummary.verdict === "GOOD" ? "var(--green)" : activeSummary.verdict === "OK" ? "var(--amber)" : "var(--red)";
  els.currentWeight.textContent = formatKg(activeSummary.currentWeight);
  els.weightGain.textContent = formatKg(activeSummary.deltaWeight, true);
  els.workoutScore.textContent = `${activeSummary.workout}/4`;
  els.proteinScore.textContent = `${activeSummary.protein}/7`;
  els.roadmapScore.textContent = `${activeSummary.roadmap}/7`;
  els.overallScore.textContent = percent(activeSummary.overall);
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
    .join("");
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
fillSettings();
render();

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
