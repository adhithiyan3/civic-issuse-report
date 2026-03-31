import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema({
    officeName: { type: String, required: true },
    zoneName: { type: String, required: true },
    wardsCovered: [{ type: String }],
    pincodes: [{ type: String }],
    location: {
        lat: Number,
        lng: Number,
        address: String,
    }
}, { timestamps: true });

export default mongoose.model('Office', officeSchema);
