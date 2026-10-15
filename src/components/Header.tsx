import React from 'react';
import { ShoppingBag, Settings, Plus, UtensilsCrossed, LogOut, ClipboardList } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { ShopSettings } from '../types/menu';

interface HeaderProps {
  settings: ShopSettings;
  cartCount: number;
  cartTotal: number;
  orderCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSettings: () => void;
  onOpenAddMenu: () => void;
  isBuyerMode: boolean;
  isSellerAuthenticated: boolean;
  onExitSellerMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cartCount,
  cartTotal,
  orderCount,
  onOpenCart,
  onOpenOrders,
  onOpenSettings,
  onOpenAddMenu,
  isBuyerMode,
  isSellerAuthenticated,
  onExitSellerMode,
}) => {
  // If in Buyer Mode, hide ALL admin/seller controls completely!
  const showAdminControls = !isBuyerMode && isSellerAuthenticated;

  return (
    <header className="sticky top-0 z-30 bg-amber-700/95 text-white shadow-md border-b border-amber-800/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/25 border border-amber-400/30 flex items-center justify-center text-amber-100 shadow-inner">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <a
              href={isBuyerMode ? '#buyer' : '#seller'}
              className="text-xl font-black tracking-wide text-white hover:text-amber-100 transition-colors whitespace-nowrap"
            >
              {settings.shopName}
            </a>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-amber-100">
          <a href="#menu-section" className="hover:text-white transition-colors whitespace-nowrap">
            Menu Jajanan
          </a>
          <a href="#info-section" className="hover:text-white transition-colors whitespace-nowrap">
            Jam Buka & Lokasi
          </a>

          {/* Seller mode indicator & switch (Only visible when verified in seller mode) */}
          {showAdminControls && (
            <div className="flex items-center gap-2 pl-2 border-l border-amber-600/60">
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-800 text-amber-200 border border-amber-600 font-bold whitespace-nowrap">
                Mode Penjual (Aktif)
              </span>
              <button
                onClick={onExitSellerMode}
                className="text-xs text-amber-200 hover:text-white flex items-center gap-1 transition"
                title="Beralih ke Tampilan Pembeli (#buyer)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lihat Tampilan Pembeli</span>
              </button>
            </div>
          )}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Daftar Pesanan Button (ONLY visible in Seller Mode - never shown to buyers!) */}
          {showAdminControls && (
            <button
              onClick={onOpenOrders}
              className="p-2 text-amber-200 hover:text-white hover:bg-amber-800/60 rounded-xl transition-colors relative"
              title="Daftar Riwayat Pesanan"
              aria-label="Daftar Riwayat Pesanan"
            >
              <ClipboardList className="w-5 h-5" />
              {orderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-950 text-[10px] w-4 h-4 rounded-full font-black flex items-center justify-center">
                  {orderCount > 9 ? '9+' : orderCount}
                </span>
              )}
            </button>
          )}

          {showAdminControls && (
            <>
              <button
                onClick={onOpenAddMenu}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                title="Tambah Menu Makanan Baru"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Menu</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="p-2 text-amber-200 hover:text-white hover:bg-amber-800/60 rounded-xl transition-colors"
                title="Pengaturan Toko & WhatsApp"
                aria-label="Pengaturan Toko & WhatsApp"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Cart Button (Always accessible for ordering) */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white text-stone-900 hover:bg-amber-50 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
            aria-label="Buka Keranjang Pesanan"
          >
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Pesanan</span>
            {cartCount > 0 && (
              <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full font-black tabular-nums shadow-xs">
                {cartCount}
              </span>
            )}
            {cartTotal > 0 && (
              <span className="hidden md:inline text-xs font-black text-amber-800 tabular-nums border-l border-stone-200 pl-2">
                {formatRupiah(cartTotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
