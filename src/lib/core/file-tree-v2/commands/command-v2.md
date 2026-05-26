# command v2 — design notes

## Where the original shape came from

`ICommand` was born from file-system actions: create-file, create-folder, rename, move. Those four share a clear three-step rhythm:

1. _Prepare an initial input._ When the user clicks "rename", the dialog needs a starting name — usually the node's current name.
2. _Validate input as the user types._ Block the submit button on illegal names without actually renaming the file.
3. _Perform with the final input._ Apply the change once the input is valid and the user confirms.

That rhythm crystallized into a single generic interface:

```ts
interface ICommand<TID, TContext, TInput, TValue, TError, TPreparation> {
	isEnabled(ctx): Result<TPreparation, TError>;
	canPerform(ctx, input): Result<void, TError>;
	perform(ctx, input): Promise<Result<TValue, TError>>;
}
```

`TPreparation extends CommandPreparation<TInput>` carried the initial input plus a context label, so the dialog had everything it needed to render.

## What broke when other commands joined

UI commands (expand-all, collapse-all, locate-active-file) and save commands (save, save-all) plugged into the same family. Their rhythm was nothing like the file-system one:

- No user input → `TInput = void`.
- No dialog → no `initialInput` to prepare.
- No keystroke-time validation → `canPerform(ctx, void)` was tautological.

The generic still accepted them, but only by being lied to with `void` everywhere. The damage showed up in three places:

- `CommandPreparation<void>` carried an `initialInput: void` field that nothing read.
- `canPerform` ended up vestigial. The action-bar view-model never called it; `perform` re-did the same checks anyway.
- `isEnabled` was misnamed. It returned a `Preparation`, not a boolean, and the view-model already renamed the result to `availability` at the consumption site.

The smell was structural rather than cosmetic. One shape was carrying two jobs that did not actually share much.

## The two axes that were tangled

Stepping back, two orthogonal axes were folded into a single generic:

- **Layer.** What the command talks to. File-system actions, UI tree-state mutations, save flows. This axis drives the _context_ shape (selection, editor selection, save target) and the _error space_. It is a durable, real distinction.
- **Input vs immediate.** Whether the command needs user input gathered through a dialog before perform. This axis decides whether `canPerform` and `initialInput` make sense at all.

Forcing both axes through one interface meant every consumer paid the tax of the input axis even when their command had no input.

## The shape `command.ts` now uses

The split happens along the input axis. Two interfaces, each carrying only what it needs:

```ts
ICommand<TID, TContext, TResult, TError>
  getAvailability(ctx): CommandAvailability<TError>
  perform(ctx): Promise<Result<TResult, TError>>

IInputCommand<TID, TContext, TInput, TResult, TError>
  getAvailability(ctx): InputCommandAvailability<TInput, TError>
  canPerform(ctx, input): Result<void, TError>
  perform(ctx, input): Promise<Result<TResult, TError>>
```

The renames are deliberate. `getAvailability` replaces `isEnabled` because the return value is an availability discriminated union, not a boolean — the name now matches what comes out. `CommandAvailability` and `InputCommandAvailability` replace `CommandPreparation`. They share kind tags (`AVAILABLE` / `UNAVAILABLE`) but only the input variant carries `initialInput`, so immediate commands never see a field that means nothing to them.

The layer axis stays untouched. File-system actions, UI commands, and save commands remain three families, each picking the shape it needs from `command.ts`. File-system create/rename/move land on `IInputCommand`; delete and copy-path land on `ICommand`; UI and save commands all land on `ICommand`.

`TError` is constrained to `OperationFailure<string>` on both interfaces. Every concrete command error in the project (`FileTreeActionError`, `FileTreeUICommandError`, `FileTreeSaveCommandError`) already extends it, so the constraint enforces what was already true and gives callers a guaranteed `kind` discriminator plus a `message` field for rendering. A command cannot be plugged in with a stringly-typed error or a bare object — the contract is now expressible at the type level.

## Why `canPerform` survives, but only on `IInputCommand`

`canPerform` was vestigial _given the consumers that exist today_, but it has a real future job: keystroke-time validation in dialogs. When the rename dialog grows live feedback — "name already exists in this folder", submit disabled until the input is legal — it needs a synchronous way to test an input without performing the action.

What changed is its scope. Immediate commands have no input to validate, so giving them a `canPerform` was a category error. Living on `IInputCommand` only, it has a clear job, and its absence on `ICommand` is meaningful rather than accidental.

Three invariants emerge from where `canPerform` sits:

- It runs synchronously. Dialogs call it on every keystroke; I/O belongs in `perform`.
- `perform` re-validates internally. Callers may skip `canPerform`, so the validation rule lives in a private helper shared between both methods rather than only in `canPerform`.
- `canPerform` returning ok implies `perform` will not fail with _validation_ errors. It may still fail with FS or IO errors. That contract is what makes `canPerform` worth calling from a dialog at all.

## What this opens up for the consumer side

The view-model layer becomes less generic in a way that pays off:

- Presentations for input commands read `getAvailability`, pull `initialInput` from the available branch, and feed it where today's code rebuilds a `RequestInput` from scratch.
- Presentations for immediate commands read `getAvailability` and stop carrying request-input plumbing they never used.
- `IFileTreeUICommandController.execute(id)` — the seam that lost type safety by dispatching on an ID — has room to become typed methods (`expandNode()`, `collapseNode()`, `locateActiveFile()`). The `unknown` result type and the if/else cascade in the action-bar view-model go with it.

## What v2 deliberately leaves alone

- The three families. The layer separation (file-system / UI / save) is unchanged. The boilerplate of three registries and three error factories is real, but the input/immediate confusion was the bigger source of pain — and that is the one v2 addresses.
- Async validation. If `canPerform` ever needs network or non-cached FS checks, the synchronous contract above breaks down and a different evolution is called for. `command.ts` keeps `canPerform` sync because dialogs cannot tolerate keystroke-rate I/O without race conditions.

The intent was narrow: stop forcing two different kinds of command through one generic. Once that landing is clean, the follow-on rounds — typed controllers replacing ID dispatch, registry consolidation — become much smaller and self-contained changes.
