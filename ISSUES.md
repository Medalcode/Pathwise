# Known Issues and Debt (Frontend)

Last updated: 2026-02-05

This list tracks concrete breakpoints in the user flow. It is intentionally non-exhaustive and focused on user-impacting failures.

## Critical (P0)

1. Upload flow does not reach the backend. The active upload input is `cvFile` handled by `CVProcessor`, while the API upload function expects `cvUpload` and is never called.
2. Parsing failure falls back to mock data without explicit user acknowledgement, resulting in false success states.
3. PDF preview can fail silently when PDF.js is unavailable or rendering errors occur, leaving the user without feedback.
4. Parsing can hang indefinitely without timeout or cancelation, leaving progress stuck.

## High (P1)

5. Preview rendering assumes `data.personalInfo` exists; malformed payloads break the preview without graceful error state.
6. Navigation gate allows Step 2+ if any cached profile exists, even if current upload failed, leading to stale data usage.
7. If the user does not explicitly save after preview, `currentProfile` may remain stale while UI moves forward.
8. Profile switching parses string IDs as integers, causing failures for `local_*` or `default-profile` IDs.
9. Kanban load path uses `JSON.parse` without protection; corrupted localStorage breaks the board.
10. Kanban save path does not handle storage failures (quota/private mode), leading to silent data loss after refresh.

## Medium (P2)

11. Job detail view depends on `window.currentSearchJobs`; when missing, the user sees no UI error.
12. Clipboard copy for cover letters does not handle permission failures, but shows success UI regardless.

