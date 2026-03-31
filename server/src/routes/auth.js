import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// @desc    Register a new citizen user
// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, mobile, password, name, role } = req.body;

    if (!username || !mobile || !password) {
        return res.status(400).json({ message: 'Username, mobile, and password are required' });
    }

    // Validate role
    const allowedRoles = ['citizen', 'admin', 'employee', 'superadmin'];
    const userRole = allowedRoles.includes(role) ? role : 'citizen';

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            mobile,
            password,
            name: name || username,
            role: userRole,
        });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            mobile: user.mobile,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(200).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            mobile: user.mobile,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
