You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 9** of a desktop application called "Requester".

---

# GOAL

Improve validation and file consistency for the file-based request/response model.

This application uses files as the primary source of truth.
That means file parsing, normalization, validation, and safe persistence must be predictable and robust.

This phase must ensure that:
- malformed or incomplete `.req` files do not crash the app
- request files are normalized consistently
- save format is stable and canonical
- old or partial request files remain usable when possible
- invalid files fail safely with clear user-facing errors
- `.resp` reading is also safe and tolerant

This is still MVP work.
Do NOT add heavy schema/validation frameworks.

---

# TECH STACK

- Electron
- React
- TypeScript
- Vite

---

# ARCHITECTURE (STRICT — DO NOT VIOLATE)

- Renderer = UI only
- Main process = filesystem + HTTP
- IPC = only communication layer
- Renderer MUST NOT access filesystem directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- file-based requests (`.req`)
- file-based last response (`.resp`)
- request editor
- tabs
- dirty state
- request execution
- response viewer
- attachments
- UX hardening

Current request model is approximately:

{
"version": 1,
"name": "Request name",
"method": "GET",
"url": "",
"queryParams": [],
"headers": [],
"auth": { "type": "none" },
"body": { "type": "none" },
"requestOptions": { "followRedirects": true },
"attachments": []
}

Current response model is approximately:

{
"status": 200,
"statusText": "OK",
"headers": {
"content-type": "application/json"
},
"body": "...",
"durationMs": 123
}

---

# PHASE 9 SCOPE

Implement safe parsing, normalization, and canonical persistence for `.req` and safe tolerant reading for `.resp`.

Included:
- request file normalization
- request file validation
- canonical request save format
- safer request read behavior
- clear errors for invalid request files
- tolerant response file read behavior
- default/fallback handling for missing optional fields
- version normalization for current schema version

Not included:
- migration framework
- JSON schema library
- advanced version upgrade system
- encryption
- response history
- external watchers
- environment interpolation

---

# MAIN IDEA

The app should distinguish between:

## A. Recoverable / normalizable input
Examples:
- missing optional fields
- missing `attachments`
- missing `requestOptions`
- invalid array values replaced with defaults
- unknown extra fields ignored

These should be normalized safely.

## B. Clearly invalid request file
Examples:
- invalid JSON syntax
- root is not an object
- `version` is unsupported in a way the app cannot handle
- request structure is too broken to recover safely

These should fail clearly, without crashing the app.

---

# REQUIRED BEHAVIOR FOR `.REQ`

## 1. SAFE READ

When reading a `.req` file:

- parse JSON safely
- if parse fails:
  - return a clear structured error
  - do not crash app
- if JSON root is not an object:
  - treat as invalid request file
- normalize into current request document shape

---

## 2. NORMALIZATION RULES

Normalize request data into a stable in-memory shape.

### version
- if missing, treat as version 1 only if recovery is trivial
- if present and equal to 1, continue
- if unsupported version and not safely recoverable, return clear error

### name
- if missing or not a string, fall back to a reasonable default
  - for example file name without extension, or "Untitled request"

### method
- if missing or invalid, default to "GET"

### url
- if missing or invalid type, default to empty string

### queryParams
- if missing or not an array, default to []
- each item should normalize to:
  - key: string
  - value: string
- invalid rows may be filtered out or repaired simply

### headers
- if missing or not an array, default to []
- each item normalized similarly

### auth
- if missing or invalid, default to { type: "none" }
- support only current MVP auth types:
  - none
  - basic
  - bearer
- invalid auth types -> fallback to none

### body
- if missing or invalid, default to { type: "none" }
- support only current MVP body types
- invalid body -> fallback to none

### requestOptions
- if missing or invalid, default to:
  {
  "followRedirects": true
  }
- if timeoutMs exists and is valid, keep it
- otherwise use default if current code supports it

### attachments
- if missing or not an array, default to []
- each item normalized to:
  - fileName: string
  - relativePath: string
  - size: number (optional default to 0 if needed)
- invalid items filtered out

---

## 3. CANONICAL SAVE FORMAT

When saving `.req`:

- always write a stable canonical JSON shape
- include fields in a consistent order
- pretty-print JSON consistently
- only persist supported fields for version 1
- do not persist random transient UI-only state

Canonical order should be stable, for example:

1. version
2. name
3. method
4. url
5. queryParams
6. headers
7. auth
8. body
9. requestOptions
10. attachments

Keep this simple and explicit.

---

## 4. UNKNOWN FIELDS

If a request file contains extra unknown fields:

- do not crash
- ignore them during normalization
- it is acceptable if canonical save removes them

Prefer stable canonical persistence over preserving unknown junk.

---

# REQUIRED BEHAVIOR FOR `.RESP`

## 1. SAFE READ

When reading `.resp`:

- parse safely
- if file missing:
  - treat as "no last response"
- if parse fails:
  - do not crash request tab
  - ignore invalid `.resp` and treat as unavailable, or return a lightweight error state if current UI supports it

Keep `.resp` reading more tolerant than `.req`.

Reason:
- `.req` is core editable source of truth
- `.resp` is disposable cached output

---

## 2. NORMALIZATION

If `.resp` exists and is valid JSON object:

- normalize status to number if possible
- normalize statusText to string
- normalize headers to object
- normalize body to string
- normalize durationMs to number

If too malformed, discard safely.

Do not overengineer response normalization.

---

# ERROR HANDLING

Create clear structured errors for invalid request files.

Examples of user-facing messages:
- "Invalid request file: malformed JSON"
- "Invalid request file: unsupported version"
- "Invalid request file: expected JSON object"

Rules:
- do not expose raw stack traces in UI
- detailed logs in console are fine
- renderer should be able to display the error safely

Prefer a small error shape, for example:

{
"code": "INVALID_REQUEST_FILE",
"message": "Invalid request file: malformed JSON"
}

Use existing project style if one already exists.

---

# RENDERER BEHAVIOR

Renderer changes should stay minimal.

Expected behavior:
- opening a valid but incomplete `.req` should work after normalization
- opening an invalid `.req` should show a clear error state instead of crashing
- opening a request with missing or invalid `.resp` should still allow editing the request
- save should rewrite request into canonical stable shape

Do not move validation logic into renderer.

---

# IMPLEMENTATION LOCATION

Expected areas of change:

Main/shared:
- request normalization utility
- request validation utility
- response normalization utility
- file read/write helpers
- request read/save IPC flow

Renderer:
- minimal handling for request-open errors if not already present

Keep normalization logic centralized.
Do NOT duplicate normalization in multiple places.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Main/shared:
- shared/requestTypes.ts or equivalent
- shared/requestNormalization.ts
- shared/responseNormalization.ts
- services/fileService.ts
- request read/save IPC handlers

Renderer:
- request open error UI handling if needed

Do not add a heavy framework or many new layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT add zod, ajv, yup, or another heavy validation framework
- Do NOT add a migration framework
- Do NOT preserve unknown fields unless already trivially supported
- Do NOT move validation into React components
- Do NOT overengineer versioning
- Keep logic explicit and easy to read

---

# EDGE CASES

Handle safely:

- invalid JSON in `.req`
- JSON root is array/null/string
- missing version
- unsupported version
- missing name/method/url
- invalid queryParams/headers/auth/body/requestOptions/attachments types
- partial broken attachment items
- invalid `.resp`
- missing `.resp`
- save after reading normalized old/incomplete request

The app must not crash on any of these.

---

# IMPLEMENTATION STRATEGY

1. Create central request normalization function
2. Create central request validation/read result flow
3. Update request read path to use normalization + structured errors
4. Update request save path to always write canonical JSON
5. Create tolerant response read normalization
6. Ensure renderer handles invalid request file errors safely
7. Verify save round-trip consistency

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Test opening a valid normal request
3. Verify nothing breaks

4. Create a `.req` missing optional fields
5. Verify it opens and is normalized correctly

6. Create a `.req` with malformed JSON
7. Verify the app shows a clear error and does not crash

8. Create a `.req` with wrong field types
9. Verify safe fallback/default normalization

10. Save a normalized request
11. Verify saved JSON is canonical and stable

12. Create an invalid `.resp`
13. Verify request still opens and UI does not crash

14. Execute a request again
15. Verify `.resp` is rewritten correctly

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
