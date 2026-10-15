import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DEFAULT_MENU, DEFAULT_SETTINGS } from './src/data/defaultMenu.ts';
import type { MenuItem, ShopSettings, SavedOrder } from './src/types/menu.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High payload limit for image data URLs
app.use(express.json({ limit: '25mb' }));

// Static public directory (images, assets)
app.use(express.static(path.resolve(__dirname, 'public')));

// Anti-cache headers for all API requests to prevent stale browser caches
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Database storage file paths inside the project repository
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUP_FILE = path.join(DATA_DIR, 'database.backup.json');

// Cloud mirror object ID for persistent cloud recovery across container rollouts
const CLOUD_MIRROR_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1411daf236bfc';

interface DatabaseSchema {
  menu: MenuItem[];
  orders: SavedOrder[];
  settings: ShopSettings;
  lastUpdated: number;
}

// Helper to sanitize payload for cloud mirror (strip giant data URLs if needed)
function createCloudMirrorPayload(dbData: DatabaseSchema) {
  // Compress/sanitize items for cloud mirror to ensure size limit is respected
  const safeMenu = (dbData.menu || []).map((m) => {
    // If image is a super long data URL (> 20KB), keep it in local file and truncate for mirror
    let imageToSave = m.image;
    if (imageToSave && imageToSave.length > 25000 && imageToSave.startsWith('data:')) {
      // Keep standard tag so it still has an image reference
      imageToSave = imageToSave.substring(0, 500);
    }
    return {
      ...m,
      image: imageToSave,
    };
  });

  return {
    name: 'JAJANAN_KAKANG_MENU',
    data: {
      menu: safeMenu,
      orders: (dbData.orders || []).slice(0, 30),
      settings: dbData.settings,
      lastUpdated: dbData.lastUpdated,
    },
  };
}

async function syncToCloudMirror(data: DatabaseSchema): Promise<void> {
  try {
    const payload = createCloudMirrorPayload(data);
    await fetch(CLOUD_MIRROR_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Silently continue if external cloud mirror has transient network glitch
    console.warn('Cloud mirror sync notice:', err);
  }
}

async function restoreFromCloudMirrorIfEmpty(): Promise<boolean> {
  try {
    const res = await fetch(`${CLOUD_MIRROR_URL}?_t=${Date.now()}`);
    if (!res.ok) return false;
    const json = await res.json();
    if (json && json.data && Array.isArray(json.data.menu) && json.data.menu.length > 0) {
      db.menu = json.data.menu;
      if (Array.isArray(json.data.orders) && json.data.orders.length > 0) {
        db.orders = json.data.orders;
      }
      if (json.data.settings && typeof json.data.settings === 'object') {
        db.settings = { ...db.settings, ...json.data.settings };
      }
      db.lastUpdated = json.data.lastUpdated || Date.now();
      saveDatabase(db, false); // save to local files without re-triggering cloud sync loop
      broadcast({
        type: 'menu:updated',
        action: 'restore_from_cloud',
        menu: db.menu,
        orders: db.orders,
        settings: db.settings,
        lastUpdated: db.lastUpdated,
      });
      console.log(`Berhasil memulihkan ${db.menu.length} menu dari Cloud Mirror Online!`);
      return true;
    }
  } catch (err) {
    console.warn('Could not restore from cloud mirror:', err);
  }
  return false;
}

// Initialize database from active file, backup file, or defaults
function loadDatabase(): DatabaseSchema {
  // 1. Try reading active DB_FILE
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.menu)) {
        const validMenu = parsed.menu.filter((m: MenuItem) => m.name !== 'Test Item');
        const activeMenu = validMenu.length > 0 ? validMenu : DEFAULT_MENU;
        const activeSettings = (parsed.settings && parsed.settings.whatsappNumber !== '6281234567890')
          ? parsed.settings
          : DEFAULT_SETTINGS;

        return {
          menu: activeMenu,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          settings: activeSettings,
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }
    }
  } catch (err) {
    console.error('Error reading active database file:', err);
  }

  // 2. Try reading BACKUP_FILE if active was missing or damaged
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const backupParsed = JSON.parse(backupContent);
      if (Array.isArray(backupParsed.menu)) {
        const validMenu = backupParsed.menu.filter((m: MenuItem) => m.name !== 'Test Item');
        const activeMenu = validMenu.length > 0 ? validMenu : DEFAULT_MENU;
        const activeSettings = (backupParsed.settings && backupParsed.settings.whatsappNumber !== '6281234567890')
          ? backupParsed.settings
          : DEFAULT_SETTINGS;

        return {
          menu: activeMenu,
          orders: Array.isArray(backupParsed.orders) ? backupParsed.orders : [],
          settings: activeSettings,
          lastUpdated: backupParsed.lastUpdated || Date.now(),
        };
      }
    }
  } catch (err) {
    console.error('Error reading backup database file:', err);
  }

  // 3. Fallback to clean state
  const initialData: DatabaseSchema = {
    menu: DEFAULT_MENU, // default is empty []
    orders: [],
    settings: DEFAULT_SETTINGS,
    lastUpdated: Date.now(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial database file:', err);
  }

  return initialData;
}

function saveDatabase(data: DatabaseSchema, triggerCloudSync: boolean = true): void {
  data.lastUpdated = Date.now();
  const serialized = JSON.stringify(data, null, 2);

  // Dual atomic write to both main and backup files
  try {
    fs.writeFileSync(DB_FILE, serialized, 'utf-8');
    fs.writeFileSync(BACKUP_FILE, serialized, 'utf-8');
  } catch (err) {
    console.error('Error saving local database files:', err);
  }

  // Asynchronous Cloud Mirror Backup
  if (triggerCloudSync) {
    syncToCloudMirror(data).catch(() => {});
  }
}

let db = loadDatabase();

// Attempt automatic cloud mirror restoration on cold start if local is empty
if (db.menu.length === 0) {
  setTimeout(() => {
    restoreFromCloudMirrorIfEmpty().catch(() => {});
  }, 1000);
}

// Connected SSE clients for real-time synchronization
const sseClients = new Set<Response>();

function broadcast(payload: Record<string, unknown>) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 15 seconds to prevent mobile connection drops
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// --- API ROUTES ---

// 1. Get current menu with cache-busting headers
app.get('/api/menu', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.menu,
    lastUpdated: db.lastUpdated,
  });
});

// 2. Real-time Server-Sent Events (SSE) Stream
app.get('/api/menu/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial data snapshot to newly connected client
  res.write(
    `data: ${JSON.stringify({
      type: 'init',
      menu: db.menu,
      orders: db.orders,
      settings: db.settings,
      lastUpdated: db.lastUpdated,
    })}\n\n`
  );

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 3. Add new menu item
app.post('/api/menu', (req: Request, res: Response) => {
  const newItem: MenuItem = req.body;
  if (!newItem.name || typeof newItem.price !== 'number') {
    res.status(400).json({ success: false, error: 'Nama dan harga menu wajib diisi.' });
    return;
  }

  if (!newItem.id) {
    newItem.id = `menu-${Date.now()}`;
  }

  // Prepend new item to active menu
  db.menu = [newItem, ...db.menu.filter((m) => m.id !== newItem.id)];
  saveDatabase(db);

  // Broadcast to all active clients (buyers & sellers)
  broadcast({
    type: 'menu:updated',
    action: 'add',
    item: newItem,
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });

  res.status(201).json({
    success: true,
    data: newItem,
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });
});

// 4. Update existing menu item
app.put('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedItem: MenuItem = req.body;

  const index = db.menu.findIndex((m) => m.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Menu tidak ditemukan.' });
    return;
  }

  db.menu[index] = { ...updatedItem, id };
  saveDatabase(db);

  broadcast({
    type: 'menu:updated',
    action: 'update',
    item: db.menu[index],
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });

  res.json({
    success: true,
    data: db.menu[index],
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });
});

// 5. Delete menu item
app.delete('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = db.menu.length;
  db.menu = db.menu.filter((m) => m.id !== id);

  if (db.menu.length === initialLength) {
    res.status(404).json({ success: false, error: 'Menu tidak ditemukan.' });
    return;
  }

  saveDatabase(db);

  broadcast({
    type: 'menu:updated',
    action: 'delete',
    id,
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, id, menu: db.menu, lastUpdated: db.lastUpdated });
});

// 6. Reset menu to defaults (empty list)
app.post('/api/menu/reset', (req: Request, res: Response) => {
  db.menu = [];
  saveDatabase(db);

  broadcast({
    type: 'menu:updated',
    action: 'reset',
    menu: db.menu,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, menu: db.menu, lastUpdated: db.lastUpdated });
});

// 6b. Sync client menu and settings (Anti-data-loss reconciler)
app.post('/api/menu/sync', (req: Request, res: Response) => {
  const { menu, settings, clientUpdated } = req.body;
  let changed = false;

  if (Array.isArray(menu)) {
    // Only accept sync if client provided valid menu
    if (menu.length > 0 || (clientUpdated && clientUpdated > db.lastUpdated)) {
      db.menu = menu;
      changed = true;
    }
  }
  if (settings && typeof settings === 'object') {
    db.settings = { ...db.settings, ...settings };
    changed = true;
  }

  if (changed) {
    db.lastUpdated = clientUpdated || Date.now();
    saveDatabase(db);
    broadcast({
      type: 'menu:updated',
      action: 'sync',
      menu: db.menu,
      settings: db.settings,
      lastUpdated: db.lastUpdated,
    });
  }

  res.json({ success: true, menu: db.menu, settings: db.settings, lastUpdated: db.lastUpdated });
});

// 7. Get shop settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.settings, lastUpdated: db.lastUpdated });
});

// 8. Update shop settings
app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);

  broadcast({
    type: 'settings:updated',
    settings: db.settings,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, data: db.settings, lastUpdated: db.lastUpdated });
});

// 9. Orders API (Daftar Riwayat Pesanan)
app.get('/api/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.orders || [], lastUpdated: db.lastUpdated });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const order: SavedOrder = req.body;
  if (!order || !order.id) {
    res.status(400).json({ success: false, error: 'Data pesanan tidak valid' });
    return;
  }

  db.orders = [order, ...(db.orders || []).filter((o) => o.id !== order.id)];
  saveDatabase(db);

  broadcast({
    type: 'order:new',
    order,
    orders: db.orders,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, data: order, orders: db.orders });
});

app.put('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  db.orders = (db.orders || []).map((o) => (o.id === id ? { ...o, status } : o));
  saveDatabase(db);

  broadcast({
    type: 'order:updated',
    id,
    status,
    orders: db.orders,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, orders: db.orders });
});

app.delete('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.orders = (db.orders || []).filter((o) => o.id !== id);
  saveDatabase(db);

  broadcast({
    type: 'order:deleted',
    id,
    orders: db.orders,
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, orders: db.orders });
});

app.delete('/api/orders', (req: Request, res: Response) => {
  db.orders = [];
  saveDatabase(db);

  broadcast({
    type: 'order:cleared',
    orders: [],
    lastUpdated: db.lastUpdated,
  });

  res.json({ success: true, orders: [] });
});

// 10. Health & Status check endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    menuCount: db.menu.length,
    ordersCount: db.orders.length,
    lastUpdated: db.lastUpdated,
    timestamp: Date.now(),
  });
});

// --- VITE MIDDLEWARE / STATIC ASSETS ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server JAJANAN KAKANG berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
