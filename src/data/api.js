// ============================================================
// v2 Amplop — data API client (Phase 3 wiring).
//
// The backend (separate `expense-functions` Cloud Function) now owns ALL
// envelope/budget math and returns a render-ready month dashboard, so the
// client is a thin renderer over its responses. One routed function, REST
// paths under a single base URL; no auth, CORS:*.
//
//   GET    {base}/month?year=&month=   -> dashboard (see data/dashboard shape)
//   POST   {base}/expenses            body { date, time?, amount, category,
//                                            subscription_id?, note? } -> created
//   PUT    {base}/expenses/{id}       same body -> updated
//   DELETE {base}/expenses/{id}       -> 204
//
// localStorage caches the last successful dashboard per month and is returned
// (flagged `_stale`) when a fetch fails — the offline fallback.
// ============================================================

const env = import.meta.env
const BASE = (env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
const TIMEOUT = parseInt(env.VITE_API_TIMEOUT, 10) || 10000

// ---------- offline cache ----------
function cacheKey(year, month) { return 'amplop-dash-' + year + '-' + String(month).padStart(2, '0') }
function readCache(year, month) {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey(year, month))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function writeCache(year, month, data) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(cacheKey(year, month), JSON.stringify(data))
  } catch { /* ignore quota/availability */ }
}

// ---------- fetch helpers ----------
function friendly(err) {
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return new Error('Waktu permintaan habis — coba lagi.')
  }
  if (err && /Failed to fetch|NetworkError/i.test(String(err.message))) {
    return new Error('Tidak dapat terhubung ke server.')
  }
  return err instanceof Error ? err : new Error('Terjadi kesalahan jaringan.')
}
async function asError(res) {
  let msg = 'HTTP ' + res.status
  try { const body = await res.json(); if (body && body.error) msg = body.error } catch { /* no JSON body */ }
  const e = new Error(msg)
  e.status = res.status
  return e
}
async function getJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw await asError(res)
  return res.json()
}
async function sendJSON(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw await asError(res)
  if (res.status === 204) return null
  return res.json().catch(() => null)
}

// ---------- public API ----------

/** Month dashboard. Falls back to the cached copy (flagged `_stale`) on failure. */
export async function getMonth(year, month) {
  try {
    const data = await getJSON(BASE + '/month?year=' + year + '&month=' + month)
    writeCache(year, month, data)
    return data
  } catch (err) {
    const cached = readCache(year, month)
    if (cached) return { ...cached, _stale: true }
    throw friendly(err)
  }
}

export async function addExpense(body) {
  try { return await sendJSON(BASE + '/expenses', 'POST', body) } catch (err) { throw friendly(err) }
}

export async function updateExpense(id, body) {
  try { return await sendJSON(BASE + '/expenses/' + encodeURIComponent(id), 'PUT', body) } catch (err) { throw friendly(err) }
}

export async function deleteExpense(id) {
  try { return await sendJSON(BASE + '/expenses/' + encodeURIComponent(id), 'DELETE') } catch (err) { throw friendly(err) }
}
