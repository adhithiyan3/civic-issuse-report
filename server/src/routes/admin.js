import express from 'express';
import User from '../models/User.js';
import Office from '../models/Office.js';
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

export default router;
