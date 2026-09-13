// Paste this into Extensions > Apps Script (opened from inside the target
// Google Sheet, so it binds to that spreadsheet automatically) and deploy
// as a Web App. See the "Google Sheet logging setup" section in this
// project's chat instructions for the exact deploy steps.

var SHEET_NAME = "Sheet1";
var HEADERS = [
  "Timestamp", "Exam Type", "Name", "Favorite Food", "Favorite Color",
  "Score Obtained", "Max Marks", "Correct", "Incorrect", "Unanswered", "Accuracy (%)"
];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.examType || "",
    data.name || "",
    data.food || "",
    data.color || "",
    data.scoreObtained,
    data.totalMarks,
    data.correct,
    data.incorrect,
    data.unanswered,
    data.accuracy
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("E-Business Practice logging endpoint is live.");
}
