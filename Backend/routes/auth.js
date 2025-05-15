const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const User = require('../models/UserSchema');
const authenticateToken = require('../db/middleware/authmiddleware');

const authRouter = express.Router();


authRouter.use(express.json());
authRouter.use(express.urlencoded({ extended: true }));

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables.");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '10d' });
};

// Signup
authRouter.post('/signup', async (req, res) => {
  try {
    const { phoneNumber, password, role, fullName, email, location } = req.body;

    if (!phoneNumber || !password || !role || !fullName) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "User with this phone number already exists" });
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      phoneNumber,
      password: hashedPassword,
      role,
      fullName,
      email,
      location
    });

    await newUser.save();

    const token = generateToken(newUser._id);
    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: newUser._id,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        fullName: newUser.fullName,
        email: newUser.email,
        location: newUser.location,
        impactPoints: newUser.impactPoints,
        isVerified: newUser.isVerified
      }
    });

  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ message: "Signup failed", error: e.message });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        impactPoints: user.impactPoints,
        isVerified: user.isVerified
      }
    });

  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

// Get all users
authRouter.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (e) {
    console.error("Fetch users error:", e);
    res.status(500).json({ message: "Failed to fetch users", error: e.message });
  }
});

// Update user
authRouter.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const {
      phoneNumber, password, role, fullName, email,
      location, impactPoints, isVerified
    } = req.body;

    const updates = {};

    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (role) updates.role = role;
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (location) updates.location = location;
    if (impactPoints !== undefined) updates.impactPoints = impactPoints;
    if (isVerified !== undefined) updates.isVerified = isVerified;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });

  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
});

// Delete user
authRouter.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", deletedUser });

  } catch (e) {
    console.error("Delete user error:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
});

module.exports = authRouter;
