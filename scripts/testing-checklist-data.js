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
  {
    phase: 'Phase 14 — Full-Project Pre-Handover Checklist',
    intro:
      'The comprehensive, final physical-testing pass — every feature in the app, in one place, meant to be ' +
      'worked through start to finish before handover. Everything server-side behind these features (grading, ' +
      'validation, ownership, security) was already proven through direct API testing in earlier phases; this ' +
      'list is specifically about what only a person holding the actual phone, looking at the actual screen, ' +
      'and listening to actual audio can confirm. The mobile app should be tested against the deployed ' +
      'production API (mobile/.env’s EXPO_PUBLIC_API_URL), not localhost, so this pass also doubles as final ' +
      'production verification.',
    groups: [
      {
        label: 'Registration & Login',
        items: [
          {
            title: 'Full two-step sign-up on-device.',
            body:
              'Step 1: first/middle/last name, age, mobile number (with the "a grown-up can help" note). Step ' +
              '2: favourite colour, favourite animal, hobbies, password + confirm with live match validation. ' +
              'Confirm a valid age (5–12) completes registration and lands on Home.',
          },
          {
            title: 'Age Too High screen.',
            body:
              'Register with an age above 12 and confirm the smiley asset renders (not a placeholder or ' +
              'broken image), with the exact "Oops, the age is too high" wording and the "Change My Age" ' +
              'button.',
          },
          {
            title: 'Login screen.',
            body: 'First name + password, matching the client’s exact requirement. Confirm a wrong password shows a clear, friendly error, not a technical one.',
          },
          {
            title: 'Duplicate first names, from the actual UI.',
            body:
              'Register two students sharing a first name, then log in as the second one and confirm the app ' +
              'lands on the right account’s Home screen — the API-level version of this was already ' +
              'proven, this confirms the mobile UI wires it correctly too.',
          },
        ],
      },
      {
        label: 'Home Screen',
        items: [
          {
            title: 'Start Quiz state.',
            body: 'A student with no in-progress attempt sees "Start Quiz" plus the Stars Earned / Quizzes Completed stat cards.',
          },
          {
            title: 'Continue Quiz state.',
            body:
              'A student with an in-progress attempt sees the "Welcome back" greeting, a SAVED badge with the ' +
              'correct question position, a Continue Quiz button, and a "Start a New Quiz" fallback.',
          },
          {
            title: 'Last Result card and Quiz History.',
            body:
              'Confirm the Last Result card shows the most recent finished attempt, and tapping "View All ' +
              'Results" opens the Quiz History screen with correct ordering (most recent first) and finished ' +
              'vs. abandoned attempts visually distinguishable.',
          },
        ],
      },
      {
        label: 'Quiz Engine (on-device)',
        items: [
          {
            title: 'Question display and countdown.',
            body: 'Four tappable options, a visible timer actually ticking down in real time, and the question counter (e.g. "Question 4 / 9").',
          },
          {
            title: 'Timer expiry.',
            body:
              'Let a question’s timer hit 0 and confirm the "TIME’S UP" screen appears with only "Start ' +
              'a New Quiz" offered, not a Continue Quiz option for an attempt that can no longer be answered.',
          },
          {
            title: 'Correct-answer feedback.',
            body: 'The star asset (not an emoji) with the "Well done!" full-screen lime state and a Next Question button.',
          },
          {
            title: 'Wrong-answer feedback.',
            body:
              'The orange "Whoops! That is the wrong answer, let’s try again." banner, staying on the same ' +
              'question, with unlimited retries.',
          },
          {
            title: 'Close and reopen mid-quiz.',
            body: 'Force-quit or background the app partway through a quiz, reopen it, and confirm Continue Quiz resumes at the correct question with prior progress intact.',
          },
        ],
      },
      {
        label: 'Completion & Audio',
        items: [
          {
            title: 'Above-70% result screen.',
            body: 'Score/percentage displayed, and the cheers/claps audio actually audible through the device speaker.',
          },
          {
            title: 'At-or-below-70% result screen.',
            body: 'The "Good try, [First Name]. Play again for more stars." message, same layout, and confirm no audio plays.',
          },
          {
            title: 'Play Again always starts fresh.',
            body: 'Confirm it never resumes a stale, unrelated in-progress attempt instead of starting a new one (this was a real bug fixed earlier in the project — worth re-confirming here).',
          },
        ],
      },
      {
        label: 'System States',
        items: [
          {
            title: 'Loading and empty states.',
            body: 'A brief loading skeleton on slower screens, and the "No questions for this age" empty state if an age band has no active questions.',
          },
          {
            title: 'Network loss mid-quiz.',
            body:
              'Turn off Wi-Fi/data while a quiz is in progress and confirm the "We lost the internet — your ' +
              'quiz is saved" state appears with a Try Again button, then confirm it recovers cleanly once ' +
              'connectivity returns.',
          },
        ],
      },
      {
        label: 'Admin Dashboard (browser)',
        items: [
          {
            title: 'Login and session.',
            body: 'Log in with the production admin credentials and confirm the session persists across page navigation (the SameSite cookie fix from this phase).',
          },
          {
            title: 'All four tabs plus Settings.',
            body:
              'Overview (stats + age-band chart), Questions (add/edit/deactivate/delete — including the ' +
              'native browser confirm() dialog on delete), Students (confirm no contact/password data shown), ' +
              'Attempts (filters), and Settings (change password, then log out and back in with the new one).',
          },
          {
            title: 'Your own screen size.',
            body: 'A glance at actual monitor resolution rather than the fixed viewport this session tested at.',
          },
        ],
      },
      {
        label: 'Production & Cross-Cutting',
        items: [
          {
            title: 'Mobile app against the live API.',
            body: 'With EXPO_PUBLIC_API_URL pointed at the deployed Render API, confirm the phone doesn’t need to be on the same Wi-Fi as any particular computer anymore — that’s the actual point of Phase 14.',
          },
          {
            title: 'Custom assets at real, on-device sizes.',
            body: 'The star, the age-error smiley, and the logo all render crisply (not clipped, stretched, or showing as a broken-image icon) at their actual display sizes, not just in a browser preview.',
          },
        ],
      },
    ],
    closing:
      'None architecturally — this list exists to catch UI/UX and asset-rendering issues that no amount of API ' +
      'testing can surface, plus to serve as the final sign-off pass before handover. Anything that fails here ' +
      'should be fixed and re-checked, not silently carried into handover.',
  },
];
