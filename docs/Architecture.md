# Code Editor Package — Architecture Rulebook

This document defines the architecture of the `code-editor` package. Every rule here is mandatory. No exceptions.

The code-editor is a self-contained, reusable module that provides a full-featured multi-file code editor built on
Monaco. It is the foundation of the Anacode platform and must remain decoupled from any specific application feature.

---

## 1. Package Boundary

### What this package owns

- File system abstraction (in-memory, command-driven, event-sourced)
- Monaco editor lifecycle (attach, document switching, view state, configuration)
- Editor session management (open tabs, active file)
- File tree UI (sidebar, tree nodes, context menus, expand/collapse)
- Tab bar UI (tabs, breadcrumbs, active indicator)
- Zip import/export of file system state
- Editor pane reusable layer (document switching + view state caching)
- Editor workspace (service composition for a single editor instance)

### What this package does NOT own

- API calls to any backend
- Application-specific domain models (tests, drivers, submissions, problems)
- Routing, navigation, or page layout
- Authentication or authorization
- Content synchronization with external stores (that belongs to consumers)

### The boundary rule

**The code-editor package MUST NEVER import from any other `$lib/app/*` package.** It is a leaf dependency. All coupling
flows inward: consumers depend on code-editor, never the reverse.

If a feature requires knowledge of application-specific concepts (e.g. "test", "driver", "language"), that feature
belongs in the consumer package, not here.

---

## 2. Layered Architecture

The package is organized in three strict layers. Dependencies flow downward only. A layer may depend on the layer
directly below it and on shared utilities. A layer MUST NEVER depend on a layer above it.

```
Layer 3: Composition (EditorPane.svelte, WorkspaceEditorPane.svelte, IEditorWorkspace)
    |
    | depends on
    v
Layer 2: Editor Pane (IEditorPaneController, IDocumentSessionController, CodeEditorPane.svelte)
    |
    | depends on
    v
Layer 1: Primitives (ICodeEditorComponentController, IEditorDocument, IDocumentContentObserver,
                      IDocumentCache, IEditorDocumentRegistry, IFileSystemService, IEditorSessionService,
                      IFileSystemSynchronizer, IFileCommandService, IEditorSelectionStateService, IEditorFocusService)
    |
    | depends on
    v
Layer 0: Core (file-system-core/*, models-utils.ts)
```

### Layer 0 — Core

The file system core and shared type utilities. Pure data structures, command/event types, the engine state machine,
graph index, and result types. Zero UI. Zero Svelte. Zero Monaco.

**Key contracts:**

- `IFileSystemEngine` — executes commands, produces events, holds immutable state
- `FileSystemLoader` — validates and boots an engine from a `FileSystemMapReadonly`
- `IGraphIndex` — cycle detection and subtree queries
- `Result<T, E>`, `IDisposable1`, `Brand<K, T>` — shared type utilities

**Rules:**

- MUST NOT import from Monaco, Svelte, or any other layer
- MUST NOT have side effects
- All operations return `Result` or `OperationResult` — never throw

### Layer 1 — Primitives

Individual services that each own one concern. These are the building blocks that higher layers compose.

| Service                          | Single Responsibility                                                       |
| -------------------------------- | --------------------------------------------------------------------------- |
| `IFileSystemService`             | Public API over the engine (CRUD + queries + reactive state)                |
| `ICodeEditorComponentController` | Monaco editor instance lifecycle (attach, open doc, view state, focus)      |
| `IEditorDocument`                | Single Monaco `ITextModel` wrapper with reactive content                    |
| `IDocumentContentObserver`       | Wraps a single `IEditorDocument` with debounced content observation         |
| `IEditorDocumentFactory`         | Creates `IEditorDocument` from file system nodes                            |
| `IDocumentCache<K>`              | Generic document cache with config sync, keyed by consumer-defined key      |
| `IEditorDocumentRegistry`        | Extends `IDocumentCache<NodeID>` with factory delegation (create, refresh)  |
| `IEditorSessionService`          | Open file IDs + active file ID (tab state)                                  |
| `IEditorSelectionStateService`   | Selected node + active file (user intent)                                   |
| `IEditorFocusService`            | Focus request event bus                                                     |
| `IFileSystemSynchronizer`        | Bidirectional sync: FS events -> registry, editor content -> FS (debounced) |
| `IFileCommandService`            | File operations with permission checks, resolves parent context             |
| `IEditorConfigurationService`    | Font size, tab size, theme, word wrap                                       |
| `IFileSystemZipCoordinator`      | Zip import/export with pluggable strategies                                 |

**Rules:**

- Each service has exactly one reason to change
- Services communicate through `Readable<T>` stores and explicit method calls — never through shared mutable state
- Services at this layer MUST NOT depend on each other in a circular fashion
- Services MUST NOT know about Svelte components

### Layer 2 — Editor Pane

A reusable middle layer that encapsulates a single Monaco editor view with document switching and view state caching.
This layer exists to prevent consumers from reimplementing the same boilerplate.

**Key contracts:**

- `IEditorPaneController` — `setDocument()`, `attach()`, `focus()`, `activeDocument` store
- `IDocumentSessionController<K>` — composes `IDocumentCache<K>` (Layer 1) + `IEditorPaneController`, adds
  `switchTo(key)` and `invalidate(key)`
- `CodeEditorPane.svelte` — renders the editor pane with optional header/empty state snippets

**Rules:**

- `IEditorPaneController` encapsulates `ICodeEditorComponentController` — consumers MUST NOT access the inner controller
- `setDocument()` is the single entry point for document switching — this ensures view state is always saved/restored
- `IDocumentSessionController` composes `IDocumentCache<K>` for storage — consumers MUST NOT manage
  `Map<K, IEditorDocument>` caches themselves
- `CodeEditorPane.svelte` always keeps Monaco mounted in the DOM (hidden when no document) to avoid reinitialization
  costs
- This layer knows nothing about file systems, sessions, or tabs — it only knows about `IEditorDocument`

### Layer 3 — Composition

Full editor experiences composed from lower layers. This is where sidebar, tab bar, file tree, and the editor pane come
together.

**Key contracts:**

- `IEditorWorkspace` — bundles all services for one multi-file editor instance
- `MultiFileCodeEditorController` — bridges session state changes to the Monaco editor (document switching + view state)
- `EditorPane.svelte` — top-level component: takes `IFileSystemService`, creates workspace, renders everything
- `WorkspaceEditorPane.svelte` — renders sidebar + tabs + editor for a given workspace

**Rules:**

- Composition components wire services together — they MUST NOT contain business logic
- `EditorPane.svelte` is the entry point for consumers who want a full multi-file editor
- `WorkspaceEditorPane.svelte` takes a pre-built workspace — it MUST NOT create services

---

## 3. Dependency Rules

These rules are non-negotiable. They prevent the coupling that kills long-lived projects.

### 3.1 No upward dependencies

A lower layer MUST NEVER import from a higher layer. If Layer 1 needs something from Layer 2, the design is wrong —
extract the shared concern into Layer 1 or Layer 0.

### 3.2 No cross-package dependencies

The code-editor package MUST NEVER import from `$lib/app/create-execution-context/`, `$lib/api/`, or any other
`$lib/app/*` sibling. It is a self-contained library.

### 3.3 Interface over implementation

All inter-service dependencies MUST be through interfaces (prefixed with `I`). Constructors receive interfaces, never
concrete classes. The only place where concrete classes are instantiated is:

- Factory functions / static `load()` methods (Layer 0)
- Workspace constructors (Layer 3)
- Svelte component `<script>` blocks at composition level (Layer 3)

### 3.4 No service-to-component coupling

TypeScript service files (`src/`) MUST NEVER import Svelte components. Svelte components (`componenets/`) import
services, never the reverse.

### 3.5 Explicit consumer API

Consumers of the code-editor package should only need to import:

- **Interfaces** for typing (e.g. `IFileSystemService`, `IEditorPaneController`, `IEditorWorkspace`)
- **Components** for rendering (e.g. `EditorPane.svelte`, `CodeEditorPane.svelte`)
- **Factories/loaders** for bootstrapping (e.g. `FileSystemLoader`, `EditorWorkspace`, `EditorPaneController`)
- **Models** for data types (e.g. `NodeID`, `FileNode`, `Result`)

Consumers MUST NOT import internal implementation details like:

- Command handlers
- Graph index internals
- Event factories
- Synchronizer internals

---

## 4. File Organization Rules

### 4.1 Interface/implementation separation

Every non-trivial service follows the pattern:

```
feature/
  feature-name.ts          # Interface (IFeatureName) + error types + registries
  feature-name-impl.ts     # Implementation class (FeatureName)
```

The interface file is the contract. The implementation file fulfills it. Consumers import the interface file for types
and the impl file only at composition boundaries.

### 4.2 Directory structure

```
src/lib/app/code-editor/
  architecture.md                          # This document
  componenets/                             # Svelte UI components
    code-editor-pane/                      #   Layer 2 editor pane
    editor/                                #   Monaco wrapper component
    icons/                                 #   File/folder icons
    settings/                              #   Editor settings modal
    side-bar/                              #   Sidebar with file tree
      file-tree/                           #     Tree nodes + context menu
      name-dialog/                         #     Rename/create dialog
    tabs/                                  #   Tab bar + breadcrumbs
    EditorPane.svelte                      #   Layer 3 entry point
    WorkspaceEditorPane.svelte             #   Layer 3 workspace renderer
  features/                                # Design docs, roadmap, backlog
  src/                                     # TypeScript services and logic
    models-utils.ts                        #   Result, Brand, IDisposable1
    editor/                                #   Monaco-related services
      code-editor/                         #     Component controller
      editor-document/                     #     Document model
      editor-document-factory/             #     Document creation
      editor-document-registry/            #     Document cache
        editor-document-cache.ts                    #       IDocumentCache<K> — generic document cache interface
        editor-document-cache-impl.ts               #       DocumentCache<K> — implementation with config sync
        editor-document-registry.ts          #       IEditorDocumentRegistry — extends IDocumentCache<NodeID>
        editor-document-registry-impl.ts     #       EditorDocumentRegistry — delegates to DocumentCache
      editor-utils/                        #     Settings, themes, workers
      document-content-observer.ts           #     IDocumentContentObserver — debounced content wrapper for IEditorDocument
      document-content-observer-impl.ts      #     DocumentContentObserver implementation
    editor-pane/                           #   Layer 2 pane controller + document session
      editor-pane-controller.ts              #     IEditorPaneController — pane switching + view state
      editor-pane-controller-impl.ts         #     EditorPaneController implementation
      document-session-controller.ts         #     IDocumentSessionController<K> — document lifecycle + cache
      document-session-controller-impl.ts    #     DocumentSessionController implementation
    editor-session-service.ts              #   Session interface
    editor-session-service-impl.ts         #   Session implementation
    editor-workspace/                      #   Layer 3 workspace
    file-command-service/                  #   File operations with permissions
    file-system-core/                      #   Layer 0 core
      commands/                            #     Command types + handlers
      errors-resources/                    #     Error codes + registries
      factories/                           #     Node + event factories
      graph-index/                         #     Cycle detection, subtree queries
      service/                             #     IFileSystemService + impl
        command-factory/                   #     Command construction
      file-system-export-import/           #     Zip import/export
        export/                            #       Export strategies
        import/                            #       Import strategies
      file-system-history/                 #     History (placeholder)
    file-system-sync/                      #   FS <-> Editor document sync
    file-tree/                             #   File tree view models
      tree/                                #     Tree engine + view model
      tree-engine/                         #     Tree data structure
      search/                              #     File tree search subsystem
        filter/                            #       Filter result types + provider interface
        file-tree-index.ts                 #       IFileTreeIndex — search index interface
        file-tree-index-impl.ts            #       FileTreeIndex — index implementation
        file-tree-search-engine.ts         #       IFileTreeSearchEngine — query → filter result
        file-tree-search-service.ts        #       IFileTreeSearchService — orchestration interface
        file-tree-search-service-impl.ts   #       FileTreeSearchService — wires index + engine
    state/                                 #   Selection + focus services
    multi-file-editor-view-model.ts        #   Layer 3 controller
    tab-bar-view-model.ts                  #   Tab bar derived state
```

### 4.3 Naming conventions

| Kind                | Pattern                      | Example                            |
| ------------------- | ---------------------------- | ---------------------------------- |
| Interface           | `I` prefix                   | `IFileSystemService`               |
| Implementation      | No prefix, matches interface | `FileSystemService`                |
| Interface file      | `kebab-case.ts`              | `file-system-service.ts`           |
| Implementation file | `kebab-case-impl.ts`         | `file-system-service-impl.ts`      |
| Svelte component    | `PascalCase.svelte`          | `CodeEditorPane.svelte`            |
| Error enum          | `FeatureNameErrorCode`       | `FileSystemErrorCode`              |
| Error registry      | `FeatureNameErrorRegistry`   | `FileSystemErrorRegistry`          |
| Branded type        | `Brand<K, T>`                | `NodeID = Brand<number, 'NodeID'>` |
| View model          | `FeatureNameViewModel`       | `TabBarViewModel`                  |
| State interface     | `FeatureNameState`           | `EditorSessionState`               |

---

## 5. Core Patterns

### 5.1 Command-Event Pattern (File System Core)

All mutations to the file system go through commands. Commands are validated and executed by the engine, producing
atomic events.

```
Consumer                  IFileSystemService           IFileSystemEngine
   |                            |                            |
   |--- createFile(parent, n) ->|                            |
   |                            |--- execute(CreateFileCmd) ->|
   |                            |                            |-- validate
   |                            |                            |-- mutate state
   |                            |                            |-- produce events
   |                            |<--- Result<Event, Error> ---|
   |                            |--- notify listeners ------->|
   |<--- Result<NodeID, Error> -|                            |
```

**Rules:**

- Commands are the ONLY way to mutate file system state
- Every command produces zero or more `AtomicEventPayload` entries
- Events are grouped into a `FileSystemEvent` with an ID and timestamp
- The engine state (`FileSystemMapReadonly`) is the single source of truth
- Consumers observe changes through `onTransaction()` or the reactive `fileSystemMap` store

### 5.2 Result Pattern (Error Handling)

All operations that can fail return `Result<T, E>`. Never throw exceptions.

```typescript
Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```

Helper functions: `success(value)`, `failure(error)` from `models-utils.ts`.

For file system core operations: `OperationResult<T>` adds `changes: AtomicEventPayload[]` to the success case. Helper
functions: `ok(value, changes)`, `err(message)`, `valid(value)`, `invalid(message)` from
`file-system-computation-models.ts`.

**Rules:**

- Never throw. Ever. In any layer.
- Always check `.ok` before accessing `.value` or `.error`
- Error types are domain-specific — use enums and registries, not string messages

### 5.3 Reactive State Pattern

Services expose state through Svelte `Readable<T>` stores. Internal mutation uses `Writable<T>`. The public interface
only exposes `Readable<T>`.

```
Interface:  readonly state: Readable<EditorSessionState>
Internal:   private readonly _state: Writable<EditorSessionState>
```

**Rules:**

- NEVER expose `Writable<T>` on a public interface
- Derived state MUST use Svelte `derived()` stores — never manually update derived state
- Always check if new value differs from current before triggering store updates (avoid unnecessary recomputations)

### 5.4 Dispose Pattern

All services that hold subscriptions or resources implement `IDisposable1` with a `dispose()` method. Some use
`destroy()` (legacy — prefer `dispose()` for new code).

**Rules:**

- Store all `Unsubscriber` references at construction time
- Call all unsubscribers in `dispose()`
- Clear all caches, timers, and maps in `dispose()`
- The owner of a service calls `dispose()` — the service does not dispose itself
- Components call `dispose()` in `onDestroy`

### 5.5 View State Caching Pattern

When switching between documents, the outgoing document's cursor position, scroll state, and selection are saved. The
incoming document's cached state is restored.

```
setDocument(newDoc):
  1. Save current view state -> cache[currentDoc.id]
  2. Open new document in Monaco
  3. Restore cached view state for newDoc (if exists)
```

This pattern exists in two places:

- `EditorPaneController` — keyed by `EditorDocumentID` (Layer 2)
- `MultiFileCodeEditorController` — keyed by `NodeID` (Layer 3)

**Rule:** Consumers MUST NOT bypass the controller to call `openDocument()` directly on the component controller, as
this skips view state saving.

### 5.6 Strategy Pattern (Zip Import/Export)

The zip coordinator uses pluggable strategies for input/output format conversion. This allows the same zip logic to work
with different data representations (base64, Blob, File, etc.).

```
IZipInputStrategy<T>   — converts T into a zip-readable format
IZipOutputStrategy<T>  — converts the zip output into T
```

**Rule:** New format support is added by implementing a new strategy, not by modifying existing code.

### 5.7 Synchronizer Pattern

The `IFileSystemSynchronizer` keeps the editor document registry in sync with the file system:

```
File System                              Document Registry
   |                                          |
   |-- NODE_CREATED event ------------------>| create document
   |-- NODE_DELETED event ------------------>| delete document
   |-- NODE_RENAMED event ------------------>| refresh document (new URI)
   |                                          |
   |<-- content change (debounced 500ms) ----| editor typing
```

**Rules:**

- The synchronizer is internal infrastructure — consumers MUST NOT interact with it directly
- Content sync from editor to FS is debounced (500ms) to avoid excessive writes
- The synchronizer skips the first emit from each document subscription (initial value)
- Hydration (creating documents for all existing files) happens once at `start()`

### 5.8 File Tree Search & Index Pattern

The file tree search subsystem follows a strict separation of three concerns: **indexing**, **querying**, and \*
\*structural resolution\*\*. Each concern has exactly one owner. Getting this separation wrong was the most common
mistake
during development — the principles below were learned through iterative correction.

#### Concern map

```
IFileSystemEngine (source of truth)
       │
       ▼
IFileTreeIndex               ← INDEXING: maintains search-optimized projection
       │
       ▼
IFileTreeSearchEngine        ← QUERYING: turns index answers into filter results
       │
       ▼
IFileTreeSearchService       ← ORCHESTRATION: wires index + engine, exposes as IFileTreeFilterProvider
       │
       ▼
FileTreeEngineViewModel      ← STRUCTURAL RESOLUTION: resolves ancestors, builds view list
```

#### Principle 1 — The index is an architectural boundary, not an optimization

The `IFileTreeIndex` exists to establish a distinct concern: maintaining searchable state. It subscribes to file system
transactions and keeps a search-optimized projection, following the same hydrate+subscribe pattern as
`IFileSystemSynchronizer` and `GraphIndex`.

This is not about performance. A linear scan over 50 nodes is imperceptible. The index exists so that **indexing logic
has a home** — a place that can evolve independently (linear scan today, trie tomorrow, content indexing later) without
touching the search or view layers.

#### Principle 2 — The snapshot exposes query methods, not raw data

Following the `GraphIndex` pattern: `GraphIndex` exposes `validateMove()` and `getSubtree()`, not raw edge lists.
Consumers ask questions; the index answers.

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

This ensures replacing the internal data structure (Map → Trie) changes exactly one file: the index implementation. The
engine, service, and view model are untouched.

#### Principle 3 — Filter declares intent, tree resolves structure

The `FileTreeFilterResult` contains `targetNodeIDs` — the nodes the filter wants to show. It does NOT include ancestor
folders. The tree view model owns structural resolution: it walks `ITreeGraph.getParent()` to compute the full
visibility set for rendering.

```
Filter says:  "show helper.ts"                  → { targetNodeIDs: {helper.ts} }
Tree knows:   "to show helper.ts I need src/, utils/"  → resolveVisibleNodes()
```

This separation exists because:

- The filter's job is matching (search concern), not tree traversal (graph concern)
- The tree already owns graph knowledge via `SortedTreeGraph`
- Invalid filter results (target without ancestors) become impossible — the tree always resolves structure correctly

**Rule of thumb: if you find yourself walking parent chains, you are doing graph operations and likely in the wrong
layer. Delegate to the tree.**

#### Principle 4 — Derive status from truth, not assumptions

Service status (`IDLE` / `SEARCHING`) is derived from the actual filter result (the output), not from the query input (
what you assume triggers the output).

```
// WRONG — assumes non-empty query means searching
this._status = derived(this._searchQuery, (query) =>
    query === '' ? IDLE : SEARCHING);

// RIGHT — reflects whether a filter is actually active
this._status = derived(this._filterResult, (result) =>
    result === null ? IDLE : SEARCHING);
```

If conditions change (minimum query length, debounce, async search), assumption-based derivation lies. Truth-based
derivation is always correct.

#### Lifecycle

The `IFileTreeSearchService` extends `IDisposable1`. It owns the index, which owns a transaction subscription. The
service's `dispose()` tears down the index. The owner of the service (currently `SideBar.svelte`) is responsible for
calling `dispose()`.

---

## 6. Component Architecture

### 6.1 Component-ViewModel binding

Svelte components receive view models as props. Components render state and forward user actions to the view model.
Components MUST NOT contain business logic.

```
Component                        ViewModel
   |                                |
   | receives as prop               |
   |<-------------------------------|
   |                                |
   | subscribes to stores           |
   |-------- $state.xxx ----------->|
   |                                |
   | forwards user actions          |
   |--- onclick -> vm.method() ---->|
```

### 6.2 Composition hierarchy

```
EditorPane.svelte (entry point — takes IFileSystemService)
  |
  |-- creates EditorWorkspace
  |
  |-- WorkspaceEditorPane.svelte (takes IEditorWorkspace)
       |
       |-- creates MultiFileCodeEditorController
       |-- creates CodeEditorComponentController
       |
       |-- SideBar.svelte
       |     |-- SideBarHeader.svelte
       |     |-- FileTree.svelte
       |           |-- FileTreeRow.svelte (per node)
       |           |-- FileTreeContextMenu.svelte
       |
       |-- TabBar.svelte
       |     |-- Tab.svelte (per open file)
       |     |-- BreadcrumbBar.svelte
       |
       |-- CodeEditorViewV3.svelte (Monaco mount point)
```

### 6.3 Component responsibility boundaries

| Component                    | Responsibility                                | MUST NOT                                       |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `EditorPane.svelte`          | Create workspace from FS, manage lifecycle    | Contain layout logic beyond delegation         |
| `WorkspaceEditorPane.svelte` | Layout sidebar + tabs + editor, wire services | Create services (except controllers)           |
| `CodeEditorPane.svelte`      | Render editor pane with optional header/empty | Know about file systems or sessions            |
| `CodeEditorViewV3.svelte`    | Mount Monaco to DOM element                   | Know about documents or sessions               |
| `SideBar.svelte`             | Render file tree + header                     | Create file tree data structures               |
| `TabBar.svelte`              | Render tabs + breadcrumbs                     | Manage tab state (delegates to session)        |
| `FileTree.svelte`            | Render tree items                             | Manage expand/collapse state (delegates to VM) |

---

## 7. Anti-Patterns — What NOT to Do

### 7.1 NEVER bypass the command pattern

```
// WRONG: Directly mutating state
engine.state[nodeID] = newNode;

// RIGHT: Go through a command
fileSystemService.createFile(parentID, name);
```

### 7.2 NEVER import implementations where interfaces suffice

```
// WRONG: Depends on concrete class
import { FileSystemService } from './file-system-service-impl';
function doSomething(service: FileSystemService) { ... }

// RIGHT: Depends on interface
import type { IFileSystemService } from './file-system-service';
function doSomething(service: IFileSystemService) { ... }
```

### 7.3 NEVER let a Svelte component own business logic

```
// WRONG: Logic in component
<script>
  function handleDelete() {
    if (node.permissions.delete && !hasChildren(node)) {
      fileSystem.deleteNode(node.id);
      session.closeFile(node.id);
    }
  }
</script>

// RIGHT: Delegate to service
<script>
  function handleDelete() {
    fileCommandService.deleteNodeAt(node.id);
  }
</script>
```

### 7.4 NEVER create circular dependencies between services

```
// WRONG: A depends on B, B depends on A
class ServiceA { constructor(b: IServiceB) {} }
class ServiceB { constructor(a: IServiceA) {} }

// RIGHT: Extract shared concern or use events
class ServiceA { constructor(shared: ISharedService) {} }
class ServiceB { constructor(shared: ISharedService) {} }
```

### 7.5 NEVER throw exceptions in service code

```
// WRONG
if (!node) throw new Error('Node not found');

// RIGHT
if (!node) return failure({ code: ErrorCode.NODE_NOT_FOUND, message: '...' });
```

### 7.6 NEVER expose Writable stores on interfaces

```
// WRONG
interface IService { readonly state: Writable<State>; }

// RIGHT
interface IService { readonly state: Readable<State>; }
```

### 7.7 NEVER import from code-editor internals in consumer packages

```
// WRONG (from create-execution-context)
import { CommandRegistry } from '$lib/app/code-editor/src/file-system-core/commands/file-system-command-registry-impl';

// RIGHT
import type { IFileSystemService } from '$lib/app/code-editor/src/file-system-core/service/file-system-service';
import { FileSystemLoader } from '$lib/app/code-editor/src/file-system-core/file-system-loader';
```

### 7.8 NEVER manually synchronize derived state

```
// WRONG: Manually updating derived state
this.tabCount.set(get(this.tabs).length);

// RIGHT: Use derived stores
this.tabCount = derived(this.tabs, (tabs) => tabs.length);
```

### 7.9 NEVER do graph operations outside the tree layer

```
// WRONG — filter walks parent chain to build visibility set
for (const nodeID of matchedIDs) {
    let parentID = snapshot.getParentID(nodeID);
    while (parentID !== null) {
        visibleNodeIDs.add(parentID);
        parentID = snapshot.getParentID(parentID);
    }
}

// RIGHT — filter returns target nodes, tree resolves ancestors
return { targetNodeIDs: matchedIDs };
// View model calls this.resolveVisibleNodes(filterResult.targetNodeIDs)
```

Graph traversal (parent chain walks, subtree queries, cycle detection) belongs to the layer that owns the graph:
`GraphIndex` for structural validation, `SortedTreeGraph` / `FileTreeEngineViewModel` for rendering. If search, filter,
or index code is calling `getParentID()`, the boundary is wrong.

### 7.10 NEVER expose raw data from an index

```
// WRONG — consumer iterates raw data and does the searching
interface Snapshot {
    readonly nodes: ReadonlyArray<IndexedNode>;
    readonly nodesByID: ReadonlyMap<NodeID, IndexedNode>;
}

// RIGHT — consumer asks questions, index answers
interface Snapshot {
    findBySubstring(text: string): ReadonlyArray<NodeID>;
}
```

An index that exposes its internal data structure is just a cache. Changing the internals (Map → Trie) cascades to every
consumer. Query methods encapsulate the strategy — the consumer says **what** it needs, the index decides **how** to
find it.

### 7.11 NEVER add abstraction layers without multiple consumers

```
// WRONG — compositor wrapping a single provider
let compositor = new FilterCompositor([searchService]);
let viewModel = new TreeViewModel(..., compositor);

// RIGHT — pass the single provider directly
let viewModel = new TreeViewModel(..., searchService);
```

An abstraction with one consumer is indirection, not abstraction. Add composition layers when a second consumer arrives,
not before. The interface (`IFileTreeFilterProvider`) already allows swapping implementations — the compositor can be
introduced later without changing the view model.

---

## 8. Lifecycle and Initialization

### 8.1 File system boot sequence

```
1. Build FileSystemMapReadonly from data (consumer responsibility)
2. FileSystemLoader.load(map) -> Result<IFileSystemEngine, OperationError>
3. new FileSystemService(engine) -> IFileSystemService
4. Pass IFileSystemService to EditorPane.svelte or EditorWorkspace
```

### 8.2 Workspace boot sequence

```
1. new EditorWorkspace(fileSystemService, configService)
   |-- creates EditorDocumentFactory
   |-- creates EditorDocumentRegistry
   |-- creates FileSystemSynchronizer
   |-- creates EditorSelectionStateService
   |-- creates EditorFocusService
   |-- creates EditorSessionService
   |-- creates empty viewStateCache

2. workspace.start()
   |-- synchronizer.start()
       |-- hydrate registry (create documents for all files)
       |-- listen for FS events -> update registry
       |-- listen for editor content changes -> update FS (debounced)

3. [workspace is now live — components can bind to it]

4. workspace.dispose()
   |-- synchronizer.dispose()
   |-- sessionService.dispose()
   |-- viewStateCache.clear()
```

### 8.3 Editor pane boot sequence (reusable single-document)

```
1. new EditorPaneController(configService)
   |-- creates CodeEditorComponentController internally

2. controller.attach(domElement)  [called from component onMount]
   |-- Monaco editor created and mounted

3. controller.setDocument(doc)  [called when document changes]
   |-- saves current view state
   |-- opens new document in Monaco
   |-- restores cached view state

4. controller.dispose()  [called from component onDestroy]
   |-- clears view state cache
   |-- disposes component controller
```

### 8.4 Document session boot sequence (multi-document switching)

```
1. new EditorPaneController(configService)
   |-- creates the base pane layer (see 8.3)

2. new DocumentCache<K>(configService)
   |-- same IDocumentCache<K> primitive that EditorDocumentRegistry uses internally
   |-- subscribes to editorModelConfig for tab size sync

3. new DocumentSessionController(paneController, cache, factory)
   |-- factory is a consumer-provided callback: (key: K) => IEditorDocument
   |-- cache is the DocumentCache<K> from step 2

4. new DocumentContentObserver(document, debounceMS)  [per document, optional]
   |-- wraps document.content with subscribe+skip-first+debounce
   |-- consumer subscribes to observer.content for debounced changes
   |-- IFileSystemSynchronizer uses one observer per document in the registry

5. session.switchTo(key)  [called when consumer selection changes]
   |-- cache.get(key) → factory call on miss → cache.set() → paneController.setDocument()

6. session.invalidate(key)  [called when backing data changes]
   |-- cache.delete(key) → recreate if active → cache.set() → paneController.setDocument()

7. observer.flush()  [called before switching or teardown]
   |-- forces immediate emit of pending debounced content

8. observer.dispose() → session.dispose() → paneController.dispose()
   |-- observer: unsubscribes from content + active document, clears timer
   |-- session: cache.dispose() (disposes all cached documents), clears pane
   |-- pane: clears view state cache, disposes component controller
```

---

## 9. Public API Surface

These are the exports that consumers may depend on. Everything else is internal.

### Models and Types

| Export                                                         | File                                        | Purpose                  |
| -------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| `NodeID`, `FileNode`, `FolderNode`, `FileSystemNode`           | `file-system-core/file-system-models.ts`    | Core data types          |
| `FileSystemMapReadonly`                                        | `file-system-core/file-system-models.ts`    | Immutable state snapshot |
| `NodePermissions`, `DEFAULT_PERMISSIONS`, `LOCKED_PERMISSIONS` | `file-system-core/file-system-models.ts`    | Permission presets       |
| `isFileNode()`, `isFolderNode()`                               | `file-system-core/file-system-models.ts`    | Type guards              |
| `ROOT_NODE_ID`                                                 | `file-system-core/file-system-models.ts`    | Root folder constant     |
| `Result<T, E>`, `Brand<K, T>`, `IDisposable1`                  | `models-utils.ts`                           | Shared utilities         |
| `success()`, `failure()`                                       | `models-utils.ts`                           | Result constructors      |
| `EditorDocumentID`, `EditorDocumentOptions`                    | `editor/editor-document/editor-document.ts` | Document types           |

### Interfaces (for typing)

| Export                                                 | File                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `IFileSystemService`                                   | `file-system-core/service/file-system-service.ts`                       |
| `IFileSystemEngine`                                    | `file-system-core/file-system-models.ts`                                |
| `IEditorDocument`                                      | `editor/editor-document/editor-document.ts`                             |
| `IDocumentCache<K>`                                    | `editor/editor-document-registry/editor-document-cache.ts`              |
| `IEditorDocumentRegistry`                              | `editor/editor-document-registry/editor-document-registry.ts`           |
| `IEditorSessionService`                                | `editor-session-service.ts`                                             |
| `IEditorPaneController`                                | `editor-pane/editor-pane-controller.ts`                                 |
| `IDocumentSessionController`, `DocumentSessionFactory` | `editor-pane/document-session-controller.ts`                            |
| `IDocumentContentObserver`                             | `editor/document-content-observer.ts`                                   |
| `IEditorWorkspace`                                     | `editor-workspace/editor-workspace.ts`                                  |
| `IEditorConfigurationService`                          | `editor/editor-config-models.ts`                                        |
| `IFileSystemZipCoordinator`                            | `file-system-core/file-system-export-import/file-system-coordinator.ts` |
| `IEditorSelectionStateService`                         | `state/editor-selection-state.ts`                                       |
| `IEditorFocusService`                                  | `state/editor-focus-service.ts`                                         |

### Factories and Loaders (for bootstrapping)

| Export                                    | File                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `FileSystemLoader.load()`                 | `file-system-core/file-system-loader.ts`                                     |
| `FileSystemService` (constructor)         | `file-system-core/service/file-system-service-impl.ts`                       |
| `EditorWorkspace` (constructor)           | `editor-workspace/editor-workspace-impl.ts`                                  |
| `DocumentCache` (constructor)             | `editor/editor-document-registry/editor-document-cache-impl.ts`              |
| `EditorPaneController` (constructor)      | `editor-pane/editor-pane-controller-impl.ts`                                 |
| `DocumentSessionController` (constructor) | `editor-pane/document-session-controller-impl.ts`                            |
| `DocumentContentObserver` (constructor)   | `editor/document-content-observer-impl.ts`                                   |
| `StaticDefaultEditorConfigurationService` | `editor/editor-config-models.ts`                                             |
| `EditorDocument` (constructor)            | `editor/editor-document/editor-document-impl.ts`                             |
| `FileSystemZipCoordinator` (constructor)  | `file-system-core/file-system-export-import/file-system-coordinator-impl.ts` |
| Zip strategies                            | `file-system-export-import/export/file-system-export-strategy-impls.ts`      |
| Zip strategies                            | `file-system-export-import/import/file-system-importer-strategy-impls.ts`    |
| `NodeFactory`, `RandomNodeIDGenerator`    | `file-system-core/factories/`, `generators.ts`                               |

### Components (for rendering)

| Export                       | File                                                 | Layer                           |
| ---------------------------- | ---------------------------------------------------- | ------------------------------- |
| `EditorPane.svelte`          | `componenets/EditorPane.svelte`                      | 3 — Full multi-file editor      |
| `CodeEditorPane.svelte`      | `componenets/code-editor-pane/CodeEditorPane.svelte` | 2 — Reusable single-pane editor |
| `WorkspaceEditorPane.svelte` | `componenets/WorkspaceEditorPane.svelte`             | 3 — Workspace-bound editor      |

---

## 10. Extending the Package

### Adding a new file system command

1. Define the command type in `CommandType` enum (`file-system-models.ts`)
2. Define the command interface extending `BaseCommand` (`file-system-models.ts`)
3. Add it to the `FileSystemCommand` union type
4. Create a command handler in `commands/commands/` implementing `ICommandHandler`
5. Register it in `CommandRegistry`
6. Add the public method to `IFileSystemService` and `FileSystemServiceImpl`

### Adding a new editor pane consumer

1. Create your view model in your consumer package
2. Import `IEditorPaneController` and `CodeEditorPane.svelte` from code-editor
3. Create an `EditorPaneController` at composition level
4. Your view model calls `controller.setDocument()` when the document changes
5. Render `<CodeEditorPane controller={controller} />`

### Adding a new file system event type

1. Add to `FileSystemEventType` enum
2. Define the event interface extending `FileSystemEventBase`
3. Add to `AtomicEventPayload` union
4. Update the event factory
5. Update the synchronizer to handle the new event type (if needed)

---

## 11. Known Technical Debt

These are acknowledged issues that exist today. They should be addressed but do not justify breaking the rules above.

- The `componenets/` directory has a typo (should be `components/`). Renaming requires updating all imports across the
  codebase.
- `SideBar` and `TabBar` are wrapped in `{#key workspace}` as a workaround for workspace switching (loses expanded
  folder state). The proper fix is the rebindable workspace pattern (see `features/workspace-save/`).
- `MultiFileCodeEditorController` duplicates view state caching logic that `EditorPaneController` already provides. It
  should be refactored to delegate to Layer 2.
- Some state services (`EditorFocusService`, `EditorSelectionStateService`) have their implementation in the same file
  as the interface, violating the interface/impl separation pattern.
- `IFileCommandService` uses `destroy()` instead of `dispose()` for its lifecycle method.
- The file system history feature is a placeholder — `file-system-history/` contains an empty interface.
- No barrel `index.ts` files exist, forcing consumers to use deep import paths.
