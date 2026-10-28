# CodeClarity — AI Code Explanation Tools

A beginner-friendly full-stack college project that explains recognizable patterns in short code snippets and saves explanation history in Supabase PostgreSQL.

> **Important naming note:** The project title says “AI”, but the core implementation intentionally does **not** call an AI model or external API. It uses a small rule-based analyzer so the project can run without paid AI services. Its explanations are educational hints, not a guarantee that code is correct.

## 1. Problem and objectives

Beginners often see loops, conditions, variables, and functions before they fully understand what each line does. CodeClarity gives them a plain-language explanation of common patterns, then saves the analysis so they can revisit it.

### Target users

- First-year programming students.
- Learners revising basic C, C++, Java, Python, and JavaScript.
- Students demonstrating a small full-stack application.

There are no separate user roles and no login system in this MVP.

## 2. Features

- Choose C, C++, Java, Python, or JavaScript.
- Load an example snippet or paste up to 20,000 characters.
- Receive a summary, line-by-line descriptions, and learning tips.
- Save analyses to Supabase PostgreSQL.
- View, reopen, refresh, and delete history associated with the current browser identifier.
- Responsive desktop/mobile interface, input validation, loading and error messages.
- Express health endpoint and basic security headers/rate limiting.

### MVP limitations

- The analyzer is rule-based, not generative AI.
- It does not compile or execute code, detect all syntax errors, or prove program correctness.
- No user accounts, team sharing, or cloud identity is implemented.
- Browser history uses a random browser identifier stored in localStorage. It is a demo ownership boundary, **not authentication**. Do not store sensitive or confidential code. Anyone who obtains that identifier may be able to access that browser's saved records.
- No paid service or external AI API is required, but a Supabase project is required for database-backed history.

## 3. Technology stack

- Frontend: HTML5, CSS3, Vanilla JavaScript.
- Backend: Node.js and Express.js.
- Database: Supabase PostgreSQL.
- Small npm dependencies: `@supabase/supabase-js` (database client), `dotenv` (local environment variables), `helmet` (security headers), and `express-rate-limit` (request rate limiting).

## 4. Folder structure

```text
ai-code-explanation-tools/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── analysis.js
│   │   └── history.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── analyzer.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`package-lock.json` is generated automatically by `npm install` and should be committed after installation.

## 5. Prerequisites

Install these on Windows:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (npm is included)
- [Git](https://git-scm.com/downloads)
- A free Supabase account: [Supabase](https://supabase.com/)

Verify installations in a new VS Code terminal:

```powershell
node --version
npm --version
git --version
```

Each command should print a version number. If a command is not recognized, install the relevant software and restart VS Code.

## 6. Setup from an empty folder

### Step 1 — Create/open the project

In PowerShell:

```powershell
mkdir ai-code-explanation-tools
cd ai-code-explanation-tools
code .
```

Create the `frontend`, `backend`, and `database` folders and create the files shown in the folder tree. Paste the matching source code into each file.

### Step 2 — Install backend dependencies

Open the VS Code terminal at the project root, then run:

```powershell
cd backend
npm install
```

This installs the dependencies from `package.json` and creates `package-lock.json` and `node_modules/`. A successful install ends without an npm error. If installation fails, check internet access and your Node.js version.

Run syntax checks:

```powershell
npm run check
```

Expected result: no syntax errors. This check does not connect to Supabase or test a browser.

### Step 3 — Create the Supabase project

1. Open [Supabase](https://supabase.com/) and sign in.
2. Create a new project and save its database password privately.
3. Wait until the project is ready.
4. In the project dashboard, open **SQL Editor**.
5. Open this repository's `database/schema.sql`, copy all its SQL, paste it into a new SQL Editor query, and run it.
6. Open **Table Editor** and confirm `code_explanations` exists.
7. In the project's API/settings area, copy the project URL and the server-side service-role/secret key. Supabase dashboard labels can change; use the key explicitly marked for privileged server use.

### Step 4 — Configure environment variables

In `backend/`, copy `.env.example` to a file named `.env`. In VS Code you can create `.env` and copy the template manually.

Example template (these are placeholders, not working credentials):

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_server_only_service_role_key
```

Replace the URL and key with your own project values. Keep `.env` private. **Never paste the service-role/secret key into frontend files, screenshots, public issues, or GitHub.** The `.env.example` file is safe to commit because it contains placeholders.

### Step 5 — Start the application

Make sure the terminal is inside `backend/`:

```powershell
npm start
```

Expected output:

```text
CodeClarity is running at http://localhost:3000
Press Ctrl+C to stop the server.
```

Open `http://localhost:3000` in your browser. Do not open `frontend/index.html` directly from File Explorer; the page calls the Express API.

To stop the server, press `Ctrl+C`. During development, `npm run dev` restarts Node when backend files change.

### Step 6 — Verify the API and app

Open `http://localhost:3000/api/health`. Expected JSON includes `"status":"ok"`.

Then in the app:
1. Keep the default C example or click **Load example**.
2. Click **Explain code**.
3. Confirm a summary and line-by-line notes appear.
4. Confirm a saved card appears under **Explanation history**.
5. Click **Open again**, then try deleting a history card.
6. Refresh the page and confirm the browser's history remains.

The analysis endpoint writes to Supabase, so successful history saving verifies that the configured database operation worked. This project has not been pre-connected to your Supabase project; you must run these checks with your own credentials.

## 7. Architecture

```text
Browser (HTML/CSS/Vanilla JS)
        |
        | fetch() JSON requests
        v
Node.js + Express API
  |-- validates language and code size
  |-- rule-based analyzer
  |-- checks browser identifier for history operations
        |
        | server-only Supabase client
        v
Supabase PostgreSQL (code_explanations)
```

The browser never receives the Supabase service-role key. The backend uses that privileged key and must enforce its own access checks. RLS is enabled and no public policies are created; direct `anon`/`authenticated` table access is revoked. The service-role key bypasses RLS, so it must remain secret and API queries must filter by `browser_id`.

### Browser identifier security caveat

The browser creates a UUID and stores it in localStorage. It is sent as `X-Browser-Id` for history ownership. This is useful for a classroom demo, but it is not equivalent to authentication: users can inspect or change browser storage and request headers. Do not use this design for sensitive data or a production application. A production version should add Supabase Auth, verify access tokens on the server, and enforce per-user ownership with appropriate RLS policies.

## 8. REST API

All routes are served from the same origin at `http://localhost:3000`.

| Method | Path | Purpose | Input | Success |
|---|---|---|---|---|
| GET | `/api/health` | Check whether the server is running | None | `200` with status JSON |
| POST | `/api/analysis` | Analyze and save code | JSON `{ "language": "c", "code": "..." }`; valid `X-Browser-Id` header | `201` with `analysis` and saved `item` |
| GET | `/api/history` | List up to 30 saved items for this browser ID | Valid `X-Browser-Id` header | `200` with `{ "items": [...] }` |
| DELETE | `/api/history/:id` | Delete one saved item belonging to this browser ID | UUID path parameter and valid header | `200` with confirmation |

Supported `language` values: `c`, `cpp`, `java`, `python`, `javascript`.

Common errors:
- `400`: invalid/missing input or browser ID.
- `404`: unknown API route or history item not owned by this browser ID.
- `429`: rate limit reached.
- `503`: database operation failed.
- `500`: unexpected server error, with a generic message sent to the browser.

There is no login or role-based authorization in this MVP.

## 9. Database design

`public.code_explanations` stores:
- `id`: generated UUID primary key.
- `browser_id`: browser-generated UUID used for demo history filtering.
- `language`: constrained to the five supported languages.
- `code`: submitted code (1–20,000 characters).
- `title`: short label generated from the first meaningful line.
- `summary`: rule-based summary.
- `analysis`: JSONB containing line breakdown and learning tips.
- `created_at`: timestamp with time zone.

An index on `(browser_id, created_at DESC)` helps history retrieval. There are no foreign keys because this MVP does not have user accounts.

## 10. Manual testing checklist

| Test | Action | Expected result |
|---|---|---|
| Health | Visit `/api/health` | `200` JSON with status `ok` |
| Valid analysis | Submit the sample C code | Summary and line explanations appear; record is saved |
| Language switch | Select Python and load example | Python example is loaded when the editor is empty |
| Empty code | Clear editor and submit | Friendly validation message; no database record created |
| Unsupported language | Send a POST with language `ruby` | `400` JSON error |
| Oversized code | Submit more than 20,000 characters using an API client | `400` JSON error |
| History | Refresh the page after an analysis | Saved item remains in history |
| Reopen | Click Open again on a history card | Language, code, and explanation are restored |
| Delete | Click Delete and confirm | Card disappears; record is deleted |
| Delete another browser's item | Send DELETE using a different browser ID | `404`; other browser's item is not deleted |
| Database unavailable | Temporarily use an incorrect Supabase URL/key | Friendly save/history error; secret and raw database details are not returned |
| Responsive layout | Resize browser to mobile width | Panels and history cards stack without horizontal overflow |
| XSS safety | Paste code containing `<script>alert(1)</script>` | Code is rendered as text; it does not execute |

These are test instructions, not claims that a live Supabase project has been tested.

## 11. Troubleshooting

- **`Missing SUPABASE_URL...`**: Check that `backend/.env` exists and variable names match exactly. Restart the server after changing `.env`.
- **Could not save/load history**: Check that `schema.sql` ran successfully, the project URL is correct, and the server-side key belongs to the same Supabase project.
- **`Invalid API key` / `401`**: Use the correct server-side key from the same Supabase project; do not use a placeholder.
- **`EADDRINUSE`**: Another process is using port 3000. Stop it or set another `PORT` in `backend/.env`.
- **`npm` is not recognized**: Reinstall Node.js LTS and restart the terminal.
- **Frontend doesn't load**: Start the server from `backend/` with `npm start`, then visit `http://localhost:3000`.
- **History appears empty in another browser**: This is expected because each browser has its own browser identifier.

## 12. Git and GitHub upload

1. Create a new repository on [GitHub](https://github.com/). For the simplest first push, do not initialize it with a README if your local project already has one.
2. Open a terminal at the **project root**, not inside `backend/`.
3. Check that secrets and dependencies are ignored:

```powershell
git init
git status
git add .
git status
```

Inspect the staged files. Ensure `backend/.env`, `node_modules/`, database exports, and private information are absent; ensure `backend/.env.example` is present. If `.env` appears staged, stop and fix `.gitignore` before committing.

Then run:

```powershell
git commit -m "Build project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual URL shown by GitHub, for example the HTTPS URL for your own repository. Confirm that the files appear on GitHub.

If Git asks you to set your identity, configure it with your own details:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

`.gitignore` does not remove a secret that was already committed. If a credential was exposed, rotate/revoke it immediately and remove it from repository history as appropriate.

## 13. Security notes

- Never commit `backend/.env` or expose the service-role key.
- The backend limits JSON body size, validates language/code length, uses security headers, and rate-limits API requests.
- Frontend user code and saved text are inserted using safe text APIs rather than interpreted as HTML.
- Browser IDs are not secure authentication. Use Supabase Auth and server-side token verification before handling private or valuable user data.
- Do not paste confidential source code, credentials, or personal data into this demo.

## 14. Future improvements

- Supabase Auth with verified user identities and user-scoped RLS policies.
- More robust parsing using language-specific parsers, while retaining the allowed technology stack where feasible.
- Unit tests for analyzer rules and API routes.
- Export explanations as text/Markdown.
- Optional AI-powered explanations in a separate future version, only if an approved API and its cost/security requirements are accepted.
