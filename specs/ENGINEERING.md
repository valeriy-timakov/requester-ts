You are implementing **Phase 1 (Foundation)** of the Requester application.

IMPORTANT:
Before doing anything, you MUST read and follow these files located in the project:

* `specs/ENGINEERING.md`
* `specs/Implementation_plan.md`
* `specs/MVP_plan.md`

These documents define:

* architecture
* coding rules
* responsibilities
* constraints

You MUST strictly follow them.
If there is any conflict between this prompt and those files — follow the specs.

Do NOT invent new architecture.
Do NOT bypass defined layers.

---

# 1. Goal of this phase

Implement **Phase 1: Foundation**

This includes:

* application metadata storage
* root folder bootstrap logic
* default root folder creation (`~/requester`)
* ability to open another root folder
* recursive tree reading
* minimal UI shell

This phase must result in a working application.

---

# 2. Architecture constraints (MANDATORY)

Follow `ENGINEERING.md` strictly.

Key rules:

* Renderer MUST NOT access filesystem
* All IO MUST be in main process
* IPC MUST be the only bridge
* IPC MUST be thin (no logic)
* Services MUST contain logic
* Components MUST be UI-only

---

# 3. Implementation scope

## 3.1 App metadata

Implement `appStateService` in main process.

Responsibilities:

* store metadata in OS app data directory
* store JSON file
* handle invalid or missing file safely

Structure:

```ts
interface AppMetadata {
  lastOpenedRootFolder?: string;
}
```

Functions required:

* read metadata
* write metadata
* update lastOpenedRootFolder

---

## 3.2 Root folder resolution

Implement `projectService`.

Responsibilities:

* resolve initial root folder
* create default `~/requester` if missing
* validate folder existence

Logic:

1. read metadata
2. if `lastOpenedRootFolder` exists and valid → use it
3. otherwise:

  * ensure `~/requester` exists
  * use it

Expose function:

```ts
resolveInitialRootFolder(): Promise<string>
```

Also implement:

* setRootFolder(path)
* persist into metadata

---

## 3.3 Folder picker

Implement IPC handler:

* open native folder picker dialog
* if canceled → return current state unchanged
* if selected:

  * set new root folder
  * persist it
  * return updated state

---

## 3.4 File tree service

Implement `fileTreeService`.

Requirements:

* recursive traversal
* include:

  * directories
  * `.req` files
* exclude:

  * `.resp`
  * all other files

Sorting:

1. folders first
2. requests second
3. alphabetical

Return:

```ts
TreeEntry[]
```

---

## 3.5 IPC layer

Implement IPC handlers ONLY in `electron/ipc/`.

Required endpoints:

### App state

* `getAppState`
* `getCurrentRootFolder`
* `openRootFolderDialog`
* `ensureDefaultRootFolder`

### Tree

* `readTree`

Rules:

* no business logic here
* call services only

---

## 3.6 Preload API

Expose API as:

```ts
window.requesterApi = {
  getAppState,
  getCurrentRootFolder,
  openRootFolderDialog,
  ensureDefaultRootFolder,
  readTree
}
```

Also define proper TypeScript typings.

DO NOT expose raw ipcRenderer.

---

## 3.7 Renderer (UI)

Implement minimal shell.

Requirements:

### On startup

* load app state
* load tree

### UI elements

* left sidebar (tree)
* root folder path display
* button: "Open Folder"
* top area placeholder (tabs)
* main area placeholder

### Tree

* simple recursive rendering
* read-only (no actions yet)

### Behavior

* selecting new folder reloads tree

---

# 4. File structure rules

Follow ENGINEERING.md.

Expected structure:

```text
electron/
  ipc/
  services/

src/
  shared/
  entities/
  features/
  widgets/
```

Keep separation strict.

---

# 5. Error handling

* never crash renderer
* safe defaults
* handle invalid metadata
* handle missing directories
* cancel dialog safely

---

# 6. What NOT to implement

DO NOT implement:

* request editor
* tabs logic
* HTTP execution
* saving requests
* `.resp` logic
* drag-and-drop
* attachments
* auth UI

---

# 7. Verification checklist

After implementation:

* app starts cleanly
* `~/requester` is created if missing
* root folder is displayed
* tree renders correctly
* `.resp` and other files are hidden
* folder picker works
* selected folder persists after restart
* no renderer crashes

---

# 8. Output requirements

At the end, provide:

* list of created files
* list of modified files
* IPC endpoints implemented
* services implemented
* confirmation of verification steps

---

# 9. Final rule

If unsure:

→ follow ENGINEERING.md
→ prefer simple and explicit solution
→ do not overengineer
→ do not add abstractions “for future”
