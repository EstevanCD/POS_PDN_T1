import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../../organisms/header/header.component';
import { SidebarComponent } from '../../organisms/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { OfflineQueueService } from '../../../core/services/offline-queue.service';
import { IdleTimeoutService } from '../../../core/services/idle-timeout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="layout">
      <div class="layout__offline-banner" *ngIf="!offlineQueue.isOnline() || offlineQueue.pendingCount() > 0">
        <span *ngIf="!offlineQueue.isOnline()">📡 Sin conexión — las órdenes se guardan localmente</span>
        <span *ngIf="offlineQueue.isOnline() && offlineQueue.pendingCount() > 0">
          🔄 Sincronizando {{ offlineQueue.pendingCount() }} orden(es) pendiente(s)...
        </span>
      </div>

      <app-header (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-header>

      <div class="layout__body">
        <app-sidebar [open]="sidebarOpen()"></app-sidebar>

        <div class="layout__backdrop" *ngIf="sidebarOpen()" (click)="sidebarOpen.set(false)"></div>

        <main class="layout__content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Aviso de cierre de sesión por inactividad -->
    <div class="idle-modal__backdrop" *ngIf="idle.showWarning()">
      <div class="idle-modal">
        <p class="idle-modal__icon">⏱️</p>
        <h3>¿Sigues ahí?</h3>
        <p class="idle-modal__text">
          Por seguridad, tu sesión se cerrará en <strong>{{ idle.secondsLeft() }}</strong> segundos por inactividad.
        </p>
        <button class="idle-modal__btn" (click)="idle.resetTimer()">Seguir conectado</button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
    }
    .layout__body {
      display: flex;
      flex: 1;
      position: relative;
      width: 100%;
      max-width: 100vw;
      min-width: 0;
      overflow-x: hidden;
    }
    .layout__content {
      flex: 1;
      min-width: 0;
      padding-bottom: var(--space-4);
    }

    .layout__offline-banner {
      background: var(--color-warning);
      color: white;
      text-align: center;
      padding: var(--space-2);
      font-size: var(--fs-sm);
      font-weight: 600;
    }

    .layout__backdrop {
      position: fixed; inset: 0; top: var(--header-height);
      background: rgba(0,0,0,0.35); z-index: 25;
      display: none;
    }

    @media (max-width: 1024px) {
      .layout__backdrop { display: block; }
    }

    .idle-modal__backdrop {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-4);
    }
    .idle-modal {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-6) var(--space-5);
      max-width: 340px; width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .idle-modal__icon { font-size: 2.2rem; margin-bottom: var(--space-2); }
    .idle-modal h3 { margin-bottom: var(--space-2); }
    .idle-modal__text { color: var(--color-text-muted); font-size: var(--fs-sm); margin-bottom: var(--space-4); }
    .idle-modal__text strong { color: var(--color-danger); font-size: var(--fs-lg); }
    .idle-modal__btn {
      width: 100%;
      border: none; border-radius: var(--radius-md);
      background: var(--color-primary); color: var(--color-text-inverse);
      padding: var(--space-3); font-weight: 700; font-size: var(--fs-md);
      cursor: pointer;
    }
  `],
})

export class MainLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor(
    public auth: AuthService,
    public offlineQueue: OfflineQueueService,
    public idle: IdleTimeoutService,
    private router: Router
  ) {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.sidebarOpen.set(false));
  }

  ngOnInit() {
    this.idle.start(() => this.auth.signOut());
  }

  ngOnDestroy() {
    this.idle.stop();
  }
}