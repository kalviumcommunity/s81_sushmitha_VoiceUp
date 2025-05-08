const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10,15}$/ // Updated regex for better validation
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        enum: ['admin', 'organizer', 'advocate', 'user'],
        default: 'user',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true // allows for optional unique field
    },
    location: String,
    issues: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Advocacy'
        }
    ],
    joinedAt: {
        type: Date,
        default: Date.now
    },
    impactPoints: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User ', UserSchema);
