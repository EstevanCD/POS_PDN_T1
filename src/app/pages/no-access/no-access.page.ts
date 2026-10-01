import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-no-access-page',
    standalone: true,
    imports: [CommonModule, CardComponent, ButtonComponent],
    template: `
    <div class="no-access container-page">
      <app-card class="no-access__card">
        <p class="no-access__icon">🔒</p>
        <h2>Sin acceso configurado</h2>
        <p>Tu cuenta no tiene ninguna página asignada todavía. Pide a un administrador que revise tu rol en Configuración.</p>
        <app-button (clicked)="logout()">Cerrar sesión</app-button>
      </app-card>
    </div>
  `,
    styles: [`
    .no-access { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
    .no-access__card { max-width: 400px; text-align: center; }
    .no-access__icon { font-size: 2.5rem; margin-bottom: var(--space-3); }
    .no-access__card h2 { margin-bottom: var(--space-2); }
    .no-access__card p { color: var(--color-text-muted); margin-bottom: var(--space-4); }
  `],
})
export class NoAccessPage {
    constructor(private auth: AuthService) { }
    logout() {
        this.auth.signOut();
    }
}