export type UserRole = 'admin' | 'cajero' | 'barista' | 'mesero' | 'cocinero';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
}
