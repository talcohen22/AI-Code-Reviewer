# Prioritized Backlog

Format:
- `- [ ] <title>`
- `- [ ] <title> | figma:<url>`   optional design reference
- `- [ ] <title> | stack:full`    opts the task into the backend stage

Tasks are **frontend-only by default** — `dev-loop.js` runs frontend + qa and skips the
backend agent unless a task is marked `stack:full` or a `backend/` directory exists.
See `.doc/product-definition.md` for the acceptance criteria QA checks against.

Current queue:
- [ ] profile page | figma:https://www.figma.com/design/n16ZPecWb35xpvNomre6zu/Instagram-UI-Screens--Community-?node-id=0-2662&m=dev

- [ ] post detail view with comments
- [ ] explore / search users by username
- [ ] followers and following list on profile




## DONE
- [x] Pixel perfect the visual design | figma:https://www.figma.com/design/n16ZPecWb35xpvNomre6zu/Instagram-UI-Screens--Community-?node-id=0-1646&m=dev
- [x] feed, profile, notifications and auth views (see .plan/001-2026-07-01-instagram-clone.md)


