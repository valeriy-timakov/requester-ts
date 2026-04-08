You are Codex, acting as a senior software engineer.

Your task is to implement **Phase 4** of a desktop application called "Requester".

---

# GOAL

Implement basic attachment support for requests.

The system must:
- allow attaching files to a request
- store attachments in the same folder as the `.req` file
- show attachments in the renderer
- allow removing attachments from the request
- keep all filesystem work in the main process

This is MVP only.
Do not implement advanced upload workflows.

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
- Renderer MUST NOT copy or read attachment files directly
- No business logic in React components
- Keep IPC thin
- Simplicity > flexibility

---

# EXISTING SYSTEM

The application is file-based:

- root folder = project
- folders = collections
- request = `.req` JSON file
- response = `.resp` JSON file
- request execution already exists in main process
- tabs already exist
- manual save already exists
- response viewer already exists

Current request example:

{
"version": 1,
"name": "Request name",
"method": "GET",
"url": "",
"queryParams": [],
"headers": [],
"auth": { "type": "none" },
"body": { "type": "none" },
"requestOptions": { "followRedirects": true }
}

---

# PHASE 4 SCOPE

Implement attachment metadata in request files and local file copy/remove operations.

MVP only.

Included:
- attachment list in request model
- add attachment from file picker
- copy attachment file into request folder
- store attachment metadata in `.req`
- remove attachment from request metadata
- optional physical deletion of copied attachment file if safe
- show attachment list in editor

Not included:
- drag and drop
- multipart form builder UI
- attachment preview
- binary inspectors
- rename attachment UI
- upload progress
- deduplication
- content hashing
- external linked files

---

# REQUEST MODEL CHANGE

Extend `.req` JSON with attachments.

Example:

{
"version": 1,
"name": "Request name",
"method": "POST",
"url": "",
"queryParams": [],
"headers": [],
"auth": { "type": "none" },
"body": { "type": "none" },
"requestOptions": { "followRedirects": true },
"attachments": [
{
"fileName": "sample.pdf",
"relativePath": "./sample.pdf",
"size": 12345
}
]
}

Rules:
- `attachments` is optional but should be normalized to `[]` in app logic
- attachment files live in the same folder as the `.req`
- `relativePath` should stay simple and local to the request folder
- do not support nested attachment folders for MVP

---

# MAIN PROCESS RESPONSIBILITIES

Implement all attachment-related IO in main process.

Required operations:

## 1. Open file picker
Allow user to select one or more local files.

## 2. Copy attachment into request folder
When user adds attachment:
- resolve request file folder
- copy selected file into the same folder as the `.req`
- if target name already exists, create a simple unique name
  - example: `file.pdf` -> `file (1).pdf`
- return attachment metadata

## 3. Remove attachment
When user removes attachment:
- remove attachment entry from request JSON
- optionally delete physical file only if:
  - file exists
  - file path belongs to that request folder
- keep this logic conservative and safe

## 4. Save updated `.req`
Main process should update the request file after add/remove attachment operations

---

# IPC API

Add minimal IPC methods.

## Attachment add

`request:addAttachment(requestPath)`

Behavior:
- open native file picker in main process
- user selects a file
- main copies file into request folder
- main updates `.req`
- main returns updated request document

Input:
- requestPath (relative to project root)

Output:
- updated request document

## Attachment remove

`request:removeAttachment(requestPath, attachmentRelativePath)`

Behavior:
- remove attachment from request document
- optionally delete copied file if safe
- save `.req`
- return updated request document

Input:
- requestPath
- attachmentRelativePath

Output:
- updated request document

---

# RENDERER INTEGRATION

In renderer:

- add Attachments section to request editor
- show current attachment list
- add button: "Add attachment"
- each attachment item has:
  - file name
  - size
  - remove button

Behavior:
- clicking "Add attachment" calls IPC
- after success, active tab document is replaced with returned document
- removing attachment calls IPC and updates active tab
- dirty state must stay correct

Important:
- since attachment add/remove changes the `.req` file through main process,
  renderer must update both:
  - `savedDocument`
  - `draftDocument`
    to the returned document
- result should be clean (`isDirty = false`) immediately after successful add/remove,
  because the operation already persisted the `.req`

Do not force separate manual save after attachment add/remove.
Treat add/remove attachment as explicit persisted actions.

---

# EXECUTION INTEGRATION

Do not build full multipart UI in this phase.

But prepare the code so attachments can be used later during request execution.

For now:
- keep attachment metadata in request model
- do not implement multipart request body editor unless trivial
- do not change execution behavior unless necessary for existing types

If current body model already has a simple place to reference attachments for multipart,
follow the existing pattern only.
Otherwise, just store attachments and UI for now.

---

# FILE STRUCTURE (EXPECTED CHANGES)

Main process:
- ipc/request.addAttachment.ts
- ipc/request.removeAttachment.ts
- services/fileService.ts (extend)
- services/dialogService.ts or existing dialog helper
- shared/request types update

Renderer:
- components/RequestEditor.tsx
- components/AttachmentsPanel.tsx (new, if useful)
- tabs state integration
- shared/request types update

Do not introduce unnecessary new folders or architecture layers.

---

# IMPORTANT CONSTRAINTS

- Do NOT add a repository pattern
- Do NOT add a global state library
- Do NOT move filesystem logic into renderer
- Do NOT implement drag and drop
- Do NOT implement attachment previews
- Do NOT overengineer file naming or conflict resolution
- Keep code minimal and practical

---

# EDGE CASES

Handle these cases safely:

- user cancels file picker
- source file does not exist
- file copy error
- duplicate file name in request folder
- removing attachment that is already missing on disk
- malformed old `.req` without `attachments`

For user cancel:
- do not treat as an error
- simply return no change / null result, depending on existing style

---

# IMPLEMENTATION STRATEGY

1. Extend shared request types with attachment metadata
2. Extend request read normalization to ensure `attachments` defaults to `[]`
3. Implement add attachment in main process
4. Implement remove attachment in main process
5. Add IPC handlers
6. Add simple attachments UI in renderer
7. Update tab state correctly after add/remove

---

# VERIFICATION (MANDATORY)

After implementation:

1. Run the app
2. Open an existing request
3. Add a real local file as attachment
4. Verify:
  - file is copied into the request folder
  - `.req` is updated with attachment metadata
  - attachment appears in UI
5. Remove attachment
6. Verify:
  - attachment disappears from UI
  - `.req` is updated
  - physical file is deleted only if safe
7. Verify:
  - renderer never accesses filesystem directly
  - no broken dirty state behavior

If something fails:
- debug and fix before finishing

---

# OUTPUT FORMAT

- Provide code changes grouped by file
- Keep changes minimal
- Do not include long explanations unless necessary
- Stay consistent with the existing project structure
