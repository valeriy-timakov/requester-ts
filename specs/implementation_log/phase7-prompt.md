You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 7** of a desktop application called "Requester".

---

# GOAL

Complete HTTP request execution so that the MVP can reliably send real requests using the request data edited in the UI.

This phase is about execution completeness and compatibility with the existing request model.

The system must correctly support:
- URL building with query params
- headers
- auth injection
- request body handling
- redirect behavior
- timeout handling
- safer response reading
- stable execution error handling

This phase is still MVP-focused.
Do NOT introduce advanced protocol features.

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
- Renderer MUST NOT access network directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- file-based requests (`.req`)
- response saving (`.resp`)
- request editor
- tabs
- dirty state
- request execution in basic form
- response viewer
- attachments metadata support
- UX hardening

Current request model:

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

---

# PHASE 7 SCOPE

Implement robust execution behavior for the current MVP request model.

Included:
- URL + query param composition
- header normalization and filtering
- auth handling (none/basic/bearer)
- body handling for supported body types
- redirect option support
- timeout support
- safer response body reading
- stable execution errors returned to renderer
- `.resp` persistence consistency

Not included:
- OAuth flows
- GraphQL
- WebSocket
- cookies jar
- environment variables
- streaming responses
- response history
- retry engine
- multipart/form-data builder UI
- advanced TLS/proxy options

---

# SUPPORTED REQUEST FEATURES

## 1. METHOD

Support standard HTTP methods at least:

- GET
- POST
- PUT
- PATCH
- DELETE
- HEAD
- OPTIONS

No special per-method abstractions needed.

---

## 2. URL + QUERY PARAMS

Build final request URL in main process.

Rules:
- start from `url`
- append query params from `queryParams`
- ignore rows with empty key
- allow empty values
- preserve existing URL path
- if URL already contains query string, merge safely
- invalid URL should produce a clean execution error

Do not build URL in renderer.

---

## 3. HEADERS

Apply headers from request model.

Rules:
- ignore rows with empty key
- later duplicate keys may override earlier ones, or preserve last write wins
- keep logic simple and deterministic
- avoid sending obviously broken empty header names

Do not add complex validation.

---

## 4. AUTH

Support:

### none
- no auth header added

### basic
- add Authorization: Basic ...
- base64(username:password)

### bearer
- add Authorization: Bearer <token>

Rules:
- if auth type requires fields but they are empty, still behave predictably
- do not add OAuth support
- if user manually set Authorization header in headers list, choose one clear rule:
  - either explicit auth overwrites header
  - or existing header wins
    Pick one rule, apply it consistently, and document it briefly in code comments

Prefer simple deterministic behavior.

---

## 5. BODY

Support body types:

- none
- raw

### none
- send no request body

### raw
- send string body as-is

Optional simple support:
- if body model already contains content type metadata, apply it
- otherwise do not invent a new complex schema

Rules:
- GET/HEAD with body should not crash
- keep behavior predictable and simple

Do not implement JSON validation or formatting.

---

## 6. ATTACHMENTS

Do NOT implement full multipart execution in this phase unless trivial and already supported by current model.

Attachments are currently metadata only.

Rules:
- keep execution code structured so multipart can be added later
- do not add multipart editor UI here
- do not invent a heavy abstraction for future multipart support

If the current body model already has a trivial multipart path, follow the existing pattern only.
Otherwise leave attachments unused during execution for now.

---

## 7. REQUEST OPTIONS

Support:

### followRedirects
- true -> normal fetch redirect following
- false -> do not follow redirects

### timeoutMs
If requestOptions currently lacks timeout, you may extend it minimally with:

{
"followRedirects": true,
"timeoutMs": 30000
}

Rules:
- keep timeout optional
- use AbortController in main process
- return a clean timeout error if exceeded

Do not add many more request options.

---

# RESPONSE HANDLING

Execution result should remain simple and stable.

Expected returned response shape:

{
"status": 200,
"statusText": "OK",
"headers": {
"content-type": "application/json"
},
"body": "...",
"durationMs": 123
}

Also continue saving `.resp` next to `.req`.

Rules:
- overwrite existing `.resp`
- keep JSON structure simple
- keep renderer response viewer compatible

---

# RESPONSE BODY READING

Read response safely in main process.

Rules:
- for MVP, read as text
- do not crash on empty body
- do not attempt binary preview
- be careful with very large responses

Implement a reasonable response size protection if simple to do, for example:
- read text normally but cap stored body length if needed
- or document a simple size limit in code comments

Do not overengineer.
The goal is to avoid obvious crashes.

---

# ERROR HANDLING

Execution must return clear user-facing errors.

Handle at least:

- invalid URL
- network failure
- aborted request / timeout
- unsupported request data shape
- internal execution failure

Rules:
- renderer should receive clean error message
- do not expose raw stack traces in UI
- logging in main console is fine

Keep error objects simple and consistent.

Possible pattern:

{
"ok": false,
"error": {
"message": "Request timed out"
}
}

or use the existing app style if one already exists.

Be consistent with current codebase style.

---

# IPC API

Keep IPC minimal.

Primary call remains:

- request:execute(path)

Possible behavior:
- read current request from disk and execute it
  or
- execute current draft document if that is already the existing app flow

Choose the approach that matches the current architecture.

Important:
- do not duplicate state
- do not move execution assembly into renderer

If the current app already sends the draft document through IPC for execution, keep that pattern.
If execution currently reads from disk by path, keep it consistent.

Do not redesign the whole flow.

---

# MAIN PROCESS IMPLEMENTATION

Expected areas of change:

- services/httpClient.ts
- request execution service
- request option normalization
- response persistence logic
- execution-related IPC handler

Keep execution assembly in one simple place.

Suggested internal steps:
1. normalize request document
2. build final URL
3. build headers
4. inject auth
5. build body
6. prepare timeout/redirect fetch options
7. execute request
8. read response
9. save `.resp`
10. return result

Do not split this into unnecessary layers.

---

# RENDERER INTEGRATION

Renderer changes should be minimal.

Expected behavior:
- existing Send button continues to work
- loading state works correctly
- success response still displays
- error state displays cleanly
- no renderer network logic introduced

If timeout option is added to requestOptions, expose it in editor only if trivial.
If not trivial, keep a default normalized timeout in main process for now.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Main process:
- services/httpClient.ts
- services/requestExecutionService.ts (or existing equivalent)
- ipc/request.execute.ts
- shared request/response type normalization if needed

Renderer:
- minimal changes only if needed for timeout option or error display compatibility

Do not introduce new architecture layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT add Axios unless absolutely necessary
- Prefer native fetch in Node/Electron if already available
- Do NOT implement multipart editor here
- Do NOT add global state libraries
- Do NOT move execution logic into renderer
- Do NOT add a plugin system or strategy framework
- Keep code minimal and practical

---

# EDGE CASES

Handle safely:

- invalid URL
- empty URL
- URL already contains query string
- duplicate headers
- empty header rows
- empty query param rows
- timeout exceeded
- redirect disabled with 3xx response
- empty response body
- HEAD request
- dirty tab vs saved file execution flow consistency

If execution uses saved file state, behavior must remain predictable.
If execution uses in-memory draft state, keep that consistent too.

Do not create hidden autosave behavior.

---

# IMPLEMENTATION STRATEGY

1. Normalize request options
2. Implement URL builder with query params
3. Implement headers filtering/normalization
4. Implement auth injection
5. Implement raw body handling
6. Implement timeout with AbortController
7. Improve response reading and persistence
8. Ensure clean error shape
9. Verify renderer compatibility

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Test a GET request with query params against a real endpoint
  - example: https://httpbin.org/get
3. Verify:
  - query params are applied correctly
  - response is shown
  - `.resp` is saved

4. Test custom headers
5. Verify headers are sent correctly

6. Test bearer auth
7. Verify Authorization header is sent correctly

8. Test basic auth
9. Verify it behaves correctly

10. Test POST with raw body
11. Verify body is sent correctly

12. Test redirect behavior with followRedirects true/false
13. Verify behavior is correct

14. Test timeout using a slow endpoint
15. Verify timeout error is shown cleanly

16. Verify renderer still performs no network access directly

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
