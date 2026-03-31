import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['citizen', 'admin', 'employee', 'superadmin'],
        default: 'citizen'
    },
    preferredLanguage: { type: String, enum: ['en', 'ta'], default: 'en' },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office' },
    department: { type: String },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
