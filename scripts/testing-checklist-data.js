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
];
