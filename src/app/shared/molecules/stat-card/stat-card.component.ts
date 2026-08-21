import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../atoms/card/card.component';

export type StatTone = 'primary' | 'success' | 'danger' | 'info';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <app-card padding="sm" class="stat" [class]="'stat--' + tone">
      <div class="stat__row">
        <span class="stat__icon">{{ icon }}</span>
        <div>
          <p class="stat__label">{{ label }}</p>
          <p class="stat__value">{{ value }}</p>
          <p class="stat__hint" *ngIf="hint">{{ hint }}</p>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    .stat { height: 100%; }
    .stat__row { display: flex; align-items: center; gap: var(--space-3); }
    .stat__icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; background: var(--color-surface-alt);
      flex-shrink: 0;
    }
    .stat--success .stat__icon { background: #E3F2E5; }
    .stat--danger .stat__icon { background: #FBE4E4; }
    .stat--info .stat__icon { background: #E1F1FA; }
    .stat__label { font-size: var(--fs-sm); color: var(--color-text-muted); margin-bottom: 2px; }
    .stat__value { font-size: var(--fs-xl); font-weight: 700; font-family: var(--font-heading); }
    .stat__hint { font-size: var(--fs-xs); color: var(--color-text-muted); margin-top: 2px; }
  `],
})
export class StatCardComponent {
  @Input() icon = '📊';
  @Input() label = '';
  @Input() value: string | null = '';
  @Input() hint?: string;
  @Input() tone: StatTone = 'primary';
}
