import React, { useState } from 'react';
import { Plus, Minus, Trash2, Edit3, ImageOff } from 'lucide-react';
import { MenuItem } from '../types/menu';
import { formatRupiah } from '../utils/format';

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  isOwnerMode?: boolean;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (id: string) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  quantity,
  onUpdateQuantity,
  isOwnerMode = false,
  onEdit,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-0.5">
      {/* Media & Tag */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {!imageError ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
            <ImageOff className="w-8 h-8 mb-1.5 text-stone-300" />
            <span className="text-xs font-semibold text-stone-500">{item.name}</span>
          </div>
        )}

        {/* Promo / Quality Badge */}
        {item.badge && (
          <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide">
            {item.badge}
          </div>
        )}

        {/* Price Tag Overlay on Card Media */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-stone-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-md border border-stone-100 tabular-nums">
          {formatRupiah(item.price)}
        </div>

        {/* Admin Controls (Only when owner authenticated) */}
        {isOwnerMode && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-stone-200">
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 text-stone-600 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Edit menu"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-stone-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Hapus menu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            <span className="text-amber-800">{item.category}</span>
            <span aria-hidden="true">·</span>
            <span className={item.isAvailable ? 'text-emerald-700' : 'text-stone-400'}>
              {item.isAvailable ? 'Ready' : 'Habis'}
            </span>
          </div>

          <h3 className="font-extrabold text-stone-900 text-base sm:text-lg leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
            {item.name}
          </h3>

          <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing & Stepper Footer */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Harga</span>
            <span className="font-black text-amber-700 text-base sm:text-lg tabular-nums">
              {formatRupiah(item.price)}
            </span>
          </div>

          <div>
            {quantity === 0 ? (
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                disabled={!item.isAvailable}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-2xl transition-all shadow-sm ${
                  item.isAvailable
                    ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Pesan</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-2xl p-1 shadow-inner">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-white rounded-xl transition font-bold"
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm text-amber-950 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-white rounded-xl transition font-bold"
                  aria-label="Tambah jumlah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
