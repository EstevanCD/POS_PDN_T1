import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, Category } from '../../core/models/product.model';
import { Order, OrderItem, PaymentMethod } from '../../core/models/order.model';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { ProductGridComponent } from '../../shared/organisms/product-grid/product-grid.component';
import { CategoryTabsComponent } from '../../shared/organisms/category-tabs/category-tabs.component';
import { SearchBarComponent } from '../../shared/molecules/search-bar/search-bar.component';
import { QuantitySelectorComponent } from '../../shared/molecules/quantity-selector/quantity-selector.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
    selector: 'app-feria-order-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ProductGridComponent,
        CategoryTabsComponent,
        SearchBarComponent,
        QuantitySelectorComponent,
        SpinnerComponent,
        ButtonComponent,
        AppCurrencyPipe,
    ],
    template: `
    <div class="feria-order container-page">
      <div class="feria-order__menu">
        <h2>🎪 Tomar orden — Café Ferias</h2>
        <div class="feria-order__toolbar">
          <app-search-bar placeholder="Buscar producto..." [term]="search()" (termChange)="search.set($event)"></app-search-bar>
        </div>
        <app-category-tabs
          [categories]="categories()"
          [selected]="selectedCategory()"
          (selectedChange)="selectedCategory.set($event)"
        ></app-category-tabs>

        <div class="feria-order__loading" *ngIf="loading()"><app-spinner></app-spinner></div>
        <app-product-grid *ngIf="!loading()" [products]="filteredProducts()" (add)="addToCart($event)"></app-product-grid>
        <p class="feria-order__empty" *ngIf="!loading() && !categories().length">
          No hay ninguna categoría marcada como "Café Ferias" todavía. Pide a un administrador que la configure en Menú.
        </p>
      </div>

      <div class="feria-order__cart" [class.feria-order__cart--open]="cartOpen()">
        <div class="cart-panel">
          <div class="cart-panel__header">
            <h3>🧾 Orden</h3>
            <span>{{ cartItems().length }} productos</span>
          </div>

          <div class="cart-panel__list">
            <div class="cart-panel__item" *ngFor="let item of cartItems()">
              <div class="cart-panel__item-info">
                <p>{{ item.product_name }}</p>
                <span>{{ item.unit_price | appCurrency }}</span>
              </div>
              <app-quantity-selector [value]="item.quantity" (valueChange)="updateQuantity(item, $event)"></app-quantity-selector>
              <button class="cart-panel__remove" (click)="removeFromCart(item)" aria-label="Quitar">✕</button>
            </div>
            <p class="cart-panel__empty" *ngIf="!cartItems().length">Toca un producto para agregarlo.</p>
          </div>

          <div class="cart-panel__footer" *ngIf="cartItems().length">
            <div class="cart-panel__total">
              <span>Total</span>
              <span>{{ cartTotal() | appCurrency }}</span>
            </div>

            <label class="cart-panel__note-label">📍 Nota (ej. Stand 1)</label>
            <input type="text" [(ngModel)]="note" name="note" placeholder="Stand 1, Feria del parque..." class="cart-panel__note-input" />

            <div class="cart-panel__payment">
              <button
                *ngFor="let m of paymentMethods"
                class="cart-panel__payment-btn"
                [class.cart-panel__payment-btn--active]="paymentMethod === m.value"
                (click)="paymentMethod = m.value"
              >
                {{ m.icon }} {{ m.label }}
              </button>
            </div>

            <app-button [full]="true" size="lg" [loading]="submitting()" (clicked)="checkout()">
              Cobrar {{ cartTotal() | appCurrency }}
            </app-button>
          </div>
        </div>
      </div>
    </div>

    <div class="feria-order__backdrop" *ngIf="cartOpen()" (click)="cartOpen.set(false)"></div>
    <button
      class="feria-order__fab"
      *ngIf="cartItems().length && !cartOpen()"
      (click)="cartOpen.set(true)"
    >
      🛒 Ver orden · {{ cartItems().length }} · {{ cartTotal() | appCurrency }}
    </button>
  `,
    styles: [`
    .feria-order {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: var(--space-5);
      align-items: start;
    }
    .feria-order__menu { min-width: 0; }
    .feria-order__menu h2 { margin-bottom: var(--space-3); }
    .feria-order__toolbar { margin-bottom: var(--space-3); }
    .feria-order__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .feria-order__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-6); }

    .feria-order__cart {
      position: sticky;
      top: calc(var(--header-height) + var(--space-4));
      height: calc(100vh - var(--header-height) - var(--space-8));
    }
    .cart-panel {
      display: flex; flex-direction: column; height: 100%;
      background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border);
      overflow: hidden;
    }
    .cart-panel__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--color-border); }
    .cart-panel__list { flex: 1; overflow-y: auto; padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); min-height: 100px; }
    .cart-panel__item { display: flex; align-items: center; gap: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px dashed var(--color-border); }
    .cart-panel__item-info { flex: 1; min-width: 0; }
    .cart-panel__item-info p { font-weight: 600; font-size: var(--fs-sm); }
    .cart-panel__item-info span { font-size: var(--fs-xs); color: var(--color-text-muted); }
    .cart-panel__remove { border: none; background: transparent; color: var(--color-danger); cursor: pointer; }
    .cart-panel__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-5) 0; font-size: var(--fs-sm); }

    .cart-panel__footer { padding: var(--space-4); border-top: 1px solid var(--color-border); background: var(--color-surface-alt); }
    .cart-panel__total { display: flex; justify-content: space-between; font-weight: 700; font-size: var(--fs-xl); margin-bottom: var(--space-3); }
    .cart-panel__note-label { display: block; font-size: var(--fs-xs); font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
    .cart-panel__note-input {
      width: 100%; box-sizing: border-box; border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm); margin-bottom: var(--space-3);
    }
    .cart-panel__payment { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); margin-bottom: var(--space-4); }
    .cart-panel__payment-btn { padding: var(--space-2); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
    .cart-panel__payment-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .feria-order__backdrop { display: none; }
    .feria-order__fab { display: none; }

    @media (max-width: 1024px) {
      .feria-order { grid-template-columns: 1fr; }
      .feria-order__cart {
        position: fixed; left: 0; right: 0; bottom: 0; height: 85vh; max-height: 85vh;
        background: var(--color-surface); border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        box-shadow: var(--shadow-lg); z-index: 60; transform: translateY(100%);
        transition: transform 0.25s ease; top: auto;
      }
      .feria-order__cart--open { transform: translateY(0); }
      .feria-order__backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 55; }
      .feria-order__fab {
        display: flex; align-items: center; justify-content: center; gap: var(--space-2);
        position: fixed; left: var(--space-4); right: var(--space-4); bottom: var(--space-4); z-index: 50;
        background: var(--color-primary); color: var(--color-text-inverse); border: none; border-radius: var(--radius-full);
        padding: var(--space-4); font-weight: 700; font-size: var(--fs-md); box-shadow: var(--shadow-lg); cursor: pointer;
      }
    }
  `],
})
export class FeriaOrderPage implements OnInit {
    products = signal<Product[]>([]);
    categories = signal<Category[]>([]);
    cartItems = signal<OrderItem[]>([]);
    loading = signal(true);
    submitting = signal(false);
    search = signal('');
    selectedCategory = signal<string | null>(null);
    cartOpen = signal(false);
    note = '';
    paymentMethod: PaymentMethod = 'cash';

    paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
        { value: 'cash', label: 'Efectivo', icon: '💵' },
        { value: 'card', label: 'Tarjeta', icon: '💳' },
        { value: 'transfer', label: 'Transf.', icon: '📲' },
    ];

    constructor(private productService: ProductService, private orderService: OrderService) { }

    async ngOnInit() {
        try {
            const feriaCategories = await this.productService.getFeriaCategories();
            const feriaCategoryIds = new Set(feriaCategories.map((c) => c.id));
            const allProducts = await this.productService.getActiveProducts();

            this.categories.set(feriaCategories);
            this.products.set(allProducts.filter((p) => feriaCategoryIds.has(p.category_id)));
        } finally {
            this.loading.set(false);
        }
    }

    filteredProducts(): Product[] {
        const term = this.search().toLowerCase().trim();
        return this.products().filter((p) => {
            const matchesCategory = !this.selectedCategory() || p.category_id === this.selectedCategory();
            const matchesTerm = !term || p.name.toLowerCase().includes(term);
            return matchesCategory && matchesTerm;
        });
    }

    cartTotal(): number {
        return this.cartItems().reduce((acc, i) => acc + i.subtotal, 0);
    }

    addToCart(product: Product) {
        const existing = this.cartItems().find((i) => i.product_id === product.id);
        if (existing) {
            this.updateQuantity(existing, existing.quantity + 1);
            return;
        }
        this.cartItems.update((items) => [
            ...items,
            { product_id: product.id, product_name: product.name, unit_price: product.price, quantity: 1, subtotal: product.price },
        ]);
    }

    updateQuantity(item: OrderItem, quantity: number) {
        this.cartItems.update((items) =>
            items.map((i) => (i.product_id === item.product_id ? { ...i, quantity, subtotal: i.unit_price * quantity } : i))
        );
    }

    removeFromCart(item: OrderItem) {
        this.cartItems.update((items) => items.filter((i) => i.product_id !== item.product_id));
    }

    async checkout() {
        if (!this.cartItems().length) return;
        this.submitting.set(true);
        try {
            const order: Order = {
                status: 'paid',
                channel: 'feria',
                payment_method: this.paymentMethod,
                payments: [{ method: this.paymentMethod, amount: this.cartTotal() }],
                table_number: this.note.trim() || undefined,
                total: this.cartTotal(),
                subtotal: this.cartTotal(),
                items: this.cartItems(),
                closed_at: new Date().toISOString(),
            };
            await this.orderService.createOrder(order);
            this.cartItems.set([]);
            this.note = '';
            this.cartOpen.set(false);
        } catch (e) {
            console.error('Error al cobrar la venta de feria', e);
            alert('No se pudo registrar la venta. Intenta de nuevo.');
        } finally {
            this.submitting.set(false);
        }
    }
}