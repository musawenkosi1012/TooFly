const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url: string;
    stock: number;
    likes_count: number;
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

export async function login(email: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to login");
    }
    const data = await response.json();
    sessionStorage.setItem("token", data.access_token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    return data;
}

export async function register(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to register");
    }
    return response.json();
}

export function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}

export function getAuthToken() {
    if (typeof window !== "undefined") {
        return sessionStorage.getItem("token");
    }
    return null;
}

export async function fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
}

export async function createProduct(product: Omit<Product, "id" | "likes_count">): Promise<Product> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
}

export async function deleteProduct(id: number): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
    });
    if (!response.ok) throw new Error("Failed to delete product");
}

export async function seedProducts(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/seed`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to seed products");
}
