# Prioritized Backlog

Format:
- `- [ ] <title>`
- `- [ ] <title> | figma:<url>`   optional design reference
- `- [ ] <title> | stack:full`    opts the task into the backend stage

Tasks are **frontend-only by default** — `dev-loop.js` runs frontend + qa and skips the
backend agent unless a task is marked `stack:full` or a `backend/` directory exists.
See `.doc/product-definition.md` for the acceptance criteria QA checks against.

Current queue:
- [ ] auth views and simulated session (signup / login / logout)
- [ ] code submission view with Monaco editor and mock review pipeline
- [ ] review results view (Style / Bugs / Security / Refactor Suggestions / Generated Tests)
- [ ] severity filtering on review results
- [ ] quality dashboard with review history




## DONE
