import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { METRIC_KEYS, METRIC_LABELS } from '../../data/racket-catalog';
import { MetricScores } from '../../models/racket.model';

interface RadarAxis {
  label: string;
  value: number;
  lineX: number;
  lineY: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 110;
const RINGS = [25, 50, 75, 100];

@Component({
  selector: 'app-performance-radar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="radar"
      [attr.viewBox]="'0 0 ' + size + ' ' + size"
      role="img"
      aria-label="性能レーダーチャート"
    >
      @for (ring of rings; track ring) {
        <polygon class="radar__ring" [attr.points]="ringPoints(ring)" />
      }
      @for (axis of axes(); track axis.label) {
        <line
          class="radar__axis"
          [attr.x1]="center"
          [attr.y1]="center"
          [attr.x2]="axis.lineX"
          [attr.y2]="axis.lineY"
        />
        <text
          class="radar__label"
          [attr.x]="axis.labelX"
          [attr.y]="axis.labelY"
          [attr.text-anchor]="axis.anchor"
        >
          {{ axis.label }}
          <tspan class="radar__value" [attr.x]="axis.labelX" [attr.dy]="14">{{ axis.value }}</tspan>
        </text>
      }
      <polygon class="radar__shape" [attr.points]="shapePoints()" />
      @for (axis of axes(); track axis.label) {
        <circle
          class="radar__dot"
          [attr.cx]="pointAt($index, axis.value).x"
          [attr.cy]="pointAt($index, axis.value).y"
          r="3.5"
        />
      }
    </svg>
  `,
  styles: `
    .radar {
      width: 100%;
      max-width: 360px;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .radar__ring {
      fill: none;
      stroke: var(--border);
      stroke-width: 1;
    }
    .radar__axis {
      stroke: var(--border);
      stroke-width: 1;
    }
    .radar__label {
      font-size: 11px;
      fill: var(--text);
      font-weight: 600;
    }
    .radar__value {
      fill: var(--muted);
      font-weight: 400;
    }
    .radar__shape {
      fill: var(--primary);
      fill-opacity: 0.22;
      stroke: var(--primary);
      stroke-width: 2;
      stroke-linejoin: round;
    }
    .radar__dot {
      fill: var(--primary);
    }
  `,
})
export class PerformanceRadarComponent {
  readonly scores = input.required<MetricScores>();

  protected readonly size = SIZE;
  protected readonly center = CENTER;
  protected readonly rings = RINGS;

  protected readonly axes = computed<RadarAxis[]>(() =>
    METRIC_KEYS.map((key, index) => {
      const outer = this.pointAt(index, 100);
      const labelPoint = this.pointAt(index, 128);
      const dx = labelPoint.x - CENTER;
      const anchor: RadarAxis['anchor'] = Math.abs(dx) < 10 ? 'middle' : dx > 0 ? 'start' : 'end';
      return {
        label: METRIC_LABELS[key],
        value: this.scores()[key],
        lineX: outer.x,
        lineY: outer.y,
        labelX: labelPoint.x,
        labelY: labelPoint.y - 2,
        anchor,
      };
    }),
  );

  protected readonly shapePoints = computed(() =>
    METRIC_KEYS.map((key, index) => {
      const p = this.pointAt(index, this.scores()[key]);
      return `${p.x},${p.y}`;
    }).join(' '),
  );

  protected ringPoints(ring: number): string {
    return METRIC_KEYS.map((_, index) => {
      const p = this.pointAt(index, ring);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  protected pointAt(index: number, value: number): { x: number; y: number } {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / METRIC_KEYS.length;
    const r = (RADIUS * value) / 100;
    return {
      x: Math.round((CENTER + r * Math.cos(angle)) * 10) / 10,
      y: Math.round((CENTER + r * Math.sin(angle)) * 10) / 10,
    };
  }
}
