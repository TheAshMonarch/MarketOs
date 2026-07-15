import type {
  AnalyticsResponse,
  ApiError,
  LoginResponse,
  ParseResponse,
  PassportResponse,
  ProductsResponse,
  RegisterResponse,
  SaleResponse,
} from "@/lib/types/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPassport() {
  return request<PassportResponse>("/api/passport");
}

export function getProducts() {
  return request<ProductsResponse>("/api/products");
}

export function getAnalytics() {
  return request<AnalyticsResponse>("/api/ai");
}

export function parseSaleText(text: string) {
  return request<ParseResponse>("/api/ai/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function createSale(input: {
  productId: string;
  quantity: number;
  paymentMethod?: string;
}) {
  return request<SaleResponse>("/api/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout() {
  const { logoutAction } = await import("@/app/actions/auth");
  await logoutAction();
}
