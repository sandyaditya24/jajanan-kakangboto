import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { MenuCategory } from '../types/menu';

interface CategoryFilterProps {
  currentCategory: MenuCategory;
  onSelectCategory: (cat: MenuCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  itemCounts: Record<MenuCategory, number>;
}

const CATEGORIES: { id: MenuCategory; label: string }[] = [
  { id: 'semua', label: 'Semua Menu' },
  { id: 'gurih', label: 'Gurih & Renyah' },
  { id: 'manis', label: 'Manis Lumer' },
  { id: 'minuman', label: 'Minuman Segar' },
  { id: 'paket', label: 'Paket Hemat' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  currentCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  itemCounts,
}) => {
  return (
    <div className="space-y-4">
      {/* Search Bar & Quick Count */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari jajanan favorit (misal: Risol, Cireng, Dimsum)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 px-1"
            >
              Hapus
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Fresh dibuat setiap hari</span>
          <span aria-hidden="true">·</span>
          <span>Siap digoreng & diantar hangat</span>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          const count = itemCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[11px] tabular-nums ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
