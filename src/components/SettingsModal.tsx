import React, { useState } from 'react';
import { X, Phone, Store, MapPin, Clock, RotateCcw, Check } from 'lucide-react';
import { ShopSettings } from '../types/menu';
import { cleanPhoneNumber } from '../utils/format';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  onResetMenu: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetMenu,
}) => {
  const [form, setForm] = useState<ShopSettings>(settings);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhoneNumber(form.whatsappNumber);
    const updated = {
      ...form,
      whatsappNumber: cleaned || '6281234567890',
    };
    onSaveSettings(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleTestWhatsApp = () => {
    const num = cleanPhoneNumber(form.whatsappNumber);
    const url = `https://wa.me/${num}?text=Halo%20ini%20tes%20koneksi%20WhatsApp%20Toko%20Jajanan%20Kakang`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Pengaturan Toko</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Atur nomor WhatsApp tujuan dan profil jajanan
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nomor WhatsApp Penjual (Penerima Pesanan) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                  placeholder="Contoh: 6281234567890 atau 081234567890"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Format internasional otomatis (contoh: 6281234567890).
              </p>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="mt-1.5 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
              >
                Uji Buka Chat WhatsApp Ini ↗
              </button>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Usaha / Toko
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="JAJANAN KAKANG"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Slogan / Deskripsi Singkat
              </label>
              <input
                type="text"
                value={form.shopTagline}
                onChange={(e) => setForm({ ...form, shopTagline: e.target.value })}
                placeholder="Pilih jajanan favoritmu dan pesan langsung via WhatsApp!"
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Lapak / Dapur
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={form.shopAddress}
                  onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
                  placeholder="Jl. Merdeka No. 12"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Jam Buka Operasional
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.openHours}
                  onChange={(e) => setForm({ ...form, openHours: e.target.value })}
                  placeholder="Buka Setiap Hari: 10.00 - 21.00 WIB"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Danger Zone: Reset Menu */}
            <div className="pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Kembalikan daftar menu ke menu standar bawaan JAJANAN KAKANG?')) {
                    onResetMenu();
                    onClose();
                  }
                }}
                className="text-xs text-stone-500 hover:text-amber-700 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Menu ke Data Awal Bawaan</span>
              </button>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan Pengaturan</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
