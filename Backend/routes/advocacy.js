const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/UserSchema');
const authenticateToken = require('../middleware/authwiddleWare');
// GET all advocacy issues
router.get('/all', async (req, res) => {
  try {
    const advocacies = await Advocacy.find().populate('createdBy', 'fullName email');
    res.status(200).json(advocacies);
  } catch (e) {
    console.error('Error fetching advocacies:', e);
    res.status(500).json({ message: "Failed to fetch advocacies", error: e.message });
  }
});

// CREATE new advocacy
router.post('/create', authenticateToken, async (req, res) => {
  const { title, description, dueDate, causeCategory } = req.body;

  if (!title || !description || !dueDate || !causeCategory) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newAdvocacy = new Advocacy({
      title,
      description,
      dueDate,
      causeCategory,
      createdBy: req.user.id
    });

    const savedAdvocacy = await newAdvocacy.save();
    res.status(201).json({ message: "Advocacy created successfully", savedAdvocacy });
  } catch (e) {
    console.error('Error creating advocacy:', e);
    res.status(500).json({ message: "Failed to create advocacy", error: e.message });
  }
});

// UPDATE advocacy
router.put('/update/:id', authenticateToken, async (req, res) => {
  const { title, description, dueDate, causeCategory, status } = req.body;

  try {
    const updated = await Advocacy.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate, causeCategory, status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Advocacy not found" });
    }

    res.status(200).json({ message: "Advocacy updated successfully", updated });
  } catch (e) {
    console.error('Error updating advocacy:', e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
});

// DELETE advocacy
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Advocacy.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Advocacy not found" });
    }

    res.status(200).json({ message: "Advocacy deleted successfully", deleted });
  } catch (e) {
    console.error('Error deleting advocacy:', e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
});

module.exports = router;
