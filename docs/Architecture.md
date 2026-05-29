# Code Editor Package — Architecture Rulebook

This document defines the architecture of the code-editor package that lives under `src/lib/`. Every rule here is
mandatory. No exceptions.

The code-editor is a self-contained, reusable module that provides a full-featured multi-file code editor built on
Monaco. It is the foundation of the Anacode platform and must remain decoupled from any specific application feature.

> **A note on naming.** The current generation of the composition layer is suffixed `V2` (`EditorWorkspaceV2`,
> `WorkspaceEditorPaneV2`, `TabBarV2`, `SideBarV2`) and the file tree subsystem lives under `file-tree-v2/`. This
> document uses the real names so that what you read here matches what you grep for. The `V2` suffix marks the live
> implementation; older generations have been removed.

---

## 1. Package Boundary

### What this package owns

- File system abstraction (in-memory, command-driven, plan-then-execute, event-sourced)
- Content hashing and conflict detection (compare-and-swap writes against a content hash)
- Monaco editor lifecycle (attach, document switching, view state, configuration)
- Savable documents (per-document draft state, save / force-write / revert, dirty tracking)
- Document lifecycle (open, reload, evict, open-failure tracking)
- Editor intent and orchestration (open/close/save intent → active document → Monaco binding)
- Conflict resolution and the editor prompt stack (notifications, conflict and invalid-document prompts)
- File tree UI model (rows, projection, expand/collapse, search, drag-and-drop, command system)
- Tab bar projection (open tabs, active breadcrumb)
- Selection / user-space state
- Zip import/export of file system state
- Editor workspace and session (service composition for a single editor instance + bootstrap)

### What this package does NOT own

- API calls to any backend
- Application-specific domain models (tests, drivers, submissions, problems)
- Routing, navigation, or page layout
- Authentication or authorization
- Content synchronization with external stores (that belongs to consumers)

### The boundary rule

**The code-editor core (`$lib/core/*`) MUST NEVER import from any application feature, route, or page.** It is a leaf
dependency. All coupling flows inward: consumers depend on the code-editor, never the reverse.

If a feature requires knowledge of application-specific concepts (e.g. "test", "driver", "language"), that feature
belongs in the consumer package, not here. The demo consumer for this repository lives in `src/routes/` and
`src/playground/`.

---

## 2. Layered Architecture

The package is organized in strict layers. Dependencies flow downward only. A layer may depend on the layer directly
below it and on shared utilities. A layer MUST NEVER depend on a layer above it.

```
Layer 3: Composition        IEditorSession, IEditorSessionFactory, IEditorWorkspaceV2,
                            EditorSession.svelte / WorkspaceEditorPaneV2.svelte
    |
    | depends on
    v
Layer 2: Orchestration      IEditorPresentationService (EditorOrchestrationService),
         & Projection        IEditorAttachmentPort, IEditorViewStateRegistry,
                            IFileTreeProjection, ITabProjectionService
    |
    | depends on
    v
Layer 1: Primitives         IFileSystemService, ICodeEditorComponentController, IEditorDocument,
                            ISavableEditorDocument, IEditorDocumentRegistry/IDocumentCache,
                            IEditorDocumentService, IEditorSaveService, IConflictResolutionService,
                            IInvalidDocumentService, IEditorDocumentReloadService, IEditorIntentService,
                            IFileTreeSelectionIntent, IEditorUserSpaceStateService, IFileTree,
                            IFileTreeSearchService, IFileTreeDragController, ICommandRegistry,
                            IEditorPromptManager, IEditorConfigurationService, IFileSystemZipCoordinator
    |
    | depends on
    v
Layer 0: Core               file-system/* (domain, engine, commands, graph, plan-execution,
                            hashing, uri, persistance, loader), shared/* (models-utils, logger, lifecycle)
```

### Layer 0 — Core

The file system core and shared type utilities. Pure data structures, command/plan/event types, the engine, the graph
index, content hashing, and result types. Zero UI. Zero Svelte. Zero Monaco.

**Key contracts (`$lib/core/file-system/`, `$lib/core/shared/`):**

- `IFileSystemEngine` — validates a command into a `FileSystemPlan` (`canExecute`), then executes it asynchronously,
  producing a `FileSystemEvent` and holding immutable `FileSystemMapReadonly` state
- `IPlanExecutorRegistry` / `IPlanExecutor<T>` — per-plan-type executors that mutate an Immer draft and emit atomic
  events
- `IContentHashService` — content → `ContentHash` (SHA-1 by default); the basis for conflict detection
- `FileSystemLoader.load()` — validates and boots an engine from a `FileSystemMapReadonly` (async; resolves content
  hashes during load)
- `IMutableGraphIndex` / `GraphIndex` — cycle detection and subtree queries
- `Result<T, E>`, `IDisposable1`, `IInitializable<T, E>`, `Brand<K, T>`, `ITransactionEventSource<T>` — shared type
  utilities (`shared/models-utils.ts`)
- `IEditorLogger` (`shared/logger/`), `IWaitable` (`shared/lifecycle/`)

**Rules:**

- MUST NOT import from Monaco, Svelte, or any higher layer
- MUST NOT have side effects beyond the engine's own state transition
- All operations return `Result` — never throw
- Mutations are expressed as commands → plans → atomic events; nothing mutates state directly

### Layer 1 — Primitives

Individual services that each own one concern. These are the building blocks that higher layers compose.

| Service                          | Single Responsibility                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `IFileSystemService`             | Public async API over the engine (CRUD + queries + reactive structural state)      |
| `ICodeEditorComponentController` | Monaco editor instance lifecycle (attach/detach, open doc, view state, focus)      |
| `IEditorDocument`                | Single Monaco `ITextModel` wrapper (id, model, options)                            |
| `ISavableEditorDocument`         | Extends `IEditorDocument` with draft status, save / forceWrite / revert            |
| `IEditorDocumentFactory`         | Creates documents from file system nodes (with base content hash + write origin)   |
| `IDocumentCache<K>`              | Generic document cache with config sync, keyed by consumer-defined key             |
| `IEditorDocumentRegistry`        | Extends `IDocumentCache<NodeID>` — the live set of open savable documents          |
| `IEditorDocumentService`         | Open / reload / evict lifecycle over the registry; emits WILL/DID lifecycle events |
| `IEditorDocumentProvider`        | Loads document content + options from the file system (the load port)             |
| `IDocumentOpenFailureRegistry`   | Records why an open attempt failed, per node                                       |
| `IEditorSaveService`             | Aggregates per-document save state; dispatches save / saveAll / overwrite          |
| `IConflictResolutionService`     | Resolves CONFLICTED documents via overwrite / reload against a revision            |
| `IInvalidDocumentService`        | Tracks documents whose backing file disappeared (INVALID)                          |
| `IEditorDocumentReloadService`   | Reloads document buffers when the file system content changes underneath them      |
| `IEditorIntentService`           | Open/close/save intent + the truth of which document is active                     |
| `IFileTreeSelectionIntent`       | The node the user pointed at in the tree (intent, not truth)                       |
| `IEditorUserSpaceStateService`   | The active user-space tag (scoping/ownership of nodes)                             |
| `IFileTree`                      | Tree rows + expansion + focus; flatten / subtree / expand-collapse                 |
| `IFileTreeSearchService`         | Query → filter result, backed by a search index                                    |
| `IFileTreeDragController`        | Drag-and-drop intent evaluation and state                                          |
| `ICommandRegistry`               | Typed file-tree command lookup (bundled + primitive commands)                      |
| `IEditorPromptManager`           | The prompt stack: conflict, invalid-document, and notification prompts             |
| `IEditorConfigurationService`    | Font size, tab size, theme, word wrap, line numbers, minimap                       |
| `IFileSystemZipCoordinator`      | Zip import/export with pluggable strategies                                        |

**Rules:**

- Each service has exactly one reason to change
- Services communicate through `Readable<T>` stores and explicit method calls — never through shared mutable state
- Services at this layer MUST NOT depend on each other in a circular fashion
- Services MUST NOT know about Svelte components

### Layer 2 — Orchestration & Projection

The middle layer that turns the primitive services into something a UI can bind to. It contains two kinds of object:
**orchestrators** (which react to intent and lifecycle and drive Monaco) and **projections** (read-only derived render
models).

**Key contracts:**

- `IEditorPresentationService` — implemented by `EditorOrchestrationService`. Subscribes to
  `intentService.activeDocument`, the document-lifecycle event stream, and intent events. It binds/unbinds the active
  document to Monaco through the attachment port and owns view-state save/restore. It is the **single** place document
  switching is coordinated.
- `IEditorAttachmentPort` — a narrow, domain-pure boundary (`attach`, `focus`, `saveCurrentView`, `restoreView`) that
  the orchestrator uses to drive the Monaco component controller without importing Monaco itself (except the opaque
  view-state type, which only transits through).
- `IEditorViewStateRegistry` — stores Monaco view state keyed by `NodeID`; written and read by the orchestrator.
- `IFileTreeProjection` — derives `FileTreeItem[]` by merging tree rows, selection, save status, drag state, active
  file, and user-space ownership into a single render list.
- `ITabProjectionService` — derives `openTabs` and `activeBreadcrumb` from intent + file system + save state.

**Rules:**

- `EditorOrchestrationService` is the ONLY object that calls the attachment port. Consumers MUST NOT bind documents to
  Monaco themselves.
- View state is saved/restored exclusively here — there is exactly one view-state cache, owned by the orchestrator via
  `IEditorViewStateRegistry`.
- Projections are read-only and derived. They MUST NOT mutate any primitive; they only observe and combine.

### Layer 3 — Composition

Full editor experiences composed from lower layers. This is where the sidebar, tab bar, file tree, prompt stack, and the
editor view come together.

**Key contracts:**

- `IEditorWorkspaceV2` — bundles every service for one multi-file editor instance and owns their lifetime (constructs
  them in dependency order, disposes them in reverse). Exposes a `status` store (`LOADING` → `READY`).
- `IEditorSession` — the consumer-facing handle. Wraps the workspace and re-exposes the surfaces a UI binds to
  (`intent`, `selection`, `userSpaceState`, `promptManager`, `tabProjection`, `fileTreeProjection`, `codeEditor`).
- `IEditorSessionFactory` — the bootstrap. `createFromFileSystem` / `createFromFileSystemMap` / `createFromZip` build a
  fully wired, hydrated session.
- `EditorSession.svelte` → `EditorSessionMountGate.svelte` → `WorkspaceEditorPaneV2.svelte` — the component entry point
  for consumers who want a full multi-file editor.

**Rules:**

- Composition objects wire services together — they MUST NOT contain business logic
- The workspace is the only place primitive services are constructed; consumers receive an `IEditorSession`, never raw
  services they have to assemble
- `WorkspaceEditorPaneV2.svelte` takes a pre-built session — it MUST NOT create services

---

## 3. Dependency Rules

These rules are non-negotiable. They prevent the coupling that kills long-lived projects.

### 3.1 No upward dependencies

A lower layer MUST NEVER import from a higher layer. If Layer 1 needs something from Layer 2, the design is wrong —
extract the shared concern down into Layer 1 or Layer 0.

### 3.2 Core is a leaf

`$lib/core/*` MUST NEVER import from `$lib/view-models/*`, `$lib/components/*`, `$lib/ui-primitives/*`, `$lib/routes/*`,
or the playground. Coupling flows one way: `components` and `view-models` depend on `core`; `core` depends on nothing
above it.

### 3.3 Interface over implementation

All inter-service dependencies MUST be through interfaces (prefixed with `I`). Constructors receive interfaces, never
concrete classes. The only places concrete classes are instantiated are:

- Factory functions / static `load()` methods (Layer 0)
- The workspace and session factory (Layer 3)
- Svelte component `<script>` blocks at composition level (Layer 3)

### 3.4 No service-to-component coupling

TypeScript service files (`$lib/core/*`, `$lib/view-models/*`) MUST NEVER import Svelte components. Svelte components
import services and view models, never the reverse.

### 3.5 Explicit consumer API

Consumers of the code-editor should only need to import:

- **Interfaces** for typing (e.g. `IFileSystemService`, `IEditorSession`, `IEditorWorkspaceV2`)
- **Components** for rendering (e.g. `EditorSession.svelte`)
- **Factories/loaders** for bootstrapping (e.g. `FileSystemLoader`, `EditorSessionFactory`, `EditorWorkspaceV2`)
- **Models** for data types (e.g. `NodeID`, `FileNode`, `Result`)

Consumers MUST NOT import internal implementation details like command handlers, plan executors, graph index internals,
event factories, or document-provider internals.

---

## 4. File Organization Rules

### 4.1 Interface/implementation separation

Every non-trivial service follows the pattern:

```
feature/
  feature-name.ts          # Interface (IFeatureName) + error types + models
  feature-name-impl.ts     # Implementation class (FeatureName)
```

The interface file is the contract. The implementation file fulfills it. Consumers import the interface file for types
and the impl file only at composition boundaries. Models that are shared across an implementation cluster live in a
`*-models.ts` file (e.g. `conflict-resolution-models.ts`, `editor-intent-models.ts`).

### 4.2 Directory structure

```
src/lib/
  index.ts                                  # public barrel (currently empty — see §11)
  utils.ts                                  # ui-primitive class-merge helper (cn)
  core/                                     # the code-editor core — Layers 0–3 (no Svelte)
    shared/                                 #   Layer 0 cross-cuts
      models-utils.ts                       #     Result, Brand, IDisposable1, IInitializable, transaction source
      logger/                               #     IEditorLogger + console impl
      lifecycle/                            #     IWaitable (async gate for WILL_* lifecycle events)
    file-system/                            #   Layer 0 — file system core
      domain/                               #     models (nodes, commands, plans, events), computation models, errors
      commands/                             #     command types + handlers + registry
      engine/                               #     IFileSystemEngine implementation
      graph/                                #     graph index (cycle detection, subtree queries)
      plan-execution/                       #     plan executors (create/delete/rename/move/update) + registry
      hashing/                              #     IContentHashService (SHA digest)
      event-factory/                        #     node + event factories
      uri/                                  #     file system path factory
      loader/                               #     FileSystemLoader, map builder, ID/timestamp generators
      services/                             #     IFileSystemService (+ command-factory)
      persistance/                          #     zip import/export (export/ + import/ strategies, coordinator)
      history/                              #     history (placeholder)
    editor/                                 #   Layer 1 — Monaco-facing services
      configuration/                        #     IEditorConfigurationService + config models
      code-editor/                          #     ICodeEditorComponentController (Monaco instance)
      document/                             #     IEditorDocument, ISavableEditorDocument (draft state)
      document-factory/                     #     IEditorDocumentFactory
      document-registry/                    #     IEditorDocumentRegistry + cache/ (IDocumentCache<K>)
      document-lifecycle/                   #     IEditorDocumentService (open/reload/evict) + document-load/ + open-failure-registry/
      save/                                 #     IEditorSaveService + registry/ (draft registry)
      conflict-resolution/                  #     IConflictResolutionService + models
      invalid-document/                     #     IInvalidDocumentService
      reload-service/                       #     IEditorDocumentReloadService
      view-state/                           #     IEditorViewStateRegistry
      intent/                               #     IEditorIntentService (open/close/save intent + active document)
      utils/themes/                         #     Monaco themes
    code-editor/                            #   Layer 2 — orchestration
      editor-orchestration-service.ts       #     IEditorPresentationService
      editor-orchestration-service-impl.ts  #     EditorOrchestrationService (intent + lifecycle → Monaco)
      editor-orchestration-models.ts        #     DocumentState, open-intent errors
      editor-attachment-port.ts             #     IEditorAttachmentPort (domain-pure Monaco boundary)
    editor-prompt/                          #   Layer 1/2 — prompt stack
      editor-prompt.ts                      #     EditorPrompt union (conflict / invalid / notification)
      editor-prompt-manager.ts              #     IEditorPromptManager
      editor-prompt-messages.ts             #     prompt copy
    state/                                  #   Layer 1 — intent state
      selection/                            #     IFileTreeSelectionIntent
      user-space/                           #     IEditorUserSpaceStateService
    tab-bar/                                #   Layer 2 — ITabProjectionService + models
    file-tree-v2/                           #   Layer 1/2 — file tree subsystem
      tree/                                 #     IFileTree (rows, expansion, focus)
      tree-engine/                          #     tree data structure + sorted graph
      projection/                           #     IFileTreeProjection (render items)
      search/                               #     index + engine + IFileTreeSearchService
      drag/                                 #     drag controller, drop-intent evaluator, hover expander
      commands/                             #     command system: command-registry + ui/ + save/ + file-system/ + bundles
    session/                                #   Layer 3 — IEditorSession + IEditorSessionFactory
    workspace/                              #   Layer 3 — IEditorWorkspaceV2 + sync/ (file URI builder)
  view-models/                              # Svelte-facing view models (no components)
    file-tree/                              #   tree VM, dialog VM, context-menu VM, action-bar VM, icons
  components/                               # Svelte UI components
    EditorSession.svelte                    #   Layer 3 entry point
    EditorSessionMountGate.svelte           #   remounts on session change
    WorkspaceEditorPaneV2.svelte            #   layout: sidebar + tabs + editor + prompts + footer
    EditorFooter.svelte
    editor/                                 #   CodeEditorViewV3 (Monaco mount point)
    side-bar/                               #   SideBarV2
    tab-bar/                                #   TabBarV2, Tab, BreadcrumbBar
    file-tree/                              #   FileTreeView, FileTreeRow, context menu, file-icon
    action-bar/                             #   FileTreeActionBar
    dialog/                                 #   ActionDialog, DeleteDialog, NameInputDialog
    editor-prompt/                          #   EditorPromptStack + per-kind prompt views
  ui-primitives/                            # shadcn-style primitives (button, dialog, select, ...) with index.ts barrels
```

### 4.3 Naming conventions

| Kind                | Pattern                      | Example                                       |
| ------------------- | ---------------------------- | --------------------------------------------- |
| Interface           | `I` prefix                   | `IFileSystemService`                          |
| Observable subset   | `IObservable` prefix         | `IObservableEditorSaveState`                  |
| Implementation      | No prefix, matches interface | `FileSystemService`                           |
| Interface file      | `kebab-case.ts`              | `file-system-service.ts`                      |
| Implementation file | `kebab-case-impl.ts`         | `file-system-service-impl.ts`                 |
| Models file         | `feature-name-models.ts`     | `conflict-resolution-models.ts`               |
| Svelte component    | `PascalCase.svelte`          | `WorkspaceEditorPaneV2.svelte`                |
| Error kind enum     | `FeatureNameErrorKind`       | `DocumentSaveErrorKind`                       |
| Branded type        | `Brand<K, T>`                | `NodeID = Brand<number, 'NodeID'>`            |
| Failure type        | `OperationFailure<K>`        | `EditorSavePersistenceFailure`                |
| View model          | `FeatureNameViewModel`       | `FileTreeViewModel`                           |
| State interface     | `FeatureNameState`           | `EditorSaveState`                             |

---

## 5. Core Patterns

### 5.1 Command → Plan → Event Pattern (File System Core)

All mutations to the file system go through commands. A command is first validated into a `FileSystemPlan` (a list of
`AtomicPlanPayload` describing intended changes), then executed asynchronously to produce atomic events.

```
Consumer                IFileSystemService          IFileSystemEngine            PlanExecutorRegistry
   |                          |                            |                            |
   |-- createFile(p, n) ----->|                            |                            |
   |                          |-- canExecute(CreateCmd) -->|                            |
   |                          |                            |-- validate → FileSystemPlan|
   |                          |-- execute(CreateCmd) ----->|                            |
   |                          |                            |-- getExecutor(planType) -->|
   |                          |                            |   mutate Immer draft, emit |
   |                          |                            |<-- AtomicEventPayload[] ---|
   |                          |<- Result<FileSystemEvent> -|                            |
   |                          |-- notify onTransaction --->|                            |
   |<- Result<NodeID, Error> -|                            |                            |
```

**Rules:**

- Commands are the ONLY way to mutate file system state
- The engine's `execute()` is **async** and returns `Result<FileSystemEvent, OperationError>`; `canExecute()` returns
  the plan without mutating
- Every plan is realized as zero or more `AtomicEventPayload` entries; events are grouped into a `FileSystemEvent` with
  an id, timestamp, description, and the originating plan
- The engine state (`FileSystemMapReadonly`) is the single source of truth; mutations run against an Immer draft inside
  the executor
- Content writes carry a `FileSystemWriteOrigin` so a writer can recognize (and ignore) its own echo
- Consumers observe changes through `onTransaction()`. The reactive `fileSystemMap` store emits only on **structural**
  events (created / deleted / moved / renamed) — content writes do not re-emit the map

### 5.2 Result Pattern (Error Handling)

All operations that can fail return `Result<T, E>`. Never throw exceptions.

```typescript
Result<T, E = OperationError> = { ok: true; value: T } | { ok: false; error: E }
```

Constructors `success(value)` / `failure(error)` live in `shared/models-utils.ts`. Domain errors are typed:
`OperationError` (a `message`), `OperationFailure<K>` (adds a discriminant `kind`), and `NodeOperationFailure<K>` (adds a
`nodeID`). File-system computation helpers `valid()` / `invalid()` live in
`file-system/domain/file-system-computation-models.ts`.

**Rules:**

- Never throw. Ever. In any layer.
- Always check `.ok` before accessing `.value` or `.error`
- Error types are domain-specific — use `OperationFailure<Kind>` enums, not bare string messages, so callers can branch
  on `error.kind`

### 5.3 Reactive State Pattern

Services expose state through Svelte `Readable<T>` stores. Internal mutation uses `Writable<T>`. The public interface
only exposes `Readable<T>`. The read-only projection of a service is conventionally split into an `IObservableX`
interface that the writable service extends.

```
Interface:  readonly state: Readable<EditorSaveState>     (via IObservableEditorSaveState)
Internal:   private readonly _state: Writable<EditorSaveState>
```

**Rules:**

- NEVER expose `Writable<T>` on a public interface
- Derived state MUST use Svelte `derived()` stores — never manually update derived state
- Always check whether a new value differs from the current value before triggering store updates

### 5.4 Dispose Pattern

All services that hold subscriptions or resources implement `IDisposable1` with a `dispose()` method.

**Rules:**

- Store all `Unsubscriber` references at construction time
- Call all unsubscribers in `dispose()`; clear all caches, timers, and maps
- The owner of a service calls `dispose()` — the service does not dispose itself. The workspace disposes its services in
  reverse construction order.
- Components call `dispose()` (on the workspace/session) in `onDestroy`
- Exception: `IFileSystemService` exposes `destroy()` rather than `dispose()` (see §11)

### 5.5 View State Caching Pattern

When the active document changes, the outgoing document's cursor position, scroll state, and selection are saved; the
incoming document's cached state is restored.

```
active document changes (intent.activeDocument):
  1. save current Monaco view state -> viewStateRegistry.save(previousNodeID)
  2. attachmentPort.attach(newDocument)
  3. restore viewStateRegistry.get(newNodeID) (if present)
```

This lives in exactly one place: `EditorOrchestrationService`, keyed by `NodeID`, backed by `IEditorViewStateRegistry`.
The orchestrator also saves/clears view state around `DOCUMENT_WILL_RELOAD` and `DOCUMENT_WILL_EVICT` so reloads and
evictions do not strand stale state.

**Rule:** Consumers MUST NOT call the attachment port or the Monaco controller's `openDocument()` directly — that skips
view-state save/restore. Drive document changes through intent (`intentService.open(...)`).

### 5.6 Strategy Pattern (Zip Import/Export)

The zip coordinator uses pluggable strategies for input/output format conversion, so the same zip logic works with
different data representations (base64, Blob, File, etc.).

```
IZipInputStrategy<T>   — converts T into a zip-readable format (import)
IZipOutputStrategy<T>  — converts the zip output into T (export)
```

**Rule:** New format support is added by implementing a new strategy, not by modifying the coordinator.

### 5.7 Document Lifecycle & FS-Truth Subscription Pattern

Documents are not pushed updates by a central synchronizer. Instead, `IEditorDocumentService` owns the open set, and
each `ISavableEditorDocument` subscribes to file-system truth itself (wired in its constructor) to keep its draft status
honest.

```
File System (truth)                      Savable Document
   |                                          |
   |-- NODE_CONTENT_UPDATED (other origin) -->| recompute draftStatus (may → CONFLICTED)
   |-- NODE_DELETED ------------------------->| draftStatus → INVALID
   |                                          |
IEditorDocumentService                        |
   |-- open(nodeID)  --> load + cache + emit DOCUMENT_DID_OPEN
   |-- reload(nodeID)--> emit DOCUMENT_WILL_RELOAD (awaitable) → swap buffer → DOCUMENT_DID_RELOAD
   |-- evict(nodeID) --> emit DOCUMENT_WILL_EVICT (awaitable) → dispose → DOCUMENT_DID_EVICT
```

**Rules:**

- The document service is the single owner of the open document set; consumers open/reload/evict through it, never by
  mutating the registry
- Lifecycle events come in `WILL_*` / `DID_*` pairs. `WILL_*` events are `IWaitable` — a listener (e.g. the orchestrator
  detaching Monaco) can register async work that the service awaits before proceeding
- A document recomputes its own status from FS events; it must ignore content events that carry its own
  `FileSystemWriteOrigin`

### 5.8 Save & Draft-State Pattern

A savable document is a small state machine over its draft. Content lives in the Monaco model (never duplicated onto
status variants); the status only records whether the buffer is saveable and against which hash.

```
DraftStatusKind:
  CLEAN       buffer matches the persisted file
  SAVEABLE    buffer differs; safe to write (carries contentHash + revision)
  CONFLICTED  the file changed on disk since this draft's base (carries contentHash + actualHash)
  INVALID     the backing file no longer exists on disk
```

Writes are the only public mutators (`ISavableEditorDocumentWriter`):

- `save()` — CLEAN → no-op; SAVEABLE → compare-and-swap write, self-promotes to CONFLICTED on CAS failure; CONFLICTED →
  returns CONFLICTED (caller must `forceWrite()` or `revert()`); INVALID/READ_ONLY → typed error
- `forceWrite()` — resolves a CONFLICTED draft by rebasing onto the latest FS snapshot and writing against it
  **atomically** (one operation, to close the TOCTOU window a rebase-then-save split would open)
- `revert()` — discards the draft, rereads the file, returns to CLEAN

**Rules:**

- The document owns its own save state; `IEditorSaveService` is a thin coordinator that *reads* each document's status
  to project aggregates (`dirtyCount`, `saveableNodeIDs`, `conflictedNodeIDs`, `invalidNodeIDs`) and *dispatches*
  commands by calling per-document methods. It holds no per-document state.
- Conflict detection is compare-and-swap on `ContentHash` via `updateContentIf` — never a blind `updateContent` for a
  user-initiated save
- `pendingSave` (a write is in flight) is independent of `draftStatus`; a document can be SAVEABLE *and* pendingSave at
  once (the user typed during a write)
- Command methods (save / forceWrite / revert) run serially per document (FIFO); they do not coalesce

### 5.9 Conflict Resolution & the Prompt Stack

When a document is CONFLICTED or INVALID, resolution is surfaced to the user through the prompt stack rather than handled
silently. `IEditorPromptManager` owns an ordered list of `EditorPrompt`s of three kinds: `CONFLICT_RESOLUTION`,
`INVALID_DOCUMENT`, and `NOTIFICATION`.

```
ConflictResolutionService (CONFLICTED docs) ─┐
InvalidDocumentService    (INVALID docs)     ├─► EditorPromptManager ─► EditorPromptStack.svelte
notifications                                ─┘     (prompts: Readable<EditorPrompt[]>)
```

A conflict prompt carries the `nodeID`, file name, the draft `revision` it was raised for, and a status
(`AWAITING` → `RESPONDING(strategy)` → `FAILED(message)`). The user responds with a
`ConflictResolutionStrategy` (`OVERWRITE` or `RELOAD`), which routes to `conflictResolutionService.overwrite(...)` /
`reload(...)`.

**Rules:**

- The `revision` pins a prompt to the draft state it was raised against. If the file changes again, the stale revision
  makes the resolution fail (`STALE_REVISION`) rather than silently clobbering the newer change — the prompt is
  re-raised against the new revision.
- Resolution flows through the document's `forceWrite()` / `revert()` writers; the prompt manager and conflict service
  never write to the file system directly

### 5.10 Intent vs. Truth Pattern

Two states look similar but are deliberately separate:

- **Intent** — `IFileTreeSelectionIntent.selectedNodeID` records the node the user pointed at. It may reference a node
  that was deleted, does not exist yet, or is otherwise unactionable.
- **Truth** — `IEditorIntentService.activeDocument` (`DocumentState`) is the document actually bound to the editor.

```
selection intent: "user clicked node 42"   (may be stale / unactionable)
active document:  "node 17 is loaded in Monaco"   (reconciled truth)
```

**Rules:**

- Consumers reconcile intent against truth at action time; they MUST NOT assume the selected node is open or even exists
- Status and derived state are computed from **truth** (the actual loaded/active document, the actual filter result),
  never from the intent input. See §7.9.

### 5.11 Orchestration via a Domain-Pure Port

`EditorOrchestrationService` (Layer 2) is the bridge between domain state (intent + document lifecycle) and the Monaco
component (Layer 1 UI controller). It never imports Monaco directly; it speaks to `IEditorAttachmentPort`, whose
implementation lives next to the Monaco controller and routes the verbs to it.

**Rules:**

- The orchestrator reacts to three streams only: `intentService.activeDocument`, intent events, and document-lifecycle
  events. It does not poll.
- All Monaco interaction (attach, focus, view state) crosses the port. The orchestrator stays domain-pure so it can be
  reasoned about and tested without Monaco.

### 5.12 Plan Execution & Conditional Writes

Mutations are realized by per-type executors registered in `IPlanExecutorRegistry`. Each `IPlanExecutor<T>` receives an
Immer `Draft<FileSystemMap>`, the typed plan payload, the graph index, and the path factory, and returns the atomic
events it produced.

Content writes come in two forms:

- `updateContent(id, content, origin)` — unconditional write
- `updateContentIf(id, content, origin, targetHash)` — compare-and-swap: writes only if the current content hash equals
  `targetHash`, otherwise fails so the caller can detect the conflict

**Rules:**

- Adding a new mutation = adding a plan type + an executor, not branching inside the engine
- User-initiated saves MUST use the conditional `updateContentIf` so concurrent external writes are detected, not lost

### 5.13 File Tree Search & Index Pattern

The file tree search subsystem (`file-tree-v2/search/`) follows a strict separation of three concerns: **indexing**,
**querying**, and **structural resolution**. Each concern has exactly one owner. Getting this separation wrong was the
most common mistake during development — the principles below were learned through iterative correction.

#### Concern map

```
IFileSystemEngine (source of truth)
       │
       ▼
IFileTreeIndex               ← INDEXING: maintains a search-optimized projection
       │
       ▼
IFileTreeSearchEngine        ← QUERYING: turns index answers into filter results
       │
       ▼
IFileTreeSearchService       ← ORCHESTRATION: wires index + engine, exposes a filter provider
       │
       ▼
IFileTreeProjection          ← STRUCTURAL RESOLUTION: resolves ancestors, builds the visible item list
```

#### Principle 1 — The index is an architectural boundary, not an optimization

`IFileTreeIndex` exists to give indexing logic a home. It subscribes to file system transactions and keeps a
search-optimized projection, following the same hydrate+subscribe pattern as the graph index. This is not about
performance — a linear scan over 50 nodes is imperceptible. It exists so the indexing strategy can evolve (linear scan
today, trie tomorrow, content indexing later) without touching the search or view layers.

#### Principle 2 — The index exposes query methods, not raw data

Following the graph index pattern (`validateMove()`, `getSubtree()`, not raw edge lists): consumers ask questions; the
index answers.

```
// WRONG — raw data dump, consumer does the work
interface FileTreeIndexSnapshot {
    readonly nodes: ReadonlyArray<IndexedNode>;
    readonly nodesByID: ReadonlyMap<NodeID, IndexedNode>;
}

// RIGHT — query interface, index owns the search strategy
interface FileTreeIndexSnapshot {
    findBySubstring(text: string): ReadonlyArray<NodeID>;
}
```

Replacing the internal structure (Map → Trie) then changes exactly one file: the index implementation.

#### Principle 3 — Filter declares intent, tree resolves structure

The filter result contains `targetNodeIDs` — the nodes the filter wants to show. It does NOT include ancestor folders.
The projection owns structural resolution: it walks the tree's parent relationships to compute the full visibility set.

```
Filter says:  "show helper.ts"                         → { targetNodeIDs: {helper.ts} }
Tree knows:   "to show helper.ts I need src/, utils/"  → resolveVisibleNodes()
```

The filter's job is matching (search concern), not tree traversal (graph concern). Invalid filter results (a target
without its ancestors) become impossible, because the tree always resolves structure.

**Rule of thumb: if you find yourself walking parent chains, you are doing graph operations and likely in the wrong
layer. Delegate to the tree.**

#### Principle 4 — Derive status from truth, not assumptions

Search status (`IDLE` / `SEARCHING`) is derived from the actual filter result (the output), not from the query input.

```
// WRONG — assumes a non-empty query means searching
derived(this._searchQuery, (query) => query === '' ? IDLE : SEARCHING);

// RIGHT — reflects whether a filter is actually active
derived(this._filterResult, (result) => result === null ? IDLE : SEARCHING);
```

If conditions change (minimum query length, debounce, async search), assumption-based derivation lies. Truth-based
derivation is always correct.

### 5.14 File Tree Command System

File-tree operations are modeled as typed commands in `file-tree-v2/commands/`, split into three families — file-system
actions (`create`, `rename`, `delete`, `move`, `copy-path`), UI commands (`expand`, `collapse`, `locate-active-file`),
and save commands (`save-all`). Each command has two forms:

- **Primitive** (`IFileTreeAction` / `IFileTreeUICommand` / `IFileTreeSaveCommand`) — the raw operation
- **Bundled** (`IBundledCommand` / `IBundledInputCommand`) — the primitive plus the context a UI needs to invoke it
  (enablement, input shape, error surfacing)

Both are looked up through a single typed registry: `ICommandRegistry.getCommand(id)` returns the bundle,
`IPrimitiveCommandRegistry.getPrimitive(id)` returns the primitive. The mapping from command id to its input/result/error
types is encoded in `CommandBundleTypeMap` / `PrimitiveCommandTypeMap`, so the registry is fully type-safe per id.

**Rules:**

- UI components dispatch commands by id through the registry; they MUST NOT call file-system or save services directly
- A new command = a new id + primitive + bundle entry in the type maps; the registry signature does the rest

### 5.15 Projection Pattern

UI binds to **projections** — read-only derived render models — not to primitive services. `IFileTreeProjection`
produces `FileTreeItem[]` by merging tree rows with selection, save status, drag state, active-file, and user-space
ownership. `ITabProjectionService` produces `openTabs` + `activeBreadcrumb`. `IObservableEditorSaveState` projects
per-document draft status into aggregates.

**Rules:**

- A projection is derived and read-only; it observes primitives and combines them, and mutates nothing
- Put the merge logic in the projection, not the component. A component renders a `FileTreeItem`; it does not compute
  `isDropTarget` or `saveStatus` itself.

---

## 6. Component Architecture

### 6.1 Component–ViewModel/Service binding

Svelte components receive view models or service surfaces as props. Components render state and forward user actions.
Components MUST NOT contain business logic.

```
Component                        ViewModel / Service surface
   |                                |
   | receives as prop               |
   |<-------------------------------|
   | subscribes to stores           |
   |-------- $derived($store) ----->|
   | forwards user actions          |
   |--- onclick -> registry.getCommand(id).run() -->|
```

### 6.2 Composition hierarchy

```
EditorSession.svelte (entry point — takes IEditorSession)
  |
  |-- {#key session} EditorSessionMountGate.svelte   (remounts cleanly on session swap)
       |
       |-- WorkspaceEditorPaneV2.svelte (takes IEditorSession)
            |
            |-- SideBarV2.svelte
            |     |-- FileTreeActionBar.svelte
            |     |-- FileTreeView.svelte
            |           |-- FileTreeRow.svelte (per item, from IFileTreeProjection)
            |           |-- FileTreeContextMenu.svelte
            |     |-- dialogs: NameInputDialog / DeleteDialog / ActionDialog
            |
            |-- TabBarV2.svelte
            |     |-- Tab.svelte (per open tab, from ITabProjectionService)
            |     |-- BreadcrumbBar.svelte
            |
            |-- CodeEditorViewV3.svelte (Monaco mount point — binds to codeEditor controller)
            |-- EditorPromptStack.svelte (from IEditorPromptManager)
            |     |-- ConflictResolutionPromptView / InvalidDocumentPromptView / NotificationPromptView
            |-- EditorFooter.svelte (save state, status)
```

### 6.3 Component responsibility boundaries

| Component                       | Responsibility                                  | MUST NOT                                       |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `EditorSession.svelte`          | Take a session, remount on change               | Create services                                |
| `WorkspaceEditorPaneV2.svelte`  | Lay out sidebar + tabs + editor + prompts       | Contain business logic; create services        |
| `CodeEditorViewV3.svelte`       | Mount Monaco; attach the component controller   | Know about documents, sessions, or view state  |
| `SideBarV2.svelte`              | Render file tree + action bar + dialogs         | Create file tree data structures               |
| `FileTreeView.svelte`           | Render projection items                         | Compute save/drag/selection flags              |
| `FileTreeRow.svelte`            | Render one `FileTreeItem`; dispatch commands    | Walk parents, manage expansion state           |
| `TabBarV2.svelte`               | Render tabs + breadcrumb; forward intent        | Manage tab state (reads `ITabProjectionService`)|
| `EditorPromptStack.svelte`      | Render the prompt list; forward responses       | Resolve conflicts itself                       |

---

## 7. Anti-Patterns — What NOT to Do

### 7.1 NEVER bypass the command pattern

```
// WRONG: directly mutating state
engine.state[nodeID] = newNode;

// RIGHT: go through a command
await fileSystemService.createFile(parentID, name);
```

### 7.2 NEVER import implementations where interfaces suffice

```
// WRONG: depends on the concrete class
import { FileSystemService } from './file-system-service-impl';
function doSomething(service: FileSystemService) { ... }

// RIGHT: depends on the interface
import type { IFileSystemService } from './file-system-service';
function doSomething(service: IFileSystemService) { ... }
```

### 7.3 NEVER let a Svelte component own business logic

```
// WRONG: logic in component
function handleDelete() {
  if (node.permissions.delete && !hasChildren(node)) {
    await fileSystem.deleteNode(node.id);
    await intent.close(node.id);
  }
}

// RIGHT: dispatch a command
function handleDelete() {
  commandRegistry.getCommand(FileTreeActionID.DELETE).run();
}
```

### 7.4 NEVER create circular dependencies between services

```
// WRONG: A depends on B, B depends on A
class ServiceA { constructor(b: IServiceB) {} }
class ServiceB { constructor(a: IServiceA) {} }

// RIGHT: extract the shared concern or communicate via events
class ServiceA { constructor(shared: ISharedService) {} }
class ServiceB { constructor(shared: ISharedService) {} }
```

### 7.5 NEVER throw exceptions in service code

```
// WRONG
if (!node) throw new Error('Node not found');

// RIGHT
if (!node) return failure({ kind: ErrorKind.NODE_NOT_FOUND, nodeID, message: '...' });
```

### 7.6 NEVER expose Writable stores on interfaces

```
// WRONG
interface IService { readonly state: Writable<State>; }

// RIGHT
interface IService { readonly state: Readable<State>; }
```

### 7.7 NEVER drive Monaco around the orchestrator

```
// WRONG: bind a document straight to the controller — skips view-state save/restore
codeEditorController.openDocument(doc);

// RIGHT: express the intent; the orchestrator binds and manages view state
await intentService.open(nodeID);
```

### 7.8 NEVER manually synchronize derived state

```
// WRONG
this.tabCount.set(get(this.tabs).length);

// RIGHT
this.tabCount = derived(this.tabs, (tabs) => tabs.length);
```

### 7.9 NEVER derive status from intent instead of truth

```
// WRONG: assume the selected node is the active document
const isEditing = derived(selection.selectedNodeID, (id) => id !== null);

// RIGHT: read the reconciled truth
const isEditing = derived(intent.activeDocument, (s) => s.kind === DocumentStateKind.LOADED);
```

Intent may be stale or unactionable (§5.10). Derive from the actual loaded/active state or the actual filter result.

### 7.10 NEVER do graph operations outside the tree layer

```
// WRONG — search/filter walks the parent chain to build a visibility set
for (const nodeID of matchedIDs) {
    let parentID = snapshot.getParentID(nodeID);
    while (parentID !== null) { visible.add(parentID); parentID = snapshot.getParentID(parentID); }
}

// RIGHT — filter returns targets; the tree/projection resolves ancestors
return { targetNodeIDs: matchedIDs };
```

Graph traversal belongs to the layer that owns the graph (the graph index for validation, the tree/projection for
rendering). If search, filter, or index code calls `getParentID()`, the boundary is wrong.

### 7.11 NEVER expose raw data from an index

```
// WRONG — consumer iterates raw data and does the searching
interface Snapshot { readonly nodes: ReadonlyArray<IndexedNode>; }

// RIGHT — consumer asks; the index answers
interface Snapshot { findBySubstring(text: string): ReadonlyArray<NodeID>; }
```

An index that exposes its internal structure is just a cache; changing the internals cascades to every consumer. Query
methods encapsulate the strategy.

### 7.12 NEVER blind-write a user save

```
// WRONG: a user save that ignores concurrent external writes
await fileSystemService.updateContent(id, buffer, origin);

// RIGHT: compare-and-swap against the draft's base hash so a conflict is detected, not lost
await fileSystemService.updateContentIf(id, buffer, origin, baseHash);   // document.save() does this
```

### 7.13 NEVER add abstraction layers without multiple consumers

```
// WRONG — compositor wrapping a single provider
const compositor = new FilterCompositor([searchService]);

// RIGHT — pass the single provider directly; introduce composition when a second consumer arrives
const projection = new FileTreeProjectionImpl(..., searchService);
```

An abstraction with one consumer is indirection, not abstraction.

---

## 8. Lifecycle and Initialization

### 8.1 File system boot sequence

```
1. Build FileSystemMapReadonly from data (consumer responsibility, or via FileSystemMapBuilder)
2. await FileSystemLoader.load(map)
     |-- GraphIndex.fromState (cycle check)
     |-- validate root-is-folder, parent types, sibling-name uniqueness
     |-- resolve content hashes for every file (async, ContentHashService)
     |-- build engine (command registry, plan-executor registry, factories, path factory)
     -> Result<IFileSystemEngine, OperationError>
3. new FileSystemService(engine) -> IFileSystemService
```

### 8.2 Session / workspace boot sequence

```
1. EditorSessionFactory.createFromFileSystem(fileSystemService, configService)
   (or createFromFileSystemMap / createFromZip)
     |-- builds the file system (loader) if needed
     |-- new EditorWorkspaceV2(fileSystemService, configService)
     |     constructs, in dependency order:
     |       content hash service, file URI builder, document factory
     |       document registry  ->  save service
     |       document provider + open-failure registry  ->  document service
     |       reload service, intent service, view-state registry
     |       code editor controller + attachment port  ->  orchestration service
     |       file-tree workspace (tree, search, drag, command registry, projection)
     |       tab projection
     |       conflict-resolution + invalid-document services  ->  prompt manager
     |     status = LOADING
     |-- hydrate (open the documents the session should start with)
     |-- wrap in IEditorSession
     -> Result<IEditorSession, CreateEditorSessionError>

2. workspace.initialize()  ->  status = READY  (after a minimum loading delay)

3. [session is live — components bind to it]

4. workspace.dispose()  (disposes every service in reverse construction order)
```

### 8.3 Document open / reload / evict sequence

```
open(nodeID):
  1. provider loads content + options + base hash from the file system
  2. construct ISavableEditorDocument (subscribes to FS truth, computes draftStatus)
  3. cache in the registry; emit DOCUMENT_DID_OPEN
  (on failure: record in the open-failure registry; return a typed EditorDocumentOpenError)

reload(nodeID):
  1. emit DOCUMENT_WILL_RELOAD (awaitable — orchestrator detaches Monaco + saves view state)
  2. reread the buffer from the file system; swap the model content; advance base hash
  3. emit DOCUMENT_DID_RELOAD (orchestrator re-binds + restores view state if this node is active)

evict(nodeID):
  1. emit DOCUMENT_WILL_EVICT (awaitable — orchestrator detaches + saves view state)
  2. dispose the document; remove from the registry
  3. emit DOCUMENT_DID_EVICT
```

### 8.4 Active-document binding sequence (orchestration)

```
intentService.open(nodeID)
  -> document service ensures the document is open
  -> intentService.activeDocument emits DocumentState{ LOADED, nodeID }
  -> EditorOrchestrationService.handleActiveDocumentChange:
       1. if a different node was bound, save its view state
       2. attachmentPort.attach(loadedDocument)
       3. restore cached view state for the new node
  -> on INTENT_DID_OPEN with focusOnReady: attachmentPort.focus()
```

### 8.5 Save / conflict sequence

```
save(nodeID)  (via intent -> save service -> document.save()):
  CLEAN       -> nothing to do
  SAVEABLE    -> updateContentIf(base hash) ; CAS ok -> CLEAN ; CAS fail -> CONFLICTED
  CONFLICTED  -> returns CONFLICTED (prompt raised)
  INVALID     -> returns INVALID  (prompt raised)

conflict prompt (EditorPromptManager):
  OVERWRITE -> conflictResolutionService.overwrite(nodeID, revision) -> document.forceWrite()
  RELOAD    -> conflictResolutionService.reload(nodeID, revision)    -> document.revert()
  stale revision -> resolution fails; prompt re-raised against the new revision
```

---

## 9. Public API Surface

These are the exports that consumers may depend on. Everything else is internal. Paths are relative to `src/lib/`.

### Models and Types

| Export                                                         | File                                                |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `NodeID`, `FileNode`, `FolderNode`, `FileSystemNode`           | `core/file-system/domain/file-system-models.ts`     |
| `FileSystemMapReadonly`, `IFileSystemEngine`                   | `core/file-system/domain/file-system-models.ts`     |
| `NodePermissions`, `DEFAULT_PERMISSIONS`, `LOCKED_PERMISSIONS`, `ROOT_PERMISSIONS` | `core/file-system/domain/file-system-models.ts` |
| `ContentHash`, `FileSystemWriteOrigin`, `UserSpaceTag`, `FileSystemPath` | `core/file-system/domain/file-system-models.ts` |
| `isFileNode()`, `isFolderNode()`, `ROOT_NODE_ID`              | `core/file-system/domain/file-system-models.ts`     |
| `Result<T, E>`, `Brand<K, T>`, `IDisposable1`, `IInitializable`, `success()`, `failure()` | `core/shared/models-utils.ts`        |
| `EditorDocumentID`, `EditorDocumentOptions`, `DraftStatus`, `DraftStatusKind` | `core/editor/document/...`                  |
| `EditorPrompt`, `EditorPromptKind`, `ConflictResolutionStrategy` | `core/editor-prompt/editor-prompt.ts`             |

### Interfaces (for typing)

| Export                                               | File                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `IFileSystemService`                                 | `core/file-system/services/file-system-service.ts`              |
| `IEditorSession`, `IEditorSessionFactory`            | `core/session/editor-session.ts`                                |
| `IEditorWorkspaceV2`, `IEditorFileTreeWorkspaceV2`   | `core/workspace/editor-workspace-v2.ts`                         |
| `IEditorDocument`, `ISavableEditorDocument`          | `core/editor/document/editor-document.ts`, `.../savable-editor-document.ts` |
| `IEditorDocumentService`                             | `core/editor/document-lifecycle/editor-document-service.ts`     |
| `IEditorSaveService`, `IObservableEditorSaveState`   | `core/editor/save/editor-save-service.ts`                       |
| `IConflictResolutionService`                         | `core/editor/conflict-resolution/conflict-resolution-service.ts`|
| `IEditorIntentService`                               | `core/editor/intent/editor-intent-service.ts`                   |
| `IEditorPresentationService`, `IEditorAttachmentPort`| `core/code-editor/editor-orchestration-service.ts`, `.../editor-attachment-port.ts` |
| `ICodeEditorComponentController`                     | `core/editor/code-editor/code-editor-controller.ts`             |
| `IEditorViewStateRegistry`                           | `core/editor/view-state/editor-view-state-registry.ts`          |
| `IEditorPromptManager`                               | `core/editor-prompt/editor-prompt-manager.ts`                   |
| `IFileTree`, `IFileTreeProjection`, `IFileTreeSearchService` | `core/file-tree-v2/tree/...`, `.../projection/...`, `.../search/...` |
| `ICommandRegistry`, `IPrimitiveCommandRegistry`      | `core/file-tree-v2/commands/command-registry.ts`                |
| `ITabProjectionService`                              | `core/tab-bar/tab-projection-service.ts`                        |
| `IFileTreeSelectionIntent`, `IEditorUserSpaceStateService` | `core/state/selection/...`, `core/state/user-space/...`   |
| `IEditorConfigurationService`                        | `core/editor/configuration/editor-config-models.ts`             |
| `IFileSystemZipCoordinator`                          | `core/file-system/persistance/file-system-coordinator.ts`       |

### Factories and Loaders (for bootstrapping)

| Export                                       | File                                                            |
| -------------------------------------------- | --------------------------------------------------------------- |
| `FileSystemLoader.load()`                    | `core/file-system/loader/file-system-loader.ts`                |
| `FileSystemService` (constructor)            | `core/file-system/services/file-system-service-impl.ts`        |
| `EditorSessionFactory`                       | `core/session/editor-session-factory-impl.ts`                  |
| `EditorWorkspaceV2` (constructor)            | `core/workspace/editor-workspace-v2-impl.ts`                   |
| `StaticDefaultEditorConfigurationService`    | `core/editor/configuration/editor-config-models.ts`            |
| `FileSystemZipCoordinator` (constructor)     | `core/file-system/persistance/file-system-coordinator-impl.ts` |
| Zip strategies                               | `core/file-system/persistance/export/`, `.../import/`          |

### Components (for rendering)

| Export                          | File                                          | Layer                              |
| ------------------------------- | --------------------------------------------- | ---------------------------------- |
| `EditorSession.svelte`          | `components/EditorSession.svelte`             | 3 — Full multi-file editor entry   |
| `WorkspaceEditorPaneV2.svelte`  | `components/WorkspaceEditorPaneV2.svelte`     | 3 — Session-bound editor layout    |
| `CodeEditorViewV3.svelte`       | `components/editor/CodeEditorViewV3.svelte`   | 1 — Monaco mount point             |

---

## 10. Extending the Package

### Adding a new file system command

1. Add the command type to `CommandType` and a command interface to the `FileSystemCommand` union
   (`file-system/domain/file-system-models.ts`)
2. If it implies a new kind of change, add a `FileSystemPlanType` + an `AtomicPlanPayload` variant (and the matching
   event in `AtomicEventPayload`)
3. Add a command handler in `commands/handlers/` and register it in the command registry
4. Add a plan executor in `plan-execution/executors/` and register it in `PlanExecutorRegistry`
5. Add the public method to `IFileSystemService` + the implementation
6. Update the event factory if a new event type was introduced

### Adding a new editor prompt kind

1. Add a variant to the `EditorPrompt` union and `EditorPromptKind` (`editor-prompt/editor-prompt.ts`)
2. Extend `IEditorPromptManager` with the response method(s) for the new kind
3. Have the owning service (analogous to `ConflictResolutionService` / `InvalidDocumentService`) feed the manager
4. Add a per-kind prompt view under `components/editor-prompt/` and render it from `EditorPromptStack.svelte`

### Adding a new file-tree command

1. Define the id, primitive (`IFileTreeAction` / `IFileTreeUICommand` / `IFileTreeSaveCommand`), and bundle
   (`IBundledCommand` / `IBundledInputCommand`) under `file-tree-v2/commands/...`
2. Add its entry to `CommandBundleTypeMap` + `PrimitiveCommandTypeMap` (`commands/command-registry.ts`)
3. Wire it into `CommandRegistryImpl`
4. Dispatch it from the UI via `commandRegistry.getCommand(id)`

### Adding a new editor consumer

1. Build an `IFileSystemService` (via `FileSystemLoader`) or hand a `FileSystemMapReadonly` / zip `Blob` to the session
   factory
2. `await EditorSessionFactory.createFrom...(...)` to get an `IEditorSession`
3. Render `<EditorSession session={...} />`
4. Call `session.dispose()` on teardown

---

## 11. Known Technical Debt

These are acknowledged issues that exist today. They should be addressed but do not justify breaking the rules above.

- **Empty top-level barrel.** `src/lib/index.ts` is `export {}`. UI primitives have `index.ts` barrels, but the core
  package does not, so consumers still use deep import paths. A curated public barrel would make §9 enforceable.
- **`V2` / `V3` suffixes.** The composition layer (`EditorWorkspaceV2`, `WorkspaceEditorPaneV2`, `TabBarV2`,
  `SideBarV2`, `CodeEditorViewV3`) and `file-tree-v2/` still carry generation suffixes. Once the previous generation is
  fully gone these should be renamed to their clean concept names.
- **`{#key session}` remount.** `EditorSession.svelte` wraps the editor in `{#key session}` (via
  `EditorSessionMountGate`) to force a clean remount on session swap, which loses transient UI state (e.g. expanded
  folders). A rebindable-session pattern would preserve it.
- **`IFileSystemService` uses `destroy()`** instead of `dispose()` for its lifecycle method, diverging from the
  `IDisposable1` convention used everywhere else.
- **`StaticDefaultEditorConfigurationService` is a stub** — its mutators are no-ops and `initialize()` returns nothing.
  It exists for tests/defaults; a real persisted configuration service is the intended replacement.
- **The file system history feature is a placeholder** — `file-system/history/` contains an interface with no
  implementation.
- **`persistance/` is misspelled** (should be `persistence/`). Renaming requires updating imports across the package.
