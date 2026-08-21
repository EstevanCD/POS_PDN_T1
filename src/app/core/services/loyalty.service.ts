import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Customer } from '../models/loyalty.model';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
    constructor(private supabase: SupabaseService) { }

    async findByPhone(phone: string): Promise<Customer | null> {
        const { data } = await this.supabase.client.from('customers').select('*').eq('phone', phone).maybeSingle();
        return (data as Customer) ?? null;
    }

    async findOrCreate(phone: string, name?: string): Promise<Customer> {
        const existing = await this.findByPhone(phone);
        if (existing) return existing;
        const { data, error } = await this.supabase.client
            .from('customers')
            .insert({ phone, name, points: 0 })
            .select()
            .single();
        if (error) throw error;
        return data as Customer;
    }

    async addPoints(phone: string, amountSpent: number, rate: number) {
        const points = Math.floor(amountSpent * rate);
        if (points <= 0) return;
        const customer = await this.findOrCreate(phone);
        const { error } = await this.supabase.client
            .from('customers')
            .update({ points: customer.points + points })
            .eq('id', customer.id);
        if (error) throw error;
    }

    async redeemPoints(customerId: string, currentPoints: number, points: number) {
        if (currentPoints < points) throw new Error('Puntos insuficientes');
        const { error } = await this.supabase.client
            .from('customers')
            .update({ points: currentPoints - points })
            .eq('id', customerId);
        if (error) throw error;
    }

    async getAllCustomers(): Promise<Customer[]> {
        const { data, error } = await this.supabase.client.from('customers').select('*').order('points', { ascending: false });
        if (error) throw error;
        return data as Customer[];
    }
}