# Initial Technical MVP Plan: Requester

## 1. Product Goal

**Requester** is a local desktop API client focused on predictable and transparent HTTP request handling without cloud sync, without hidden magic, and with a direct mapping between the collection structure and the file system.

Conceptually, the product is similar to Postman in the basic layout of interface elements, but it is significantly simpler and fully local.

Key principles:

* all requests are stored in the file system
* the tree structure in the UI matches the folder structure on disk
* each request is a separate file
* the latest response is stored next to the request
* HTTP requests are executed in the main process
* saving changes is manual
* the app does not track external file and folder changes
* in case of conflicts, the app state is considered the source of truth

---

## 2. Technology Foundation

### Base stack

* **Electron** for the desktop shell
* **React** for the renderer UI
* **TypeScript** as the primary implementation language
* **Vite** for frontend build/dev tooling

### Responsibility split

#### Renderer process

Responsible for:

* folder and request tree
* open request tabs
* request editor
* response viewer
* dirty state
* user actions

#### Main process

Responsible for:

* file system operations
* opening the project root folder
* reading and writing `.req` and `.resp` files
* creating, renaming, deleting, and moving folders and requests
* copying multipart attachments
* executing HTTP/HTTPS requests
* collecting the redirect chain

#### Preload / IPC

Provides a narrow typed API between the renderer and main processes.

---

## 3. Project Root Folder

### Default behavior

Default root folder:

`~/requester`

### Startup rules

1. If the user has not selected another root folder, the app uses `~/requester`.
2. If `~/requester` does not exist, it is created automatically.
3. The user can manually open another project root folder.
4. The app must remember the last opened root folder.

### Where to store app metadata

Application metadata that **is not part of the project** should be stored in the standard Electron/OS app data directory.

Examples of such metadata:

* last opened root folder
* global UI settings
* global tree sorting settings in the future

This metadata is not stored inside the project file tree.

---

## 4. File Persistence Model

## 4.1. General approach

* folders on disk = collections / subcollections
* each request = a separate file with the `.req` extension
* latest response = a separate file with the same base name and the `.resp` extension
* multipart attachments are placed in the same folder as the request file

### Example structure

```text
~/requester/
  Users/
    Get user by id.req
    Get user by id.resp
    Create user.req
  Orders/
    List orders.req
    Upload invoice.req
    invoice-sample.pdf
```

## 4.2. Naming rules

* the request name in the UI matches the file name
* when renaming a request in the UI, the `.req` file is renamed
* the corresponding `.resp` must also be renamed together with the request if it exists
* when moving a request to another folder, the related files are moved as well

## 4.3. Storage format

The primary format is **JSON**.

Reasons for choosing it:

* natural for the TypeScript/JS stack
* simple to serialize and deserialize
* easy for manual inspection and debugging
* easily extensible in the future

---

## 5. Request File Format (`.req`)

## 5.1. Basic structure

```json
{
  "version": 1,
  "name": "Get user by id",
  "method": "GET",
  "url": "http://localhost:8080/api/users/123",
  "queryParams": [
    { "key": "verbose", "value": "true", "enabled": true }
  ],
  "headers": [
    { "key": "Accept", "value": "application/json", "enabled": true }
  ],
  "auth": {
    "type": "none"
  },
  "body": {
    "type": "none"
  },
  "requestOptions": {
    "followRedirects": true
  }
}
```

## 5.2. Methods supported in the MVP

* GET
* POST
* PUT
* PATCH
* DELETE

## 5.3. Body types supported in the MVP

* `none`
* `text`
* `json`
* `xml`
* `form-data`

### `json` example

```json
"body": {
  "type": "json",
  "content": "{\n  \"name\": \"John\"\n}"
}
```

### `xml` example

```json
"body": {
  "type": "xml",
  "content": "<user><name>John</name></user>"
}
```

### `text` example

```json
"body": {
  "type": "text",
  "content": "plain text body"
}
```

### `form-data` example

```json
"body": {
  "type": "form-data",
  "fields": [
    { "kind": "text", "key": "description", "value": "test", "enabled": true },
    { "kind": "file", "key": "file", "fileName": "invoice-sample.pdf", "enabled": true }
  ]
}
```

## 5.4. Auth in the MVP

Supported:

* `none`
* `bearer`
* `basic`

### `bearer` example

```json
"auth": {
  "type": "bearer",
  "token": "..."
}
```

### `basic` example

```json
"auth": {
  "type": "basic",
  "username": "user",
  "password": "pass"
}
```

## 5.5. Headers

* arbitrary header editing is supported
* this also allows other authorization types to be implemented manually through custom headers

## 5.6. Redirect settings

For each request, the following option is stored:

* `followRedirects: true|false`

---

## 6. Response File Format (`.resp`)

The `.resp` file contains the **latest executed response** for the corresponding request.
It is automatically overwritten after each new execution.

### Example structure

```json
{
  "version": 1,
  "requestSummary": {
    "method": "GET",
    "resolvedUrl": "http://localhost:8080/api/users/123"
  },
  "status": 200,
  "statusText": "OK",
  "durationMs": 42,
  "sizeBytes": 512,
  "redirects": [
    "http://localhost:8080/old",
    "http://localhost:8080/new"
  ],
  "headers": [
    { "key": "content-type", "value": "application/json" }
  ],
  "body": "{\n  \"id\": 123,\n  \"name\": \"John\"\n}",
  "bodyType": "application/json",
  "receivedAt": "2026-04-05T12:00:00Z"
}
```

### Rules

* `.resp` is not manually edited as the primary workflow
* it is the saved result of the latest request execution
* execution history is out of scope for the MVP

---

## 7. Collection Tree and File Model

## 7.1. What a folder can contain

In the MVP, a folder can contain:

* subfolders
* `.req` request files
* related attachment files
* `.resp` response files

In the UI tree, only the following should be shown:

* subfolders
* `.req` files

Attachment files and `.resp` files are not displayed as separate tree nodes.

## 7.2. Sorting

Current tree sorting rule:

* folders first
* then requests
* alphabetical sorting within each group

A global alternative sorting setting may be added in the future.

## 7.3. Tree operations

Supported in the MVP:

* create folder
* create new request
* rename folder
* rename request
* delete folder
* delete request
* drag-and-drop request movement between folders

### Drag-and-drop behavior

* the `.req` file is physically moved
* the related `.resp` is physically moved if it exists
* related attachments are physically moved

---

## 8. Editor and Tab Behavior

## 8.1. Tabs

* multiple requests can be opened at the same time
* each open request lives in its own tab
* the tab shows dirty state if there are unsaved changes

## 8.2. Saving

* saving is **manual**
* hotkey: `Ctrl+S`
* there should also be a save button with an icon

## 8.3. Closing a tab

If a tab contains unsaved changes:

* the user receives a warning
* closing without confirmation is not allowed

## 8.4. Closing the app

If there are unsaved tabs:

* the user receives a warning
* closing without confirmation is not allowed

## 8.5. Autosave

* not present

## 8.6. External file changes

* not tracked
* the app state is considered authoritative while the app is running

---

## 9. HTTP Request Execution

## 9.1. Where requests are executed

All requests are executed in the **main process**.

Reasons:

* no renderer CORS limitations
* greater control over execution
* better integration with the file system
* more convenient handling of multipart attachments
* the ability to extend the transport layer in the future

## 9.2. MVP protocols

* HTTP
* HTTPS

## 9.3. Redirect behavior

* configured per request
* the redirect chain is collected and shown in the response

## 9.4. TLS/SSL control

Not included in the MVP.

---

## 10. Multipart and Attachments

## 10.1. Approach

For `form-data`, attachments are stored in the same folder as the request file.

## 10.2. Behavior when adding a file

1. The user selects a file through a dialog.
2. The file is copied into the request folder.
3. If the name conflicts with an existing file, automatic renaming is performed.
4. The relative file name is stored in `.req`.

## 10.3. Reference rule

In the MVP, the reference is stored only as the file name because the file is located in the same folder.

## 10.4. Moving a request

When moving or renaming a request, the related files must also be moved/renamed correctly.

---

## 11. Response Rendering

## 11.1. What is displayed

The response viewer shows:

* status
* status text
* duration
* size
* headers
* body
* redirect chain

## 11.2. Body view modes

Separate tabs:

* **Raw**
* **Pretty**

## 11.3. Pretty behavior

* for JSON and XML, pretty rendering is applied if parsing succeeds
* if parsing fails, a fallback raw representation is shown

---

## 12. MVP Boundaries

## 12.1. What is included in the MVP

* folder and request tree
* `.req` file persistence
* `.resp` file persistence
* default root folder `~/requester`
* ability to open another root folder
* HTTP/HTTPS
* GET / POST / PUT / PATCH / DELETE methods
* query params
* headers
* body: text / json / xml / form-data
* auth: none / bearer / basic
* request execution in the main process
* redirect chain
* raw/pretty response tabs
* multipart attachments next to the request
* manual saving
* open request tabs
* warning on close with unsaved changes

## 12.2. What is not included in the MVP

* environment variables
* execution history beyond a single `.resp`
* tracking of external file system changes
* autosave
* OAuth2 flow
* cookie jar
* custom TLS configuration
* GraphQL
* WebSocket
* gRPC
* scripting / tests / pre-request scripts
* import from Postman / Insomnia
* cloud sync
* user accounts

---

## 13. IPC API: Initial Contract

Below is the list of basic IPC operations that should be available to the renderer.

### Project / root folder

* `getAppState()`
* `getCurrentRootFolder()`
* `openRootFolderDialog()`
* `setRootFolder(path)`
* `ensureDefaultRootFolder()`

### Tree / file system

* `readTree()`
* `createFolder(parentPath, name)`
* `createRequest(parentPath, name)`
* `renameEntry(path, newName)`
* `deleteEntry(path)`
* `moveRequest(sourcePath, targetFolderPath)`

### Request files

* `readRequest(path)`
* `saveRequest(path, requestData)`

### Response files

* `readResponse(path)`
* `writeResponse(path, responseData)`

### Attachments

* `pickAttachmentFile()`
* `copyAttachmentToRequestFolder(requestPath, sourceFilePath)`

### Execution

* `executeRequest(path, requestData)`

### App lifecycle

* `confirmCloseWithDirtyTabs()`

This is not the final signature, but the initial functional set.

---

## 14. Basic Domain Models

## 14.1. RequestFile

* path
* name
* method
* url
* queryParams
* headers
* auth
* body
* requestOptions
* version

## 14.2. ResponseFile

* requestSummary
* status
* statusText
* durationMs
* sizeBytes
* redirects
* headers
* body
* bodyType
* receivedAt
* version

## 14.3. TreeEntry

* path
* name
* type: `folder | request`
* children? (for folder)

## 14.4. OpenTab

* path
* title
* isDirty
* requestSnapshot
* lastLoadedResponse?

---

## 15. Suggested Code Structure

```text
electron/
  main.ts
  preload.ts
  ipc/
    project.ts
    tree.ts
    requests.ts
    responses.ts
    execution.ts
    attachments.ts
  services/
    appStateService.ts
    fileTreeService.ts
    requestFileService.ts
    responseFileService.ts
    httpExecutionService.ts
    attachmentService.ts

src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
    api/
    electron/
    types/
    utils/
```

---

## 16. Implementation Order

## Phase 1 - Foundation

* root folder handling
* default `~/requester`
* open another root folder
* app metadata in app data
* tree reading
* create/rename/delete folder and request

## Phase 2 - Request editor

* open request in tab
* request file format
* manual save
* dirty state
* close protection

## Phase 3 - HTTP execution

* execute in main process
* methods
* query params
* headers
* text/json/xml body
* save `.resp`
* raw response viewer

## Phase 4 - Extended request features

* bearer/basic auth
* form-data
* attachment copying
* redirect chain
* pretty response tabs

## Phase 5 - UX polish

* drag-and-drop move
* rename edge cases
* better errors
* consistent status display
* keyboard shortcuts

---

## 17. Open Questions That Can Be Left for the Next Stage

This document is already sufficient to start the MVP. The following can be detailed separately later:

* exact TypeScript types for `.req` and `.resp`
* IPC method signatures
* file system error handling scenarios
* rules for detecting and binding related attachments
* React state management structure without unnecessary overengineering
* pretty-rendering rules for JSON/XML

---

## 18. Summary

MVP Requester is a local file-oriented API client with a predictable storage structure, manual control over changes, HTTP request execution in the main process, and a simple but practical feature set sufficient for everyday work with HTTP APIs without the extra complexity of Postman.
