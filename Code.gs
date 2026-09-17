/**
 * Vision Aura Agency — Booking backend (Google Apps Script)
 * ============================================================
 * Zero-cost booking notification system:
 *   Website form → this Web App → Google Sheet + Gmail notification
 *
 * SETUP — see the deployment instructions provided alongside this
 * file for the full step-by-step. Short version:
 *
 * 1. Create a Google Sheet (any name). Open Extensions → Apps Script.
 * 2. Delete any starter code in Code.gs and paste this entire file in.
 * 3. Set NOTIFICATION_EMAIL below to the Gmail address that should
 *    receive booking notifications.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as:   Me
 *      Who has access: Anyone
 * 5. Copy the Web App URL it gives you and paste it into
 *    BOOKING_ENDPOINT_URL in script.js on the website.
 *
 * This script creates its own "Bookings" sheet/tab automatically
 * (with headers) the first time it runs, so no manual header setup
 * is required — though you're welcome to create it yourself first.
 */

var SHEET_NAME = 'Bookings';
var NOTIFICATION_EMAIL = 'visonaurastudio.in@gmail.com'; // <-- put your Gmail address here

/**
 * Handles the POST request sent from the website's booking forms.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, error: 'No data received.' });
    }

    var data = JSON.parse(e.postData.contents);

    var name = cleanString_(data.name);
    var email = cleanString_(data.email);
    var date = cleanString_(data.date);
    var time = cleanString_(data.time);

    // These four are the fields both booking forms on the site
    // always mark as required, so treat them as required here too.
    if (!name || !email || !date || !time) {
      return jsonResponse_({
        success: false,
        error: 'Missing required booking details (name, email, date, or time).',
      });
    }

    var phone = cleanString_(data.phone);
    var service = cleanString_(data.service);
    var details = cleanString_(data.details);
    var source = cleanString_(data.source);

    var timestamp = new Date();

    appendBookingRow_({
      timestamp: timestamp,
      name: name,
      email: email,
      phone: phone,
      service: service,
      date: date,
      time: time,
      details: details,
      source: source,
    });

    sendNotificationEmail_({
      timestamp: timestamp,
      name: name,
      email: email,
      phone: phone,
      service: service,
      date: date,
      time: time,
      details: details,
      source: source,
    });

    return jsonResponse_({ success: true });
  } catch (err) {
    return jsonResponse_({ success: false, error: 'Server error: ' + err.message });
  }
}

/**
 * Lets you open the deployed Web App URL directly in a browser to
 * confirm the deployment is live. The website itself only ever
 * sends POST requests, never GET.
 */
function doGet(e) {
  return jsonResponse_({
    success: true,
    message: 'Vision Aura agency booking endpoint is live.',
  });
}

function cleanString_(value) {
  return value ? value.toString().trim() : '';
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Email',
      'Phone / WhatsApp',
      'Service',
      'Date',
      'Time',
      'Project Details',
      'Status',
      'Source',
    ]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function appendBookingRow_(b) {
  var sheet = getOrCreateSheet_();
  sheet.appendRow([
    b.timestamp,
    b.name,
    b.email,
    b.phone,
    b.service,
    b.date,
    b.time,
    b.details,
    'NEW',
    b.source,
  ]);
}

function sendNotificationEmail_(b) {
  var subject = 'New Booking Request \u2014 ' + b.name;

  var body =
    'You have a new booking request from the Vision Aura Agency website.\n\n' +
    'Name: ' + b.name + '\n' +
    'Email: ' + b.email + '\n' +
    'Phone / WhatsApp: ' + (b.phone || '\u2014') + '\n' +
    'Service: ' + (b.service || '\u2014') + '\n' +
    'Requested Date: ' + b.date + '\n' +
    'Requested Time: ' + b.time + '\n' +
    'Project Details: ' + (b.details || '\u2014') + '\n' +
    'Submitted From: ' + (b.source || '\u2014') + '\n' +
    'Received At: ' + b.timestamp + '\n';

  MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
