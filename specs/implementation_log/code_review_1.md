# Code Review 1

## Scope

Reviewed committed changes for:

- `561588a` - `initial commit (with phase 1)`
- `8f80960` - `phase 1 fix`

Review focus:

- compliance with `specs/implementation_log/phase1-prompt.md`
- compliance with `specs/implementation_log/phase1.5-prompt.md`
- compliance with `specs/ENGINEERING.md`
- code smells
- vulnerabilities

## Findings

### 1. Menu-driven root folder switching is implemented via full window reload

Severity: Medium

Files:

- `electron/main.ts:23`
- `electron/main.ts:10`

Details:

After `openRootFolderDialog()` completes, the menu handler calls `refreshWindowState()`, which reloads the entire renderer using `loadURL()` or `loadFile()`.

This does not match the intent of `phase1.5-prompt.md`, which explicitly requires reusing the existing IPC/state flow so the renderer updates through the already existing state mechanisms. Right now the behavior is functionally acceptable for Phase 1, but it creates a real regression risk for later phases: once tabs, editor state, or dirty tracking appear, changing the folder from the menu will wipe all in-memory state instead of performing a targeted refresh.

### 2. Electron window is not sandboxed

Severity: Medium

Files:

- `electron/main.ts:53`

Details:

`BrowserWindow` is created with `contextIsolation: true` and `nodeIntegration: false`, which is good, but `sandbox: true` is not enabled.

This is a security hardening gap. It is not an immediate exploit by itself, but in Electron apps the renderer should be constrained as much as possible. If an XSS or renderer compromise appears later, the absence of renderer sandboxing increases impact.

### 3. No automated test coverage for the implemented phase-critical behavior

Severity: Medium

Files:

- `package.json:16`

Details:

The project defines a `vitest` test script, but there are no actual project test files under `src/`, `electron/`, or `specs/`.

As a result, the most important Phase 1 and Phase 1.5 behaviors are unverified automatically:

- default root folder bootstrap
- metadata persistence
- root folder restoration
- tree filtering and sorting
- folder switching via menu

This is a delivery risk because the prompts explicitly end with verification expectations, but the committed work does not encode those checks.

### 4. Lint is not clean due to unstable hook dependency usage

Severity: Low

Files:

- `src/widgets/app-shell/AppShell.tsx:21`
- `src/widgets/app-shell/AppShell.tsx:39`

Details:

`loadInitialState` is referenced inside `useEffect`, but the dependency array is empty. ESLint reports `react-hooks/exhaustive-deps`.

This is not a production bug today, but it is a code smell and a maintainability issue. It means the component lifecycle code is already diverging from the enforced hook rules.

## Additional Notes

### ENGINEERING.md cannot be meaningfully validated

File:

- `specs/ENGINEERING.md`

Details:

The file exists but is empty. Because of that, strict compliance with `ENGINEERING.md` cannot actually be verified from repository contents.

### Prompt/spec traceability issue

File:

- `specs/Implementtion_plan.md`

Details:

`phase1-prompt.md` references `specs/Implementation_plan.md`, but the repository contains `specs/Implementtion_plan.md` instead. This typo weakens traceability and may confuse automation or future contributors.

## Validation Performed

Commands run:

- `npm run build`
- `npm run lint`
- `npm test -- --run`

Results:

- `build`: passed
- `lint`: passed with 1 warning
- `test`: failed because no project test files were found

## Summary

No critical architecture break was found in the committed code: renderer does not access the filesystem directly, preload exposes a typed API instead of raw `ipcRenderer`, IPC remains thin, and most business logic stays in services.

The main review concerns are:

1. menu refresh implemented as full renderer reload instead of state-based update
2. missing Electron sandbox hardening
3. absence of automated tests for the delivered scope
4. existing lint warning in renderer lifecycle code
