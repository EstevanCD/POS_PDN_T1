export interface Category {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}
