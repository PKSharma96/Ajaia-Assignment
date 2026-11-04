# AI Workflow Note

## Tools used

- **Cursor (agent mode)** for planning, scaffolding, writing code and tests, running commands, and reviewing screenshots.
- **The AI as a reviewer of its own output:** after each step I had it run the type checker, the linter, the tests and `npm audit`, and act on the results rather than assume the code was right.

## Where AI materially sped things up

- **Planning:** turning the open-ended brief into a scoped plan with explicit cuts (no real-time editing, mocked auth), a data model and an endpoint list in a few minutes.
- **Boilerplate:** the Express app factory, Prisma schema and seed, zod schemas, the Next.js pages and Tailwind styling.
- **Tests:** writing many edge cases quickly. These include every role against every action, upload limits, a malformed JSON body, an oversized body, a corrupt .docx, a non-ASCII filename and conflicting saves. The AI was especially useful for generating a _real_ .docx file inside a test with the `docx` library, instead of committing a binary fixture.
- **End-to-end tests and screenshots:** Playwright tests that drive two browsers at once (Alice and Bob) and save the README screenshots as a side effect.

## What I changed or rejected

- **The architecture changed mid-plan.** The first plan used Next.js API routes. I chose a separate Express backend instead, to show a clear frontend/backend boundary, and kept the browser on one origin with a rewrite proxy so cookies stay simple.
- **Rejected Next.js 14.** It was the first choice, but `npm audit` showed a _critical_ advisory only fixed in Next 16, so I moved to Next 16 and React 19 before writing any UI code.
- **Rejected Vitest 5.** It requires Node 22, while the target is Node 20. I used Vitest 4.1.12, which has the security fixes.
- **Rejected the Tailwind Typography plugin.** It pulls in a vulnerable selector parser, and about 40 lines of my own editor CSS do the job.
- **Removed rate limiting on login.** Behind the Vercel proxy, all users would share a few IP addresses, so one limiter would throttle every reviewer at once, and there are no passwords to brute-force anyway.
- **Kept Prisma 6 instead of upgrading.** The update notice pushed a major-version release candidate. I didn't take breaking changes during a timebox.
- **Fixed tests that passed for the wrong reason or failed for the wrong reason:**
  - The first toolbar test selected _all_ content, which also selected an empty trailing paragraph, so "is this a heading?" was correctly false. I changed the test to select the words, like a real user does.
  - E2E selectors matched Next.js's hidden route-announcer element as an "alert". I added a helper that ignores empty alerts.
- **Caught a misleading verification run.** To check the tests can fail, I broke the access rules on purpose. The first run "passed" because the break and the revert had been issued in parallel, so the code was already restored when the tests ran. I re-ran the check step by step. Three tests then failed as expected, and breaking the version check made the conflict test fail.

## How I verified correctness, UX and reliability

- **Automated:**
  - 95 backend tests (unit, plus API tests against a real Postgres)
  - 32 frontend tests
  - 9 Playwright end-to-end tests in real Chrome
  - type checking, ESLint and Prettier on both repos
- **Mutation checks:** I broke key rules on purpose (editor allowed to share, version check removed) and confirmed the right tests failed.
- **Production simulation:** I installed the API without dev dependencies (like Render does), started it with `NODE_ENV=production`, and checked the health endpoint and that the cookie was `Secure; HttpOnly; SameSite=Lax`.
- **Through the proxy:** I used curl through the Next.js rewrite to confirm that the cookie is set on the frontend's origin, that file uploads pass through, and that error responses keep their status and message.
- **Visual review:** I looked at every screenshot. That led to fixing the toolbar alignment, replacing undo/redo glyphs that rendered badly with icons, and hiding the dev-tools badge.
- **Dependency review:** I read the `npm audit` output for each repo and documented the remaining, dev-only advisories.
