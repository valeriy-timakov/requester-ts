You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 5** of a desktop application called "Requester".

---

# GOAL

Implement MVP hardening and usability polish for the desktop app.

This phase is NOT about adding major new features.
It is about making the existing MVP safer and more usable.

The system must:
- protect unsaved changes
- improve tab lifecycle behavior
- add keyboard shortcuts for core actions
- integrate core actions into the application menu
- improve user-visible error handling
- keep architecture simple and consistent

---

# TECH STACK

- Electron
- React
- TypeScript
- Vite

---

# ARCHITECTURE (STRICT — DO NOT VIOLATE)

- Renderer = UI only
- Main process = filesystem + HTTP + native dialogs/menu
- IPC = only communication layer
- Renderer MUST NOT access filesystem directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- project root folder handling
- tree sidebar
- tree CRUD
- request tabs
- dirty state
- manual save
- HTTP execution in main process
- response viewer
- attachments support

The application is file-based:

- root folder = project
- folders = collections
- request = `.req`
- response = `.resp`
- attachments live next to `.req`

---

# PHASE 5 SCOPE

Implement polish and safety behavior for the current MVP.

Included:
- confirmation before closing dirty tab
- confirmation before deleting items that affect dirty tabs
- confirmation before app/window close when dirty tabs exist
- keyboard shortcuts:
  - Save
  - Send
  - Close tab
- menu integration for core actions
- renderer-visible error messages for failed actions
- basic empty states and loading states where missing
- keep active tab and tree behavior consistent

Not included:
- autosave
- undo/redo
- session restore
- history
- environments
- command palette
- notifications framework
- complex window management

---

# REQUIRED BEHAVIOR

## 1. DIRTY TAB CLOSE PROTECTION

When user tries to close a tab with unsaved changes:

- show confirmation dialog
- options:
  - Save
  - Discard
  - Cancel

Behavior:
- Save -> save tab, then close if save succeeds
- Discard -> close without saving
- Cancel -> do nothing

This must work for:
- clicking tab close button
- closing tab via keyboard shortcut
- programmatic tab close caused by delete/rename flows if relevant

Do not implement autosave.

---

## 2. DELETE SAFETY

When deleting a request or folder from tree:

- if no affected dirty tabs exist:
  - proceed normally
- if affected dirty tabs exist:
  - show confirmation dialog before delete

Use a simple message, for example:
- "Some affected requests have unsaved changes. Delete anyway?"

Options:
- Delete
- Cancel

If user confirms:
- proceed with delete
- close affected tabs

Do not add complicated multi-step flows.

---

## 3. APP/WINDOW CLOSE PROTECTION

When the user closes the application window and there are dirty tabs:

- block immediate close
- ask for confirmation

Simple options:
- Quit without saving
- Cancel

Optional:
- Save all and quit, only if trivial with existing architecture

If Save all adds too much complexity, do NOT implement it.
Prefer:
- Quit without saving
- Cancel

Main process should handle window close interception.
Renderer may expose a thin IPC method to ask whether dirty tabs exist.

---

## 4. KEYBOARD SHORTCUTS

Implement core shortcuts:

- Save:
  - Cmd+S on macOS
  - Ctrl+S on Windows/Linux

- Send request:
  - Cmd+Enter on macOS
  - Ctrl+Enter on Windows/Linux

- Close tab:
  - Cmd+W on macOS
  - Ctrl+W on Windows/Linux

Behavior:
- shortcuts should operate on the active tab only
- if there is no active tab, shortcut should do nothing
- if active tab action is not applicable, do nothing safely

Do not implement shortcut complexity beyond these basics.

---

## 5. APPLICATION MENU INTEGRATION

Add or update application menu entries for core actions.

Expected actions:
- File
  - Open Folder
  - Save
  - Close Tab
- Request
  - Send
- Edit
  - keep default roles if already present

Rules:
- menu actions should call the same app flows as buttons/shortcuts
- do not duplicate logic separately in menu handlers
- use existing Electron menu patterns if already present

If there is already a menu, extend it minimally.

---

## 6. ERROR HANDLING

Improve user-visible error handling for existing actions:

- request read failure
- save failure
- execute failure
- attachment add/remove failure
- delete/rename failure

Rules:
- renderer should show simple inline or panel-level error messages
- keep messages short and readable
- do not expose raw stack traces in UI
- logging in console is fine for debugging
- do not introduce a global toast library

A simple error area near the editor/response panel is enough.

---

## 7. EMPTY STATES / LOADING STATES

Add minimal UX polish where missing:

- if no tab is open:
  - show simple empty state in main editor area
- when request is executing:
  - show clear loading state on Send button and/or response area
- if response is missing:
  - show simple placeholder
- if tree is empty:
  - show simple empty state in sidebar

Keep all states visually simple.

---

## 8. CONSISTENT ACTIVE TAB / TREE BEHAVIOR

Ensure these behaviors are correct:

- opening an already open request focuses the existing tab
- after closing active tab:
  - activate a nearby tab if one exists
  - otherwise show empty state
- after deleting an open request:
  - close its tab
- after deleting a folder:
  - close all descendant tabs
- after rename:
  - update affected tab paths/titles correctly

This phase is a good moment to fix inconsistencies if they already exist.

---

# IPC / MAIN PROCESS CHANGES

Add only thin IPC where needed.

Possible additions:

- app:hasDirtyTabs()
- app:confirmCloseDirtyTabs()
- app:confirmDeleteDirtyAffected()
- menu-triggered events routed into renderer
- existing save/send handlers reused

Use the minimum IPC needed to support:
- native dialogs
- window close interception
- menu action forwarding

Do not build a command bus or event framework.

---

# RENDERER CHANGES

Expected renderer work:

- centralize active tab actions:
  - save active tab
  - send active tab
  - close active tab
- expose dirty-tab info if main process needs it for close protection
- add simple error state handling
- add empty states
- ensure close flows respect confirmation behavior

Prefer one app-level place for these flows rather than scattering logic across components.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Main process:
- menu setup file (extend existing one)
- window close handling in main window setup
- ipc handlers for dialog/close coordination if needed

Renderer:
- app shell / tabs container
- request editor integration
- response viewer integration
- simple shared action handlers for:
  - save active tab
  - send active tab
  - close active tab
- minimal error/empty state UI

Do not introduce unnecessary architecture layers or large new modules.

---

# IMPORTANT CONSTRAINTS

- Do NOT implement autosave
- Do NOT add Redux/Zustand or another global state library
- Do NOT add a notification framework
- Do NOT add undo/redo
- Do NOT build a generalized action bus
- Do NOT move logic into React presentational components
- Keep code minimal and practical

---

# EDGE CASES

Handle safely:

- save shortcut with no active tab
- send shortcut with no active tab
- close shortcut with no active tab
- dirty tab close where save fails
- delete request/folder with affected dirty tabs
- app close with dirty tabs
- execution already in progress
- errors occurring during menu-triggered actions

If an action is not applicable, fail safely and do nothing.

---

# IMPLEMENTATION STRATEGY

1. Centralize active-tab actions in renderer
2. Add dirty-tab close confirmation flow
3. Add delete safety for dirty affected tabs
4. Add app/window close protection
5. Add keyboard shortcuts
6. Add menu integration
7. Add simple error and empty states
8. Verify active tab lifecycle consistency

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Open at least two requests in tabs
3. Modify one request without saving
4. Verify:
  - closing dirty tab asks for confirmation
  - Cancel keeps tab open
  - Discard closes without saving
  - Save closes only after successful save
5. Try deleting a request/folder affecting dirty tabs
6. Verify confirmation appears and affected tabs are handled correctly
7. Try closing the app window with dirty tabs
8. Verify close protection works
9. Verify shortcuts:
  - Save
  - Send
  - Close tab
10. Verify menu items call the same flows
11. Verify empty states and loading states are visible and correct
12. Verify no renderer filesystem access was introduced

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
