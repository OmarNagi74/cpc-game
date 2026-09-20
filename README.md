# خمس مشاكل… حل واحد — Labs Scavenger Hunt

A community scavenger-hunt game (gamified). Visitors scan QR codes around 5
physical labs; the app tracks progress, awards points, ranks them by progress,
and celebrates the finish — plus it can tell the **admin how many times each
QR was scanned** via a Google Sheet.

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The game itself (single self-contained file, no build step) |
| `generate_qrcodes.js` | Generates the 5 QR codes + a printable sheet (Node.js) |
| `package.json` | Just declares the one dependency (`qrcode`) |
| `google_apps_script.gs` | Copy-paste code for the admin scan counter (optional) |
| `output/` | Created by the generator — station PNGs + print sheet (generated, not committed) |

---

## Step 1 — Host `index.html`

Upload `index.html` anywhere that serves web pages over HTTPS, for example:
GitHub Pages, Netlify, Vercel, Cloudflare Pages, or your own web server.

You need the **full URL** where `index.html` can be opened, e.g.:

```
https://mycommunity.org/hunt/index.html
```

---

## Step 2 — Set `BASE_URL` in `generate_qrcodes.js`

Open `generate_qrcodes.js` and set the variable at the very top of the file
(it's clearly marked with `عدّل ده` / "edit this"):

```js
const BASE_URL = "https://mycommunity.org/hunt/index.html";
```

The script automatically appends `?station=1` … `?station=5` to this URL.

---

## Step 3 — Edit the game text in `index.html`

Open `index.html`, scroll to the top of the `<script>` block, and find the
`CONFIG` object (clearly labeled "CONFIG — عدّل من هنا"). Things to edit:

1. **Station names** — `stationNames` (currently temporary names `معمل 1..5`;
   replace with the 5 real lab names):

```js
stationNames: {
  1: "معمل 1",
  2: "معمل 2",
  3: "معمل 3",
  4: "معمل 4",
  5: "معمل 5"
}
```

2. **Event name** — `eventName`.
3. **Final texts** — `finalTitle` and `finalMessage` ("you did it" screen).
4. **Community links** — `communityLinks` (add/remove/edit any line, keeping
   the `{ label: "...", url: "..." }` shape):

```js
communityLinks: [
  { label: "صفحة المجتمع على فيسبوك", url: "https://www.facebook.com/share/19x1CAuuqB/?mibextid=wwXIfr" }
]
```

> Keep the same names here and in `STATION_NAMES` of `generate_qrcodes.js` so
> the printed labels match what players see on their phones.

The game's **look uses the logo colors**: blue for actions, red for alerts,
gold for rewards/scores. If you ever need different tones, the color variables
are at the top of the `<style>` block in `index.html` (`--primary`, `--accent`,
`--gold`).

---

## Step 4 — Generate the QR codes

You need Node.js installed (16+). Then, once, from this folder:

```bash
npm install
```

Then generate the codes (re-run any time you change `BASE_URL` or names):

```bash
npm run generate
# or simply:  node generate_qrcodes.js
```

This creates an `output/` folder with:

- `station-1.png` … `station-5.png` — 600×600, high error correction,
  scannable even if the paper gets slightly damaged.
- `print-sheet.html` — one printable page with all 5 codes in a grid, each
  labeled with its station name. Open it and print (works without internet),
  then cut out each card and tape/glue it next to its lab.

> Tip: print at 100% size — don't scale down or the codes become unreliable.

---

## Step 5 (optional but requested) — Admin scan counter → Google Sheet

This makes each scan of any QR write a row to a Google Sheet, so the admin
can see how many times each station was scanned, when, and the visitor's
progress at that moment.

Setup takes ~2 minutes:

1. Create a new Google Sheet (drive.google.com → New → Google Sheets).
2. In the sheet: **Extensions → Apps Script**.
3. Erase any code and paste the full contents of `google_apps_script.gs`.
4. Click **Deploy → New deployment → Web app**.
5. Set:
   - *Execute as:* `Me`
   - *Who has access:* `Anyone`
6. Click **Deploy**, then **Authorize access** with your Google account.
7. Copy the **Web app URL** that appears.
8. In `index.html`, find `tracking` inside `CONFIG` and set:

```js
tracking: {
  enabled: true,
  scriptUrl: "https://script.google.com/macros/s/PASTE-YOUR-URL/exec"
}
```

Every scan now appends a row (Timestamp, Station, Kind new/repeat, progress
count, Event, User agent) to a sheet tab called `logs`.

> If you don't set this up, the game still works — tracking just stays off.
> Each visitor's own progress is always saved privately in their browser.

---

## How the game behaves (gamified)

- Opening the URL **without** a station → welcome / instructions screen.
- `index.html?station=N` → marks lab N visited, **+100 points**, tells the
  player where to go next ("روح دلوقتي إلى …"), and updates progress
  (dots + "X من 5") with a growing **rank** (مستكشف جديد → بطل المعامل).
- Re-scanning an already-visited lab → a friendly note (no extra points) and
  it **repeats the same next-lab instruction** (it does not change your
  assigned stop).
- Visiting all 5 → **final celebration**: confetti, a grade based on how
  efficiently you finished (الأسطورة الذهبية / النجم الفضي / المستكشف
  البرونزي), your score, the community links, and a "play again" button.
- `index.html?reset=1` → hidden testing helper that clears all saved progress.

Progress (visited labs, assigned next stop, total scans, score) is stored in
the visitor's browser localStorage, so closing the tab keeps their place.

---

## Troubleshooting

- **QR doesn't scan** → printed at 100% size on clean white paper? Error
  correction is already maximum ("H").
- **Same name mismatch on phone vs paper** → you edited `index.html` but
  forgot `generate_qrcodes.js` (or vice versa). Keep both in sync.
- **`npm install` errors** → check Node is installed (`node --version`).
- **Counter not writing to the sheet** → make sure `enabled: true`, the URL
  starts with `https://script.google.com/.../exec`, and the Apps Script was
  deployed with access `Anyone` (not "Anyone with Google account").
- **Progress "resets" on every scan** → the phone opened the link in an
  in-app browser (or private mode) that won't let the site save progress.
  The game now writes to every available store (localStorage, sessionStorage,
  cookie, memory), which fixes most of these cases. For bulletproof testing,
  open the station links directly in your normal browser (Safari/Chrome)
  instead of through a scanner app.
- **localStorage not saving** → expected in some private/incognito modes; the
  app catches the error and still works for the current visit.