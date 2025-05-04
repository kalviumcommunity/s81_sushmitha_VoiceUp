const express = require('express');
const mongoose = require('mongoose');
const Advocacy = require('../models/Advocacy');

const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// Get all advocacies
router.get('/advocacies', async (req, res) => {
  try {
    const advocacies = await Advocacy.find().populate('createdBy', 'username');
    res.json(advocacies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
