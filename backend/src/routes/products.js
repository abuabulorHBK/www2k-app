const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Tier product limits
const TIER_LIMITS = { free: 3, pro: 10, premium: 30 };

// ─── GET /products ─────────────────────────────────────────────
// Public — list available products ranked by tier (Premium → Pro → Free)
// Supports ?category=<id> and ?search=<query>
router.get('/', async (req, res) => {
    const { category, search } = req.query;

    let query = supabase
        .from('products')
        .select(`
      *,
      seller:sellers!inner(
        id, store_name, tier, whatsapp_number,
        user:users!inner(last_active_at),
        is_approved, is_active, store_active
      ),
      category:categories(id, name)
    `)
        .eq('is_available', true)
        .eq('seller.is_approved', true)
        .eq('seller.is_active', true);

    if (category) query = query.eq('category_id', category);

    if (search) {
        query = query.textSearch('name', search, { type: 'websearch', config: 'english' });
    }

    // Tier-based ordering: premium first, then pro, then free
    query = query
        .order('seller(tier)', { ascending: false })  // premium > pro > free alphabetically reversed handled via CASE below
        .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Sort client-side by tier rank (Supabase doesn't support CASE ORDER BY via JS client)
    const tierRank = { premium: 3, pro: 2, free: 1 };
    const sorted = data.sort((a, b) => {
        const rankA = tierRank[a.seller?.tier] || 0;
        const rankB = tierRank[b.seller?.tier] || 0;
        if (rankB !== rankA) return rankB - rankA;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(sorted);
});

// ─── GET /products/:id ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      seller:sellers(id, store_name, tier, whatsapp_number, description),
      category:categories(id, name)
    `)
        .eq('id', req.params.id)
        .single();

    if (error) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
});

// ─── POST /products ────────────────────────────────────────────
// Seller only — checks tier limit before creating
router.post('/', requireAuth, requireRole('seller'), async (req, res) => {
    const schema = z.object({
        category_id: z.string().uuid(),
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        price: z.number().positive(),
        images: z.array(z.string().url()).max(4).default([]),
        preparation_time_minutes: z.number().int().positive().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    // Get seller profile
    const { data: seller, error: sellerErr } = await supabase
        .from('sellers')
        .select('id, tier')
        .eq('user_id', req.user.id)
        .single();

    if (sellerErr || !seller) return res.status(403).json({ error: 'Seller profile not found' });

    // Count existing products
    const { count, error: countErr } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', seller.id);

    if (countErr) return res.status(500).json({ error: countErr.message });

    const limit = TIER_LIMITS[seller.tier] || 3;
    if (count >= limit) {
        const nextTier = seller.tier === 'free' ? 'Pro' : 'Premium';
        return res.status(403).json({
            error: `Upgrade to ${nextTier} to add more products.`,
            current_count: count,
            limit,
        });
    }

    const { data, error } = await supabase
        .from('products')
        .insert({ ...result.data, seller_id: seller.id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

// ─── PATCH /products/:id ───────────────────────────────────────
// Seller — update product or toggle availability
router.patch('/:id', requireAuth, requireRole('seller'), async (req, res) => {
    const schema = z.object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        price: z.number().positive().optional(),
        images: z.array(z.string().url()).max(4).optional(),
        is_available: z.boolean().optional(),
        preparation_time_minutes: z.number().int().positive().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    // Verify ownership
    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (!seller) return res.status(403).json({ error: 'Seller profile not found' });

    const { data, error } = await supabase
        .from('products')
        .update(result.data)
        .eq('id', req.params.id)
        .eq('seller_id', seller.id)
        .select()
        .single();

    if (error) return res.status(404).json({ error: 'Product not found or not owned by you' });
    res.json(data);
});

// ─── DELETE /products/:id ──────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('seller'), async (req, res) => {
    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (!seller) return res.status(403).json({ error: 'Seller profile not found' });

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id)
        .eq('seller_id', seller.id);

    if (error) return res.status(404).json({ error: 'Product not found or not owned by you' });
    res.json({ message: 'Product deleted successfully' });
});

module.exports = router;
