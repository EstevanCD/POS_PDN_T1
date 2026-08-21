import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, CurrencyCode } from '../../core/services/settings.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SpinnerComponent } from '../../shared/atoms/spinner/spinner.component';
import { UserService } from '../../core/services/user.service';
import { Profile, UserRole } from '../../core/models/profile.model';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent, SpinnerComponent],
  template: `
    <div class="settings-page container-page">
      <h2>⚙️ Personalización</h2>

      <app-card class="settings-page__card">
        <h3>Datos de la cafetería</h3>
        <label class="settings-page__field">
          <span>Nombre de la cafetería</span>
          <input type="text" [(ngModel)]="cafeName" name="cafeName" />
        </label>

        <label class="settings-page__field">
          <span>Moneda</span>
          <select [(ngModel)]="currency" name="currency">
            <option value="COP">COP — Peso colombiano</option>
            <option value="USD">USD — Dólar estadounidense</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </label>

        <label class="settings-page__field">
          <span>Puntos de lealtad por cada 1000 gastados</span>
          <input type="number" step="0.1" min="0" [(ngModel)]="loyaltyPointsPerThousand" name="loyaltyPointsPerThousand" />
        </label>

        <app-button [loading]="savingInfo()" (clicked)="saveInfo()">💾 Guardar cambios</app-button>
      </app-card>

      <app-card class="settings-page__card">
        <h3>Logo de la cafetería</h3>
        <div class="settings-page__logo-preview" *ngIf="settings.logoUrl() as logo">
          <img [src]="logo" alt="Logo actual" />
        </div>
        <p class="settings-page__hint" *ngIf="!settings.logoUrl()">Aún no has subido un logo.</p>

        <input type="file" accept="image/*" (change)="onFileSelected($event)" />
        <p class="settings-page__error" *ngIf="uploadError()">{{ uploadError() }}</p>
        <app-button [loading]="uploadingLogo()" (clicked)="uploadLogo()" [disabled]="!selectedFile">
          ⬆️ Subir logo
        </app-button>
      </app-card>
            <app-card class="settings-page__card settings-page__card--wide">
        <h3>👥 Usuarios del sistema</h3>
        <div class="settings-page__users-loading" *ngIf="loadingUsers()"><app-spinner [size]="20"></app-spinner></div>
        <div class="settings-page__users" *ngIf="!loadingUsers()">
          <div class="settings-page__user-row" *ngFor="let u of users()">
            <div>
              <p class="settings-page__user-name">{{ u.full_name || u.email }}</p>
              <p class="settings-page__user-email">{{ u.email }}</p>
            </div>
            <select [(ngModel)]="u.role" [name]="'role-' + u.id" (ngModelChange)="changeRole(u, $event)">
              <option value="admin">Administrador</option>
              <option value="cajero">Cajero</option>
              <option value="barista">Barista</option>
              <option value="mesero">Mesero</option>
            </select>
          </div>
          <p class="settings-page__hint" *ngIf="!users().length">No hay usuarios registrados aún.</p>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .settings-page h2 { margin-bottom: var(--space-4); }
    .settings-page__card { max-width: 480px; margin-bottom: var(--space-4); }
    .settings-page__card h3 { margin-bottom: var(--space-3); }
    .settings-page__field {
      display: flex; flex-direction: column; gap: 4px;
      font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-muted);
      margin-bottom: var(--space-4);
    }
    .settings-page__field input, .settings-page__field select {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-3); font-size: var(--fs-md); background: var(--color-surface); color: var(--color-text);
    }
    .settings-page__logo-preview {
      width: 120px; height: 120px; border-radius: var(--radius-md);
      overflow: hidden; margin-bottom: var(--space-3); border: 1px solid var(--color-border);
    }
    .settings-page__logo-preview img { width: 100%; height: 100%; object-fit: contain; background: var(--color-surface-alt); }
    .settings-page__hint { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-3); }
    .settings-page__error { color: var(--color-danger); font-size: var(--fs-sm); margin: var(--space-2) 0; }
        .settings-page__card--wide { max-width: 640px; }
    .settings-page__users-loading { display: flex; justify-content: center; padding: var(--space-4); }
    .settings-page__user-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0; border-bottom: 1px dashed var(--color-border);
    }
    .settings-page__user-name { font-weight: 600; font-size: var(--fs-sm); }
    .settings-page__user-email { font-size: var(--fs-xs); color: var(--color-text-muted); }
    .settings-page__user-row select {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: var(--space-2); font-size: var(--fs-sm);
    }
    input[type="file"] { display: block; margin-bottom: var(--space-3); }
  `],
})
export class SettingsPage implements OnInit {
  cafeName = '';
  currency: CurrencyCode = 'COP';
  loyaltyPointsPerThousand = 1;
  savingInfo = signal(false);
  uploadingLogo = signal(false);
  uploadError = signal<string | null>(null);
  selectedFile: File | null = null;

  users = signal<Profile[]>([]);
  loadingUsers = signal(true);

  constructor(public settings: SettingsService, private userService: UserService) { }

  async ngOnInit() {
    this.cafeName = this.settings.cafeName();
    this.currency = this.settings.currency();
    this.loyaltyPointsPerThousand = this.settings.loyaltyRate() * 1000;
    await this.loadUsers();
  }

  async loadUsers() {
    this.loadingUsers.set(true);
    try {
      this.users.set(await this.userService.getProfiles());
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async changeRole(user: Profile, role: UserRole) {
    await this.userService.updateRole(user.id, role);
  }

  async saveInfo() {
    this.savingInfo.set(true);
    try {
      await this.settings.update({
        cafe_name: this.cafeName,
        currency: this.currency,
        loyalty_rate: this.loyaltyPointsPerThousand / 1000,
      });
    } finally {
      this.savingInfo.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.uploadError.set(null);
  }

  async uploadLogo() {
    if (!this.selectedFile) return;
    this.uploadingLogo.set(true);
    this.uploadError.set(null);
    try {
      const url = await this.settings.uploadLogo(this.selectedFile);
      await this.settings.update({ logo_url: url });
      this.selectedFile = null;
    } catch (e: any) {
      this.uploadError.set('No se pudo subir el logo. Intenta de nuevo.');
      console.error(e);
    } finally {
      this.uploadingLogo.set(false);
    }
  }
}