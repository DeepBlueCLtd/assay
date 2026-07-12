/**
 * GENERATED FILE — do not edit.
 * Source: schema/assay-knowledge-model.yaml (docs/assay-knowledge-model.md §11).
 * Regenerate with: npm run gen
 */

/** Scenario-clock timestep, D-day origin (ASSAY-DEC-17). Never wall clock. */

export type Timestep = number;

/** Stable human-assigned id (K9, C2, R1, ...) (ASSAY-DEC-21). */

export type LogicalId = string;

/** SHA-256 of canonical JSON; the store address. Not part of the hashed payload. */

export type ContentHash = string;

/** Named region on the grid (MCOO overlay region). Geometry lives once in VignetteConfig (research note 02-compile.md). */

export type RegionName = string;

/** ASSAY-DEC-14. Only 'observed' is fact and may render unbanded. */

export type SourceClass = 'observed' | 'reported' | 'assessed' | 'assumption';
export const SourceClassValues = ['observed', 'reported', 'assessed', 'assumption'] as const;

/** ICD 203 confidence levels (ASSAY-DEC-16). Width mapping decided in research note 01-knowledge.md — minimum relative width per level (low 0.25 / moderate 0.10 / high 0), enforced as a warning-level lint at write (observed exempt). */

export type ConfidenceBand = 'low' | 'moderate' | 'high';
export const ConfidenceBandValues = ['low', 'moderate', 'high'] as const;

/** ASSAY-DEC-6; compile firewall rules in knowledge-model §9. */

export type EncodingClass = 'hard_constraint' | 'banded_soft_cost' | 'scenario_weight';
export const EncodingClassValues = ['hard_constraint', 'banded_soft_cost', 'scenario_weight'] as const;

/** ASSAY-DEC-17. */

export type LifecycleStatus = 'open' | 'answered' | 'superseded' | 'stale' | 'contested' | 'resolved' | 'retired';
export const LifecycleStatusValues = ['open', 'answered', 'superseded', 'stale', 'contested', 'resolved', 'retired'] as const;


export type Criticality = 'routine' | 'important' | 'critical';
export const CriticalityValues = ['routine', 'important', 'critical'] as const;

/** ASSAY-DEC-19. Ordinal only; no numeric weights exist. */

export type CommitmentTier = 'must' | 'should' | 'prefer';
export const CommitmentTierValues = ['must', 'should', 'prefer'] as const;


export type Comparator = 'at_most' | 'at_least' | 'by_step' | 'never';
export const ComparatorValues = ['at_most', 'at_least', 'by_step', 'never'] as const;

/** Four stops, no decimals (ASSAY-DEC-9). */

export type VerdictBand = 'robust' | 'marginal' | 'tight' | 'violated';
export const VerdictBandValues = ['robust', 'marginal', 'tight', 'violated'] as const;


export type ChannelKind = 'mobility' | 'tide' | 'storm' | 'civil_density' | 'sensor' | 'threat';
export const ChannelKindValues = ['mobility', 'tide', 'storm', 'civil_density', 'sensor', 'threat'] as const;


export type TraceEdgeType = 'compiled_into' | 'scored_from' | 'cited_in' | 'sacrificed_in' | 'supersedes' | 'contests' | 'resolves' | 'waives';
export const TraceEdgeTypeValues = ['compiled_into', 'scored_from', 'cited_in', 'sacrificed_in', 'supersedes', 'contests', 'resolves', 'waives'] as const;

/** Closed interval, lo <= hi. No midpoint slot may ever be added (ASSAY-DEC-15). */

export interface Band {
  lo: number;
  hi: number;
  unit: string;
}


export interface Provenance {
  source_class: SourceClass;
  confidence: ConfidenceBand;
  /** Accountable analyst/staff cell; trace chains terminate here. */
  owner: string;
  single_source: boolean;
  collected_at?: Timestep;
  note?: string;
}


export interface ValidityWindow {
  valid_from: Timestep;
  valid_until: Timestep;
}

/** Licenses an assessed/reported source to compile as hard_constraint (knowledge-model §9). */

export interface Waiver {
  granted_by: string;
  justification: string;
  granted_at: Timestep;
}

/** One row of the miniature event matrix (ASSAY-DEC-18). */

export interface ExpectedAnswer {
  coa: LogicalId;
  band: Band;
}


export interface CollectionOption {
  method: string;
  /** An estimate */
  cost: Band;
  earliest_result?: Timestep;
}

/** Two-tier identity (ASSAY-DEC-21). Relationships are TraceEdges, never slots. */

export interface StoredObject {
  logical_id: LogicalId;
  version: number;
}

/** The central type (ASSAY-DEC-6, DEC-17); commentary in knowledge-model §4. */

export interface KnowledgeObject extends StoredObject {
  question: string;
  subject: string;
  encoding_class: EncodingClass;
  answer?: Band;
  provenance?: Provenance;
  criticality: Criticality;
  validity?: ValidityWindow;
  status: LifecycleStatus;
  waiver?: Waiver;
  expected_answers?: ExpectedAnswer[];
  collection?: CollectionOption[];
}

/** ASSAY-DEC-19; threshold is scalar fact-of-intent (ASSAY-DEC-14). */

export interface Commitment extends StoredObject {
  statement: string;
  tier: CommitmentTier;
  metric: string;
  comparator: Comparator;
  threshold: number;
  unit: string;
  owner: string;
  scope?: string;
}


export interface ChannelOverride {
  channel: ChannelKind;
  region?: string;
  override: Band;
}


export interface ScenarioCOA extends StoredObject {
  name: string;
  narrative: string;
  excursion?: ChannelOverride[];
  /** Ref to a scenario_weight KnowledgeObject. Never compiles into constraint or cost (knowledge-model §9). */
  likelihood?: LogicalId;
}


export interface GridSpec {
  cols: number;
  rows: number;
  cell_km: number;
  timestep_hours: number;
  horizon_steps: number;
}

/** One named, optionally time-boxed deviation from a channel default (sparse channels, research note 02-compile.md). Values are banded because their sources are (G2); source names the KnowledgeObject the value derives from (G3). */

export interface RegionOverride {
  region: RegionName;
  value: Band;
  from_step?: Timestep;
  until_step?: Timestep;
  /** The KnowledgeObject this override derives from; complements the compiled_into edge (G3). */
  source?: LogicalId;
}

/** A compile layer stored sparse — a default plus deviations, the MCOO idiom (research note 02-compile.md). Dense per-cell channels are never stored or hashed (retired ChannelCell; resolves seam open item 2). */

export interface Channel {
  name: string;
  kind: ChannelKind;
  /** The quiet baseline; region overrides deviate from it. */
  default: Band;
  regions?: RegionOverride[];
}


export interface ConsumedRef {
  logical_id: LogicalId;
  content_hash: ContentHash;
}

/** Deterministic compile product; stamp semantics in seam contract §1 (G1). */

export interface CompiledWorld extends StoredObject {
  grid: GridSpec;
  channels: Channel[];
  consumed: ConsumedRef[];
  scenario?: LogicalId;
  engine_version: string;
  stamp: string;
}

/** The quiet baseline band for a channel kind, held once in VignetteConfig (research note 02-compile.md). */

export interface ChannelDefault {
  kind: ChannelKind;
  default: Band;
}

/** A named region's extent as a bounding rect on the grid (demonstrator-sufficient geometry, research note 02-compile.md). */

export interface RegionGeometry {
  name: RegionName;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Routes a KnowledgeObject subject (topic key, knowledge-model §5) to a channel region at compile. scenario.* subjects are absent (firewalled). */

export interface SubjectMapEntry {
  subject: string;
  channel: ChannelKind;
  region: RegionName;
}

/** The single home of grid, per-channel defaults, region geometry, and subject routing consumed by compile (research note 02-compile.md; seam §4 config). */

export interface VignetteConfig extends StoredObject {
  grid: GridSpec;
  channels: ChannelDefault[];
  regions: RegionGeometry[];
  subject_map: SubjectMapEntry[];
}


export interface ForceElement extends StoredObject {
  name: string;
  kind: string;
  mobility_class: string;
  notes?: string;
}


export interface RouteLeg {
  x: number;
  y: number;
  enter_step: Timestep;
  exit_step: Timestep;
}


export interface TaskWindow {
  task: string;
  x: number;
  y: number;
  from_step: Timestep;
  until_step: Timestep;
}


export interface ElementPlan {
  force_element: LogicalId;
  route?: RouteLeg[];
  tasks?: TaskWindow[];
}

/** Timed routes + task windows, nothing richer in v1 (ASSAY-DEC-20). */

export interface Plan extends StoredObject {
  name: string;
  seed: number;
  generator: string;
  elements: ElementPlan[];
}


export interface CommitmentVerdict extends StoredObject {
  plan: LogicalId;
  commitment: LogicalId;
  scenario: LogicalId;
  world_stamp: string;
  verdict: VerdictBand;
  margin?: Band;
  engine_version: string;
}


export interface PlanScore extends StoredObject {
  plan: LogicalId;
  scenario: LogicalId;
  world_stamp: string;
  criterion: string;
  score: Band;
  engine_version: string;
}


export interface RelaxationCandidate {
  plan: LogicalId;
  /** Non-empty by G4. */
  sacrificed: LogicalId[];
  /** The sacrifice in command language. */
  narrative: string;
}

/** G4 — never empty, never a silent drop; tie-breaks stated (ASSAY-DEC-19). */

export interface RelaxationReport extends StoredObject {
  world_stamp: string;
  scenario: LogicalId;
  candidates: RelaxationCandidate[];
  /** Required prose whenever same-tier sacrifices were ordered. */
  tie_break?: string;
}


export interface SelectionRationale extends StoredObject {
  selected_plan: LogicalId;
  relaxation_report?: LogicalId;
  statement: string;
  decided_by: string;
}

/** Written at compute time, never reconstructed (constitution III). */

export interface TraceEdge {
  from_hash: ContentHash;
  to_hash: ContentHash;
  edge_type: TraceEdgeType;
  stamp?: string;
  written_by: string;
}

/** Slot metadata for runtime validation (src/validate.ts). */
export interface SlotMeta { range: string; required: boolean; multivalued: boolean; }
export interface ClassMeta { parent?: string; abstract?: boolean; attributes: Record<string, SlotMeta>; }
export const SCHEMA: {
  typeAliases: Record<string, string>;
  enums: Record<string, readonly string[]>;
  classes: Record<string, ClassMeta>;
} = {
  typeAliases: {
    Timestep: 'number',
    LogicalId: 'string',
    ContentHash: 'string',
    RegionName: 'string',
  },
  enums: {
    SourceClass: ['observed', 'reported', 'assessed', 'assumption'],
    ConfidenceBand: ['low', 'moderate', 'high'],
    EncodingClass: ['hard_constraint', 'banded_soft_cost', 'scenario_weight'],
    LifecycleStatus: ['open', 'answered', 'superseded', 'stale', 'contested', 'resolved', 'retired'],
    Criticality: ['routine', 'important', 'critical'],
    CommitmentTier: ['must', 'should', 'prefer'],
    Comparator: ['at_most', 'at_least', 'by_step', 'never'],
    VerdictBand: ['robust', 'marginal', 'tight', 'violated'],
    ChannelKind: ['mobility', 'tide', 'storm', 'civil_density', 'sensor', 'threat'],
    TraceEdgeType: ['compiled_into', 'scored_from', 'cited_in', 'sacrificed_in', 'supersedes', 'contests', 'resolves', 'waives'],
  },
  classes: {
    Band: { attributes: { lo: { range: 'float', required: true, multivalued: false }, hi: { range: 'float', required: true, multivalued: false }, unit: { range: 'string', required: true, multivalued: false } } },
    Provenance: { attributes: { source_class: { range: 'SourceClass', required: true, multivalued: false }, confidence: { range: 'ConfidenceBand', required: true, multivalued: false }, owner: { range: 'string', required: true, multivalued: false }, single_source: { range: 'boolean', required: true, multivalued: false }, collected_at: { range: 'Timestep', required: false, multivalued: false }, note: { range: 'string', required: false, multivalued: false } } },
    ValidityWindow: { attributes: { valid_from: { range: 'Timestep', required: true, multivalued: false }, valid_until: { range: 'Timestep', required: true, multivalued: false } } },
    Waiver: { attributes: { granted_by: { range: 'string', required: true, multivalued: false }, justification: { range: 'string', required: true, multivalued: false }, granted_at: { range: 'Timestep', required: true, multivalued: false } } },
    ExpectedAnswer: { attributes: { coa: { range: 'LogicalId', required: true, multivalued: false }, band: { range: 'Band', required: true, multivalued: false } } },
    CollectionOption: { attributes: { method: { range: 'string', required: true, multivalued: false }, cost: { range: 'Band', required: true, multivalued: false }, earliest_result: { range: 'Timestep', required: false, multivalued: false } } },
    StoredObject: { abstract: true, attributes: { logical_id: { range: 'LogicalId', required: true, multivalued: false }, version: { range: 'integer', required: true, multivalued: false } } },
    KnowledgeObject: { parent: 'StoredObject', attributes: { question: { range: 'string', required: true, multivalued: false }, subject: { range: 'string', required: true, multivalued: false }, encoding_class: { range: 'EncodingClass', required: true, multivalued: false }, answer: { range: 'Band', required: false, multivalued: false }, provenance: { range: 'Provenance', required: false, multivalued: false }, criticality: { range: 'Criticality', required: true, multivalued: false }, validity: { range: 'ValidityWindow', required: false, multivalued: false }, status: { range: 'LifecycleStatus', required: true, multivalued: false }, waiver: { range: 'Waiver', required: false, multivalued: false }, expected_answers: { range: 'ExpectedAnswer', required: false, multivalued: true }, collection: { range: 'CollectionOption', required: false, multivalued: true } } },
    Commitment: { parent: 'StoredObject', attributes: { statement: { range: 'string', required: true, multivalued: false }, tier: { range: 'CommitmentTier', required: true, multivalued: false }, metric: { range: 'string', required: true, multivalued: false }, comparator: { range: 'Comparator', required: true, multivalued: false }, threshold: { range: 'float', required: true, multivalued: false }, unit: { range: 'string', required: true, multivalued: false }, owner: { range: 'string', required: true, multivalued: false }, scope: { range: 'string', required: false, multivalued: false } } },
    ChannelOverride: { attributes: { channel: { range: 'ChannelKind', required: true, multivalued: false }, region: { range: 'string', required: false, multivalued: false }, override: { range: 'Band', required: true, multivalued: false } } },
    ScenarioCOA: { parent: 'StoredObject', attributes: { name: { range: 'string', required: true, multivalued: false }, narrative: { range: 'string', required: true, multivalued: false }, excursion: { range: 'ChannelOverride', required: false, multivalued: true }, likelihood: { range: 'LogicalId', required: false, multivalued: false } } },
    GridSpec: { attributes: { cols: { range: 'integer', required: true, multivalued: false }, rows: { range: 'integer', required: true, multivalued: false }, cell_km: { range: 'float', required: true, multivalued: false }, timestep_hours: { range: 'integer', required: true, multivalued: false }, horizon_steps: { range: 'integer', required: true, multivalued: false } } },
    RegionOverride: { attributes: { region: { range: 'RegionName', required: true, multivalued: false }, value: { range: 'Band', required: true, multivalued: false }, from_step: { range: 'Timestep', required: false, multivalued: false }, until_step: { range: 'Timestep', required: false, multivalued: false }, source: { range: 'LogicalId', required: false, multivalued: false } } },
    Channel: { attributes: { name: { range: 'string', required: true, multivalued: false }, kind: { range: 'ChannelKind', required: true, multivalued: false }, default: { range: 'Band', required: true, multivalued: false }, regions: { range: 'RegionOverride', required: false, multivalued: true } } },
    ConsumedRef: { attributes: { logical_id: { range: 'LogicalId', required: true, multivalued: false }, content_hash: { range: 'ContentHash', required: true, multivalued: false } } },
    CompiledWorld: { parent: 'StoredObject', attributes: { grid: { range: 'GridSpec', required: true, multivalued: false }, channels: { range: 'Channel', required: true, multivalued: true }, consumed: { range: 'ConsumedRef', required: true, multivalued: true }, scenario: { range: 'LogicalId', required: false, multivalued: false }, engine_version: { range: 'string', required: true, multivalued: false }, stamp: { range: 'string', required: true, multivalued: false } } },
    ChannelDefault: { attributes: { kind: { range: 'ChannelKind', required: true, multivalued: false }, default: { range: 'Band', required: true, multivalued: false } } },
    RegionGeometry: { attributes: { name: { range: 'RegionName', required: true, multivalued: false }, x0: { range: 'integer', required: true, multivalued: false }, y0: { range: 'integer', required: true, multivalued: false }, x1: { range: 'integer', required: true, multivalued: false }, y1: { range: 'integer', required: true, multivalued: false } } },
    SubjectMapEntry: { attributes: { subject: { range: 'string', required: true, multivalued: false }, channel: { range: 'ChannelKind', required: true, multivalued: false }, region: { range: 'RegionName', required: true, multivalued: false } } },
    VignetteConfig: { parent: 'StoredObject', attributes: { grid: { range: 'GridSpec', required: true, multivalued: false }, channels: { range: 'ChannelDefault', required: true, multivalued: true }, regions: { range: 'RegionGeometry', required: true, multivalued: true }, subject_map: { range: 'SubjectMapEntry', required: true, multivalued: true } } },
    ForceElement: { parent: 'StoredObject', attributes: { name: { range: 'string', required: true, multivalued: false }, kind: { range: 'string', required: true, multivalued: false }, mobility_class: { range: 'string', required: true, multivalued: false }, notes: { range: 'string', required: false, multivalued: false } } },
    RouteLeg: { attributes: { x: { range: 'integer', required: true, multivalued: false }, y: { range: 'integer', required: true, multivalued: false }, enter_step: { range: 'Timestep', required: true, multivalued: false }, exit_step: { range: 'Timestep', required: true, multivalued: false } } },
    TaskWindow: { attributes: { task: { range: 'string', required: true, multivalued: false }, x: { range: 'integer', required: true, multivalued: false }, y: { range: 'integer', required: true, multivalued: false }, from_step: { range: 'Timestep', required: true, multivalued: false }, until_step: { range: 'Timestep', required: true, multivalued: false } } },
    ElementPlan: { attributes: { force_element: { range: 'LogicalId', required: true, multivalued: false }, route: { range: 'RouteLeg', required: false, multivalued: true }, tasks: { range: 'TaskWindow', required: false, multivalued: true } } },
    Plan: { parent: 'StoredObject', attributes: { name: { range: 'string', required: true, multivalued: false }, seed: { range: 'integer', required: true, multivalued: false }, generator: { range: 'string', required: true, multivalued: false }, elements: { range: 'ElementPlan', required: true, multivalued: true } } },
    CommitmentVerdict: { parent: 'StoredObject', attributes: { plan: { range: 'LogicalId', required: true, multivalued: false }, commitment: { range: 'LogicalId', required: true, multivalued: false }, scenario: { range: 'LogicalId', required: true, multivalued: false }, world_stamp: { range: 'string', required: true, multivalued: false }, verdict: { range: 'VerdictBand', required: true, multivalued: false }, margin: { range: 'Band', required: false, multivalued: false }, engine_version: { range: 'string', required: true, multivalued: false } } },
    PlanScore: { parent: 'StoredObject', attributes: { plan: { range: 'LogicalId', required: true, multivalued: false }, scenario: { range: 'LogicalId', required: true, multivalued: false }, world_stamp: { range: 'string', required: true, multivalued: false }, criterion: { range: 'string', required: true, multivalued: false }, score: { range: 'Band', required: true, multivalued: false }, engine_version: { range: 'string', required: true, multivalued: false } } },
    RelaxationCandidate: { attributes: { plan: { range: 'LogicalId', required: true, multivalued: false }, sacrificed: { range: 'LogicalId', required: true, multivalued: true }, narrative: { range: 'string', required: true, multivalued: false } } },
    RelaxationReport: { parent: 'StoredObject', attributes: { world_stamp: { range: 'string', required: true, multivalued: false }, scenario: { range: 'LogicalId', required: true, multivalued: false }, candidates: { range: 'RelaxationCandidate', required: true, multivalued: true }, tie_break: { range: 'string', required: false, multivalued: false } } },
    SelectionRationale: { parent: 'StoredObject', attributes: { selected_plan: { range: 'LogicalId', required: true, multivalued: false }, relaxation_report: { range: 'LogicalId', required: false, multivalued: false }, statement: { range: 'string', required: true, multivalued: false }, decided_by: { range: 'string', required: true, multivalued: false } } },
    TraceEdge: { attributes: { from_hash: { range: 'ContentHash', required: true, multivalued: false }, to_hash: { range: 'ContentHash', required: true, multivalued: false }, edge_type: { range: 'TraceEdgeType', required: true, multivalued: false }, stamp: { range: 'string', required: false, multivalued: false }, written_by: { range: 'string', required: true, multivalued: false } } },
  },
};
