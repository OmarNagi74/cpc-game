/* ============================================================================
   عداد مسحات المعامل — Google Apps Script
   ============================================================================
   دا الملف اللي بيخلي المسؤول يعرف كام زائر مسح كل QR.

   طريقة التركيب (دقيقتين):
   1) اعمل Google Sheet جديد من drive.google.com (أي اسم — بلاش الشيت يكون
      Protected/محجوز للتعديل).
   2) من الشيت: Extensions (إضافات) ← Apps Script.
   3) امسح أي كود موجود والصّق محتوى الملف ده كامل.
   4) اضغط على زر النشر Deploy ← New deployment ← Type: Web app.
   5) هتكتب:
        Description:           أي حاجة (مثلاً "matching counter")
        Execute as:            Me (أنا)
        Who has access:        Anyone (أي حد)
   6) اضغط Deploy، ثم Authorize access (أكد بحسابك الجوجل).
   7) انسخ الـ Web app URL الظاهر وشغّل العداد في index.html (شرح في README).

   هتوصل كل مسحة عبارة عن سطر جديد في الشيت بأعمدة:
     Timestamp | Station | Kind | Visited count | Event | User agent

   ========================================================================== */

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return htmlError('Bad JSON');
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var log = sheet.getSheetByName('logs');
  if (log === null) {
    log = sheet.insertSheet('logs');
    log.appendRow(['Timestamp', 'Station', 'Kind', 'Visited count', 'Event', 'User agent']);
  }

  log.appendRow([
    new Date(),
    data.station != null ? data.station : '-',
    data.kind || 'scan',
    data.visitedCount != null ? data.visitedCount : '-',
    data.event != null ? data.event : '-',
    data.userAgent ? String(data.userAgent) : '-'
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// أي حد يفتح الـ URL في المتصفح بس — رد "OK"
function doGet() {
  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function htmlError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}