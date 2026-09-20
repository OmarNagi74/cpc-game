/* ============================================================================
   Shared, pure game-state logic for the server-side API.
   Both api/state.js (Vercel serverless) use these helpers so the server and
   the "what should happen next" rules are computed in ONE place.

   Responsibilities:
     - validate & normalize a "visited" list (unique, in-range, sorted)
     - pick a random next unvisited station (never the current one)
     - merge the server's saved state with the client's local state and the
       just-scanned station, producing the authoritative { visited, next,
       scans, done } for this visitor.
   ============================================================================ */

function normalizeVisited(arr, total) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const n of arr) {
    if (Number.isInteger(n) && n >= 1 && n <= total && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.sort((a, b) => a - b);
}

function pickNext(current, visited, total) {
  const unvisited = [];
  for (let i = 1; i <= total; i++) {
    if (!visited.includes(i) && i !== current) unvisited.push(i);
  }
  if (unvisited.length === 0) return null;
  return unvisited[Math.floor(Math.random() * unvisited.length)];
}

function isValidNext(next, current, visited, total) {
  return (
    Number.isInteger(next) &&
    next >= 1 &&
    next <= total &&
    next !== current &&
    !visited.includes(next)
  );
}

/* Merge server + client state for a scan at `station`.
   - `server` may be null (first time we see this visitor).
   - `client` is the browser's optimistic local state: { visited, next }.
   - returns { visited, next, scans, done } (authoritative). */
function mergeState(server, client, station, total) {
  const serverVisited = normalizeVisited(server && server.visited, total);
  const clientVisited = normalizeVisited(client && client.visited, total);
  const visited = normalizeVisited([].concat(serverVisited, clientVisited, station), total);

  const scanned = server && Number.isInteger(server.scans) ? server.scans : 0;
  const scans = scanned + 1;

  const done = visited.length >= total;

  let next = server && server.next;
  if (!isValidNext(next, station, visited, total)) {
    next = pickNext(station, visited, total);
  }

  return { visited: visited, next: next, scans: scans, done: done };
}

module.exports = { normalizeVisited, pickNext, isValidNext, mergeState };