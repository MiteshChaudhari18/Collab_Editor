const express = require('express');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const mongoose = require('mongoose');
const optionalAuthMiddleware = require('../utils/optionalAuthMiddleware');

const router = express.Router();

// Use optional auth - allows guest users
router.use(optionalAuthMiddleware);

// Get all rooms (guest users see empty array, authenticated users see their rooms)
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      // Guest user - return empty array
      return res.json([]);
    }
    
    const rooms = await Room.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email');

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single room (public - anyone can view)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get room members
    const members = await RoomMember.find({ room: room._id })
      .populate('user', 'name email')
      .sort({ role: -1, joinedAt: 1 }); // Admin first, then by join date

    res.json({ ...room.toObject(), members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get room members
router.get('/:id/members', async (req, res) => {
  try {
    const members = await RoomMember.find({ room: req.params.id })
      .populate('user', 'name email')
      .sort({ role: -1, joinedAt: 1 });

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create room (guest users can create rooms with a guest owner)
router.post('/', async (req, res) => {
  try {
    const { name, language } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a room name' });
    }

    // For guest users, create a special guest user ID
    const ownerId = req.user ? req.user._id : new mongoose.Types.ObjectId();

    const room = await Room.create({
      name,
      owner: ownerId,
      language: language || 'javascript'
    });

    // Add creator as admin member
    try {
      await RoomMember.create({
        room: room._id,
        user: req.user ? req.user._id : null,
        email: req.user ? req.user.email : 'guest@example.com',
        role: 'admin'
      });
    } catch (error) {
      console.error('Error creating room member:', error);
    }

    // Populate owner if user exists, otherwise set owner name
    if (req.user) {
      await room.populate('owner', 'name email');
    } else {
      room.owner = { _id: ownerId, name: 'Guest User', email: 'guest@example.com' };
    }

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update room (anyone can update for guest mode, authenticated users need to be owner)
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Allow updates for guest users or if user is owner
    if (req.user && room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this room' });
    }

    const { name, language } = req.body;
    if (name) room.name = name;
    if (language) room.language = language;
    room.updatedAt = new Date();

    await room.save();
    
    if (req.user) {
      await room.populate('owner', 'name email');
    } else {
      room.owner = { _id: room.owner, name: 'Guest User', email: 'guest@example.com' };
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete room (anyone can delete for guest mode, authenticated users need to be owner)
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Allow deletion for guest users or if user is owner
    if (req.user && room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

