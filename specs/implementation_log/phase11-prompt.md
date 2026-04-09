You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 11** of a desktop application called "Requester".

---

# GOAL

Prepare the application for production packaging and basic release readiness.

This phase is about making sure the app can be built, packaged, and run as a real desktop application, especially on the primary target platform.

The system must:
- build cleanly for production
- package successfully
- use correct application metadata
- handle production path behavior correctly
- keep root folder behavior correct in packaged mode

This is release-readiness work, not feature work.

---

# TECH STACK

- Electron
- React
- TypeScript
- Vite

---

# ARCHITECTURE (STRICT — DO NOT VIOLATE)

- Renderer = UI only
- Main process = filesystem + HTTP + native desktop integration
- IPC = only communication layer
- Renderer MUST NOT access filesystem directly
- Keep architecture unchanged
- Simplicity > flexibility

---

# EXISTING SYSTEM

Already implemented:

- file-based request/response model
- root folder logic
- tree CRUD
- tabs
- dirty state
- request execution
- response viewer
- attachments
- lifecycle polish
- validation and normalization

The app is intended to be a local desktop application.

---

# PHASE 11 SCOPE

Implement production packaging and release readiness.

Included:
- production build cleanup
- Electron packaging configuration
- application name and metadata
- icon hookup if trivial
- correct path handling in packaged mode
- verify default root folder behavior in packaged app
- verify menu/app startup still works in production build
- basic packaged smoke test flow

Not included:
- auto-update
- code signing
- installers for every platform
- telemetry
- crash reporting service
- CI/CD pipeline
- release website/assets

---

# PRIMARY TARGET

Assume Windows is the primary packaging target unless project configuration already clearly targets more platforms.

If cross-platform packaging is already trivial, keep it.
Otherwise prioritize one stable target rather than overengineering.

---

# REQUIRED BEHAVIOR

## 1. PRODUCTION BUILD MUST WORK

Verify and fix as needed:
- renderer production build
- Electron main process build/start
- preload integration if present
- packaged startup without dev-only assumptions

Remove or fix dev-only path assumptions if they break packaging.

---

## 2. PACKAGING CONFIGURATION

Set up or fix packaging configuration using the existing project tooling.

Use the current packaging tool if already present.
If none exists, choose the simplest common Electron packaging approach already appropriate for the codebase.

Keep configuration minimal.

Examples of what may need to be defined:
- appId
- productName
- executable/app name
- output directory
- included files
- excluded dev-only files

Do not add a large release framework.

---

## 3. APPLICATION METADATA

Ensure production metadata is reasonable:
- product name = Requester
- version pulled from project config if already standard
- app title/window title consistent
- icon wired if trivial and assets already exist

If icon assets do not exist, do not invent a design workflow.
Use placeholder/default behavior if needed.

---

## 4. USER HOME / DEFAULT ROOT PATH

Verify default root folder behavior works in packaged app:

`~/requester`

Rules:
- use proper Electron/Node APIs for user home resolution
- do not rely on dev working directory
- packaged mode must not break root initialization

This is important.

---

## 5. MENU / OPEN FOLDER / DIALOGS IN PRODUCTION

Verify that packaged app still supports:
- opening folder
- switching root
- menu actions
- dialogs
- request execution
- save

Fix any production-only issues.

---

## 6. FILE ACCESS / ASSET ACCESS

Ensure packaged app does not incorrectly try to write inside app resources.
All user data must still live in user folders / selected project folders.

Do not store requests inside the packaged application bundle.

---

## 7. BASIC RELEASE CLEANUP

If trivial, clean up:
- obvious debug-only logging that is too noisy
- broken production console errors
- brittle dev-only checks

Do not overclean or refactor broadly.

---

# FILE / CONFIG AREAS TO REVIEW

Expected areas:
- Electron builder / forge / packaging config
- package.json scripts
- main process startup paths
- preload path resolution
- asset/icon path resolution
- build output structure assumptions

Keep changes focused.

---

# IMPORTANT CONSTRAINTS

- Do NOT redesign the app architecture
- Do NOT add auto-update
- Do NOT add telemetry
- Do NOT add a release pipeline
- Do NOT overengineer cross-platform support if one target platform is enough for now
- Keep packaging setup minimal and practical

---

# EDGE CASES

Handle safely:

- packaged app cannot find preload/build assets
- packaged app resolves wrong working directory
- root initialization fails in packaged mode
- menu/dialogs behave differently in packaged mode
- saving/executing requests still must work after packaging

---

# IMPLEMENTATION STRATEGY

1. Review build/start assumptions for dev-only behavior
2. Fix production path resolution
3. Add or refine packaging config
4. Verify app metadata
5. Verify packaged startup
6. Verify root folder + file workflows in packaged mode

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run production build
2. Package the app for the primary target platform
3. Launch packaged app
4. Verify:
  - app starts correctly
  - root folder logic works
  - tree loads
  - open folder works
  - open request works
  - save works
  - execute works
  - response viewer works

5. Verify packaged app does not depend on dev server or dev paths

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code/config changes grouped by file
- Keep changes minimal
- Stay consistent with existing codebase
- Do not include long explanations unless necessary
