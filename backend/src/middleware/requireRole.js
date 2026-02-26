const supabase = require('../lib/supabase');

/**
 * requireRole middleware factory
 * Usage: requireRole('seller') or requireRole('admin')
 * Must be used AFTER requireAuth middleware
 */
const requireRole = (role) => async (req, res, next) => {
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

    if (error || !userData) {
        return res.status(403).json({ error: 'Could not verify user role' });
    }

    if (userData.role !== role && userData.role !== 'admin') {
        return res.status(403).json({ error: `Requires ${role} role` });
    }

    req.userRole = userData.role;
    next();
};

module.exports = requireRole;
