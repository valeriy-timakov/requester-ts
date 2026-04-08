You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 8** of a desktop application called "Requester".

---

# GOAL

Polish the response viewer so it becomes practical for real MVP usage.

The response viewer already exists in basic form.
This phase must improve readability and usability of the last response without turning it into a complex inspection tool.

The system must present response data clearly and simply:
- status
- status text
- duration
- headers
- body
- response metadata such as content type and size when available

This is still MVP work.
Do NOT add advanced inspectors or history.

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

- file-based `.req` / `.resp`
- request editor
- tabs
- dirty state
- request execution
- `.resp` persistence
- basic response viewer
- attachments support
- UX hardening

Current response object returned from execution is approximately:

{
"status": 200,
"statusText": "OK",
"headers": {
"content-type": "application/json"
},
"body": "...",
"durationMs": 123
}

The last response is saved to `.resp` next to `.req`.

---

# PHASE 8 SCOPE

Improve response viewer usability.

Included:
- clearer response summary
- better header presentation
- better body presentation
- simple content type handling
- response size display
- basic JSON pretty display if response body is JSON
- raw/plain fallback
- copy actions for body and headers
- better empty/loading/error states

Not included:
- response history
- diff viewer
- binary preview
- image preview
- HTML preview
- streaming viewer
- syntax highlighting library if it adds complexity
- tabs inside response panel unless already trivial

---

# REQUIRED UI BEHAVIOR

## 1. RESPONSE SUMMARY

Display a compact summary area with:

- status code
- status text
- duration in ms
- content type (if present)
- body size (if available or easy to compute)

Example:

- 200 OK
- 123 ms
- application/json
- 4.2 KB

Keep it simple and readable.

---

## 2. HEADERS VIEW

Display response headers in a simple structured way.

Requirements:
- collapsible section is acceptable
- show key/value pairs clearly
- stable ordering if easy:
  - either preserve received order if already available
  - or sort alphabetically
    Choose one simple rule and keep it consistent

Add:
- "Copy headers" action

Do not add header search/filter.

---

## 3. BODY VIEW

Display body as text with better formatting behavior.

### If response is JSON:
- try to parse body as JSON only when content-type suggests JSON
  OR when parsing is trivially successful
- display pretty-printed JSON text
- do not add a full JSON tree viewer
- do not add editing

### Otherwise:
- display raw text body as-is

Requirements:
- preserve whitespace reasonably
- support long text without breaking layout
- allow scrolling
- show placeholder for empty body

Add:
- "Copy body" action

Do not implement syntax highlighting if it complicates the code.
Plain formatted text is enough.

---

## 4. RESPONSE SIZE

Display body size in a simple human-readable form if easy to compute.

Examples:
- 512 B
- 2.1 KB
- 1.4 MB

Use UTF-8 byte length approximation if needed.
Keep implementation simple.

---

## 5. EMPTY / LOADING / ERROR STATES

Improve viewer states:

### No response yet
Show simple placeholder:
- "No response yet"

### During request execution
Show simple loading state:
- "Sending request..."
  or equivalent

### Execution error
Show clear error block with short message

Do not show stack traces in UI.

---

## 6. COPY ACTIONS

Add:
- Copy body
- Copy headers

Rules:
- use simple clipboard access appropriate for Electron renderer
- if clipboard access already exists via browser API and is acceptable in renderer, use existing simplest safe pattern
- otherwise route through IPC only if necessary

Do not overengineer a clipboard abstraction.

---

# OPTIONAL READ-FROM-DISK SUPPORT

If the app already supports reopening a request and reading its last `.resp`, improve that flow if trivial.

Possible behavior:
- when a request tab is opened, try loading adjacent `.resp`
- display it in viewer if present

Only do this if it fits the existing architecture naturally.
Do NOT redesign tab loading around it.

If not already present, this can be omitted.

---

# DATA SHAPE

You may extend response metadata slightly if useful, for example:

{
"status": 200,
"statusText": "OK",
"headers": {
"content-type": "application/json"
},
"body": "...",
"durationMs": 123,
"contentType": "application/json",
"bodySizeBytes": 4312
}

However:
- keep backward compatibility if easy
- do not overcomplicate persistence

If these values can be derived in renderer simply, do not force main process changes.

---

# COMPONENT STRUCTURE

Keep it simple.

Possible structure:

- ResponseViewer.tsx
  - ResponseSummary.tsx
  - ResponseHeaders.tsx
  - ResponseBody.tsx

You may also keep it in one file if that is simpler.

Avoid deep hierarchies and unnecessary abstractions.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Renderer:
- components/ResponseViewer.tsx
- optional small subcomponents for summary / headers / body
- utility for:
  - JSON pretty formatting
  - size formatting
  - header-to-text conversion

Main process:
- only minimal changes if needed for extra metadata
- do not redesign response persistence

Do not introduce new architecture layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT add response history
- Do NOT add Monaco or heavy code editors
- Do NOT add a syntax highlighting framework unless already present and trivial to use
- Do NOT add global state libraries
- Do NOT add binary/image/html specialized viewers
- Keep UI minimal and practical

---

# EDGE CASES

Handle safely:

- empty response body
- invalid JSON body with JSON-like content-type
- missing content-type header
- very long text response
- HEAD request with no body
- response with many headers
- copy action when body/headers are empty
- response viewer shown before any execution

UI must not crash.

---

# IMPLEMENTATION STRATEGY

1. Improve response summary area
2. Add content type and body size display
3. Improve headers presentation
4. Improve body display with JSON pretty formatting fallback
5. Add copy actions
6. Improve empty/loading/error states
7. Verify layout with long responses

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Send a JSON response request
  - example: https://httpbin.org/json
3. Verify:
  - status is shown
  - duration is shown
  - content type is shown
  - size is shown
  - body is pretty-printed if JSON

4. Send a plain text response request
5. Verify raw text is shown correctly

6. Send a request with empty body response
7. Verify placeholder / empty handling is correct

8. Test copy body
9. Test copy headers

10. Test long response body
11. Verify layout remains usable

12. Verify no renderer filesystem access was introduced

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
