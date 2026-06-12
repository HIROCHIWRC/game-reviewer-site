# Game Reviewer — Agent Guide

## Quickstart
- **Install deps:** `npm install` (root) **and** `npm install` in `server/` (separate `package.json`)
- **Frontend dev:** `npm run dev` (root, Vite, default port)
- **Backend:** `node .\server\index.js` (port 3001)
- **Both (concurrently):** `npm run start:dev`
- **Build:** `npm run build`
- **Preview build:** `npm run preview`
- **Lint:** `npm run lint`
- No tests, no TypeScript, no typecheck.

## Architecture
- **Frontend (root):** React 19 + Vite 8 + Tailwind v4 (CSS-first `@import "tailwindcss"`). PostCSS with `@tailwindcss/postcss` plugin. `tailwind.config.js` exists but Tailwind v4 ignores it.
- **Backend (server/):** Express 5, CommonJS (`"type": "commonjs"`), better-sqlite3 (WAL mode), JWT auth (bcryptjs + jsonwebtoken). DB auto-creates at `server/database.db` on first start.
- **Entrypoints:** `src/main.jsx` (frontend), `server/index.js` (backend).
- **No router library** — screen switching via `currentScreen` state in `App.jsx`.
- **Vite proxy** in `vite.config.js` routes `/covers`, `/api`, `/memes`, `/skins`, `/cases` → `localhost:3001` (dev only).
- **In production,** `server/index.js` serves `dist/` static files with SPA fallback for non-API `GET` routes.
- **Lazy-loaded screens** (React.lazy): AddGame, ViewGames, GameCard, Profile, UserProfile, Leaderboard, Casino, CaseOpening, Inventory, Chat, Admin. New screens must be added to `App.jsx`.
- **Rank system:** `src/constants/ranks.js` — 6 ranks (Серый→Радужный) by review count with level-up notification.
- **Games API `scope` param:** `?scope=my` → per-user records; `?scope=all` → aggregated by title across users.
- **Coin economy:** 2 coins for first review of a game, 1 for subsequent. Coin balance shown in header. Used for case openings.

## Project Structure
```
src/
  components/ — reusable UI (Button, Modal, FormInput, ScoreSlider, SkinBox, etc.)
  screens/    — 13 screens: Auth, Dashboard, AddGame, ViewGames, GameCard, Profile,
                UserProfile, Leaderboard, Casino, CaseOpening, Inventory, Chat, Admin
  hooks/      — useAuth, useGameStore
  api.js      — fetch wrapper, auto-attaches JWT from localStorage
  constants/  — genres, multipliers, sort/filter options, ranks
  utils/      — score calculation, Russian pluralization
server/
  routes/     — auth.js, games.js, cases.js, chat.js, admin.js
  middleware/ — auth.js (JWT verification), admin.js (checks isAdmin in JWT)
  db.js       — SQLite setup + schema + safe migrations
  public/
    memes/   — meme images + texts.txt
    covers/  — downloaded game cover images
    skins/   — case skin images by rarity subdirectories
    cases/   — case box images
```

## Scoring System
Weighted average: gameplay(x3), atmosphere(x2), story(x2), music(x1), technical(x1), impression(x1). Optional scores (atmosphere/story/music) can be toggled off (null). Calculated in `src/utils/scoreUtils.js` and duplicated server-side in `server/routes/games.js` (the `calcOverall` function — both must stay in sync).

## DB Schema & Migrations
`schema` in `server/db.js`:
- `users` — id, username, password, created_at, coins (added via migration), is_admin (added via migration)
- `games` — id (TEXT, client-generated UUID), user_id, title, genre, scores (INTEGER), score_overall, comment, saved_at, cover_url, poster_url (added via migration)
- `user_items` — id, user_id, skin_name, skin_rarity, skin_value, skin_image, case_type, opened_at, is_equipped
- Unique index `idx_games_user_title` on `games(user_id, title)` prevents duplicate reviews
- `ALTER TABLE` migrations run every startup — safe to re-run (wrapped in try/catch)
- `server/_debug.js` dumps all DB contents to console for inspection

## Key Conventions
- **Components:** named exports (`export function Foo`), one per file, in `src/components/`.
- **All API calls** go through `src/api.js` (auto-attaches JWT from localStorage).
- **CSS:** Tailwind utility classes only. `src/index.css` has only `@import "tailwindcss"` + custom keyframes (rainbow, shake) + scrollbar styles.
- **Icons:** SVG inline or emoji.
- **Game IDs:** client-generated with `crypto.randomUUID()`.
- **Form state:** managed manually in `useGameStore` (no form library).
- **Client-side validation mirrors server:** title max 100 chars, comment max 500 chars. Scores 0–10.
- **JWT secret:** hardcoded `process.env.JWT_SECRET || 'change_this_secret_in_production'`.
- **RAWG + SteamGridDB API keys** hardcoded in `server/routes/games.js`.
- **Admin promotion:** set `ADMIN_USERNAME` env var to auto-promote a user on next server start.

## Backend API
```
POST /api/auth/register          — { username, password } → also returns isAdmin
POST /api/auth/login             — { username, password } → also returns isAdmin
GET  /api/auth/profile           — Bearer token, current user profile + stats (includes isAdmin)
GET  /api/auth/profile/:name     — public profile for any user
GET  /api/games?scope=my|all     — Bearer token
GET  /api/games/titles           — existing titles for autocomplete
GET  /api/games/by-title/:t      — all reviews for a game title
GET  /api/games/fetch-cover      — ?title=... searches RAWG/SGDB/Steam/Wikipedia
POST /api/games                  — { id, title, genre, scores, comment, savedAt, coverUrl, posterUrl }
PUT  /api/games/:id              — { title, genre, scores, comment, savedAt, coverUrl, posterUrl }
DELETE /api/games/:id            — Bearer token
GET  /api/memes/texts            — meme text lines
GET  /api/memes/images           — meme image URLs
GET  /api/users/leaderboard      — users sorted by review count
GET  /api/cases/data             — case definitions with pools/drops
GET  /api/cases/inventory        — user's skin inventory
POST /api/cases/open             — { caseId } — open a case, costs coins
POST /api/cases/sell             — { itemId } — sell a skin for coins
GET  /api/admin/users            — list all users with stats (admin only)
DELETE /api/admin/users/:id      — delete user + cascade reviews/items/messages (admin only)
PUT  /api/admin/users/:id/coins  — { coins } — set coins for user (admin only)
GET  /api/admin/memes/texts      — list meme text lines (admin only)
POST /api/admin/memes/texts      — { text } — add a meme text line (admin only)
DELETE /api/admin/memes/texts/:i — delete meme text by index (admin only)
GET  /api/admin/memes/images     — list meme image URLs (admin only)
POST /api/admin/memes/images     — multipart form (image field) — upload meme image (admin only)
DELETE /api/admin/memes/images/:fn — delete meme image by filename (admin only)
GET  /api/health                 — health check
```

## Versioning
- Version label displayed at `src/App.jsx` bottom-right corner.
- **Bump version with every update.** Current: `1.0.1`.
