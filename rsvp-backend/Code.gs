/**
 * RSVP backend for the wedding invitation site.
 * Deploy as a Web App (see SETUP.md) and paste the resulting URL into
 * config.rsvp.endpoint in src/config.js.
 *
 * The frontend POSTs with Content-Type: text/plain (to avoid a CORS
 * preflight, which Apps Script web apps cannot answer), so the body must
 * be parsed as JSON manually here rather than read from e.parameter.
 *
 * Every response is JSON: { ok: true } on success, { ok: false, error } on
 * failure. Apps Script answers HTTP 200 either way, so the frontend checks
 * `ok`, not just the status code.
 */

var SHEET_NAME = "RSVPs";

// Column order for a NEW sheet. Rows are written by header name, not by
// position, so an existing sheet with the older 7-column layout keeps working:
// any header it is missing (Language, Submission ID) is added to the right.
var HEADERS = [
  "Timestamp",
  "Name",
  "Attending",
  "Guests",
  "Message",
  "Language",
  "Guest Param",
  "Submitted At",
  "Submission ID",
];

var MAX_GUESTS = 20; // hard server-side cap; the site's own limit is config.rsvp.maxGuests

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var data = JSON.parse(e.postData.contents);

    var name = sanitize_(data.name);
    var attending = data.attending === "yes" ? "yes" : data.attending === "no" ? "no" : "";
    var guests = attending === "yes" ? Math.min(Math.max(Math.floor(Number(data.guests)) || 1, 1), MAX_GUESTS) : 0;
    var message = sanitize_(data.message);
    var language = data.language === "fr" ? "fr" : "en";
    var guestParam = sanitize_(data.guestParam);
    var submittedAt = sanitize_(data.submittedAt) || new Date().toISOString();
    var submissionId = sanitize_(data.submissionId);

    if (!name || !attending) {
      return jsonResponse_({ ok: false, error: "Missing required fields." });
    }

    // Serialise writers so the duplicate check and the append are atomic —
    // two near-simultaneous submissions can otherwise both pass the check.
    lock.waitLock(10000);
    locked = true;

    var sheet = getSheet_();
    var cols = columnMap_(sheet);

    // A guest whose first attempt timed out on their end will retry with the
    // same submissionId; if that first attempt actually landed, don't add a
    // second row. Reported as success — the RSVP is recorded either way.
    if (submissionId && idExists_(sheet, cols["Submission ID"], submissionId)) {
      return jsonResponse_({ ok: true, duplicate: true });
    }

    var values = {
      "Timestamp": new Date(),
      "Name": name,
      "Attending": attending,
      "Guests": guests,
      "Message": message,
      "Language": language,
      "Guest Param": guestParam,
      "Submitted At": submittedAt,
      "Submission ID": submissionId,
    };
    var row = [];
    for (var i = 0; i < sheet.getLastColumn(); i++) row.push("");
    for (var header in values) row[cols[header] - 1] = values[header];
    sheet.appendRow(row);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Lets you check a deployment from a browser: opening the /exec URL should
// show {"ok":true,"service":"rsvp"}. Returns no sheet data.
function doGet() {
  return jsonResponse_({ ok: true, service: "rsvp" });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Returns { headerName: 1-based column }, appending any expected header the
// sheet doesn't have yet.
function columnMap_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < existing.length; i++) {
    if (existing[i] !== "") map[String(existing[i])] = i + 1;
  }
  for (var h = 0; h < HEADERS.length; h++) {
    if (!map[HEADERS[h]]) {
      var col = Math.max(sheet.getLastColumn(), 0) + 1;
      sheet.getRange(1, col).setValue(HEADERS[h]);
      map[HEADERS[h]] = col;
    }
  }
  return map;
}

function idExists_(sheet, col, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var ids = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return true;
  }
  return false;
}

function sanitize_(value) {
  if (typeof value !== "string") return "";
  var text = value.trim().slice(0, 500);
  // Sheets evaluates a cell that starts with = + - @ as a formula. Guest text
  // is untrusted, so store it as literal text (a leading apostrophe is
  // consumed by Sheets and not displayed).
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return text;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
