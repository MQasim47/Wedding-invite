/**
 * RSVP backend for the wedding invitation site.
 * Deploy as a Web App (see SETUP.md) and paste the resulting URL into
 * config.rsvp.endpoint in src/config.js.
 *
 * The frontend POSTs with Content-Type: text/plain (to avoid a CORS
 * preflight, which Apps Script web apps cannot answer), so the body must
 * be parsed as JSON manually here rather than read from e.parameter.
 */

var SHEET_NAME = "RSVPs";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var name = sanitize_(data.name);
    var attending = data.attending === "yes" ? "yes" : data.attending === "no" ? "no" : "";
    var guests = Number(data.guests) || 0;
    var message = sanitize_(data.message);
    var guestParam = sanitize_(data.guestParam);
    var submittedAt = data.submittedAt || new Date().toISOString();

    if (!name || !attending) {
      return jsonResponse_({ ok: false, error: "Missing required fields." });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      name,
      attending,
      guests,
      message,
      guestParam,
      submittedAt,
    ]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Attending", "Guests", "Message", "Guest Param", "Submitted At"]);
  }
  return sheet;
}

function sanitize_(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 500);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
