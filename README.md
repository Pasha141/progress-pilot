# ATS Resume Builder by Junaid

**Build Smarter Resumes. Optimize for ATS. Move Your Career Forward.**

A full-stack, AI-powered ATS Resume Builder designed to help job seekers create professional resumes, analyze ATS compatibility, improve resume content, and generate tailored cover letters.

Built with React, TypeScript, Tailwind CSS, Express, MySQL, and optional FastAPI integration.

[Features](#features) · [Technology Stack](#technology-stack) · [Installation](#installation-and-setup) · [Configuration](#environment-configuration) · [Run Locally](#run-the-application) · [Testing](#testing) · [Deployment](#deployment)

---

## Overview

ATS Resume Builder by Junaid is a full-stack web application that helps users create, improve, and optimize resumes for Applicant Tracking Systems (ATS).

The application combines resume editing, ATS analysis, AI-powered suggestions, document parsing, and cover letter generation in one platform.

The primary backend is Express. MySQL stores application data, while Google Gemini provides AI-powered functionality. An optional, independently deployed FastAPI service handles selected ATS processing tasks.

## Features

### Resume Builder
- Create and edit professional resumes.
- Organize information into structured resume sections.
- Live resume editing and preview.
- Multiple professional and ATS-friendly templates.
- Export resumes to PDF and DOCX.

### ATS Resume Analyzer
- Analyze resume content and ATS compatibility.
- Identify missing or relevant job keywords.
- Review keyword density and action verbs.
- Highlight weak resume phrases.
- Provide improvement recommendations.

### AI Resume Revive
- Extract and organize resume information.
- Improve resume content using AI assistance.
- Generate structured resume drafts from provided information.
- Review and edit suggestions before saving.

### AI Cover Letter Generator
- Generate job-specific cover letters.
- Tailor content using resume and job-description information.

### Voice-to-Resume
- Browser-based speech recognition.
- Locale hints for English, Hindi, Urdu, and Kannada.
- Review extracted content before creating a resume draft.
- Manual transcript editing when speech recognition is unavailable.

### Authentication and Security
- User registration and login.
- Email OTP verification and password recovery.
- Secure password hashing.
- JWT-based authentication.
- User-specific resume access controls.
- Rate limiting for selected AI and authentication endpoints.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Database | MySQL 8 |
| AI Integration | Google Gemini API |
| Optional ATS Service | Python, FastAPI |
| Authentication | JWT, secure password hashing |
| Testing | Node.js test runner, Python pytest |
| Version Control | Git, GitHub |

---

## Architecture

```text
                 USER / BROWSER
                       |
                       v
              React + TypeScript
                 Vite Frontend
                       |
                       v
                 Express API
                       |
          +------------+------------+
          |            |            |
          v            v            v
        MySQL       Gemini API   FastAPI ATS
       Database      (AI)        (Optional)
                                    |
                                    v
                              ATS Processing
```

**Backend responsibilities**

- Express manages authentication, OTP, password recovery, sessions, resume CRUD, and API requests.
- MySQL stores application data.
- Gemini handles supported AI-powered features through server-side API routes.
- FastAPI is an optional private ATS service for selected resume-analysis operations.

The browser communicates with Express. Private API credentials must remain on the server.

---

## Installation and Setup

Follow these instructions to run the project on your local computer.

### 1. Prerequisites

Install the following software before starting.

| Software | Requirement | Official download |
|---|---|---|
| Node.js | Version 20 or later | https://nodejs.org/ |
| npm | Included with Node.js | Included with Node.js |
| Git | Latest stable version | https://git-scm.com/downloads |
| MySQL Community Server | MySQL 8 | https://dev.mysql.com/downloads/mysql/ |
| Python | Version 3.10+ (optional ATS service) | https://www.python.org/downloads/ |
| VS Code | Recommended editor | https://code.visualstudio.com/ |

**Verify installation**

Open Command Prompt or a terminal:

```cmd
node --version
npm --version
git --version
mysql --version
python --version
```

If a command is not recognized, verify that the corresponding software is installed and added to PATH.

### 2. Clone the GitHub Repository

Open Command Prompt and run:

```cmd
git clone https://github.com/Pasha141/progress-pilot.git
```

Enter the project directory:

```cmd
cd progress-pilot
```

### 3. Install Node.js Dependencies

From the project root:

```cmd
npm install
```

Wait until installation completes.

### 4. Configure Environment Variables

Create your local environment file:

```cmd
if not exist .env copy .env.example .env
```

Open `.env` in a text editor and configure the required values.

See [Environment Configuration](#environment-configuration) below.

**Important:** Never upload `.env` to GitHub. Use `.env.example` only for placeholder configuration.

### 5. Configure MySQL

Install and start MySQL Server 8.

Create the application database using MySQL:

```sql
CREATE DATABASE resume_ats;
```

Configure the database connection details in the root `.env` file.

Use the database schema and setup scripts supplied with the project. Do not assume that creating an empty database automatically creates all required tables.

### 6. Start the Application

After installing dependencies and configuring the required environment variables:

```cmd
npm run dev
```

Open your browser:

http://localhost:3000

The development server should serve the frontend and Express API.

---

## Environment Configuration

The application uses environment variables for database connections, authentication, AI services, and email delivery.

Configure these variables in your local `.env` file:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | Express server port |
| `JWT_SECRET_KEY` | Secure authentication signing key |
| `MYSQL_HOST` | MySQL server hostname |
| `MYSQL_PORT` | MySQL server port |
| `MYSQL_USER` | Database username |
| `MYSQL_PASSWORD` | Database password |
| `MYSQL_DATABASE` | Database name |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SMTP_HOST` | Email provider SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app password |
| `MAIL_FROM` | Verified sender address |
| `VITE_API_BASE_URL` | Frontend API base URL; leave empty for same-origin requests |
| `FASTAPI_ATS_URL` | Optional private FastAPI service URL |
| `FASTAPI_ATS_TOKEN` | Shared private service authentication token |

### Generate a Secure JWT Secret

Run this command locally:

```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into your local `.env` as `JWT_SECRET_KEY`.

### Gemini API Key

Get your API key from:

https://aistudio.google.com/apikey

Store it only in the server-side `.env` file.

### Email Configuration

Configure your SMTP provider to enable email verification and password recovery.

For Gmail, use an App Password where applicable. Never use your regular account password in application configuration.

**Security note:** Never share real environment variable values in screenshots, public issues, source code, or GitHub commits.

---

## Optional: FastAPI ATS Service

The project supports an optional private FastAPI service for selected ATS operations.

When configured, Express forwards validated ATS requests to FastAPI. When the service is unavailable or not configured, the existing Express implementations remain available for supported operations.

The ATS-only entrypoint is:

```cmd
app.ats_main:app
```

The separate database-backed FastAPI CRUD entrypoint is:

```cmd
app.main:app
```

These entrypoints have different responsibilities. Do not start the database-backed CRUD application against an unverified database schema.

### Configure the ATS Service

Set these variables in the root `.env`:

```env
FASTAPI_ATS_URL=http://127.0.0.1:8001
FASTAPI_ATS_TOKEN=your_shared_random_token
```

Generate a secure token locally:

```cmd
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
```

Configure the same token for the FastAPI service. Never expose it in frontend code or `VITE_*` variables.

### Start FastAPI

Open a second terminal:

```cmd
cd backend
```

Activate or use the project's existing Python virtual environment and install the dependencies listed in the backend requirements file.

For an existing Windows virtual environment:

```cmd
venv\Scripts\activate
```

Start the ATS service:

```cmd
python -m uvicorn app.ats_main:app --host 127.0.0.1 --port 8001
```

Keep this terminal running.

### Start Express

Open another terminal in the project root:

```cmd
npm run dev
```

Both services should be running for requests that use the private FastAPI integration.

---

## Testing

Run the tests from the appropriate project directories.

### Express Tests

From the project root:

```cmd
npm run test:express
```

### Python ATS Tests

From the backend directory, activate the project's virtual environment and run:

```cmd
python -m pytest -q tests\test_ats_service.py
```

### TypeScript Check

If the project defines the corresponding lint script:

```cmd
npm run lint
```

Run the tests after making code changes and before submitting a pull request.

---

## Production Build

Create a production frontend build:

```cmd
npm run build
```

The generated frontend assets are placed in the build output directory configured by Vite.

For production, use the application's production start script:

```cmd
npm start
```

Configure all required environment variables in the hosting provider's secure environment-variable settings.

---

## Deployment

The application can be deployed using a Node.js hosting provider such as Render.

### Render Web Service

1. Create an account at https://render.com/.
2. Select **New → Web Service**.
3. Connect your GitHub account.
4. Select the `Pasha141/progress-pilot` repository.
5. Configure the service:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

6. Add the required environment variables in the Render Dashboard.
7. Deploy the application.
8. Verify the health endpoint and the deployed website.

### Production Database

Render Web Services do not automatically provide the MySQL database required by this project.

Provision a compatible external MySQL 8 database with a secure connection. Configure its connection details in the hosting provider's environment settings.

Do not use a local computer's `127.0.0.1` or `localhost` database address from a cloud-hosted application.

### Optional FastAPI Deployment

If you want to enable the private FastAPI ATS service in production:

1. Deploy the ATS-only FastAPI application separately.
2. Configure an HTTPS service URL.
3. Set `FASTAPI_ATS_URL` in the Express service.
4. Set the matching `FASTAPI_ATS_TOKEN` securely in both services.
5. Test the integration after deployment.

Do not expose the private FastAPI token to the browser.

---

## Security Considerations

- Keep API keys and credentials out of Git.
- Use strong, randomly generated authentication secrets.
- Use HTTPS in production.
- Keep database credentials private.
- Do not expose private FastAPI credentials to frontend code.
- Preserve authentication and authorization checks on protected routes.
- Review environment variables before every deployment.
- Do not run unreviewed database migrations on production data.

---

## Troubleshooting

| Problem | What to check |
|---|---|
| `node` is not recognized | Install Node.js and verify PATH |
| `npm install` fails | Check Node.js version and network connection |
| Port 3000 is already in use | Stop the existing process or configure another supported port |
| MySQL connection fails | Verify MySQL service, host, port, user, password, and database |
| AI features are unavailable | Verify the server-side Gemini API key |
| Email OTP is not received | Verify SMTP settings and sender configuration |
| FastAPI ATS requests fail | Check FastAPI status, URL, token, and network access |
| Production health check fails | Inspect hosting logs and `/api/health` response |

---

## Project Structure

The following is a high-level overview. Exact file names and directories may vary as the project evolves.

```text
progress-pilot/
│
├── backend/             # Optional Python FastAPI ATS service
├── src/                 # React frontend source
├── public/              # Public assets
├── tests/               # Application tests
├── .env.example         # Environment variable template
├── .gitignore           # Git exclusions
├── package.json         # Node.js dependencies and scripts
├── server.ts            # Express application entry point
└── README.md            # Project documentation
```

---

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run the relevant tests.
5. Submit a pull request describing your changes.

Please do not include credentials, private user data, database dumps, or personal documents in pull requests.

---

## Author

**Mohammed Junaid Pasha**

Computer Science & Engineering Graduate | Full-Stack Project Developer

GitHub: https://github.com/Pasha141

Project Repository: https://github.com/Pasha141/progress-pilot

---

## License

Check the repository for the applicable license before using, modifying, or redistributing this project.

---

**ATS Resume Builder by Junaid**

*Build Smarter Resumes. Optimize for ATS. Move Your Career Forward.*
