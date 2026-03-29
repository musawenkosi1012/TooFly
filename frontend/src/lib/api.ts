import { createClient } from "@supabase/supabase-js";

// Global Supabase Client (For Storage only)
// Initialized only if environment variables are present to avoid build-time crashes
export const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null as any;

// Environment-driven API root (Trim trailing slash for safety)
export const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const API_V1 = `${API_ROOT}/api/v1`;

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url: string;
    images?: { id: number; url: string }[];
    comments?: { id: number; content: string; timestamp: string }[];
    stock: number;
    likes_count: number;
    is_liked?: boolean;
}

export interface User {
    email: string;
    role: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// Token management (Aligned with existing UI logic)
export function getStoredToken() {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("token");
}

export function setStoredToken(token: string) {
    sessionStorage.setItem("token", token);
}

export function clearStoredToken() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}

// Unified fetch wrapper for local FastAPI backend
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getStoredToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(endpoint, { ...options, headers });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown API error" }));
        // Handle 401 Unauthorized by clearing token
        if (response.status === 401) {
            clearStoredToken();
        }
        throw new Error(error.detail || error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();
}

// Authentication Actions (Restored Local Identity Logic)
export async function login(email: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_V1}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Authentication failed");
    }

    const data: AuthResponse = await response.json();
    setStoredToken(data.access_token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    return data;
}

export async function register(email: string, password: string): Promise<any> {
    return apiFetch(`${API_V1}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function logout() {
    clearStoredToken();
}

// Product Management
export async function fetchProducts(): Promise<Product[]> {
    return apiFetch(`${API_V1}/products`);
}

export async function likeProduct(id: number): Promise<void> {
    return apiFetch(`${API_V1}/products/${id}/like`, { method: "POST" });
}

export async function addComment(id: number, content: string): Promise<void> {
    return apiFetch(`${API_V1}/products/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

export async function createProduct(product: Omit<Product, "id" | "likes_count">): Promise<Product> {
    return apiFetch(`${API_V1}/products`, {
        method: "POST",
        body: JSON.stringify(product),
    });
}

export async function deleteProduct(id: number): Promise<void> {
    return apiFetch(`${API_V1}/products/${id}`, { method: "DELETE" });
}

export async function seedProducts(): Promise<void> {
    return apiFetch(`${API_V1}/seed`, { method: "POST" });
}
