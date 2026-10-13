# Manee Coffee Backend

REST API for the Manee Coffee Roasters website. Node.js + Express 5 + MongoDB (Mongoose), JWT auth.
It stores the content the website shows: news stories (ຂ່າວ) and coffee farms (ສວນກາເຟ), plus the admin accounts that may edit them.

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET (the .env in this folder already points at maneecaffee_db)
npm run seed           # creates the owner account (safe anywhere; adds no content)
npm run seed -- --samples  # also loads sample news + farms, only into an empty database
npm run dev            # http://localhost:4002
```

Seed account: `owner / maneecaffee123` (change it with `POST /api/auth/change-password`).
`npm run seed -- --force` wipes news + farms and loads the sample content again. The plain `npm run seed` never touches content, so it is safe to run against the live database.

The database is `maneecaffee_db` on the same Atlas cluster as TalaSale. MongoDB creates it on the first write (the seed), so it only appears in Atlas after `npm run seed`.

## Endpoints

All routes are under `/api`. Reading news and farms is public (the website calls these). Creating, editing and deleting needs `Authorization: Bearer <token>`; deleting needs the `owner` role. Login and register are rate-limited (30 requests per 15 minutes per IP).

| Area | Routes |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/login` (`username`, `password`) → `{ token, user }`; `POST /auth/register`; `GET /auth/register/status`; `GET /auth/me`; `POST /auth/change-password` |
| News | `GET /news?category=&featured=true&page=&limit=` → `{ items, total, page, limit, categories }` (featured first, then newest); `GET /news/categories`; `GET /news/featured` (the story in the big card at the top of the news page, newest story when none is flagged); `GET /news/:slug` (slug or id); `POST /news`; `PUT /news/:id`; `PATCH /news/:id/feature` (make it the featured story); `DELETE /news/:id` (owner) |
| Farms | `GET /farms` → `{ items, total }` (by `sortOrder`); `GET /farms/:slug` (slug or id); `POST /farms`; `PUT /farms/:id` (nested `facts`, `story`, `quote`, `product` are merged field by field); `DELETE /farms/:id` (owner) |
| Translate | `POST /translate` (`texts: string[]`, `from` lo, `to` en) → `{ texts }`: machine translation for the dashboard's "ແປເປັນພາສາອັງກິດ" button. Uses the Google Cloud Translation API when `GOOGLE_TRANSLATE_API_KEY` is set, otherwise Google's keyless public endpoint (best effort). 30 requests per minute per IP. |
| Uploads | `POST /uploads/news` and `POST /uploads/farms` (multipart field `image`, JPG/PNG/WEBP/GIF up to 5MB) → `{ url }`; photos are stored **in MongoDB** (GridFS bucket `uploads`) and served publicly at `/uploads/<kind>/<file>`, so they survive redeploys and are shared between every copy of the API that uses the same database. The local `uploads/` folder is only a fallback for old files; `npm run migrate-uploads` copies anything still in it into the database |

Logged-in users can add `?includeUnpublished=true` to the news and farm list/detail routes to see drafts (`published: false`).

### News story

```json
{
  "category": "ບໍລິຈາກໂຮງຮຽນ",
  "title": "Manee Coffee Roasters ມອບ...",
  "summary": "2–3 ແຖວ",
  "location": "ບ້ານ, ເມືອງ, ແຂວງ",
  "titleEn": "Optional English title", "summaryEn": "...", "bodyEn": ["..."], "locationEn": "...",
  "body": ["ຫຍໍ້ໜ້າ 1", "ຫຍໍ້ໜ້າ 2"],
  "images": [{ "url": "/uploads/news/....jpg", "alt": "...", "position": "center 30%" }],
  "featured": true,
  "published": true,
  "publishedAt": "2026-10-12"
}
```

`slug` is optional (generated from the title, Lao titles get `news-<id>`). `category` must be one of `ຊ່ວຍເຫຼືອຊຸມຊົນ`, `ບໍລິຈາກໂຮງຮຽນ`, `ຂ່າວສວນ ແລະ ຮ້ານ` (see `GET /news/categories`). Only one story is featured at a time: featuring one un-features the previous one. Every story also carries a read-only `date` (the `publishedAt` written in Lao, e.g. `12 ຕຸລາ 2026`). The first image shows on the card, all images on the story page; `position` is the CSS `object-position` used when the photo is cropped.

### Farm

Same shape as the website's farm data: `name`, `location`, `tagline`, `image` (card photo), `heroImages[]`, `description`, `facts` {altitude, variety, process, harvest, area, caretaker}, `story` {title, paragraphs[]}, `timeline[]` {year, title, text}, `quote` {image, text, author, role}, `product` {roast, notes[], brewing, price, images[] {url, label}}, `sortOrder`, `published`. A read-only `tags` array (altitude, variety, process) is returned for the home-page chips.

### Admin registration

`POST /auth/register` with `{ "name", "username", "password", "confirmPassword?" }` creates an account and returns `{ token, user }`.

| Situation | Result |
| --- | --- |
| No users exist yet | anyone may create the first **owner** (initial setup) |
| `ALLOW_PUBLIC_REGISTRATION=true` | anyone may create an **owner** (admin) account |
| Request carries an owner token | creates an account with the given `role` (`owner` or `staff`, default `staff`); returns `{ user }` only |
| Otherwise | 403 |

## Project layout

```
src/
  server.js          starts the HTTP server after connecting to MongoDB
  app.js             Express app: CORS, JSON, logging, /uploads static files, /api routes, error handler
  config/            env.js (reads .env), db.js (Mongoose connection), uploads.js (upload folders)
  models/            User, News, Farm
  controllers/       auth, news, farms
  routes/            one file per area + index.js; zod schemas validate request bodies
  middleware/        auth (JWT), error handler, image upload (multer)
  utils/             ApiError, validate, pagination, slug
  seed/              seed.js + images/ (seed photos stored in the database), migrate-uploads.js
  config/storage.js  photo storage in MongoDB (GridFS) + the /uploads/:kind/:name handler
```
