# Review — PR #13 `docs/expand-phase-4-settings`

Documentation-only change to `docs/v2-amplop-redesign-plan.md` §8 (Phase 4).
Reviewed for internal consistency + factual accuracy only (no code → no
correctness/security/test criteria).

## Checks performed
- Backend endpoints in Phase 4 (`GET/PUT /budget`, `GET/POST/PUT/DELETE
  /subscriptions`, payment = `Langganan` expense once/month → 409, derived
  paid status) — match the stated real backend. ACCURATE.
- `settings.html` separate Vite-entry claim — matches `vite.config.js`
  rollup inputs (`index.html`, `v2.html` both present + configured). ACCURATE.
- Phase 4 internal consistency: paid status stated consistently as **derived
  server-side**; no "both stored and derived" contradiction. CONSISTENT.
- Phase 4 vs §4 gap table (line 150 `subscriptionId`, line 152 "derived paid
  status") and Phase 3 (line 337-344, backend resolved server-side): ALIGNED.
  Phase 4 follows the authoritative post-Phase-3 backend reality.

## Blocking
(none)

## Resolved
(none)

## Non-blocking (nits)
- nit: Budget-config field casing drift — §5.2 (line 197) / §7.4 (line 294)
  use `shopWeekly` / `weekendBudget`; Phase 4 (line 363) uses `shop_weekly` /
  `weekend_budget`. Same payload, different casing. Pick one across the doc.
- nit: `subscriptionId` (§4 line 150, §7.1 line 260) vs `subscription_id`
  (Phase 4 line 374) casing drift.
- nit: Prototype sections §2.2 (line 91-98) and §7.3 (line 286-290) still
  assert paid is **stored, not derived** and "no manual `Langganan` category."
  Phase 4 (correctly, per the real backend) reverses both. This contradiction
  is **pre-existing** (already present between §2.2 and the §4 gap table /
  Phase 3 before this PR) and not introduced by this PR; the doc flags the
  prototype-vs-backend layering at line 321-322 / 339. Worth a follow-up pass
  to mark §2.2/§7.3 as superseded by the server-side backend, but out of scope
  for this PR.
