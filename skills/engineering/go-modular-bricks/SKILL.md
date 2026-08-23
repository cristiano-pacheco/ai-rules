---
name: go-modular-bricks
description: Impact map for Go services built with Bricks. Use when a Go or Bricks change adds or alters an entry point, application policy, module boundary, adapter, shared capability, or Fx composition. Don't use for Go changes that do not use Bricks modular architecture.
---

# Go modular bricks

Make the change through the smallest complete modular flow. Load only the
contracts selected by the impact map.

## 1. Build the impact map

1. Inspect the requested behavior, the owning module, the closest comparable
   flow, and the module's composition code before editing.
2. Name every affected entry point, application operation, port, adapter,
   representation boundary, module, shared capability, Fx registration, and
   proof of behavior.
3. Mark each item as changed, reused, or unaffected. Select a reference only
   when its trigger below is marked changed or reused by the flow.

*Done when:* every changed behavior has an owning module and a complete list of
the flow components it reaches.

## 2. Load the selected contracts

Read each selected reference in full before editing. Each pointer below is the
only route to that contract.

| Trigger in the impact map | Required reference |
| --- | --- |
| The change creates or alters an entry point, application operation, port, adapter, error path, or representation mapping. | Read `references/data-flow.md` in full. |
| The change assigns ownership, changes a dependency direction, or introduces a layer boundary. | Read `references/modular-architecture.md` in full. |
| The change creates, splits, removes, or connects a business module. | Read `references/modules.md` in full. |
| The change adds or places a cross-module technical capability. | Read `references/shared.md` in full. |
| The change adds a constructor, implementation binding, grouped contribution, configuration, asset, locale, migration, raw use case, decorated use case, handler, or route. | Read `references/fx-wiring.md` in full. |
| The selected flow cannot follow one of these contracts. | Read `references/adr-exceptions.md` in full before choosing the exception. |

*Done when:* every selected contract has been read in full and no unselected
contract has been loaded.

## 3. Implement and prove the flow

1. Edit only the artifacts selected by the impact map. Keep every boundary
   explicit and register every new runtime contribution in its composition
   root.
2. Correct a selected-path violation of a loaded contract. Record a deliberate
   departure through the ADR process before it becomes part of the change.
3. Run the repository's relevant validation commands. Report the impact map,
   references read, changed flow and layers, changed tests, commands, and
   results.

*Done when:* the delivered change and report account for every item marked
changed in the impact map.
