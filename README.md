# ATS Resume Builder by Junaid

Full-stack ATS-friendly resume builder, ATS score analyzer, AI Resume Revive parser, and tailored cover letter generator built with React, TypeScript, Tailwind CSS, and Express.

## Run Locally

**Prerequisites:** Node.js 20+; Python 3.10+ for the optional FastAPI ATS service.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your values:
   ```cmd
   if not exist .env copy .env.example .env
   ```
   - Replace the `JWT_SECRET_KEY` placeholder with a random 32-byte value generated via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. The server refuses to start without a strong key in every environment.
   - Set `GEMINI_API_KEY` for AI features (local deterministic ATS parser fallback works automatically if omitted in dev).
   - Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` for the existing MySQL database. The defaults target local `resume_ats`.
   - Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` for verification and password-recovery emails. Codes are never written to server logs; SMTP delivery failures log only a sanitized transport code. Email syntax is checked before sending, and mailbox ownership is verified by OTP rather than an MX/DNS lookup. Forgot Password keeps a generic response to protect account privacy.
   - Existing sessions created before the password-version claim was added must sign in again after deployment. Existing passwords continue to work and are upgraded securely after successful login.
3. Start the full-stack development server on `http://localhost:3000`:
   ```bash
   npm run dev
   ```

## Deploy on Render

1. Push the repository to GitHub (ensure `.env` and `data_storage/` are ignored via `.gitignore`).
2. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repo:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Add the following **Environment Variables** in the Render Dashboard:
   - `NODE_ENV` = `production`
   - `JWT_SECRET_KEY` = *(strong 32-byte random hex string — required; changing it invalidates existing sessions)*
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` = *(connection settings for the provisioned MySQL database)*
   - `GEMINI_API_KEY` = *(your Google Gemini API key)*
   - `SMTP_HOST` = *(e.g. `smtp.gmail.com` or Brevo/Resend SMTP host)*
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = *(your SMTP username/email)*
   - `SMTP_PASS` = *(your SMTP app password / API key)*
   - `MAIL_FROM` = `Resume Builder by Junaid <your_verified_sender@domain.com>`
   - `VITE_API_BASE_URL` = *(leave empty)*
   - To enable the FastAPI ATS proxy in deployment, deploy the separate ATS service and set `FASTAPI_ATS_URL` to its HTTPS URL plus the shared `FASTAPI_ATS_TOKEN`. Do not use a loopback URL in a cloud deployment.

## Request Flow and Backend Responsibilities

The React/Vite frontend sends `/api/...` requests to the same origin. Express remains the primary website backend and continues to own registration, login, OTP, password recovery, sessions, and resume CRUD. The browser does not call FastAPI or receive its service credential.

Gemini-backed API routes require an authenticated Express session and are limited to 10 AI requests per account per minute. `GEMINI_API_KEY` remains a server-only setting; the browser communicates with Express endpoints rather than the Gemini API directly.

For ATS job matching and uploaded-resume analysis, the browser calls the existing-origin Express API. Express validates the authenticated request; for the upload route it extracts document text and forwards only bounded text and the optional job description. Express calls the private FastAPI ATS service with `FASTAPI_ATS_TOKEN`, validates the response, and returns it to the browser. The Express JWT is not sent upstream. FastAPI ATS processing is stateless and does not read or write either backend's user/resume database. If FastAPI is not configured, the existing Express implementations of `/api/ai/match-job` and `/api/ats/analyze` remain available.

The ATS-only FastAPI entrypoint is `app.ats_main:app`; it is separate from the existing database-backed FastAPI CRUD entrypoint `app.main:app`. The ATS service needs only the shared `FASTAPI_ATS_TOKEN` and does not require `DATABASE_URL`. Existing FastAPI auth/resume CRUD still uses its own `users` and `resumes` tables and remains separate from Express `app_users` and `app_resumes`. The database-backed FastAPI app still requires an explicit `DATABASE_URL` and its existing resume model needs columns missing from the inspected `resume_ats.resumes` table. At the time of this check, `backend/.env` and a runtime `DATABASE_URL` were absent, so the intended database target for that CRUD app could not be confirmed; do not start `app.main:app` on the assumption that it should use the Express database.

### Voice-to-Resume

The authenticated resume editor offers optional browser-native speech recognition with locale hints for English (India, `en-IN`), English (United States, `en-US`), Hindi (`hi-IN`), Urdu (`ur-PK`), and Kannada (`kn-IN`). These are best-effort locale hints, not a guarantee that a given browser, operating system, or speech service supports accurate recognition. When recognition is unavailable, the transcript can be entered manually.

Speech is handled by the browser/operating-system provider and may be sent to that provider; the app does not upload or persist audio. After the user reviews and explicitly submits the transcript, the authenticated Express endpoint sends it to Google Gemini using the server-configured key; Google's applicable data-processing policies apply. The voice endpoint does not store transcripts or alter saved resumes. Extraction is restricted to source phrases found in the transcript, and the result opens as a separate unsaved draft. The user can edit all fields in the existing resume form and must explicitly save the draft. Replacing the currently displayed editor content requires an acknowledgement; an existing saved resume remains unchanged.

No additional environment variable or database change is required. The feature uses the existing server-only `GEMINI_API_KEY`; extraction is unavailable until it is configured. The existing per-account Gemini rate limit also applies to voice extraction.

In the Resume Revive chatbot, the microphone sends browser-recognized text into the normal chat input; it never auto-sends. The user can choose English, Hindi/Hinglish, Urdu, or Kannada locale hints, review/edit the result, stop or cancel recording, and then use the existing Send action. Recognition support and mixed-language accuracy depend on the browser and its speech service. Audio may be processed by that external provider; this app does not upload or persist recordings. After enough chat details have been shared, **Organize chat details into a resume draft** uses the same authenticated, source-checked extraction endpoint as Voice-to-Resume. A separate acknowledgement is required to load the result as a new unsaved draft; the open saved resume is preserved.

### Authentication rate limits behind proxies

The authentication rate limiter keys requests by the TCP peer address and deliberately ignores `X-Forwarded-For`. No Express `trust proxy` setting or deployment proxy-hop configuration is present in this repository, so accepting caller-supplied forwarding headers would let clients evade the limits. In local development this uses the direct client connection. A deployed Render Web Service is described above, but its active proxy topology and trusted-address configuration have not been independently verified; when the app is behind a proxy, requests may therefore share the proxy's peer-address bucket. Before enabling per-client proxy IP handling, verify the provider's current proxy boundary and configure Express to trust only that exact boundary. Do not set `trust proxy` to `true` or parse forwarded headers directly.

### Configure the private ATS service

Add these server-side environment variable names to the root `.env`:

- `FASTAPI_ATS_URL` — for local development, `http://127.0.0.1:8001`; use an HTTPS URL for a non-loopback service.
- `FASTAPI_ATS_TOKEN` — generate a cryptographically random value of at least 32 characters and configure the same value for both processes. Never put it in `VITE_*` variables or frontend code.

Generate a token locally with Node.js (the command prints the random value only in your terminal):

```cmd
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
```

### Run locally on Windows

Configure `FASTAPI_ATS_URL` and the same `FASTAPI_ATS_TOKEN` in the ignored root `.env`, then open two CMD terminals:

**Terminal 1 — FastAPI ATS service** (uses the existing backend virtual environment):

```cmd
cd /d C:\project\resume-fixer-pro\backend
venv\Scripts\python.exe -m uvicorn app.ats_main:app --host 127.0.0.1 --port 8001
```

**Terminal 2 — Express and React/Vite website:**

```cmd
cd /d C:\project\resume-fixer-pro
npm.cmd run dev
```

To run focused tests from the project root:

```cmd
cd /d C:\project\resume-fixer-pro\backend
venv\Scripts\python.exe -m pytest -q tests\test_ats_service.py
```

```cmd
cd /d C:\project\resume-fixer-pro
npm.cmd run test:express
```

The FastAPI ATS routes currently integrated through Express are job matching (`/api/ai/match-job`) and uploaded-resume analysis (`/api/ats/analyze`). When the private service is enabled, uploaded-resume scoring and its recommendations are deterministic Python processing; the existing response field name `aiSuggestions` is retained for frontend compatibility, but those suggestions are not generated by Gemini. Gemini generation and the older Express-only `/api/ai/analyze-ats` route are not moved to Python. When the private service is disabled, the existing Express ATS analysis and job-match behavior remains available. The request boundary tests use a local mock FastAPI service; they do not prove a separate live FastAPI process is reachable until both local services are started with the shared token.

### Pending schema migration (not applied)

The read-only MySQL inspection of `resume_ats.resumes` confirmed that `template_id` and `accent_color` are absent. They are required by the existing database-backed FastAPI `Resume` model, but are not required by the stateless ATS service. No migration is needed for ATS integration. The existing additive migration files are `backend/migrations/001_add_resume_template_fields.up.sql` and `backend/migrations/001_add_resume_template_fields.down.sql`; neither was applied. Do not start `app.main:app` against that schema until the migration is reviewed and approved. A readable SQL backup file was found, but it was not restored or otherwise verified as a valid recovery backup.

The local MySQL Community Server and `mysqldump` utility were both verified as version 8.4.9. The dump contains private database records, so keep it in the ignored `data_storage` directory and never commit or share it. Before creating a fresh backup from CMD, choose a unique filename and stop if it already exists:

```cmd
set "BACKUP=C:\project\resume-fixer-pro\data_storage\resume_ats_backup_%RANDOM%_%RANDOM%.sql"
if not exist "%BACKUP%" (
  "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" --host=127.0.0.1 --port=3306 --user=resume_app --password --single-transaction --quick --databases resume_ats --result-file="%BACKUP%"
) else (
  echo Backup file already exists; choose another name and do not run the dump command.
)
if exist "%BACKUP%" certutil -hashfile "%BACKUP%" SHA256
```

The `--password` option prompts without putting the password in the command line. Before running `mysqldump`, confirm that `BACKUP` does not already exist; do not run the dump command if it does. Verify the resulting file is non-empty and inspect only its `CREATE TABLE` statements, not `INSERT` data. A checksum and readable dump do not establish restore validity; only a successful restore into a separate disposable MySQL instance does. The existing `data_storage\resume_ats_backup.sql` contains only the `users` and `resumes` tables, has not been restore-tested, and omits the Express `app_users` and `app_resumes` tables, so it is not a complete recovery backup for the active website database.
