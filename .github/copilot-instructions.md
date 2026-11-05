# Project Copilot Instructions

- Follow FAST MODE: inspect only files directly related to the task.
- Reuse prior audit and test evidence; do not repeat completed work without a reason.
- Make minimal, targeted changes. Do not refactor unrelated code or working features.
- Back up only files that will be modified.
- Run only relevant tests. Do not run database integration tests until the isolated test database on port 3307 is verified; never use production database port 3306 for tests.
- Never expose or modify secrets in `.env`.
- Preserve existing Express, MySQL, Gemini, FastAPI, and resume-builder functionality.
- Avoid unnecessary full-project scans, builds, and repeated explanations.
- Keep responses concise and report PASS, FAIL, BLOCKED, and PENDING separately.
