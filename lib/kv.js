/* ============================================================================
   Minimal Upstash Redis REST client — replaces @vercel/kv so we are NOT tied
   to one exact environment-variable naming scheme.

   Vercel's Upstash integration creates different names depending on how it is
   connected (KV_REST_API_URL, UPSTASH_REDIS_REST_URL, KV_REST_API_REDIS_URL…).
   This module accepts any of them, rejects unexpanded ${...} references, and
   speaks the plain Upstash REST protocol with global fetch.

   Exposes the same surface the handlers use: get/set/del/incr/sadd/scard.
   ============================================================================ */

const URL_NAMES = [
  "KV_REST_API_URL",
  "UPSTASH_REDIS_REST_URL",
  "KV_REST_API_REDIS_URL",
  "UPSTASH_REDIS_URL",
  "REDIS_URL"
];

const TOKEN_NAMES = [
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_READ_ONLY_TOKEN",
  "UPSTASH_REDIS_TOKEN"
];

function resolveConfig() {
  let url = "";
  let urlName = "";
  for (const name of URL_NAMES) {
    const v = process.env[name];
    if (v && /^https:\/\//i.test(v) && !v.includes("${")) {
      url = v.replace(/\/+$/, "");
      urlName = name;
      break;
    }
  }
  let token = "";
  let tokenName = "";
  for (const name of TOKEN_NAMES) {
    const v = process.env[name];
    if (v && !v.includes("${")) {
      token = v;
      tokenName = name;
      break;
    }
  }
  return { url, token, urlName, tokenName };
}

function isConfigured() {
  const c = resolveConfig();
  return !!(c.url && c.token);
}

async function command(cmd) {
  const c = resolveConfig();
  if (!c.url || !c.token) {
    throw new Error(
      "Upstash/KV not configured. Set one REST url var (" + URL_NAMES.join(", ") +
      ") and one token var (" + TOKEN_NAMES.join(", ") + ") with real values."
    );
  }
  const res = await fetch(c.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + c.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cmd)
  });
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return data ? data.result : null;
}

const kv = {
  isConfigured,
  async get(key) {
    const raw = await command(["GET", key]);
    if (raw == null) return null;
    if (typeof raw !== "string") return raw;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  },
  async set(key, value, opts) {
    const args = ["SET", key, JSON.stringify(value)];
    if (opts && Number.isInteger(opts.ex)) args.push("EX", opts.ex);
    await command(args);
  },
  async del(key) {
    await command(["DEL", key]);
  },
  async incr(key) {
    const n = await command(["INCR", key]);
    return Number(n);
  },
  async sadd(key, member) {
    const n = await command(["SADD", key, String(member)]);
    return Number(n);
  },
  async scard(key) {
    const n = await command(["SCARD", key]);
    return Number(n);
  }
};

module.exports = { kv, resolveConfig };
