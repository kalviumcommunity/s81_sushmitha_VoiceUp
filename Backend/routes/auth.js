const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const User = require('../models/UserSchema');
const authenticateToken = require('../db/middleware/authmiddleware');

const authRouter = express.Router();


const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables.");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '10d' });
};


authRouter.post('/signup', async (req, res) => {
  try {
    const { phoneNumber, password, role } = req.body;

    if (!phoneNumber || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ phoneNumber });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ phoneNumber, password: hashedPassword, role });
    await newUser.save();

    const token = generateToken(newUser._id);
    res.status(201).json({
      message: "Signup successful",
      token,
      user: { id: newUser._id, phoneNumber: newUser.phoneNumber, role: newUser.role }
    });

  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ message: "Signup failed", error: e.message });
  }
});


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
      user: { id: user._id, phoneNumber: user.phoneNumber, role: user.role }
    });

  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});


authRouter.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (e) {
    console.error("Fetch users error:", e);
    res.status(500).json({ message: "Failed to fetch users", error: e.message });
  }
});


authRouter.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, password, role } = req.body;
    const updates = {};

    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (role) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });

  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
});


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
