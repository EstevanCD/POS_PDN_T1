import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, Category } from '../../core/models/product.model';
import { Order, OrderItem, PaymentSplit } from '../../core/models/order.model';
import { Discount, calculateDiscountAmount } from '../../core/utils/discount.util';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { ProductGridComponent } from '../../shared/organisms/product-grid/product-grid.component';
import { CategoryTabsComponent } from '../../shared/organisms/category-tabs/category-tabs.component';
import { OrderCartComponent } from '../../shared/organisms/order-cart/order-cart.component';
import { SearchBarComponent } from '../../shared/molecules/search-bar/search-bar.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { TicketModalComponent } from '../../shared/organisms/ticket-modal/ticket-modal.component';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { SettingsService } from '../../core/services/settings.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductGridComponent,
    CategoryTabsComponent,
    OrderCartComponent,
    SearchBarComponent,
    SpinnerComponent,
    TicketModalComponent,
    AppCurrencyPipe,
  ],
  template: `
    <div class="order-page container-page">
      <div class="order-page__menu">
        <div class="order-page__toolbar">
          <app-search-bar placeholder="Buscar producto..." [term]="search()" (termChange)="search.set($event)"></app-search-bar>
        </div>
        <app-category-tabs
          [categories]="categories()"
          [selected]="selectedCategory()"
          (selectedChange)="selectedCategory.set($event)"
        ></app-category-tabs>

        <div class="order-page__loading" *ngIf="loading()">
          <app-spinner></app-spinner>
        </div>

        <app-product-grid *ngIf="!loading()" [products]="filteredProducts()" (add)="addToCart($event)"></app-product-grid>
      </div>

      <!-- Escritorio: carrito fijo lateral. Móvil/tablet: panel deslizable -->
      <div class="order-page__cart" [class.order-page__cart--open]="cartOpen()">
        <app-order-cart
          [items]="cartItems()"
          [total]="cartSubtotal()"
          [submitting]="submitting()"
          [sendingOrder]="sendingOrder()"
          (quantityChange)="onQuantityChange($event)"
          (remove)="removeFromCart($event)"
          (notesChange)="onNotesChange($event)"
          (checkout)="checkout($event)"
          (sendOrder)="sendOrder($event)"
        ></app-order-cart>
      </div>
    </div>

    <!-- Fondo oscuro al abrir el panel en móvil -->
    <div class="order-page__backdrop" *ngIf="cartOpen()" (click)="cartOpen.set(false)"></div>

    <!-- Botón flotante: solo visible en móvil/tablet cuando hay productos -->
    <button
      class="order-page__fab"
      *ngIf="cartItems().length && !cartOpen()"
      (click)="cartOpen.set(true)"
    >
      🛒 Ver orden · {{ cartItems().length }} · {{ cartSubtotal() | appCurrency }}
    </button>

    <app-ticket-modal *ngIf="lastPaidOrder()" [order]="lastPaidOrder()!" (close)="onCloseTicket()"></app-ticket-modal>
  `,
  styles: [`
    .order-page {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: var(--space-5);
      align-items: start;
    }
    .order-page__menu { min-width: 0; }
    .order-page__toolbar { margin-bottom: var(--space-3); }
    .order-page__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .order-page__cart {
      position: sticky;
      top: calc(var(--header-height) + var(--space-4));
      height: calc(100vh - var(--header-height) - var(--space-8));
    }

    .order-page__backdrop { display: none; }
    .order-page__fab { display: none; }

    @media (max-width: 1024px) {
      .order-page { grid-template-columns: 1fr; }

      .order-page__cart {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        height: 85vh;
        max-height: 85vh;
        background: var(--color-surface);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        box-shadow: var(--shadow-lg);
        z-index: 60;
        transform: translateY(100%);
        transition: transform 0.25s ease;
        top: auto;
      }
      .order-page__cart--open { transform: translateY(0); }

      .order-page__backdrop {
        display: block;
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 55;
      }

      .order-page__fab {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        position: fixed;
        left: var(--space-4); right: var(--space-4);
        bottom: var(--space-4);
        z-index: 50;
        background: var(--color-primary);
        color: var(--color-text-inverse);
        border: none;
        border-radius: var(--radius-full);
        padding: var(--space-4);
        font-weight: 700;
        font-size: var(--fs-md);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
      }
    }
  `],
})
export class OrderPage implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  cartItems = signal<OrderItem[]>([]);
  loading = signal(true);
  submitting = signal(false);
  lastPaidOrder = signal<Order | null>(null);
  sendingOrder = signal(false);
  search = signal('');
  selectedCategory = signal<string | null>(null);
  cartOpen = signal(false);

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private loyaltyService: LoyaltyService,
    private settings: SettingsService
  ) { }

  async ngOnInit() {
    try {
      const [products, categories] = await Promise.all([
        this.productService.getActiveProducts(),
        this.productService.getCategories(),
      ]);
      this.products.set(products);
      this.categories.set(categories);
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

  cartSubtotal(): number {
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
      {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
        subtotal: product.price,
      },
    ]);
  }

  onQuantityChange(event: { item: OrderItem; quantity: number }) {
    this.updateQuantity(event.item, event.quantity);
  }

  private updateQuantity(item: OrderItem, quantity: number) {
    this.cartItems.update((items) =>
      items.map((i) =>
        i.product_id === item.product_id ? { ...i, quantity, subtotal: i.unit_price * quantity } : i
      )
    );
  }

  removeFromCart(item: OrderItem) {
    this.cartItems.update((items) => items.filter((i) => i.product_id !== item.product_id));
  }

  onNotesChange(event: { item: OrderItem; notes: string }) {
    this.cartItems.update((items) =>
      items.map((i) => (i.product_id === event.item.product_id ? { ...i, notes: event.notes } : i))
    );
  }

  async checkout(payload: { payments: PaymentSplit[]; phone: string; table: string; discount: Discount | null }) {
    if (!this.cartItems().length) return;
    this.submitting.set(true);
    try {
      const subtotal = this.cartSubtotal();
      const discountAmount = calculateDiscountAmount(subtotal, payload.discount);
      const finalTotal = Math.max(0, subtotal - discountAmount);

      const order: Order = {
        status: 'paid',
        payments: payload.payments,
        customer_phone: payload.phone || undefined,
        table_number: payload.table,
        subtotal,
        discount_type: payload.discount?.type ?? null,
        discount_value: payload.discount?.value ?? 0,
        discount_reason: payload.discount?.reason ?? undefined,
        total: finalTotal,
        items: this.cartItems(),
        closed_at: new Date().toISOString(),
      };
      const saved = await this.orderService.createOrder(order);
      this.cartItems.set([]);
      this.lastPaidOrder.set(saved);
      if (payload.phone) {
        await this.loyaltyService.addPoints(payload.phone, order.total, this.settings.loyaltyRate());
      }
    } catch (e) {
      console.error('Error al procesar la orden', e);
    } finally {
      this.submitting.set(false);
    }
  }

  async sendOrder(payload: { table: string; discount: Discount | null }) {
    if (!this.cartItems().length) return;
    this.sendingOrder.set(true);
    try {
      const subtotal = this.cartSubtotal();
      const discountAmount = calculateDiscountAmount(subtotal, payload.discount);
      const finalTotal = Math.max(0, subtotal - discountAmount);

      const order: Order = {
        status: 'open',
        table_number: payload.table,
        subtotal,
        discount_type: payload.discount?.type ?? null,
        discount_value: payload.discount?.value ?? 0,
        discount_reason: payload.discount?.reason ?? undefined,
        total: finalTotal,
        items: this.cartItems(),
      };
      await this.orderService.createOrder(order);
      this.cartItems.set([]);
      this.cartOpen.set(false);
    } catch (e) {
      console.error('Error al enviar la orden', e);
    } finally {
      this.sendingOrder.set(false);
    }
  }

  onCloseTicket() {
    this.lastPaidOrder.set(null);
    this.cartOpen.set(false);
  }
}