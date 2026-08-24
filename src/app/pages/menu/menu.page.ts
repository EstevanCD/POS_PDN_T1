import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, Category } from '../../core/models/product.model';
import { InventoryItem } from '../../core/models/inventory.model';
import { ProductService } from '../../core/services/product.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { RecipeEditorComponent } from '../../shared/molecules/recipe-editor/recipe-editor.component';
import { AuthService } from '../../core/services/auth.service';
import { hasPermission } from '../../core/utils/permissions';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent, BadgeComponent, SpinnerComponent, AppCurrencyPipe, RecipeEditorComponent],
  template: `
    <div class="menu-page container-page">
      <div class="menu-page__header">
        <h2>📋 Gestión del menú</h2>
                <app-button *ngIf="canEdit()" (clicked)="toggleNewForm()">{{ showForm() && !editingProductId() ? 'Cerrar' : '➕ Nuevo producto' }}</app-button>
      </div>

      <app-card *ngIf="showForm()" class="menu-page__form-card">
        <h3>{{ editingProductId() ? '✏️ Editar producto' : 'Nuevo producto' }}</h3>
        <form (ngSubmit)="saveProduct()" class="menu-page__form">
          <div class="menu-page__grid">
            <label class="menu-page__field">
              <span>Nombre</span>
              <input type="text" [(ngModel)]="form.name" name="name" required />
            </label>
            <label class="menu-page__field">
              <span>Categoría</span>
              <select [(ngModel)]="form.category_id" name="category_id" required>
                <option value="" disabled>Selecciona...</option>
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.icon }} {{ c.name }}</option>
              </select>
            </label>
            <label class="menu-page__field">
              <span>Precio</span>
              <input type="number" step="0.01" min="0" [(ngModel)]="form.price" name="price" required />
            </label>
            <label class="menu-page__field">
              <span>URL de imagen (opcional)</span>
              <input type="text" [(ngModel)]="form.image_url" name="image_url" placeholder="https://..." />
            </label>
            <label class="menu-page__field menu-page__field--wide">
              <span>Descripción</span>
              <input type="text" [(ngModel)]="form.description" name="description" />
            </label>
          </div>
          <div class="menu-page__form-actions">
            <app-button type="submit" [loading]="saving()">
              {{ editingProductId() ? '💾 Guardar cambios' : '💾 Guardar producto' }}
            </app-button>
            <app-button *ngIf="editingProductId()" type="button" variant="ghost" (clicked)="cancelEdit()">Cancelar</app-button>
          </div>
        </form>
      </app-card>

      <app-card class="menu-page__cat-card">
        <div class="menu-page__cat-header">
          <h3>Categorías</h3>
          <div class="menu-page__cat-add" *ngIf="canEdit()">
            <input type="text" placeholder="Nueva categoría" [(ngModel)]="newCategoryName" name="newCategoryName" />
            <input type="text" placeholder="Emoji (opcional)" [(ngModel)]="newCategoryIcon" name="newCategoryIcon" style="max-width: 90px;" />
            <app-button size="sm" (clicked)="addCategory()">Agregar</app-button>
          </div>
        </div>
        <div class="menu-page__cat-list">
          <app-badge *ngFor="let c of categories()" tone="neutral">{{ c.icon }} {{ c.name }}</app-badge>
        </div>
      </app-card>

      <div class="menu-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="menu-page__products" *ngIf="!loading()">
        <app-card *ngFor="let p of products()" padding="sm" class="menu-page__product">
          <div class="menu-page__product-row">
            <div class="menu-page__product-info">
              <p class="menu-page__product-name">{{ p.name }}</p>
              <p class="menu-page__product-meta">{{ p.category_name }} · {{ p.price | appCurrency }}</p>
            </div>
            <div class="menu-page__product-actions">
              <app-badge [tone]="p.is_active ? 'success' : 'danger'">{{ p.is_active ? 'Activo' : 'Inactivo' }}</app-badge>
              <ng-container *ngIf="canEdit()">
                <app-button size="sm" variant="outline" (clicked)="startEdit(p)">✏️ Editar</app-button>
                <app-button size="sm" variant="outline" (clicked)="toggleRecipe(p)">🧪 Receta</app-button>
                <app-button size="sm" variant="outline" (clicked)="toggleActive(p)">
                  {{ p.is_active ? 'Desactivar' : 'Activar' }}
                </app-button>
                <app-button size="sm" variant="danger" (clicked)="remove(p)">🗑️</app-button>
              </ng-container>
            </div>
          </div>

          <app-recipe-editor
            *ngIf="editingRecipeId() === p.id"
            [productId]="p.id"
            [productName]="p.name"
            [inventoryItems]="inventoryItems()"
          ></app-recipe-editor>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .menu-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3); }
    .menu-page__form-card { margin-bottom: var(--space-4); }
    .menu-page__form-card h3 { margin-bottom: var(--space-3); }
    .menu-page__form-actions { display: flex; gap: var(--space-2); }
    .menu-page__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
    .menu-page__field { display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-muted); }
    .menu-page__field--wide { grid-column: 1 / -1; }
    .menu-page__field input, .menu-page__field select {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3); font-size: var(--fs-md); background: var(--color-surface); color: var(--color-text);
    }
    .menu-page__cat-card { margin-bottom: var(--space-5); }
    .menu-page__cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2); }
    .menu-page__cat-add { display: flex; gap: var(--space-2); }
    .menu-page__cat-add input {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3); font-size: var(--fs-sm);
    }
    .menu-page__cat-list { display: flex; gap: var(--space-2); flex-wrap: wrap; }

    .menu-page__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .menu-page__products { display: flex; flex-direction: column; gap: var(--space-3); }
    .menu-page__product-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .menu-page__product-name { font-weight: 700; }
    .menu-page__product-meta { font-size: var(--fs-sm); color: var(--color-text-muted); }
    .menu-page__product-actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; justify-content: flex-end; }

    @media (max-width: 560px) {
      .menu-page__grid { grid-template-columns: 1fr; }
      .menu-page__cat-add { flex-direction: column; width: 100%; }
    }
  `],
})
export class MenuPage implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingRecipeId = signal<string | null>(null);
  editingProductId = signal<string | null>(null);

  form: Partial<Product> = { name: '', category_id: '', price: 0, description: '', image_url: '' };
  newCategoryName = '';
  newCategoryIcon = '☕';

  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService,
    private auth: AuthService
  ) { }

  canEdit(): boolean {
    return hasPermission(this.auth.profile()?.role, 'menu:edit');
  }

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const [products, categories, inventoryItems] = await Promise.all([
        this.productService.getProducts(),
        this.productService.getCategories(),
        this.inventoryService.getItems(),
      ]);
      this.products.set(products);
      this.categories.set(categories);
      this.inventoryItems.set(inventoryItems);
    } finally {
      this.loading.set(false);
    }
  }

  toggleRecipe(p: Product) {
    this.editingRecipeId.set(this.editingRecipeId() === p.id ? null : p.id);
  }

  startEdit(p: Product) {
    this.editingProductId.set(p.id);
    this.form = {
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      description: p.description ?? '',
      image_url: p.image_url ?? '',
    };
    this.showForm.set(true);
    this.editingRecipeId.set(null);
  }

  cancelEdit() {
    this.editingProductId.set(null);
    this.form = { name: '', category_id: '', price: 0, description: '', image_url: '' };
    this.showForm.set(false);
  }

  toggleNewForm() {
    if (this.showForm() && !this.editingProductId()) {
      this.showForm.set(false);
      return;
    }
    this.editingProductId.set(null);
    this.form = { name: '', category_id: '', price: 0, description: '', image_url: '' };
    this.showForm.set(true);
  }

  async saveProduct() {
    if (!this.form.name || !this.form.category_id || !this.form.price) return;
    this.saving.set(true);
    try {
      const editingId = this.editingProductId();
      if (editingId) {
        await this.productService.updateProduct(editingId, this.form);
      } else {
        await this.productService.createProduct({ ...this.form, is_active: true });
      }
      this.form = { name: '', category_id: '', price: 0, description: '', image_url: '' };
      this.editingProductId.set(null);
      this.showForm.set(false);
      await this.loadAll();
    } finally {
      this.saving.set(false);
    }
  }

  async addCategory() {
    if (!this.newCategoryName) return;
    await this.productService.createCategory({ name: this.newCategoryName, icon: this.newCategoryIcon || '☕' });
    this.newCategoryName = '';
    this.newCategoryIcon = '☕';
    await this.loadAll();
  }

  async toggleActive(p: Product) {
    await this.productService.updateProduct(p.id, { is_active: !p.is_active });
    await this.loadAll();
  }

  async remove(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}" del menú?`)) return;
    await this.productService.deleteProduct(p.id);
    await this.loadAll();
  }
}
