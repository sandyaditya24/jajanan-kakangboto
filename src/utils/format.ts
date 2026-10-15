import { CartItem, OrderForm, ShopSettings, BankAccountInfo } from '../types/menu';

export const OFFICIAL_BANKS: BankAccountInfo[] = [
  { bank: 'BRI', number: '007501092423504', name: 'Fauziah Astuti' },
  { bank: 'BCA', number: '2310506781', name: 'Fauziah Astuti' },
  { bank: 'BNI', number: '0553634017', name: 'Fauziah Astuti' },
];

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

export function generateWhatsAppMessage(
  cart: CartItem[],
  form: OrderForm,
  settings: ShopSettings,
  orderId?: string
): string {
  const total = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  let paymentText = '';
  if (form.paymentMethod === 'cod') {
    paymentText = 'COD (Bayar di Tempat)';
  } else if (form.paymentMethod === 'qris') {
    paymentText = 'QRIS';
  } else if (form.paymentMethod === 'transfer') {
    const bank = form.selectedBank || 'BCA';
    const bankDetails = OFFICIAL_BANKS.find((b) => b.bank === bank) || OFFICIAL_BANKS[0];
    paymentText = `Transfer Bank (${bankDetails.bank}: ${bankDetails.number} a.n. ${bankDetails.name})`;
  } else {
    paymentText = 'COD (Bayar di Tempat)';
  }

  const orderTypeLabel = {
    antar: 'Diantar ke Alamat (Delivery)',
    ambil: 'Ambil Sendiri (Takeaway)',
    dinein: 'Makan di Tempat (Dine-in)',
  }[form.orderType];

  let message = `Halo ${settings.shopName}, saya ingin memesan:\n\n`;
  message += `*Nama Pemesan:* ${form.buyerName.trim() || '-'}\n`;
  if (form.buyerPhone && form.buyerPhone.trim()) {
    message += `*No. Kontak:* ${form.buyerPhone.trim()}\n`;
  }
  message += `*Opsi Pengambilan:* ${orderTypeLabel}\n`;
  if (form.orderType === 'antar' && form.deliveryAddress.trim()) {
    message += `*Alamat Pengantaran:* ${form.deliveryAddress.trim()}\n`;
  }
  message += `*Catatan Tambahan:* ${form.buyerNote.trim() ? form.buyerNote.trim() : '-'}\n`;
  message += `*Metode Pembayaran:* ${paymentText}\n`;
  message += `----------------------------------\n`;
  message += `*Rincian Pesanan:*\n`;

  cart.forEach((c) => {
    const subtotal = c.item.price * c.quantity;
    message += `• ${c.item.name} (${c.quantity}x) = ${formatRupiah(subtotal)}\n`;
    if (c.note) {
      message += `  (Catatan: ${c.note})\n`;
    }
  });

  message += `----------------------------------\n`;
  message += `*Total Pembayaran: ${formatRupiah(total)}*\n`;
  message += `----------------------------------\n`;
  if (orderId) {
    message += `No. Referensi: #${orderId}\n`;
  }
  message += `Mohon konfirmasi pesanan saya ya. Terima kasih! 🙏`;

  return message;
}
