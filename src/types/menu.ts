export type MenuCategory = 'semua' | 'gurih' | 'manis' | 'minuman' | 'paket';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: MenuCategory;
  description: string;
  badge?: string;
  isAvailable: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  note?: string;
}

export type OrderType = 'antar' | 'ambil' | 'dinein';
export type PaymentMethod = 'cod' | 'qris' | 'transfer';

export interface OrderForm {
  buyerName: string;
  buyerPhone: string;
  orderType: OrderType;
  deliveryAddress: string;
  buyerNote: string;
  paymentMethod: PaymentMethod;
  selectedBank?: 'BRI' | 'BCA' | 'BNI';
}

export interface SavedOrder {
  id: string;
  timestamp: number;
  dateFormatted: string;
  form: OrderForm;
  items: CartItem[];
  total: number;
  status: 'menunggu' | 'diproses' | 'selesai';
}

export interface ShopSettings {
  whatsappNumber: string;
  shopName: string;
  shopTagline: string;
  shopAddress: string;
  openHours: string;
}

export interface BankAccountInfo {
  bank: 'BRI' | 'BCA' | 'BNI';
  number: string;
  name: string;
}
