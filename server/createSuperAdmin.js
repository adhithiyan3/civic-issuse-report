import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const username = 'superadmin';
        const password = 'superpassword123';
        const mobile = '9999999999';
        const name = 'System Super Admin';

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            existingUser.password = password;
            await existingUser.save();
            console.log('Super Admin password updated successfully');
            process.exit(0);
        }

        await User.create({
            username,
            password,
            mobile,
            name,
            role: 'superadmin'
        });

        console.log('Super Admin created successfully');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating Super Admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
