// Source of truth for Appendix E (Physical Testing Checklist) in
// Kids_Bible_Quiz_Development_Plan.pdf. Add one entry per completed phase,
// then run `node scripts/build-testing-checklist.js` to regenerate the
// appendix pages. Keep entries even when a phase needs no physical testing —
// an explicit "none needed, here's why" is the record that it was
// considered, not silently skipped.

module.exports = [
  {
    phase: 'Phase 11 — Admin Dashboard',
    intro:
      'Phase 11 was verified end-to-end in an automated browser session — login, all four tabs, question ' +
      'CRUD, search/filters, and the full password-change-then-relogin cycle all confirmed working directly ' +
      'against the running API. A handful of items need a real browser, a human, or the actual mobile app to ' +
      'confirm, since a scripted session cannot exercise them.',
    items: [
      {
        title: 'Delete confirmation dialog.',
        body:
          'The automated testing session runs in a browser that auto-dismisses native JavaScript dialogs, so ' +
          'Questions > Delete was exercised but its "OK" path was never actually clicked. Confirm the ' +
          'browser’s native confirm() box appears with the question text, Cancel leaves the question ' +
          'untouched, and OK deletes it.',
      },
      {
        title: 'Change the seeded admin’s placeholder password.',
        body:
          'Log in with the placeholder credentials, go to Settings, set a real password, then confirm the ' +
          'placeholder no longer works and the new password does.',
      },
      {
        title: 'Question CRUD reaches the real mobile app.',
        body:
          'Add a question via the admin dashboard and confirm a new quiz on the actual phone offers it ' +
          '(within its age range); deactivate a question and confirm a new quiz stops offering it. This is the ' +
          'one Phase 11 check the development plan calls out explicitly ("question CRUD round-trips to the ' +
          'same table the mobile app reads from"), and it requires both apps running for real.',
      },
      {
        title: 'Dashboard at your own screen size.',
        body:
          'Automated testing only checked a fixed 1024×768 viewport — confirm the layout still reads ' +
          'well at your actual monitor resolution.',
      },
      {
        title: 'Cross-device access (informational, not a defect).',
        body:
          'CORS_ORIGIN currently only allows localhost:5173, so opening the dashboard from a phone or another ' +
          'computer on the network will fail until Phase 14’s deployment widens it. Expected for now — ' +
          'nothing to fix.',
      },
    ],
    closing:
      'None architecturally — these are verification gaps left by automated testing (a scripted browser ' +
      'session suppresses native dialogs, and there is no way to drive the physical mobile app from that same ' +
      'session), not known defects.',
  },
  {
    phase: 'Phase 12 — Security Hardening & Validation',
    intro:
      'Every item in the spec’s security checklist (Section 20) was actively tested against the running ' +
      'server — not assumed from the code — with direct API requests: password hashing, both client- and ' +
      'server-side registration/age validation, correct-answer non-exposure, rejection of fabricated ' +
      'correctness/score fields, cross-student ownership checks, admin-route authorization (unauthenticated, ' +
      'invalid token, and wrong-role cases), .env hygiene, and input sanitization against malformed JSON, ' +
      'invalid enum values, and non-numeric IDs. One real (if dormant) issue was found and fixed: the CORS ' +
      'fallback allowed any origin with credentials when CORS_ORIGIN was unset — now it falls back to the ' +
      'same explicit dev origins .env.example documents instead. HTTPS in production is deferred to Phase 14 ' +
      '(Render and Neon both provide it by default; not testable against localhost).',
    items: [],
    closing:
      'None — every check in this phase is verifiable through direct API requests, all of which were run ' +
      'and confirmed during implementation. No human, real browser, or physical device is needed here.',
  },
  {
    phase: 'Phase 13 — Integration & End-to-End Testing',
    intro:
      'The full scenario matrix (see TESTING.md at the repo root) was run against the live API — registration ' +
      'and its age/duplicate-name/wrong-password edge cases, the complete quiz engine flow including the ' +
      'wrong-answer retry, a real 9-question attempt played to 100%, the exact >70% cheers boundary tested at ' +
      '65/70/75%, close-and-reopen persistence, and admin CRUD with unauthorized-access rejection. What a ' +
      'scripted API session cannot confirm is whether those same guarantees hold when a person is actually ' +
      'looking at the screen and holding the phone.',
    items: [
      {
        title: 'Full student walkthrough on a real device.',
        body:
          'Register, land on Home, start a quiz, answer a question wrong then correctly, and reach the result ' +
          'screen. The API responses for each step were verified directly, but rendering, navigation, and ' +
          'wording on the actual screen were not.',
      },
      {
        title: 'Timer expiry UX on-device.',
        body:
          'Let a question’s countdown reach 0 and confirm the "TIME’S UP" screen appears with only ' +
          '"Start a New Quiz" offered — not "Continue Quiz" for an attempt whose current question can no ' +
          'longer be answered. (Fixed and verified in an earlier session; re-check only if the timer code has ' +
          'changed since.)',
      },
      {
        title: 'Cheers/claps audio is actually audible.',
        body:
          'Complete a real quiz above 70% and confirm the cheers/claps sound plays through the device speaker; ' +
          'complete one at or below 70% and confirm it stays silent. The >70% boundary logic itself was tested ' +
          'precisely (65/70/75% synthetic attempts), but audio playback can only be confirmed on a real device.',
      },
      {
        title: 'Close and reopen the physical app mid-quiz.',
        body:
          'Force-quit or background the app partway through a quiz, then reopen it and tap Continue Quiz. The ' +
          'server-side persistence was confirmed via direct API calls simulating this, but the actual app needs ' +
          'to be closed and reopened by hand to confirm the UI itself resumes correctly.',
      },
      {
        title: 'Network loss mid-quiz.',
        body:
          'Turn off Wi-Fi on the phone while a quiz is in progress and confirm the "We lost the internet — ' +
          'your quiz is saved" state appears, then confirm the quiz resumes cleanly once connectivity returns. ' +
          'Cannot be simulated from this session.',
      },
    ],
    closing:
      'None architecturally — these are the physical-device counterparts to scenarios already confirmed at the ' +
      'API level; nothing here is expected to fail unless a mobile-side regression has been introduced ' +
      'separately.',
  },
];
