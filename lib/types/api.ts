export type ApiError = {
  error: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  business: {
    id: string;
    businessName: string;
    market: string;
  } | null;
  createdAt?: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};

export type RegisterResponse = {
  message: string;
  user: Omit<AuthUser, "business"> & { createdAt: string };
};

export type Passport = {
  id: string;
  businessName: string;
  market: string;
  shopNumber: string;
  category: string;
  description: string | null;
  reputation: number;
  ownerName: string;
  phone: string | null;
  qrCodeUrl: string;
};

export type PassportResponse = {
  passport: Passport;
};

export type Product = {
  id: string;
  businessId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  createdAt: string;
};

export type ProductsResponse = {
  products: Product[];
};

export type ParseItem = {
  productId: string | null;
  matchedName: string;
  quantity: number;
};

export type ParseResponse = {
  items: ParseItem[];
};

export type Sale = {
  id: string;
  businessId: string;
  productId: string;
  quantity: number;
  amount: number;
  paymentMethod: string;
  customerName: string | null;
  transactionId: string | null;
  createdAt: string;
};

export type SaleResponse = {
  message: string;
  sale: Sale;
};

export type ChartPoint = {
  date: string;
  revenue: number;
};

export type Analytics = {
  chartData: ChartPoint[];
  totalRevenue: number;
  topProduct: string;
  advisorTip: string;
};

export type AnalyticsResponse = {
  message?: string;
  analytics: Analytics;
};

export type SaleLineItem = {
  key: string;
  productId: string | null;
  name: string;
  quantity: number;
  unit: string;
};
