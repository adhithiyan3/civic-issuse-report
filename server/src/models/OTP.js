import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    mobile: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: { expires: 300 } } // Expires in 5 minutes
}, { timestamps: true });

export default mongoose.model('OTP', otpSchema);
