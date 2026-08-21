import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, UserRole } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private supabase: SupabaseService) { }

    async getProfiles(): Promise<Profile[]> {
        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .order('email', { ascending: true });
        if (error) throw error;
        return data as Profile[];
    }

    async updateRole(userId: string, role: UserRole) {
        const { error } = await this.supabase.client
            .from('profiles')
            .update({ role })
            .eq('id', userId);
        if (error) throw error;
    }
}