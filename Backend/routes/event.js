const express = require('express');
const Event = require('../models/EventSchema');
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

// Get all events
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status = 'published',
      upcoming = false,
      search,
      sortBy = 'startTime',
      sortOrder = 'asc'
    } = req.query;

    const query = { visibility: { $in: ['public'] } };
    
    if (type) query.type = type;
    if (status) query.status = status;
    
    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('organizer', 'fullName profile.avatar')
      .populate('campaignId', 'title');

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName profile.avatar email')
      .populate('campaignId', 'title description')
      .populate('attendees.user', 'fullName profile.avatar')
      .populate('waitlist.user', 'fullName profile.avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event'
    });
  }
});

// Create new event
router.post('/', authenticateToken, requireRole(['Organizer', 'Admin']), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.userId
    };

    // Validate dates
    if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const event = new Event(eventData);
    await event.save();

    // Award points for event creation
    await awardPoints(req.user.userId, 400, 'EVENT_CREATED');

    // Add achievement
    const user = await User.findById(req.user.userId);
    user.addAchievement('EVENT_ORGANIZER', 'Organized your first event!');
    await user.save();

    await event.populate('organizer', 'fullName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event'
    });
  }
});

// Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      });
    }

    if (new Date(event.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events'
      });
    }

    const result = event.registerAttendee(req.user.userId);
    await event.save();

    // Award points for registration
    await awardPoints(req.user.userId, 50, 'EVENT_REGISTERED');

    res.json({
      success: true,
      message: result.status === 'waitlisted' 
        ? 'Added to waitlist successfully' 
        : 'Registered for event successfully',
      data: {
        status: result.status,
        availableSpots: event.availableSpots,
        waitlistPosition: result.status === 'waitlisted' ? event.waitlist.length : null
      }
    });

  } catch (error) {
    console.error('Error registering for event:', error);
    if (error.message.includes('already registered') || error.message.includes('already on the waitlist')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error registering for event'
    });
  }
});

// Cancel registration
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const result = event.cancelRegistration(req.user.userId);
    await event.save();

    let message = 'Registration cancelled successfully';
    if (result.promoted) {
      message += '. Next person on waitlist has been promoted.';
      // TODO: Send notification to promoted user
    }

    res.json({
      success: true,
      message,
      data: {
        availableSpots: event.availableSpots,
        promoted: result.promoted
      }
    });

  } catch (error) {
    console.error('Error cancelling registration:', error);
    if (error.message.includes('not registered')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error cancelling registration'
    });
  }
});

// Check-in attendee
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions (organizer or admin)
    if (event.organizer.toString() !== req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to check-in attendees'
        });
      }
    }

    const attendee = event.attendees.find(
      att => att.user.toString() === userId
    );

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'User is not registered for this event'
      });
    }

    if (attendee.checkedInAt) {
      return res.status(409).json({
        success: false,
        message: 'User is already checked in'
      });
    }

    attendee.status = 'attended';
    attendee.checkedInAt = new Date();
    await event.save();

    // Award points for attendance
    await awardPoints(userId, 75, 'EVENT_ATTENDED');

    res.json({
      success: true,
      message: 'Attendee checked in successfully'
    });

  } catch (error) {
    console.error('Error checking in attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in attendee'
    });
  }
});

// Submit event feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const attendee = event.attendees.find(
      att => att.user.toString() === req.user.userId
    );

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'You did not attend this event'
      });
    }

    if (attendee.status !== 'attended') {
      return res.status(400).json({
        success: false,
        message: 'You must attend the event to provide feedback'
      });
    }

    attendee.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await event.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    if (event.organizer.toString() !== req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this event'
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('organizer', 'fullName profile.avatar');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event'
    });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    if (event.organizer.toString() !== req.user.userId) {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this event'
        });
      }
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event'
    });
  }
});

module.exports = router;