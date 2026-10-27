import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, DESIGN_PRESETS } from '../data/racket-catalog';
import {
  decodeDesign,
  encodeDesign,
  RacketDesignStore,
  sanitizeDesign,
} from './racket-design.store';

describe('sanitizeDesign', () => {
  it('falls back to defaults for garbage input', () => {
    expect(sanitizeDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(sanitizeDesign('nonsense')).toEqual(DEFAULT_DESIGN);
  });

  it('clamps numbers into the allowed range and rejects unknown enums', () => {
    const result = sanitizeDesign({
      ...DEFAULT_DESIGN,
      weightG: 10_000,
      tensionLbs: -5,
      materialId: 'unobtainium',
      colors: { frame: 'red', accent: '#123456' },
    });
    expect(result.weightG).toBe(275);
    expect(result.tensionLbs).toBe(18);
    expect(result.materialId).toBe(DEFAULT_DESIGN.materialId);
    expect(result.colors.frame).toBe(DEFAULT_DESIGN.colors.frame);
    expect(result.colors.accent).toBe('#123456');
  });
});

describe('encodeDesign / decodeDesign', () => {
  it('round-trips a design including Japanese text', () => {
    const design = { ...DESIGN_PRESETS[1].design, name: '後衛テスト 🎾' };
    const encoded = encodeDesign(design);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeDesign(encoded)).toEqual(design);
  });

  it('returns null for broken input', () => {
    expect(decodeDesign('!!!not-base64!!!')).toBeNull();
  });
});

describe('RacketDesignStore', () => {
  let store: RacketDesignStore;

  beforeEach(() => {
    localStorage.clear();
    location.hash = '';
    TestBed.configureTestingModule({});
    store = TestBed.inject(RacketDesignStore);
  });

  it('starts from the default design and recomputes the profile on update', () => {
    expect(store.design()).toEqual(DEFAULT_DESIGN);
    const before = store.profile().scores.power;
    store.update({ tensionLbs: 20 });
    expect(store.profile().scores.power).toBeGreaterThan(before);
  });

  it('saves, lists, loads and removes designs through localStorage', () => {
    store.applyPreset('fore-volley');
    const entry = store.save();
    expect(store.saved()).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem('soft-tennis-racket-simulator.saved-designs')!),
    ).toHaveLength(1);

    store.reset();
    expect(store.design().name).toBe(DEFAULT_DESIGN.name);
    store.load(entry.id);
    expect(store.design().name).toBe('前衛ボレーモデル');

    store.remove(entry.id);
    expect(store.saved()).toHaveLength(0);
  });

  it('imports JSON and rejects invalid text', () => {
    expect(store.importJson('{ not json')).toBe(false);
    expect(store.importJson(JSON.stringify({ ...DEFAULT_DESIGN, name: '読み込みテスト' }))).toBe(
      true,
    );
    expect(store.design().name).toBe('読み込みテスト');
  });

  it('builds a share URL that decodes back to the current design', () => {
    store.update({ weightG: 250, name: '共有' });
    const url = store.shareUrl('https://example.com/app/#old');
    expect(url.startsWith('https://example.com/app/#d=')).toBe(true);
    expect(decodeDesign(url.split('#d=')[1])).toEqual(store.design());
  });
});
