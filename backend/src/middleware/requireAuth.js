const { createClient } = require('@supabase/supabase-js');

/**
 * requireAuth middleware
 * - Validates Supabase JWT from Authorization: Bearer <token>
 * - Updates users.last_active_at on every authenticated request (ghost store suppression)
 * - Attaches req.user to request
 */
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT using Supabase anon client
    const supabaseAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Update last_active_at (MOD 5 — ghost store suppression)
    const supabaseService = require('../lib/supabase');
    await supabaseService
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id);

    req.user = user;
    next();
};

module.exports = requireAuth;
