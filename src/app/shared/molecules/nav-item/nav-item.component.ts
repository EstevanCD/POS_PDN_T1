import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a [routerLink]="route" routerLinkActive="nav-item--active" class="nav-item">
      <span class="nav-item__icon">{{ icon }}</span>
      <span class="nav-item__label">{{ label }}</span>
    </a>
  `,
  styles: [`
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--fs-sm);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .nav-item:hover { background: var(--color-surface-alt); }
    .nav-item--active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
    .nav-item__icon { font-size: 1.2rem; }

    @media (max-width: 768px) {
      .nav-item {
        flex-direction: column;
        gap: 2px;
        padding: var(--space-1) var(--space-1);
        font-size: 10px;
        text-align: center;
        flex: 1 1 0;
        min-width: 0;
      }
      .nav-item__label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
    }
  `],
})
export class NavItemComponent {
  @Input() route = '/';
  @Input() icon = '•';
  @Input() label = '';
}
