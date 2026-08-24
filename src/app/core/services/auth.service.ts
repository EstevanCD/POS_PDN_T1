import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Sesión actual */
  session = signal<Session | null>(null);

  /** Perfil del usuario autenticado */
  profile = signal<Profile | null>(null);

  /** Indica si todavía estamos restaurando la sesión */
  loading = signal<boolean>(true);

  /**
   * Promise que se resuelve cuando Supabase termina
   * de restaurar la sesión inicial.
   */
  private initializationPromise: Promise<void>;

  constructor(private supabase: SupabaseService, private router: Router) {
    this.initializationPromise = this.init();
  }

  /**
   * Inicializa la autenticación y restaura la sesión
   * almacenada por Supabase.
   */
  private async init(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.auth.getSession();

      if (error) {
        console.error('Error recuperando sesión:', error);
      }

      this.session.set(data.session);

      if (data.session) {
        await this.loadProfile(data.session.user.id);
      }

      /**
       * Escuchamos cambios posteriores de autenticación:
       * login, logout, refresh token, etc.
       */
      this.supabase.client.auth.onAuthStateChange((event, session) => {
        this.session.set(session);

        if (session) {
          /**
           * No hacemos await aquí para evitar bloquear
           * el callback de Supabase.
           */
          void this.loadProfile(session.user.id);
        } else {
          this.profile.set(null);
        }

        console.log('Auth event:', event);
      });
    } catch (error) {
      console.error('Error inicializando AuthService:', error);
      this.session.set(null);
      this.profile.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Permite que un guard o componente espere a que
   * la sesión inicial esté completamente restaurada.
   */
  async waitUntilInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  /**
   * Carga el perfil extendido del usuario.
   */
  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error cargando perfil:', error);
      this.profile.set(null);
      return;
    }

    if (data) {
      this.profile.set(data as Profile);
    }
  }

  /**
   * Login con correo y contraseña.
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } =
      await this.supabase.client.auth.signInWithPassword({
        email,
        password,
      });

    if (!error && data.session) {
      this.session.set(data.session);
      await this.loadProfile(data.session.user.id);
    }

    return { data, error };
  }

  /**
   * Registro de usuario.
   */
  async signUp(
    email: string,
    password: string,
    fullName: string
  ) {
    return this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  }

  /**
   * Cierre de sesión. Limpia el estado local y redirige a /login
   * incluso si la llamada al servidor falla (ej. sin conexión),
   * para que el usuario nunca quede atrapado dentro de la app.
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.client.auth.signOut();
      if (error) {
        console.error('Error cerrando sesión en el servidor:', error);
      }
    } catch (error) {
      console.error('Error de red al cerrar sesión:', error);
    } finally {
      this.session.set(null);
      this.profile.set(null);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Comprueba si existe una sesión válida.
   */
  isAuthenticated(): boolean {
    return !!this.session();
  }
}