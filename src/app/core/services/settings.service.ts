import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type CurrencyCode = 'COP' | 'USD' | 'EUR';

export interface AppSettings {
    id?: string;
    cafe_name: string;
    logo_url?: string | null;
    currency: CurrencyCode;
    loyalty_rate: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    cafeName = signal('Mi Cafetería');
    logoUrl = signal<string | null>(null);
    currency = signal<CurrencyCode>('COP');
    loyaltyRate = signal(0.001);
    loaded = signal(false);

    private settingsId: string | null = null;

    constructor(private supabase: SupabaseService) {
        this.load();
    }

    async load() {
        const { data, error } = await this.supabase.client
            .from('app_settings')
            .select('*')
            .limit(1)
            .single();

        if (!error && data) {
            this.settingsId = data.id;
            this.cafeName.set(data.cafe_name);
            this.logoUrl.set(data.logo_url);
            this.currency.set(data.currency);
            this.loyaltyRate.set(data.loyalty_rate ?? 0.001);
            this.applyFavicon(data.logo_url);
        }
        this.loaded.set(true);
    }

    async update(changes: Partial<AppSettings>) {
        if (!this.settingsId) return;
        const { data, error } = await this.supabase.client
            .from('app_settings')
            .update(changes)
            .eq('id', this.settingsId)
            .select()
            .single();
        if (error) throw error;

        if (changes.cafe_name !== undefined) this.cafeName.set(data.cafe_name);
        if (changes.logo_url !== undefined) this.logoUrl.set(data.logo_url);
        if (changes.currency !== undefined) this.currency.set(data.currency);
        if (changes.loyalty_rate !== undefined) this.loyaltyRate.set(data.loyalty_rate);
        if (changes.logo_url !== undefined) this.applyFavicon(changes.logo_url ?? null);
        return data;
    }

    /** Sube el logo a Supabase Storage y devuelve la URL pública */
    async uploadLogo(file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const path = `logo-${Date.now()}.${ext}`;
        const { error } = await this.supabase.client.storage
            .from('branding')
            .upload(path, file, { upsert: true });
        if (error) throw error;

        const { data } = this.supabase.client.storage.from('branding').getPublicUrl(path);
        return data.publicUrl;
    }
    private applyFavicon(url: string | null | undefined) {
        if (!url) return;
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
    }
}