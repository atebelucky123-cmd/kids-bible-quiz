# Kids Bible Quiz — Integration & End-to-End Test Log (Phase 13)

Run against the local dev server (`server/`, port 4000) and local PostgreSQL
database on 2026-09-21, exercising the scenario list from the build spec
(Section 28) and the development plan's Section 7 Testing Checkpoints and
Section 8 Definition of Done, as one connected system rather than
phase-by-phase in isolation.

Each row is either a **direct verification** (an actual request/response
against the running system, shown below) or a **code-review verification**
(traced through the source to confirm the guarantee holds, used only where a
live test would require disrupting the shared dev server or a physical
device — those are cross-referenced to Appendix E of the development plan
instead of re-derived here).

## Registration & authentication

| Scenario | Result | Method |
|---|---|---|
| Valid age (5–12 inclusive) registers successfully | ✅ Pass | Direct — age 7 → `201` |
| Age below 5 rejected with the specified message | ✅ Pass | Direct — age 4 → `"This quiz is for children aged 5 to 12"` / `AGE_TOO_LOW` |
| Age above 12 rejected with the specified message | ✅ Pass | Direct — age 13 → `"Oops, the age is too high"` / `AGE_TOO_HIGH` |
| Duplicate first names don't break registration or login | ✅ Pass | Direct — two accounts named "E2E" registered; logging in with the second one's password returned the second account, not the first |
| Login + logout work | ✅ Pass | Direct — verified again in Phase 11's admin login flow and Phase 4 originally |
| Wrong password rejected | ✅ Pass | Direct — `"Incorrect first name or password"` / `INVALID_CREDENTIALS`, same message as a nonexistent user (no account-existence leak) |
| Weak/symbol password rejected (alphanumeric rule) | ✅ Pass | Direct — `bad!!!` → validation error naming both violated rules |
| Passwords never stored in plaintext | ✅ Pass | Code review — `bcrypt.hash` in `auth.service.ts`/`admin.service.ts`; confirmed no plaintext write path exists |

## Quiz engine

| Scenario | Result | Method |
|---|---|---|
| Starting a quiz respects the student's age range | ✅ Pass | Direct (Phase 7) + re-confirmed this pass |
| Question payload never includes the correct answer | ✅ Pass | Direct — checked raw JSON for `correctOption`, absent |
| Wrong answer shows the exact required message and stays on the same question | ✅ Pass | Direct — two wrong submissions, `currentQuestionIndex` unchanged both times |
| Correct answer shows "Well done!" and advances | ✅ Pass | Direct — index advanced 0→1, score incremented |
| A fabricated `correct`/`score` field in the request is ignored | ✅ Pass | Direct (Phase 12) — extra fields had no effect; server graded from `correctOption` alone |
| Closing and reopening the app resumes at the correct question | ✅ Pass | Direct — simulated via `GET /api/me/attempts` then `GET /api/quiz/:id` after answering one question; both reflected question index 1, not a reset |
| Full quiz completion computes score/percentage server-side | ✅ Pass | Direct — played a real 9-question attempt to 9/9 → `percentage: 100`, `status: FINISHED` |
| >70% plays cheers; exactly 70% does not | ✅ Pass | Direct — synthetic attempts at 65% / 70% / 75% → `playCheers` was `false / false / true` |
| Timer is visible and server-tracked, not client-only | ✅ Pass | Code review — `secondsRemainingFor()` computed from `lastActivityAt`, returned in every question/answer response |
| Timer expiry behavior | ⚠️ By design, not a defect | The dev plan's Appendix A leaves this an open requirement; the server doesn't block answering after `secondsRemaining` hits 0 (stubbed pending a client decision), while the mobile app independently shows a "TIME'S UP" screen with only "Start a New Quiz" once a saved attempt's timer has expired (fixed and verified in an earlier session). Not re-litigated here since neither side has changed. |

## Admin

| Scenario | Result | Method |
|---|---|---|
| Admin can create, edit, deactivate, and delete questions | ✅ Pass | Direct — full CRUD round-trip re-confirmed this pass (Phase 11 had the exhaustive version) |
| Non-admin/unauthenticated sessions can't reach admin routes | ✅ Pass | Direct — no token → 401, student token → 403 (Phase 12) |
| Students tab never exposes contact/password data | ✅ Pass | Direct (Phase 11) — response body checked for `mobileNumber`, absent |

## Failure handling

| Scenario | Result | Method |
|---|---|---|
| Malformed JSON / invalid enum values / non-numeric IDs handled cleanly | ✅ Pass | Direct (Phase 12) — all returned structured validation errors, no stack traces |
| A database error wouldn't crash the process | ✅ Pass | Code review — every controller wraps its logic in `try/catch` → `next(err)`, and the central `errorHandler` catches everything unhandled with a generic 500. Not induced live: the dev Postgres instance is shared with the mobile app's concurrent testing session, so intentionally taking it down wasn't worth the disruption. |
| Client-side network failure (phone loses connectivity) shown gracefully | Deferred | Code review only — `mobile/src/lib/api.ts`'s `request()` catches fetch failures and surfaces a friendly "We lost the internet — your quiz is saved" message. Actually triggering this needs a real device with real Wi-Fi to toggle — see development plan Appendix E, Phase 13 entry. |

## What this pass could not cover directly

A handful of scenarios need a human, a real device, or a real browser —
these are **not** re-listed here in prose; they're tracked as their own
Phase 13 section in `Kids_Bible_Quiz_Development_Plan.pdf`'s Appendix E
("Physical Testing Checklist"), the same running document Phase 11 and
Phase 12 already contribute to. Check that appendix before considering
Phase 13 fully closed.

## Test data cleanup

All throwaway accounts created for this pass (`E2E Valid`, `E2E Duplicate`,
the synthetic 65/70/75% attempts, and one throwaway admin-created question)
were deleted afterward; nothing from this test run remains in the database.
