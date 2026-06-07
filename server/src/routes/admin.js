import express from 'express';
import User from '../models/User.js';
import Office from '../models/Office.js';
import Complaint from '../models/Complaint.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all employees
// @route   GET /api/admin/employees
router.get('/employees', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('-password').populate('officeId');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all offices
// @route   GET /api/admin/offices
router.get('/offices', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const offices = await Office.find();
        res.json(offices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create Office
// @route   POST /api/admin/offices
router.post('/offices', protect, authorize('superadmin'), async (req, res) => {
    try {
        const office = await Office.create(req.body);
        res.status(201).json(office);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// @desc    Update Office
// @route   PATCH /api/admin/offices/:id
router.patch('/offices/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const office = await Office.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!office) return res.status(404).json({ message: 'Office not found' });
        res.json(office);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete Office
// @route   DELETE /api/admin/offices/:id
router.delete('/offices/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const office = await Office.findByIdAndDelete(req.params.id);
        if (!office) return res.status(404).json({ message: 'Office not found' });
        res.json({ message: 'Office deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users (for super admin panel)
// @route   GET /api/admin/users
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('officeId');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create admin or employee user (super admin only)
// @route   POST /api/admin/users
router.post('/users', protect, authorize('superadmin'), async (req, res) => {
    const { username, password, mobile, name, role, department, officeId } = req.body;

    if (!username || !password || !mobile || !role) {
        return res.status(400).json({ message: 'Username, password, mobile, and role are required' });
    }

    if (!['admin', 'employee'].includes(role)) {
        return res.status(400).json({ message: 'Can only create admin or employee users' });
    }

    try {
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password,
            mobile,
            name: name || username,
            role,
            department: department || undefined,
            officeId: officeId || undefined,
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            mobile: user.mobile,
            role: user.role,
            department: user.department,
            officeId: user.officeId,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Get aggregated analytics for charts
// @route   GET /api/admin/analytics
// ─────────────────────────────────────────────────────────────────
router.get('/analytics', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        // ── 1. Status Distribution ──────────────────────────────────
        const statusAgg = await Complaint.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const statusDistribution = statusAgg.map(s => ({ name: s._id, value: s.count }));

        // ── 2. Category Distribution ────────────────────────────────
        const categoryAgg = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const categoryDistribution = categoryAgg.map(c => ({
            name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
            value: c.count
        }));

        // ── 3. Priority Distribution ────────────────────────────────
        const priorityAgg = await Complaint.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        const priorityDistribution = priorityAgg.map(p => ({ name: p._id, value: p.count }));

        // ── 4. Monthly Trend (last 6 months) ────────────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyAgg = await Complaint.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrend = monthlyAgg.map(m => ({
            month: monthNames[m._id.month - 1],
            total: m.count,
            resolved: m.resolved
        }));

        // ── 5. Resolution Rate ──────────────────────────────────────
        const total = await Complaint.countDocuments();
        const resolved = await Complaint.countDocuments({ status: 'Resolved' });
        const rejected = await Complaint.countDocuments({ status: 'Rejected' });
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // ── 6. Department-wise Stats ────────────────────────────────
        const deptAgg = await Complaint.aggregate([
            { $match: { assignedDepartment: { $ne: null, $exists: true } } },
            {
                $group: {
                    _id: '$assignedDepartment',
                    total: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    }
                }
            },
            { $sort: { total: -1 } }
        ]);
        const departmentStats = deptAgg.map(d => ({
            name: d._id,
            total: d.total,
            resolved: d.resolved,
            pending: d.pending
        }));

        // ── 7. User Role Distribution (for super admin) ─────────────
        const userRoleAgg = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const userRoleDistribution = userRoleAgg.map(r => ({ name: r._id, value: r.count }));

        // ── 8. Summary KPIs ────────────────────────────────────────
        const pending = await Complaint.countDocuments({ status: 'Pending' });
        const inProgress = await Complaint.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } });

        res.json({
            statusDistribution,
            categoryDistribution,
            priorityDistribution,
            monthlyTrend,
            resolutionRate,
            departmentStats,
            userRoleDistribution,
            kpis: { total, resolved, rejected, pending, inProgress }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
