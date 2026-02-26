const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ─── POST /sellers/register ────────────────────────────────────
// Buyer submits seller application with university ID
router.post('/register', requireAuth, async (req, res) => {
    const schema = z.object({
        store_name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        whatsapp_number: z.string().regex(/^\d{10}$/, 'Must be 10-digit mobile number'),
        university_id_url: z.string().url(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    // Check if already registered
    const { data: existing } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (existing) return res.status(409).json({ error: 'Seller profile already exists' });

    const { data, error } = await supabase
        .from('sellers')
        .insert({ ...result.data, user_id: req.user.id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    // Update user role to seller
    await supabase.from('users').update({ role: 'seller' }).eq('id', req.user.id);

    res.status(201).json({ message: 'Application submitted. Pending admin approval.', seller: data });
});

// ─── GET /sellers/me ──────────────────────────────────────────
// Seller — own profile with tier info and product usage count
router.get('/me', requireAuth, requireRole('seller'), async (req, res) => {
    const { data: seller, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

    if (error || !seller) return res.status(404).json({ error: 'Seller profile not found' });

    const TIER_LIMITS = { free: 3, pro: 10, premium: 30 };

    const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', seller.id);

    res.json({
        ...seller,
        products_used: productCount || 0,
        products_limit: TIER_LIMITS[seller.tier] || 3,
    });
});

// ─── GET /sellers/:id ─────────────────────────────────────────
// Public — seller profile + all their products + tier badge
router.get('/:id', async (req, res) => {
    const { data: seller, error } = await supabase
        .from('sellers')
        .select('id, store_name, description, tier, is_approved, is_active, created_at')
        .eq('id', req.params.id)
        .eq('is_approved', true)
        .single();

    if (error || !seller) return res.status(404).json({ error: 'Seller not found' });

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller.id)
        .eq('is_available', true);

    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', seller.id);

    const avgRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    res.json({ ...seller, products: products || [], avg_rating: avgRating, review_count: reviews?.length || 0 });
});

module.exports = router;
