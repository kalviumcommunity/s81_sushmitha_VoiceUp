const express = require('express');
const Petition = require('../models/PetitionSchema');
const User = require('../models/UserSchema');
const authenticateToken = require('../db/middleware/authmiddleware');
const { requireRole } = require('../db/middleware/roleMiddleware');

const router = express.Router();

// Helper function to award points
const awardPoints = async (userId, points, reason) => {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { impactPoints: points } },
      { new: true }
    );
  } catch (error) {
    console.error('Error awarding points:', error);
  }
};

// Get all petitions
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'active',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { visibility: 'public' };
    
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { targetOfficial: { $regex: search, $options: 'i' } }
      ];
    }

    const petitions = await Petition.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'fullName profile.avatar')
      .populate('campaignId', 'title');

    const total = await Petition.countDocuments(query);

    res.json({
      success: true,
      data: {
        petitions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching petitions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching petitions'
    });
  }
});

// Get petition by ID
router.get('/:id', async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('createdBy', 'fullName profile.avatar email')
      .populate('campaignId', 'title description')
      .populate('signatures.user', 'fullName profile.avatar');

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    res.json({
      success: true,
      data: petition
    });

  } catch (error) {
    console.error('Error fetching petition:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching petition'
    });
  }
});

// Create new petition
router.post('/', authenticateToken, requireRole(['Advocate', 'Organizer', 'Admin']), async (req, res) => {
  try {
    const petitionData = {
      ...req.body,
      createdBy: req.user.userId
    };

    // Set default milestones if not provided
    if (!petitionData.milestones || petitionData.milestones.length === 0) {
      const goal = petitionData.signatureGoal;
      petitionData.milestones = [
        { target: Math.floor(goal * 0.25), celebrationMessage: "25% of the way there!" },
        { target: Math.floor(goal * 0.5), celebrationMessage: "Halfway to our goal!" },
        { target: Math.floor(goal * 0.75), celebrationMessage: "75% complete - almost there!" },
        { target: goal, celebrationMessage: "Goal achieved! Thank you for your support!" }
      ];
    }

    const petition = new Petition(petitionData);
    await petition.save();

    // Award points for petition creation
    await awardPoints(req.user.userId, 300, 'PETITION_CREATED');

    await petition.populate('createdBy', 'fullName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Petition created successfully',
      data: petition
    });

  } catch (error) {
    console.error('Error creating petition:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating petition'
    });
  }
});

// Sign petition
router.post('/:id/sign', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, location, comment, isPublic = true } = req.body;
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    if (petition.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Petition is not active'
      });
    }

    // Check if user already signed
    const existingSignature = petition.signatures.find(
      sig => sig.user.toString() === req.user.userId
    );

    if (existingSignature) {
      return res.status(409).json({
        success: false,
        message: 'You have already signed this petition'
      });
    }

    const signatureData = {
      user: req.user.userId,
      fullName,
      email,
      location,
      comment,
      isPublic,
      verified: true, // Since user is authenticated
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    await petition.addSignature(signatureData);

    // Award points for signing
    await awardPoints(req.user.userId, 25, 'PETITION_SIGNED');

    // Check for achievements
    const user = await User.findById(req.user.userId);
    const userSignatures = await Petition.countDocuments({
      'signatures.user': req.user.userId
    });

    if (userSignatures === 1) {
      user.addAchievement('PETITION_SIGNER', 'Signed your first petition!');
      await user.save();
    }

    res.json({
      success: true,
      message: 'Petition signed successfully',
      data: {
        currentSignatures: petition.currentSignatures,
        completionPercentage: petition.completionPercentage
      }
    });

  } catch (error) {
    console.error('Error signing petition:', error);
    if (error.message === 'User has already signed this petition') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error signing petition'
    });
  }
});

// Get petition signatures
router.get('/:id/signatures', async (req, res) => {
  try {
    const { page = 1, limit = 20, publicOnly = true } = req.query;
    
    const petition = await Petition.findById(req.params.id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    let signatures = petition.signatures;
    
    // Filter public signatures only if requested
    if (publicOnly === 'true') {
      signatures = signatures.filter(sig => sig.isPublic);
    }

    // Sort by most recent
    signatures.sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSignatures = signatures.slice(startIndex, endIndex);

    // Populate user data
    await Petition.populate(paginatedSignatures, {
      path: 'user',
      select: 'fullName profile.avatar'
    });

    res.json({
      success: true,
      data: {
        signatures: paginatedSignatures,
        total: signatures.length,
        totalPages: Math.ceil(signatures.length / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching signatures'
    });
  }
});

// Update petition
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Check permissions
    if (petition.createdBy.toString() !== req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this petition'
        });
      }
    }

    const updatedPetition = await Petition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName profile.avatar');

    res.json({
      success: true,
      message: 'Petition updated successfully',
      data: updatedPetition
    });

  } catch (error) {
    console.error('Error updating petition:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating petition'
    });
  }
});

// Delete petition
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Check permissions
    if (petition.createdBy.toString() !== req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this petition'
        });
      }
    }

    await Petition.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Petition deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting petition:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting petition'
    });
  }
});

// Get trending petitions
router.get('/trending', async (req, res) => {
  try {
    const petitions = await Petition.find({
      status: 'active',
      visibility: 'public'
    })
    .sort({ currentSignatures: -1, createdAt: -1 })
    .limit(10)
    .populate('createdBy', 'fullName profile.avatar');

    res.json({
      success: true,
      data: petitions
    });

  } catch (error) {
    console.error('Error fetching trending petitions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending petitions'
    });
  }
});

module.exports = router;