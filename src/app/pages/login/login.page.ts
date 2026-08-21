import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { InputComponent } from '../../shared/atoms/input/input.component';
import { CardComponent } from '../../shared/atoms/card/card.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="login">
      <app-card class="login__card">
        <div class="login__brand">
          <span class="login__logo">☕</span>
          <h1>ZONA CR - POS</h1>
          <p>{{ mode() === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta de administrador' }}</p>
        </div>

        <form (ngSubmit)="submit()" class="login__form">
          <app-input
            *ngIf="mode() === 'signup'"
            label="Nombre completo"
            placeholder="Ej. María Pérez"
            [(ngModel)]="fullName"
            name="fullName"
          ></app-input>
          <app-input
            label="Correo electrónico"
            type="email"
            placeholder="tucorreo@cafeteria.com"
            [(ngModel)]="email"
            name="email"
          ></app-input>
          <app-input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            [(ngModel)]="password"
            name="password"
          ></app-input>

          <p class="login__error" *ngIf="error()">{{ error() }}</p>
          <p class="login__success" *ngIf="success()">{{ success() }}</p>

          <app-button type="submit" [full]="true" size="lg" [loading]="loading()">
            {{ mode() === 'signin' ? 'Entrar' : 'Registrarme' }}
          </app-button>
        </form>

        <button class="login__toggle" (click)="toggleMode()">
          {{ mode() === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
        </button>
      </app-card>
    </div>
  `,
  styles: [`
    .login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      padding: var(--space-4);
    }
    .login__card { width: 100%; max-width: 400px; }
    .login__brand { text-align: center; margin-bottom: var(--space-5); }
    .login__logo { font-size: 2.5rem; }
    .login__brand h1 { font-size: var(--fs-xl); margin: var(--space-2) 0 4px; }
    .login__brand p { color: var(--color-text-muted); font-size: var(--fs-sm); }
    .login__form { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-4); }
    .login__error { color: var(--color-danger); font-size: var(--fs-sm); text-align: center; }
    .login__success { color: var(--color-success); font-size: var(--fs-sm); text-align: center; }
    .login__toggle {
      display: block; width: 100%; text-align: center;
      border: none; background: transparent; color: var(--color-primary);
      font-weight: 600; font-size: var(--fs-sm); cursor: pointer; padding: var(--space-2);
    }
  `],
})
export class LoginPage {
  mode = signal<'signin' | 'signup'>('signin');
  email = '';
  password = '';
  fullName = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  toggleMode() {
    this.mode.set(this.mode() === 'signin' ? 'signup' : 'signin');
    this.error.set(null);
    this.success.set(null);
  }

  async submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    if (this.mode() === 'signin') {
      const { error } = await this.auth.signInWithPassword(this.email, this.password);
      this.loading.set(false);
      if (error) {
        this.error.set('Correo o contraseña incorrectos.');
        return;
      }
      this.router.navigate(['/order']);
    } else {
      const { error } = await this.auth.signUp(this.email, this.password, this.fullName);
      this.loading.set(false);
      if (error) {
        this.error.set(error.message);
        return;
      }
      this.success.set('Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.');
      this.mode.set('signin');
    }
  }
}
