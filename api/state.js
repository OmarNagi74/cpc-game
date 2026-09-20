/* ============================================================================
   Vercel Function: /api/state
   ----------------------------------------------------------------------------
   Server-side save for the game. Each scan POSTs the visitor's state; this
   function merges it with anything already saved for that visitor (in Vercel
   KV), stores the authoritative progress, and returns it so the phone can
   restore it even if its local browser storage was wiped.

   POST body (JSON): {
     visitorId: string,            // persistent per-device id
     station: int,                 // the station just scanned
     visited: [int],               // client's local visited list (optional)
     next: int|null,               // client's assigned next stop (optional)
     totalStations: int,           // e.g. 5
     reset?: true                  // opt: wipe this visitor's saved state
   }
   Response (JSON):
     { ok: true, persisted: bool, visited: [int], next: int|null,
       scans: int, done: bool, totalStations: int }

   Requires the Vercel KV Store (free) connected to this project — see README.
   If the store is unreachable the function still returns merged state so the
   game never breaks; it just can't persist that one call.
   ============================================================================ */

const { kv } = require("../lib/kv");
const { mergeState } = require("../lib/state-core");

const STATE_TTL_SECONDS = 60 * 60 * 24 * 14; // keep progress 14 days

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST") {
      let body = {};
      try { body = JSON.parse(req.body || "{}"); } catch (e) { /* ignore */ }

      const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 128) : "";
      const station = parseInt(body.station, 10);
      const total = Number.isInteger(body.totalStations) && body.totalStations >= 1 ? body.totalStations : 5;

      if (body.reset === true || body.reset === "1" || body.reset === 1) {
        if (visitorId) {
          try { await kv.del("cpc:state:" + visitorId); } catch (e) { /* ignore */ }
        }
        return res.status(200).json({ ok: true, reset: true });
      }

      if (!visitorId || !Number.isInteger(station) || station < 1 || station > total) {
        return res.status(400).json({ ok: false, error: "bad-request" });
      }

      let server = null;
      try { server = await kv.get("cpc:state:" + visitorId); } catch (e) { server = null; }

      const merged = mergeState(
        server,
        { visited: body.visited, next: body.next },
        station,
        total
      );

      let persisted = false;
      try {
        await kv.set("cpc:state:" + visitorId, merged, { ex: STATE_TTL_SECONDS });
        await kv.incr("cpc:stats:scans:" + station);
        await kv.incr("cpc:stats:totalScans");
        await kv.sadd("cpc:stats:visitors", visitorId);
        if (merged.done) await kv.sadd("cpc:stats:done", visitorId);
        persisted = true;
      } catch (e) { persisted = false; }

      return res.status(200).json({
        ok: true,
        persisted: persisted,
        visited: merged.visited,
        next: merged.next,
        scans: merged.scans,
        done: merged.done,
        totalStations: total
      });
    }

    return res.status(405).json({ ok: false, error: "method-not-allowed" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
};