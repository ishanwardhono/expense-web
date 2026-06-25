// ============================================================
// v2 Amplop — data API layer (Phase 2).
//
// The real backend (separate Cloud Run services, not in this repo) does not yet
// expose the v2 contract, so this module ships TWO adapters selected by env:
//
//   - mock  (default, when VITE_GET_MONTH_URL is unset): served from the
//           localStorage store (data/store.js), seeded on first run. Lets the
//           frontend run end-to-end offline.
//   - real  (when the v2 URLs are configured): fetch() with a timeout, and the
//           localStorage store kept as an offline cache (returned, flagged
//           `_stale`, when a request fails after we've cached at least once).
//
// CONTRACT the backend must implement (so the real adapter just works):
//
//   GET  {VITE_GET_MONTH_URL}?month=YYYY-MM
//        -> { expenses: Expense[], subs: Subscription[],
//             config: { monthly, shopWeekly, weekendBudget } }
//        IMPORTANT: `expenses` must be the PADDED window (±7 days) around the
//        month, not just date-string matches — the envelope weeks/weekends
//        cross month boundaries (see lib/dates.monthWindow).
//   POST {VITE_ADD_EXPENSE_URL}      body: Expense (no id)   -> created Expense
//   PUT  {VITE_UPDATE_EXPENSE_URL}   body: Expense (with id) -> updated Expense
//   DELETE-style POST {VITE_DELETE_EXPENSE_URL} body: { id } -> { id }
//   POST {VITE_SET_SUB_PAYMENT_URL}  body: { subId, paid: {date,amount}|null }
//        -> updated Subscription
//
// Auth: unauthenticated, matching today's public endpoints (auth is out of
// scope per plan §13).
// ============================================================

import { loadStore, saveStore } from './store.js'
import { budgetConfig } from '../lib/config.js'
import { monthWindow, monthPrefixOf } from '../lib/dates.js'

const env = import.meta.env
const TIMEOUT = parseInt(env.VITE_API_TIMEOUT, 10) || 10000
const URLS = {
  month: env.VITE_GET_MONTH_URL,
  addExpense: env.VITE_ADD_EXPENSE_URL,
  updateExpense: env.VITE_UPDATE_EXPENSE_URL,
  deleteExpense: env.VITE_DELETE_EXPENSE_URL,
  setSubPayment: env.VITE_SET_SUB_PAYMENT_URL,
}

/** True when no real endpoint is configured — run entirely on the mock. */
export const USE_MOCK = !URLS.month

// ---------- Local store (mock DB in mock mode; offline cache in real mode) ----------
let _db = null
let _hasCache = false
let _seq = 0

function db() {
  if (!_db) {
    const s = loadStore()
    _db = { expenses: s.expenses.slice(), subs: s.subs.slice(), config: s.config || budgetConfig() }
  }
  return _db
}
function persist() { saveStore(_db) }
function genId() { return 'e' + Date.now() + '-' + (_seq++) }

/** Reset in-memory state. Test hook only. */
export function _resetLocal() { _db = null; _hasCache = false; _seq = 0 }

function windowView(y, m) {
  const { fromKey, toKey } = monthWindow(y, m)
  const d = db()
  return {
    expenses: d.expenses.filter((e) => e.date >= fromKey && e.date <= toKey),
    subs: d.subs.map((s) => ({ ...s })),
    config: { ...d.config },
  }
}

function applyAdd(e) {
  const created = { ...e, id: e.id || genId() }
  db().expenses.push(created)
  persist()
  return created
}
function applyUpdate(e) {
  const d = db()
  d.expenses = d.expenses.map((x) => (x.id === e.id ? { ...e } : x))
  persist()
  return e
}
function applyDelete(id) {
  const d = db()
  d.expenses = d.expenses.filter((x) => x.id !== id)
  persist()
  return { id }
}
function applySetSubPayment(subId, paid) {
  const d = db()
  d.subs = d.subs.map((s) => (s.id === subId ? { ...s, paid } : s))
  persist()
  return d.subs.find((s) => s.id === subId)
}

// ---------- Real-adapter helpers ----------
function friendly(err) {
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return new Error('Waktu permintaan habis — coba lagi.')
  }
  if (err && /Failed to fetch/i.test(String(err.message))) {
    return new Error('Tidak dapat terhubung ke server.')
  }
  return err instanceof Error ? err : new Error('Terjadi kesalahan jaringan.')
}
async function getJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}
async function sendJSON(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json().catch(() => ({}))
}
function normalizeMonth(data) {
  return {
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    subs: Array.isArray(data.subs) ? data.subs : [],
    config: data.config || budgetConfig(),
  }
}
function cacheMonth(y, m, data) {
  const { fromKey, toKey } = monthWindow(y, m)
  const d = db()
  d.expenses = d.expenses.filter((e) => e.date < fromKey || e.date > toKey).concat(data.expenses || [])
  if (Array.isArray(data.subs)) d.subs = data.subs
  if (data.config) d.config = data.config
  persist()
  _hasCache = true
}

// ---------- Public API ----------

/** Load a month's data (padded window + subs + budget config). */
export async function getMonth(y, m) {
  if (USE_MOCK) return windowView(y, m)
  const sep = URLS.month.includes('?') ? '&' : '?'
  try {
    const data = normalizeMonth(await getJSON(URLS.month + sep + 'month=' + monthPrefixOf(y, m)))
    cacheMonth(y, m, data)
    return data
  } catch (err) {
    if (_hasCache) return { ...windowView(y, m), _stale: true }
    throw friendly(err)
  }
}

export async function addExpense(e) {
  if (USE_MOCK) return applyAdd(e)
  const { id, ...body } = e // eslint-disable-line no-unused-vars
  try { return await sendJSON(URLS.addExpense, 'POST', body) } catch (err) { throw friendly(err) }
}

export async function updateExpense(e) {
  if (USE_MOCK) return applyUpdate(e)
  try { return await sendJSON(URLS.updateExpense, 'PUT', e) } catch (err) { throw friendly(err) }
}

export async function deleteExpense(id) {
  if (USE_MOCK) return applyDelete(id)
  try { return await sendJSON(URLS.deleteExpense, 'POST', { id }) } catch (err) { throw friendly(err) }
}

export async function setSubPayment(subId, paid) {
  if (USE_MOCK) return applySetSubPayment(subId, paid)
  try { return await sendJSON(URLS.setSubPayment, 'POST', { subId, paid }) } catch (err) { throw friendly(err) }
}
