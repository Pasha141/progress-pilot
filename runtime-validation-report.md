# Runtime Validation Report

**Updated**: 2026-10-30
**Target**: `C:\project\resume-fixer-pro`

## Real Saved-Resume PDF Verification (2026-10-30)

The shared browser page remained on `/login` when checked, so no authorized session or saved resume was available to the automation. No login was attempted, no resume was opened or modified, and no database operations were performed.

| Test | Result | Evidence |
|---|---|---|
| Actual download to disk | BLOCKED | No authenticated resume page or user click was available. Synthetic PDF generation is not evidence of a real download. |
| Downloaded PDF opens | BLOCKED | No user-downloaded file was produced. |
| Saved-resume first-page text | BLOCKED | No saved resume could be opened or exported in the shared browser. |
| Saved-resume last-page text searchable | BLOCKED | No saved-resume PDF was available for extraction or Ctrl+F verification. |
| A4 layout and page breaks | BLOCKED | The requested checks require the exported saved resume; prior A4 measurements were from synthetic content. |
| Print Preview | BLOCKED | No authenticated preview page was available for a genuine user click. |
| Lint | PASS | `npm.cmd run lint` passed in the preceding PDF follow-up (exit code 0); not rerun because no code changed. |
| Build | PASS | `npm.cmd run build` passed in the preceding PDF follow-up (exit code 0); not rerun because no code changed. |

**Manual continuation required:** Make the authorized session available in the shared browser tab at `http://127.0.0.1:3000` (the current shared page still shows `/login`) and open an existing saved resume. Do not send credentials, OTPs, tokens, or resume contents in chat. After the authenticated resume preview is visible in that shared tab, continue the download and print-preview checks there. These real-world PDF checks are not complete.

Files changed in this reporting update: this report only. Backup created and verified before editing: `runtime-validation-report.md.pre-pdf-real-verification-20261030-150000.bak`.

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Startup | PASS | 0 | `npm.cmd run dev` with `PORT=3001` and `DISABLE_HMR=true` started Express/Vite. `GET /` returned HTTP 200; browser title was “ATS-Friendly Resume Builder by Junaid”. The default port 3000 was already occupied, so that listener was left untouched. |
| Integration tests | PASS | 0 | Latest `npm.cmd run test:express`: 5 passed, 0 failed. Covered rate-limit spoofing, registration/OTP/password recovery/resume CRUD, expired OTP, mocked Gemini success/error/input validation, and mocked FastAPI proxy behavior. |
| Lint | PASS | 0 | Latest `npm.cmd run lint` passed (`tsc --noEmit`). |
| Production build | PASS | 0 | Latest `npm.cmd run build` passed. Vite emitted the existing `__dirname` config-loader warning and a >500 kB chunk warning. |
| Browser E2E | PARTIAL | 0 | Registration through local SMTP sink, OTP verification, login, dashboard, resume create/edit/read-after-refresh/delete, logout, and protected-route rejection passed. The prior five-page export and overflow fix are recorded below. A synthetic follow-up verified searchable first/last PDF markers after correcting text-layer vertical scaling; actual download-to-disk and normal-browser print preview remain unverified. |

**Overall**: NEEDS_SIGNOFF — local Express flows and mocked integration tests pass. Real SMTP delivery and real Gemini generation remain unverified; actual PDF download-to-disk, print preview, and searchable text in an authenticated saved-resume export remain unverified; the production proxy topology and a restorable full-site database backup are not verified; FastAPI CRUD remains separate and its schema migration is unapplied.

## PDF Export Follow-up (2026-10-30)

The export helper was exercised through the running application with unsaved synthetic content; no account, saved resume, database row, or external service was used.

| Check | Status | Evidence and limitation |
|---|---|---|
| PDF export generation | PASS | The existing `exportElementToPdf` helper completed and produced a 2,010,213-byte PDF blob captured by a temporary loopback-only test sink. This confirms generation, not a browser download to disk. |
| A4 dimensions and pagination | PASS | PDF.js reported 2 pages, each 595.28 × 841.89 points (A4). |
| Searchable first/last markers | PASS | PDF.js extracted `PDF_E2E_FIRST_PAGE_SENTINEL` once on page 1 and `PDF_E2E_LAST_PAGE_SENTINEL` once on page 2, at the end of the document. The long-token prefix was also present once in searchable text. |
| Long-token preview width | PASS | The rendered sheet was 794 px wide with `scrollWidth: 794` and `overflow-wrap: anywhere`; the token wrapped within the page width. |
| Visual content integrity | PASS with pagination note | Both PDF pages were rendered for inspection. Synthetic headings 0–7 each appeared once in extracted text; the first/last markers were visible and no content was observed clipped or duplicated. The Experience 2 heading is at the bottom of page 1 while its paragraph continues on page 2. |
| Actual browser download-to-disk | BLOCKED | No browser download event or saved file was obtained. The captured PDF blob is not evidence of a user-initiated disk download. The automation page could not deliver a visible click. |
| Browser print preview | BLOCKED | A Playwright click on a synthetic test button timed out while waiting for the element to become visible and stable. The automation browser therefore could not provide the requested normal user click; this does not establish an application defect or verify popup behavior. |
| Lint | PASS | `npm.cmd run lint` exited 0 (`tsc --noEmit`). |
| Production build | PASS with warnings | `npm.cmd run build` exited 0. Existing warnings: `__dirname` with Vite's native config loader and a JavaScript chunk larger than 500 kB. |

**Confirmed root cause and correction**: searchable text y-coordinates are measured in the 2× raster canvas coordinate space, but were divided by the 794 CSS-pixel A4 width. This placed lower-page searchable text at roughly twice its intended vertical position. The y conversion now divides by `canvas.width`, matching the raster scale used for the PDF image. The synthetic PDF's first and last sentinels are now both searchable. The authenticated five-page saved-resume export was not repeated, so its complete searchable text layer remains unverified.

PDF.js emitted its existing `standardFontDataUrl` warning during extraction/rendering; both completed and produced the results above. The production build also emitted the Vite config-loader `__dirname` warning and the large-chunk warning noted in the Summary.

Files changed in this follow-up: `src/utils/printHelper.ts` (vertical text-layer coordinate conversion) and this report. Timestamped pre-change backups were created and hash-verified:

- `src/utils/printHelper.ts.pre-pdf-phase-20261030-131905.bak`
- `runtime-validation-report.md.pre-pdf-phase-20261030-131905.bak`

## Current Security and E2E Phase (2026-10-30)

| Work item | Status | Evidence and limitation |
|---|---|---|
| Authentication rate-limit client IP | PASS / deployment configuration BLOCKED | The limiter uses the TCP peer address and ignores caller-supplied `X-Forwarded-For`. The spoofing/rate-limit test passed. No trusted deployment proxy-hop configuration was present, so forwarded headers remain untrusted. |
| Authenticated browser workflows | PASS | A disposable account completed signup through a local-only SMTP sink, OTP verification, login, dashboard access, resume creation and editing. The edited summary was read back from `/api/resumes` after refresh. UI deletion returned the server-side resume count to zero; logout cleared the session token; direct `/my-resumes` access redirected to `/login`. |
| Disposable data cleanup | PASS | The browser fixture cleanup returned `deletedUsers: 1`, `deletedResumes: 0`, `remainingUsers: 0`. A read-only count after the Express suite returned zero matching disposable users and resumes. |
| PDF export and A4 layout | PARTIAL | The UI reported export success and the generated 3,721,731-byte PDF blob was captured for inspection; Playwright did not emit a browser download event, so saving to disk was not verified. The PDF had five pages, each 595.28 × 841.89 points (A4). The first sentinel appeared once on page 1 and the last sentinel appeared once visually on page 5. PDF.js text extraction found the first sentinel once but did not find the last one; searchable text-layer completeness is therefore not confirmed. |
| PDF text overflow | PASS after fix | Before the CSS change, the preview was 794 px wide with `scrollWidth: 1132` due to an unbroken summary token. Adding `overflow-wrap: anywhere` to `.resume-print-sheet` reduced `scrollWidth` to 794 px; the long token wrapped in the exported PDF. |
| Browser print preview | BLOCKED | The automation browser blocked `window.open`; the app displayed its existing “allow pop-ups” alert. A real user-gesture print preview was not verified. |
| Gemini route | PASS with mocks only | The current Express suite passed authenticated mock success, provider failure, invalid-input and unauthenticated rejection cases. Six calls were allowed and the next call returned 429 with `Retry-After`. No real Gemini request was made in this phase. |
| Email delivery | PASS with local sink only | Signup and OTP were exercised with the test-only local SMTP sink. No external email was sent; real SMTP/Gmail delivery is not verified. |
| Database recovery | BLOCKED | The existing dump contains only FastAPI `users` and `resumes`, omits Express `app_users` and `app_resumes`, and was not restore-tested. No new backup or restore was performed. |
| FastAPI architecture | RECOMMEND OPTION B | Keep Express as the primary website backend and FastAPI as an optional isolated ATS service behind Express. FastAPI CRUD remains separate and still requires its unapplied schema migration; no migration or schema change occurred. |

Warnings observed during this phase: the isolated browser reported a Vite HMR WebSocket handshake 400, while the app remained usable; PDF.js emitted a standard-font-data warning during rendering, which completed; and the automated print popup was blocked. The `pdf-parse` inspection helper itself raised a Node `DataCloneError`, so PDF dimensions and text markers were checked with PDF.js instead.

## Historical Baseline Before Current Phase

## Environment and Per-Capability Evidence

```text
environment:
  docker: UNAVAILABLE — Get-Command docker found no Docker CLI.
  node: AVAILABLE — v24.20.0.
  playwright: AVAILABLE — `npx.cmd --yes playwright install --with-deps chromium` exited 0 and downloaded Chromium.
  infra-tier: FALLBACK(local MySQL + disposable test records) — Docker was unavailable; integration tests used the existing local MySQL test setup and verified cleanup.
  browser-tier: PARTIAL(Playwright) — Chromium was installed and the running SPA homepage was rendered. Full authenticated browser journeys were not run.
startup: PASS — `$env:PORT='3001'; $env:DISABLE_HMR='true'; npm.cmd run dev`; HTTP readiness signal was `GET http://127.0.0.1:3001/` → 200; startup elapsed time was not recorded. Vite emitted a WebSocket-port warning, but the app rendered.
integration: PASS — exit_code: 0; passed: 6 reported tests (5 FastAPI ATS tests + 1 focused Express integration test), failed: 0; scope: stateless ATS processing and authenticated Express proxy behavior; gaps: exact selector for the focused Express test was not retained in the handoff.
e2e: PARTIAL — exit_code: 0 for homepage browser smoke; passed: 1 smoke check, failed: 0 test-suite cases, skipped/unverified: authenticated ATS and resume journeys; boundaries exercised: browser → local Express/Vite homepage only; gaps: no full Playwright journey suite, real ATS service configuration absent.
overall: NEEDS_SIGNOFF — no live ATS proxy activation or full browser E2E evidence.
```

The initial default-port startup attempt, `npm.cmd run dev`, exited 1 because port 3000 was already in use. The pre-existing listener returned HTTP 200 and was not stopped or modified. A second attempt on port 3001 started successfully; that specific process was stopped after the browser check.

## Legacy Test Assets

- `legacyTestAssets`: `tests/express.integration.test.mjs` and `backend/tests/test_ats_service.py` (existing/updated API-level suites).
- `source`: discovered.
- `migrationDecision`: not applicable; no UI technology migration was performed.
- No existing Playwright browser suite or repository `plan.md` testing strategy was found.

## Test Evidence

- FastAPI ATS service tests: **5 passed, 0 failed**.
- Focused Express-to-mocked-FastAPI integration test: **1 passed, 0 failed**. Covered authenticated proxy behavior, validation, upstream failures/timeouts/malformed or oversized responses, and ownership checks. SMTP and upstream ATS were locally mocked; no real email or paid AI request was made.
- `npm.cmd run lint`: **PASS**.
- `npm.cmd run build`: **PASS**, with the Vite warnings noted above.
- Browser smoke: application homepage rendered with the expected title and content. This does not verify the authenticated ATS flows.
- Exact full command line/selector for the focused Express test was not preserved in the prior execution summary; it is not reconstructed here.

## Issues and Remaining Gaps

| # | Severity | Description | Escalated To |
|---|---|---|---|
| 1 | Medium | FastAPI ATS proxy configuration is disabled in the local `.env`; configure the server-only `FASTAPI_ATS_URL` and `FASTAPI_ATS_TOKEN` to exercise the real local service through Express. | User action |
| 2 | Medium | The FastAPI CRUD `DATABASE_URL` target is absent/unconfirmed. The observed `resume_ats.resumes` table lacks `template_id` and `accent_color`; schema migration remains blocked by the user’s decision. | User action |
| 3 | Low | Docker CLI was unavailable. Existing local MySQL-backed disposable-record tests were used instead; Docker-based infrastructure was not exercised. | Environment |
| 4 | Low | Browser print preview was blocked by the automation browser, PDF.js did not find the final synthetic marker in the searchable text layer, and ATS browser workflows were not exercised. | Follow-up validation |

No schema migration was applied. No user account or existing resume was intentionally modified. Test-created Express records were cleaned up; the cleanup check returned zero remaining test accounts and zero ATS test resumes.

## Voice-to-Resume Feature (2026-10-30)

The approved voice feature is implemented as an optional browser SpeechRecognition interface, authenticated Express transcript-extraction route, source-phrase validation, and an explicitly confirmed unsaved draft. It does not record or upload audio to Express, persist transcripts, call FastAPI, or automatically save a resume. A successful extraction opens the result in the existing editable resume form. Applying it clears the active saved-resume ID first, so subsequent Save creates a separate record instead of updating the previously open saved resume.

| Verification | Result | Evidence |
|---|---|---|
| Source-grounding and transcript validation | PASS | The four new tests cover bounds, prompt-injection wording, source-grounded mapping, invented-value rejection and unsupported current-role rejection. They are included in the existing `test:express` command. |
| Authenticated voice extraction route | PASS | Final `npm.cmd run test:express`: 10 total tests passed, 0 failed (4 voice extraction tests and 6 existing/new Express integration tests). The route test exercised authentication, input validation, successful mock extraction, rejection of an invented email, sanitized provider failure and the shared per-account rate limit. |
| Sensitive detail handling | PASS | The route integration test asserted that mock API-key markers, secret markers, stack-trace markers and sensitive configuration names were absent from response bodies and captured server output. |
| Disposable test account cleanup | PASS | The Express suite's teardown deleted its generated accounts/resumes and verified no generated test account remained. No existing user or resume was selected or changed. Email delivery was to the suite's local SMTP sink only. |
| TypeScript check | PASS | Final `npm.cmd run lint` (`tsc --noEmit`) exited 0. |
| Production build | PASS | Final-source `npm.cmd run build -- --outDir C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\voice-build-20261030-154500` exited 0. Temporary output was verified and removed. An earlier `npm.cmd run build` also exited 0 and regenerated the ignored `dist` build output. |
| Actual browser microphone and language recognition | NOT TESTED | No real microphone interaction, browser speech-provider request, language accuracy, or browser permission flow was exercised. The five locale tags shown in the UI are best-effort hints, not verified language guarantees. |
| Authenticated UI draft workflow | NOT TESTED | The HTTP route and extraction logic were tested, but the live browser form, confirmation checkbox, unsaved draft editing and manual Save were not exercised end to end. |
| Real Gemini extraction / email delivery | NOT TESTED | All Gemini route assertions used the isolated test-mode mock; no paid Gemini request was made. Registration in the Express test suite used its local SMTP sink; no real email was sent. |
| Database schema/data changes | NONE | No migration, schema change, or destructive database operation was made. Existing records were not targeted. |

### Capability and runtime verdict

```yaml
environment:
  docker: UNAVAILABLE — PowerShell reported that the docker command was not recognized.
  node: AVAILABLE — node --version reported v24.20.0.
  playwright: NOT TESTED — no browser E2E suite was run for this feature.
  infra-tier: LOCAL MYSQL TEST HARNESS — the existing guarded Express integration suite passed against its loopback disposable-test setup; Docker was not available.
  browser-tier: NOT TESTED — microphone, locale recognition and authenticated browser editing remain unverified.
startup: PASS — the Express integration harness started its isolated server and received a successful /api/health readiness response.
integration: PASS — exit_code: 0; passed: 6, failed: 0; existing Express suite including the new authenticated voice extraction route.
e2e: UNVERIFIED — no browser workflow was exercised; browser speech recognition and draft editing remain a manual verification gap.
overall: NEEDS_SIGNOFF — code, mock API behavior, lint and build passed; real browser recognition, live Gemini behavior and UI-to-save interaction were not tested.
```

### Feature behavior and configuration limits

- The interface offers `en-IN`, `en-US`, `hi-IN`, `ur-PK`, and `kn-IN` as browser recognition locale hints. Actual speech-language availability and accuracy depend on the browser, operating system, permissions and speech provider and were not certified.
- The transcript must be 20–12,000 characters. Extraction requires the existing server-only `GEMINI_API_KEY`; no new environment variable or package dependency was introduced. If Gemini is unavailable, the endpoint fails closed without fabricating a local resume.
- The browser/OS speech provider may process audio externally. The app does not upload or persist audio. Only after explicit Extract & Review does the authenticated Express server send the transcript to Google Gemini; that provider's data policies apply.
- Before applying extracted content, the user must acknowledge that it will become a separate unsaved draft and that any unsaved content already in the editor will be replaced. An open saved resume is preserved and is not automatically overwritten.
- No FastAPI integration, `.env` change, database schema change or existing-resume update occurred in this phase.

### Files and backups

Source/documentation/test files changed: `server.ts`, `src/App.tsx`, `src/components/form/ResumeForm.tsx`, `package.json`, `README.md`, `tests/express.integration.test.mjs`, and this report. New files: `src/components/voice/VoiceResumeAssistant.tsx`, `src/utils/voiceResumeExtraction.ts`, and `tests/voice-resume-extraction.test.mjs`. No project source or documentation file was deleted. `dist/` is ignored generated build output and was regenerated by the first production build.

Before editing each existing file, timestamped backups were created outside the repository and hash-verified in:

- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\server.ts.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\src_App.tsx.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\src_components_form_ResumeForm.tsx.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\tests_express.integration.test.mjs.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\README.md.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\runtime-validation-report.md.pre-voice-20261030-153509.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\package.json.pre-voice-20261030-155200.bak`

To roll back one source file from CMD, copy its corresponding backup over the project file only after stopping the application and confirming that you want to discard that file's voice-feature changes; for example:

```cmd
copy /Y "C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\server.ts.pre-voice-20261030-153509.bak" "C:\project\resume-fixer-pro\server.ts"
```

Repeat with the matching backup and destination for another changed existing file. The three newly added files can be removed individually if rolling back the whole feature. Do not remove the repository or unrelated backups.

## Resume Revive Chatbot Voice Enhancement (2026-10-30)

The chatbot now reuses the same `SpeechRecognition` / `webkitSpeechRecognition` selector as Voice-to-Resume. The microphone places recognized final text in the existing editable chat input; the Send button remains separate and is never triggered by recognition. The user can stop or cancel recording, choose best-effort English/Hindi-Hinglish/Urdu/Kannada locale hints, retry recoverable errors, and see permission, unsupported-browser, no-speech and processing status messages. The UI discloses that browser speech services may process audio externally and that the app does not store recordings.

The initial chatbot greeting now explains typed and spoken chat and the resume-building workflow. The existing authenticated Gemini chat route receives the ongoing chat history and builder resume context. Its instructions now guide the assistant to ask about name, education, skills, work history or fresher status, projects and career objective; retain facts from conversation history; avoid asking answered questions; and never invent qualifications or metrics. After sufficient chat text/details, a user can explicitly request a source-grounded draft using the existing authenticated voice-extraction endpoint. Only user chat messages and existing resume field values are used as extraction sources. Applying requires an acknowledgement and loads a separate unsaved draft; the open saved record is not silently updated.

| Test | Result | Evidence / limitation |
|---|---|---|
| Text chatbot send and authenticated response | PASS | `npm.cmd run test:express` includes a normal authenticated chat request plus a multi-turn mocked resume-building conversation and verifies the guided reply. Gemini was mocked. |
| Microphone permission prompt and transcription | NOT TESTED | No real microphone interaction or browser permission grant was performed. `SpeechRecognition.start()` is invoked from the microphone button; provider behavior remains browser-dependent. |
| Edit recognized text and send | NOT TESTED | Code keeps recognized text in the normal controlled chat input and does not auto-send, but no authenticated browser click flow was run. |
| Recording stop/cancel and retry | NOT TESTED | Start/stop/abort, interim-result handling and retry UI are implemented; browser interaction was not exercised. |
| Permission-denied, unsupported browser, empty transcript, recognition errors | PARTIAL | Explicit user-facing handlers and no-speech validation are implemented. The shared utility’s native/prefixed API selection is unit-tested; actual browser error events were not simulated. |
| Mobile layout | PARTIAL | Input uses a responsive single-row flex layout, shrink-safe text input, compact buttons and the existing 400px chat panel; no mobile browser viewport test was run. |
| Resume Revive upload/paste and conversion | NOT TESTED | These existing paths were not changed; no UI upload/conversion workflow was exercised during this enhancement. |
| Existing Voice-to-Resume interaction | PARTIAL | Its speech API lookup now imports the shared utility, and extraction remains on its existing route. No actual microphone interaction was run. |
| Gemini chat/extraction integration | PASS (mock only) | `npm.cmd run test:express` verifies authenticated chat and voice extraction with the test-only Gemini mock. No live Gemini API call was made. |
| Express integration/regression suite | PASS | Final `npm.cmd run test:express`: 11 passed, 0 failed (5 unit tests, 6 Express integration cases). Suite used its guarded loopback MySQL test setup, local SMTP sink, Gemini mock and private FastAPI mock. |
| TypeScript lint/check | PASS | Final `npm.cmd run lint` exited 0 (`tsc --noEmit`). |
| Production build | PASS with warnings | Final `npm.cmd run build` exited 0. Existing Vite `__dirname` config-loader warning and large JavaScript chunk warning remain; build also reported plugin callback timing. |
| Database schema and existing records | UNCHANGED | No schema/migration edits. Express integration tests used generated disposable accounts and teardown verification; no existing user/resume was selected. |

```yaml
environment:
  node: AVAILABLE — node --version reported v24.20.0.
  browser: SHARED PAGE AT LOGIN — no authenticated user session was used.
  microphone: NOT TESTED — no real recording or browser permission request was made.
startup: PASS — isolated Express integration harness readiness check passed.
integration: PASS — exit_code: 0; passed: 11; failed: 0; includes mocked authenticated Gemini chat and transcript extraction.
browser: UNVERIFIED — no authenticated chat UI session was available for microphone, upload, conversion or mobile viewport checks.
overall: PARTIAL — implementation, mocked backend behavior, type-check and production build pass; real microphone/browser UI/Gemini behavior remains unverified.
```

Files changed for this chatbot enhancement: `src/components/ai/AIResumeConverterModal.tsx`, `src/App.tsx`, `src/components/voice/VoiceResumeAssistant.tsx`, `src/utils/browserSpeechRecognition.ts` (new), `server.ts`, `tests/express.integration.test.mjs`, `tests/voice-resume-extraction.test.mjs`, `README.md`, and this report. No files were deleted. Existing upload/paste conversion routes and the Gemini key handling were not changed.

Timestamped backups of each pre-existing file edited for this enhancement were created and hash-verified outside the repository:

- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\src_components_ai_AIResumeConverterModal.tsx.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\src_App.tsx.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\server.ts.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\src_components_voice_VoiceResumeAssistant.tsx.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\tests_express.integration.test.mjs.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\tests_voice-resume-extraction.test.mjs.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\README.md.pre-chatbot-voice-20261030-155400.bak`
- `C:\Users\USER\.copilot\session-state\9279266b-a1a8-4e49-96c8-add039876bb6\files\runtime-validation-report.md.pre-chatbot-voice-20261030-155400.bak`
