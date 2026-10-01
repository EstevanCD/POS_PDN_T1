import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { InputComponent } from '../../shared/atoms/input/input.component';
import { CardComponent } from '../../shared/atoms/card/card.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="login">
      <div class="login__bg"></div>
      <div class="login__overlay"></div>

      <app-card class="login__card">
        <div class="login__brand">
          <div class="login__logo">
    <img
    *ngIf="settings.logoUrl() as logo"
    [src]="logo"
    [alt]="settings.cafeName()"
    class="login__logo-img"
  />
  <span *ngIf="!settings.logoUrl()">☕</span>
</div>
          <h1>{{ settings.cafeName() }} - POS</h1>
          <p *ngIf="mode() === 'signin'">Inicia sesión para continuar</p>
          <p *ngIf="mode() === 'signup'">Crea tu cuenta de administrador</p>
          <p *ngIf="mode() === 'reset'">Te enviaremos un enlace para restablecerla</p>
        </div>

        <form *ngIf="mode() !== 'reset'" (ngSubmit)="submit()" class="login__form">
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
          <p class="login__error" *ngIf="error()">⚠️ {{ error() }}</p>
          <p class="login__success" *ngIf="success()">✅ {{ success() }}</p>
          <app-button type="submit" [full]="true" size="lg" [loading]="loading()">
            {{ mode() === 'signin' ? 'Entrar' : 'Registrarme' }}
          </app-button>
        </form>

        <form *ngIf="mode() === 'reset'" (ngSubmit)="submitReset()" class="login__form">
          <app-input
            label="Correo electrónico"
            type="email"
            placeholder="tucorreo@cafeteria.com"
            [(ngModel)]="email"
            name="resetEmail"
          ></app-input>
          <p class="login__error" *ngIf="error()">⚠️ {{ error() }}</p>
          <p class="login__success" *ngIf="success()">✅ {{ success() }}</p>
          <app-button type="submit" [full]="true" size="lg" [loading]="loading()">
            Enviar enlace de recuperación
          </app-button>
        </form>

        <button class="login__toggle" *ngIf="mode() === 'signin'" (click)="setMode('reset')">
          ¿Olvidaste tu contraseña?
        </button>
        <button class="login__toggle" (click)="toggleMode()">
          {{ mode() === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
        </button>
      </app-card>
    </div>
  `,
  styles: [`
    .login {
      position: relative;
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      overflow: hidden;
    }

    /* Capa de fondo: imagen local difuminada y agrandada para que el blur no deje bordes vacíos */
    .login__bg {
      position: absolute;
      inset: 0;
      background-image: url('/login-bg.jpg');
      background-size: cover;
      background-position: center;
      filter: blur(10px) brightness(0.85) saturate(1.1);
      transform: scale(1.12);
      z-index: 0;
    }

    /* Capa de degradado en tonos de marca, para reforzar identidad y legibilidad */
    .login__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, rgba(74, 50, 37, 0.45) 0%, rgba(43, 33, 27, 0.6) 100%);
      z-index: 1;
    }

    /* Tarjeta flotante estilo "vidrio esmerilado" */
    .login__card {
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
      animation: login-card-in 0.4s ease;
    }

    @keyframes login-card-in {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login__brand { text-align: center; margin-bottom: var(--space-5); }
.login__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    160deg,
    var(--color-accent) 0%,
    var(--color-primary) 100%
  );
  font-size: 1.8rem;
  margin-bottom: var(--space-3);
  box-shadow: 0 6px 16px rgba(111, 78, 55, 0.35);
  overflow: hidden;
}

.login__logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
}
    .login__brand h1 {
      font-size: var(--fs-xl);
      margin: 0 0 6px;
      letter-spacing: -0.01em;
    }
    .login__brand p { color: var(--color-text-muted); font-size: var(--fs-sm); }

    .login__form { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-4); }

    .login__error, .login__success {
      font-size: var(--fs-sm);
      text-align: center;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-weight: 600;
    }
    .login__error { color: var(--color-danger); background: rgba(198, 40, 40, 0.08); }
    .login__success { color: var(--color-success); background: rgba(46, 125, 50, 0.08); }

    .login__toggle {
      display: block; width: 100%; text-align: center;
      border: none; background: transparent; color: var(--color-primary);
      font-weight: 600; font-size: var(--fs-sm); cursor: pointer; padding: var(--space-2);
      transition: opacity 0.15s ease;
    }
    .login__toggle:hover { opacity: 0.7; }

    @media (max-width: 480px) {
      .login { padding: var(--space-3); }
      .login__card { max-width: 100%; }
    }
  `],
})
export class LoginPage {
  mode = signal<'signin' | 'signup' | 'reset'>('signin');
  email = '';
  password = '';
  fullName = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  constructor(private auth: AuthService, private router: Router, public settings: SettingsService) { }

  setMode(mode: 'signin' | 'signup' | 'reset') {
    this.mode.set(mode);
    this.error.set(null);
    this.success.set(null);
  }

  toggleMode() {
    this.mode.set(this.mode() === 'signup' ? 'signin' : 'signup');
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

  async submitReset() {
    if (!this.email) {
      this.error.set('Escribe tu correo electrónico.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { error } = await this.auth.sendPasswordResetEmail(this.email);
    this.loading.set(false);

    if (error) {
      this.error.set(error.message);
      return;
    }
    this.success.set('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
  }
}