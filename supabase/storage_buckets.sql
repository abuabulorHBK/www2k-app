-- ================================================================
-- Supabase Storage Buckets Setup
-- Run these commands in Supabase SQL Editor OR via Supabase CLI
-- ================================================================

-- 1. Product images — PUBLIC (buyers can view product photos directly)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,   -- 5MB max (images already compressed via expo-image-manipulator)
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- 2. Payment screenshots — PRIVATE (admin access only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- Storage RLS Policies
-- ================================================================

-- product-images: anyone can read, sellers can upload to their own folder
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_seller_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "product_images_seller_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- payment-screenshots: sellers can upload, only service role reads (admin via backend)
CREATE POLICY "payment_screenshots_seller_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "payment_screenshots_service_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-screenshots'
    AND auth.role() = 'service_role'
  );
