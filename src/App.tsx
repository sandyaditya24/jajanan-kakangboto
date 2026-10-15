import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  Phone,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Check,
  Plus,
  Lock,
  LogOut,
  RotateCw,
  ClipboardList,
  MessageCircle,
  AlertCircle,
  Wifi
} from 'lucide-react';

import { MenuItem, MenuCategory, CartItem, OrderForm, ShopSettings, SavedOrder } from './types/menu';
import { DEFAULT_MENU, DEFAULT_SETTINGS } from './data/defaultMenu';
import { Header } from './components/Header';
import { MenuCard } from './components/MenuCard';
import { CartDrawer } from './components/CartDrawer';
import { AddMenuModal } from './components/AddMenuModal';
import { PinModal } from './components/PinModal';
import { CategoryFilter } from './components/CategoryFilter';
import { HeroFoodShowcase } from './components/HeroFoodShowcase';
import { SettingsModal } from './components/SettingsModal';
import { OrdersModal } from './components/OrdersModal';
import { ReceiptModal } from './components/ReceiptModal';
import { formatRupiah, cleanPhoneNumber } from './utils/format';
import { menuApi } from './services/menuApi';

const STORAGE_KEYS = {
  MENU: 'jajanan_kakang_menu_v6',
  SETTINGS: 'jajanan_kakang_settings_v6',
  CART: 'jajanan_kakang_cart_v6',
  ORDERS: 'jajanan_kakang_orders_v6',
  SELLER_AUTH: 'jajanan_seller_auth_v6',
};

export default function App() {
  // 1. Load Menu: starts empty by default, reads from localStorage or server
  const [menuList, setMenuList] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca menu dari localStorage:', e);
    }
    return DEFAULT_MENU; // Empty array []
  });

  // 2. Load Settings from localStorage or defaults
  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.whatsappNumber === '6281234567890' || !parsed.shopAddress?.includes('Purwakarta')) {
            return DEFAULT_SETTINGS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca pengaturan dari localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Load Cart from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca keranjang dari localStorage:', e);
    }
    return [];
  });

  // 4. Load Saved Orders from localStorage
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal membaca riwayat pesanan dari localStorage:', e);
    }
    return [];
  });

  // Synchronization status indicators
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Security & Mode Access State
  const [isBuyerMode, setIsBuyerMode] = useState<boolean>(() => {
    return window.location.hash.toLowerCase().includes('buyer');
  });

  const [isSellerAuthenticated, setIsSellerAuthenticated] = useState<boolean>(() => {
    if (window.location.hash.toLowerCase().includes('buyer')) return false;
    return sessionStorage.getItem(STORAGE_KEYS.SELLER_AUTH) === 'true';
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(() => {
    const hasBuyerHash = window.location.hash.toLowerCase().includes('buyer');
    const isAuth = sessionStorage.getItem(STORAGE_KEYS.SELLER_AUTH) === 'true';
    return !hasBuyerHash && !isAuth;
  });

  // Category and Search filter states
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastOrderForm, setLastOrderForm] = useState<OrderForm | null>(null);
  const [lastOrderedItems, setLastOrderedItems] = useState<CartItem[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Monitor URL Hash Changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('buyer')) {
        setIsBuyerMode(true);
        setIsSellerAuthenticated(false);
        setIsPinModalOpen(false);
      } else {
        const isAuth = sessionStorage.getItem(STORAGE_KEYS.SELLER_AUTH) === 'true';
        if (isAuth) {
          setIsBuyerMode(false);
          setIsSellerAuthenticated(true);
          setIsPinModalOpen(false);
        } else {
          setIsBuyerMode(false);
          setIsSellerAuthenticated(false);
          setIsPinModalOpen(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Persist Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Persist Saved Orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(savedOrders));
    } catch {
      // ignore
    }
  }, [savedOrders]);

  // Initial Data Fetch & Anti-Data-Loss Reconciliation
  const fetchLatestServerData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const onlineMenu = await menuApi.getMenu();
      if (Array.isArray(onlineMenu)) {
        if (onlineMenu.length > 0) {
          setMenuList(onlineMenu);
          localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(onlineMenu));
        } else {
          // Check if client has local items from a previous seller session (prevent container reset wipe)
          const localSaved = localStorage.getItem(STORAGE_KEYS.MENU);
          let localItems: MenuItem[] = [];
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                localItems = parsed;
              }
            } catch {
              // ignore
            }
          }

          if (localItems.length > 0) {
            // Anti-reset: Re-seed server from client local cache
            console.log('Restoring menu from local cache to server...');
            setMenuList(localItems);
            menuApi.syncMenu(localItems).catch(() => {});
          } else {
            setMenuList(DEFAULT_MENU);
            localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU));
            menuApi.syncMenu(DEFAULT_MENU, DEFAULT_SETTINGS).catch(() => {});
          }
        }
      }

      // Fetch shop settings
      const onlineSettings = await menuApi.getSettings();
      if (onlineSettings) {
        if (onlineSettings.whatsappNumber === '6281234567890' || !onlineSettings.shopAddress?.includes('Purwakarta')) {
          setSettings(DEFAULT_SETTINGS);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
          menuApi.updateSettings(DEFAULT_SETTINGS).catch(() => {});
        } else {
          setSettings(onlineSettings);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(onlineSettings));
        }
      }

      // Fetch orders (seller view)
      const onlineOrders = await menuApi.getOrders();
      if (Array.isArray(onlineOrders)) {
        setSavedOrders(onlineOrders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(onlineOrders));
      }

      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Gagal memuat data dari server:', err);
      setIsCloudConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchLatestServerData();
  }, [fetchLatestServerData]);

  // Cache-Busting Refresh on Tab Focus / Visibility Change (ensures buyer sees newest menu immediately!)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestServerData();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [fetchLatestServerData]);

  // Periodic polling fallback every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestServerData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchLatestServerData]);

  // Real-time Server-Sent Events (SSE) Stream
  useEffect(() => {
    const unsubscribe = menuApi.subscribeMenuUpdates((event) => {
      if (event.type === 'init' || event.type === 'menu:updated') {
        if (Array.isArray(event.menu)) {
          setMenuList(event.menu);
          localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(event.menu));
        }
        if (event.settings) {
          setSettings(event.settings);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(event.settings));
        }
        if (Array.isArray(event.orders)) {
          setSavedOrders(event.orders);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(event.orders));
        }
        setIsCloudConnected(true);
      } else if (event.type === 'settings:updated') {
        if (event.settings) {
          setSettings(event.settings);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(event.settings));
        }
      } else if (event.type === 'order:new' || event.type === 'order:updated' || event.type === 'order:deleted' || event.type === 'order:cleared') {
        if (Array.isArray(event.orders)) {
          setSavedOrders(event.orders);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(event.orders));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle PIN Success
  const handlePinSuccess = () => {
    sessionStorage.setItem(STORAGE_KEYS.SELLER_AUTH, 'true');
    setIsSellerAuthenticated(true);
    setIsBuyerMode(false);
    setIsPinModalOpen(false);
    showToast('Akses pengelola JAJANAN KAKANG dibuka.');
  };

  // Exit Seller Mode to Buyer Mode
  const handleExitSellerMode = () => {
    sessionStorage.removeItem(STORAGE_KEYS.SELLER_AUTH);
    setIsSellerAuthenticated(false);
    setIsBuyerMode(true);
    setIsPinModalOpen(false);
    window.location.hash = '#buyer';
    showToast('Beralih ke Tampilan Pembeli (#buyer).');
  };

  // Cancel PIN modal to Buyer Mode
  const handleCancelPinToBuyer = () => {
    setIsPinModalOpen(false);
    setIsBuyerMode(true);
    setIsSellerAuthenticated(false);
    window.location.hash = '#buyer';
  };

  // Cart Management
  const handleUpdateQuantity = (menuId: string, delta: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.item.id === menuId);
      const targetItem = menuList.find((m) => m.id === menuId);

      if (!targetItem) return prevCart;

      if (!existing) {
        if (delta > 0) {
          return [...prevCart, { item: targetItem, quantity: 1 }];
        }
        return prevCart;
      }

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prevCart.filter((c) => c.item.id !== menuId);
      }

      return prevCart.map((c) =>
        c.item.id === menuId ? { ...c, quantity: newQty } : c
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Seller Operations: Add/Update Menu
  const handleSaveMenu = async (item: MenuItem) => {
    const isEdit = menuList.some((m) => m.id === item.id);
    const updatedList = isEdit
      ? menuList.map((m) => (m.id === item.id ? item : m))
      : [item, ...menuList];

    setMenuList(updatedList);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedList));
    showToast(isEdit ? `Menu "${item.name}" diperbarui!` : `Menu "${item.name}" berhasil ditambahkan!`);

    try {
      if (isEdit) {
        await menuApi.updateMenu(item);
      } else {
        await menuApi.addMenu(item);
      }
    } catch (e) {
      console.warn('Gagal menyimpan menu ke server:', e);
      showToast('Tersimpan di perangkat lokal, menyinkronkan ke server...');
    }
  };

  // Seller Operations: Delete Menu
  const handleDeleteMenu = async (id: string) => {
    const target = menuList.find((m) => m.id === id);
    if (!target) return;

    const updatedList = menuList.filter((m) => m.id !== id);
    setMenuList(updatedList);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedList));

    // Remove from cart if present
    setCart((prev) => prev.filter((c) => c.item.id !== id));
    showToast(`Menu "${target.name}" telah dihapus.`);

    try {
      await menuApi.deleteMenu(id);
    } catch (e) {
      console.warn('Gagal menghapus menu di server:', e);
    }
  };

  // Seller Operations: Save Settings
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    showToast('Pengaturan lapak & WhatsApp tersimpan!');

    try {
      await menuApi.updateSettings(newSettings);
    } catch (e) {
      console.warn('Gagal menyimpan pengaturan ke server:', e);
    }
  };

  // Seller Operations: Reset Menu
  const handleResetMenu = async () => {
    setMenuList([]);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify([]));
    showToast('Daftar menu berhasil dikosongkan.');

    try {
      await menuApi.resetMenu();
    } catch (e) {
      console.warn('Gagal mengosongkan menu di server:', e);
    }
  };

  // Buyer: Checkout Success Handler
  const handleOrderSuccess = async (orderId: string, form: OrderForm, orderedCart: CartItem[]) => {
    const newOrder: SavedOrder = {
      id: orderId,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      form,
      items: [...orderedCart],
      total: orderedCart.reduce((sum, item) => sum + item.item.price * item.quantity, 0),
      status: 'menunggu',
    };

    setSavedOrders((prev) => [newOrder, ...prev]);
    setLastOrderId(orderId);
    setLastOrderForm(form);
    setLastOrderedItems([...orderedCart]);
    setIsCartOpen(false);
    setReceiptOpen(true);
    setCart([]);

    try {
      await menuApi.addOrder(newOrder);
    } catch (e) {
      console.warn('Gagal menyimpan pesanan ke server:', e);
    }
  };

  // Seller Operations: Order Management
  const handleUpdateOrderStatus = async (orderId: string, status: 'menunggu' | 'diproses' | 'selesai') => {
    setSavedOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast(`Status pesanan #${orderId} diperbarui.`);

    try {
      await menuApi.updateOrderStatus(orderId, status);
    } catch (e) {
      console.warn('Gagal memperbarui status di server:', e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setSavedOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Pesanan #${orderId} dihapus dari riwayat.`);

    try {
      await menuApi.deleteOrder(orderId);
    } catch (e) {
      console.warn('Gagal menghapus pesanan di server:', e);
    }
  };

  const handleClearAllOrders = async () => {
    setSavedOrders([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
    } catch {
      // ignore
    }
    showToast('Seluruh riwayat pesanan telah dibersihkan.');

    try {
      await menuApi.clearOrders();
    } catch (e) {
      console.warn('Gagal membersihkan pesanan di server:', e);
    }
  };

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return menuList.filter((item) => {
      const matchCat =
        selectedCategory === 'semua' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menuList, selectedCategory, searchQuery]);

  // Counts per category
  const itemCounts = useMemo(() => {
    const counts: Record<MenuCategory, number> = {
      semua: menuList.length,
      gurih: 0,
      manis: 0,
      minuman: 0,
      paket: 0,
    };
    menuList.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    });
    return counts;
  }, [menuList]);

  const showSellerPanel = !isBuyerMode && isSellerAuthenticated;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans pb-32 md:pb-24">
      {/* Header */}
      <Header
        settings={settings}
        cartCount={cartItemCount}
        cartTotal={cartTotal}
        orderCount={savedOrders.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddMenu={() => {
          setEditingItem(null);
          setIsAddMenuOpen(true);
        }}
        isBuyerMode={isBuyerMode}
        isSellerAuthenticated={isSellerAuthenticated}
        onExitSellerMode={handleExitSellerMode}
      />

      {/* Hero Banner with Dynamic Food Showcase */}
      <section className="bg-gradient-to-b from-amber-700 via-amber-700 to-amber-800 text-white pt-8 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <span>{settings.shopName}</span>
              <span aria-hidden="true">·</span>
              <span>Digoreng Dadakan</span>
              <span aria-hidden="true">·</span>
              <span>100% Halal</span>
            </div>

            {/* Alternating Dynamic Food Showcase from Uploaded/Live Menu */}
            <HeroFoodShowcase
              items={menuList}
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              showSellerPanel={showSellerPanel}
              onOpenAddMenu={() => {
                setEditingItem(null);
                setIsAddMenuOpen(true);
              }}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>

          <div className="md:col-span-5">
            <div className="bg-amber-900/50 border border-amber-500/40 rounded-3xl p-5 sm:p-6 backdrop-blur-md text-amber-50 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-amber-600/40">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Info Gerobak & Pesanan
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Lapak Buka</span>
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span className="font-medium">{settings.shopAddress}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="font-medium">{settings.openHours}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="font-mono font-bold">+{settings.whatsappNumber} (Pemesanan WhatsApp)</span>
                </div>
              </div>

              {/* Sync Status Badge */}
              <div className="pt-2 text-[11px] text-amber-200/90 border-t border-amber-600/30 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Cloud Database Realtime</span>
                </span>
                <button
                  onClick={fetchLatestServerData}
                  className="text-amber-200 hover:text-white flex items-center gap-1 font-semibold transition"
                  title="Klik untuk menyinkronkan data terbaru"
                >
                  <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sinkron...' : 'Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="menu-section" className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 flex-1 w-full space-y-6">
        {/* Banner for Seller Mode (Only visible when verified) */}
        {showSellerPanel && (
          <div className="bg-amber-100/70 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                  <span>Panel Pengelola Menu Penjual</span>
                  {isSyncing && (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  )}
                </h2>
                <p className="text-xs text-amber-800">
                  Data menu tersimpan permanen di cloud server & tersinkronisasi langsung ke pembeli (#buyer).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddMenuOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu</span>
              </button>
              <button
                onClick={() => setIsOrdersOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-xl transition flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Daftar Pesanan ({savedOrders.length})</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-xl transition"
              >
                Atur WA
              </button>
              <button
                onClick={handleExitSellerMode}
                className="px-3.5 py-2 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 border border-red-200 rounded-xl transition flex items-center gap-1"
                title="Keluar ke mode pembeli"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Kunci Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Category Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <CategoryFilter
            currentCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            itemCounts={itemCounts}
          />
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Daftar Menu Siap Pesan
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
              <span>Menampilkan {filteredMenu.length} pilihan jajanan</span>
              {searchQuery && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Kata kunci: "{searchQuery}"</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Button to View Past Orders (Only visible to verified Seller) */}
          {showSellerPanel && savedOrders.length > 0 && (
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Riwayat Pesanan ({savedOrders.length})</span>
            </button>
          )}
        </div>

        {/* Menu Cards Grid / Empty States */}
        {menuList.length === 0 ? (
          /* State when menu database is completely empty */
          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 stroke-1" />
            </div>

            {showSellerPanel ? (
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="text-lg font-black text-stone-900">
                  Daftar Menu Masih Kosong
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                  Semua menu bawaan telah dibersihkan. Mulai tambahkan menu jajanan pertama Anda dengan mengunggah foto, nama, dan harga. Data akan langsung tersimpan permanen di cloud server!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddMenuOpen(true);
                    }}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition shadow-md inline-flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-2" />
                    <span>Tambah Menu Jajanan Sekarang</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="text-lg font-black text-stone-900">
                  Dapur Sedang Menyiapkan Menu Baru
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                  Penjual sedang memperbarui daftar jajanan hari ini. Silakan kunjungi kembali beberapa saat lagi atau hubungi kami langsung via WhatsApp untuk pertanyaan pesanan.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(settings.whatsappNumber)}?text=${encodeURIComponent('Halo JAJANAN KAKANG, mau tanya menu jajanan yang ready hari ini?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow inline-flex items-center gap-2 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi Penjual via WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : filteredMenu.length === 0 ? (
          /* State when search / category filter has no match */
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-stone-300 stroke-1" />
            <h3 className="text-base font-bold text-stone-800">Tidak ada menu yang sesuai</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tidak ditemukan jajanan dengan kata kunci "{searchQuery}". Silakan coba kata kunci lain.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('semua');
              }}
              className="mt-2 px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
            >
              Lihat Semua Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredMenu.map((item) => {
              const inCart = cart.find((c) => c.item.id === item.id);
              const qty = inCart ? inCart.quantity : 0;

              return (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={qty}
                  onUpdateQuantity={handleUpdateQuantity}
                  isOwnerMode={showSellerPanel}
                  onEdit={(menu) => {
                    setEditingItem(menu);
                    setIsAddMenuOpen(true);
                  }}
                  onDelete={handleDeleteMenu}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Sticky Cart Summary on Mobile/Desktop */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-amber-600/50 backdrop-blur-md transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-amber-200 block">
                    {cartItemCount} Jajanan Terpilih
                  </span>
                  <span className="text-base font-black text-white">
                    {formatRupiah(cartTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white text-stone-900 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs">
                <span>Lanjut Checkout</span>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer id="info-section" className="mt-16 bg-stone-900 text-stone-400 py-10 px-4 sm:px-6 border-t border-stone-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-stone-100 font-black text-sm tracking-wide">
              {settings.shopName}
            </h4>
            <p className="text-stone-400">
              {settings.shopTagline}
            </p>
            <p className="text-[11px] text-stone-500">
              {settings.shopAddress}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 text-stone-400">
            <span className="font-medium">{settings.openHours}</span>
            <span className="font-mono text-amber-400 font-bold">
              +{cleanPhoneNumber(settings.whatsappNumber)}
            </span>
            <div className="pt-2 text-[10px] text-stone-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Cloud Storage Realtime Sync</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      <AddMenuModal
        isOpen={isAddMenuOpen}
        onClose={() => {
          setIsAddMenuOpen(false);
          setEditingItem(null);
        }}
        onSaveMenu={handleSaveMenu}
        editingItem={editingItem}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetMenu={handleResetMenu}
      />

      {/* Orders History Modal (Only for Seller) */}
      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={savedOrders}
        onUpdateStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onClearAllOrders={handleClearAllOrders}
        whatsappNumber={settings.whatsappNumber}
        shopName={settings.shopName}
        isOwnerMode={showSellerPanel}
      />

      {/* Receipt Modal for Buyer */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        orderId={lastOrderId}
        orderForm={lastOrderForm}
        orderedItems={lastOrderedItems}
        settings={settings}
      />

      {/* PIN Security Modal for Seller Access (PIN: 132414) */}
      <PinModal
        isOpen={isPinModalOpen}
        onSuccess={handlePinSuccess}
        onCancelToBuyer={handleCancelPinToBuyer}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-stone-800 transition-all animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
