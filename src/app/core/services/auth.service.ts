import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Señal reactiva con la sesión actual (null = no autenticado) */
  session = signal<Session | null>(null);
  /** Perfil extendido (rol, nombre) desde la tabla `profiles` */
  profile = signal<Profile | null>(null);
  loading = signal<boolean>(true);

  constructor(private supabase: SupabaseService) {
    this.init();
  }

  private async init() {
    const { data } = await this.supabase.client.auth.getSession();
    this.session.set(data.session);
    if (data.session) await this.loadProfile(data.session.user.id);
    this.loading.set(false);

    this.supabase.client.auth.onAuthStateChange(async (_event, session) => {
      this.session.set(session);
      if (session) {
        await this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) this.profile.set(data as Profile);
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (!error && data.session) await this.loadProfile(data.session.user.id);
    return { data, error };
  }

  async signUp(email: string, password: string, fullName: string) {
    return this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.session();
  }
}
