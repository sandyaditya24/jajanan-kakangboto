import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, Sparkles, Utensils, MessageCircle } from 'lucide-react';
import { MenuItem, CartItem } from '../types/menu';
import { formatRupiah } from '../utils/format';

interface HeroFoodShowcaseProps {
  items: MenuItem[];
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  showSellerPanel: boolean;
  onOpenAddMenu: () => void;
  whatsappNumber?: string;
}

export const HeroFoodShowcase: React.FC<HeroFoodShowcaseProps> = ({
  items,
  cart,
  onUpdateQuantity,
  showSellerPanel,
  onOpenAddMenu,
  whatsappNumber,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 3.5 seconds
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  if (items.length === 0) {
    return (
      <div className="bg-amber-900/40 border border-amber-400/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-amber-200 stroke-1 animate-pulse" />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{showSellerPanel ? 'Mode Penjual Aktif' : 'Selamat Datang di JAJANAN KAKANG'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {showSellerPanel ? 'Daftar Menu Siap Ditambahkan' : 'Menu Lezat Sedang Disiapkan'}
            </h2>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-xl">
              {showSellerPanel
                ? 'Panel pengelola siap digunakan! Klik tombol di bawah untuk mengunggah foto makanan, nama, dan harga menu pertama Anda. Data akan tersimpan permanen di cloud server dan langsung tersinkronisasi ke pembeli.'
                : 'Dapur sedang mempersiapkan pilihan jajanan favorit. Silakan hubungi penjual langsung via WhatsApp untuk pertanyaan atau pesanan khusus.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {showSellerPanel ? (
                <button
                  onClick={onOpenAddMenu}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-2" />
                  <span>Tambah Menu Pertama Sekarang</span>
                </button>
              ) : (
                whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Halo JAJANAN KAKANG, saya ingin tanya menu jajanan yang ready hari ini?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WhatsApp Penjual</span>
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure current index is valid
  const currentItem = items[currentIndex % items.length] || items[0];
  const inCart = cart.find((c) => c.item.id === currentItem.id);
  const qty = inCart ? inCart.quantity : 0;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Container Card with Warm Backdrop */}
      <div className="bg-amber-900/40 border border-amber-400/30 rounded-3xl p-4 sm:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* Food Image with Smooth Transition */}
          <div className="sm:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-amber-500/30 bg-stone-900">
            <img
              key={currentItem.id}
              src={currentItem.image}
              alt={currentItem.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            />

            {/* Quality / Promo Badge */}
            {currentItem.badge ? (
              <div className="absolute top-2.5 left-2.5 bg-stone-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                {currentItem.badge}
              </div>
            ) : (
              <div className="absolute top-2.5 left-2.5 bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>Rekomendasi</span>
              </div>
            )}

            {/* Price Tag Overlay */}
            <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md text-stone-950 text-xs font-black px-3 py-1 rounded-full shadow-md tabular-nums">
              {formatRupiah(currentItem.price)}
            </div>
          </div>

          {/* Details & Ordering Action */}
          <div className="sm:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Menu Unggulan ({currentIndex + 1} / {items.length})
              </span>
              <span className="text-xs text-amber-200 font-medium capitalize">
                Kategori: {currentItem.category}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight line-clamp-2">
              {currentItem.name}
            </h2>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed line-clamp-2">
              {currentItem.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Stepper / Add button */}
              {qty === 0 ? (
                <button
                  onClick={() => onUpdateQuantity(currentItem.id, 1)}
                  disabled={!currentItem.isAvailable}
                  className={`px-4 py-2.5 text-xs font-black rounded-xl transition shadow-md flex items-center gap-2 active:scale-95 ${
                    currentItem.isAvailable
                      ? 'bg-white text-stone-900 hover:bg-amber-50'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Tambah ke Pesanan</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-amber-300 rounded-xl p-1 shadow-md">
                  <button
                    onClick={() => onUpdateQuantity(currentItem.id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-800 hover:bg-amber-100 rounded-lg transition font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-sm text-stone-900 tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(currentItem.id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-800 hover:bg-amber-100 rounded-lg transition font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <a
                href="#menu-section"
                className="px-4 py-2.5 text-xs font-bold text-amber-100 hover:text-white bg-amber-800/80 hover:bg-amber-800 rounded-xl transition border border-amber-600/40"
              >
                Lihat Semua ({items.length})
              </a>

              {showSellerPanel && (
                <button
                  onClick={onOpenAddMenu}
                  className="px-3.5 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Menu</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Indicators */}
        <div className="mt-4 pt-3 border-t border-amber-600/30 flex items-center justify-between">
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs scrollbar-none py-1">
            {items.map((it, idx) => (
              <button
                key={it.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-amber-300'
                    : 'w-2 bg-amber-400/40 hover:bg-amber-400/70'
                }`}
                title={it.name}
                aria-label={`Lihat ${it.name}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-amber-800/80 hover:bg-amber-800 text-amber-200 hover:text-white transition border border-amber-600/40"
              aria-label="Menu Sebelumnya"
              title="Menu Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-amber-800/80 hover:bg-amber-800 text-amber-200 hover:text-white transition border border-amber-600/40"
              aria-label="Menu Selanjutnya"
              title="Menu Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
