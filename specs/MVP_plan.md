# Початковий технічний план MVP: Requester

## 1. Мета продукту

**Requester** — локальний desktop API client, орієнтований на передбачувану й прозору роботу з HTTP-запитами без хмарної синхронізації, без прихованої магії та з прямим мапінгом структури колекцій на файлову систему.

Продукт концептуально близький до Postman за базовим розташуванням елементів інтерфейсу, але значно простіший і повністю локальний.

Ключові принципи:

* усі запити зберігаються у файловій системі
* структура дерева в UI відповідає структурі папок на диску
* кожен запит є окремим файлом
* остання відповідь зберігається поруч із запитом
* виконання HTTP-запитів відбувається в main process
* збереження змін виконується вручну
* додаток не відстежує зовнішні зміни файлів і папок
* у разі конфлікту джерелом істини вважається стан додатку

---

## 2. Технологічна основа

### Базовий стек

* **Electron** — desktop shell
* **React** — renderer UI
* **TypeScript** — мова основної реалізації
* **Vite** — frontend build/dev tooling

### Розподіл відповідальності

#### Renderer process

Відповідає за:

* дерево папок і запитів
* вкладки відкритих запитів
* редактор запиту
* перегляд відповіді
* dirty state
* користувацькі дії

#### Main process

Відповідає за:

* роботу з файловою системою
* відкриття кореневої папки проекту
* читання та запис файлів `.req` і `.resp`
* створення, перейменування, видалення й переміщення папок і запитів
* копіювання вкладень для multipart
* виконання HTTP/HTTPS-запитів
* збір redirect chain

#### Preload / IPC

Надає вузький типізований API між renderer і main.

---

## 3. Коренева папка проекту

### Поведінка за замовчуванням

Дефолтна коренева папка:

`~/requester`

### Правила старту

1. Якщо користувач не обрав іншу кореневу папку, додаток використовує `~/requester`.
2. Якщо `~/requester` не існує, вона створюється автоматично.
3. Користувач може вручну відкрити іншу кореневу папку проекту.
4. Додаток повинен пам’ятати останню відкриту кореневу папку.

### Де зберігати метаінформацію самого додатку

Метаінформацію додатку, яка **не є частиною проекту**, слід зберігати в стандартному app data каталозі Electron/OS.

Приклади такої метаінформації:

* остання відкрита коренева папка
* глобальні UI-налаштування
* глобальні налаштування сортування дерева в майбутньому

У файловому дереві самого проекту така метаінформація не зберігається.

---

## 4. Модель файлового збереження

## 4.1. Загальний підхід

* папки на диску = колекції / підколекції
* кожен запит = окремий файл з розширенням `.req`
* остання відповідь = окремий файл з таким самим базовим ім’ям і розширенням `.resp`
* вкладення для multipart розміщуються в тій самій папці, що і файл запиту

### Приклад структури

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

## 4.2. Правила іменування

* назва запиту в UI тотожна імені файлу
* при перейменуванні запиту в UI перейменовується файл `.req`
* відповідний `.resp` також повинен бути перейменований разом із запитом, якщо існує
* при переміщенні запиту в іншу папку переміщуються також пов’язані файли

## 4.3. Формат збереження

Основний формат — **JSON**.

Причини вибору:

* природний для TypeScript/JS-стеку
* простий у серіалізації й десеріалізації
* простий для ручного перегляду та дебагу
* легко розширюється в майбутньому

---

## 5. Формат файлу запиту (`.req`)

## 5.1. Базова структура

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

## 5.2. Підтримувані методи в MVP

* GET
* POST
* PUT
* PATCH
* DELETE

## 5.3. Підтримувані типи body в MVP

* `none`
* `text`
* `json`
* `xml`
* `form-data`

### Приклад `json`

```json
"body": {
  "type": "json",
  "content": "{\n  \"name\": \"John\"\n}"
}
```

### Приклад `xml`

```json
"body": {
  "type": "xml",
  "content": "<user><name>John</name></user>"
}
```

### Приклад `text`

```json
"body": {
  "type": "text",
  "content": "plain text body"
}
```

### Приклад `form-data`

```json
"body": {
  "type": "form-data",
  "fields": [
    { "kind": "text", "key": "description", "value": "test", "enabled": true },
    { "kind": "file", "key": "file", "fileName": "invoice-sample.pdf", "enabled": true }
  ]
}
```

## 5.4. Auth у MVP

Підтримуються:

* `none`
* `bearer`
* `basic`

### Приклад `bearer`

```json
"auth": {
  "type": "bearer",
  "token": "..."
}
```

### Приклад `basic`

```json
"auth": {
  "type": "basic",
  "username": "user",
  "password": "pass"
}
```

## 5.5. Заголовки

* підтримується довільне редагування headers
* це дозволяє вручну реалізувати й інші види авторизації через custom headers

## 5.6. Redirect settings

Для кожного запиту зберігається опція:

* `followRedirects: true|false`

---

## 6. Формат файлу відповіді (`.resp`)

Файл `.resp` містить **останню виконану відповідь** для відповідного запиту.
Він автоматично перезаписується після кожного нового виконання.

### Приклад структури

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

### Правила

* `.resp` не редагується вручну як основний сценарій
* це збережений результат останнього виконання запиту
* історія виконань поза межами MVP

---

## 7. Дерево колекцій і файлова модель

## 7.1. Що може містити папка

У MVP папка може містити:

* підпапки
* файли запитів `.req`
* пов’язані файли вкладень
* файли відповідей `.resp`

В UI у дереві слід показувати лише:

* підпапки
* файли `.req`

Файли вкладень і `.resp` не відображаються як окремі вузли дерева.

## 7.2. Сортування

Поточне правило сортування в дереві:

* спочатку папки
* потім запити
* всередині кожної групи — сортування за алфавітом

У майбутньому може бути додане глобальне налаштування альтернативного сортування.

## 7.3. Операції над деревом

У MVP підтримуються:

* створення папки
* створення нового запиту
* перейменування папки
* перейменування запиту
* видалення папки
* видалення запиту
* drag-and-drop переміщення запиту між папками

### Поведінка drag-and-drop

* фізично переміщується файл `.req`
* фізично переміщується пов’язаний `.resp`, якщо існує
* фізично переміщуються пов’язані вкладення

---

## 8. Поведінка редактора і вкладок

## 8.1. Вкладки

* можна відкривати кілька запитів одночасно
* кожен відкритий запит живе в окремій вкладці
* вкладка показує dirty state, якщо є незбережені зміни

## 8.2. Збереження

* збереження **ручне**
* гаряча клавіша: `Ctrl+S`
* також має бути кнопка збереження з іконкою

## 8.3. Закриття вкладки

Якщо вкладка містить незбережені зміни:

* користувач отримує попередження
* закриття без підтвердження не виконується

## 8.4. Закриття додатку

Якщо є незбережені вкладки:

* користувач отримує попередження
* закриття без підтвердження не виконується

## 8.5. Autosave

* відсутній

## 8.6. Зовнішні зміни файлів

* не відстежуються
* стан додатку вважається авторитетним, поки він запущений

---

## 9. Виконання HTTP-запитів

## 9.1. Де виконуються запити

Усі запити виконуються в **main process**.

Причини:

* відсутність CORS-обмежень renderer
* більший контроль над виконанням
* краща інтеграція з файловою системою
* зручніша робота з multipart-вкладеннями
* можливість у майбутньому розширювати транспортний шар

## 9.2. Протоколи MVP

* HTTP
* HTTPS

## 9.3. Redirect behavior

* налаштовується на рівні конкретного запиту
* redirect chain збирається і показується у відповіді

## 9.4. TLS/SSL control

Не входить у MVP.

---

## 10. Multipart і вкладення

## 10.1. Підхід

Для `form-data` вкладення зберігаються в тій самій папці, що й файл запиту.

## 10.2. Поведінка при додаванні файлу

1. Користувач обирає файл через діалог.
2. Файл копіюється в папку запиту.
3. Якщо ім’я конфліктує з наявним файлом, виконується автоматичне перейменування.
4. У `.req` зберігається відносне ім’я файлу.

## 10.3. Правило посилання

У MVP посилання зберігається лише по імені файлу, оскільки файл лежить у тій самій папці.

## 10.4. Переміщення запиту

Під час переміщення або перейменування запиту пов’язані файли також мають бути переміщені/перейменовані коректно.

---

## 11. Відображення відповіді

## 11.1. Що показуємо

У response viewer показуються:

* status
* status text
* duration
* size
* headers
* body
* redirect chain

## 11.2. Режими перегляду body

Окремі вкладки:

* **Raw**
* **Pretty**

## 11.3. Pretty behavior

* для JSON і XML виконується pretty rendering, якщо парсинг успішний
* якщо парсинг неуспішний, показується fallback на raw representation

---

## 12. Межі MVP

## 12.1. Що входить у MVP

* дерево папок і запитів
* файлове збереження `.req`
* файлове збереження `.resp`
* дефолтна коренева папка `~/requester`
* можливість відкрити іншу кореневу папку
* HTTP/HTTPS
* методи GET / POST / PUT / PATCH / DELETE
* query params
* headers
* body: text / json / xml / form-data
* auth: none / bearer / basic
* виконання запитів у main process
* redirect chain
* raw/pretty response tabs
* multipart attachments поруч із запитом
* ручне збереження
* вкладки відкритих запитів
* попередження при закритті з незбереженими змінами

## 12.2. Що не входить у MVP

* environment variables
* історія виконань, окрім одного `.resp`
* відстеження зовнішніх змін файлової системи
* autosave
* OAuth2 flow
* cookie jar
* TLS custom configuration
* GraphQL
* WebSocket
* gRPC
* scripting / tests / pre-request scripts
* import з Postman / Insomnia
* cloud sync
* user accounts

---

## 13. IPC API: початковий контракт

Нижче перелік базових IPC-операцій, які мають бути доступні renderer.

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

Це не фінальна сигнатура, а стартовий функціональний набір.

---

## 14. Базові доменні моделі

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
* children? (для folder)

## 14.4. OpenTab

* path
* title
* isDirty
* requestSnapshot
* lastLoadedResponse?

---

## 15. Орієнтовна структура коду

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

## 16. Порядок реалізації

## Phase 1 — Foundation

* root folder handling
* default `~/requester`
* open another root folder
* app metadata in app data
* tree reading
* create/rename/delete folder and request

## Phase 2 — Request editor

* open request in tab
* request file format
* manual save
* dirty state
* close protection

## Phase 3 — HTTP execution

* execute in main process
* methods
* query params
* headers
* text/json/xml body
* save `.resp`
* raw response viewer

## Phase 4 — Extended request features

* bearer/basic auth
* form-data
* attachment copying
* redirect chain
* pretty response tabs

## Phase 5 — UX polish

* drag-and-drop move
* rename edge cases
* better errors
* consistent status display
* keyboard shortcuts

---

## 17. Відкриті питання, які можна залишити на наступний етап

Цей документ вже достатній для старту MVP. Далі можна окремо деталізувати:

* точні TypeScript типи для `.req` і `.resp`
* сигнатури IPC методів
* сценарії обробки помилок файлової системи
* правила виявлення й прив’язки пов’язаних вкладень
* структуру React state management без зайвого overengineering
* правила pretty-rendering JSON/XML

---

## 18. Підсумок

MVP Requester — це локальний файлово-орієнтований API client з передбачуваною структурою збереження, ручним контролем над змінами, виконанням HTTP-запитів у main process і простим, але практичним набором можливостей, достатнім для повсякденної роботи з HTTP API без зайвих функцій Postman.
