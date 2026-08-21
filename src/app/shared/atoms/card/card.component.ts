import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card" [class.card--pad-sm]="padding === 'sm'" [class.card--flat]="flat">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }
    .card--pad-sm { padding: var(--space-3); }
    .card--flat { box-shadow: none; }
  `],
})
export class CardComponent {
  @Input() padding: 'sm' | 'md' = 'md';
  @Input() flat = false;
}
