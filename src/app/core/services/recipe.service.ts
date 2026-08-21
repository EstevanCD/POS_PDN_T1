import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RecipeEntry } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
    constructor(private supabase: SupabaseService) { }

    async getRecipeForProduct(productId: string): Promise<RecipeEntry[]> {
        const { data, error } = await this.supabase.client
            .from('product_recipe')
            .select('*, inventory_items(name, unit)')
            .eq('product_id', productId);
        if (error) throw error;
        return (data as any[]).map((r) => ({
            ...r,
            inventory_item_name: r.inventory_items?.name,
            inventory_item_unit: r.inventory_items?.unit,
        })) as RecipeEntry[];
    }

    /** Trae todas las recetas de un conjunto de productos en una sola consulta (usado al cobrar) */
    async getRecipeEntriesForProducts(productIds: string[]): Promise<RecipeEntry[]> {
        if (!productIds.length) return [];
        const { data, error } = await this.supabase.client
            .from('product_recipe')
            .select('*')
            .in('product_id', productIds);
        if (error) throw error;
        return data as RecipeEntry[];
    }

    async addEntry(entry: Partial<RecipeEntry>) {
        const { data, error } = await this.supabase.client
            .from('product_recipe')
            .insert(entry)
            .select()
            .single();
        if (error) throw error;
        return data as RecipeEntry;
    }

    async deleteEntry(id: string) {
        const { error } = await this.supabase.client.from('product_recipe').delete().eq('id', id);
        if (error) throw error;
    }
}