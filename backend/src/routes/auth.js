const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// POST /auth/register — create user record post-Supabase OTP
router.post('/register', requireAuth, async (req, res) => {
    const schema = z.object({
        full_name: z.string().min(1).max(100),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const { full_name } = result.data;

    // Upsert user — phone comes from the verified Supabase session
    const { data, error } = await supabase
        .from('users')
        .upsert({
            id: req.user.id,
            phone: req.user.phone,
            full_name,
            last_active_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

module.exports = router;
