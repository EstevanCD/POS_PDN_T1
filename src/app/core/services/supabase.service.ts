import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Servicio único que expone el cliente de Supabase a toda la app.
 * Todos los demás servicios (auth, product, order, inventory, finance)
 * consumen este cliente para hacer queries a Postgres, Auth y Realtime.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
