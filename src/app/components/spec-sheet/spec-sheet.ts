import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { METRIC_KEYS, METRIC_LABELS, POSITION_LABELS } from '../../data/racket-catalog';
import {
  MetricKey,
  PerformanceProfile,
  PlayerPosition,
  RacketDesign,
} from '../../models/racket.model';

interface MetricRow {
  key: MetricKey;
  label: string;
  value: number;
}

interface PositionRow {
  id: PlayerPosition;
  label: string;
  value: number;
  isTarget: boolean;
  isRecommended: boolean;
}

@Component({
  selector: 'app-spec-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spec-sheet.html',
  styleUrl: './spec-sheet.scss',
})
export class SpecSheetComponent {
  readonly design = input.required<RacketDesign>();
  readonly profile = input.required<PerformanceProfile>();

  protected readonly metricRows = computed<MetricRow[]>(() =>
    METRIC_KEYS.map((key) => ({
      key,
      label: METRIC_LABELS[key],
      value: this.profile().scores[key],
    })),
  );

  protected readonly positionRows = computed<PositionRow[]>(() => {
    const p = this.profile();
    const target = this.design().targetPosition;
    return (Object.keys(POSITION_LABELS) as PlayerPosition[]).map((id) => ({
      id,
      label: POSITION_LABELS[id],
      value: p.positionMatch[id],
      isTarget: id === target,
      isRecommended: id === p.recommendedPosition,
    }));
  });

  protected readonly targetMatch = computed(
    () => this.profile().positionMatch[this.design().targetPosition],
  );

  protected readonly recommendedLabel = computed(
    () => POSITION_LABELS[this.profile().recommendedPosition],
  );

  protected readonly targetLabel = computed(() => POSITION_LABELS[this.design().targetPosition]);

  protected readonly balanceLabel = computed(() => {
    switch (this.profile().balanceType) {
      case 'top-light':
        return 'トップライト（操作性寄り）';
      case 'top-heavy':
        return 'トップヘビー（パワー寄り）';
      default:
        return 'イーブン';
    }
  });

  protected readonly summary = computed(() => {
    const p = this.profile();
    const s = p.scores;
    const strengths = METRIC_KEYS.filter((k) => s[k] >= 65).map((k) => METRIC_LABELS[k]);
    const weaknesses = METRIC_KEYS.filter((k) => s[k] <= 35).map((k) => METRIC_LABELS[k]);
    const parts: string[] = [];
    parts.push(`このラケットは${POSITION_LABELS[p.recommendedPosition]}向きの特性です。`);
    if (strengths.length) {
      parts.push(`強み: ${strengths.join('・')}。`);
    }
    if (weaknesses.length) {
      parts.push(`控えめな項目: ${weaknesses.join('・')}。`);
    }
    return parts.join(' ');
  });

  protected formatYen(value: number): string {
    return value.toLocaleString('ja-JP');
  }
}
