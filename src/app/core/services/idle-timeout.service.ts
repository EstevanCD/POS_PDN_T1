import { Injectable, NgZone, signal } from '@angular/core';

const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 hora de inactividad → cierre automático
const WARNING_WINDOW_MS = 60 * 1000; // aviso 60s antes de cerrar sesión
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

/**
 * Detecta inactividad del usuario en la app y dispara un callback
 * (normalmente cerrar sesión) tras IDLE_LIMIT_MS sin ninguna interacción.
 * Solo debe correr mientras haya una sesión activa (ver MainLayoutComponent).
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  showWarning = signal(false);
  secondsLeft = signal(0);

  private lastActivity = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onExpire: (() => void) | null = null;
  private running = false;
  private boundReset = () => this.resetTimer();

  constructor(private ngZone: NgZone) {}

  start(onExpire: () => void) {
    if (this.running) return;
    this.running = true;
    this.onExpire = onExpire;
    this.lastActivity = Date.now();
    this.showWarning.set(false);

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, this.boundReset, { passive: true }));

    // El chequeo corre cada segundo fuera de Angular por performance;
    // solo entra a la zona de Angular cuando de verdad hay que actualizar la UI.
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => this.tick(), 1000);
    });
  }

  stop() {
    this.running = false;
    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, this.boundReset));
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.showWarning.set(false);
  }

  /** Cualquier actividad, o el botón "Seguir conectado", llama esto */
  resetTimer() {
    this.lastActivity = Date.now();
    if (this.showWarning()) {
      this.ngZone.run(() => this.showWarning.set(false));
    }
  }

  private tick() {
    const idle = Date.now() - this.lastActivity;

    if (idle >= IDLE_LIMIT_MS) {
      this.ngZone.run(() => {
        this.showWarning.set(false);
        this.stop();
        this.onExpire?.();
      });
      return;
    }

    const remaining = IDLE_LIMIT_MS - idle;
    if (remaining <= WARNING_WINDOW_MS) {
      const seconds = Math.ceil(remaining / 1000);
      this.ngZone.run(() => {
        this.showWarning.set(true);
        this.secondsLeft.set(seconds);
      });
    }
  }
}