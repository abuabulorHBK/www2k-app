const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ─── POST /orders ──────────────────────────────────────────────
// Buyer — create order after WhatsApp redirect
router.post('/', requireAuth, async (req, res) => {
    const schema = z.object({
        seller_id: z.string().uuid(),
        items: z.array(z.object({
            product_id: z.string().uuid(),
            name: z.string(),
            qty: z.number().int().positive(),
            price: z.number().positive(),
        })).min(1),
        total_amount: z.number().positive(),
        whatsapp_referred: z.boolean().default(true),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const { data, error } = await supabase
        .from('orders')
        .insert({ ...result.data, buyer_id: req.user.id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

// ─── GET /orders/me ────────────────────────────────────────────
// Buyer — own order history
router.get('/me', requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      seller:sellers(id, store_name, tier),
      items
    `)
        .eq('buyer_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ─── GET /orders/incoming ──────────────────────────────────────
// Seller — incoming orders
router.get('/incoming', requireAuth, requireRole('seller'), async (req, res) => {
    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      buyer:users(full_name, phone)
    `)
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ─── PATCH /orders/:id/status ──────────────────────────────────
// Seller — update order status
router.patch('/:id/status', requireAuth, requireRole('seller'), async (req, res) => {
    const schema = z.object({
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const { data, error } = await supabase
        .from('orders')
        .update({ status: result.data.status })
        .eq('id', req.params.id)
        .eq('seller_id', seller.id)
        .select()
        .single();

    if (error) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
});

module.exports = router;
