const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ─── POST /subscriptions/request ──────────────────────────────
// Seller — upload payment screenshot, create pending subscription_payment
router.post('/request', requireAuth, requireRole('seller'), async (req, res) => {
    const schema = z.object({
        tier: z.enum(['pro', 'premium']),
        payment_screenshot_url: z.string().url(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const TIER_AMOUNTS = { pro: 999, premium: 2500 };

    const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
            seller_id: seller.id,
            tier: result.data.tier,
            amount: TIER_AMOUNTS[result.data.tier],
            payment_screenshot_url: result.data.payment_screenshot_url,
            status: 'pending',
        })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Payment submitted. Admin will verify within 24 hours.', payment: data });
});

module.exports = router;
