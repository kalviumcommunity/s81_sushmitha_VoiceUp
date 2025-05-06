const express = require('express');
const mongoose = require('mongoose');

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
// Create a new advocacy
router.post('/advocacies', async (req, res) => {
    const { title, description, createdBy } = req.body;
  
    const newAdvocacy = new Advocacy({
      title,
      description,
      createdBy,
    });
  
    try {
      const savedAdvocacy = await newAdvocacy.save();
      res.status(201).json(savedAdvocacy);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  
  // Update an existing advocacy
  router.put('/advocacies/:id', async (req, res) => {
    const { title, description } = req.body;
    const { id } = req.params;
  
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
  
    try {
      const updatedAdvocacy = await Advocacy.findByIdAndUpdate(
        id,
        { title, description, updatedAt: new Date() },
        { new: true }
      );
  
      if (!updatedAdvocacy) {
        return res.status(404).json({ message: 'Advocacy not found' });
      }
  
      res.json(updatedAdvocacy);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });



module.exports = router;