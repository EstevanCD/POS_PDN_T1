import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, Category } from '../../core/models/product.model';
import { RecipeEntry } from '../../core/models/recipe.model';
import { ProductService } from '../../core/services/product.service';
import { RecipeService } from '../../core/services/recipe.service';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { SearchBarComponent } from '../../shared/molecules/search-bar/search-bar.component';
import { CategoryTabsComponent } from '../../shared/organisms/category-tabs/category-tabs.component';

@Component({
  selector: 'app-recipes-page',
  standalone: true,
  imports: [CommonModule, CardComponent, SpinnerComponent, SearchBarComponent, CategoryTabsComponent],
  template: `
    <div class="recipes-page container-page">
      <h2>🧪 Recetas del menú</h2>
      <p class="recipes-page__hint">Ingredientes y cantidades para preparar cada producto.</p>

      <div class="recipes-page__toolbar">
        <app-search-bar placeholder="Buscar producto..." [term]="search()" (termChange)="search.set($event)"></app-search-bar>
      </div>
      <app-category-tabs
        [categories]="categories()"
        [selected]="selectedCategory()"
        (selectedChange)="selectedCategory.set($event)"
      ></app-category-tabs>

      <div class="recipes-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="recipes-page__grid" *ngIf="!loading()">
        <app-card *ngFor="let p of filteredProducts()" padding="sm" class="recipes-page__card">
          <p class="recipes-page__name">{{ p.name }}</p>
          <p class="recipes-page__category">{{ p.category_name }}</p>
          <ul class="recipes-page__ingredients" *ngIf="recipesByProduct()[p.id]?.length">
            <li *ngFor="let entry of recipesByProduct()[p.id]">
              {{ entry.inventory_item_name }} — {{ entry.quantity_used }} {{ entry.unit }}
            </li>
          </ul>
          <p class="recipes-page__empty" *ngIf="!recipesByProduct()[p.id]?.length">Sin receta definida.</p>
        </app-card>

        <p class="recipes-page__none" *ngIf="!filteredProducts().length">No hay productos que coincidan.</p>
      </div>
    </div>
  `,
  styles: [`
    .recipes-page h2 { margin-bottom: 4px; }
    .recipes-page__hint { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-4); }
    .recipes-page__toolbar { margin-bottom: var(--space-3); }
    .recipes-page__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .recipes-page__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); margin-top: var(--space-4); }
    .recipes-page__card { display: flex; flex-direction: column; gap: 4px; }
    .recipes-page__name { font-weight: 700; }
    .recipes-page__category { font-size: var(--fs-xs); color: var(--color-text-muted); margin-bottom: var(--space-2); }
    .recipes-page__ingredients { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-sm); }
    .recipes-page__empty { font-size: var(--fs-sm); color: var(--color-text-muted); font-style: italic; }
    .recipes-page__none { grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: var(--space-8); }
  `],
})
export class RecipesPage implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  recipesByProduct = signal<Record<string, RecipeEntry[]>>({});
  loading = signal(true);
  search = signal('');
  selectedCategory = signal<string | null>(null);

  constructor(private productService: ProductService, private recipeService: RecipeService) { }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [products, categories, recipes] = await Promise.all([
        this.productService.getActiveProducts(),
        this.productService.getCategories(),
        this.recipeService.getAllRecipesGrouped(),
      ]);
      this.products.set(products);
      this.categories.set(categories);
      this.recipesByProduct.set(recipes);
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
}