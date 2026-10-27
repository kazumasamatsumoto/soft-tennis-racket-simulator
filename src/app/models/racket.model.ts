/**
 * ソフトテニスラケット設計シミュレーターのドメインモデル。
 * 数値はすべて SI 系（mm / g）を基本とし、慣例的に使われる単位
 * （フェイス面積: 平方インチ、テンション: ポンド）はそのまま採用しています。
 */

export type MaterialId =
  'aluminum' | 'graphite' | 'carbon_high' | 'carbon_kevlar' | 'carbon_titanium' | 'carbon_nano';

export type ShaftType = 'single' | 'double';

export type StringPattern = '15x16' | '16x17' | '17x18';

export type StringMaterialId = 'nylon_mono' | 'nylon_multi' | 'polyester';

export type GripSize = 'SG0' | 'SG1' | 'SG2';

export type PlayerPosition = 'fore' | 'back' | 'allround';

export interface RacketColors {
  frame: string;
  accent: string;
  strings: string;
  grip: string;
}

/** ユーザーが編集する設計値。 */
export interface RacketDesign {
  name: string;
  materialId: MaterialId;
  shaftType: ShaftType;
  /** 全長 (mm) */
  lengthMm: number;
  /** フレーム重量 (g, ストリング・グリップテープを含まない) */
  weightG: number;
  /** グリップエンドからのバランスポイント (mm) */
  balanceMm: number;
  /** フェイス面積 (平方インチ) */
  faceSizeSqIn: number;
  /** フレーム厚 (mm) */
  frameThicknessMm: number;
  stringPattern: StringPattern;
  stringMaterialId: StringMaterialId;
  /** ストリングテンション (ポンド) */
  tensionLbs: number;
  gripSize: GripSize;
  /** 想定するプレーポジション */
  targetPosition: PlayerPosition;
  colors: RacketColors;
}

/** フレーム素材の物性（0〜1 に正規化した相対値）。 */
export interface FrameMaterial {
  id: MaterialId;
  name: string;
  /** 剛性 (高いほど反発が強く、硬い打球感) */
  stiffness: number;
  /** 振動吸収性 */
  damping: number;
  /** 耐久性 */
  durability: number;
  /** 材料費の目安 (円/g) */
  costPerGram: number;
  /** 型・樹脂・消耗品などの初期費用目安 (円) */
  toolingCostYen: number;
  /** 自作難易度 (1: 易しい 〜 5: とても難しい) */
  buildDifficulty: number;
  description: string;
}

export interface StringMaterial {
  id: StringMaterialId;
  name: string;
  rebound: number;
  softness: number;
  spin: number;
  durability: number;
  priceYen: number;
  description: string;
}

export interface ShaftOption {
  id: ShaftType;
  name: string;
  description: string;
}

export interface StringPatternOption {
  id: StringPattern;
  name: string;
  mains: number;
  crosses: number;
  /** 目の粗さ (1: 粗い 〜 0: 細かい) */
  openness: number;
  description: string;
}

export interface GripOption {
  id: GripSize;
  name: string;
  circumferenceMm: number;
  description: string;
}

export interface PositionOption {
  id: PlayerPosition;
  name: string;
  description: string;
}

export interface NumericLimit {
  min: number;
  max: number;
  step: number;
}

export type NumericDesignKey =
  'lengthMm' | 'weightG' | 'balanceMm' | 'faceSizeSqIn' | 'frameThicknessMm' | 'tensionLbs';

/** 7 つの性能指標 (0〜100)。 */
export interface MetricScores {
  power: number;
  control: number;
  maneuverability: number;
  stability: number;
  comfort: number;
  spin: number;
  durability: number;
}

export type MetricKey = keyof MetricScores;

export type PositionMatch = Record<PlayerPosition, number>;

export type BalanceType = 'top-light' | 'even' | 'top-heavy';

export interface DesignIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface CostItem {
  label: string;
  yen: number;
}

/** 設計値から計算される性能プロファイル。 */
export interface PerformanceProfile {
  scores: MetricScores;
  /** スイングウェイト (kg·cm², グリップエンドから 10cm を軸とした簡易モデル) */
  swingWeight: number;
  balanceType: BalanceType;
  /** 全長の中心からのバランスポイントのずれ (mm, 正ならトップヘビー) */
  balanceOffsetMm: number;
  faceWidthMm: number;
  faceHeightMm: number;
  positionMatch: PositionMatch;
  recommendedPosition: PlayerPosition;
  estimatedCostYen: number;
  costBreakdown: CostItem[];
  buildDifficulty: number;
  buildHours: number;
  issues: DesignIssue[];
}

export interface SavedDesign {
  id: string;
  savedAt: string;
  design: RacketDesign;
}

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  design: RacketDesign;
}
