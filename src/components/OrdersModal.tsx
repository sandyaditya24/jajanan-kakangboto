import React from 'react';
import { X, ClipboardList, Clock, MessageCircle, RotateCcw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SavedOrder } from '../types/menu';
import { formatRupiah, cleanPhoneNumber, generateWhatsAppMessage } from '../utils/format';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SavedOrder[];
  onUpdateStatus?: (orderId: string, status: 'menunggu' | 'diproses' | 'selesai') => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearAllOrders?: () => void;
  whatsappNumber: string;
  shopName: string;
  isOwnerMode: boolean;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onClearAllOrders,
  whatsappNumber,
  shopName,
  isOwnerMode,
}) => {
  if (!isOpen) return null;

  const handleReopenWhatsApp = (order: SavedOrder) => {
    const targetPhone = cleanPhoneNumber(whatsappNumber);
    const msg = generateWhatsAppMessage(order.items, order.form, {
      whatsappNumber,
      shopName,
      shopTagline: '',
      shopAddress: '',
      openHours: '',
    }, order.id);
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const statusConfig = {
    menunggu: { label: 'Menunggu Konfirmasi', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    diproses: { label: 'Sedang Diproses / Digoreng', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    selesai: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-stone-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900">
                  Daftar Riwayat Pesanan
                </h2>
                <p className="text-xs text-stone-500">
                  Tersimpan otomatis di penyimpanan perangkat (localStorage)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {orders.length > 0 && onClearAllOrders && (
                <button
                  onClick={() => {
                    if (confirm('Hapus seluruh riwayat pesanan dari perangkat ini?')) {
                      onClearAllOrders();
                    }
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                  title="Bersihkan Semua Pesanan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <ClipboardList className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
                <p className="text-sm font-semibold text-stone-700">Belum ada riwayat pesanan</p>
                <p className="text-xs text-stone-400">
                  Setiap pesanan yang Anda kirim via WhatsApp akan tersimpan otomatis di sini.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const conf = statusConfig[order.status] || statusConfig.menunggu;

                return (
                  <div
                    key={order.id}
                    className="p-4 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3 shadow-xs hover:border-amber-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 text-sm">
                          #{order.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.color}`}>
                          {conf.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{order.dateFormatted}</span>
                      </div>
                    </div>

                    {/* Customer & Delivery Summary */}
                    <div className="text-xs text-stone-700 grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-stone-200/60">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Pemesan:</span>
                        <span className="font-bold text-stone-900">{order.form.buyerName}</span>
                        {order.form.buyerPhone && (
                          <span className="text-[11px] text-stone-500 block font-mono">{order.form.buyerPhone}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Metode:</span>
                        <span className="font-semibold text-amber-800 capitalize">
                          {order.form.orderType === 'antar' ? '🛵 Delivery' : order.form.orderType === 'ambil' ? '🛍️ Ambil' : '🍽️ Dine-in'}
                        </span>
                        <span className="text-[10px] text-stone-500 block uppercase">
                          {order.form.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="text-xs space-y-1">
                      {order.items.map((it) => (
                        <div key={it.item.id} className="flex justify-between text-stone-600">
                          <span>
                            {it.item.name} <strong className="text-stone-900">({it.quantity}x)</strong>
                          </span>
                          <span className="tabular-nums font-semibold text-stone-900">
                            {formatRupiah(it.item.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Total Tagihan:</span>
                        <span className="text-base font-black text-amber-700 tabular-nums">
                          {formatRupiah(order.total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status selector for seller */}
                        {isOwnerMode && onUpdateStatus && (
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
                            className="text-xs font-semibold px-2 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-none"
                          >
                            <option value="menunggu">Menunggu</option>
                            <option value="diproses">Diproses</option>
                            <option value="selesai">Selesai</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleReopenWhatsApp(order)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus pesanan #${order.id} dari riwayat?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-200/50 rounded-lg transition"
                            title="Hapus Pesanan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
