import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { ProductCardComponent } from '../../molecules/product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="grid">
      <app-product-card
        *ngFor="let p of products"
        [product]="p"
        (add)="add.emit(p)"
      ></app-product-card>
      <p class="grid__empty" *ngIf="!products.length">No hay productos en esta categoría.</p>
    </div>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--space-3);
    }
    .grid__empty { color: var(--color-text-muted); grid-column: 1 / -1; padding: var(--space-5); text-align: center; }

    @media (max-width: 480px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class ProductGridComponent {
  @Input() products: Product[] = [];
  @Output() add = new EventEmitter<Product>();
}
