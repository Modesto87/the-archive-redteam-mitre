export interface Tactic {
  id: string;
  stixId: string;
  order: number;
  shortname: string;
  nameEn: string;
  namePt: string;
  subtitle: string;
  descriptionPt: string;
  pentesterRole: string;
  color: string;
  url: string;
}

export interface MitigationRef {
  id: string;
  name: string;
  descriptionPt: string;
  bypassHint: string | null;
}

export interface LogSourceRef {
  name: string;
  channel: string;
}

export interface MutableElement {
  field: string;
  description: string;
}

export interface Analytic {
  id: string;
  name: string;
  descriptionPt: string;
  platforms: string[];
  logSources: LogSourceRef[];
  mutableElements: MutableElement[];
}

export interface DetectionStrategy {
  id: string;
  name: string;
  url: string;
  analytics: Analytic[];
}

export interface ToolRef {
  id: string;
  name: string;
  type: 'Tool' | 'Malware';
  procedurePt: string;
}

export interface GroupRef {
  id: string;
  name: string;
  procedurePt: string;
}

export interface ExternalRef {
  source: string;
  description: string;
  url: string;
}

export interface BypassGuide {
  blockers: string[];
  bypasses: string[];
  blindSpots: string[];
  siblingPivotNote: string;
  isCloud: boolean;
  isAD: boolean;
}

export interface Technique {
  id: string;
  isSubtechnique: boolean;
  parentId: string | null;
  nameEn: string;
  fullNameEn: string;
  namePt: string;
  fullNamePt: string;
  tactics: string[];
  platforms: string[];
  version: string;
  modified: string;
  url: string;
  descriptionPt: string;
  codeArtifacts: string[];
  subtechniqueIds: string[];
  mitigations: MitigationRef[];
  detections: DetectionStrategy[];
  tools: ToolRef[];
  groups: GroupRef[];
  references: ExternalRef[];
  bypassGuide: BypassGuide;
}

export interface BypassStep {
  title: string;
  description: string;
  command: string;
  mitreIds: string[];
  opsecRisk: 'STEALTH' | 'BAIXO' | 'MÉDIO' | 'ALTO';
}

export interface IceBreakerScenario {
  id: string;
  title: string;
  category: string;
  severity: 'CRÍTICO' | 'ALTO' | 'MÉDIO';
  defenseMechanism: string;
  symptom: string;
  academicContext: string;
  bypassSteps: BypassStep[];
  lolbasTools: string[];
}

export interface LolbasEntry {
  binary: string;
  platform: string;
  mitreId: string;
  purpose: string;
  syntax: string;
}

export interface MitigationBypassEntry {
  defenseName: string;
  blockerSymptom: string;
  bypassStrategyPt: string;
  recommendedTechniques: string[];
}

export interface MitreCatalog {
  metadata: {
    title: string;
    specVersion: string;
    generatedAt: string;
    counts: {
      tactics: number;
      totalTechniques: number;
      parentTechniques: number;
      subtechniques: number;
      mitigations: number;
      detections: number;
      toolsAndMalware: number;
      aptGroups: number;
      iceBreakerScenarios: number;
    };
  };
  tactics: Tactic[];
  iceBreakerScenarios: IceBreakerScenario[];
  lolbasArsenal: LolbasEntry[];
  mitigationBypassMap: Record<string, MitigationBypassEntry>;
  techniques: Technique[];
}

export type ActiveTab = 'matrix' | 'icebreaker' | 'catalog' | 'workspace';

export interface PentesterWorkspaceState {
  bookmarkedIds: string[];
  notesByTechniqueId: Record<string, string>;
  engagementName: string;
  targetScope: string;
}
