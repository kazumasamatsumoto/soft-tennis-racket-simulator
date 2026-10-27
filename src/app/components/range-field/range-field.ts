import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

let nextId = 0;

/** スライダーと数値入力を組み合わせた数値フィールド。 */
@Component({
  selector: 'app-range-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="range-field">
      <div class="range-field__head">
        <label class="range-field__label" [for]="id">{{ label() }}</label>
        <span class="range-field__value">
          <input
            class="range-field__number"
            type="number"
            [attr.aria-label]="label() + '（数値入力）'"
            [min]="min()"
            [max]="max()"
            [step]="step()"
            [value]="value()"
            (change)="onInput($event)"
          />
          <span class="range-field__unit">{{ unit() }}</span>
        </span>
      </div>
      <input
        class="range-field__slider"
        type="range"
        [id]="id"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (hint()) {
        <small class="range-field__hint">{{ hint() }}</small>
      }
    </div>
  `,
  styles: `
    .range-field {
      display: grid;
      gap: 0.3rem;
    }
    .range-field__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .range-field__label {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .range-field__value {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      font-variant-numeric: tabular-nums;
    }
    .range-field__number {
      width: 5rem;
      text-align: right;
      padding: 0.2rem 0.4rem;
      border: 1px solid var(--border);
      border-radius: 0.4rem;
      background: var(--surface);
      color: inherit;
      font: inherit;
    }
    .range-field__unit {
      font-size: 0.8rem;
      color: var(--muted);
    }
    .range-field__slider {
      width: 100%;
      accent-color: var(--primary);
    }
    .range-field__hint {
      color: var(--muted);
      font-size: 0.75rem;
    }
  `,
})
export class RangeFieldComponent {
  readonly label = input.required<string>();
  readonly unit = input('');
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly value = input.required<number>();
  readonly hint = input('');
  readonly valueChange = output<number>();

  protected readonly id = `range-field-${nextId++}`;

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      this.valueChange.emit(parsed);
    }
  }
}
