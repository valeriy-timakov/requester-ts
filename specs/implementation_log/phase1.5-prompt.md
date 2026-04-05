You are refining **Phase 1 (Foundation)** of the Requester application.

IMPORTANT:
Before making changes, you MUST read and follow:

* `specs/ENGINEERING.md`
* `specs/Implementation_plan.md`
* `specs/MVP_plan.md`

Do NOT break architecture rules.
Do NOT introduce new layers or frameworks.

This task is a **UI/UX refinement only**.

---

# 1. Goal

Improve root folder UX by:

* moving "Open Folder" action into the application menu
* removing the large button from the sidebar
* keeping behavior identical

---

# 2. What must change

## 2.1 Remove sidebar button

In renderer:

* REMOVE the large "Open Folder" button
* KEEP:

  * root folder label
  * root folder path

Sidebar should now only display:

* ROOT FOLDER
* path
* tree (if present)

Do NOT leave dead code or unused handlers.

---

## 2.2 Add native application menu

In `electron/main.ts`:

Create an application menu using Electron Menu API.

Menu structure:

```text
File
 ├── Open Folder...
 ├── (separator)
 └── Quit
```

---

## 2.3 Hook menu action to existing logic

The menu item "Open Folder..." MUST:

* call the SAME logic used by IPC `openRootFolderDialog`
* NOT duplicate logic
* NOT move logic into menu handler

Correct flow:

```text
Menu click → main process → existing service logic → update root folder → renderer refresh
```

---

## 2.4 Trigger renderer update

After folder is changed via menu:

* renderer MUST update:

  * root folder path
  * tree

You MUST reuse existing IPC/state mechanisms.

DO NOT introduce new state systems.

---

## 3. Implementation details

## 3.1 Create menu

In `main.ts`:

```ts
import { Menu } from 'electron';
```

Define menu template and set it:

```ts
Menu.setApplicationMenu(menu);
```

---

## 3.2 Menu click handler

Inside menu:

* call the same function/service used in `openRootFolderDialog`
* do NOT duplicate dialog logic

---

## 3.3 Renderer sync

Ensure that after root folder change:

* renderer refreshes state
* tree is reloaded

If needed:

* reuse `getAppState()`
* reuse `readTree()`

---

# 4. Constraints

STRICT:

* no business logic in menu
* no duplication of folder selection logic
* no direct filesystem usage in renderer
* no new architecture

---

# 5. Do NOT implement

Do NOT:

* add new UI features
* add toolbar
* add tabs logic
* add keyboard shortcuts (optional later)
* add "recent folders"
* change tree logic

---

# 6. Optional (nice-to-have, but safe)

If simple and consistent:

* add keyboard shortcut:

  * Ctrl+O → Open Folder

BUT:

* only if trivial
* do not complicate code

---

# 7. Verification

After implementation:

1. Sidebar has NO button
2. Menu contains "File → Open Folder..."
3. Clicking it opens system dialog
4. Selecting folder updates:

  * root path
  * tree
5. Restart app → last folder still restored
6. No renderer crashes

---

# 8. Output

Provide:

* modified files
* created menu structure
* how menu is wired to existing logic
* confirmation of verification steps

---

# 9. Final rule

If unsure:

→ reuse existing logic
→ keep solution minimal
→ do not overengineer
→ follow ENGINEERING.md
