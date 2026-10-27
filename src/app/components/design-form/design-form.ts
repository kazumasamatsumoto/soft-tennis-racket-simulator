import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  DESIGN_LIMITS,
  FRAME_MATERIALS,
  GRIP_OPTIONS,
  POSITION_OPTIONS,
  SHAFT_OPTIONS,
  STRING_MATERIALS,
  STRING_PATTERNS,
} from '../../data/racket-catalog';
import {
  GripSize,
  MaterialId,
  PlayerPosition,
  RacketColors,
  ShaftType,
  StringMaterialId,
  StringPattern,
} from '../../models/racket.model';
import { RacketDesignStore } from '../../services/racket-design.store';
import { RangeFieldComponent } from '../range-field/range-field';

@Component({
  selector: 'app-design-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RangeFieldComponent],
  templateUrl: './design-form.html',
  styleUrl: './design-form.scss',
})
export class DesignFormComponent {
  protected readonly store = inject(RacketDesignStore);
  protected readonly design = this.store.design;
  protected readonly limits = DESIGN_LIMITS;
  protected readonly materials = FRAME_MATERIALS;
  protected readonly shafts = SHAFT_OPTIONS;
  protected readonly patterns = STRING_PATTERNS;
  protected readonly stringMaterials = STRING_MATERIALS;
  protected readonly grips = GRIP_OPTIONS;
  protected readonly positions = POSITION_OPTIONS;
  protected readonly presets = this.store.presets;

  protected readonly selectedMaterial = computed(
    () => this.materials.find((m) => m.id === this.design().materialId) ?? this.materials[0],
  );
  protected readonly selectedPattern = computed(
    () => this.patterns.find((p) => p.id === this.design().stringPattern) ?? this.patterns[0],
  );
  protected readonly selectedStringMaterial = computed(
    () =>
      this.stringMaterials.find((s) => s.id === this.design().stringMaterialId) ??
      this.stringMaterials[0],
  );
  protected readonly selectedGrip = computed(
    () => this.grips.find((g) => g.id === this.design().gripSize) ?? this.grips[0],
  );
  protected readonly selectedShaft = computed(
    () => this.shafts.find((s) => s.id === this.design().shaftType) ?? this.shafts[0],
  );

  protected readonly colorFields: { key: keyof RacketColors; label: string }[] = [
    { key: 'frame', label: 'フレーム' },
    { key: 'accent', label: 'アクセント' },
    { key: 'strings', label: 'ストリング' },
    { key: 'grip', label: 'グリップ' },
  ];

  protected onName(event: Event): void {
    this.store.update({ name: (event.target as HTMLInputElement).value });
  }

  protected onMaterial(event: Event): void {
    this.store.update({ materialId: (event.target as HTMLSelectElement).value as MaterialId });
  }

  protected onShaft(shaftType: ShaftType): void {
    this.store.update({ shaftType });
  }

  protected onPattern(event: Event): void {
    this.store.update({
      stringPattern: (event.target as HTMLSelectElement).value as StringPattern,
    });
  }

  protected onStringMaterial(event: Event): void {
    this.store.update({
      stringMaterialId: (event.target as HTMLSelectElement).value as StringMaterialId,
    });
  }

  protected onGrip(event: Event): void {
    this.store.update({ gripSize: (event.target as HTMLSelectElement).value as GripSize });
  }

  protected onPosition(targetPosition: PlayerPosition): void {
    this.store.update({ targetPosition });
  }

  protected onColor(key: keyof RacketColors, event: Event): void {
    this.store.updateColor(key, (event.target as HTMLInputElement).value);
  }

  protected onPreset(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.store.applyPreset(select.value);
      select.value = '';
    }
  }
}
