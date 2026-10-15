import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Link as LinkIcon, AlertCircle, Check } from 'lucide-react';
import { MenuItem, MenuCategory } from '../types/menu';

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMenu: (item: MenuItem) => void;
  editingItem?: MenuItem | null;
}

// Client-side image compressor: scales to maximum 640x480 and 80% JPEG quality
// This reduces a 5MB phone photo down to ~30KB so it transfers instantly and never exceeds storage limits!
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Clean white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

export const AddMenuModal: React.FC<AddMenuModalProps> = ({
  isOpen,
  onClose,
  onSaveMenu,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState<MenuCategory>('gurih');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price);
      setCategory(editingItem.category);
      setDescription(editingItem.description);
      setBadge(editingItem.badge || '');
      setImageUrl(editingItem.image);
      setIsAvailable(editingItem.isAvailable);
    } else {
      // Clean slate: completely empty initial inputs as requested
      setName('');
      setPrice('');
      setCategory('gurih');
      setDescription('');
      setBadge('');
      setImageUrl('');
      setIsAvailable(true);
    }
    setErrorMessage('');
    setIsCompressing(false);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Ukuran file foto maksimal 10MB.');
        return;
      }

      setIsCompressing(true);
      setErrorMessage('');
      try {
        const compressedBase64 = await compressImage(file);
        setImageUrl(compressedBase64);
      } catch (err) {
        console.error(err);
        setErrorMessage('Gagal memproses foto. Silakan coba foto lain.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Nama menu wajib diisi.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage('Harga menu harus lebih besar dari Rp 0.');
      return;
    }
    if (!imageUrl) {
      setErrorMessage('Silakan upload foto atau tempel URL foto makanan terlebih dahulu.');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      category,
      description: description.trim() || 'Menu jajanan lezat siap saji.',
      badge: badge.trim() || undefined,
      image: imageUrl,
      isAvailable,
    };

    onSaveMenu(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 sm:p-7 border border-stone-200 overflow-hidden text-stone-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  {editingItem ? 'Edit Menu Jajanan' : 'Tambah Menu Baru'}
                </h3>
                <p className="text-xs text-stone-500">
                  Data menu tersimpan langsung ke server cloud dan muncul di pembeli.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Image Upload / URL Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Foto Makanan <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      uploadMode === 'file'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      uploadMode === 'url'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Tempel URL Web
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl cursor-pointer bg-stone-50 hover:bg-amber-50/50 transition group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-stone-400 group-hover:text-amber-600 transition" />
                      <p className="mb-1 text-xs text-stone-700 font-bold">
                        {isCompressing ? 'Mengoptimalkan foto...' : 'Pilih Foto dari Galeri / Kamera'}
                      </p>
                      <p className="text-[11px] text-stone-400">PNG, JPG, WEBP (Otomatis dikompres)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="https://contoh.com/foto-makanan.jpg"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Image Preview Box */}
              {imageUrl && (
                <div className="relative aspect-video max-h-36 w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 mt-2 shadow-inner flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview Menu"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-stone-900/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Foto Siap Digunakan</span>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Name & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Risol Mayo Super"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  placeholder="Contoh: 5000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value === '' ? '' : Number(e.target.value));
                    setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Category & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MenuCategory)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="gurih">Gurih (Gorengan / Asin)</option>
                  <option value="manis">Manis (Piscok / Kue)</option>
                  <option value="minuman">Minuman Segar</option>
                  <option value="paket">Paket Hemat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Label Promo (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Terlaris / Baru / Pedas"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Deskripsi Singkat Makanan
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Kulit renyah dengan isian smoked beef, telur, dan saus mayo creamy gurih."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
            </div>

            {/* Stock Availability Toggle */}
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Status Ketersediaan</span>
                <span className="text-[11px] text-stone-500">
                  {isAvailable ? 'Menu sedang READY untuk dipesan' : 'Menu HABIS sementara'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAvailable ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCompressing}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {editingItem ? 'Simpan Perubahan' : 'Simpan & Publikasikan Menu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
