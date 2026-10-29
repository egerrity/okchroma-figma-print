# okchroma-figma-print

A generator that prints a set of components into a Figma file as component sets, every
fill, edge and text bound to a variable that another plugin already wrote. It is taken
unchanged from a private proof of concept of the okchroma color engine on Tamagui, so the
pattern can be read on another machine. It is pinned to an old release of the engine and
does not run against a current one. Read it for its shape. Do not run it.

## What it is

`print/print.ts` is a Node script. It reads the engine's output for one brand, builds the
list of variable rows and component variants, and writes a Figma Plugin API script to
stdout. That script is committed in two forms: `print/plugin/code.js`, which a development
plugin runs, and `print/plugin/code.mcp.js`, which the Figma MCP server's script runner
takes. With `print/plugin/manifest.json` the folder loads as a development plugin in the
Figma desktop app, so the machine with the Figma file needs no Node and no package.

The emitted script creates a `color family` collection whose modes are the color families
and whose rows alias the engine plugin's variables for that family, three state-layer
component sets, and one component set per component. Each variant is a frame with a
state-layer instance under its content and its edge and text bound to the collection's rows.

## Read it, do not run it

- `print.ts` imports `okchroma` 0.6.1 and the proof of concept's own brands file. The
  interaction register it imports (`interactionTokens`, `INTERACTION_FAMILIES`,
  `INTERACTION_LADDER`, `INTERACTION_POLE_FAMILY`) left the package at 0.7.0. The script
  fails at import against any later release.
- `code.js` binds the variable paths okchroma's extended Figma plugin wrote at 0.6.x:
  `base/<family>/stamp/fill`, `stamp/fill-hover`, `stamp/fill-pressed`,
  `utility/opacity/<rung>`, `utility/surface/<plane>`, `base/absolute/black`. The current
  plugin writes the stamp as five flat rows (`stamp-0`, `stamp-1`, `stamp-2`, `stamp-edge`,
  `stamp-on`) and no `utility/` zone. Run against a file the current plugin wrote, the print
  reports those rows as missing and leaves their paints unbound.
- `plugin-paths.json` is a dump of the 0.6.x plugin's output, the list the generator holds
  its paths against. It is stale for the same reason.
- The `color family` collection and the state-layer sets are the owner's hand-made Figma
  model for a Tamagui theme, built on the interaction register. They are not part of the
  engine and not a recommendation.

The current names are in the engine's consumer contract:
https://github.com/egerrity/okchroma/blob/main/docs/agents.md

## What to copy

The parts that depend neither on the engine's version nor on the component library.

- A Node script emits the Plugin API script, and the emitted script is committed and loaded
  as a development plugin. The machine with the file runs nothing else.
- Binding by variable name, never by ID. IDs differ between files; names are the contract.
- Every path the script binds is held against a dump of what the variable writer actually
  wrote (`plugin-paths.json`). A path not in the dump stops the generation, so a renamed
  path fails when the script is generated and never as a run that binds nothing.
- Idempotent writes. An existing collection row is updated, a row holding a hand-authored
  expression is skipped, an existing component set is left alone, and each case is reported.
- A summary (`created`, `updated`, `skipped`, `missing`) declared outside the body. The body
  runs under `try`, so an error still ends with the summary in the console and the plugin
  closes.
- The Plugin API helpers in the body: a solid paint carrying `boundVariables`,
  `setBoundVariable('opacity', v)`, `setExplicitVariableModeForCollection` on an instance,
  `combineAsVariants` with the set placed after its layout is set (its height is stale
  before), and a state-layer instance inserted at index 0 with stretch constraints over
  its host.

## What to replace

- The variable writer and its paths. Where a token generator writes the variables, the dump
  is of that generator's output and the path map in `lib.ts` is rewritten for its names.
- The components and their variants. The ones here (Button, Chip, IndicatorChip, DayCell,
  Input, Dialog) are the proof of concept's, with Tamagui variant names.
- The `color family` collection, where the generator already writes a collection that plays
  that role. Never recreate a variable the generator writes. Alias it or bind it.

## Code Connect

Code Connect cannot read a collection mode as a variant property, so a family picked by
mode does not appear in a snippet. The proof of concept wrote one snippet per set by hand
and pasted it into Dev Mode's Connect to code dialog, with the set's description saying
where the family comes from.

## Files

| File | What it is |
|---|---|
| `print/print.ts` | the generator |
| `print/lib.ts` | engine name to plugin variable path, at 0.6.x |
| `print/plugin-paths.json` | every path the 0.6.x plugin wrote, one brand |
| `print/plugin/code.js` | the emitted script in plugin form |
| `print/plugin/code.mcp.js` | the emitted script for the Figma MCP server's runner |
| `print/plugin/manifest.json` | the development plugin manifest |
| `print/plugin/README.md` | how it was loaded and regenerated, as written in the proof |
