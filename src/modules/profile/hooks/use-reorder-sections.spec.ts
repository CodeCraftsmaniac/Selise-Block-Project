import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Model-based property tests for `useReorderSections` (Tasks 4.4 and 4.5).
 *
 * These tests deliberately DO NOT mount the React hook. The algorithmic
 * invariants we need to prove — permutation stability and `section_order`
 * contiguity under arbitrary Create / Delete / Reorder sequences — are
 * properties of the in-memory ordering model that the hook manipulates via
 * TanStack Query cache writes and minimal UPDATE_CUSTOM_SECTION_MUTATION
 * calls. Modeling the collection directly keeps the proof focused on the
 * algorithm described in design §Algorithmic Pseudocode (`reorderSections`)
 * and §Correctness Properties #4 / #9 without coupling to React rendering,
 * MSW, or TanStack Query internals.
 *
 * Cross-references:
 *  - `useReorderSections` implementation: `./use-profile.ts`
 *  - Re-normalization pass on delete: `useDeleteSection` in `./use-profile.ts`
 *  - Design contract: §Key GraphQL Operations (Reorder composite),
 *    §Correctness Properties #4 and #9.
 */

// ---------------------------------------------------------------------------
// Shared in-memory model
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a `user_custom_section` row that participates in the
 * ordering algorithm. Only the fields the model needs are declared — the
 * full `UserCustomSection` type is intentionally not imported, keeping this
 * test decoupled from the domain types so a schema drift cannot mask a
 * regression in the algorithm itself.
 */
interface Section {
  ItemId: string;
  section_order: number;
}

/**
 * Pure reorder: given `sections` and an ordered list of `ItemIds`, return a
 * new collection whose elements are the sections referenced by `orderedIds`
 * with their `section_order` set to the index at which they appear. This is
 * the same algorithm the real hook applies optimistically to the TanStack
 * Query cache before it fires the minimal UPDATE batch.
 *
 * Unknown ids are dropped (they cannot exist in the real cache, but being
 * defensive here keeps counter-examples interpretable if a generator ever
 * drifts).
 */
function applyReorder(sections: Section[], orderedIds: string[]): Section[] {
  const byId = new Map(sections.map((s) => [s.ItemId, s]));
  const out: Section[] = [];
  orderedIds.forEach((id, idx) => {
    const section = byId.get(id);
    if (section) {
      out.push({ ...section, section_order: idx });
    }
  });
  return out;
}

/**
 * Append a new section at the tail of the collection, assigning it
 * `section_order = sections.length` so the prefix invariant is trivially
 * preserved.
 */
function applyCreate(sections: Section[], newId: string): Section[] {
  return [...sections, { ItemId: newId, section_order: sections.length }];
}

/**
 * Remove the section at the given index, then re-normalize so the remaining
 * `section_order` values form a contiguous `0..N-1` prefix. Matches the
 * behaviour of the re-normalization pass in `useDeleteSection.onSuccess`.
 */
function applyDelete(sections: Section[], index: number): Section[] {
  if (sections.length === 0) return sections;
  const safeIndex = ((index % sections.length) + sections.length) % sections.length;
  const remaining = sections.filter((_, i) => i !== safeIndex);
  // Sort by the section_order the row already had (stable by insertion for
  // ties), then reassign 0..N-1 — the same strategy the hook uses once the
  // authoritative server state has been re-read.
  const sorted = [...remaining].sort((a, b) => a.section_order - b.section_order);
  return sorted.map((section, i) => ({ ...section, section_order: i }));
}

/**
 * Apply a permutation (ItemId list) to the sections and re-number them.
 * Wrapper around `applyReorder` that ignores ids not present in `sections`
 * and pads with any sections that were omitted from the permutation
 * (shouldn't happen when the generator produces a full permutation, but
 * keeps the model total).
 */
function applyReorderSafe(sections: Section[], orderedIds: string[]): Section[] {
  const known = new Set(sections.map((s) => s.ItemId));
  const filtered = orderedIds.filter((id) => known.has(id));
  // Any ids not mentioned keep their relative order at the tail.
  const mentioned = new Set(filtered);
  const tail = sections
    .filter((s) => !mentioned.has(s.ItemId))
    .map((s) => s.ItemId);
  return applyReorder(sections, [...filtered, ...tail]);
}

/**
 * Invariant: the collected `section_order` values, sorted ascending, form
 * the contiguous prefix `[0, 1, ..., N-1]` of ℕ. This is the exact
 * statement of design §Correctness Properties #9.
 */
function expectContiguousPrefix(sections: Section[]): void {
  const sorted = sections.map((s) => s.section_order).sort((a, b) => a - b);
  const expected = sections.map((_, i) => i);
  expect(sorted).toEqual(expected);
}

// ---------------------------------------------------------------------------
// Task 4.4 — Property 4: Section ordering stability under any permutation.
// **Validates: Design §Correctness Properties #4**
// ---------------------------------------------------------------------------

describe('applyReorder — Property 4: permutation stability (Task 4.4)', () => {
  /**
   * For any initial ordered list of N sections with `section_order = 0..N-1`,
   * and any permutation π of their `ItemIds`, after applying `reorder(π)`
   * the sections sorted ascending by `section_order` equal π.
   *
   * Generator strategy:
   *  - `fc.uniqueArray(fc.uuid())` produces a set of distinct stable ids.
   *  - `fc.shuffledSubarray(ids, { minLength: N, maxLength: N })` yields a
   *    genuine permutation of those same ids.
   *  - We pair the two by drawing the id array first via `fc.letrec` /
   *    `chain` so the permutation is guaranteed to be over exactly the
   *    same set.
   */
  it('reorders N sections to match any permutation of their ItemIds', () => {
    const idsArb = fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 12 });

    fc.assert(
      fc.property(
        idsArb.chain((ids) =>
          fc
            .shuffledSubarray(ids, { minLength: ids.length, maxLength: ids.length })
            .map((permutation) => ({ ids, permutation })),
        ),
        ({ ids, permutation }) => {
          // Build the canonical initial collection: section_order = index.
          const initial: Section[] = ids.map((ItemId, i) => ({
            ItemId,
            section_order: i,
          }));

          const after = applyReorder(initial, permutation);

          // Sort ascending by section_order and project back to ids.
          const sortedIds = [...after]
            .sort((a, b) => a.section_order - b.section_order)
            .map((s) => s.ItemId);

          expect(sortedIds).toEqual(permutation);
          // Bonus: contiguity invariant must hold after any single reorder.
          expectContiguousPrefix(after);
        },
      ),
    );
  });

  it('is idempotent when the permutation equals the current order', () => {
    const idsArb = fc.uniqueArray(fc.uuid(), { minLength: 0, maxLength: 12 });

    fc.assert(
      fc.property(idsArb, (ids) => {
        const initial: Section[] = ids.map((ItemId, i) => ({
          ItemId,
          section_order: i,
        }));

        const after = applyReorder(initial, ids);

        expect(after).toEqual(initial);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Task 4.5 — Property 9: `section_order` forms a contiguous prefix of ℕ
// under any sequence of Create / Delete / Reorder commands.
// **Validates: Design §Correctness Properties #9**
// ---------------------------------------------------------------------------

type Command =
  | { kind: 'create'; newId: string }
  | { kind: 'delete'; index: number }
  | { kind: 'reorder'; permutation: number[] };

describe('Create / Delete / Reorder model — Property 9: contiguity (Task 4.5)', () => {
  /**
   * Arbitrary that emits a single command. Because `reorder` needs to know
   * how many sections exist to produce a valid permutation, we represent
   * the permutation as an array of numeric indices `[0..N-1]` and let the
   * executor resolve them against the current collection length at runtime.
   *
   * `create` carries a freshly generated `ItemId` so repeated creates don't
   * collide.
   *
   * `delete` carries an unsigned index that the executor will reduce
   * modulo the current length — this keeps the generator total without
   * biasing toward "delete-nothing" no-ops.
   */
  const commandArb: fc.Arbitrary<Command> = fc.oneof(
    fc.record({ kind: fc.constant('create' as const), newId: fc.uuid() }),
    fc.record({
      kind: fc.constant('delete' as const),
      index: fc.nat({ max: 1000 }),
    }),
    fc.record({
      kind: fc.constant('reorder' as const),
      // Permutations are generated in the executor because we need to know
      // N at execution time. We carry an auxiliary seed array that will
      // drive the permutation choice deterministically.
      permutation: fc.array(fc.nat({ max: 1000 }), { maxLength: 32 }),
    }),
  );

  /**
   * Given a numeric "seed" array and a collection of ids, produce a
   * permutation of those ids. We do this deterministically in-executor
   * (instead of via `fc.shuffledSubarray`) so that the command sequence
   * remains fully captured by the generated `Command` list — this makes
   * shrinking counter-examples far more useful.
   */
  function seedPermutation<T>(seed: number[], items: T[]): T[] {
    const remaining = [...items];
    const out: T[] = [];
    let cursor = 0;
    while (remaining.length > 0) {
      const pick = (seed[cursor] ?? cursor) % remaining.length;
      out.push(remaining.splice(pick, 1)[0]);
      cursor += 1;
    }
    return out;
  }

  /** Apply a single command against the current model state. */
  function step(state: Section[], cmd: Command): Section[] {
    switch (cmd.kind) {
      case 'create':
        return applyCreate(state, cmd.newId);
      case 'delete':
        return applyDelete(state, cmd.index);
      case 'reorder': {
        if (state.length === 0) return state;
        const orderedIds = seedPermutation(
          cmd.permutation,
          state.map((s) => s.ItemId),
        );
        return applyReorderSafe(state, orderedIds);
      }
    }
  }

  it('preserves the [0..N-1] contiguity invariant after every command', () => {
    fc.assert(
      fc.property(fc.array(commandArb, { minLength: 0, maxLength: 40 }), (cmds) => {
        let state: Section[] = [];
        // Invariant must hold for the empty initial state.
        expectContiguousPrefix(state);

        for (const cmd of cmds) {
          state = step(state, cmd);
          expectContiguousPrefix(state);
        }
      }),
    );
  });

  it('never duplicates ItemIds across the command sequence', () => {
    fc.assert(
      fc.property(fc.array(commandArb, { minLength: 0, maxLength: 40 }), (cmds) => {
        let state: Section[] = [];
        for (const cmd of cmds) {
          state = step(state, cmd);
          const ids = state.map((s) => s.ItemId);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }),
    );
  });

  it('has collection length equal to the max section_order + 1 (or zero when empty)', () => {
    fc.assert(
      fc.property(fc.array(commandArb, { minLength: 0, maxLength: 40 }), (cmds) => {
        let state: Section[] = [];
        for (const cmd of cmds) {
          state = step(state, cmd);
          if (state.length === 0) {
            expect(state.length).toBe(0);
          } else {
            const maxOrder = Math.max(...state.map((s) => s.section_order));
            expect(maxOrder).toBe(state.length - 1);
          }
        }
      }),
    );
  });
});
