import { createClient } from "@supabase/supabase-js";

// Global Supabase Client
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Environment-driven API root
export const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";
export const API_V1 = `${API_ROOT}/v1`;

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

export async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

// Unified fetch wrapper for DRY API calls
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(endpoint, { ...options, headers });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown API error" }));
        throw new Error(error.detail || error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) return {} as T;
    
    return response.json();
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

export async function login(email: string, password: string): Promise<any> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function register(email: string, password: string): Promise<any> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function fetchProducts(): Promise<Product[]> {
    return apiFetch(`${API_V1}/products`);
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
