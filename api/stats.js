/* ============================================================================
   Vercel Function: /api/stats
   ----------------------------------------------------------------------------
   Admin dashboard data — how many times each station's QR has been scanned,
   total scans, unique visitors, and how many visitors completed the hunt.

   GET /api/stats   (optional ?stations=N to override the count)
   ============================================================================ */

const { kv, resolveConfig } = require("../lib/kv");

module.exports = async function handler(req, res) {
  const total = parseInt(req.query.stations || "5", 10);
  const safeTotal = Number.isInteger(total) && total >= 1 && total <= 50 ? total : 5;

  try {
    const stations = [];
    for (let i = 1; i <= safeTotal; i++) {
      const n = await kv.get("cpc:stats:scans:" + i);
      stations.push({ station: i, scans: Number.isInteger(n) ? n : 0 });
    }

    const totalScans = await kv.get("cpc:stats:totalScans");
    const visitors = await kv.scard("cpc:stats:visitors");
    const done = await kv.scard("cpc:stats:done");

    return res.status(200).json({
      ok: true,
      totalStations: safeTotal,
      stations: stations,
      totalScans: Number.isInteger(totalScans) ? totalScans : 0,
      uniqueVisitors: Number.isInteger(visitors) ? visitors : 0,
      completedPlayers: Number.isInteger(done) ? done : 0,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    const c = resolveConfig();
    const present = Object.keys(process.env).filter(function (k) {
      return /KV_|UPSTASH|REDIS/.test(k);
    }).sort();
    return res.status(200).json({
      ok: false,
      error: String((err && err.message) || err),
      resolved: { urlVar: c.urlName || null, tokenVar: c.tokenName || null },
      kvEnvVarsPresent: present
    });
  }
};