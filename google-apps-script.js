const CONFIG = {
  SPREADSHEET_ID: "1JCDZSb6CHWDTd8Re4R_uULNWJG88ck0DwcLK1JFqYAg",
};

function doGet() {
  const spreadsheet = getSpreadsheet_();
  return json_({
    ok: true,
    spreadsheet: spreadsheet.getName(),
    message: "Traxer webhook is ready",
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Missing request body");
    }

    const payload = JSON.parse(e.postData.contents);
    const spreadsheet = getSpreadsheet_();

    writeTable_(spreadsheet, "Weekly Log", [
      "Week",
      "Weight (Kg)",
      "Delta Weight (Kg)",
      "Workout Done",
      "Protein Days",
      "Roadmap Progress",
      "Trading P/L",
      "Savings +",
      "Total Savings",
      "Equity",
    ], payload.weeklyLog || []);

    writeTable_(spreadsheet, "Dashboard Weekly", [
      "Current Week",
      "Current Weight",
      "Total Weight Gain",
      "Workout Consistency",
      "Workout %",
      "Protein Consistency",
      "Protein Consistency %",
      "Roadmap Consistency",
      "Roadmap Consistency %",
      "Trading (current week PNL)",
      "Total PNL",
      "Total Savings",
      "Savings % (10JT)",
      "Overall score",
      "Verdict",
    ], payload.dashboard || []);

    writeTable_(spreadsheet, "Daily Log", [
      "Date",
      "Weight",
      "Done Tasks",
      "Workout Done",
      "Protein Done",
      "Roadmap Done",
      "Trading P/L",
      "Savings",
      "Notes",
    ], (payload.daily || []).map(function(day) {
      return [
        day.date,
        day.weight,
        (day.doneTasks || []).join(", "),
        day.workoutDone,
        day.proteinDone,
        day.roadmapDone,
        day.tradingPnl,
        day.savings,
        day.notes,
      ];
    }));

    return json_({
      ok: true,
      updatedAt: new Date().toISOString(),
      weeklyRows: (payload.weeklyLog || []).length,
      dailyRows: (payload.daily || []).length,
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active spreadsheet. Set CONFIG.SPREADSHEET_ID in Apps Script.");
  }
  return spreadsheet;
}

function writeTable_(spreadsheet, sheetName, headers, rows) {
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.autoResizeColumns(1, headers.length);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
