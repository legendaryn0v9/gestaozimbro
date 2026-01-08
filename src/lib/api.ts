// API Service for PHP/MySQL Backend
const API_BASE_URL = 'https://valedofimdeano.online/backend/api';

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

// Base fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  register: async (email: string, password: string, fullName: string) => {
    const data = await apiFetch<{ token: string; user: User }>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setAuthToken(data.token);
    return data;
  },

  me: async () => {
    return apiFetch<User>('/auth/me.php');
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Inventory API
export const inventoryApi = {
  list: async (sector?: string) => {
    const query = sector ? `?sector=${sector}` : '';
    return apiFetch<InventoryItem[]>(`/inventory/list.php${query}`);
  },

  create: async (item: CreateInventoryItem) => {
    return apiFetch<InventoryItem>('/inventory/create.php', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  update: async (id: string, item: Partial<InventoryItem>) => {
    return apiFetch<InventoryItem>(`/inventory/update.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  delete: async (id: string) => {
    return apiFetch<{ success: boolean }>(`/inventory/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Movements API
export const movementsApi = {
  list: async (options?: { itemId?: string; type?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.itemId) params.append('item_id', options.itemId);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<StockMovement[]>(`/movements/list.php${query}`);
  },

  delete: async (id: string) => {
    return apiFetch<{ success: boolean }>(`/movements/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  create: async (movement: CreateMovement) => {
    return apiFetch<StockMovement>('/movements/create.php', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  },
};

// Users API
export const usersApi = {
  list: async () => {
    return apiFetch<User[]>('/users/list.php');
  },

  updateRole: async (userId: string, role: 'admin' | 'funcionario') => {
    return apiFetch<{ success: boolean }>('/users/update-role.php', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },
};

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: 'admin' | 'funcionario';
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  min_quantity: number;
  unit: 'unidade' | 'kg' | 'litro' | 'caixa' | 'pacote';
  sector: 'bar' | 'cozinha';
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItem {
  name: string;
  description?: string;
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  sector: 'bar' | 'cozinha';
  category?: string;
  image_url?: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  user_id: string;
  movement_type: 'entrada' | 'saida';
  quantity: number;
  notes?: string;
  created_at: string;
  item_name?: string;
  user_name?: string;
  sector?: string;
}

export interface CreateMovement {
  item_id: string;
  movement_type: 'entrada' | 'saida';
  quantity: number;
  notes?: string;
}
