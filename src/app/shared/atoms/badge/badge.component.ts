import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge--' + tone"><ng-content></ng-content></span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: var(--radius-full);
      font-size: var(--fs-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .badge--neutral { background: var(--color-surface-alt); color: var(--color-text-muted); }
    .badge--success { background: #E3F2E5; color: var(--color-success); }
    .badge--danger { background: #FBE4E4; color: var(--color-danger); }
    .badge--warning { background: #FDECD9; color: var(--color-warning); }
    .badge--info { background: #E1F1FA; color: var(--color-info); }
  `],
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
}
