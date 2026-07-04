# Code Editor Architecture Guide

This document is for agents working inside `src/lib/app/code-editor`.
The goal is not to enforce architecture by memorizing rules. The goal is to
understand what each kind of object owns, why it exists, and how to make a
reasonable decision when the exact situation is new.

The code editor is already split into layers and roles. Most cleanup work should
tighten those roles rather than invent a new architecture.

## Dependency Direction

The `code-editor` package should remain a leaf package. Other app features may
use it, configure it, or compose it, but code-editor internals should not import
feature-specific app modules.

The reason is reuse. The editor appears in problem solving, problem creation,
submission viewing, and editor playgroups. If editor internals import one of
those feature areas, editor behavior starts depending on a caller instead of on
editor concepts.

When a feature needs custom behavior, pass it in through a factory, strategy,
configuration service, filesystem seed, workspace factory, or Svelte prop.

## What A Service Represents

A service is a behavioral boundary. It owns a workflow or lifecycle and exposes
semantic operations to the rest of the system.

A service is appropriate when the object:

- coordinates multiple collaborators
- owns a lifecycle such as open, reload, evict, save, select, search, or sync
- exposes user-meaningful commands
- publishes read-only state needed by UI or another service
- subscribes to events and reacts over time
- translates lower-level failures into domain-level `Result` errors

The reason services exist is to prevent callers from inferring behavior from raw
storage. For example, a missing loaded document can mean many things: not opened,
evicted, reload in progress, deleted, or reload failed. A service can expose the
semantic operation or event; a raw map cannot.

When deciding whether to add to a service, ask: "Is this behavior, policy, or
workflow?" If yes, it belongs in a service. If it is only storage, it probably
belongs in a registry. If it only crosses a subsystem boundary, it is probably a
port.

## Services In This Layer

### Workspace And Composition

`EditorWorkspace` is the composition root for one editor workspace. It wires the
file system, records, document lifecycle, save lifecycle, selection, session,
sync services, and UI-facing registries.

The workspace should avoid becoming a public service locator. Expose things from
`IEditorWorkspace` only when components or external callers need that semantic
capability. Keep implementation-only collaborators private to composition.

### File System Services

`FileSystemService` is the public application API over the file-system engine.
It creates commands, executes them, exposes file-system state, and publishes
file-system transactions.

Its reason to exist is to keep callers away from command handlers, plan
executors, graph indexes, and mutable engine details. Callers ask for
`createFile`, `renameNode`, `updateContentIf`, and similar operations.

`FileCommandService` is a selection-aware facade for UI commands. It adapts raw
file-system operations to the current editor selection and exposes command
capabilities.

Its reason to exist is ergonomics for UI surfaces. Components should not have to
know how to resolve "create file at selected file" into the correct parent.

### Sync Services

`EditorStructureSyncService` listens to file-system structural events and keeps
`DocumentRecordRegistry` aligned with file nodes.

Its reason to exist is that the editor does not load every file as a Monaco
model. It first needs a lightweight record layer: node ID, file URI, and
read-only state.

`ExternalContentSyncService` listens to file-system content updates and emits
external content changes when the write origin is not editor-owned.

Its reason to exist is conflict detection. Editor saves should not conflict with
themselves, but remote or external writes must reach the save service.

### Document Lifecycle Services

`EditorDocumentService` owns loaded editor document lifecycle: `open`, `reload`,
`evict`, and `getLoaded`.

It owns the loaded-document registry as an implementation detail. Callers should
depend on document lifecycle semantics, not on raw map presence. This is why
document lifecycle events and typed command results are more valuable than
exposing `Readable<ReadonlyMap<NodeID, IEditorDocument>>`.

`EditorDocumentRetentionService` reacts to retained node IDs and document-record
changes. It evicts documents that are no longer retained and reloads or evicts
loaded documents when their backing record changes.

Its reason to exist is policy. Session state decides which files are retained;
record changes decide which loaded documents must be refreshed. Components
should not implement that policy.

`DocumentReloadService` represents the user intent "reload this document". It
discards the draft first, then opens or reloads through `EditorDocumentService`.

Its reason to exist is that "reload" from the UI is not just document lifecycle;
it also has draft-recovery semantics.

### Save And Draft Services

`EditorSaveService` owns dirty state, draft entries, base hashes, conflict
detection, save commands, overwrite, and document tracking lifecycle.

Its reason to exist is consistency. Keystroke tracking, external content changes,
record deletion, save commands, and document open/reload/evict all touch the
same draft/base-hash model. Keeping that model behind one service prevents
different callers from mutating it out of order.

`SaveScheduler` serializes save and draft mutations.

It is a concurrency primitive more than a domain service. Its reason to exist is
that content changes and save commands can arrive close together. The scheduler
keeps mutation ordering explicit.

### Session, Selection, Focus, And User Space Services

`EditorSessionService` owns open tabs and active file state.

Its reason to exist is that "open tab" is not identical to "selected tree node".
A file can be selected without being the active editor document, and closing a
tab must choose a new active tab.

`EditorSelectionStateService` owns selected node and active file selection.

Its reason to exist is UI coordination. The file tree, tabs, editor pane, and
commands need a common selection source.

`EditorFocusService` publishes requests to focus the code editor.

Its reason to exist is inversion. UI controls can request focus without holding
the Monaco editor instance.

`EditorUserSpaceStateService` owns the active user-space tag used during file or
folder creation.

Its reason to exist is that file creation needs ambient workspace context, but
the file-system command API should not depend on a Svelte component.

`IEditorConfigurationService` owns editor, model, and global configuration.

Its reason to exist is that Monaco editor options and Monaco model options have
different lifecycles. A config service gives both services and controllers a
single reactive source.

### File Tree Services

`FileTreeSearchService` owns search query and status and provides a file-tree
filter.

Its reason to exist is to keep search state and filtering policy out of row
components.

`FileTreeDragStateService` owns file-tree drag state and expansion requests.

Its reason to exist is that drag interactions span multiple rows over time.
Storing that behavior in rows would duplicate timing and state logic.

### View State Services

`EditorViewStateService` is a wrapper concept around view-state reading.
`EditorViewStateRegistry` currently does most of the real work.

View state exists because Monaco cursor/scroll/fold state belongs to a document
view, not to file content and not to save state.

## Registries

A registry is in-memory state ownership. Registries should be simple, local, and
predictable. They store data, publish snapshots or narrow changes, and avoid
business workflows.

Current registries include:

- `DocumentRecordRegistry`: file metadata records by node ID
- `EditorDocumentRegistry`: loaded Monaco documents by node ID
- `DocumentOpenFailureRegistry`: open/reload failures for UI
- `DraftRegistry`: dirty, conflicted, and invalid draft entries
- `EditorDocumentBaseRegistry`: base hash per tracked document
- `EditorViewStateRegistry`: Monaco view state by node ID
- `CommandRegistry`: command type to command handler
- `PlanExecutorRegistry`: plan type to plan executor

The reason registries should stay narrow is testability and ownership. If a
registry starts deciding whether to reload, save, evict, or resolve conflicts,
callers will start depending on storage as behavior. Move that policy to a
service.

It is fine for a registry to expose a readable snapshot when the UI needs raw
state. It is usually not fine to expose a registry just so another service can
infer lifecycle semantics from its shape.

## Event Buses And Transaction Sources

An event bus connects producers and consumers without making either side own the
other.

Current event sources include:

- `FileSystemEngine` transactions: low-level file-system events
- `DocumentEventBus`: Monaco document content changes
- `ExternalContentChangeBus`: non-editor file content writes
- `EditorDocumentService` lifecycle events
- Registry transaction sources for record or loaded-document changes

The reason to use events is decoupling over time. A content edit should not call
the save service directly from a Monaco model. A file-system write should not
know which draft state needs conflict reconciliation. Events let the producer
state what happened and let subscribers decide what it means.

Events should be semantic enough for consumers. If consumers must inspect a
storage snapshot after every event to guess intent, the event boundary is too
weak.

## State Channels Vs Transition Channels

Every command-issuing layer needs **two** kinds of public channel, not one:

- **State channel** — `Readable<T>`. Conveys "what is true now." Many consumers
  derive UI or further state from it. Subscribers care about the current value.
  Examples: `IObservableEditorIntentState.activeDocument`,
  `IObservableEditorSaveState.dirtyEntries`,
  `IEditorDocumentService.state`.
- **Transition channel** — `ITransactionEventSource<E>`. Conveys "this just
  happened." Subscribers care about the *moment* of the event and may run
  side-effects against the still-alive prior state. Examples:
  `IEditorDocumentService.onTransaction` (DOCUMENT_WILL_RELOAD, DOCUMENT_DID_RELOAD,
  DOCUMENT_WILL_EVICT, DOCUMENT_DID_EVICT, DOCUMENT_DID_OPEN),
  `IEditorIntentService.onTransaction` (INTENT_DID_OPEN).

Use **paired WILL / DID** events when the transition is destructive or
side-effect-bearing. `WILL_*` fires while the prior state is still alive — that
is the consumer's window to save view state, cancel pending work, or veto
through an async `waitUntil` hook
(`src/lib/app/code-editor/src/shared/lifecycle/editor-lifecycle-waitable.ts`).
`DID_*` fires once the new state is committed.

### Why both channels exist

Some consumers ask "what should I be showing right now?" — they need
declarative truth. Others ask "react at the exact moment X happens" — they need
imperative delivery with timing guarantees. The two questions have different
shapes and conflating them produces bad code:

- **State faking events** — counters or revision numbers exposed as
  `Readable<number>`, bumped to signal "something happened." Subscribers diff
  values to detect events. Symptoms: subscribe-fires-immediately delivers
  meaningless initial values, bumps lost if no consumer is attached at the
  moment, no payload to carry context, types lie about the contract. The
  `focusRequests` counter that was removed from `EditorIntentService` was this
  smell.
- **Events faking state** — every consumer reconstructs "what's currently
  active" by maintaining their own breadcrumb derived from the event stream.
  Subscribers race each other when they react in different orders to the same
  event. The transient eager-save band-aid we put in
  `EditorOrchestrationService.handleActiveDocumentChange` was a symptom — two
  consumers (intent translating events into state, orchestrator translating
  events into save calls) racing on shared timing.

### How to flag this when reviewing a design

Ask, for every observable surface the layer exposes:

1. **Is the value meaningful read on its own?**
    - Yes → state channel candidate (`Readable<T>`).
    - No (only meaningful as a delta or "fire") → transition channel candidate
      (`ITransactionEventSource<E>`).
2. **Does the consumer need access to the *prior* state alive during the
   transition?** If yes, it must be a transition channel with a `WILL_*` event.
   Otherwise the consumer races whoever else translates the same event.
3. **Does the signal need to deliver context (which doc? which file?)?**
   If yes, the channel needs a payload. Counters and bumps cannot carry one.
4. **If multiple consumers subscribe, do they all need the same prefix of
   events from now-forward, or do they each derive truth from the same
   snapshot?** "Each consumer needs to react to every fire from now" is event
   shape. "Each consumer derives its own truth from current value" is state
   shape.

### Layering rule

State derivation has exactly one owner. If layer A publishes a state channel,
layer B that consumes it must not also republish a derived state of the same
underlying signal. Other consumers should subscribe to layer A's state
directly. Otherwise you end up with two sources of truth that drift.

Transition consumers can multiply freely — each one reacts to the event in its
own way without owning any state. WILL handlers should be side-effect-prep
only (save, snapshot, veto, async wait); DID handlers should be
"react to the committed state" only. State mutation derived from a transition
event must happen only on `DID_*`, never on `WILL_*` — otherwise WILL handlers
race against state subscribers fired by the early mutation.

### When introducing a new transition

If you find yourself reaching for a `Writable<number>` counter, a revision bump,
or any other "fire by changing a value the consumer must diff," stop. That's
the signature of the wrong shape. Add a `*_DID_*` event to the owning service's
`onTransaction`, deliver context via the payload, and let consumers register
listeners. If the event needs to gate a downstream action, add the
`*_WILL_*` partner with a `waitUntil` collector.

## Ports

A port adapts this package to another subsystem or lower-level API.

Current ports include:

- `ContentPort`: reads and writes file content through `FileSystemService`
- `EditorSavePort`: saves draft content through content read/write ports

The reason ports exist is error and dependency translation. A save service should
not know the command engine details. It should receive content-specific success,
conflict, not-found, not-file, or persistence errors.

Ports should keep foreign concepts from leaking upward. If a service catches a
low-level engine error, it should usually map it to a domain error before
returning.

## Factories, Providers, And Resolvers

Factories create objects. Providers orchestrate object construction. Resolvers
prepare data needed for construction.

Current examples:

- `DocumentRecordFactory`: file node to document record
- `EditorDocumentSeedResolver`: record plus draft/content to load seed
- `EditorDocumentProvider`: seed to resolved load to materialized document
- `EditorDocumentFactory`: Monaco-backed `EditorDocument`
- `FileSystemCommandFactory`: UI/API input to file-system command

The reason to split these roles is to keep construction failure explicit. For
example, resolving a document seed can fail because the target is deleted,
read-only, not a file, or has inconsistent save state. Creating the Monaco model
can fail for a different reason. Separate steps keep those errors meaningful.

When adding construction logic, avoid hiding meaningful failure modes inside a
single broad factory.

## Controllers

A controller binds services to UI/runtime objects. Controllers are allowed to
know about Monaco instances, DOM attachment, Svelte lifecycle, and view state.
Domain services should not.

Current controllers include:

- `CodeEditorComponentController`: owns the Monaco editor instance
- `MultiFileCodeEditorController`: binds session and document lifecycle to the
  editor component

The reason controllers exist is to keep UI mechanics out of domain services. A
service can say "document opened"; a controller decides how that affects the
Monaco model currently attached to the DOM.

## Components

Svelte components render state and forward user intent. They may compose
services and controllers at the edge, but they should avoid owning domain policy.

The reason is that component state is easy to duplicate and hard to test.
Policies such as retention, reload recovery, conflict creation, and file command
capabilities should live in services. Components should ask services to perform
those operations.

Small presentation decisions belong in components. Cross-component workflows do
not.

## Results And Failures

The codebase follows a strict no-throw policy. Expected failures are returned
as `Result<T, E>` with a typed error kind; functions do not throw them.

The reason is that `throw` is invisible in a function's shape. A caller cannot
tell from the signature whether a function throws or what it throws, so complex
error handling degrades into catching everywhere and guessing. `Result<T, E>`
puts the full contract in the type.

When third-party code can throw (Monaco, zip parsing, dynamic `import()`),
apply the port strategy: catch at the boundary and convert to a typed
`Result` — that is the only legitimate `try/catch`. See `Ports`.

Editor operations fail for normal domain reasons: a file was
deleted, a content hash changed, a target became read-only, a Monaco document
could not be materialized, or a draft is conflicted. These are not exceptional
programming failures; callers need typed information to render recovery UI or
choose a fallback.

If a service intentionally ignores a failable operation, the service being
called must publish the failure elsewhere or the failure is lost. Reload is an
example where failures are recorded in `DocumentOpenFailureRegistry`. If there
is no failure channel, prefer returning and handling a typed result.

No-op is not the same as failure. If an operation did not need to do anything,
return success with a value that says so, such as `success(false)`.

## Localization

No user-facing string shall be hardcoded. Every string a user can see — labels,
tooltips, notification titles, error content — is a typed member of the
`EditorMessages` interface (`core/localization/localization-models.ts`): plain
`string` for static text, a function with typed params for interpolated text
(`tabCloseAriaLabel(params: { name: string }): string`). `en` implements the
full interface, so a missing message is a compile error; `fr`/`es` are
`Partial` overlays that fall back to English. One frozen record is resolved
per session by the factory and read by components via context.

This is the standard component-library pattern (Ant Design/MUI-style typed
locale packs), not an app-level i18n framework. Message identifiers are
symbols, never string keys: go-to-definition lands on the member,
find-references crosses the boundary, params are compile-checked.

Errors never carry rendered copy or message identifiers. A domain error
carries a typed `kind` (plus raw values); the presentation edge maps kind to
message with an exhaustive `switch` returning `messages.xxx(...)`. Adding an
enum member breaks the switch at compile time.

Some existing strings predate this rule and still need extraction. Do not add
new ones.

## Cleanup Heuristics

When touching code, classify the object first:

- service: behavior, workflow, lifecycle, policy
- registry: in-memory state ownership
- event bus: decoupled notification
- port: subsystem adapter
- factory/provider/resolver: construction and preparation
- controller: UI/runtime binding
- component: rendering and user intent forwarding

Then ask what responsibility is leaking.

If a service exposes a raw registry, consider whether callers really need raw
state or whether they need a semantic operation/event/state projection.

If a component performs graph traversal, file-system policy, save conflict
logic, or reload recovery, consider moving that behavior into a service.

If a registry starts calling other services, it is becoming a service.

If an event carries too little meaning and consumers infer intent from maps,
strengthen the event or move the decision into a service.

If a port returns generic low-level errors, map them to the domain error the
caller can actually act on.

Prefer tightening existing boundaries over adding a new abstraction. Add a new
abstraction only when it gives a responsibility a clear owner.

## Local Code Style Expectations

The code-editor layer uses explicit domain names and explicit TypeScript types.
That style is intentional: this package has many small boundaries, and implicit
types make ownership harder to audit.

Do not encode lifecycle in nullable sentinels. `Promise<T> | null` does not
convey intent: does `null` mean not started, empty, failed, or not needed?
Model multi-state values as discriminated unions with a `kind` enum, where each
variant carries only the data that exists in that state. `Loadable<T, E>` in
`view-models/shared/ui-models.ts` is the template. The same reasoning as the
no-throw policy applies: the shape should convey the whole contract.

Identifiers that connect two pieces of code must be symbols, not strings. A
string key linking a lookup table to a catalog, an event to a handler, or a
kind to a template is a hidden contract: go-to-definition goes nowhere,
find-references cannot cross it, and nothing forces the other side to exist or
be consumed. Compile-time key safety (`keyof` unions) is not enough —
navigation and discoverability are part of the contract. Use typed members and
exhaustive `switch` statements over enums instead of string-keyed indirection.

When a problem is a solved problem — localization, caching, async state,
virtualized rendering — do not design a bespoke mechanism. Find how
established libraries in the same position solve it and adopt that shape. For
this package the peers are other component libraries (Ant Design locale packs,
MUI, date-fns), not applications. Cleverness in a solved problem space trades
away familiarity and predictability for nothing.

Use `$lib/` absolute imports for package code. Avoid relative imports across
package boundaries because they make dependency direction harder to see.

Use Svelte `Readable<T>` for observable service state and keep `Writable<T>`
private to the owner. This preserves mutation ownership.

Implement `dispose()` for anything that owns subscriptions or runtime resources.
The reason is not ceremony; it prevents stale services from reacting after the
workspace or component that created them is gone.

Keep comments rare. If a comment explains what the code does or what a value
means, the shape is wrong — fix the shape instead. The only comments that earn
their place are short notes on a boundary, an invariant, or a non-obvious
ordering constraint that no type can express.
