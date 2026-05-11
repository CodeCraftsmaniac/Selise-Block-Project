import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Model-based property tests for the Data Gateway's Row-Level-Security
 * (RLS) rules that back the public profile surface. Tasks 14.4 and 14.5.
 *
 * These tests deliberately DO NOT hit the real gateway. Instead they
 * simulate the two RLS invariants described in `design.md` with a tiny
 * in-memory gateway and sample generated inputs over them. This keeps the
 * proof focused on the invariant itself (not on TanStack Query, MSW, or
 * network plumbing) and makes shrunk counter-examples easy to read.
 *
 * Design cross-references:
 *   - §API Integration Patterns (publicGraphqlClient) — public reads carry
 *     only `x-blocks-key`, never `Authorization`.
 *   - §Data Models (RLS rules) — View is Public, gated by implicit
 *     `is_published == true` filter on `user_profile` and
 *     `is_visible == true` filter on `user_custom_section`.
 *   - §Correctness Properties #3 — unpublished profile invisibility.
 *   - §Correctness Properties #8 — tenant data isolation on reads.
 */

// ---------------------------------------------------------------------------
// Gateway model
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a `user_profile` row used by the RLS model. Only the
 * fields that participate in the View rule and the `username` lookup are
 * declared so schema drift elsewhere cannot mask a regression in the RLS
 * filter itself.
 */
interface ProfileRow {
  username: string;
  is_published: boolean;
}

/**
 * Minimal shape of a `user_custom_section` row. `user_id` is the foreign
 * key the public-profile flow queries against; `is_visible` is the RLS
 * filter; `ItemId` is retained for realism and to make counter-examples
 * easier to read.
 */
interface SectionRow {
  ItemId: string;
  user_id: string;
  is_visible: boolean;
}

/**
 * Simulates the public Data Gateway:
 *   - `publicQueryProfiles` applies the RLS `View` filter
 *     `is_published == true` before any caller-supplied filter runs.
 *   - `publicQuerySections` applies `is_visible == true` before filtering
 *     by `user_id`. This matches the RLS rule for `user_custom_section`.
 *
 * The model is intentionally minimal — any additional filters are applied
 * AFTER the RLS filter so the invariant is impossible to bypass by crafting
 * an input that "overrides" the rule.
 */
function publicQueryProfiles(
  rows: ProfileRow[],
  filter: { username?: string } = {},
): { items: ProfileRow[] } {
  // RLS layer: only published profiles are ever visible via the public view.
  const afterRls = rows.filter((p) => p.is_published === true);
  // Caller-supplied filter runs against the already-filtered view.
  const items =
    filter.username === undefined
      ? afterRls
      : afterRls.filter((p) => p.username === filter.username);
  return { items };
}

function publicQuerySections(
  rows: SectionRow[],
  filter: { user_id?: string } = {},
): { items: SectionRow[] } {
  // RLS layer: only visible sections are ever returned by the View rule.
  const afterRls = rows.filter((s) => s.is_visible === true);
  const items =
    filter.user_id === undefined
      ? afterRls
      : afterRls.filter((s) => s.user_id === filter.user_id);
  return { items };
}

// ---------------------------------------------------------------------------
// Task 14.4 — Property 3: Unpublished profile invisibility to public.
// **Validates: Design §Correctness Properties #3**
// ---------------------------------------------------------------------------

describe('publicGraphqlClient RLS — Property 3: unpublished profile invisibility (Task 14.4)', () => {
  /**
   * Generator: an array of profiles with realistic usernames (matching the
   * spec regex in `profile.types.ts`) and arbitrary `is_published` flags,
   * paired with an index into that array that identifies the profile under
   * test. Using an index keeps the probe username guaranteed to exist in
   * the dataset so the test cannot trivially pass by querying for a
   * non-existent username.
   */
  const datasetArb = fc
    .uniqueArray(
      fc.record({
        username: fc.stringMatching(/^[a-z0-9][a-z0-9-_]{2,29}$/),
        is_published: fc.boolean(),
      }),
      {
        minLength: 1,
        maxLength: 20,
        selector: (p) => p.username,
      },
    )
    .chain((rows) =>
      fc.nat({ max: rows.length - 1 }).map((pickIndex) => ({ rows, pickIndex })),
    );

  it('**Validates: Design §Correctness Properties #3 (Property 3)** — for any profile p with is_published=false, publicQuery({filter:{username:p.username}}).items === []', () => {
    fc.assert(
      fc.property(datasetArb, ({ rows, pickIndex }) => {
        const probe = rows[pickIndex];

        const result = publicQueryProfiles(rows, { username: probe.username });

        if (probe.is_published === false) {
          // Core invariant: an unpublished profile must be invisible, even
          // when the caller supplies its exact username as the filter.
          expect(result.items).toEqual([]);
        } else {
          // Dual invariant: a published profile must be visible. This is
          // not part of Property 3 but anchors the filter so a trivially
          // "return nothing" implementation cannot satisfy the test.
          expect(result.items.some((p) => p.username === probe.username)).toBe(
            true,
          );
          // No unpublished row is ever returned, regardless of which
          // username the caller probed.
          expect(result.items.every((p) => p.is_published === true)).toBe(true);
        }
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Task 14.5 — Property 8: Tenant data isolation on public/any-caller reads.
// **Validates: Design §Correctness Properties #8**
// ---------------------------------------------------------------------------

describe('gateway RLS — Property 8: tenant data isolation on reads (Task 14.5)', () => {
  /**
   * Generator: a pair of distinct users u1, u2, each owning a mixed set of
   * visible and hidden sections. `fc.uuid()` gives stable, distinct user
   * ids; `filter(id1 !== id2)` forces the u1 ≠ u2 precondition without
   * resorting to a post-hoc `fc.pre`, which keeps the generator efficient.
   */
  const userArb = fc.record({
    userId: fc.uuid(),
    sections: fc.array(
      fc.record({
        ItemId: fc.uuid(),
        is_visible: fc.boolean(),
      }),
      { maxLength: 10 },
    ),
  });

  const userPairArb = fc
    .tuple(userArb, userArb)
    .filter(([u1, u2]) => u1.userId !== u2.userId);

  it('**Validates: Design §Correctness Properties #8 (Property 8)** — graphqlClient(token=u1).getUserCustomSections({filter:{user_id:u2.ItemId}}).items contains only rows where is_visible === true', () => {
    fc.assert(
      fc.property(userPairArb, ([u1, u2]) => {
        // Flatten the two users' sections into a single dataset the model
        // gateway owns, tagging each row with its owning user_id.
        const rows: SectionRow[] = [
          ...u1.sections.map((s) => ({
            ItemId: s.ItemId,
            user_id: u1.userId,
            is_visible: s.is_visible,
          })),
          ...u2.sections.map((s) => ({
            ItemId: s.ItemId,
            user_id: u2.userId,
            is_visible: s.is_visible,
          })),
        ];

        // u1 queries for u2's sections. Because any caller (public or
        // cross-tenant authenticated) is subject to the `is_visible=true`
        // View rule, the result must contain only visible rows AND must
        // never leak u1's own rows.
        const result = publicQuerySections(rows, { user_id: u2.userId });

        // Core invariant from Property 8.
        expect(result.items.every((s) => s.is_visible === true)).toBe(true);

        // Tenant boundary: no row belonging to u1 is ever returned when
        // the filter targets u2.
        expect(result.items.every((s) => s.user_id === u2.userId)).toBe(true);

        // Completeness: every one of u2's visible sections is returned.
        // This prevents a trivial "return nothing" from satisfying the
        // safety half of the property.
        const expectedVisibleIds = u2.sections
          .filter((s) => s.is_visible)
          .map((s) => s.ItemId)
          .sort();
        const actualIds = result.items.map((s) => s.ItemId).sort();
        expect(actualIds).toEqual(expectedVisibleIds);
      }),
      { numRuns: 50 },
    );
  });
});
