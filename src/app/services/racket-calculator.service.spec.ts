import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, DESIGN_PRESETS, METRIC_KEYS } from '../data/racket-catalog';
import { RacketDesign } from '../models/racket.model';
import {
  calculateProfile,
  classifyBalance,
  estimateSwingWeight,
  faceDimensions,
  normalize,
  pickRecommendedPosition,
} from './racket-calculator.service';

describe('normalize', () => {
  it('maps the range to 0..1 and clamps outside values', () => {
    expect(normalize(5, 0, 10)).toBe(0.5);
    expect(normalize(-3, 0, 10)).toBe(0);
    expect(normalize(42, 0, 10)).toBe(1);
  });

  it('returns 0 when min equals max', () => {
    expect(normalize(3, 3, 3)).toBe(0);
  });
});

describe('faceDimensions', () => {
  it('matches the requested area with an ellipse approximation', () => {
    const { widthMm, heightMm } = faceDimensions(100);
    const area = Math.PI * (widthMm / 2) * (heightMm / 2);
    expect(area / 645.16).toBeCloseTo(100, 5);
    expect(heightMm / widthMm).toBeCloseTo(1.3, 5);
  });
});

describe('estimateSwingWeight', () => {
  it('grows with mass and with a more head-heavy balance', () => {
    const base = estimateSwingWeight(230, 700, 320);
    expect(estimateSwingWeight(250, 700, 320)).toBeGreaterThan(base);
    expect(estimateSwingWeight(230, 700, 340)).toBeGreaterThan(base);
  });
});

describe('classifyBalance', () => {
  it('classifies relative to the typical 20mm head-light offset', () => {
    expect(classifyBalance(-50)).toBe('top-light');
    expect(classifyBalance(-20)).toBe('even');
    expect(classifyBalance(0)).toBe('top-heavy');
  });
});

describe('pickRecommendedPosition', () => {
  it('returns the position with the highest match', () => {
    expect(pickRecommendedPosition({ fore: 60, back: 80, allround: 70 })).toBe('back');
    expect(pickRecommendedPosition({ fore: 90, back: 80, allround: 70 })).toBe('fore');
  });
});

describe('calculateProfile', () => {
  it('keeps every score between 0 and 100', () => {
    for (const preset of DESIGN_PRESETS) {
      const profile = calculateProfile(preset.design);
      for (const key of METRIC_KEYS) {
        expect(profile.scores[key]).toBeGreaterThanOrEqual(0);
        expect(profile.scores[key]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('recommends the fore position for a light, head-light, single shaft racket', () => {
    const profile = calculateProfile(DESIGN_PRESETS[0].design);
    expect(profile.recommendedPosition).toBe('fore');
  });

  it('recommends the back position for a heavy, head-heavy, double shaft racket', () => {
    const profile = calculateProfile(DESIGN_PRESETS[1].design);
    expect(profile.recommendedPosition).toBe('back');
  });

  it('reports a regulation error when the frame is too long', () => {
    const design: RacketDesign = { ...DEFAULT_DESIGN, lengthMm: 705 };
    const profile = calculateProfile(design);
    expect(profile.issues.some((i) => i.level === 'error')).toBe(true);
  });

  it('has no error-level issues for the default design', () => {
    const profile = calculateProfile(DEFAULT_DESIGN);
    expect(profile.issues.filter((i) => i.level === 'error')).toHaveLength(0);
  });

  it('lower tension increases power and reduces control', () => {
    const loose = calculateProfile({ ...DEFAULT_DESIGN, tensionLbs: 22 });
    const tight = calculateProfile({ ...DEFAULT_DESIGN, tensionLbs: 34 });
    expect(loose.scores.power).toBeGreaterThan(tight.scores.power);
    expect(loose.scores.control).toBeLessThan(tight.scores.control);
  });

  it('sums the cost breakdown into the estimated total', () => {
    const profile = calculateProfile(DEFAULT_DESIGN);
    const sum = profile.costBreakdown.reduce((acc, item) => acc + item.yen, 0);
    expect(profile.estimatedCostYen).toBe(sum);
  });

  it('rates aluminium as easier to build than titanium composite', () => {
    const aluminium = calculateProfile({
      ...DEFAULT_DESIGN,
      materialId: 'aluminum',
      shaftType: 'single',
    });
    const titanium = calculateProfile({
      ...DEFAULT_DESIGN,
      materialId: 'carbon_titanium',
      shaftType: 'double',
    });
    expect(aluminium.buildDifficulty).toBeLessThan(titanium.buildDifficulty);
  });
});
