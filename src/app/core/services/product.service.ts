import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private supabase: SupabaseService) {}

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as Category[];
  }

  async createCategory(category: Partial<Category>) {
    const { data, error } = await this.supabase.client.from('categories').insert(category).select().single();
    if (error) throw error;
    return data as Category;
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*, categories(name)')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as any[]).map((p) => ({ ...p, category_name: p.categories?.name })) as Product[];
  }

  async getActiveProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as any[]).map((p) => ({ ...p, category_name: p.categories?.name })) as Product[];
  }

  async createProduct(product: Partial<Product>) {
    const { data, error } = await this.supabase.client.from('products').insert(product).select().single();
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, changes: Partial<Product>) {
    const { data, error } = await this.supabase.client
      .from('products')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  }

  async deleteProduct(id: string) {
    const { error } = await this.supabase.client.from('products').delete().eq('id', id);
    if (error) throw error;
  }
}
