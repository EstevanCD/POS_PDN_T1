import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { InputComponent } from '../../shared/atoms/input/input.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="reset-password">
      <div class="reset-password__bg"></div>
      <div class="reset-password__overlay"></div>

      <app-card class="reset-password__card">
        <div class="reset-password__brand">
          <div class="reset-password__logo">
            <img *ngIf="settings.logoUrl() as logo" [src]="logo" [alt]="settings.cafeName()" class="reset-password__logo-img" />
            <span *ngIf="!settings.logoUrl()">☕</span>
          </div>
          <h1>Nueva contraseña</h1>
          <p>Elige una contraseña nueva para tu cuenta.</p>
        </div>

        <ng-container *ngIf="!linkInvalid(); else invalidLink">
          <form (ngSubmit)="submit()" class="reset-password__form">
            <app-input
              label="Nueva contraseña"
              type="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
            ></app-input>
            <app-input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
            ></app-input>

            <p class="reset-password__error" *ngIf="error()">⚠️ {{ error() }}</p>
            <p class="reset-password__success" *ngIf="success()">✅ {{ success() }}</p>

            <app-button type="submit" [full]="true" size="lg" [loading]="loading()" [disabled]="!!success()">
              Guardar nueva contraseña
            </app-button>
          </form>
        </ng-container>

        <ng-template #invalidLink>
          <p class="reset-password__error">
            ⚠️ Este enlace no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <app-button [full]="true" (clicked)="goToLogin()">Volver a inicio de sesión</app-button>
        </ng-template>
      </app-card>
    </div>
  `,
  styles: [`
    .reset-password {
      position: relative;
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      overflow: hidden;
    }
    .reset-password__bg {
      position: absolute;
      inset: 0;
      background-image: url('/login-bg.jpg');
      background-size: cover;
      background-position: center;
      filter: blur(10px) brightness(0.85) saturate(1.1);
      transform: scale(1.12);
      z-index: 0;
    }
    .reset-password__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, rgba(74, 50, 37, 0.45) 0%, rgba(43, 33, 27, 0.6) 100%);
      z-index: 1;
    }
    .reset-password__card {
      position: relative;
      z-index: 2;
      display: block;
      width: 100%;
      max-width: 400px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    }
    .reset-password__brand { text-align: center; margin-bottom: var(--space-5); }
    .reset-password__logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      background: linear-gradient(160deg, var(--color-accent) 0%, var(--color-primary) 100%);
      font-size: 1.8rem;
      margin-bottom: var(--space-3);
      box-shadow: 0 6px 16px rgba(111, 78, 55, 0.35);
      overflow: hidden;
    }
    .reset-password__logo-img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
    .reset-password__brand h1 { font-size: var(--fs-xl); margin: 0 0 6px; letter-spacing: -0.01em; }
    .reset-password__brand p { color: var(--color-text-muted); font-size: var(--fs-sm); }
    .reset-password__form { display: flex; flex-direction: column; gap: var(--space-4); }
    .reset-password__error, .reset-password__success {
      font-size: var(--fs-sm); text-align: center;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-weight: 600;
    }
    .reset-password__error { color: var(--color-danger); background: rgba(198, 40, 40, 0.08); margin-bottom: var(--space-3); }
    .reset-password__success { color: var(--color-success); background: rgba(46, 125, 50, 0.08); }

    @media (max-width: 480px) {
      .reset-password { padding: var(--space-3); }
      .reset-password__card { max-width: 100%; }
    }
  `],
})
export class ResetPasswordPage implements OnInit {
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  linkInvalid = signal(false);

  constructor(private auth: AuthService, private router: Router, public settings: SettingsService) { }

  ngOnInit() {
    // Supabase intercambia el token del enlace del correo por una sesión
    // temporal automáticamente al cargar la página; solo verificamos que
    // en efecto haya quedado una sesión activa antes de permitir continuar.
    setTimeout(() => {
      if (!this.auth.isAuthenticated()) {
        this.linkInvalid.set(true);
      }
    }, 800);
  }

  async submit() {
    this.error.set(null);
    this.success.set(null);

    if (!this.password || this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    const { error } = await this.auth.updatePassword(this.password);
    this.loading.set(false);

    if (error) {
      this.error.set(error.message);
      return;
    }

    this.success.set('Contraseña actualizada. Ya puedes iniciar sesión con ella.');
    setTimeout(() => this.router.navigate(['/order']), 1800);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}