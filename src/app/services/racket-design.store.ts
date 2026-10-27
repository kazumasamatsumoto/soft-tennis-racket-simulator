import { computed, Injectable, signal } from '@angular/core';
import {
  DEFAULT_DESIGN,
  DESIGN_LIMITS,
  DESIGN_PRESETS,
  FRAME_MATERIALS,
  GRIP_OPTIONS,
  POSITION_OPTIONS,
  SHAFT_OPTIONS,
  STRING_MATERIALS,
  STRING_PATTERNS,
} from '../data/racket-catalog';
import { NumericDesignKey, RacketDesign, SavedDesign } from '../models/racket.model';
import { calculateProfile, clamp } from './racket-calculator.service';

const STORAGE_KEY = 'soft-tennis-racket-simulator.saved-designs';
const SHARE_HASH_PREFIX = '#d=';

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function pickNumber(value: unknown, key: NumericDesignKey, fallback: number): number {
  const limit = DESIGN_LIMITS[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return clamp(value, limit.min, limit.max);
}

/**
 * 外部から渡された値（localStorage / JSON / URL）を安全な設計値に正規化する。
 * 不正な項目は既定値で補い、数値は入力範囲に丸める。
 */
export function sanitizeDesign(raw: unknown): RacketDesign {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const colors = (
    source['colors'] && typeof source['colors'] === 'object' ? source['colors'] : {}
  ) as Record<string, unknown>;
  const base = DEFAULT_DESIGN;
  return {
    name:
      typeof source['name'] === 'string' && source['name'].trim()
        ? source['name'].trim().slice(0, 40)
        : base.name,
    materialId: pickEnum(
      source['materialId'],
      FRAME_MATERIALS.map((m) => m.id),
      base.materialId,
    ),
    shaftType: pickEnum(
      source['shaftType'],
      SHAFT_OPTIONS.map((s) => s.id),
      base.shaftType,
    ),
    lengthMm: pickNumber(source['lengthMm'], 'lengthMm', base.lengthMm),
    weightG: pickNumber(source['weightG'], 'weightG', base.weightG),
    balanceMm: pickNumber(source['balanceMm'], 'balanceMm', base.balanceMm),
    faceSizeSqIn: pickNumber(source['faceSizeSqIn'], 'faceSizeSqIn', base.faceSizeSqIn),
    frameThicknessMm: pickNumber(
      source['frameThicknessMm'],
      'frameThicknessMm',
      base.frameThicknessMm,
    ),
    stringPattern: pickEnum(
      source['stringPattern'],
      STRING_PATTERNS.map((p) => p.id),
      base.stringPattern,
    ),
    stringMaterialId: pickEnum(
      source['stringMaterialId'],
      STRING_MATERIALS.map((s) => s.id),
      base.stringMaterialId,
    ),
    tensionLbs: pickNumber(source['tensionLbs'], 'tensionLbs', base.tensionLbs),
    gripSize: pickEnum(
      source['gripSize'],
      GRIP_OPTIONS.map((g) => g.id),
      base.gripSize,
    ),
    targetPosition: pickEnum(
      source['targetPosition'],
      POSITION_OPTIONS.map((p) => p.id),
      base.targetPosition,
    ),
    colors: {
      frame: isHexColor(colors['frame']) ? colors['frame'] : base.colors.frame,
      accent: isHexColor(colors['accent']) ? colors['accent'] : base.colors.accent,
      strings: isHexColor(colors['strings']) ? colors['strings'] : base.colors.strings,
      grip: isHexColor(colors['grip']) ? colors['grip'] : base.colors.grip,
    },
  };
}

/** UTF-8 文字列を URL に埋め込める Base64 に変換する。 */
export function encodeDesign(design: RacketDesign): string {
  const json = JSON.stringify(design);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeDesign(encoded: string): RacketDesign | null {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return sanitizeDesign(JSON.parse(json));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class RacketDesignStore {
  private readonly designSignal = signal<RacketDesign>(this.loadInitialDesign());
  private readonly savedSignal = signal<SavedDesign[]>(this.loadSaved());

  readonly design = this.designSignal.asReadonly();
  readonly saved = this.savedSignal.asReadonly();
  readonly profile = computed(() => calculateProfile(this.designSignal()));
  readonly presets = DESIGN_PRESETS;

  update(patch: Partial<RacketDesign>): void {
    this.designSignal.update((current) => sanitizeDesign({ ...current, ...patch }));
  }

  updateColor(key: keyof RacketDesign['colors'], value: string): void {
    this.designSignal.update((current) =>
      sanitizeDesign({ ...current, colors: { ...current.colors, [key]: value } }),
    );
  }

  replace(design: RacketDesign): void {
    this.designSignal.set(sanitizeDesign(design));
  }

  applyPreset(presetId: string): void {
    const preset = DESIGN_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      this.replace(preset.design);
    }
  }

  reset(): void {
    this.replace(DEFAULT_DESIGN);
  }

  save(): SavedDesign {
    const entry: SavedDesign = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      design: this.designSignal(),
    };
    this.savedSignal.update((list) => [entry, ...list].slice(0, 30));
    this.persistSaved();
    return entry;
  }

  load(id: string): void {
    const entry = this.savedSignal().find((s) => s.id === id);
    if (entry) {
      this.replace(entry.design);
    }
  }

  remove(id: string): void {
    this.savedSignal.update((list) => list.filter((s) => s.id !== id));
    this.persistSaved();
  }

  exportJson(): string {
    return JSON.stringify(this.designSignal(), null, 2);
  }

  /** JSON 文字列から設計を読み込む。成功時 true。 */
  importJson(text: string): boolean {
    try {
      const parsed: unknown = JSON.parse(text);
      this.replace(sanitizeDesign(parsed));
      return true;
    } catch {
      return false;
    }
  }

  shareUrl(baseUrl: string): string {
    const withoutHash = baseUrl.split('#')[0];
    return `${withoutHash}${SHARE_HASH_PREFIX}${encodeDesign(this.designSignal())}`;
  }

  private loadInitialDesign(): RacketDesign {
    if (typeof location !== 'undefined' && location.hash.startsWith(SHARE_HASH_PREFIX)) {
      const decoded = decodeDesign(location.hash.slice(SHARE_HASH_PREFIX.length));
      if (decoded) {
        return decoded;
      }
    }
    return DEFAULT_DESIGN;
  }

  private loadSaved(): SavedDesign[] {
    const storage = safeStorage();
    if (!storage) {
      return [];
    }
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          id: typeof item['id'] === 'string' ? item['id'] : `${Math.random()}`,
          savedAt:
            typeof item['savedAt'] === 'string' ? item['savedAt'] : new Date(0).toISOString(),
          design: sanitizeDesign(item['design']),
        }));
    } catch {
      return [];
    }
  }

  private persistSaved(): void {
    const storage = safeStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.savedSignal()));
    } catch {
      // ストレージが使えない環境では保存をあきらめる（表示には影響させない）
    }
  }
}
