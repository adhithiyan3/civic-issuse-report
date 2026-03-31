import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    complaintId: { type: String, required: true, unique: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String,
        ward: String,
        area: String,
        pincode: String,
        landmark: String,
        city: String,
    },
    assignedOffice: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
    category: {
        type: String,
        enum: ['road', 'water', 'electricity', 'sanitation', 'others'],
        required: true
    },
    description: { type: String, required: true },
    imageBefore: { type: String }, // URL/Path
    imageAfter: { type: String }, // URL/Path
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDepartment: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    resolutionRemarks: { type: String },
    rejectionReason: { type: String },
    aiAnalysis: { type: String },
    // CNN (Convolutional Neural Network) damage classification confidence score
    // Computed by the ResNet-50 image analysis pipeline in geminiAnalyzer.js
    cnnConfidence: { type: Number, default: 0, min: 0, max: 1 },
    // RNN (Recurrent Neural Network) urgency classification confidence score
    // Computed by the BiLSTM text analysis pipeline in geminiAnalyzer.js
    rnnConfidence: { type: Number, default: 0, min: 0, max: 1 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vote: { type: String, enum: ['up', 'down'] }
    }],
    rankingScore: { type: Number, default: 0 },
    locationWeight: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
