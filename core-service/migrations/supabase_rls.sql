-- SUPABASE RLS CONFIGURATION
-- This SQL script enables Row Level Security and defines production-ready policies.

-- 1. Enable RLS on all sensitive tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS: Public Read-Only Access
-- Anyone (anon and authenticated) can view products
CREATE POLICY "Products are publicly readable" 
ON products FOR SELECT 
TO public 
USING (true);

-- 3. PRODUCTS: Owner/Admin Write Access
-- Only users with 'owner' or 'it_admin' role in app_metadata can modify products
CREATE POLICY "Authorized staff can modify products" 
ON products FOR ALL 
TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'it_admin')
);

-- 4. ORDERS: Authenticated Create
-- Any logged in user can create an order
CREATE POLICY "Users can create their own orders" 
ON orders FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. ORDERS: Personal Read/Write
-- Users can only see or update their own orders based on their email
CREATE POLICY "Users can manage their own orders" 
ON orders FOR ALL 
TO authenticated 
USING (
  user_email = auth.jwt() ->> 'email'
)
WITH CHECK (
  user_email = auth.jwt() ->> 'email'
);

-- 6. ORDERS: Admin Access
-- Admins and Owners can see all orders
CREATE POLICY "Staff can view all orders" 
ON orders FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'it_admin')
);
