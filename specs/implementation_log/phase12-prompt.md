You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 12** of a desktop application called "Requester".

---

# GOAL

Perform final MVP QA, cleanup, and consistency fixes so the application can be considered a stable MVP.

This is the final MVP phase.
It is about tightening the implementation, removing obvious rough edges, verifying key flows end-to-end, and simplifying anything that became unnecessarily complex.

This phase must:
- verify the main user flows end-to-end
- fix bugs and inconsistencies found during QA
- remove obvious dead or redundant code if safe
- simplify overly complex parts if any appeared during earlier phases
- leave the MVP stable, coherent, and easy to maintain

Do NOT add major new features in this phase.

---

# TECH STACK

- Electron
- React
- TypeScript
- Vite

---

# ARCHITECTURE (STRICT — DO NOT VIOLATE)

- Renderer = UI only
- Main process = filesystem + HTTP + native integration
- IPC = only communication layer
- Renderer MUST NOT access filesystem directly
- Keep business logic out of presentational React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

MVP features already implemented:

- root folder handling
- tree reading and CRUD
- request tabs
- dirty state
- manual save
- request execution
- response viewer
- attachments
- UX safety / confirmations
- request/response normalization
- lifecycle polish
- production packaging readiness

The app is a local file-based API client:
- root folder = project
- folders = collections
- `.req` = request
- `.resp` = last response
- attachments live next to `.req`

---

# PHASE 12 SCOPE

Final MVP cleanup and QA.

Included:
- end-to-end verification of core user flows
- fix discovered bugs
- fix inconsistent UI or state behavior
- remove dead/redundant code if clearly safe
- simplify unnecessarily complex code paths
- tighten error handling where obviously weak
- ensure packaged and dev builds both behave correctly
- add short developer documentation for MVP usage if missing
- add a concise MVP checklist if useful

Not included:
- new major features
- autosave
- environments
- history
- cloud sync
- plugin systems
- full test framework buildout unless already trivial

---

# CORE USER FLOWS TO VERIFY

## 1. App startup
- default root folder works
- empty state works

## 2. Root switching
- choose another folder
- dirty-tab protection works
- old tabs clear correctly

## 3. Tree CRUD
- create collection
- create request
- rename request
- rename folder
- delete request
- delete folder

## 4. Tabs
- open request
- focus existing tab if already open
- close tab
- dirty tab confirmation
- nearby tab activation after close

## 5. Request editing
- method
- URL
- query params
- headers
- auth
- body
- request options

## 6. Save / reload
- manual save
- reopen request
- canonical file persistence

## 7. Execution
- send request
- loading state
- success response
- error response / network failure
- redirect handling
- timeout handling

## 8. Response viewer
- summary
- headers
- body
- JSON formatting
- copy actions
- empty/error states

## 9. Attachments
- add attachment
- persisted metadata
- remove attachment
- safe file deletion behavior

## 10. External lifecycle cases
- missing request file
- missing root folder
- invalid `.req`
- invalid `.resp`

## 11. Production smoke test
- packaged app still performs core flows

---

# REQUIRED WORK

## 1. FIX BUGS FOUND DURING QA

As you verify flows, fix issues directly.

Examples:
- incorrect dirty state updates
- stale tab paths after rename
- inconsistent tree refresh
- broken empty states
- editor/response mismatch
- menu shortcut mismatch
- save/execute edge cases
- missing error display
- packaged-only path bug

Keep fixes minimal and focused.

---

## 2. REMOVE CLEARLY DEAD / REDUNDANT CODE

If obvious dead code or duplicated paths exist and can be safely removed:
- remove them
- keep behavior unchanged

Do not perform broad refactoring.

---

## 3. SIMPLIFY OVERCOMPLEX CODE

If some part became unnecessarily abstract during earlier phases:
- simplify it only if safe and local

Examples:
- duplicate normalization paths
- duplicated active-tab action logic
- duplicated tree refresh logic

Do not redesign the whole app.

---

## 4. FINAL CONSISTENCY PASS

Ensure these remain true:

- renderer never touches filesystem directly
- main process owns filesystem and HTTP
- IPC stays thin
- no autosave introduced accidentally
- tabs remain source of truth for in-memory draft editing
- save remains explicit
- tree is refreshed from main, not guessed in renderer

---

## 5. MINIMAL DOCUMENTATION

If missing, add a short lightweight developer-oriented document, for example:
- how the file model works
- how main/renderer responsibilities are split
- what MVP supports and does not support
- how to run dev build and production package

Keep it concise.
Do not write a large manual.

Possible file:
- `README.md`
  or
- `docs/mvp-notes.md`

Only if documentation is missing or too incomplete.

---

# IMPORTANT CONSTRAINTS

- Do NOT add new major features
- Do NOT add autosave
- Do NOT add a new global state library
- Do NOT perform large refactors
- Do NOT add a heavy test framework unless already present and trivial to extend
- Keep cleanup practical and minimal

---

# QA APPROACH

Perform a structured end-to-end checklist and fix issues you find.

Preferred order:
1. dev build flows
2. file/model edge cases
3. packaged smoke test
4. final cleanup

Do not stop after first success.
Actually verify the important MVP flows.

---

# VERIFICATION (MANDATORY)

After implementation, verify at minimum:

1. App startup with default root
2. Create collection and request
3. Open request in tab
4. Edit request fields
5. Dirty state updates correctly
6. Save request
7. Reload request and verify persistence
8. Execute GET request with query params
9. Execute POST request with raw body
10. Verify response viewer
11. Add and remove attachment
12. Rename and delete files/folders
13. Switch root with dirty tab protection
14. Open malformed `.req` and verify safe error
15. Open with invalid `.resp` and verify safe fallback
16. Run packaged app smoke test

Fix issues found before finishing.

---

# OUTPUT FORMAT

- Provide:
  1. code/config/doc changes grouped by file
  2. concise list of bugs/issues found and fixed
  3. concise final MVP checklist status
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
