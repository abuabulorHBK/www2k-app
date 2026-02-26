-- =============================================================
-- UniMarket V1 — Supabase PostgreSQL Schema
-- Run this entire file in Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. USERS
-- =============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow backend service role to insert/update freely
CREATE POLICY "users_service_all" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 2. CATEGORIES
-- =============================================================
CREATE TABLE categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT UNIQUE NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

-- Seed categories
INSERT INTO categories (name) VALUES
  ('Food & Meals'),
  ('Handmade Goods');

-- =============================================================
-- 3. SELLERS
-- =============================================================
CREATE TABLE sellers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name          TEXT NOT NULL,
  description         TEXT,
  whatsapp_number     TEXT NOT NULL,
  university_id_url   TEXT,
  is_approved         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  store_active        BOOLEAN NOT NULL DEFAULT true,
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','premium')),
  tier_started_at     TIMESTAMPTZ,
  tier_expires_at     TIMESTAMPTZ,
  last_notified_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Public can read approved, active sellers
CREATE POLICY "sellers_public_read" ON sellers
  FOR SELECT USING (is_approved = true AND is_active = true);

-- Seller can read/update their own row
CREATE POLICY "sellers_own_read" ON sellers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sellers_own_update" ON sellers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "sellers_service_all" ON sellers
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 4. PRODUCTS
-- =============================================================
CREATE TABLE products (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id                 UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id               UUID NOT NULL REFERENCES categories(id),
  name                      TEXT NOT NULL,
  description               TEXT,
  price                     NUMERIC(10,2) NOT NULL CHECK (price > 0),
  images                    TEXT[] NOT NULL DEFAULT '{}',
  is_available              BOOLEAN NOT NULL DEFAULT true,
  preparation_time_minutes  INTEGER,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public reads available products from active sellers
-- Ghost store suppression: seller must be active within 7 days OR store_active = true
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM sellers s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = products.seller_id
        AND s.is_approved = true
        AND s.is_active = true
        AND (
          u.last_active_at > NOW() - INTERVAL '7 days'
          OR s.store_active = true
        )
    )
  );

-- Seller manages own products
CREATE POLICY "products_seller_manage" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "products_service_all" ON products
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 5. ORDERS
-- =============================================================
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id          UUID NOT NULL REFERENCES users(id),
  seller_id         UUID NOT NULL REFERENCES sellers(id),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  items             JSONB NOT NULL DEFAULT '[]',
  total_amount      NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  whatsapp_referred BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyers see own orders
CREATE POLICY "orders_buyer_own" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);

-- Buyers can create orders
CREATE POLICY "orders_buyer_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers see orders directed to them
CREATE POLICY "orders_seller_read" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid())
  );

-- Sellers can update order status
CREATE POLICY "orders_seller_update" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid())
  );

CREATE POLICY "orders_service_all" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 6. REVIEWS
-- =============================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id    UUID NOT NULL REFERENCES users(id),
  seller_id   UUID NOT NULL REFERENCES sellers(id),
  order_id    UUID NOT NULL REFERENCES orders(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(buyer_id, order_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

-- Buyer inserts review for their own completed order
CREATE POLICY "reviews_buyer_insert" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = reviews.order_id
        AND o.buyer_id = auth.uid()
        AND o.status = 'completed'
    )
  );

CREATE POLICY "reviews_service_all" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 7. NOTIFICATIONS
-- =============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_read" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_service_all" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- 8. SUBSCRIPTION PAYMENTS
-- =============================================================
CREATE TABLE subscription_payments (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id               UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL CHECK (tier IN ('pro','premium')),
  amount                  NUMERIC(10,2) NOT NULL,
  payment_screenshot_url  TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  admin_notes             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at             TIMESTAMPTZ
);

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Sellers read own payment records
CREATE POLICY "subpayments_seller_read" ON subscription_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sellers s WHERE s.id = subscription_payments.seller_id AND s.user_id = auth.uid())
  );

-- Only service role (backend) can insert
CREATE POLICY "subpayments_service_all" ON subscription_payments
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- INDEXES for performance
-- =============================================================
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_sellers_is_approved ON sellers(is_approved);
CREATE INDEX idx_sellers_tier ON sellers(tier);
CREATE INDEX idx_sellers_tier_expires_at ON sellers(tier_expires_at);
CREATE INDEX idx_sub_payments_status ON subscription_payments(status);

-- Full-text search index on products
CREATE INDEX idx_products_fts ON products USING GIN (
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
);

-- =============================================================
-- STORAGE BUCKETS — run these separately in Supabase dashboard
-- or via CLI: supabase storage create product-images
-- =============================================================
-- Bucket: product-images (public)
-- Bucket: payment-screenshots (private)
