You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 6** of a desktop application called "Requester".

---

# GOAL

Complete the request editor so that it supports all essential request fields for MVP.

The editor must allow full editing of:
- method
- URL
- query parameters
- headers
- basic authentication
- request body (basic types)
- request options (minimal)

This phase focuses ONLY on editor completeness.
Do NOT introduce new architecture or advanced features.

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
- Renderer MUST NOT access filesystem or network directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- file-based structure (.req / .resp)
- request loading and saving
- tabs
- dirty state
- execution (Phase 3)
- attachments (Phase 4)
- UX hardening (Phase 5)

Request model:

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

# PHASE 6 SCOPE

Implement full editor UI for request fields.

Included:
- method selector
- URL input
- query params editor
- headers editor
- basic auth editor
- body editor (minimal)
- request options (minimal)

Not included:
- OAuth
- environment variables
- advanced body builders
- GraphQL
- WebSocket
- validation frameworks
- autosave

---

# UI REQUIREMENTS

## 1. METHOD + URL

- dropdown for HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- text input for URL
- editing updates draftDocument

---

## 2. QUERY PARAMS EDITOR

Simple table-like UI:

Each row:
- key
- value

Operations:
- add row
- remove row
- edit key/value

Rules:
- no need for enable/disable toggle
- empty rows are allowed but should not break execution

---

## 3. HEADERS EDITOR

Same structure as query params:

Each row:
- key
- value

Operations:
- add / remove / edit

Do not implement:
- header presets
- validation rules
- grouping

---

## 4. AUTH (MVP ONLY)

Support ONLY:

- none
- basic
- bearer

### UI behavior:

If type = "none":
- show nothing

If type = "basic":
- username input
- password input

If type = "bearer":
- token input

### Data format:

auth:
{
"type": "basic",
"username": "...",
"password": "..."
}

or

{
"type": "bearer",
"token": "..."
}

---

## 5. BODY EDITOR (MINIMAL)

Support:

- none
- raw

UI:

- selector: none / raw
- if raw:
  - textarea for body content

Optional (simple, not required):
- dropdown for content-type (e.g. application/json, text/plain)

Rules:
- no JSON validation required
- no formatting required

---

## 6. REQUEST OPTIONS

Only support:

- followRedirects (boolean)

UI:
- simple checkbox

---

# STATE INTEGRATION (IMPORTANT)

All editing must operate on:

- `draftDocument` in active tab

Do NOT:
- store local component state separately from tab
- duplicate request data across components

Pattern:

onChange -> update tab.draftDocument -> recompute isDirty

---

# DIRTY STATE

Dirty state must update correctly when:

- method changes
- URL changes
- query params change
- headers change
- auth changes
- body changes
- requestOptions change

Use existing dirty tracking approach (deep compare or equivalent).

---

# EXECUTION COMPATIBILITY

Ensure editor data matches execution logic:

- queryParams must be usable for URL building
- headers must be usable for request
- auth must be injectable in main process
- body raw must be usable as request body

Do NOT modify execution logic unless necessary for compatibility.

---

# COMPONENT STRUCTURE

Keep components simple and flat.

Possible structure:

- RequestEditor.tsx
  - MethodUrlSection
  - QueryParamsSection
  - HeadersSection
  - AuthSection
  - BodySection
  - OptionsSection

You MAY split into small components, but avoid deep hierarchies.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Renderer:

- components/RequestEditor.tsx (extend)
- components/QueryParamsEditor.tsx
- components/HeadersEditor.tsx
- components/AuthEditor.tsx
- components/BodyEditor.tsx
- components/RequestOptionsEditor.tsx

Shared:

- request type definitions (if needed)

Do not introduce new architectural layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT introduce form libraries
- Do NOT add global state libraries
- Do NOT implement validation frameworks
- Do NOT move logic to main process
- Do NOT overengineer UI
- Keep everything simple and explicit

---

# EDGE CASES

Handle safely:

- empty query param rows
- empty headers
- switching auth types
- switching body types
- removing all fields
- malformed existing data in `.req`

Editor must not crash on bad data.

---

# IMPLEMENTATION STRATEGY

1. Add method + URL editing
2. Add query params editor
3. Add headers editor
4. Add auth editor
5. Add body editor
6. Add request options
7. Ensure dirty state works for all fields
8. Verify execution compatibility

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Open a request
3. Modify:
  - method
  - URL
  - query params
  - headers
  - auth
  - body
4. Verify:
  - UI updates correctly
  - dirty state updates correctly
5. Save request
6. Reload request
7. Verify all fields persist correctly
8. Execute request
9. Verify:
  - query params are applied
  - headers are applied
  - auth is applied
  - body is sent correctly

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
