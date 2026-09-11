import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order, OrderItem, PaymentMethod, PaymentSplit, KitchenStatus } from '../../core/models/order.model';
import { Discount, calculateDiscountAmount } from '../../core/utils/discount.util';
import { Product, Category } from '../../core/models/product.model';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { SettingsService } from '../../core/services/settings.service';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TicketModalComponent } from '../../shared/organisms/ticket-modal/ticket-modal.component';
import { ProductGridComponent } from '../../shared/organisms/product-grid/product-grid.component';
import { CategoryTabsComponent } from '../../shared/organisms/category-tabs/category-tabs.component';
import { SearchBarComponent } from '../../shared/molecules/search-bar/search-bar.component';
import { DiscountEditorComponent } from '../../shared/molecules/discount-editor/discount-editor.component';
import { AuthService } from '../../core/services/auth.service';
import { hasPermission } from '../../core/utils/permissions';

@Component({
  selector: 'app-active-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    SpinnerComponent,
    AppCurrencyPipe,
    TicketModalComponent,
    ProductGridComponent,
    CategoryTabsComponent,
    SearchBarComponent,
    DiscountEditorComponent,
  ],
  template: `
    <div class="active-orders container-page">
      <h2>🕐 Órdenes activas</h2>
      <p class="active-orders__hint">Órdenes enviadas sin cobrar todavía (mesas, para llevar, etc.)</p>

      <div class="active-orders__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="active-orders__grid" *ngIf="!loading()">
        <app-card *ngFor="let order of orders()" class="active-orders__card" [class]="'active-orders__card--' + (order.kitchen_status || 'pending')">
          <div class="active-orders__header">
            <span class="active-orders__number">
              {{ order.table_number || 'Sin mesa' }} · #{{ order.order_number }}
            </span>
            <span class="active-orders__time">{{ order.created_at | date: 'shortTime' }}</span>
          </div>

          <ul class="active-orders__items">
            <li *ngFor="let item of order.items">
              <div class="active-orders__item-main">
                <span>{{ item.quantity }}× {{ item.product_name }}</span>
                <span>{{ item.subtotal | appCurrency }}</span>
                <button
                  *ngIf="canManage()"
                  class="active-orders__item-remove"
                  (click)="removeItem(order, item)"
                  aria-label="Quitar producto"
                  title="Quitar este producto"
                >
                  ✕
                </button>
              </div>
              <p class="active-orders__item-note" *ngIf="item.notes">📝 {{ item.notes }}</p>
            </li>
          </ul>

          <div class="active-orders__total" *ngIf="!order.discount_type">
            <span>Total</span>
            <span>{{ order.total | appCurrency }}</span>
          </div>
          <div class="active-orders__discount-summary" *ngIf="order.discount_type">
            <div class="active-orders__row-sm">
              <span>Subtotal</span>
              <span>{{ order.subtotal ?? order.total | appCurrency }}</span>
            </div>
            <div class="active-orders__row-sm active-orders__row-sm--discount">
              <span>Descuento<span *ngIf="order.discount_reason"> ({{ order.discount_reason }})</span></span>
              <span>-{{ (order.subtotal ?? order.total) - order.total | appCurrency }}</span>
            </div>
            <div class="active-orders__total">
              <span>Total</span>
              <span>{{ order.total | appCurrency }}</span>
            </div>
          </div>

          <!-- Estado de cocina: visible para todos, editable solo con permiso -->
          <div class="active-orders__kitchen-row">
            <button
              class="active-orders__kitchen-badge"
              [class]="'active-orders__kitchen-badge--' + (order.kitchen_status || 'pending')"
              [disabled]="!canMarkReady() || order.kitchen_status === 'ready'"
              (click)="advanceKitchenStatus(order)"
            >
              {{ kitchenStatusLabel(order.kitchen_status) }}
              <span *ngIf="canMarkReady() && order.kitchen_status !== 'ready'"> · toca para avanzar</span>
            </button>
            <button
              *ngIf="canMarkReady() && order.kitchen_status === 'ready'"
              class="active-orders__kitchen-reset"
              (click)="resetKitchenStatus(order)"
              aria-label="Reiniciar estado de la orden"
              title="Reiniciar estado (por error)"
            >
              ↺
            </button>
          </div>

          <ng-container *ngIf="canManage()">
            <app-button variant="outline" [full]="true" (clicked)="openAddItems(order)">➕ Agregar productos</app-button>
            <app-button [full]="true" (clicked)="openCharge(order)">💳 Cobrar</app-button>
            <app-button variant="danger" size="sm" [full]="true" (clicked)="cancel(order)">Cancelar orden</app-button>
          </ng-container>
        </app-card>

        <p class="active-orders__empty" *ngIf="!orders().length">No hay órdenes activas en este momento.</p>
      </div>
    </div>

    <!-- Modal: agregar más productos a la mesa -->
    <div class="add-items-modal__backdrop" *ngIf="addingToOrder()" (click)="closeAddItems()">
      <div class="add-items-modal" (click)="$event.stopPropagation()">
        <h3>➕ Agregar a {{ addingToOrder()?.table_number || 'Sin mesa' }} · #{{ addingToOrder()?.order_number }}</h3>

        <app-search-bar placeholder="Buscar producto..." [term]="search()" (termChange)="search.set($event)"></app-search-bar>
        <app-category-tabs
          [categories]="categories()"
          [selected]="selectedCategory()"
          (selectedChange)="selectedCategory.set($event)"
        ></app-category-tabs>

        <div class="add-items-modal__products">
          <app-product-grid [products]="filteredProducts()" (add)="addToPending($event)"></app-product-grid>
        </div>

        <div class="add-items-modal__pending" *ngIf="pendingItems().length">
          <div class="add-items-modal__pending-row" *ngFor="let item of pendingItems()">
            <span>{{ item.quantity }}× {{ item.product_name }}</span>
            <span>{{ item.subtotal | appCurrency }}</span>
          </div>
          <div class="add-items-modal__pending-total">
            <span>Total a agregar</span>
            <span>{{ pendingTotal() | appCurrency }}</span>
          </div>
        </div>

        <app-button
          [full]="true"
          size="lg"
          [loading]="savingItems()"
          [disabled]="!pendingItems().length"
          (clicked)="confirmAddItems()"
        >
          Agregar a la orden
        </app-button>
        <app-button variant="ghost" [full]="true" (clicked)="closeAddItems()">Cancelar</app-button>
      </div>
    </div>

    <!-- Modal de cobro con descuento, pago dividido y teléfono de lealtad -->
    <div class="charge-modal__backdrop" *ngIf="chargingOrder()" (click)="chargingOrder.set(null)">
      <div class="charge-modal" (click)="$event.stopPropagation()">
        <h3>💳 Cobrar {{ chargingOrder()?.table_number || 'Sin mesa' }} · #{{ chargingOrder()?.order_number }}</h3>

        <div class="charge-modal__total" *ngIf="!chargeDiscount()">
          <span>Total a cobrar</span>
          <span>{{ chargeFinalTotal() | appCurrency }}</span>
        </div>
        <div class="charge-modal__discount-summary" *ngIf="chargeDiscount()">
          <div class="charge-modal__row-sm">
            <span>Subtotal</span>
            <span>{{ chargeSubtotal() | appCurrency }}</span>
          </div>
          <div class="charge-modal__row-sm charge-modal__row-sm--discount">
            <span>Descuento</span>
            <span>-{{ chargeDiscountAmount() | appCurrency }}</span>
          </div>
          <div class="charge-modal__total">
            <span>Total a cobrar</span>
            <span>{{ chargeFinalTotal() | appCurrency }}</span>
          </div>
        </div>

        <app-discount-editor
          [subtotal]="chargeSubtotal()"
          [discount]="chargeDiscount()"
          (discountChange)="onChargeDiscountChange($event)"
        ></app-discount-editor>

        <div class="charge-modal__field">
          <label>📱 Teléfono del cliente (opcional, para acumular puntos)</label>
          <input type="text" [(ngModel)]="customerPhone" name="customerPhone" placeholder="Ej. 3001234567" />
        </div>

        <div class="charge-modal__split-toggle">
          <button class="charge-modal__split-btn" [class.charge-modal__split-btn--active]="!splitMode" (click)="setSplitMode(false)">
            Un solo método
          </button>
          <button class="charge-modal__split-btn" [class.charge-modal__split-btn--active]="splitMode" (click)="setSplitMode(true)">
            Varios métodos
          </button>
        </div>

        <div class="charge-modal__payment" *ngIf="!splitMode">
          <button
            *ngFor="let m of paymentMethods"
            class="charge-modal__payment-btn"
            [class.charge-modal__payment-btn--active]="singleMethod === m.value"
            (click)="singleMethod = m.value"
          >
            {{ m.icon }} {{ m.label }}
          </button>
        </div>

        <div class="charge-modal__splits" *ngIf="splitMode">
          <div class="charge-modal__split-row" *ngFor="let row of splitRows; let i = index">
            <select [(ngModel)]="row.method" [name]="'splitMethod' + i">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.icon }} {{ m.label }}</option>
            </select>
            <input type="number" min="0" step="0.01" [(ngModel)]="row.amount" [name]="'splitAmount' + i" placeholder="Monto" />
            <button class="charge-modal__split-remove" (click)="removeSplitRow(i)" *ngIf="splitRows.length > 1">✕</button>
          </div>
          <button class="charge-modal__split-add" (click)="addSplitRow()">➕ Agregar otro método</button>
          <div class="charge-modal__split-balance" [class.charge-modal__split-balance--error]="!splitBalanced()">
            <span>Asignado: {{ splitSum() | appCurrency }}</span>
            <span>Falta: {{ (chargeFinalTotal() - splitSum()) | appCurrency }}</span>
          </div>
        </div>

        <app-button
          [full]="true"
          size="lg"
          [loading]="chargingId() === chargingOrder()?.id"
          [disabled]="splitMode && !splitBalanced()"
          (clicked)="confirmCharge()"
        >
          Confirmar cobro
        </app-button>
        <app-button variant="ghost" [full]="true" (clicked)="chargingOrder.set(null)">Cancelar</app-button>
      </div>
    </div>

    <app-ticket-modal *ngIf="lastChargedOrder()" [order]="lastChargedOrder()!" (close)="lastChargedOrder.set(null)"></app-ticket-modal>
  `,
  styles: [`
    .active-orders h2 { margin-bottom: var(--space-1); }
    .active-orders__hint { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-5); }
    .active-orders__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .active-orders__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-4); }
    .active-orders__card { display: flex; flex-direction: column; gap: var(--space-3); }
    .active-orders__header { display: flex; justify-content: space-between; font-weight: 700; }
    .active-orders__time { color: var(--color-text-muted); font-weight: 400; font-size: var(--fs-sm); }
    .active-orders__items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .active-orders__item-main { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); font-size: var(--fs-sm); }
    .active-orders__item-main span:first-child { flex: 1; min-width: 0; }
    .active-orders__item-remove { border: none; background: transparent; color: var(--color-danger); cursor: pointer; font-size: 0.9rem; flex-shrink: 0; }
    .active-orders__item-note { font-size: var(--fs-xs); color: var(--color-warning); font-style: italic; margin: 0 0 0 var(--space-1); }
    .active-orders__total { display: flex; justify-content: space-between; font-weight: 700; font-size: var(--fs-lg); border-top: 1px dashed var(--color-border); padding-top: var(--space-2); }
    .active-orders__discount-summary { border-top: 1px dashed var(--color-border); padding-top: var(--space-2); }
    .active-orders__row-sm { display: flex; justify-content: space-between; font-size: var(--fs-sm); padding: 2px 0; }
    .active-orders__row-sm--discount { color: var(--color-success); font-weight: 600; }
    .active-orders__empty { color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: var(--space-8); }
    .active-orders__card--ready { border-color: var(--color-success); box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.15); }

    .active-orders__kitchen-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .active-orders__kitchen-badge {
      flex: 1;
      min-width: 0;
      border: none; border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      font-weight: 700; font-size: var(--fs-sm);
      cursor: pointer; text-align: center;
    }
    .active-orders__kitchen-badge:disabled { cursor: default; }
    .active-orders__kitchen-badge--pending { background: var(--color-surface-alt); color: var(--color-text-muted); }
    .active-orders__kitchen-badge--preparing { background: #FDECD9; color: var(--color-warning); }
    .active-orders__kitchen-badge--ready { background: #E3F2E5; color: var(--color-success); }
    .active-orders__kitchen-reset {
      flex-shrink: 0;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--fs-sm);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.15s ease;
    }
    .active-orders__kitchen-reset:hover { opacity: 1; }

    .add-items-modal__backdrop, .charge-modal__backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4);
    }
    .add-items-modal {
      background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-5);
      max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto;
      display: flex; flex-direction: column; gap: var(--space-3);
    }
    .add-items-modal h3 { margin-bottom: var(--space-1); }
    .add-items-modal__products { max-height: 320px; overflow-y: auto; padding: var(--space-1); }
    .add-items-modal__pending {
      background: var(--color-surface-alt); border-radius: var(--radius-md); padding: var(--space-3);
    }
    .add-items-modal__pending-row { display: flex; justify-content: space-between; font-size: var(--fs-sm); padding: 2px 0; }
    .add-items-modal__pending-total {
      display: flex; justify-content: space-between; font-weight: 700; border-top: 1px dashed var(--color-border);
      margin-top: var(--space-2); padding-top: var(--space-2);
    }

    .charge-modal { background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-5); max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .charge-modal h3 { margin-bottom: var(--space-3); }
    .charge-modal__total { display: flex; justify-content: space-between; font-weight: 700; font-size: var(--fs-lg); margin-bottom: var(--space-4); }
    .charge-modal__discount-summary { margin-bottom: var(--space-3); }
    .charge-modal__row-sm { display: flex; justify-content: space-between; font-size: var(--fs-sm); padding: 2px 0; }
    .charge-modal__row-sm--discount { color: var(--color-success); font-weight: 600; }
    .charge-modal__field { margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: 4px; }
    .charge-modal__field label { font-size: var(--fs-xs); color: var(--color-text-muted); font-weight: 600; }
    .charge-modal__field input { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-sm); }

    .charge-modal__split-toggle { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
    .charge-modal__split-btn { flex: 1; padding: var(--space-2); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
    .charge-modal__split-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .charge-modal__payment { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); margin-bottom: var(--space-4); }
    .charge-modal__payment-btn { padding: var(--space-2); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
    .charge-modal__payment-btn--active { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-text-inverse); }

    .charge-modal__splits { margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .charge-modal__split-row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto; gap: var(--space-2); align-items: center; }
    .charge-modal__split-row select, .charge-modal__split-row input { min-width: 0; width: 100%; box-sizing: border-box; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-sm); background: var(--color-surface); }
    .charge-modal__split-remove { border: none; background: transparent; color: var(--color-danger); cursor: pointer; font-size: 1rem; }
    .charge-modal__split-add { border: 1.5px dashed var(--color-border); background: transparent; border-radius: var(--radius-md); padding: var(--space-2); font-size: var(--fs-xs); font-weight: 600; color: var(--color-text-muted); cursor: pointer; }
    .charge-modal__split-balance { display: flex; justify-content: space-between; font-size: var(--fs-xs); font-weight: 600; color: var(--color-success); padding: var(--space-1) 0; }
    .charge-modal__split-balance--error { color: var(--color-danger); }
  `],
})
export class ActiveOrdersPage implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  chargingId = signal<string | null>(null);
  chargingOrder = signal<Order | null>(null);
  lastChargedOrder = signal<Order | null>(null);

  // Agregar productos a una mesa ya abierta
  addingToOrder = signal<Order | null>(null);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  search = signal('');
  selectedCategory = signal<string | null>(null);
  pendingItems = signal<OrderItem[]>([]);
  savingItems = signal(false);

  customerPhone = '';
  splitMode = false;
  singleMethod: PaymentMethod = 'cash';
  splitRows: PaymentSplit[] = [{ method: 'cash', amount: 0 }];
  private chargeDiscountValue: Discount | null = null;

  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'transfer', label: 'Transferencia', icon: '📲' },
  ];

  private unsubscribeRealtime: (() => void) | null = null;
  private reloadTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private loyaltyService: LoyaltyService,
    private settings: SettingsService,
    private auth: AuthService
  ) { }

  canManage(): boolean {
    return hasPermission(this.auth.profile()?.role, 'order:manage');
  }

  canMarkReady(): boolean {
    return hasPermission(this.auth.profile()?.role, 'order:mark-ready');
  }

  kitchenStatusLabel(status?: KitchenStatus): string {
    switch (status) {
      case 'preparing': return '🟡 En preparación';
      case 'ready': return '✅ Listo para servir';
      default: return '🔵 Pendiente';
    }
  }

  async advanceKitchenStatus(order: Order) {
    if (!order.id || !this.canMarkReady() || order.kitchen_status === 'ready') return;
    const next: KitchenStatus = order.kitchen_status === 'preparing' ? 'ready' : 'preparing';
    await this.orderService.updateKitchenStatus(order.id, next);
    await this.load();
  }

  async resetKitchenStatus(order: Order) {
    if (!order.id || !confirm('¿Reiniciar el estado de esta orden a "Pendiente"?')) return;
    await this.orderService.updateKitchenStatus(order.id, 'pending');
    await this.load();
  }

  async ngOnInit() {
    await this.load();
    const [products, categories] = await Promise.all([
      this.productService.getActiveProducts(),
      this.productService.getCategories(),
    ]);
    this.products.set(products);
    this.categories.set(categories);

    this.unsubscribeRealtime = this.orderService.subscribeToOrderChanges(() => this.scheduleReload());
  }

  ngOnDestroy() {
    this.unsubscribeRealtime?.();
    if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
  }

  private scheduleReload() {
    if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
    this.reloadTimeout = setTimeout(() => this.load(), 400);
  }

  async load() {
    this.loading.set(true);
    try {
      this.orders.set(await this.orderService.getOpenOrders());
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

  /** Quita un solo producto de una orden ya activa */
  async removeItem(order: Order, item: OrderItem) {
    if (!confirm(`¿Quitar "${item.product_name}" de esta orden?`)) return;
    try {
      await this.orderService.removeItemFromOrder(order, item);
      await this.load();
    } catch (e: any) {
      console.error('Error completo al quitar producto:', e);
      const detail = e?.message || e?.error_description || e?.details || JSON.stringify(e);
      alert('No se pudo quitar el producto:\n' + detail);
    }
  }

  openAddItems(order: Order) {
    this.addingToOrder.set(order);
    this.pendingItems.set([]);
    this.search.set('');
    this.selectedCategory.set(null);
  }

  closeAddItems() {
    this.addingToOrder.set(null);
    this.pendingItems.set([]);
  }

  addToPending(product: Product) {
    const existing = this.pendingItems().find((i) => i.product_id === product.id);
    if (existing) {
      this.pendingItems.update((items) =>
        items.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: i.unit_price * (i.quantity + 1) }
            : i
        )
      );
      return;
    }
    this.pendingItems.update((items) => [
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

  pendingTotal(): number {
    return this.pendingItems().reduce((acc, i) => acc + i.subtotal, 0);
  }

  async confirmAddItems() {
    const order = this.addingToOrder();
    if (!order || !this.pendingItems().length) return;
    this.savingItems.set(true);
    try {
      await this.orderService.addItemsToOrder(order, this.pendingItems());
      this.closeAddItems();
      await this.load();
    } finally {
      this.savingItems.set(false);
    }
  }

  openCharge(order: Order) {
    this.chargingOrder.set(order);
    this.customerPhone = '';
    this.splitMode = false;
    this.singleMethod = 'cash';
    this.chargeDiscountValue = order.discount_type
      ? { type: order.discount_type, value: order.discount_value ?? 0, reason: order.discount_reason ?? '' }
      : null;
    this.splitRows = [{ method: 'cash', amount: order.total }];
  }

  chargeSubtotal(): number {
    const order = this.chargingOrder();
    return order ? order.subtotal ?? order.total : 0;
  }

  chargeDiscount(): Discount | null {
    return this.chargeDiscountValue;
  }

  chargeDiscountAmount(): number {
    return calculateDiscountAmount(this.chargeSubtotal(), this.chargeDiscountValue);
  }

  chargeFinalTotal(): number {
    return Math.max(0, this.chargeSubtotal() - this.chargeDiscountAmount());
  }

  async onChargeDiscountChange(discount: Discount | null) {
    const order = this.chargingOrder();
    if (!order?.id) return;
    this.chargeDiscountValue = discount;
    try {
      await this.orderService.applyDiscountToOrder(order, discount);
      const newTotal = this.chargeFinalTotal();
      this.chargingOrder.set({ ...order, discount_type: discount?.type ?? null, discount_value: discount?.value ?? 0, discount_reason: discount?.reason, total: newTotal });
      if (!this.splitMode) this.splitRows[0].amount = newTotal;
    } catch (e) {
      console.error('No se pudo aplicar el descuento', e);
    }
  }

  setSplitMode(value: boolean) {
    this.splitMode = value;
    if (value && this.splitRows.length === 1) {
      this.splitRows = [{ method: 'cash', amount: this.chargeFinalTotal() }];
    }
  }

  addSplitRow() {
    const remaining = Math.max(0, this.chargeFinalTotal() - this.splitSum());
    this.splitRows.push({ method: 'card', amount: remaining });
  }

  removeSplitRow(index: number) {
    this.splitRows.splice(index, 1);
  }

  splitSum(): number {
    return this.splitRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  splitBalanced(): boolean {
    return Math.abs(this.splitSum() - this.chargeFinalTotal()) < 0.01 && this.splitRows.every((r) => r.amount > 0);
  }

  async confirmCharge() {
    const order = this.chargingOrder();
    if (!order?.id) return;
    if (this.splitMode && !this.splitBalanced()) return;

    this.chargingId.set(order.id);
    try {
      const payments: PaymentSplit[] = this.splitMode
        ? this.splitRows.map((r) => ({ method: r.method, amount: Number(r.amount) }))
        : [{ method: this.singleMethod, amount: this.chargeFinalTotal() }];

      const orderToCharge: Order = { ...order, total: this.chargeFinalTotal() };
      await this.orderService.markOrderPaid(orderToCharge, payments, this.customerPhone.trim() || undefined);

      if (this.customerPhone.trim()) {
        await this.loyaltyService.addPoints(this.customerPhone.trim(), orderToCharge.total, this.settings.loyaltyRate());
      }

      this.lastChargedOrder.set({
        ...orderToCharge,
        payments,
        payment_method: payments.length > 1 ? 'mixed' : payments[0].method,
        status: 'paid',
      });
      this.chargingOrder.set(null);
      await this.load();
    } finally {
      this.chargingId.set(null);
    }
  }

  async cancel(order: Order) {
    if (!order.id || !confirm(`¿Cancelar la orden #${order.order_number}?`)) return;
    await this.orderService.cancelOrder(order.id);
    await this.load();
  }
}