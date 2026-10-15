import React from 'react';
import { Printer, CheckCircle, MessageCircle } from 'lucide-react';
import { CartItem, OrderForm, ShopSettings } from '../types/menu';
import { formatRupiah, cleanPhoneNumber, generateWhatsAppMessage, OFFICIAL_BANKS } from '../utils/format';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderForm: OrderForm | null;
  orderedItems: CartItem[];
  settings: ShopSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderForm,
  orderedItems,
  settings,
}) => {
  if (!isOpen || !orderForm) return null;

  const total = orderedItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleReopenWhatsApp = () => {
    const targetPhone = cleanPhoneNumber(settings.whatsappNumber);
    const msg = generateWhatsAppMessage(orderedItems, orderForm, settings, orderId);
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const paymentLabel = {
    cod: 'COD (Bayar di Tempat)',
    qris: 'QRIS',
    transfer: `Transfer Bank (${orderForm.selectedBank || 'BCA'} a.n. Fauziah Astuti)`,
  }[orderForm.paymentMethod];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
          {/* Header Banner */}
          <div className="bg-emerald-600 p-6 text-white text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-200" />
            <h3 className="text-xl font-extrabold tracking-wide">Pesanan Terkirim!</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Data pesanan sudah dirangkum & siap diproses penjual via WhatsApp.
            </p>
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-5 print:p-0">
            {/* Order Meta */}
            <div className="flex justify-between items-start pb-4 border-b border-dashed border-stone-300 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Nomor Referensi:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">#{orderId}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[11px]">Waktu:</span>
                <span className="text-stone-700 font-medium">{dateStr}</span>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Nama Pemesan:</span>
                <span className="font-bold text-stone-900">{orderForm.buyerName}</span>
              </div>
              {orderForm.buyerPhone && (
                <div className="flex justify-between">
                  <span className="text-stone-500">No. Kontak:</span>
                  <span className="font-medium text-stone-700 font-mono">{orderForm.buyerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Opsi Pengambilan:</span>
                <span className="font-semibold text-amber-800 capitalize">
                  {orderForm.orderType === 'antar'
                    ? 'Diantar ke Alamat'
                    : orderForm.orderType === 'ambil'
                    ? 'Ambil Sendiri'
                    : 'Makan di Tempat'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Metode Pembayaran:</span>
                <span className="font-bold text-emerald-700">{paymentLabel}</span>
              </div>

              {orderForm.orderType === 'antar' && orderForm.deliveryAddress && (
                <div className="pt-2 border-t border-stone-200/60 mt-1">
                  <span className="text-stone-500 block">Alamat Pengiriman:</span>
                  <span className="text-stone-800 font-medium">{orderForm.deliveryAddress}</span>
                </div>
              )}
              {orderForm.buyerNote && (
                <div className="pt-2 border-t border-stone-200/60 mt-1">
                  <span className="text-stone-500 block">Catatan Tambahan:</span>
                  <span className="text-stone-700 italic">"{orderForm.buyerNote}"</span>
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Rincian Pesanan
              </span>
              <div className="divide-y divide-stone-100 border-t border-b border-stone-200 py-1">
                {orderedItems.map((c) => (
                  <div key={c.item.id} className="py-2 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 block">{c.item.name}</span>
                      <span className="text-stone-500 text-[11px] tabular-nums">
                        {c.quantity}x @ {formatRupiah(c.item.price)}
                      </span>
                    </div>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatRupiah(c.item.price * c.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-1 text-sm">
              <span className="font-bold text-stone-800">Total Pembayaran:</span>
              <span className="font-black text-2xl text-amber-700 tabular-nums">
                {formatRupiah(total)}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleReopenWhatsApp}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Buka Percakapan WhatsApp Penjual</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Nota</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl text-xs transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
