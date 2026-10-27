import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BuildGuideComponent } from './components/build-guide/build-guide';
import { DesignFormComponent } from './components/design-form/design-form';
import { PerformanceRadarComponent } from './components/performance-radar/performance-radar';
import { RacketPreviewComponent } from './components/racket-preview/racket-preview';
import { SavedDesignsComponent } from './components/saved-designs/saved-designs';
import { SpecSheetComponent } from './components/spec-sheet/spec-sheet';
import { RacketDesignStore } from './services/racket-design.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignFormComponent,
    RacketPreviewComponent,
    PerformanceRadarComponent,
    SpecSheetComponent,
    BuildGuideComponent,
    SavedDesignsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(RacketDesignStore);
  protected readonly design = this.store.design;
  protected readonly profile = this.store.profile;
}
