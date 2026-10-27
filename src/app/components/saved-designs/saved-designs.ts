import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FRAME_MATERIALS, POSITION_LABELS } from '../../data/racket-catalog';
import { SavedDesign } from '../../models/racket.model';
import { RacketDesignStore } from '../../services/racket-design.store';

@Component({
  selector: 'app-saved-designs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-designs.html',
  styleUrl: './saved-designs.scss',
})
export class SavedDesignsComponent {
  protected readonly store = inject(RacketDesignStore);
  protected readonly saved = this.store.saved;
  protected readonly message = signal<string>('');

  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  protected save(): void {
    const entry = this.store.save();
    this.flash(`「${entry.design.name}」を保存しました。`);
  }

  protected load(entry: SavedDesign): void {
    this.store.load(entry.id);
    this.flash(`「${entry.design.name}」を読み込みました。`);
  }

  protected remove(entry: SavedDesign): void {
    this.store.remove(entry.id);
    this.flash(`「${entry.design.name}」を削除しました。`);
  }

  protected exportJson(): void {
    const json = this.store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.store.design().name || 'racket'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.flash('JSON を書き出しました。');
  }

  protected async importJson(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const text = await file.text();
    const ok = this.store.importJson(text);
    this.flash(
      ok ? `「${this.store.design().name}」を読み込みました。` : 'JSON の読み込みに失敗しました。',
    );
  }

  protected async copyShareUrl(): Promise<void> {
    const url = this.store.shareUrl(location.href);
    try {
      await navigator.clipboard.writeText(url);
      this.flash('共有 URL をクリップボードにコピーしました。');
    } catch {
      history.replaceState(null, '', url);
      this.flash('クリップボードが使えないため、アドレスバーの URL を更新しました。');
    }
  }

  protected describe(entry: SavedDesign): string {
    const d = entry.design;
    const material = FRAME_MATERIALS.find((m) => m.id === d.materialId)?.name ?? d.materialId;
    return `${material} · ${d.weightG}g · ${d.faceSizeSqIn}平方インチ · ${POSITION_LABELS[d.targetPosition]}`;
  }

  protected formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ja-JP');
  }

  private flash(text: string): void {
    this.message.set(text);
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    this.messageTimer = setTimeout(() => this.message.set(''), 3500);
  }
}
