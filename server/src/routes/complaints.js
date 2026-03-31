import express from 'express';
import multer from 'multer';
import path from 'path';
import Complaint from '../models/Complaint.js';
import { protect, authorize } from '../middleware/auth.js';
import crypto from 'crypto';
import { analyzeComplaint } from '../services/geminiAnalyzer.js';
import { routeToOffice, computeLocationWeight } from '../services/officeRouter.js';

const router = express.Router();

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/complaints');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// @desc    Create new complaint with CNN+RNN+Gemini AI-powered priority analysis
// @route   POST /api/complaints
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { category, description, location } = req.body;
        const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

        const complaintId = `CIVIC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Get image path for CNN analysis pipeline
        const imagePath = req.file ? `uploads/complaints/${req.file.filename}` : null;

        // ── Neural Network Analysis Pipeline ──
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`[Pipeline] Initiating CNN+RNN deep learning analysis for complaint: ${complaintId}`);
        console.log(`[Pipeline] Category: ${category} | Description length: ${description.length} chars`);
        console.log(`[Pipeline] Image attached: ${imagePath ? 'YES → CNN visual pipeline active' : 'NO → RNN text-only mode'}`);
        console.log('───────────────────────────────────────────────────────────────');

        // Use CNN+RNN+Gemini hybrid pipeline to analyze the complaint and determine priority
        const aiResult = await analyzeComplaint(description, category, imagePath);

        console.log('───────────────────────────────────────────────────────────────');
        console.log(`[Pipeline] ✓ Priority: ${aiResult.priority} | CNN conf: ${aiResult.cnnConfidence} | RNN conf: ${aiResult.rnnConfidence}`);
        console.log('═══════════════════════════════════════════════════════════════');

        // Auto-route to the appropriate municipal office via Spatial-RNN
        const officeResult = await routeToOffice(
            parsedLocation.pincode || null,
            parsedLocation.lat || null,
            parsedLocation.lng || null
        );
        console.log(`[Spatial-RNN] Office routing complete: ${officeResult.officeName || 'none'} (${officeResult.matchType})`);

        // Compute location weight for ranking score (Spatial-RNN attention weight)
        const locationWeight = computeLocationWeight(officeResult.distance, officeResult.matchType);
        console.log(`[Ranking] Location weight (RNN-derived): ${locationWeight}`);

        const complaint = await Complaint.create({
            complaintId,
            citizenId: req.user._id,
            category,
            description,
            priority: aiResult.priority,
            aiAnalysis: aiResult.reason,
            cnnConfidence: aiResult.cnnConfidence || 0,
            rnnConfidence: aiResult.rnnConfidence || 0,
            location: parsedLocation,
            assignedOffice: officeResult.officeId || undefined,
            imageBefore: req.file ? `/uploads/complaints/${req.file.filename}` : null,
            status: 'Pending',
            locationWeight,
            rankingScore: locationWeight, // Initial score = 0 votes + locationWeight
        });

        // Populate assigned office for the response
        await complaint.populate('assignedOffice');
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Vote on a complaint (upvote or downvote)
// @route   POST /api/complaints/:id/vote
router.post('/:id/vote', protect, async (req, res) => {
    try {
        const { vote } = req.body; // 'up' or 'down'
        if (!['up', 'down'].includes(vote)) {
            return res.status(400).json({ message: 'Vote must be "up" or "down"' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Prevent voting on closed complaints
        if (['Resolved', 'Rejected'].includes(complaint.status)) {
            return res.status(403).json({ message: 'Voting is disabled for resolved or rejected complaints' });
        }

        const userId = req.user._id.toString();
        const existingVoteIdx = complaint.voters.findIndex(
            v => v.userId.toString() === userId
        );

        if (existingVoteIdx !== -1) {
            const existingVote = complaint.voters[existingVoteIdx].vote;
            if (existingVote === vote) {
                // Same vote — remove it (toggle off)
                complaint.voters.splice(existingVoteIdx, 1);
                if (vote === 'up') complaint.upvotes = Math.max(0, complaint.upvotes - 1);
                else complaint.downvotes = Math.max(0, complaint.downvotes - 1);
            } else {
                // Different vote — switch direction
                complaint.voters[existingVoteIdx].vote = vote;
                if (vote === 'up') {
                    complaint.upvotes += 1;
                    complaint.downvotes = Math.max(0, complaint.downvotes - 1);
                } else {
                    complaint.downvotes += 1;
                    complaint.upvotes = Math.max(0, complaint.upvotes - 1);
                }
            }
        } else {
            // New vote
            complaint.voters.push({ userId: req.user._id, vote });
            if (vote === 'up') complaint.upvotes += 1;
            else complaint.downvotes += 1;
        }

        // Recalculate ranking score
        complaint.rankingScore = (complaint.upvotes - complaint.downvotes) + complaint.locationWeight;

        await complaint.save();
        res.json({
            upvotes: complaint.upvotes,
            downvotes: complaint.downvotes,
            rankingScore: complaint.rankingScore,
            userVote: complaint.voters.find(v => v.userId.toString() === userId)?.vote || null,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get complaints ranked by score
// @route   GET /api/complaints/ranked
router.get('/ranked', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('citizenId', 'name mobile')
            .populate('assignedEmployee', 'name mobile')
            .populate('assignedOffice', 'officeName zoneName')
            .sort({ rankingScore: -1, createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's complaints
// @route   GET /api/complaints/my
router.get('/my', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ citizenId: req.user._id })
            .populate('assignedEmployee', 'name mobile department')
            .populate('assignedOffice', 'officeName zoneName')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get assigned tasks (for Employee)
// @route   GET /api/complaints/assigned
router.get('/assigned', protect, authorize('employee'), async (req, res) => {
    try {
        const complaints = await Complaint.find({ assignedEmployee: req.user._id })
            .populate('citizenId', 'name mobile')
            .sort({ updatedAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all complaints (for Admin)
// @route   GET /api/complaints/all
router.get('/all', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('citizenId', 'name mobile')
            .populate('assignedEmployee', 'name mobile')
            .populate('assignedOffice', 'officeName zoneName')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign employee to complaint
// @route   PATCH /api/complaints/:id/assign
router.patch('/:id/assign', protect, authorize('admin'), async (req, res) => {
    try {
        const { employeeId, department } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                assignedEmployee: employeeId,
                assignedDepartment: department,
                status: 'Assigned'
            },
            { new: true }
        );
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update complaint status (for Employee)
// @route   PATCH /api/complaints/:id/status
router.patch('/:id/status', protect, authorize('employee'), upload.single('imageAfter'), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const updateData = { status, resolutionRemarks: remarks };

        if (req.file) {
            updateData.imageAfter = `/uploads/complaints/${req.file.filename}`;
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify/Resolve complaint (for Admin)
// @route   PATCH /api/complaints/:id/verify
router.patch('/:id/verify', protect, authorize('admin'), async (req, res) => {
    try {
        const { action, reason } = req.body; // action: resolve or reject
        const status = action === 'resolve' ? 'Resolved' : 'Rejected';

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason: reason },
            { new: true }
        );
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reopen complaint (for Admin)
// @route   PATCH /api/complaints/:id/reopen
router.patch('/:id/reopen', protect, authorize('admin'), async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: 'Pending', assignedEmployee: null, assignedDepartment: null },
            { new: true }
        );
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

