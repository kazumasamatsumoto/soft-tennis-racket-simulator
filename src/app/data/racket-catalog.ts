import {
  DesignPreset,
  FrameMaterial,
  GripOption,
  MetricKey,
  NumericDesignKey,
  NumericLimit,
  PlayerPosition,
  PositionOption,
  RacketDesign,
  ShaftOption,
  StringMaterial,
  StringPatternOption,
} from '../models/racket.model';

/**
 * フレーム素材カタログ。
 * 物性値は市販ラケットの傾向を 0〜1 に正規化した相対値で、
 * 厳密な材料工学の値ではなく「設計の方向性」を比較するための目安です。
 */
export const FRAME_MATERIALS: readonly FrameMaterial[] = [
  {
    id: 'aluminum',
    name: 'アルミ合金',
    stiffness: 0.45,
    damping: 0.3,
    durability: 0.7,
    costPerGram: 8,
    toolingCostYen: 3000,
    buildDifficulty: 2,
    description: '安価で加工しやすい入門素材。パイプを曲げて成形するため自作のハードルが最も低い。',
  },
  {
    id: 'graphite',
    name: 'グラファイト（標準カーボン）',
    stiffness: 0.6,
    damping: 0.5,
    durability: 0.6,
    costPerGram: 25,
    toolingCostYen: 12000,
    buildDifficulty: 4,
    description: '市販ラケットの標準素材。プリプレグを型に積層して焼成する。バランスの良い打球感。',
  },
  {
    id: 'carbon_high',
    name: '高弾性カーボン',
    stiffness: 0.8,
    damping: 0.45,
    durability: 0.55,
    costPerGram: 45,
    toolingCostYen: 15000,
    buildDifficulty: 4,
    description: '剛性が高く反発力に優れる。しなりが少ないぶん打球感は硬めになる。',
  },
  {
    id: 'carbon_kevlar',
    name: 'カーボン＋ケブラー',
    stiffness: 0.65,
    damping: 0.8,
    durability: 0.7,
    costPerGram: 50,
    toolingCostYen: 15000,
    buildDifficulty: 4,
    description: 'ケブラー繊維を混織し振動吸収性を高めた複合素材。腕への負担を抑えたい方向け。',
  },
  {
    id: 'carbon_titanium',
    name: 'カーボン＋チタン',
    stiffness: 0.9,
    damping: 0.4,
    durability: 0.8,
    costPerGram: 60,
    toolingCostYen: 18000,
    buildDifficulty: 5,
    description: 'チタンメッシュで剛性と耐久性を最大化。面安定性が高く、パワー重視の後衛向き。',
  },
  {
    id: 'carbon_nano',
    name: 'ナノカーボン複合',
    stiffness: 0.85,
    damping: 0.65,
    durability: 0.75,
    costPerGram: 80,
    toolingCostYen: 20000,
    buildDifficulty: 5,
    description: 'ナノ材料を樹脂に分散させ、高剛性と振動吸収を両立。材料費は最も高い。',
  },
];

export const STRING_MATERIALS: readonly StringMaterial[] = [
  {
    id: 'nylon_mono',
    name: 'ナイロンモノフィラメント',
    rebound: 0.7,
    softness: 0.5,
    spin: 0.5,
    durability: 0.6,
    priceYen: 1200,
    description: 'ソフトテニスで最も一般的。反発と耐久のバランス型。',
  },
  {
    id: 'nylon_multi',
    name: 'ナイロンマルチフィラメント',
    rebound: 0.6,
    softness: 0.85,
    spin: 0.45,
    durability: 0.4,
    priceYen: 1800,
    description: '細い繊維を束ねた構造で柔らかい打球感。ホールド感が高い。',
  },
  {
    id: 'polyester',
    name: 'ポリエステル',
    rebound: 0.45,
    softness: 0.25,
    spin: 0.8,
    durability: 0.85,
    priceYen: 1500,
    description: '硬めでスピンがかかりやすい。テンション維持と耐久に優れるが打球感は硬い。',
  },
];

export const SHAFT_OPTIONS: readonly ShaftOption[] = [
  {
    id: 'single',
    name: 'シングルシャフト',
    description:
      'シャフトが 1 本。軽量で振り抜きが良く、ボレーやスマッシュを多用する前衛に好まれる。',
  },
  {
    id: 'double',
    name: 'ダブルシャフト',
    description:
      'シャフトが 2 本。フレームのねじれに強く、ストロークの安定性とパワーに優れる後衛向き。',
  },
];

export const STRING_PATTERNS: readonly StringPatternOption[] = [
  {
    id: '15x16',
    name: '15 × 16（粗め）',
    mains: 15,
    crosses: 16,
    openness: 1,
    description: '目が粗く、スピンと反発が増す。ストリングの消耗は早い。',
  },
  {
    id: '16x17',
    name: '16 × 17（標準）',
    mains: 16,
    crosses: 17,
    openness: 0.5,
    description: 'ソフトテニスで標準的なパターン。バランス型。',
  },
  {
    id: '17x18',
    name: '17 × 18（細かめ）',
    mains: 17,
    crosses: 18,
    openness: 0,
    description: '目が細かくコントロール性と耐久性が高い。反発はやや抑えめ。',
  },
];

export const GRIP_OPTIONS: readonly GripOption[] = [
  {
    id: 'SG0',
    name: 'SG0（細め）',
    circumferenceMm: 100,
    description: '手の小さい方やジュニア向け。',
  },
  { id: 'SG1', name: 'SG1（標準）', circumferenceMm: 104, description: '最も一般的なサイズ。' },
  {
    id: 'SG2',
    name: 'SG2（太め）',
    circumferenceMm: 108,
    description: '手の大きい方や厚く握りたい方向け。',
  },
];

export const POSITION_OPTIONS: readonly PositionOption[] = [
  {
    id: 'fore',
    name: '前衛',
    description: 'ネット際でボレーやスマッシュを担当。素早い反応と操作性が求められる。',
  },
  {
    id: 'back',
    name: '後衛',
    description: 'ベースラインからのストロークが主体。パワーと安定性が求められる。',
  },
  {
    id: 'allround',
    name: 'オールラウンド',
    description: '前後どちらもこなす。バランスの取れた性能が求められる。',
  },
];

/** 各数値項目の入力範囲。 */
export const DESIGN_LIMITS: Record<NumericDesignKey, NumericLimit> = {
  lengthMm: { min: 660, max: 710, step: 1 },
  weightG: { min: 195, max: 275, step: 1 },
  balanceMm: { min: 260, max: 360, step: 1 },
  faceSizeSqIn: { min: 80, max: 105, step: 1 },
  frameThicknessMm: { min: 18, max: 30, step: 0.5 },
  tensionLbs: { min: 18, max: 40, step: 1 },
};

/** 日本ソフトテニス連盟の用具規定を参考にした目安値。公式ルールブックで必ずご確認ください。 */
export const REGULATION = {
  maxLengthMm: 700,
  maxFaceWidthMm: 290,
  recommendedTensionLbs: { min: 20, max: 35 },
  recommendedWeightG: { min: 200, max: 265 },
};

export const METRIC_LABELS: Record<MetricKey, string> = {
  power: 'パワー',
  control: 'コントロール',
  maneuverability: '操作性',
  stability: '面安定性',
  comfort: '打球感',
  spin: 'スピン',
  durability: '耐久性',
};

export const METRIC_KEYS: readonly MetricKey[] = [
  'power',
  'control',
  'maneuverability',
  'stability',
  'comfort',
  'spin',
  'durability',
];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  fore: '前衛',
  back: '後衛',
  allround: 'オールラウンド',
};

export const DEFAULT_DESIGN: RacketDesign = {
  name: 'マイラケット',
  materialId: 'graphite',
  shaftType: 'double',
  lengthMm: 700,
  weightG: 230,
  balanceMm: 320,
  faceSizeSqIn: 95,
  frameThicknessMm: 24,
  stringPattern: '16x17',
  stringMaterialId: 'nylon_mono',
  tensionLbs: 28,
  gripSize: 'SG1',
  targetPosition: 'allround',
  colors: {
    frame: '#1f3a93',
    accent: '#f5b700',
    strings: '#f4f4f4',
    grip: '#222222',
  },
};

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'fore-volley',
    name: '前衛ボレーモデル',
    description: '軽量・トップライト・シングルシャフトで振り抜き重視。',
    design: {
      ...DEFAULT_DESIGN,
      name: '前衛ボレーモデル',
      materialId: 'carbon_high',
      shaftType: 'single',
      weightG: 215,
      balanceMm: 300,
      faceSizeSqIn: 90,
      frameThicknessMm: 22,
      stringPattern: '16x17',
      tensionLbs: 30,
      targetPosition: 'fore',
      colors: { frame: '#c0392b', accent: '#ffffff', strings: '#f4f4f4', grip: '#111111' },
    },
  },
  {
    id: 'back-power',
    name: '後衛パワーモデル',
    description: 'ややトップヘビー・ダブルシャフト・大きめフェイスでストローク重視。',
    design: {
      ...DEFAULT_DESIGN,
      name: '後衛パワーモデル',
      materialId: 'carbon_titanium',
      shaftType: 'double',
      weightG: 245,
      balanceMm: 335,
      faceSizeSqIn: 100,
      frameThicknessMm: 26,
      stringPattern: '15x16',
      tensionLbs: 26,
      targetPosition: 'back',
      colors: { frame: '#0b7a4b', accent: '#f5b700', strings: '#fff8dc', grip: '#222222' },
    },
  },
  {
    id: 'comfort',
    name: '腕にやさしい快適モデル',
    description: 'ケブラー複合＋マルチフィラメントで振動を抑える。',
    design: {
      ...DEFAULT_DESIGN,
      name: '快適モデル',
      materialId: 'carbon_kevlar',
      shaftType: 'double',
      weightG: 235,
      balanceMm: 320,
      faceSizeSqIn: 98,
      frameThicknessMm: 23,
      stringMaterialId: 'nylon_multi',
      tensionLbs: 25,
      targetPosition: 'allround',
      colors: { frame: '#5b2c83', accent: '#9bd3ae', strings: '#f4f4f4', grip: '#333333' },
    },
  },
  {
    id: 'diy-aluminum',
    name: '自作入門アルミモデル',
    description: '材料費を抑え、曲げ加工だけで作れる構成。最初の一本に。',
    design: {
      ...DEFAULT_DESIGN,
      name: '自作入門モデル',
      materialId: 'aluminum',
      shaftType: 'single',
      weightG: 260,
      balanceMm: 325,
      faceSizeSqIn: 92,
      frameThicknessMm: 20,
      stringPattern: '16x17',
      tensionLbs: 24,
      targetPosition: 'allround',
      colors: { frame: '#8d99ae', accent: '#ef476f', strings: '#f4f4f4', grip: '#2b2d42' },
    },
  },
];
