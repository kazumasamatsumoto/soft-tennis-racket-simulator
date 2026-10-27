import { Injectable } from '@angular/core';
import {
  DESIGN_LIMITS,
  FRAME_MATERIALS,
  REGULATION,
  STRING_MATERIALS,
  STRING_PATTERNS,
} from '../data/racket-catalog';
import {
  BalanceType,
  CostItem,
  DesignIssue,
  FrameMaterial,
  MetricScores,
  PerformanceProfile,
  PlayerPosition,
  PositionMatch,
  RacketDesign,
  StringMaterial,
  StringPatternOption,
} from '../models/racket.model';

/** フェイスの縦横比 (縦 / 横)。一般的なラケットは 1.25〜1.35 程度。 */
const FACE_ASPECT_RATIO = 1.3;
const SQ_INCH_TO_SQ_MM = 645.16;
/** スイングウェイト計測の慣例的な回転軸位置 (グリップエンドから 10cm)。 */
const SWING_PIVOT_CM = 10;
const SWING_WEIGHT_RANGE = { min: 150, max: 270 };
const BUILD_HOURS_BY_DIFFICULTY: Record<number, number> = { 1: 6, 2: 10, 3: 18, 4: 30, 5: 45 };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** value を [min, max] の範囲で 0〜1 に正規化する。 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function toScore(value01: number): number {
  return Math.round(clamp(value01, 0, 1) * 100);
}

function findMaterial(design: RacketDesign): FrameMaterial {
  return FRAME_MATERIALS.find((m) => m.id === design.materialId) ?? FRAME_MATERIALS[1];
}

function findStringMaterial(design: RacketDesign): StringMaterial {
  return STRING_MATERIALS.find((s) => s.id === design.stringMaterialId) ?? STRING_MATERIALS[0];
}

function findPattern(design: RacketDesign): StringPatternOption {
  return STRING_PATTERNS.find((p) => p.id === design.stringPattern) ?? STRING_PATTERNS[1];
}

/**
 * フェイス面積 (平方インチ) から楕円近似で縦横の寸法 (mm) を求める。
 * 面積 = π a b, 縦横比 r = a / b より a = sqrt(面積 · r / π)。
 */
export function faceDimensions(faceSizeSqIn: number): { widthMm: number; heightMm: number } {
  const areaMm2 = faceSizeSqIn * SQ_INCH_TO_SQ_MM;
  const a = Math.sqrt((areaMm2 * FACE_ASPECT_RATIO) / Math.PI);
  const b = a / FACE_ASPECT_RATIO;
  return { widthMm: 2 * b, heightMm: 2 * a };
}

/**
 * スイングウェイトの簡易モデル。
 * ラケットを一様な棒とみなし、重心 (バランスポイント) まわりの慣性モーメント
 * m·L²/12 に、平行軸の定理で軸までの距離の寄与 m·d² を加える。
 * 実測値とは差が出るため、設計同士の比較用の指標として扱う。
 */
export function estimateSwingWeight(weightG: number, lengthMm: number, balanceMm: number): number {
  const massKg = weightG / 1000;
  const lengthCm = lengthMm / 10;
  const distanceCm = balanceMm / 10 - SWING_PIVOT_CM;
  const inertiaAboutCenter = (massKg * lengthCm * lengthCm) / 12;
  const parallelAxis = massKg * distanceCm * distanceCm;
  return Math.round((inertiaAboutCenter + parallelAxis) * 10) / 10;
}

/**
 * 市販ラケットはグリップ側が重いため、バランスポイントは全長の中心より
 * 20mm ほどグリップ寄りが標準的。この慣例を基準に分類する。
 */
const TYPICAL_BALANCE_OFFSET_MM = -20;
const BALANCE_BAND_MM = 15;

export function classifyBalance(balanceOffsetMm: number): BalanceType {
  if (balanceOffsetMm < TYPICAL_BALANCE_OFFSET_MM - BALANCE_BAND_MM) {
    return 'top-light';
  }
  if (balanceOffsetMm > TYPICAL_BALANCE_OFFSET_MM + BALANCE_BAND_MM) {
    return 'top-heavy';
  }
  return 'even';
}

export function calculateProfile(design: RacketDesign): PerformanceProfile {
  const material = findMaterial(design);
  const stringMaterial = findStringMaterial(design);
  const pattern = findPattern(design);
  const limits = DESIGN_LIMITS;

  const swingWeight = estimateSwingWeight(design.weightG, design.lengthMm, design.balanceMm);
  const balanceOffsetMm = design.balanceMm - design.lengthMm / 2;
  const balanceType = classifyBalance(balanceOffsetMm);
  const face = faceDimensions(design.faceSizeSqIn);

  const massN = normalize(design.weightG, limits.weightG.min, limits.weightG.max);
  const balanceN = normalize(design.balanceMm, limits.balanceMm.min, limits.balanceMm.max);
  const faceN = normalize(design.faceSizeSqIn, limits.faceSizeSqIn.min, limits.faceSizeSqIn.max);
  const thickN = normalize(
    design.frameThicknessMm,
    limits.frameThicknessMm.min,
    limits.frameThicknessMm.max,
  );
  const tensionN = normalize(design.tensionLbs, limits.tensionLbs.min, limits.tensionLbs.max);
  const swN = normalize(swingWeight, SWING_WEIGHT_RANGE.min, SWING_WEIGHT_RANGE.max);
  const openness = pattern.openness;
  const doubleShaft = design.shaftType === 'double' ? 1 : 0;

  const power =
    0.2 * faceN +
    0.17 * (1 - tensionN) +
    0.18 * material.stiffness +
    0.12 * thickN +
    0.18 * swN +
    0.08 * doubleShaft +
    0.07 * stringMaterial.rebound;

  const control =
    0.22 * (1 - faceN) +
    0.2 * tensionN +
    0.18 * (1 - openness) +
    0.15 * (1 - balanceN) +
    0.1 * (1 - doubleShaft) +
    0.1 * (1 - stringMaterial.rebound) +
    0.05 * (1 - thickN);

  const maneuverability =
    0.45 * (1 - swN) +
    0.2 * (1 - massN) +
    0.15 * (1 - balanceN) +
    0.12 * (1 - doubleShaft) +
    0.08 * (1 - faceN);

  const stability =
    0.25 * massN +
    0.2 * thickN +
    0.2 * doubleShaft +
    0.15 * faceN +
    0.1 * swN +
    0.1 * material.stiffness;

  const comfort =
    0.35 * material.damping +
    0.15 * (1 - tensionN) +
    0.15 * stringMaterial.softness +
    0.15 * (1 - thickN) +
    0.1 * (1 - material.stiffness) +
    0.1 * massN;

  const spin =
    0.35 * openness +
    0.2 * (1 - swN) +
    0.15 * stringMaterial.spin +
    0.1 * faceN +
    0.2 * (1 - tensionN);

  const durability =
    0.4 * material.durability +
    0.25 * thickN +
    0.15 * stringMaterial.durability +
    0.1 * (1 - tensionN) +
    0.1 * (1 - openness);

  const scores: MetricScores = {
    power: toScore(power),
    control: toScore(control),
    maneuverability: toScore(maneuverability),
    stability: toScore(stability),
    comfort: toScore(comfort),
    spin: toScore(spin),
    durability: toScore(durability),
  };

  const positionMatch = calculatePositionMatch(scores);
  const recommendedPosition = pickRecommendedPosition(positionMatch);
  const costBreakdown = calculateCost(design, material, stringMaterial);
  const estimatedCostYen = costBreakdown.reduce((sum, item) => sum + item.yen, 0);
  const buildDifficulty = calculateBuildDifficulty(design, material);

  return {
    scores,
    swingWeight,
    balanceType,
    balanceOffsetMm: Math.round(balanceOffsetMm),
    faceWidthMm: Math.round(face.widthMm),
    faceHeightMm: Math.round(face.heightMm),
    positionMatch,
    recommendedPosition,
    estimatedCostYen,
    costBreakdown,
    buildDifficulty,
    buildHours: BUILD_HOURS_BY_DIFFICULTY[buildDifficulty] ?? 30,
    issues: collectIssues(design, face.widthMm),
  };
}

export function calculatePositionMatch(scores: MetricScores): PositionMatch {
  const fore =
    0.4 * scores.maneuverability +
    0.25 * scores.control +
    0.2 * scores.stability +
    0.15 * scores.power;
  const back =
    0.35 * scores.power + 0.25 * scores.stability + 0.2 * scores.spin + 0.2 * scores.control;
  const allround =
    0.25 * scores.power +
    0.25 * scores.control +
    0.2 * scores.maneuverability +
    0.15 * scores.stability +
    0.15 * scores.spin;
  return {
    fore: Math.round(fore),
    back: Math.round(back),
    allround: Math.round(allround),
  };
}

export function pickRecommendedPosition(match: PositionMatch): PlayerPosition {
  const entries = Object.entries(match) as [PlayerPosition, number][];
  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
}

function calculateCost(
  design: RacketDesign,
  material: FrameMaterial,
  stringMaterial: StringMaterial,
): CostItem[] {
  const items: CostItem[] = [
    {
      label: `フレーム素材（${material.name} ${design.weightG}g）`,
      yen: Math.round(design.weightG * material.costPerGram),
    },
    { label: '型・樹脂・消耗品', yen: material.toolingCostYen },
    { label: 'ストリング', yen: stringMaterial.priceYen },
    { label: 'グリップ（下巻き＋テープ）', yen: 900 },
    { label: 'グロメット・エンドキャップ', yen: 700 },
  ];
  if (design.shaftType === 'double') {
    items.push({ label: 'ダブルシャフト用追加成形', yen: 1500 });
  }
  return items;
}

function calculateBuildDifficulty(design: RacketDesign, material: FrameMaterial): number {
  let difficulty = material.buildDifficulty;
  if (design.shaftType === 'double') {
    difficulty += 1;
  }
  if (design.frameThicknessMm < 21) {
    difficulty += 1;
  }
  if (design.weightG < 210) {
    difficulty += 1;
  }
  return clamp(Math.round(difficulty), 1, 5);
}

function collectIssues(design: RacketDesign, faceWidthMm: number): DesignIssue[] {
  const issues: DesignIssue[] = [];
  if (design.lengthMm > REGULATION.maxLengthMm) {
    issues.push({
      level: 'error',
      message: `全長 ${design.lengthMm}mm は規定上限（${REGULATION.maxLengthMm}mm）を超えています。`,
    });
  }
  if (faceWidthMm > REGULATION.maxFaceWidthMm) {
    issues.push({
      level: 'error',
      message: `フェイス幅 ${Math.round(faceWidthMm)}mm は規定上限（${REGULATION.maxFaceWidthMm}mm）を超えています。`,
    });
  }
  if (
    design.tensionLbs < REGULATION.recommendedTensionLbs.min ||
    design.tensionLbs > REGULATION.recommendedTensionLbs.max
  ) {
    issues.push({
      level: 'warning',
      message: `テンション ${design.tensionLbs} ポンドは一般的な範囲（${REGULATION.recommendedTensionLbs.min}〜${REGULATION.recommendedTensionLbs.max} ポンド）の外です。`,
    });
  }
  if (
    design.weightG < REGULATION.recommendedWeightG.min ||
    design.weightG > REGULATION.recommendedWeightG.max
  ) {
    issues.push({
      level: 'warning',
      message: `重量 ${design.weightG}g は一般的な範囲（${REGULATION.recommendedWeightG.min}〜${REGULATION.recommendedWeightG.max}g）の外です。`,
    });
  }
  if (design.balanceMm > design.lengthMm - 100) {
    issues.push({
      level: 'warning',
      message: 'バランスポイントがフェイス側に寄りすぎています。実際の構造では成立しにくい値です。',
    });
  }
  if (design.frameThicknessMm < 20 && design.materialId === 'aluminum') {
    issues.push({
      level: 'warning',
      message: 'アルミ合金で 20mm 未満のフレーム厚は強度不足になりやすいです。',
    });
  }
  return issues;
}

@Injectable({ providedIn: 'root' })
export class RacketCalculatorService {
  calculate(design: RacketDesign): PerformanceProfile {
    return calculateProfile(design);
  }
}
