const express = require('express');
const Invite = require('../models/Invite');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const mongoose = require('mongoose');
const optionalAuthMiddleware = require('../utils/optionalAuthMiddleware');
const { sendInviteEmail } = require('../utils/mail');

const router = express.Router();

// Create invite (supports guest mode)
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { roomId, email } = req.body;

    if (!roomId || !email) {
      return res.status(400).json({ message: 'Please provide roomId and email' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is admin (room owner or admin member)
    let isAdmin = false;
    if (req.user) {
      isAdmin = room.owner.toString() === req.user._id.toString();
      if (!isAdmin) {
        const adminMember = await RoomMember.findOne({
          room: roomId,
          email: req.user.email,
          role: 'admin'
        });
        isAdmin = !!adminMember;
      }
    } else {
      // For guest users, allow invites if:
      // 1. Room has no members yet (first user = admin by default)
      // 2. They're an admin member (check by any guest email)
      const memberCount = await RoomMember.countDocuments({ room: roomId });
      
      if (memberCount === 0) {
        // No members yet, room creator is admin
        isAdmin = true;
      } else {
        // Check if any admin member exists (for guest rooms, allow first admin)
        const adminMembers = await RoomMember.find({
          room: roomId,
          role: 'admin'
        });
        // If there are admin members, allow if it's a guest room (owner is guest)
        isAdmin = adminMembers.length > 0 || !room.owner || room.owner.toString().includes('guest');
      }
    }

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only room admin can send invitations' });
    }

    // Use guest user ID if not authenticated
    const invitedBy = req.user ? req.user._id : new mongoose.Types.ObjectId();
    const inviterName = req.user ? req.user.name : 'Guest User';

    // Create invite
    const invite = await Invite.create({
      room: roomId,
      invitedBy: invitedBy,
      invitedEmail: email
    });

    // Send email
    let emailSent = false;
    let emailError = null;
    
    try {
      await sendInviteEmail(email, invite.token, room.name, inviterName);
      emailSent = true;
    } catch (mailError) {
      console.error('Failed to send email:', mailError);
      emailError = mailError.message || 'Email configuration error';
      // Still create invite, but return error info
    }

    // Return invite info with email status
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${invite.token}`;
    
    res.status(201).json({
      message: emailSent ? 'Invitation sent successfully' : 'Invite created but email failed. Use the link below:',
      emailSent,
      emailError: emailError || null,
      invite: {
        token: invite.token,
        inviteLink: inviteLink,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invite by token (public route for validation)
router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('room', 'name owner language')
      .populate('invitedBy', 'name email');

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.used) {
      return res.status(400).json({ message: 'Invite has already been used' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: 'Invite has expired' });
    }

    res.json({
      invite: {
        token: invite.token,
        room: invite.room,
        invitedBy: invite.invitedBy,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept invite (mark as used when user joins) - supports guest mode
router.post('/:token/accept', optionalAuthMiddleware, async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.used) {
      return res.status(400).json({ message: 'Invite has already been used' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: 'Invite has expired' });
    }

    invite.used = true;
    await invite.save();

    const room = await Room.findById(invite.room);
    
    // Add user as room member when they accept invite
    try {
      const userEmail = req.user ? req.user.email : invite.invitedEmail;
      await RoomMember.findOneAndUpdate(
        { room: invite.room, email: userEmail },
        {
          room: invite.room,
          user: req.user ? req.user._id : null,
          email: userEmail,
          role: 'member'
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error adding room member:', error);
    }
    
    // Populate owner if user exists, otherwise set default
    if (req.user) {
      await room.populate('owner', 'name email');
    } else {
      room.owner = { _id: room.owner, name: 'Guest User', email: 'guest@example.com' };
    }

    res.json({
      message: 'Invite accepted',
      room
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

