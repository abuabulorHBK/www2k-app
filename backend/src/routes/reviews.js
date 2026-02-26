const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// ─── POST /reviews ─────────────────────────────────────────────
// Buyer — submit review for a completed order
router.post('/', requireAuth, async (req, res) => {
    const schema = z.object({
        seller_id: z.string().uuid(),
        order_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    // Verify the order belongs to this buyer and is completed
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', result.data.order_id)
        .eq('buyer_id', req.user.id)
        .single();

    if (orderErr || !order) return res.status(403).json({ error: 'Order not found' });
    if (order.status !== 'completed') {
        return res.status(403).json({ error: 'Can only review completed orders' });
    }

    const { data, error } = await supabase
        .from('reviews')
        .insert({ ...result.data, buyer_id: req.user.id })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'You have already reviewed this order' });
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
});

// ─── GET /reviews/:sellerId ────────────────────────────────────
// Public — all reviews for a seller
router.get('/:sellerId', async (req, res) => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
      id, rating, comment, created_at,
      buyer:users(full_name)
    `)
        .eq('seller_id', req.params.sellerId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;
