# Submission

## Links

| What                       | Where                                                  |
| -------------------------- | ------------------------------------------------------ |
| Live app                   | _LIVE_URL_                                             |
| Backend API (health check) | _API_URL_/api/health                                   |
| Frontend source            | https://github.com/PKSharma96/Ajaia-Assignment         |
| Backend source             | https://github.com/PKSharma96/Ajaia-assignment-backend |
| Walkthrough video          | See `VIDEO_URL.txt`                                    |

## Test accounts

No passwords. Pick an account on the login page.

- **alice@ajaia.dev**: owns "Welcome to Ajaia Docs", shared with Bob as editor
- **bob@ajaia.dev**: owns "Q4 Planning Notes", shared with Alice as viewer
- **carol@ajaia.dev**: no documents, so you can test sharing from scratch

Use two browsers (or a private window) to be signed in as two users at once. The free backend may take up to a minute to wake up on the first visit.

## What is included

| Item                                         | File / location                                                     |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Frontend source code                         | this repo: `src/`, `tests/`, `e2e/`                                 |
| Backend source code                          | backend repo: `src/`, `prisma/`, `tests/`                           |
| README with local setup and run instructions | `README.md` (both repos)                                            |
| Architecture note                            | `ARCHITECTURE.md`                                                   |
| AI workflow note                             | `AI_WORKFLOW.md`                                                    |
| This file                                    | `SUBMISSION.md`                                                     |
| Walkthrough video URL                        | `VIDEO_URL.txt`                                                     |
| Screenshots                                  | `docs/screenshots/`                                                 |
| Sample import files (.txt, .md, .docx)       | `samples/`                                                          |
| Automated tests                              | 95 backend tests, 50 frontend tests, 11 Playwright end-to-end tests |
| Deployment config                            | `next.config.mjs` (API proxy), backend `render.yaml`                |

## Status

**Working end to end:**

- Create, rename, edit, autosave, reopen and delete documents
- Rich text: bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo
- Import .txt, .md and .docx files (up to 2 MB) as new documents
- Sharing by email with editor or viewer roles; changing and revoking access; owned vs shared dashboard
- Persistence in Postgres, with formatting preserved
- Detection of conflicting saves, with a reload prompt
- Validation and friendly error messages throughout

**Intentionally not built:** real-time co-editing, real authentication, comments, version history, export. The reasons are in `ARCHITECTURE.md`.

**Next, with 2–4 more hours:** real-time co-editing with Yjs, version history with restore, export to Markdown or PDF, then real authentication with invitations.
