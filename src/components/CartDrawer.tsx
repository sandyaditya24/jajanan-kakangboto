import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  QrCode,
  Banknote,
  Bike,
  Store,
  Utensils,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CartItem, OrderForm, ShopSettings } from '../types/menu';
import { formatRupiah, generateWhatsAppMessage, cleanPhoneNumber, OFFICIAL_BANKS } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
  settings: ShopSettings;
  onOrderSuccess: (orderId: string, orderForm: OrderForm, cart: CartItem[]) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  settings,
  onOrderSuccess,
}) => {
  const [form, setForm] = useState<OrderForm>({
    buyerName: '',
    buyerPhone: '',
    orderType: 'antar',
    deliveryAddress: '',
    buyerNote: '',
    paymentMethod: 'cod',
    selectedBank: 'BCA',
  });

  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const dummyOrderId = `JK-${Math.floor(1000 + Math.random() * 9000)}`;

  const previewMessage = generateWhatsAppMessage(cart, form, settings, dummyOrderId);

  const handleCopyBank = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedBank(number);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(previewMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      setCopiedText(false);
    }
  };

  const handleCheckoutWhatsApp = () => {
    if (!form.buyerName.trim()) {
      setErrorMessage('Silakan isi Nama Pemesan terlebih dahulu.');
      return;
    }

    if (form.orderType === 'antar' && !form.deliveryAddress.trim()) {
      setErrorMessage('Silakan lengkapi Alamat Pengantaran untuk pesanan antar.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja Anda masih kosong.');
      return;
    }

    setErrorMessage('');
    const targetPhone = cleanPhoneNumber(settings.whatsappNumber);
    const message = generateWhatsAppMessage(cart, form, settings, dummyOrderId);
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${targetPhone}?text=${encoded}`;

    // Open WhatsApp safely in iframe environments
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onOrderSuccess(dummyOrderId, form, cart);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <span>Keranjang Pesanan</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 tabular-nums">
                  {totalItems} item
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Konfirmasi dan checkout instan ke WhatsApp</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-stone-400 space-y-3">
                <Store className="w-12 h-12 mx-auto text-stone-300 stroke-1" />
                <p className="text-sm font-semibold text-stone-700">Keranjang masih kosong</p>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Pilih jajanan gurih atau manis favoritmu dari menu untuk mulai memesan.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
                >
                  Pilih Menu Sekarang
                </button>
              </div>
            ) : (
              <>
                {/* Item List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Daftar Pesanan
                    </span>
                    <button
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50 shadow-xs">
                    {cart.map((item) => (
                      <div key={item.item.id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.item.image}
                            alt={item.item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-stone-900 truncate">
                              {item.item.name}
                            </h4>
                            <p className="text-xs text-amber-700 font-bold tabular-nums">
                              {formatRupiah(item.item.price * item.quantity)}
                            </p>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-stone-100 rounded-xl p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded-lg transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-white rounded-lg transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Data Pemesan */}
                <div className="space-y-4 pt-2 border-t border-stone-200">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Informasi Pemesan
                  </h3>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Nama Pemesan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.buyerName}
                        onChange={(e) => {
                          setForm({ ...form, buyerName: e.target.value });
                          setErrorMessage('');
                        }}
                        placeholder="Contoh: Sandy Aditya"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Nomor HP / WhatsApp (Opsional)
                      </label>
                      <input
                        type="tel"
                        value={form.buyerPhone}
                        onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium font-mono"
                      />
                    </div>

                    {/* Opsi Pengambilan */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Opsi Pengambilan
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, orderType: 'antar' })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            form.orderType === 'antar'
                              ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <Bike className="w-4 h-4 text-amber-600" />
                          <span>Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, orderType: 'ambil' })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            form.orderType === 'ambil'
                              ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <Store className="w-4 h-4 text-amber-600" />
                          <span>Ambil Sendiri</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, orderType: 'dinein' })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            form.orderType === 'dinein'
                              ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <Utensils className="w-4 h-4 text-amber-600" />
                          <span>Makan di Tempat</span>
                        </button>
                      </div>
                    </div>

                    {/* Alamat Pengantaran jika Delivery */}
                    {form.orderType === 'antar' && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Alamat Pengantaran <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={form.deliveryAddress}
                          onChange={(e) => {
                            setForm({ ...form, deliveryAddress: e.target.value });
                            setErrorMessage('');
                          }}
                          placeholder="Jalan, nomor rumah, RT/RW atau patokan lokasi jelas"
                          className="w-full px-3.5 py-2 text-sm bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium"
                        />
                      </div>
                    )}

                    {/* METODE PEMBAYARAN */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        Pilih Metode Pembayaran <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* COD */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, paymentMethod: 'cod' })}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                            form.paymentMethod === 'cod'
                              ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <Banknote className="w-4 h-4 text-amber-600" />
                          <span>COD (Bayar di Tempat)</span>
                        </button>

                        {/* QRIS */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, paymentMethod: 'qris' })}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                            form.paymentMethod === 'qris'
                              ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <QrCode className="w-4 h-4 text-amber-600" />
                          <span>QRIS</span>
                        </button>

                        {/* Transfer Bank */}
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, paymentMethod: 'transfer' })}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                            form.paymentMethod === 'transfer'
                              ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-amber-600" />
                          <span>Transfer Bank</span>
                        </button>
                      </div>

                      {/* Detail Transfer Bank Resmi */}
                      {form.paymentMethod === 'transfer' && (
                        <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900">
                              Rekening Resmi JAJANAN KAKANG
                            </span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
                              a.n. Fauziah Astuti
                            </span>
                          </div>

                          <div className="space-y-2">
                            {OFFICIAL_BANKS.map((bank) => {
                              const isCopied = copiedBank === bank.number;
                              const isSelected = form.selectedBank === bank.bank;

                              return (
                                <div
                                  key={bank.bank}
                                  onClick={() => setForm({ ...form, selectedBank: bank.bank })}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                    isSelected
                                      ? 'border-amber-600 bg-white shadow-xs'
                                      : 'border-amber-200/80 bg-white/70 hover:bg-white'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-extrabold text-stone-900">
                                        Bank {bank.bank}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                          Dipilih
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-mono text-xs font-bold text-amber-800 tracking-wide mt-0.5">
                                      {bank.number}
                                    </p>
                                    <p className="text-[10px] text-stone-500">
                                      a.n. {bank.name}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyBank(bank.number);
                                    }}
                                    className="p-1.5 text-stone-500 hover:text-amber-800 bg-stone-100 hover:bg-amber-100 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                                    title="Salin No Rekening"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-[10px] text-emerald-700 font-bold">Tersalin</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">Salin</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-amber-800 leading-tight">
                            *Setelah transfer, mohon kirim bukti transfer ke WhatsApp penjual untuk proses cepat.
                          </p>
                        </div>
                      )}

                      {/* Detail QRIS */}
                      {form.paymentMethod === 'qris' && (
                        <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl border border-amber-200 flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5 text-amber-700" />
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-stone-900 block">
                              Pembayaran QRIS Otomatis
                            </span>
                            <span className="text-stone-600 text-[11px] leading-tight block">
                              Barcode QRIS akan dikirimkan langsung oleh penjual via chat WhatsApp setelah pesanan diterima.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Catatan Tambahan */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={form.buyerNote}
                        onChange={(e) => setForm({ ...form, buyerNote: e.target.value })}
                        placeholder="Contoh: Saus sambal dipisah, cireng agak garing"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Pratinjau Pesan WhatsApp */}
                <div className="pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full py-2 text-xs font-bold text-stone-600 flex items-center justify-between hover:text-stone-900"
                  >
                    <span>Format Pesan WhatsApp (Pratinjau)</span>
                    {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showPreview && (
                    <div className="mt-2 p-3.5 bg-stone-900 text-amber-200 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                      {previewMessage}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Total Pembayaran:</span>
                  <div className="text-2xl font-black text-amber-700 tabular-nums">
                    {formatRupiah(total)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-400 block">WhatsApp Penjual:</span>
                  <span className="text-xs font-mono font-bold text-stone-700">
                    +{cleanPhoneNumber(settings.whatsappNumber)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="col-span-1 py-3 px-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-2xl text-xs flex flex-col items-center justify-center transition shadow-xs"
                  title="Salin teks pesanan ke clipboard"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 mb-0.5" />
                      <span className="text-[10px] text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mb-0.5 text-stone-700" />
                      <span className="text-[10px]">Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="col-span-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesanan ke WhatsApp</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-stone-400">
                Pesan akan langsung terformat rapi dan siap dikirim ke WhatsApp penjual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
