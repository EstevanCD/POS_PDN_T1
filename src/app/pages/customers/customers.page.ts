import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../core/models/loyalty.model';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';

@Component({
    selector: 'app-customers-page',
    standalone: true,
    imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, SpinnerComponent],
    template: `
    <div class="customers-page container-page">
      <h2>🎁 Programa de lealtad</h2>
      <p class="customers-page__hint">Los clientes acumulan puntos automáticamente cuando dejan su teléfono al pagar en el POS.</p>

      <div class="customers-page__loading" *ngIf="loading()"><app-spinner></app-spinner></div>

      <div class="customers-page__list" *ngIf="!loading()">
        <app-card *ngFor="let c of customers()" padding="sm" class="customers-page__row">
          <div>
            <p class="customers-page__phone">{{ c.phone }}</p>
            <p class="customers-page__name" *ngIf="c.name">{{ c.name }}</p>
          </div>
          <div class="customers-page__points">
            <span class="customers-page__points-value">{{ c.points }} pts</span>
            <input type="number" min="0" [(ngModel)]="redeemAmount[c.id!]" placeholder="Canjear..." />
            <app-button size="sm" variant="outline" (clicked)="redeem(c)">Canjear</app-button>
          </div>
        </app-card>
        <p class="customers-page__empty" *ngIf="!customers().length">Aún no hay clientes registrados.</p>
      </div>
    </div>
  `,
    styles: [`
    .customers-page h2 { margin-bottom: 4px; }
    .customers-page__hint { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-5); }
    .customers-page__loading { display: flex; justify-content: center; padding: var(--space-8); }
    .customers-page__list { display: flex; flex-direction: column; gap: var(--space-3); }
    .customers-page__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); }
    .customers-page__phone { font-weight: 700; }
    .customers-page__name { font-size: var(--fs-sm); color: var(--color-text-muted); }
    .customers-page__points { display: flex; align-items: center; gap: var(--space-2); }
    .customers-page__points-value { font-weight: 700; color: var(--color-primary); }
    .customers-page__points input {
      width: 90px; border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm);
    }
    .customers-page__empty { color: var(--color-text-muted); text-align: center; padding: var(--space-8); }
  `],
})
export class CustomersPage implements OnInit {
    customers = signal<Customer[]>([]);
    loading = signal(true);
    redeemAmount: Record<string, number> = {};

    constructor(private loyaltyService: LoyaltyService) { }

    async ngOnInit() {
        await this.load();
    }

    async load() {
        this.loading.set(true);
        try {
            this.customers.set(await this.loyaltyService.getAllCustomers());
        } finally {
            this.loading.set(false);
        }
    }

    async redeem(c: Customer) {
        const amount = this.redeemAmount[c.id!];
        if (!amount || amount <= 0) return;
        try {
            await this.loyaltyService.redeemPoints(c.id!, c.points, amount);
            this.redeemAmount[c.id!] = 0;
            await this.load();
        } catch (e: any) {
            alert(e.message ?? 'No se pudo canjear');
        }
    }
}