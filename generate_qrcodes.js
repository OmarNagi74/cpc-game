/* ============================================================================
   QR CODE GENERATOR — للعبة "خمس مشاكل… حل واحد"
   ============================================================================
   HOW TO USE (for the organizer):
   1. Install the dependency once:       npm install
   2. Set the two variables below (BASE_URL + station names).
   3. Run the script:                    npm run generate
      (or: node generate_qrcodes.js)
   4. Done! You'll find, inside the "output" folder:
         station-1.png ... station-5.png   (600x600, high error correction)
         print-sheet.html                  (print this to cut out the codes)

   NOTE: The station names here are used ONLY for the printable sheet labels.
   They should match the names you put in the CONFIG object of index.html.
   ============================================================================ */

// ============================================================================
// 1) THE REAL URL OF YOUR HOSTED index.html  (عدّل ده)
//    Example: "https://mycommunity.org/hunt/index.html"
//    No trailing slash needed. The script appends "?station=N" automatically.
// ============================================================================
const BASE_URL = "https://cpc-game.vercel.app/index.html";

// ============================================================================
// 2) STATION NAMES — same names you used in index.html (CONFIG.stationNames).
//    Keep the keys (1..5) in order; the script walks 1..TOTAL_STATIONS.
// ============================================================================
const STATION_NAMES = {
  1: "خيرت",
  2: "بهاء",
  3: "البدروم",
  4: "محمد صبري",
  5: "انتصارات"
};

// Total number of stations (must match CONFIG.totalStations in index.html).
const TOTAL_STATIONS = 5;

// ============================================================================
// FOLDER WHERE THE FILES ARE SAVED (usually leave this alone)
// ============================================================================
const OUTPUT_DIR = "./output";

/* ============================================================================
   BELOW IS THE TECHNICAL PART — you don't normally need to touch anything
   after this line.
   ============================================================================ */

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

// ---------- config for the QR images ----------
const QR_OPTIONS = {
  errorCorrectionLevel: "H", // "high" — stays scannable even if damaged/cut
  type: "png",
  width: 600,
  margin: 2 // quiet zone (modules, not pixels)
};

// ---------- helpers ----------
function stationUrl(n) {
  return BASE_URL + "?station=" + n;
}

function stationName(n) {
  return STATION_NAMES[n] ? STATION_NAMES[n] : "معمل " + n;
}

function htmlEscape(text) {
  return String(text).replace(/[&<>"']/g, function (ch) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch];
  });
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const codes = [];

  for (let n = 1; n <= TOTAL_STATIONS; n++) {
    const url = stationUrl(n);
    const file = path.join(OUTPUT_DIR, "station-" + n + ".png");

    try {
      await QRCode.toFile(file, url, QR_OPTIONS);
      const dataUrl = await QRCode.toDataURL(url, QR_OPTIONS); // for the print sheet
      codes.push({ n: n, url: url, name: stationName(n), dataUrl: dataUrl });
      console.log("✓ " + file + "  →  " + url);
    } catch (err) {
      console.error("✗ Failed to generate station " + n + ":", err.message);
      process.exitCode = 1;
    }
  }

  if (codes.length > 0) {
    console.log("\nBuilding printable sheet…");
    const sheet = buildSheetHtml(codes);
    const sheetPath = path.join(OUTPUT_DIR, "print-sheet.html");
    fs.writeFileSync(sheetPath, sheet, "utf8");
    console.log("✓ " + sheetPath + "\n");
  }

  console.log("All done! Open the print-sheet.html file and print it — cut out");
  console.log("each card and place it next to its station.\n");
}

// ---------- printable HTML sheet (works from file://, no internet needed) ----------
function buildSheetHtml(codes) {
  const cards = codes
    .map(function (c) {
      return (
        '<div class="card">' +
        '<img src="' + c.dataUrl + '" alt="QR station ' + c.n + '" width="600" height="600">' +
        '<div class="label">' + htmlEscape(c.name) + "</div>" +
        '<div class="url">' + htmlEscape(c.url) + "</div>" +
        "</div>"
      );
    })
    .join("\n      ");

  return (
    "<!DOCTYPE html>\n" +
    '<html lang="ar" dir="rtl">\n' +
    "<head>\n" +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>ملصقات المعامل — اطبع وقصّ</title>\n" +
    "<style>\n" +
    "  * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
    "  body { font-family: 'Arial', 'Helvetica', sans-serif; padding: 24px; background: #fff; color: #111; }\n" +
    "  h1 { font-size: 20px; margin-bottom: 18px; text-align: center; }\n" +
    "  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px; max-width: 1000px; margin: 0 auto; }\n" +
    "  .card { border: 2px dashed #999; border-radius: 12px; padding: 12px; text-align: center; background: #fff; }\n" +
    "  .card img { width: 100%; height: auto; display: block; border-radius: 6px; }\n" +
    "  .label { font-size: 20px; font-weight: bold; margin: 12px 0 6px; }\n" +
    "  .url { font-size: 11px; color: #666; word-break: break-all; }\n" +
    "  @media print { .card { border-width: 1.5px; page-break-inside: avoid; } }\n" +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    "  <h1>اطبع ورقة واحدة — ثم قصّ كل كارت لصقه عند معمله</h1>\n" +
    '  <div class="grid">\n      ' + cards + "\n  </div>\n" +
    "</body>\n" +
    "</html>\n"
  );
}

main();