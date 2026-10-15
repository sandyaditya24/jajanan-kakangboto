import { MenuItem, ShopSettings, SavedOrder } from '../types/menu';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  menu?: MenuItem[];
  orders?: SavedOrder[];
  settings?: ShopSettings;
  error?: string;
  lastUpdated?: number;
}

export type SseEventHandler = (payload: {
  type: string;
  action?: string;
  item?: MenuItem;
  menu?: MenuItem[];
  settings?: ShopSettings;
  order?: SavedOrder;
  orders?: SavedOrder[];
  id?: string;
  status?: 'menunggu' | 'diproses' | 'selesai';
  lastUpdated?: number;
}) => void;

// Helper to append cache-busting timestamp and parameters to defeat any mobile/browser caching
function withCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}&_v=${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_FETCH_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export const menuApi = {
  // Fetch menu with mandatory cache-busting
  async getMenu(): Promise<MenuItem[]> {
    try {
      const res = await fetch(withCacheBuster('/api/menu'), {
        cache: 'no-store',
        headers: DEFAULT_FETCH_HEADERS,
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json: ApiResponse<MenuItem[]> = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.warn('Gagal memuat menu dari server:', err);
      throw err;
    }
  },

  // Add new menu item to database
  async addMenu(item: MenuItem): Promise<MenuItem[]> {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...DEFAULT_FETCH_HEADERS,
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Gagal menambahkan menu ke database.');
    const json: ApiResponse<MenuItem> = await res.json();
    return json.menu || [];
  },

  // Update existing menu item
  async updateMenu(item: MenuItem): Promise<MenuItem[]> {
    const res = await fetch(`/api/menu/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...DEFAULT_FETCH_HEADERS,
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Gagal memperbarui menu di database.');
    const json: ApiResponse<MenuItem> = await res.json();
    return json.menu || [];
  },

  // Delete menu item from database
  async deleteMenu(id: string): Promise<MenuItem[]> {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_FETCH_HEADERS,
    });
    if (!res.ok) throw new Error('Gagal menghapus menu dari database.');
    const json: ApiResponse<void> = await res.json();
    return json.menu || [];
  },

  // Reset menu to defaults (empty list)
  async resetMenu(): Promise<MenuItem[]> {
    const res = await fetch('/api/menu/reset', {
      method: 'POST',
      headers: DEFAULT_FETCH_HEADERS,
    });
    if (!res.ok) throw new Error('Gagal mereset menu.');
    const json: ApiResponse<MenuItem[]> = await res.json();
    return json.menu || [];
  },

  // Sync client menu & settings to server (anti-data-loss reconciliation)
  async syncMenu(menu: MenuItem[], settings?: ShopSettings, clientUpdated?: number): Promise<MenuItem[]> {
    try {
      const res = await fetch('/api/menu/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...DEFAULT_FETCH_HEADERS,
        },
        body: JSON.stringify({ menu, settings, clientUpdated: clientUpdated || Date.now() }),
      });
      if (!res.ok) return menu;
      const json: ApiResponse<MenuItem[]> = await res.json();
      return json.menu || menu;
    } catch {
      return menu;
    }
  },

  // Fetch shop settings with cache-busting
  async getSettings(): Promise<ShopSettings | null> {
    try {
      const res = await fetch(withCacheBuster('/api/settings'), {
        cache: 'no-store',
        headers: DEFAULT_FETCH_HEADERS,
      });
      if (!res.ok) return null;
      const json: ApiResponse<ShopSettings> = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  // Update shop settings
  async updateSettings(settings: ShopSettings): Promise<ShopSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...DEFAULT_FETCH_HEADERS,
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Gagal menyimpan pengaturan toko.');
    const json: ApiResponse<ShopSettings> = await res.json();
    return json.data || settings;
  },

  // Fetch orders from server with cache-busting
  async getOrders(): Promise<SavedOrder[]> {
    try {
      const res = await fetch(withCacheBuster('/api/orders'), {
        cache: 'no-store',
        headers: DEFAULT_FETCH_HEADERS,
      });
      if (!res.ok) return [];
      const json: ApiResponse<SavedOrder[]> = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch {
      return [];
    }
  },

  // Add new order
  async addOrder(order: SavedOrder): Promise<SavedOrder[]> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...DEFAULT_FETCH_HEADERS,
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Gagal mencatat pesanan ke server.');
    const json: ApiResponse<SavedOrder> = await res.json();
    return json.orders || [];
  },

  // Update order status
  async updateOrderStatus(id: string, status: 'menunggu' | 'diproses' | 'selesai'): Promise<SavedOrder[]> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...DEFAULT_FETCH_HEADERS,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui status pesanan.');
    const json: ApiResponse<SavedOrder> = await res.json();
    return json.orders || [];
  },

  // Delete single order
  async deleteOrder(id: string): Promise<SavedOrder[]> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_FETCH_HEADERS,
    });
    if (!res.ok) throw new Error('Gagal menghapus pesanan.');
    const json: ApiResponse<SavedOrder> = await res.json();
    return json.orders || [];
  },

  // Clear all orders
  async clearOrders(): Promise<SavedOrder[]> {
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: DEFAULT_FETCH_HEADERS,
    });
    if (!res.ok) throw new Error('Gagal mengosongkan riwayat pesanan.');
    const json: ApiResponse<SavedOrder> = await res.json();
    return json.orders || [];
  },

  // Subscribe to real-time Server-Sent Events (SSE)
  subscribeMenuUpdates(onEvent: SseEventHandler): () => void {
    let eventSource: EventSource | null = null;
    let isClosed = false;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (isClosed) return;

      try {
        eventSource = new EventSource(withCacheBuster('/api/menu/stream'));

        eventSource.onopen = () => {
          // Connected cleanly
        };

        eventSource.onmessage = (event) => {
          try {
            if (event.data && event.data.trim().startsWith('{')) {
              const parsed = JSON.parse(event.data);
              onEvent(parsed);
            }
          } catch (e) {
            console.warn('Gagal memproses event stream:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isClosed) {
            // Reconnect after 3 seconds
            retryTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.warn('Gagal memulai SSE stream:', err);
        if (!isClosed) {
          retryTimeout = setTimeout(connect, 4000);
        }
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
