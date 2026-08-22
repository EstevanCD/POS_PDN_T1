import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <header class="app-header">
      <button class="app-header__menu-btn" (click)="toggleSidebar.emit()" aria-label="Menú">☰</button>
      <div class="app-header__brand">
        <img
          *ngIf="settings.logoUrl() as logo"
          [src]="logo"
          class="app-header__logo-img"
          alt="Logo"
        />
        <span class="app-header__logo" *ngIf="!settings.logoUrl()">☕</span>
        <h1 class="app-header__title">{{ settings.cafeName() }}</h1>
      </div>
      <div class="app-header__user">
        <span class="app-header__name" *ngIf="auth.profile() as p">{{ p.full_name || p.email }}</span>
        <app-button variant="ghost" size="sm" (clicked)="logout()">Salir</app-button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-5);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .app-header__menu-btn {
      display: none;
      border: none; background: transparent; font-size: 1.3rem; cursor: pointer;
    }
    .app-header__brand { display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 0; }
    .app-header__logo { font-size: 1.5rem; flex-shrink: 0; }
    .app-header__logo-img { width: 32px; height: 32px; object-fit: contain; border-radius: var(--radius-sm); flex-shrink: 0; }
    .app-header__title {
      font-size: var(--fs-lg);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .app-header__user { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
    .app-header__name { font-size: var(--fs-sm); color: var(--color-text-muted); }

    @media (max-width: 1024px) {
      .app-header__menu-btn { display: inline-flex; }
    }
    @media (max-width: 480px) {
      .app-header { padding: 0 var(--space-3); }
      .app-header__name { display: none; }
    }
  `],
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(public auth: AuthService, public settings: SettingsService) { }

  logout() {
    this.auth.signOut();
  }
}