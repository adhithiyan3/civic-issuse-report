import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Office from './src/models/Office.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Office.deleteMany({});

        // Create Offices
        const offices = await Office.insertMany([
            { officeName: 'Central Zone Office', zoneName: 'Chennai North', wardsCovered: ['1', '2', '3'] },
            { officeName: 'South Zone Office', zoneName: 'Chennai South', wardsCovered: ['4', '5', '6'] },
        ]);

        // Create Super Admin (pre-save hook will hash the password)
        await User.create({
            username: 'superadmin',
            name: 'Super Admin',
            mobile: '0000000000',
            password: 'password123',
            role: 'superadmin',
        });

        // Create Admin
        await User.create({
            username: 'admin',
            name: 'Municipal Officer',
            mobile: '9876543210',
            password: 'password123',
            role: 'admin',
            officeId: offices[0]._id,
        });

        // Create Employees (one at a time so pre-save triggers)
        await User.create({ username: 'ravi', name: 'Ravi Kumar', mobile: '1111111111', password: 'password123', role: 'employee', department: 'Roads', officeId: offices[0]._id });
        await User.create({ username: 'siva', name: 'Siva Doss', mobile: '2222222222', password: 'password123', role: 'employee', department: 'Water', officeId: offices[0]._id });
        await User.create({ username: 'mani', name: 'Mani Maran', mobile: '3333333333', password: 'password123', role: 'employee', department: 'Sanitation', officeId: offices[0]._id });

        // Create a test citizen
        await User.create({
            username: 'citizen',
            name: 'Test Citizen',
            mobile: '5555555555',
            password: 'password123',
            role: 'citizen',
        });

        console.log('Seed data created successfully!');
        console.log('Default password for all users: password123');
        console.log('Usernames: superadmin, admin, ravi, siva, mani, citizen');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
