/**
 * SPEC-16 — glow = the propagation graph made visible (research note 05 §4).
 *
 * A panel glows iff a content_hash in its dependency set changed on recompute.
 * This is the standing propagation-honesty invariant (G6) rendered as an
 * operator-visible affordance: it must never UNDER-report (every changed
 * downstream glows) nor OVER-report (an unchanged panel stays dark). The logic
 * is a pure set-diff over the per-panel dependency-hash sets — no DOM, no timers
 * here (the shell owns the ~10s display window, DEC-17).
 */

/** panelId → the content hashes that panel renders (its dependency set). */
export type DependencyMap = Map<string, ReadonlySet<string>>;

/** glowId → the VALUE signature that unit currently renders. */
export type SignatureMap = Map<string, string>;

/**
 * The set of glow-unit ids whose VALUE signature changed between renders — the
 * row/cell-level, value-keyed glow (SPEC-16 follow-up). A unit glows iff what
 * the reader sees changed: a new id (the unit appeared) or a different signature
 * (its displayed value moved). A unit that merely got re-derived from a
 * re-stamped upstream but renders the same value does NOT glow — no over-report.
 * A byte-identical edit changes no signature, so nothing glows.
 */
export function changedGlowUnits(prev: SignatureMap, next: SignatureMap): Set<string> {
  const changed = new Set<string>();
  for (const [id, sig] of next) {
    if (prev.get(id) !== sig) changed.add(id); // new id, or moved value
  }
  return changed;
}

function symmetricallyDiffers(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return true;
  for (const h of a) if (!b.has(h)) return true;
  return false;
}

/**
 * The set of panel ids whose dependency-hash set changed between renders. A
 * panel present in only one of the two maps counts as changed (it appeared or
 * disappeared). A byte-identical edit (idempotent re-create) yields no change,
 * honestly — nothing glows.
 */
export function changedPanels(prev: DependencyMap, next: DependencyMap): Set<string> {
  const changed = new Set<string>();
  const empty: ReadonlySet<string> = new Set();
  const ids = new Set<string>([...prev.keys(), ...next.keys()]);
  for (const id of ids) {
    const before = prev.get(id) ?? empty;
    const after = next.get(id) ?? empty;
    if (symmetricallyDiffers(before, after)) changed.add(id);
  }
  return changed;
}

/**
 * Roll a set of changed panel ids up to the tabs that own them. `tabOfPanel`
 * maps a panel id to its tab id. A tab glows iff one of its panels changed AND
 * that change did not originate on that tab (the source tab is not "downstream"
 * of its own edit) — the caller passes `sourceTab` to suppress it.
 */
export function changedTabs(
  changed: ReadonlySet<string>,
  tabOfPanel: (panelId: string) => string | undefined,
  sourceTab?: string,
): Set<string> {
  const tabs = new Set<string>();
  for (const panelId of changed) {
    const tab = tabOfPanel(panelId);
    if (tab && tab !== sourceTab) tabs.add(tab);
  }
  return tabs;
}
