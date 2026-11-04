# Submission

## Links

| What                       | Where                                                         |
| -------------------------- | ------------------------------------------------------------- |
| Live app                   | https://ajaia-green.vercel.app                                |
| Backend API (health check) | https://ajaia-assignment-backend-o0mu.onrender.com/api/health |
| Frontend source            | https://github.com/PKSharma96/Ajaia-Assignment                |
| Backend source             | https://github.com/PKSharma96/Ajaia-assignment-backend        |
| Walkthrough video          | See `VIDEO_URL.txt`                                           |

## Test accounts

No passwords. Pick an account on the login page.

- **alice@ajaia.dev**: owns "Welcome to Ajaia Docs", shared with Bob as editor
- **bob@ajaia.dev**: owns "Q4 Planning Notes", shared with Alice as viewer
- **carol@ajaia.dev**: no documents, so you can test sharing from scratch

Use two browsers (or a private window) to be signed in as two users at once. The free backend may take up to a minute to wake up on the first visit.

## What is included

| Item                                              | Google Drive folder                | GitHub                                   |
| ------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| Frontend source code (Next.js)                    | `source/ajaia-docs-frontend.zip`   | Ajaia-Assignment                         |
| Backend source code (Express + Prisma)            | `source/ajaia-docs-backend.zip`    | Ajaia-assignment-backend                 |
| README with local setup and run instructions      | `README.md`                        | `README.md` in both repos                |
| Architecture note                                 | `ARCHITECTURE.md`                  | frontend repo                            |
| AI workflow note                                  | `AI_WORKFLOW.md`                   | frontend repo                            |
| This file                                         | `SUBMISSION.md`                    | frontend repo                            |
| Live product URL                                  | `LIVE_URL.txt` and the table above | README                                   |
| Walkthrough video URL                             | `VIDEO_URL.txt`                    | frontend repo                            |
| Screenshots                                       | `screenshots/`                     | frontend repo, `docs/screenshots/`       |
| Sample files to test import (.txt, .md, .docx)    | `samples/`                         | frontend repo, `samples/`                |
| Automated tests (95 backend, 50 frontend, 11 E2E) | inside the source zips             | `tests/` and `e2e/`                      |
| Deployment config                                 | inside the source zips             | `next.config.mjs`, backend `render.yaml` |

**Deployment:** the frontend runs on Vercel, the API on Render (free tier, Singapore), and the database on Neon Postgres (Singapore). All 11 Playwright end-to-end tests pass against the live URL (`E2E_BASE_URL=https://ajaia-green.vercel.app npm run test:e2e`).

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
