import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `<div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>`,
  styles: [`
    .spinner {
      border: 3px solid var(--color-surface-alt);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SpinnerComponent {
  @Input() size = 32;
}
