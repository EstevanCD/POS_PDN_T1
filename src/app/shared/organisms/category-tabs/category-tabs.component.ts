import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../core/models/product.model';

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs">
      <button
        class="tabs__item"
        [class.tabs__item--active]="selected === null"
        (click)="select(null)"
      >
        Todo
      </button>
      <button
        *ngFor="let cat of categories"
        class="tabs__item"
        [class.tabs__item--active]="selected === cat.id"
        (click)="select(cat.id)"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>
  `,
  styles: [`
    .tabs {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-bottom: var(--space-2);
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x;
      max-width: 100%;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tabs__item {
      flex-shrink: 0;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-muted);
      font-weight: 600;
      font-size: var(--fs-sm);
      cursor: pointer;
      white-space: nowrap;
    }
    .tabs__item--active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
      border-color: var(--color-primary);
    }
  `],
})
export class CategoryTabsComponent {
  @Input() categories: Category[] = [];
  @Input() selected: string | null = null;
  @Output() selectedChange = new EventEmitter<string | null>();

  select(id: string | null) {
    this.selected = id;
    this.selectedChange.emit(id);
  }
}
