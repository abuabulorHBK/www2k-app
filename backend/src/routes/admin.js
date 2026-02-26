const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

// ─── GET /admin/sellers/pending ───────────────────────────────
router.get('/sellers/pending', async (req, res) => {
    const { data, error } = await supabase
        .from('sellers')
        .select('*, user:users(full_name, phone, created_at)')
        .eq('is_approved', false)
        .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ─── PATCH /admin/sellers/:id/approve ─────────────────────────
router.patch('/sellers/:id/approve', async (req, res) => {
    const schema = z.object({
        approved: z.boolean(),
        rejection_reason: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const { data, error } = await supabase
        .from('sellers')
        .update({ is_approved: result.data.approved, is_active: result.data.approved })
        .eq('id', req.params.id)
        .select('*, user:users(full_name)')
        .single();

    if (error) return res.status(404).json({ error: 'Seller not found' });

    // TODO: Week 11 — Send push notification to seller
    res.json({ message: `Seller ${result.data.approved ? 'approved' : 'rejected'}`, seller: data });
});

// ─── GET /admin/subscriptions/pending ─────────────────────────
router.get('/subscriptions/pending', async (req, res) => {
    const { data, error } = await supabase
        .from('subscription_payments')
        .select(`
      *,
      seller:sellers(id, store_name, tier, user:users(full_name, phone))
    `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ─── PATCH /admin/subscriptions/:id/verify ───────────────────
// Admin verifies UPI payment, activates seller tier
router.patch('/subscriptions/:id/verify', async (req, res) => {
    const schema = z.object({
        approved: z.boolean(),
        admin_notes: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    // Get the payment record
    const { data: payment, error: payErr } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (payErr || !payment) return res.status(404).json({ error: 'Payment record not found' });

    const newStatus = result.data.approved ? 'verified' : 'rejected';

    // Update payment record
    await supabase
        .from('subscription_payments')
        .update({
            status: newStatus,
            admin_notes: result.data.admin_notes,
            verified_at: new Date().toISOString(),
        })
        .eq('id', req.params.id);

    if (result.data.approved) {
        // Activate seller tier for 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabase
            .from('sellers')
            .update({
                tier: payment.tier,
                tier_started_at: new Date().toISOString(),
                tier_expires_at: expiresAt.toISOString(),
            })
            .eq('id', payment.seller_id);

        // TODO: Week 11 — Send push notification to seller
    }

    res.json({ message: `Subscription ${newStatus}` });
});

// ─── GET /admin/subscriptions/expiring ───────────────────────
// Sellers expiring within 7 days (AMBER) + already expired (RED)
router.get('/subscriptions/expiring', async (req, res) => {
    const now = new Date().toISOString();
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('sellers')
        .select('id, store_name, tier, tier_expires_at, last_notified_at, user:users(full_name, phone)')
        .neq('tier', 'free')
        .lte('tier_expires_at', in7Days)
        .order('tier_expires_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Tag each as RED (expired) or AMBER (expiring soon)
    const tagged = data.map(s => ({
        ...s,
        status: new Date(s.tier_expires_at) < new Date(now) ? 'RED' : 'AMBER',
    }));

    res.json(tagged);
});

// ─── PATCH /admin/sellers/:id/downgrade ──────────────────────
// Admin manually downgrades expired seller to free tier
router.patch('/sellers/:id/downgrade', async (req, res) => {
    // Set tier to free
    await supabase
        .from('sellers')
        .update({
            tier: 'free',
            tier_expires_at: null,
            last_notified_at: new Date().toISOString(),
        })
        .eq('id', req.params.id);

    // Hide products beyond the free limit (3)
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', req.params.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

    const toHide = products?.slice(3).map(p => p.id) || [];

    if (toHide.length > 0) {
        await supabase
            .from('products')
            .update({ is_available: false })
            .in('id', toHide);
    }

    // TODO: Week 11 — Send push notification to seller
    res.json({ message: 'Seller downgraded to free tier', products_hidden: toHide.length });
});

// ─── GET /admin/stats ─────────────────────────────────────────
router.get('/stats', async (req, res) => {
    // Seller counts by tier
    const { data: sellers } = await supabase
        .from('sellers')
        .select('tier, is_approved');

    const tierCounts = { free: 0, pro: 0, premium: 0 };
    let approvedCount = 0;
    sellers?.forEach(s => {
        if (s.is_approved) {
            tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
            approvedCount++;
        }
    });

    // MRR
    const MRR = (tierCounts.pro * 999) + (tierCounts.premium * 2500);

    // Total buyers
    const { count: buyerCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'buyer');

    // Orders this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfMonth.toISOString());

    const GMV = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    res.json({
        sellers: { total: approvedCount, by_tier: tierCounts },
        buyers: buyerCount || 0,
        orders_this_month: orders?.length || 0,
        MRR,
        GMV_this_month: GMV,
    });
});

module.exports = router;
