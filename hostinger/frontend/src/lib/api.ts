/**
 * Cliente API para comunicação com o backend PHP
 * Substitui as chamadas do Supabase
 */

// IMPORTANTE: Altere esta URL para o domínio da sua Hostinger
const API_BASE_URL = '/api';

// Armazenamento do token
let authToken: string | null = localStorage.getItem('auth_token');
let currentUser: User | null = null;

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  sector?: string;
  avatar_url?: string;
  role: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

async function apiUpload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {};

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    if (!isJson) {
      const text = await response.text();
      return { success: false, error: `Resposta inválida do servidor (${response.status}). ${text.slice(0, 160)}` };
    }

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
      return { success: false, error: data.error || 'Erro desconhecido' };
    }

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? `Tempo limite ao conectar com o servidor (${Math.round(timeoutMs / 1000)}s).`
        : 'Erro de conexão com o servidor';
    return { success: false, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Função auxiliar para fazer requisições
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  // Avoid infinite pending requests on shared hosting.
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    // Some hosting errors return HTML (not JSON). Validate before parsing.
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      if (!response.ok) {
        // If unauthorized, clear local session.
        if (response.status === 401) {
          authToken = null;
          currentUser = null;
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
        }
        return { success: false, error: `Resposta inválida do servidor (${response.status}). ${text.slice(0, 160)}` };
      }

      // No JSON but ok: treat as empty
      return { success: true, data: undefined as unknown as T };
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
      return { success: false, error: data.error || 'Erro desconhecido' };
    }

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? `Tempo limite ao conectar com o servidor (${Math.round(timeoutMs / 1000)}s).`
        : 'Erro de conexão com o servidor';
    return { success: false, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==================== AUTH ====================

export const auth = {
  async signIn(phone: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const result = await apiRequest<{ token: string; user: User }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    if (result.data) {
      authToken = result.data.token;
      currentUser = result.data.user;
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('current_user', JSON.stringify(result.data.user));
    }

    return result;
  },

  async signInWithEmail(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    const result = await apiRequest<{ token: string; user: User }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data) {
      authToken = result.data.token;
      currentUser = result.data.user;
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('current_user', JSON.stringify(result.data.user));
    }

    return result;
  },

  async getUser(): Promise<User | null> {
    if (!authToken) return null;

    // Tentar do cache primeiro
    const cached = localStorage.getItem('current_user');
    if (cached) {
      currentUser = JSON.parse(cached);
    }

    const result = await apiRequest<User>('/auth/me.php');
    if (result.data) {
      currentUser = result.data;
      localStorage.setItem('current_user', JSON.stringify(result.data));
      return result.data;
    }

    return currentUser;
  },

  async resolvePhone(phone: string): Promise<ApiResponse<{ email: string }>> {
    return apiRequest('/auth/resolve-phone.php', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  signOut(): void {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.href = '/auth';
  },

  getToken(): string | null {
    return authToken;
  },

  getCurrentUser(): User | null {
    if (!currentUser) {
      const cached = localStorage.getItem('current_user');
      if (cached) {
        currentUser = JSON.parse(cached);
      }
    }
    return currentUser;
  },

  isAuthenticated(): boolean {
    return !!authToken;
  },
};

// ==================== INVENTORY ====================

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sector: 'bar' | 'cozinha';
  unit: 'unidade' | 'kg' | 'litro' | 'caixa' | 'pacote';
  quantity: number;
  min_quantity: number | null;
  category: string | null;
  image_url: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export const inventory = {
  async list(sector?: string): Promise<ApiResponse<InventoryItem[]>> {
    const query = sector ? `?sector=${sector}` : '';
    return apiRequest(`/inventory/list.php${query}`);
  },

  async create(item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return apiRequest('/inventory/create.php', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async update(id: string, item: Partial<InventoryItem> & { changes?: any[] }): Promise<ApiResponse<InventoryItem>> {
    return apiRequest(`/inventory/update.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/inventory/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== MOVEMENTS ====================

export interface StockMovement {
  id: string;
  item_id: string | null;
  user_id: string;
  movement_type: 'entrada' | 'saida' | 'edicao';
  quantity: number;
  notes: string | null;
  created_at: string;
  item_name?: string;
  user_name?: string;
  sector?: string;
  inventory_items?: {
    name: string;
    sector: string;
    unit: string;
    price: number;
  };
  profiles?: {
    full_name: string;
  };
}

export const movements = {
  async list(options?: { item_id?: string; type?: string; date?: string; limit?: number }): Promise<ApiResponse<StockMovement[]>> {
    const params = new URLSearchParams();
    if (options?.item_id) params.append('item_id', options.item_id);
    if (options?.type) params.append('type', options.type);
    if (options?.date) params.append('date', options.date);
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/movements/list.php${query}`);
  },

  async create(movement: { item_id: string; movement_type: string; quantity: number; notes?: string }): Promise<ApiResponse<StockMovement>> {
    return apiRequest('/movements/create.php', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/movements/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  async getDates(): Promise<ApiResponse<string[]>> {
    return apiRequest('/movements/dates.php');
  },
};

// ==================== USERS ====================

export const users = {
  async list(): Promise<ApiResponse<User[]>> {
    return apiRequest('/users/list.php');
  },

  async create(user: { phone: string; password: string; full_name: string; sector?: string; role?: string }): Promise<ApiResponse<User>> {
    return apiRequest('/users/create.php', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async update(userId: string, data: { password?: string; full_name?: string; phone?: string; sector?: string; role?: string }): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest('/users/update.php', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, ...data }),
    });
  },

  async updateRole(userId: string, role: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest('/users/update-role.php', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/users/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== CATEGORIES ====================

export interface Category {
  id: string;
  name: string;
  sector: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  sort_order?: number | null;
  created_at: string;
}

export const categories = {
  async list(sector?: string): Promise<ApiResponse<Category[]>> {
    const query = sector ? `?sector=${sector}` : '';
    return apiRequest(`/categories/list.php${query}`);
  },

  async create(category: { name: string; sector: string }): Promise<ApiResponse<Category>> {
    return apiRequest('/categories/create.php', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/categories/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== SUBCATEGORIES ====================

export const subcategories = {
  async list(options?: { sector?: string; category_id?: string }): Promise<ApiResponse<Subcategory[]>> {
    const params = new URLSearchParams();
    if (options?.sector) params.append('sector', options.sector);
    if (options?.category_id) params.append('category_id', options.category_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/subcategories/list.php${query}`);
  },

  async create(data: { category_id: string; name: string }): Promise<ApiResponse<Subcategory>> {
    return apiRequest('/subcategories/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/subcategories/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== HISTORY ====================

export interface ProductEditHistory {
  id: string;
  item_id: string;
  user_id: string;
  item_name_snapshot: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  created_at: string;
  user_name?: string;
}

export const history = {
  async list(date?: string): Promise<ApiResponse<ProductEditHistory[]>> {
    const query = date ? `?date=${date}` : '';
    return apiRequest(`/history/list.php${query}`);
  },
};

// ==================== ADMIN ====================

export interface AdminAction {
  id: string;
  user_id: string;
  action_type: string;
  target_user_id: string | null;
  details: string | null;
  created_at: string;
  user_name?: string;
  target_user_name?: string;
}

export const admin = {
  async getActions(date?: string): Promise<ApiResponse<AdminAction[]>> {
    const query = date ? `?date=${date}` : '';
    return apiRequest(`/admin/actions.php${query}`);
  },

  async logAction(action: { action_type: string; target_user_id?: string; details?: string }): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest('/admin/log-action.php', {
      method: 'POST',
      body: JSON.stringify(action),
    });
  },
};

// ==================== BRANDING / UPLOADS ====================

export interface BrandingSettings {
  dashboard_logo_url: string | null;
  login_logo_url: string | null;
  system_name?: string | null;
  updated_at: string | null;
}

export const branding = {
  async get(): Promise<ApiResponse<BrandingSettings>> {
    // endpoint returns {success, data}
    const res = await apiRequest<{ success: boolean; data: BrandingSettings; error?: string }>('/branding/get.php');
    if (res.error) return { success: false, error: res.error };
    const payload = res.data as any;
    if (payload?.success === false) return { success: false, error: payload?.error || 'Erro ao buscar branding' };
    return { success: true, data: payload?.data };
  },

  async updateSystemName(system_name: string): Promise<ApiResponse<BrandingSettings>> {
    const res = await apiRequest<{ success: boolean; data: BrandingSettings; error?: string }>(
      '/branding/update.php',
      {
        method: 'PUT',
        body: JSON.stringify({ system_name }),
      }
    );

    if (res.error) return { success: false, error: res.error };
    const payload = res.data as any;
    if (payload?.success === false) return { success: false, error: payload?.error || 'Erro ao salvar nome' };
    return { success: true, data: payload?.data };
  },
};

export const uploads = {
  async uploadLogo(type: 'dashboard' | 'login', file: File): Promise<ApiResponse<{ url: string }>> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiUpload<{ success: boolean; data: { url: string }; error?: string }>(`/upload/logo.php?type=${encodeURIComponent(type)}`, fd);
    if (res.error) return { success: false, error: res.error };
    const payload = res.data as any;
    if (payload?.success === false) return { success: false, error: payload?.error || 'Erro ao enviar logo' };
    return { success: true, data: payload?.data };
  },

  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ url: string; user_id: string }>> {
    const fd = new FormData();
    fd.append('user_id', userId);
    fd.append('file', file);
    const res = await apiUpload<{ success: boolean; data: { url: string; user_id: string }; error?: string }>(`/upload/avatar.php`, fd);
    if (res.error) return { success: false, error: res.error };
    const payload = res.data as any;
    if (payload?.success === false) return { success: false, error: payload?.error || 'Erro ao enviar avatar' };
    return { success: true, data: payload?.data };
  },
};

// Export default API object
export default {
  auth,
  inventory,
  movements,
  users,
  categories,
  subcategories,
  history,
  admin,
  branding,
  uploads,
};
