import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-bar">
      <span class="search-bar__icon">🔎</span>
      <input
        type="text"
        [placeholder]="placeholder"
        [(ngModel)]="term"
        (ngModelChange)="termChange.emit($event)"
      />
    </div>
  `,
  styles: [`
    .search-bar {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-4);
      width: 100%;
    }
    .search-bar__icon { font-size: var(--fs-md); }
    input {
      border: none; outline: none; background: transparent;
      width: 100%; font-size: var(--fs-md); color: var(--color-text);
    }
  `],
})
export class SearchBarComponent {
  @Input() placeholder = 'Buscar...';
  @Input() term = '';
  @Output() termChange = new EventEmitter<string>();
}
