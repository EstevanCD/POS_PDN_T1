import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../../organisms/header/header.component';
import { SidebarComponent } from '../../organisms/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { OfflineQueueService } from '../../../core/services/offline-queue.service';

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
  `],
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor(public auth: AuthService, public offlineQueue: OfflineQueueService, private router: Router) {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.sidebarOpen.set(false));
  }
}