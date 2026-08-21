import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  template: `
    <button
      class="product-card"
      [class.product-card--inactive]="!product.is_active"
      [class.product-card--flash]="flashing()"
      (click)="onTap()"
    >
      <div class="product-card__image">
        <img *ngIf="product.image_url" [src]="product.image_url" [alt]="product.name" />
        <span *ngIf="!product.image_url" class="product-card__placeholder">☕</span>
        <span class="product-card__check" *ngIf="flashing()">✓</span>
      </div>
      <div class="product-card__body">
        <p class="product-card__name">{{ product.name }}</p>
        <p class="product-card__price">{{ product.price | appCurrency }}</p>
      </div>
    </button>
  `,
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();

  flashing = signal(false);

  onTap() {
    this.add.emit(this.product);

    // Confirmación visual inmediata: breve destello + check, sin depender del carrito
    this.flashing.set(true);
    if (navigator.vibrate) navigator.vibrate(15);
    setTimeout(() => this.flashing.set(false), 350);
  }
}