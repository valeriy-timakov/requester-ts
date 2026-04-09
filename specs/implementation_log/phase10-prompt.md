You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 10** of a desktop application called "Requester".

---

# GOAL

Polish project and file lifecycle behavior so the app behaves predictably when working with the root folder, switching projects, refreshing tree state, and handling missing/moved files.

This phase is about lifecycle safety and consistency.
It is NOT about adding new major features.

The system must:
- handle root folder lifecycle safely
- handle switching project root safely
- protect dirty tabs before root switch
- keep tree and tabs consistent when files disappear or change
- provide simple manual refresh where useful
- remain fully file-based and architecture-consistent

---

# TECH STACK

- Electron
- React
- TypeScript
- Vite

---

# ARCHITECTURE (STRICT — DO NOT VIOLATE)

- Renderer = UI only
- Main process = filesystem + HTTP + native dialogs
- IPC = only communication layer
- Renderer MUST NOT access filesystem directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- root folder handling
- tree sidebar
- tree CRUD
- request tabs
- dirty state
- manual save
- request execution
- response viewer
- attachments
- UX hardening
- request/response normalization and validation

The app is file-based:
- root folder = project
- folders = collections
- `.req` = request
- `.resp` = last response
- attachments live next to `.req`

---

# PHASE 10 SCOPE

Implement project/file lifecycle polish.

Included:
- safe root folder initialization
- safe open/switch root flow
- dirty-tab protection before switching root
- clear behavior when root folder becomes unavailable
- manual tree refresh
- safe handling of missing request files while tabs are open
- consistent tab cleanup when current project changes

Not included:
- file watchers
- external live sync
- session restore
- recent projects list
- background reloading
- conflict resolution engine

---

# REQUIRED BEHAVIOR

## 1. DEFAULT ROOT FOLDER INITIALIZATION

The app default root folder is:

`~/requester`

Behavior:
- if it does not exist, create it in main process when needed
- initialization should be safe and idempotent
- app must not crash if folder creation fails
- if creation fails, show a clear error and allow user to choose another folder

Do not move this logic to renderer.

---

## 2. OPEN / SWITCH ROOT FOLDER

When the user selects another root folder:

- if there are no dirty tabs:
  - switch immediately
- if dirty tabs exist:
  - show confirmation dialog before switching

Simple options:
- Switch without saving
- Cancel

Optional:
- Save all and switch, only if trivial with existing architecture

If Save all is not trivial, do NOT add it.

After successful switch:
- replace tree completely
- close all existing tabs from previous root
- clear active response/editor state
- show clean state for the new project

Do not keep old tabs alive across root switch.

---

## 3. ROOT UNAVAILABLE / INVALID

Handle cases where current root folder becomes unavailable:
- deleted externally
- permission denied
- not readable

Behavior:
- tree reload should fail safely
- show a clear error state or dialog
- allow user to choose another folder
- do not crash

Keep behavior simple.

---

## 4. MANUAL TREE REFRESH

Add a simple refresh action.

Behavior:
- reload tree from current root
- do not mutate tree optimistically
- renderer replaces tree with fresh result from main

If open tabs point to files that no longer exist after refresh:
- do not crash
- mark them invalid or close them safely
- choose one simple consistent rule

Preferred simple rule:
- keep the tab open only until user interacts with it if current state already allows this
- otherwise close the missing-file tabs and show a brief clear message
  Pick one rule and keep it consistent.

---

## 5. OPEN TAB FILE MISSING

If a tab points to a request file that no longer exists:
- app must not crash
- save should fail clearly
- execute should fail clearly
- editor should show a clear message such as:
  - "Request file no longer exists"

Simple behavior is enough.
Do not implement automatic recreation.

---

## 6. DELETE / RENAME CONSISTENCY AFTER ROOT CHANGES

Ensure existing flows remain correct after lifecycle changes:

- deleting request closes its tab
- deleting folder closes descendant tabs
- renaming request updates tab path
- renaming folder updates descendant tab paths
- switching root clears old tabs

This phase is a good place to fix inconsistencies if found.

---

## 7. EMPTY STATES

Improve project-level empty states:

### No root selected / root unavailable
Show simple placeholder in tree/editor area

### Empty root folder
Show simple sidebar empty state:
- "No collections or requests yet"

### After switching root
Show clean no-tab state until a request is opened

Keep UI simple.

---

# IPC / MAIN PROCESS CHANGES

Add only thin IPC where needed.

Possible additions:
- tree:refresh()
- app:switchRoot()
- app:getCurrentRootStatus()

If the app already has root-related IPC, extend it minimally.
Do not redesign root handling completely.

---

# RENDERER CHANGES

Expected renderer work:
- add root switch flow using existing menu/action path
- add dirty-tab protection before switch
- clear tabs on successful switch
- add refresh action
- display missing-file / root-unavailable states safely

Prefer app-shell level handling rather than scattering logic into many components.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Main process:
- root folder initialization logic
- folder open/switch handlers
- tree refresh handler
- file existence safety checks where needed

Renderer:
- app shell / root lifecycle handling
- tree refresh action
- empty/error states for unavailable root or missing files

Do not add unnecessary architecture layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT add file watchers
- Do NOT add recent-project persistence unless already trivial
- Do NOT keep tabs across root switch
- Do NOT implement background sync
- Do NOT move filesystem lifecycle logic into renderer
- Keep behavior minimal and deterministic

---

# EDGE CASES

Handle safely:

- default root folder missing
- default root folder creation failure
- switching root with dirty tabs
- switching root to empty folder
- current root deleted externally
- request file deleted externally while tab is open
- save/execute on missing file tab
- refresh after external changes

The app must not crash on any of these.

---

# IMPLEMENTATION STRATEGY

1. Harden default root initialization
2. Implement safe root switch flow
3. Add dirty-tab protection before switch
4. Add manual tree refresh
5. Add missing-file handling for open tabs
6. Verify tab/tree consistency after lifecycle events

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Verify default root is created if missing
3. Open a different folder as root
4. Verify:
  - tree reloads
  - old tabs are cleared
  - clean state is shown

5. Open and modify a request without saving
6. Try switching root
7. Verify confirmation appears

8. Delete or move an open request file outside the app
9. Refresh tree
10. Verify app does not crash and missing-file behavior is clear

11. Delete current root folder externally if practical
12. Verify app fails safely and can recover by selecting another folder

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
